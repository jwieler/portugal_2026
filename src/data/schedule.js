// Trip schedule. This is the single source of truth for the itinerary.
//
// TO ADD A STOP: append an object below, commit, push. The deploy workflow
// rebuilds the site automatically. No Firebase change is needed — photos link
// to stops by `id`, so the only rule is: never change an `id` once photos have
// been attached to it (that would orphan them).
//
// Fields:
//   id       - stable slug, referenced by photo docs. Required, must be unique.
//   day      - YYYY-MM-DD. Groups stops into day tabs.
//   time     - free text, shown as-is. Use "" for all-day items.
//   title    - required.
//   blurb    - optional detail line (address, confirmation number, notes).
//   location - { lat, lng } or null. Stops with null get no map pin.

export const schedule = [
  {
    id: 'flight-out',
    day: '2026-09-03',
    time: '9:30 PM',
    title: 'Depart Toronto (YYZ)',
    blurb: 'Air Transat TS480, booking IXC0K9',
    location: null
  },
  {
    id: 'arrive-lisbon',
    day: '2026-09-04',
    time: '9:35 AM',
    title: 'Arrive Lisbon (LIS)',
    blurb: '',
    location: { lat: 38.7813, lng: -9.1359 }
  },
  {
    id: 'checkin-nicola-rossio',
    day: '2026-09-04',
    time: '3:00 PM',
    title: 'Check in — Nicola Rossio Hotel',
    blurb: 'Rua 1 Dezembro, 12, Lisbon',
    location: { lat: 38.7148, lng: -9.1403 }
  },
  {
    id: 'pastel-de-nata-class',
    day: '2026-09-04',
    time: '4:30 PM',
    title: 'Pastel de Nata Masterclass',
    blurb: 'Rua de Santa Justa 87',
    location: { lat: 38.7112, lng: -9.1378 }
  }
];

// Stops grouped by day, both sorted chronologically.
export function scheduleByDay() {
  const days = new Map();
  for (const item of schedule) {
    if (!days.has(item.day)) days.set(item.day, []);
    days.get(item.day).push(item);
  }
  return [...days.entries()]
    .sort((a, b) => a[0].localeCompare(b[0]))
    .map(([day, items]) => ({ day, items }));
}

export function findStop(id) {
  return schedule.find((s) => s.id === id) || null;
}

export function formatDay(day) {
  const d = new Date(day + 'T12:00:00');
  return d.toLocaleDateString(undefined, {
    weekday: 'short',
    month: 'short',
    day: 'numeric'
  });
}
