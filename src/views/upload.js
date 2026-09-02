import L from 'leaflet';
import 'leaflet/dist/leaflet.css';
import { el, clear } from '../lib/dom.js';
import { scheduleByDay, formatDay, schedule } from '../data/schedule.js';
import { uploadPhoto } from '../lib/photos.js';
import { currentUser } from '../state.js';

// Preselect the stop nearest to today, so on the day of a stop the dropdown is
// usually already right.
function defaultStopId() {
  const today = new Date().toISOString().slice(0, 10);
  let best = schedule[0];
  let bestDistance = Infinity;
  for (const stop of schedule) {
    const distance = Math.abs(
      (new Date(stop.day + 'T12:00:00') - new Date(today + 'T12:00:00')) / 86400000
    );
    if (distance < bestDistance) {
      bestDistance = distance;
      best = stop;
    }
  }
  return best?.id;
}

export function renderUpload(root) {
  clear(root);
  root.className = '';

  if (!schedule.length) {
    root.append(el('div', { class: 'empty', text: 'Add stops to the itinerary before uploading photos.' }));
    return () => {};
  }

  const stopSelect = el('select', {},
    scheduleByDay().map(({ day, items }) =>
      el('optgroup', { label: formatDay(day) },
        items.map((stop) =>
          el('option', { value: stop.id, text: (stop.time ? stop.time + ' — ' : '') + stop.title })
        )
      )
    )
  );
  stopSelect.value = defaultStopId();

  const files = el('input', { type: 'file', accept: 'image/*', multiple: 'multiple' });
  const caption = el('input', { type: 'text', placeholder: 'Optional — applies to every photo in this batch' });

  // Manual pin: only consulted for photos with no GPS of their own.
  let manualLocation = null;
  let miniMap = null;
  let miniMarker = null;
  const mapBox = el('div', { style: 'height:220px;border-radius:10px;overflow:hidden;display:none;margin-top:8px' });
  const mapHint = el('div', { class: 'small muted', style: 'display:none;margin-top:6px' });

  const manualToggle = el('input', {
    type: 'checkbox',
    style: 'width:auto;margin-right:8px',
    onchange: (event) => {
      const on = event.target.checked;
      mapBox.style.display = on ? '' : 'none';
      mapHint.style.display = on ? '' : 'none';
      if (!on) {
        manualLocation = null;
        return;
      }
      if (!miniMap) {
        const stop = schedule.find((s) => s.id === stopSelect.value);
        const centre = stop?.location ? [stop.location.lat, stop.location.lng] : [38.7223, -9.1393];
        miniMap = L.map(mapBox).setView(centre, 14);
        L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
          maxZoom: 19,
          attribution: '&copy; OpenStreetMap contributors'
        }).addTo(miniMap);
        miniMap.on('click', (event) => {
          manualLocation = { lat: event.latlng.lat, lng: event.latlng.lng };
          const point = [manualLocation.lat, manualLocation.lng];
          if (miniMarker) miniMarker.setLatLng(point);
          else miniMarker = L.marker(point).addTo(miniMap);
          mapHint.textContent =
            `Pin set at ${manualLocation.lat.toFixed(5)}, ${manualLocation.lng.toFixed(5)} — used only for photos without their own GPS.`;
        });
      }
      mapHint.textContent = 'Tap the map to drop a pin.';
      requestAnimationFrame(() => miniMap.invalidateSize());
    }
  });

  const queue = el('div', { class: 'queue' });
  const message = el('div', { class: 'banner info', style: 'display:none' });
  const submit = el('button', { class: 'primary', type: 'submit', text: 'Upload' });

  const form = el('form', {
    onsubmit: async (event) => {
      event.preventDefault();
      const chosen = [...files.files];
      if (!chosen.length) {
        message.className = 'banner error';
        message.textContent = 'Pick at least one photo first.';
        message.style.display = '';
        return;
      }

      message.style.display = 'none';
      submit.disabled = true;
      submit.textContent = 'Uploading…';
      clear(queue);

      let failures = 0;
      for (const file of chosen) {
        const state = el('span', { class: 'state', text: 'Waiting…' });
        const preview = el('img', { src: URL.createObjectURL(file), alt: '' });
        queue.append(
          el('div', { class: 'queue-item' }, [
            preview,
            el('span', { class: 'name', text: file.name }),
            state
          ])
        );

        try {
          await uploadPhoto(file, {
            stopId: stopSelect.value,
            caption: caption.value.trim(),
            user: currentUser(),
            manualLocation,
            onProgress: (text) => { state.textContent = text; }
          });
          state.textContent = 'Done';
          state.className = 'state done';
        } catch (err) {
          console.error('upload failed', file.name, err);
          failures += 1;
          state.textContent = 'Failed';
          state.className = 'state failed';
        } finally {
          URL.revokeObjectURL(preview.src);
        }
      }

      submit.disabled = false;
      submit.textContent = 'Upload';
      message.className = failures ? 'banner error' : 'banner info';
      message.textContent = failures
        ? `${chosen.length - failures} uploaded, ${failures} failed. Try the failed ones again.`
        : `Uploaded ${chosen.length} photo${chosen.length === 1 ? '' : 's'}. They're on the schedule and map now.`;
      message.style.display = '';

      if (!failures) {
        form.reset();
        stopSelect.value = defaultStopId();
      }
    }
  }, [
    el('div', { class: 'field' }, [
      el('label', { text: 'Photos' }),
      files,
      el('div', { class: 'small muted', style: 'margin-top:6px', text: 'Location comes from each photo’s own GPS when it has any, otherwise from the stop below.' })
    ]),
    el('div', { class: 'field' }, [el('label', { text: 'Attach to stop' }), stopSelect]),
    el('div', { class: 'field' }, [el('label', { text: 'Caption' }), caption]),
    el('div', { class: 'field' }, [
      el('label', { style: 'display:flex;align-items:center;margin-bottom:0' }, [
        manualToggle,
        document.createTextNode('Set location by hand instead of using the stop')
      ]),
      mapBox,
      mapHint
    ]),
    submit
  ]);

  root.append(el('div', { class: 'card', style: 'padding:18px' }, [form, message, queue]));

  return () => {
    miniMap?.remove();
    miniMap = null;
  };
}
