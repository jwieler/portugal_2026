// Binary units, matching how Google reports Cloud Storage usage.
const KB = 1024;
const UNITS = ['B', 'KB', 'MB', 'GB', 'TB'];

export function formatBytes(bytes, decimals) {
  if (!bytes || bytes < 0) return '0 MB';
  let value = bytes;
  let unit = 0;
  while (value >= KB && unit < UNITS.length - 1) {
    value /= KB;
    unit += 1;
  }
  // Big units read better with a decimal; bytes and kilobytes don't.
  const places = decimals ?? (unit >= 2 ? 1 : 0);
  return `${value.toFixed(places)} ${UNITS[unit]}`;
}
