import { el, clear } from '../lib/dom.js';
import { scheduleByDay, formatDay, findStop } from '../data/schedule.js';
import { subscribePhotos } from '../lib/photos.js';
import { openLightbox } from './lightbox.js';

export function renderGallery(root) {
  clear(root);
  root.className = '';

  let dayFilter = 'all';

  const filter = el('select', {
    onchange: (event) => { dayFilter = event.target.value; draw(); }
  }, [
    el('option', { value: 'all', text: 'All days' }),
    ...scheduleByDay().map(({ day }) => el('option', { value: day, text: formatDay(day) }))
  ]);

  const grid = el('div', { class: 'grid' });
  const status = el('div', { class: 'empty', text: 'Loading photos…' });

  root.append(
    el('div', { class: 'field', style: 'max-width:260px' }, [
      el('label', { text: 'Filter by day' }),
      filter
    ]),
    status,
    grid
  );

  let all = [];
  let ready = false;

  function draw() {
    const photos = dayFilter === 'all'
      ? all
      : all.filter((p) => findStop(p.scheduleItemId)?.day === dayFilter);

    clear(grid);
    for (const photo of photos) {
      grid.append(
        el('img', {
          src: photo.thumbUrl || photo.url,
          alt: photo.caption || 'Trip photo',
          loading: 'lazy',
          onclick: () => openLightbox(photo)
        })
      );
    }

    if (!ready) status.textContent = 'Loading photos…';
    else if (!photos.length) status.textContent = dayFilter === 'all'
      ? 'No photos yet. Head to Upload to add the first one.'
      : 'No photos from this day yet.';
    status.style.display = photos.length ? 'none' : '';
  }

  return subscribePhotos((photos, loaded) => {
    all = photos;
    ready = loaded;
    draw();
  });
}
