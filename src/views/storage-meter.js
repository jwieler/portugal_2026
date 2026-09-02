import { el, clear } from '../lib/dom.js';
import { formatBytes } from '../lib/format.js';
import { subscribePhotos, storageUsage } from '../lib/photos.js';

// Live read-out of how much of the free storage allowance the photos have used.
// It totals the sizes recorded on the photo docs, which are already synced, so
// it costs no extra reads and updates the moment an upload lands.
export function renderStorageMeter() {
  const fill = el('div', { class: 'meter-fill' });
  const headline = el('div', { class: 'meter-headline' });
  const detail = el('div', { class: 'meter-detail small muted' });

  const root = el('div', { class: 'meter' }, [
    headline,
    el('div', { class: 'meter-track' }, [fill]),
    detail
  ]);

  const unsubscribe = subscribePhotos((photos, loaded) => {
    if (!loaded) {
      headline.textContent = 'Checking storage…';
      return;
    }

    const { bytes, untracked, count, limit } = storageUsage(photos);
    const ratio = Math.min(1, bytes / limit);
    const remaining = Math.max(0, limit - bytes);

    fill.style.width = (ratio * 100).toFixed(2) + '%';
    fill.className = 'meter-fill' + (ratio >= 0.95 ? ' danger' : ratio >= 0.8 ? ' warn' : '');

    headline.textContent = `${formatBytes(remaining)} left of ${formatBytes(limit, 0)}`;

    const parts = [
      `${formatBytes(bytes)} used`,
      `${count} photo${count === 1 ? '' : 's'}`
    ];
    // Averages only mean something once there's a sample to average.
    const tracked = count - untracked;
    if (tracked > 0) parts.push(`~${formatBytes(bytes / tracked)} each`);
    if (untracked > 0) parts.push(`${untracked} without a recorded size, so this is a floor`);
    detail.textContent = parts.join(' · ');
  });

  return { root, destroy: unsubscribe };
}
