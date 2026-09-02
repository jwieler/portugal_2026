import L from 'leaflet';
import 'leaflet/dist/leaflet.css';
import { el, clear, escapeHtml } from '../lib/dom.js';
import { schedule, findStop } from '../data/schedule.js';
import { subscribePhotos, resolveLocation } from '../lib/photos.js';
import { openLightbox } from './lightbox.js';

// Leaflet's default marker points at image files it expects to find next to its
// CSS, which bundlers rewrite. Using divIcons keeps the map asset-free.
function pin(kind) {
  return L.divIcon({
    className: '',
    html: `<div class="map-pin ${kind}"></div>`,
    iconSize: [18, 18],
    iconAnchor: [9, 9],
    popupAnchor: [0, -10]
  });
}

const LISBON = [38.7223, -9.1393];

export function renderMap(root) {
  clear(root);
  root.className = 'flush';

  const container = el('div', { id: 'map' });
  root.append(container);

  const map = L.map(container, { scrollWheelZoom: true }).setView(LISBON, 12);
  L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
    maxZoom: 19,
    attribution: '&copy; OpenStreetMap contributors'
  }).addTo(map);

  const legend = L.control({ position: 'bottomright' });
  legend.onAdd = () => {
    const div = L.DomUtil.create('div', 'map-legend');
    div.innerHTML =
      '<div><i style="background:#0f6466"></i>Schedule stop</div>' +
      '<div><i style="background:#c1502e"></i>Photo</div>';
    return div;
  };
  legend.addTo(map);

  const stopLayer = L.layerGroup().addTo(map);
  const photoLayer = L.layerGroup().addTo(map);
  const bounds = [];

  for (const stop of schedule) {
    if (!stop.location) continue;
    const point = [stop.location.lat, stop.location.lng];
    bounds.push(point);
    L.marker(point, { icon: pin('stop') })
      .bindPopup(
        `<strong>${escapeHtml(stop.title)}</strong>` +
        `${stop.time ? escapeHtml(stop.time) + ' · ' : ''}${escapeHtml(stop.day)}` +
        (stop.blurb ? `<br>${escapeHtml(stop.blurb)}` : '')
      )
      .addTo(stopLayer);
  }

  if (bounds.length) map.fitBounds(bounds, { padding: [50, 50], maxZoom: 14 });

  // Leaflet measures its container on creation; this view is inserted and sized
  // in the same frame, so nudge it once the layout has settled.
  requestAnimationFrame(() => map.invalidateSize());

  const unsubscribe = subscribePhotos((photos, loaded) => {
    if (!loaded) return;
    photoLayer.clearLayers();

    for (const photo of photos) {
      const location = resolveLocation(photo);
      if (!location) continue;

      const stop = findStop(photo.scheduleItemId);
      const marker = L.marker([location.lat, location.lng], { icon: pin('photo') });
      const thumb = photo.thumbUrl || photo.url;

      marker.bindPopup(
        `<strong>${escapeHtml(photo.caption || stop?.title || 'Photo')}</strong>` +
        `${escapeHtml(photo.uploadedBy)}` +
        `<br><span style="color:#6b7280">${photo.locationSource === 'exif' ? 'GPS from photo' : photo.locationSource === 'manual' ? 'Pinned by hand' : 'At ' + escapeHtml(stop?.title || 'stop')}</span>` +
        `<img src="${escapeHtml(thumb)}" alt="">`
      );

      // Open the full-size viewer when the popup's thumbnail is tapped.
      marker.on('popupopen', (event) => {
        const img = event.popup.getElement()?.querySelector('img');
        if (img) {
          img.style.cursor = 'pointer';
          img.addEventListener('click', () => openLightbox(photo));
        }
      });

      marker.addTo(photoLayer);
    }
  });

  return () => {
    unsubscribe();
    map.remove();
  };
}
