import { el, clear } from '../lib/dom.js';
import { scheduleByDay, formatDay } from '../data/schedule.js';
import { subscribePhotos, photosForStop } from '../lib/photos.js';
import { openLightbox } from './lightbox.js';

export function renderSchedule(root) {
  clear(root);
  root.className = '';

  const days = scheduleByDay();
  if (!days.length) {
    root.append(el('div', { class: 'empty', text: 'No stops in the itinerary yet.' }));
    return () => {};
  }

  // Each stop gets a container that the photo subscription refills in place,
  // so new uploads appear without rebuilding the whole list.
  const strips = new Map();

  for (const { day, items } of days) {
    root.append(el('h2', { class: 'day-head', text: formatDay(day) }));
    for (const stop of items) {
      const strip = el('div', { class: 'strip', style: 'display:none' });
      strips.set(stop.id, strip);

      // Unbooked stops are often titled "... (planned)". The badge already says
      // so, so drop the suffix rather than printing it twice.
      const planned = stop.confirmed === false;
      const title = el('div', {
        class: 'title',
        text: planned ? stop.title.replace(/\s*\(planned\)\s*$/i, '') : stop.title
      });
      if (planned) title.append(el('span', { class: 'badge', text: 'Planned' }));

      root.append(
        el('article', { class: 'card stop' + (planned ? ' planned' : '') }, [
          el('div', { class: 'row' }, [
            el('div', { class: 'time', text: stop.time || 'TBD' }),
            el('div', {}, [
              title,
              stop.blurb ? el('div', { class: 'blurb', text: stop.blurb }) : null
            ])
          ]),
          strip
        ])
      );
    }
  }

  return subscribePhotos((_all, loaded) => {
    if (!loaded) return;
    for (const [stopId, strip] of strips) {
      const photos = photosForStop(stopId);
      clear(strip);
      strip.style.display = photos.length ? '' : 'none';
      for (const photo of photos) {
        strip.append(
          el('img', {
            src: photo.thumbUrl || photo.url,
            alt: photo.caption || 'Trip photo',
            loading: 'lazy',
            onclick: () => openLightbox(photo)
          })
        );
      }
    }
  });
}
