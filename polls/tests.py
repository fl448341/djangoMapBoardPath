from django.test import TestCase
from django.contrib.auth.models import User
from polls.models import BackgroundImage, Route, RoutePoint
from django.core.files.uploadedfile import SimpleUploadedFile
from django.core.exceptions import ValidationError


class ModelsTestCase(TestCase):
    @classmethod
    def setUpTestData(cls):
        fake_img = SimpleUploadedFile(
        name='map.png',
        content=b'\x89PNG\r\n\x1a\n...', # naglowek PNG
        content_type='image/png'
        )
        cls.user = User.objects.create_user(username='testuser', password='pass')
        cls.bg = BackgroundImage.objects.create(name='Mapa', image=fake_img)

    def test_create_route_and_relations(self):
        route = Route.objects.create(user=self.user, background=self.bg, name='MojaTrasa')
        self.assertEqual(route.user, self.user)
        self.assertEqual(route.background, self.bg)
        self.assertEqual(str(route), 'MojaTrasa (testuser)')

    def test_create_route_point_and_ordering(self):
        route = Route.objects.create(user=self.user, background=self.bg, name='Trasa2')
        p1 = RoutePoint.objects.create(route=route, x=200, y=300, order=2)
        p2 = RoutePoint.objects.create(route=route, x=10,  y=140, order=1)
        points = list(route.points.all())
        self.assertEqual(points, [p2, p1])
        self.assertEqual(str(p1), 'Point 2 on Trasa2')

    def test_point_invalid_order(self):
        route = Route.objects.create(user=self.user, background=self.bg, name='T')
        p = RoutePoint(route=route, x=1, y=2, order=-5)
        with self.assertRaises(ValidationError):
            p.full_clean()



from django.urls import reverse

class ViewsTestCase(TestCase):
    def setUp(self):
        self.user1 = User.objects.create_user(username='u1', password='pw1')
        self.user2 = User.objects.create_user(username='u2', password='pw2')
        self.bg = BackgroundImage.objects.create(name='BG', image='backgrounds/bg.png')
        self.route1 = Route.objects.create(user=self.user1, background=self.bg, name='R1')
        RoutePoint.objects.create(route=self.route1, x=1, y=2, order=1)

    def test_login_required(self):
        url = reverse('polls:route_list')
        resp = self.client.get(url)
        self.assertEqual(resp.status_code, 302)
        self.assertIn('/accounts/login/', resp.url)

    def test_route_list_shows_only_own(self):
        self.client.login(username='u1', password='pw1')
        resp = self.client.get(reverse('polls:route_list'))
        self.assertContains(resp, 'R1')
        self.client.logout()
        self.client.login(username='u2', password='pw2')
        resp2 = self.client.get(reverse('polls:route_list'))
        self.assertNotContains(resp2, 'R1')

    def test_create_and_delete_point(self):
        self.client.login(username='u1', password='pw1')
        add_url = reverse('polls:point_add', kwargs={'route_pk': self.route1.pk})
        resp = self.client.post(add_url, {'x': 10, 'y': 20, 'order': 2})
        self.assertEqual(resp.status_code, 302)
        self.assertEqual(self.route1.points.count(), 2)
        pt = self.route1.points.get(order=2)
        del_url = reverse('polls:point_delete', kwargs={'pk': pt.pk})
        resp2 = self.client.post(del_url)
        self.assertEqual(resp2.status_code, 302)
        self.assertEqual(self.route1.points.count(), 1)

    def test_logout(self):
        self.client.login(username='u1', password='pw1')
        resp = self.client.post(reverse('logout'))
        self.assertRedirects(resp, reverse('polls:route_list'), fetch_redirect_response=False)
        resp2 = self.client.get(reverse('polls:route_list'))
        self.assertEqual(resp2.status_code, 302)

    def test_create_route(self):
        self.client.login(username='u1', password='pw1')
        resp = self.client.post(
            reverse('polls:route_create'),
            {'name':'Nowa','background': self.bg.pk}
        )
        self.assertRedirects(resp, reverse('polls:route_list'))
        self.assertTrue(Route.objects.filter(name='Nowa', user=self.user1).exists())
        
    def test_point_displayed_in_detail(self):
        self.client.login(username='u1', password='pw1')
        url = reverse('polls:route_detail', kwargs={'pk': self.route1.pk})
        resp = self.client.get(url)
        self.assertContains(resp, '(1.0, 2.0)')


from django.urls import reverse
from rest_framework import status
from rest_framework.test import APITestCase
from rest_framework.authtoken.models import Token

class ApiTestCase(APITestCase):
    def setUp(self):
        self.user = User.objects.create_user(username='apiuser', password='pw')
        self.token = Token.objects.create(user=self.user)
        self.client.credentials(HTTP_AUTHORIZATION='Token ' + self.token.key)
        self.bg = BackgroundImage.objects.create(name='BG', image='backgrounds/bg.png')

    def test_create_and_list_route(self):
        url = reverse('api-route-list')  # /api/trasy/
        data = {'name': 'APITrasa', 'background': self.bg.pk}
        resp = self.client.post(url, data, format='json')
        self.assertEqual(resp.status_code, status.HTTP_201_CREATED)
        # lista
        resp2 = self.client.get(url, format='json')
        self.assertEqual(resp2.status_code, status.HTTP_200_OK)
        self.assertEqual(len(resp2.data), 1)
        self.assertEqual(resp2.data[0]['name'], 'APITrasa')

    def test_detail_and_delete_route(self):
        route = Route.objects.create(user=self.user, background=self.bg, name='D1')
        url = reverse('api-route-detail', kwargs={'pk': route.pk})
        # GET detail
        resp = self.client.get(url, format='json')
        self.assertEqual(resp.status_code, status.HTTP_200_OK)
        self.assertIn('points', resp.data)
        # DELETE
        resp2 = self.client.delete(url)
        self.assertEqual(resp2.status_code, status.HTTP_204_NO_CONTENT)
        self.assertFalse(Route.objects.filter(pk=route.pk).exists())

    def test_points_crud(self):
        route = Route.objects.create(user=self.user, background=self.bg, name='P1')
        list_url = reverse('api-point-list', kwargs={'route_pk': route.pk})
        # POST punkt
        resp = self.client.post(list_url, {'x':5,'y':6,'order':1}, format='json')
        self.assertEqual(resp.status_code, status.HTTP_201_CREATED)
        # GET lista
        resp2 = self.client.get(list_url, format='json')
        self.assertEqual(resp2.status_code, status.HTTP_200_OK)
        self.assertEqual(len(resp2.data), 1)
        pt_id = resp2.data[0]['id']
        # DELETE punkt
        del_url = reverse('api-point-detail', kwargs={'route_pk': route.pk, 'pk': pt_id})
        resp3 = self.client.delete(del_url)
        self.assertEqual(resp3.status_code, status.HTTP_204_NO_CONTENT)
        self.assertEqual(route.points.count(), 0)

    def test_unauthorized_access(self):
        self.client.credentials() 
        resp = self.client.get(reverse('api-route-list'))
        self.assertEqual(resp.status_code, status.HTTP_401_UNAUTHORIZED)

    def test_cannot_access_others_route(self):
        other = User.objects.create_user('o','p')
        r2 = Route.objects.create(user=other, background=self.bg, name='X')
        url = reverse('api-route-detail', kwargs={'pk': r2.pk})
        resp = self.client.get(url)
        self.assertEqual(resp.status_code, status.HTTP_404_NOT_FOUND)

    def test_route_create_invalid(self):
        url = reverse('api-route-list')
        resp = self.client.post(url, {'background': self.bg.pk}, format='json')
        self.assertEqual(resp.status_code, status.HTTP_400_BAD_REQUEST)
        self.assertIn('name', resp.data)
