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

// The itinerary starts in Toronto, ~5,600km from everything else in it.
// Fitting the initial view to every pin would zoom out to the whole North
// Atlantic and squash the Portugal stops into a handful of pixels, so fit to
// the main cluster instead. The outlying pins are still on the map, they just
// need a zoom out to reach.
function mainCluster(points) {
  if (points.length < 3) return points;
  const median = (values) => [...values].sort((a, b) => a - b)[Math.floor(values.length / 2)];
  const midLat = median(points.map((p) => p[0]));
  const midLng = median(points.map((p) => p[1]));
  // ~5 degrees, roughly 550km — comfortably wider than Lisbon-to-Porto.
  const near = points.filter((p) => Math.hypot(p[0] - midLat, p[1] - midLng) < 5);
  return near.length ? near : points;
}

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
      '<div><i style="background:#0f6466"></i>Booked stop</div>' +
      '<div><i style="background:#fff;box-shadow:inset 0 0 0 2px #0f6466"></i>Planned stop</div>' +
      '<div><i style="background:#c1502e"></i>Photo</div>';
    return div;
  };
  legend.addTo(map);

  const stopLayer = L.layerGroup().addTo(map);
  const photoLayer = L.layerGroup().addTo(map);
  const bounds = [];

  // Several stops share exact coordinates — you check into and out of the same
  // hotel, and fly in and out of the same airport. Drawn as separate markers
  // they sit perfectly on top of each other, and the hidden one can never be
  // clicked. Group by position and give each spot a single pin listing
  // everything that happens there.
  const spots = new Map();
  for (const stop of schedule) {
    if (!stop.location) continue;
    const key = stop.location.lat.toFixed(5) + ',' + stop.location.lng.toFixed(5);
    if (!spots.has(key)) spots.set(key, { location: stop.location, stops: [] });
    spots.get(key).stops.push(stop);
  }

  for (const { location, stops } of spots.values()) {
    const point = [location.lat, location.lng];
    bounds.push(point);

    // Hollow only when nothing booked happens here.
    const planned = stops.every((s) => s.confirmed === false);
    const lines = stops.map((s) =>
      `<div>${escapeHtml(s.day)}${s.time ? ' · ' + escapeHtml(s.time) : ''} — ${escapeHtml(s.title)}` +
      `${s.confirmed === false ? ' (planned)' : ''}</div>` +
      (s.blurb ? `<div style="color:#6b7280;margin-bottom:4px">${escapeHtml(s.blurb)}</div>` : '')
    ).join('');

    L.marker(point, { icon: pin('stop' + (planned ? ' planned' : '')) })
      .bindPopup(
        `<strong>${escapeHtml(location.label || stops[0].title)}</strong>` + lines
      )
      .addTo(stopLayer);
  }

  if (bounds.length) map.fitBounds(mainCluster(bounds), { padding: [50, 50], maxZoom: 14 });

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
