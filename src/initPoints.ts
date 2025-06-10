// src/initPoints.ts
import AnimatedList from './AnimatedList';

document.addEventListener('DOMContentLoaded', () => {
  const mapEl = document.getElementById('mapContainer');
  if (!mapEl) return;

  const raw = mapEl.dataset.points;
  if (!raw) return;

  let points;
  try {
    points = JSON.parse(raw);
  } catch (err) {
    console.error('Invalid JSON in data-points:', err);
    return;
  }

  const items = (points as { order: number; x: number; y: number }[])
    .map(p => `${p.order}: (${p.x}, ${p.y})`);

  new AnimatedList({
    items,
    containerSelector: '.points-panel .scroll-list-container',
  });
});
