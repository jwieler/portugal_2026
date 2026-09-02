import { el } from '../lib/dom.js';
import { findStop } from '../data/schedule.js';
import { deletePhoto } from '../lib/photos.js';

// Full-screen photo viewer. Opened from the schedule strips, the gallery grid
// and the map popups, so it lives on its own rather than inside a view.
export function openLightbox(photo) {
  const stop = findStop(photo.scheduleItemId);
  const when = photo.uploadedAt?.toDate?.();

  const sub = [
    stop ? stop.title : 'Unlinked',
    photo.uploadedBy,
    when ? when.toLocaleString(undefined, { month: 'short', day: 'numeric', hour: 'numeric', minute: '2-digit' }) : null,
    photo.locationSource === 'exif' ? 'GPS from photo' : null
  ].filter(Boolean).join(' · ');

  const overlay = el('div', {
    class: 'lightbox',
    onclick: (event) => { if (event.target === overlay) close(); }
  });

  function close() {
    overlay.remove();
    document.removeEventListener('keydown', onKey);
  }

  function onKey(event) {
    if (event.key === 'Escape') close();
  }

  const remove = el('button', {
    class: 'danger',
    text: 'Delete',
    onclick: async () => {
      if (!confirm('Delete this photo? This cannot be undone.')) return;
      remove.disabled = true;
      remove.textContent = 'Deleting…';
      try {
        await deletePhoto(photo);
        close();
      } catch (err) {
        console.error(err);
        remove.disabled = false;
        remove.textContent = 'Delete failed — retry';
      }
    }
  });

  overlay.append(
    el('img', { src: photo.url, alt: photo.caption || 'Trip photo' }),
    el('div', { class: 'meta' }, [
      photo.caption ? el('div', { text: photo.caption }) : null,
      el('div', { class: 'sub', text: sub })
    ]),
    el('div', { class: 'actions' }, [
      el('button', { text: 'Close', onclick: close }),
      remove
    ])
  );

  document.addEventListener('keydown', onKey);
  document.body.append(overlay);
}
