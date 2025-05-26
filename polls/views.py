from django.shortcuts import render, redirect, get_object_or_404
from django.contrib.auth import login
from django.contrib.auth.forms import UserCreationForm
from django.contrib.auth.decorators import login_required
from .models import BackgroundImage, Route, RoutePoint, GameBoard, BoardPath
from .forms import RouteForm, RoutePointForm
from rest_framework.authtoken.models import Token
from django.contrib.auth.decorators import login_required
from django.http import JsonResponse, HttpResponseBadRequest
from django.urls import reverse
import json


def register(request):
    if request.method == 'POST':
        form = UserCreationForm(request.POST)
        if form.is_valid():
            user = form.save()
            user.is_staff = False
            user.save()
            login(request, user)
            return redirect('polls:route_list')
    else:
        form = UserCreationForm()
    return render(request, 'registration/register.html', {'form': form})

@login_required
def background_list(request):
    backgrounds = BackgroundImage.objects.all()
    return render(request, 'polls/background_list.html', {'backgrounds': backgrounds})

@login_required
def route_list(request):
    routes = Route.objects.filter(user=request.user)
    return render(request, 'polls/route_list.html', {'routes': routes})

@login_required
def route_create(request):
    if request.method == 'POST':
        form = RouteForm(request.POST)
        if form.is_valid():
            route = form.save(commit=False)
            route.user = request.user
            route.save()
            return redirect('polls:route_list')
    else:
        form = RouteForm()
    return render(request, 'polls/route_create.html', {'form': form})

@login_required
def route_detail(request, pk):
    route = get_object_or_404(Route, pk=pk, user=request.user)
    points = route.points.all()
    point_form = RoutePointForm()
    return render(request, 'polls/route_detail.html', {
        'route': route,
        'points': points,
        'point_form': point_form,
    })
    

@login_required
def point_add(request, route_pk):
    route = get_object_or_404(Route, pk=route_pk, user=request.user)
    if request.method == 'POST':
        form = RoutePointForm(request.POST)
        if form.is_valid():
            point = form.save(commit=False)
            point.route = route
            point.save()
            if request.headers.get('x-requested-with') == 'XMLHttpRequest':
                return JsonResponse({
                    'id':    point.pk,
                    'x':     point.x,
                    'y':     point.y,
                    'order': point.order,
                })
    return redirect('polls:route_detail', pk=route_pk)


@login_required
def point_delete(request, pk):
    point = get_object_or_404(RoutePoint, pk=pk, route__user=request.user)
    route_pk = point.route.pk
    point.delete()
    remaining = RoutePoint.objects.filter(route__pk=route_pk).order_by('order')
    for idx, p in enumerate(remaining, start=1):
        if p.order != idx:
            p.order = idx
            p.save()
    if request.headers.get('x-requested-with') == 'XMLHttpRequest':
        data = [
            {'id': p.pk, 'x': p.x, 'y': p.y, 'order': p.order}
            for p in remaining
        ]
        return JsonResponse({'points': data})
    return redirect('polls:route_detail', pk=route_pk)


@login_required
def manage_token(request):
    token = Token.objects.filter(user=request.user).first()

    if request.method == 'POST':
        action = request.POST.get('action')
        if token:
            token.delete()
            token = None
        if action in ('create', 'regenerate'):
            token = Token.objects.create(user=request.user)
        return redirect('polls:manage_token')

    return render(request, 'polls/manage_token.html', {'token': token})





# lab9

@login_required
def board_list(request):
    boards = GameBoard.objects.filter(owner=request.user)   
    return render(request, "polls/board_list.html", {"boards": boards})

@login_required
def board_create(request):
    if request.method == "POST" and request.headers.get("X-Requested-With") == "XMLHttpRequest":
        data = json.loads(request.body)

        if not data.get("name"):
            return JsonResponse({"ok": False, "field": "name", "msg": "Nazwa jest wymagana"}, status=400)
        if GameBoard.objects.filter(name=data["name"], owner=request.user).exists():
            return JsonResponse({"ok": False, "field": "name", "msg": "Taka nazwa już istnieje"}, status=400)

        board = GameBoard.objects.create(
            owner=request.user,
            name=data["name"],
            rows=data["rows"],
            cols=data["cols"],
            dots=data["dots"],
        )
        return JsonResponse({
            "ok": True,
            "redirect": reverse("polls:board_edit", args=[board.pk])
        })

    return render(request, "polls/board_edit.html", {"board": None})

@login_required
def board_edit(request, pk):
    board = get_object_or_404(GameBoard, pk=pk, owner=request.user)

    if request.method == "POST" and request.headers.get("X-Requested-With") == "XMLHttpRequest":
        data = json.loads(request.body)

        if not data.get("name"):
            return JsonResponse({"ok": False, "field": "name", "msg": "Nazwa jest wymagana"}, status=400)
        if (
            GameBoard.objects
            .filter(name=data["name"], owner=request.user)
            .exclude(pk=pk)
            .exists()
        ):
            return JsonResponse({"ok": False, "field": "name", "msg": "Taka nazwa już istnieje"}, status=400)

        board.name = data["name"]
        board.rows = data["rows"]
        board.cols = data["cols"]
        board.dots = data["dots"]
        board.save()
        return JsonResponse({"ok": True})

    return render(request, "polls/board_edit.html", {"board": board.to_dict()})

@login_required
def board_delete(request, pk):
    board = get_object_or_404(GameBoard, pk=pk, owner=request.user)
    if request.method == "GET":
        board.delete()
        return redirect("polls:board_list")
    return redirect("polls:board_edit", pk=pk)

@login_required
def path_draw(request, pk):
    board = get_object_or_404(GameBoard, pk=pk)
    path  = BoardPath.objects.filter(board=board, user=request.user).first()

    if request.method == "POST" and request.headers.get("X-Requested-With") == "XMLHttpRequest":
        data = json.loads(request.body)
        cells = data.get("cells", [])
        if not path:
            path = BoardPath(board=board, user=request.user, cells=cells)
        else:
            path.cells = cells
        path.save()
        return JsonResponse({"ok": True})

    ctx = {
        "board": board.to_dict(),
        "initial_path": path.cells if path else [],
    }
    return render(request, "polls/path_draw.html", ctx)

@login_required
def board_gallery(request):
    boards = GameBoard.objects.all().order_by("-updated")
    return render(request, "polls/board_gallery.html", {"boards": boards})

