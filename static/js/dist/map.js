// src/map.ts
function getCookie(name) {
    const m = document.cookie.match(new RegExp('(?:^|; )' + name + '=([^;]+)'));
    return m ? decodeURIComponent(m[1]) : '';
}
export function initMap() {
    const img = document.getElementById('mapImage');
    const container = document.getElementById('mapContainer');
    const overlayEl = document.getElementById('mapOverlay');
    if (!overlayEl || !(overlayEl instanceof SVGSVGElement)) {
        console.error('mapOverlay nie znaleziony albo nie jest <svg>');
        return;
    }
    const overlay = overlayEl;
    const form = document.getElementById('pointForm');
    const listEl = document.querySelector('.points-list');
    let coords;
    try {
        const raw = JSON.parse(container.dataset.points || '[]');
        coords = raw.map(([x, y], i) => ({ x, y, order: i + 1 }));
    }
    catch (_a) {
        coords = [];
    }
    let nextOrder = coords.length + 1;
    let highlightEl = null;
    let selectedLi = null;
    let selectedId = null; // <a data-id="">
    const clearHighlight = () => { highlightEl === null || highlightEl === void 0 ? void 0 : highlightEl.remove(); highlightEl = null; };
    const highlightPoint = (x, y) => {
        const r = img.getBoundingClientRect();
        const m = document.createElement('div');
        m.className = 'highlight-marker';
        m.style.left = `${(x * r.width) / img.naturalWidth}px`;
        m.style.top = `${(y * r.height) / img.naturalHeight}px`;
        clearHighlight();
        container.appendChild(m);
        highlightEl = m;
    };
    const drawLine = (ps) => {
        if (ps.length < 2)
            return;
        overlay.setAttribute('viewBox', `0 0 ${img.naturalWidth} ${img.naturalHeight}`);
        overlay.setAttribute('preserveAspectRatio', 'xMinYMin meet');
        let poly = overlay.querySelector('polyline');
        if (!poly) {
            poly = document.createElementNS('http://www.w3.org/2000/svg', 'polyline');
            poly.setAttribute('fill', 'none');
            poly.setAttribute('stroke', 'purple');
            poly.setAttribute('stroke-width', '4');
            overlay.appendChild(poly);
        }
        poly.setAttribute('points', ps.map(p => `${p.x},${p.y}`).join(' '));
    };
    const drawMarker = (p) => {
        const r = img.getBoundingClientRect();
        const m = document.createElement('div');
        m.className = 'marker';
        m.style.left = `${(p.x * r.width) / img.naturalWidth}px`;
        m.style.top = `${(p.y * r.height) / img.naturalHeight}px`;
        container.appendChild(m);
    };
    const bindClick = (li) => {
        var _a, _b;
        const dx = parseFloat(li.dataset.x || '0');
        const dy = parseFloat(li.dataset.y || '0');
        const id = (_b = (li.dataset.id || ((_a = li.querySelector('.delete-link')) === null || _a === void 0 ? void 0 : _a.dataset.id))) !== null && _b !== void 0 ? _b : '';
        li.addEventListener('click', e => {
            e.preventDefault();
            if (selectedLi === li) {
                li.style.fontWeight = '';
                selectedLi = null;
                selectedId = null;
                clearHighlight();
                return;
            }
            selectedLi === null || selectedLi === void 0 ? void 0 : selectedLi.style.removeProperty('font-weight');
            li.style.fontWeight = 'bold';
            selectedLi = li;
            selectedId = id;
            highlightPoint(dx, dy);
        });
    };
    const appendListItem = (p) => {
        const li = document.createElement('li');
        li.dataset.id = String(p.id);
        li.dataset.x = String(p.x);
        li.dataset.y = String(p.y);
        li.innerHTML =
            `${p.order}: (${p.x.toFixed(2)}, ${p.y.toFixed(2)}) ` +
                `<a href="#" class="delete-link" data-id="${p.id}">Delete</a>`;
        listEl.appendChild(li);
        li.querySelector('.delete-link')
            .addEventListener('click', onDeleteClick);
        bindClick(li);
    };
    const drawAll = (buildList = false) => {
        drawLine(coords);
        coords.forEach(drawMarker);
        if (buildList) {
            listEl.innerHTML = '';
            coords.forEach(appendListItem);
        }
        listEl.querySelectorAll('.delete-link').forEach(a => {
            a.removeEventListener('click', onDeleteClick);
            a.addEventListener('click', onDeleteClick);
        });
    };
    const clearMapAndOverlay = () => {
        var _a;
        container.querySelectorAll('.marker').forEach(el => el.remove());
        (_a = overlay.querySelector('polyline')) === null || _a === void 0 ? void 0 : _a.remove();
    };
    const reapplySelection = () => {
        if (!selectedId)
            return;
        const anchor = listEl.querySelector(`.delete-link[data-id="${selectedId}"]`);
        if (!anchor) {
            selectedLi = null;
            selectedId = null;
            clearHighlight();
            return;
        }
        const li = anchor.closest('li');
        li.style.fontWeight = 'bold';
        const dx = parseFloat(li.dataset.x || '0');
        const dy = parseFloat(li.dataset.y || '0');
        highlightPoint(dx, dy);
        selectedLi = li;
    };
    function onDeleteClick(e) {
        e.preventDefault();
        e.stopPropagation();
        const pid = e.currentTarget.dataset.id;
        fetch(`/polls/point/${pid}/delete/`, {
            method: 'POST',
            headers: {
                'X-Requested-With': 'XMLHttpRequest',
                'X-CSRFToken': getCookie('csrftoken')
            }
        })
            .then(r => { if (!r.ok)
            throw new Error(); return r.json(); })
            .then((resp) => {
            const removedSelected = selectedId === pid;
            coords = resp.points;
            nextOrder = coords.length + 1;
            if (removedSelected) {
                selectedLi = null;
                selectedId = null;
                clearHighlight();
            }
            clearMapAndOverlay();
            drawAll(true);
            reapplySelection();
        })
            .catch(console.error);
    }
    img.addEventListener('click', e => {
        const r = img.getBoundingClientRect();
        const x = ((e.clientX - r.left) * img.naturalWidth) / r.width;
        const y = ((e.clientY - r.top) * img.naturalHeight) / r.height;
        const payload = new URLSearchParams();
        payload.set('x', x.toFixed(2));
        payload.set('y', y.toFixed(2));
        payload.set('order', String(nextOrder));
        fetch(form.action, {
            method: 'POST',
            headers: {
                'X-Requested-With': 'XMLHttpRequest',
                'X-CSRFToken': getCookie('csrftoken'),
                'Content-Type': 'application/x-www-form-urlencoded'
            },
            body: payload.toString()
        })
            .then(r => { if (!r.ok)
            throw new Error(); return r.json(); })
            .then((data) => {
            coords.push(data);
            nextOrder++;
            drawMarker(data);
            drawLine(coords);
            appendListItem(data);
        })
            .catch(console.error);
    });
    listEl.querySelectorAll('li').forEach(bindClick);
    document.addEventListener('click', e => {
        const el = e.target;
        if (el.closest('.points-list li') || el.closest('#mapContainer'))
            return;
        selectedLi === null || selectedLi === void 0 ? void 0 : selectedLi.style.removeProperty('font-weight');
        selectedLi = null;
        selectedId = null;
        clearHighlight();
    });
    drawAll();
}
//# sourceMappingURL=map.js.map