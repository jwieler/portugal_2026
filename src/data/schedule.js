// Trip schedule. This is the single source of truth for the itinerary.
//
// TO ADD OR EDIT A STOP: change the array below, commit, push to main. The
// deploy workflow rebuilds the site automatically. No Firebase change is
// needed — photos link to stops by `id`, so the only rule is: never change an
// `id` once photos have been attached to it (that would orphan them).
//
// Fields:
//   id        - stable slug, referenced by photo docs. Required, must be unique.
//   day       - YYYY-MM-DD. Groups stops into days.
//   time      - free text, shown as-is. null for anything without a set time.
//   title     - required.
//   blurb     - optional detail line (address, confirmation number, notes).
//   confirmed - false marks a stop as planned-but-not-booked. It gets a
//               "Planned" badge in the list and a hollow pin on the map.
//   location  - { lat, lng, label } or null. `label` names the place in map
//               popups. Stops with a null location get no map pin.
//
// Stops appear in the order written here, so keep each day in chronological
// order — the times aren't parsed.

export const schedule = [
  {
    id: 'flight-out',
    day: '2026-09-03',
    time: '9:30 PM',
    title: 'Depart Toronto (YYZ)',
    blurb: 'Air Transat TS480, booking IXC0K9. 7h5m flight.',
    confirmed: true,
    location: { lat: 43.6777, lng: -79.6248, label: 'Toronto Pearson (YYZ)' }
  },
  {
    id: 'arrive-lisbon',
    day: '2026-09-04',
    time: '9:35 AM',
    title: 'Arrive Lisbon (LIS)',
    blurb: 'Air Transat TS480 lands.',
    confirmed: true,
    location: { lat: 38.7813, lng: -9.1359, label: 'Lisbon Airport (LIS)' }
  },
  {
    id: 'checkin-nicola-rossio',
    day: '2026-09-04',
    time: '3:00 PM',
    title: 'Check in — Nicola Rossio Hotel',
    blurb: 'Rua 1 Dezembro, 12, Lisbon.',
    confirmed: true,
    location: { lat: 38.7148, lng: -9.1403, label: 'Nicola Rossio Hotel' }
  },
  {
    id: 'pastel-de-nata-class',
    day: '2026-09-04',
    time: '4:30 PM',
    title: 'Pastel de Nata Masterclass',
    blurb: "Nat'elier, Rua de Santa Justa 87. €140 total for 2, paid in full.",
    confirmed: true,
    location: { lat: 38.7112, lng: -9.1378, label: "Nat'elier" }
  },
  {
    id: 'lisbon-walking-tour',
    day: '2026-09-05',
    time: '9:30 AM',
    title: 'Free walking tour (planned)',
    blurb: "Not yet booked — GuruWalk 'Essential History, Fun Facts and Free Tastings'.",
    confirmed: false,
    location: { lat: 38.7139, lng: -9.1394, label: 'Lisbon city centre (approx.)' }
  },
  {
    id: 'sintra-day-trip',
    day: '2026-09-06',
    time: null,
    title: 'Sintra day trip (planned)',
    blurb: 'Not yet booked.',
    confirmed: false,
    location: { lat: 38.7979, lng: -9.3907, label: 'Sintra' }
  },
  {
    id: 'checkout-nicola-rossio',
    day: '2026-09-07',
    time: '12:00 PM',
    title: 'Check out — Nicola Rossio Hotel',
    blurb: null,
    confirmed: true,
    location: { lat: 38.7148, lng: -9.1403, label: 'Nicola Rossio Hotel' }
  },
  {
    id: 'flixbus-to-porto',
    day: '2026-09-07',
    time: '12:00 PM',
    title: 'Flixbus to Porto',
    blurb: 'Route 1000, platform 39D, booking 3390409211. Departs Lisbon (Oriente), arrives Porto-Campanhã 3:15 PM.',
    confirmed: true,
    location: { lat: 38.7679, lng: -9.0987, label: 'Lisbon Oriente Station' }
  },
  {
    id: 'checkin-vc-heritage',
    day: '2026-09-07',
    time: '3:00 PM',
    title: 'Check in — VC Heritage Ribeira Porto',
    blurb: 'R. de São João 14, Porto. Comfort Studio, River View. $653.89 total for 3 nights.',
    confirmed: true,
    location: { lat: 41.1408, lng: -8.6110, label: 'VC Heritage Ribeira Porto' }
  },
  {
    id: 'porto-open-day',
    day: '2026-09-08',
    time: null,
    title: 'Open / TBD',
    blurb: 'Nothing booked yet — winery, Chapel of Souls, Jardins do Palácio de Cristal, São Bento station still on the wishlist.',
    confirmed: false,
    location: { lat: 41.1496, lng: -8.6109, label: 'Porto city centre (approx.)' }
  },
  {
    id: 'douro-valley-tour',
    day: '2026-09-09',
    time: '8:00 AM',
    title: 'Douro Valley Wine Tour',
    blurb: 'Complete Douro Valley Wine Tour with Lunch, Wine Tastings and River Cruise. Living Tours, booking 1443124335. Meet at Calçada da Vandoma, next to Porto Cathedral.',
    confirmed: true,
    location: { lat: 41.1429, lng: -8.6111, label: 'Porto Cathedral (meeting point)' }
  },
  {
    id: 'checkout-vc-heritage',
    day: '2026-09-10',
    time: '11:00 AM',
    title: 'Check out — VC Heritage Ribeira Porto',
    blurb: null,
    confirmed: true,
    location: { lat: 41.1408, lng: -8.6110, label: 'VC Heritage Ribeira Porto' }
  },
  {
    id: 'flixbus-to-lisbon',
    day: '2026-09-10',
    time: '11:00 AM',
    title: 'Flixbus to Lisbon',
    blurb: 'Route 1000, booking 3390409211. Departs Porto-Campanhã, arrives Lisbon (Oriente) 2:15 PM.',
    confirmed: true,
    location: { lat: 41.1489, lng: -8.5852, label: 'Porto Campanhã Station' }
  },
  {
    id: 'madalena-hotel',
    day: '2026-09-10',
    time: null,
    title: 'Madalena by The Beautique Hotels',
    blurb: 'Amex itinerary NXXQVC, CAD $391.82, confirmation 9089783355844. Exact check-in time not confirmed.',
    confirmed: true,
    location: { lat: 38.7135, lng: -9.1420, label: 'Madalena by The Beautique Hotels (approx.)' }
  },
  {
    id: 'flight-home',
    day: '2026-09-11',
    time: '11:35 AM',
    title: 'Depart Lisbon (LIS)',
    blurb: 'Air Transat TS481, 8h5m flight, lands 2:40 PM YYZ.',
    confirmed: true,
    location: { lat: 38.7813, lng: -9.1359, label: 'Lisbon Airport (LIS)' }
  }
];

// Stops grouped by day, days in chronological order, stops in written order.
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
