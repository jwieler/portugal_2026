# Portugal 2026

A small private site for Jacob & Christina: the trip itinerary, photos attached
to individual stops, and everything plotted on a map. Static frontend on GitHub
Pages, with Firebase providing the login, photo storage, and metadata.

**Live site:** https://jwieler.github.io/portugal_2026/

---

## How the pieces fit

| Concern | Where it lives |
|---|---|
| Itinerary | `src/data/schedule.js`, bundled into the build |
| Login | Firebase Authentication (email/password) |
| Photo files | Firebase Storage |
| Photo metadata | Firestore, collection `photos` |
| Map | Leaflet + OpenStreetMap tiles (no API key) |
| Hosting | GitHub Pages, built by `.github/workflows/deploy.yml` |

The page shell on GitHub Pages is public — anyone can load the empty HTML. It
shows nothing but a login form until you sign in, and the itinerary, photos and
metadata are all fetched from Firebase, which refuses to serve any of it without
a valid account. The privacy is enforced by the security rules in `firebase/`,
not by hiding anything in the frontend.

## One-time setup

### 1. Firebase project

1. Create a project at <https://console.firebase.google.com>.
2. **Build → Authentication → Get started → Email/Password → Enable.** Leave
   "Email link" off.
3. **Authentication → Users → Add user.** Create one account each for Jacob and
   Christina. There is deliberately no signup page, so these are the only two
   accounts that will ever exist.
4. **Build → Firestore Database → Create database.** Start in production mode.
5. **Upgrade the project to the Blaze (pay-as-you-go) plan.** This is required
   — since **3 February 2026**, Cloud Storage for Firebase needs a linked
   billing account. On Spark you get no bucket at all and every storage call
   returns 402 or 403. Auth and Firestore are unaffected and stay free.

   Blaze is a gate, not a bill. Google Cloud Storage's Always Free tier covers
   5 GB of storage and 100 GB/month of egress to North America, and a trip's
   worth of photos sits well inside that, so the expected cost is $0. Set a
   budget alert (**Firebase → ⚙ → Usage and billing → Details & settings →
   Budgets**) at a dollar or two if you want a tripwire.
6. **Build → Storage → Get started.** Start in production mode.

### 2. Security rules

Paste `firebase/firestore.rules` into **Firestore → Rules** and
`firebase/storage.rules` into **Storage → Rules**, then publish each. Both
require a signed-in user for every read and write. Until you do this, the
default production rules deny everything and the app will show no photos.

### 3. Wire the config into the build

Copy the web app config from **Project settings → General → Your apps → Web app**
(create one if there isn't one yet), then add each value under
**GitHub repo → Settings → Secrets and variables → Actions → Variables**:

```
VITE_FIREBASE_API_KEY
VITE_FIREBASE_AUTH_DOMAIN
VITE_FIREBASE_PROJECT_ID
VITE_FIREBASE_STORAGE_BUCKET
VITE_FIREBASE_MESSAGING_SENDER_ID
VITE_FIREBASE_APP_ID
```

These are **repository variables, not secrets** — Firebase web config is public
by design and ships in the JavaScript bundle no matter what you do. Hiding it
buys nothing; the security rules are what protect the data. (The workflow also
reads them from Secrets if you'd rather put them there.)

If the build runs without them the site loads a "Not configured yet" notice
instead of crashing.

### 4. Authorise the Pages domain

In **Firebase → Authentication → Settings → Authorized domains**, add
`jwieler.github.io`. Without it, sign-in from the live site is rejected.

### 5. Turn on Pages

**GitHub repo → Settings → Pages → Build and deployment → Source: GitHub Actions.**
Then push to `main` (or run the workflow by hand from the Actions tab). The
workflow builds the site and publishes it; there's no `gh-pages` branch to
manage.

## Editing the itinerary

Open `src/data/schedule.js`, add or edit entries, commit, push to `main`. The
deploy workflow rebuilds automatically. Each stop is:

```js
{
  id: 'pastel-de-nata-class',        // stable slug — photos reference this
  day: '2026-09-04',                 // YYYY-MM-DD, groups stops into days
  time: '4:30 PM',                   // free text, null if there's no set time
  title: 'Pastel de Nata Masterclass',
  blurb: "Nat'elier, Rua de Santa Justa 87",  // optional
  confirmed: true,                   // false = "Planned" badge + hollow map pin
  location: { lat: 38.7112, lng: -9.1378, label: "Nat'elier" }  // or null
}
```

Stops render in the order written, so keep each day chronological — the times
aren't parsed. Stops sharing exact coordinates (checking in and out of the same
hotel, flying in and out of the same airport) collapse into one map pin whose
popup lists everything that happens there.

The one rule: **never change an `id` after photos have been attached to it**, or
those photos lose their stop. Everything else is safe to edit any time.

To get coordinates for a new stop, right-click the spot on
[openstreetmap.org](https://www.openstreetmap.org) and choose "Show address" —
the lat/lng is in the URL.

## How a photo gets its map pin

In priority order:

1. **The photo's own GPS**, read from EXIF in the browser at upload time. Most
   accurate, and it's what phone cameras record when location is enabled.
2. **A pin you dropped by hand**, if you ticked "Set location by hand" on the
   upload form. Only consulted for photos with no GPS of their own.
3. **The location of the stop it's attached to.** The fallback, and fine for
   most purposes.

Photos also get a thumbnail generated in the browser before upload, so the
gallery and schedule strips load tens of kilobytes per photo rather than the
several megabytes a phone photo actually weighs. That matters on roaming data.

> **iPhone note:** photos only carry GPS if Location Services is on for the
> Camera app. If it's off, everything still works — photos just land on their
> stop's location instead.

## Running it locally

```bash
npm install
cp .env.example .env     # fill in the same Firebase values
npm run dev
```

`npm run build` produces `dist/`; `npm run preview` serves that build.

For local dev, add `localhost` to Firebase's authorised domains (it's usually
there by default).

## Known limits

- **Storage needs the Blaze plan** (see setup step 5) but should still cost
  nothing: the Always Free allowance is 5 GB stored and 100 GB/month of
  egress, and a trip's photos sit well inside it. Auth and Firestore remain
  free regardless.
- **No offline mode.** The app needs a connection to load photos. The itinerary
  is bundled into the JavaScript, so it renders from cache once the page has
  been loaded on that device.
- **Deleting a photo is permanent** and either account can delete either
  person's photos. There's no undo and no trash.
