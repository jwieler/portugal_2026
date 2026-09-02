import {
  collection, addDoc, deleteDoc, doc, onSnapshot,
  orderBy, query, serverTimestamp
} from 'firebase/firestore';
import {
  ref, uploadBytes, getDownloadURL, deleteObject
} from 'firebase/storage';
import { db, storage } from '../firebase.js';
import { findStop } from '../data/schedule.js';
import { readGps, makeThumbnail } from './images.js';

const PHOTOS = 'photos';

// Live cache of every photo doc, kept in sync by a single Firestore listener so
// both accounts see each other's uploads without a refresh. Views subscribe to
// this rather than each opening their own query.
let photos = [];
let loaded = false;
let unsubscribeSnapshot = null;
const listeners = new Set();

function emit() {
  for (const fn of listeners) fn(photos, loaded);
}

export function subscribePhotos(fn) {
  listeners.add(fn);
  fn(photos, loaded);
  return () => listeners.delete(fn);
}

export function startPhotoSync() {
  if (unsubscribeSnapshot) return;
  const q = query(collection(db, PHOTOS), orderBy('uploadedAt', 'desc'));
  unsubscribeSnapshot = onSnapshot(
    q,
    (snap) => {
      photos = snap.docs.map((d) => ({ id: d.id, ...d.data() }));
      loaded = true;
      emit();
    },
    (err) => {
      console.error('photo sync failed', err);
      loaded = true;
      emit();
    }
  );
}

export function stopPhotoSync() {
  unsubscribeSnapshot?.();
  unsubscribeSnapshot = null;
  photos = [];
  loaded = false;
}

export function photosForStop(stopId) {
  return photos.filter((p) => p.scheduleItemId === stopId);
}

// Google Cloud Storage's Always Free allowance, which is what keeps the Blaze
// plan billing at zero. Binary GB, matching how usage is reported.
export const FREE_STORAGE_BYTES = 5 * 1024 * 1024 * 1024;

/**
 * Totals stored bytes across every photo — original plus its thumbnail.
 * `untracked` counts docs written before sizes were recorded; those contribute
 * nothing to the total, so a non-zero count means the figure is an undercount.
 */
export function storageUsage(list = photos) {
  let bytes = 0;
  let untracked = 0;
  for (const photo of list) {
    if (typeof photo.size === 'number') bytes += photo.size + (photo.thumbSize || 0);
    else untracked += 1;
  }
  return { bytes, untracked, count: list.length, limit: FREE_STORAGE_BYTES };
}

// A photo's map position, in priority order: its own EXIF GPS (most accurate),
// then a pin dropped by hand, then the location of the stop it's attached to.
export function resolveLocation(photo) {
  if (photo.location && typeof photo.location.lat === 'number') return photo.location;
  const stop = findStop(photo.scheduleItemId);
  return stop?.location || null;
}

/**
 * Uploads one file and writes its metadata doc.
 * @param {File} file
 * @param {{ stopId: string, caption: string, user: object, manualLocation: ?object,
 *           onProgress: ?function }} opts
 */
export async function uploadPhoto(file, opts) {
  const { stopId, caption, user, manualLocation, onProgress } = opts;
  const stop = findStop(stopId);
  if (!stop) throw new Error('Unknown schedule stop: ' + stopId);

  onProgress?.('Reading photo…');
  const gps = await readGps(file);

  let location = null;
  let locationSource = 'schedule-item';
  if (gps) {
    location = gps;
    locationSource = 'exif';
  } else if (manualLocation) {
    location = manualLocation;
    locationSource = 'manual';
  }

  const safeName = file.name.replace(/[^\w.\-]/g, '_');
  const key = `${Date.now()}-${Math.random().toString(36).slice(2, 8)}-${safeName}`;
  const storagePath = `photos/${stop.day}/${key}`;
  const thumbPath = `thumbs/${stop.day}/${key}.jpg`;

  onProgress?.('Uploading…');
  await uploadBytes(ref(storage, storagePath), file, { contentType: file.type });

  // The thumbnail is an optimisation, not a requirement — if canvas encoding
  // fails on this browser, fall back to showing the full-size image.
  let thumbUrl = null;
  let storedThumbPath = null;
  const thumb = await makeThumbnail(file).catch(() => null);
  if (thumb) {
    await uploadBytes(ref(storage, thumbPath), thumb, { contentType: 'image/jpeg' });
    thumbUrl = await getDownloadURL(ref(storage, thumbPath));
    storedThumbPath = thumbPath;
  }

  const url = await getDownloadURL(ref(storage, storagePath));

  onProgress?.('Saving…');
  await addDoc(collection(db, PHOTOS), {
    storagePath,
    thumbPath: storedThumbPath,
    url,
    thumbUrl,
    // Byte sizes are recorded here so the storage meter can total usage from
    // the docs it already syncs, instead of listing the bucket and fetching
    // metadata for every object.
    size: file.size,
    thumbSize: thumb ? thumb.size : 0,
    scheduleItemId: stopId,
    caption: caption || '',
    uploadedBy: user.email || user.uid,
    uploadedAt: serverTimestamp(),
    location,
    locationSource
  });
}

export async function deletePhoto(photo) {
  // Remove the files first; if a storage object is already gone, that's fine —
  // the goal is that no doc outlives its files.
  for (const path of [photo.storagePath, photo.thumbPath]) {
    if (!path) continue;
    await deleteObject(ref(storage, path)).catch(() => {});
  }
  await deleteDoc(doc(db, PHOTOS, photo.id));
}
