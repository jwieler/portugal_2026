// The lite build carries the TIFF/EXIF/GPS parsers and drops everything else
// (IPTC, XMP, ICC, thumbnails), which is ~20KB gzipped saved on a page that
// only ever asks for GPS.
import exifr from 'exifr/dist/lite.esm.mjs';

// Reads GPS out of the photo's EXIF, if the camera recorded any.
// Returns { lat, lng } or null. Never throws — a photo with stripped or
// malformed EXIF is completely normal and just falls back to the stop location.
export async function readGps(file) {
  try {
    const gps = await exifr.gps(file);
    if (!gps || typeof gps.latitude !== 'number' || typeof gps.longitude !== 'number') return null;
    if (Number.isNaN(gps.latitude) || Number.isNaN(gps.longitude)) return null;
    return { lat: gps.latitude, lng: gps.longitude };
  } catch {
    return null;
  }
}

// Original phone photos are 3-6MB each. The Spark plan has no image-resize
// function, so build the thumbnail in the browser before uploading: the gallery
// and schedule strips then load ~30KB per photo instead of megabytes, which
// matters a lot on roaming data.
export async function makeThumbnail(file, maxEdge = 480, quality = 0.7) {
  // `from-image` applies the EXIF orientation flag, so portrait shots from a
  // phone don't come out sideways in the thumbnail.
  const bitmap = await createImageBitmap(file, { imageOrientation: 'from-image' })
    .catch(() => createImageBitmap(file).catch(() => null));
  if (!bitmap) return null;

  const scale = Math.min(1, maxEdge / Math.max(bitmap.width, bitmap.height));
  const width = Math.round(bitmap.width * scale);
  const height = Math.round(bitmap.height * scale);

  const canvas = document.createElement('canvas');
  canvas.width = width;
  canvas.height = height;
  canvas.getContext('2d').drawImage(bitmap, 0, 0, width, height);
  bitmap.close?.();

  const blob = await new Promise((resolve) =>
    canvas.toBlob(resolve, 'image/jpeg', quality)
  );
  return blob;
}
