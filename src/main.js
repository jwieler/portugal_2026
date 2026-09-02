import './styles.css';
import { onAuthStateChanged, signOut } from 'firebase/auth';
import { auth, isConfigured } from './firebase.js';
import { el, clear } from './lib/dom.js';
import { route, setFallback, navigate, startRouter, currentRoute, resolve } from './router.js';
import { setCurrentUser } from './state.js';
import { startPhotoSync, stopPhotoSync } from './lib/photos.js';
import { renderLogin } from './views/login.js';
import { renderSchedule } from './views/schedule.js';
import { renderUpload } from './views/upload.js';
import { renderMap } from './views/map.js';
import { renderGallery } from './views/gallery.js';

const app = document.getElementById('app');

const TABS = [
  { name: 'schedule', label: 'Schedule', render: renderSchedule },
  { name: 'map', label: 'Map', render: renderMap },
  { name: 'gallery', label: 'Gallery', render: renderGallery },
  { name: 'upload', label: 'Upload', render: renderUpload }
];

function renderSetupNotice() {
  clear(app);
  app.append(
    el('div', { class: 'login-wrap' }, [
      el('div', { class: 'card login' }, [
        el('h1', { text: 'Not configured yet' }),
        el('p', { class: 'sub', text: 'This build has no Firebase credentials, so there is nothing to sign in to.' }),
        el('p', { class: 'small muted', text: 'Set the VITE_FIREBASE_* variables (see .env.example and the README) as GitHub Actions repository variables, then re-run the deploy workflow.' })
      ])
    ])
  );
}

let teardownView = null;

function renderShell(user) {
  clear(app);

  const tabBar = el('div', { class: 'tabs' });
  const content = el('main');

  const buttons = TABS.map(({ name, label }) =>
    el('button', { text: label, onclick: () => navigate(name) })
  );
  tabBar.append(...buttons);

  app.append(
    el('header', { class: 'topbar' }, [
      el('h1', { text: 'Portugal 2026' }),
      el('span', { class: 'spacer' }),
      el('span', { class: 'who', text: user.email || '' }),
      el('button', { text: 'Sign out', onclick: () => signOut(auth) })
    ]),
    tabBar,
    content
  );

  function show(render) {
    // Views return an optional teardown (Firestore listeners, Leaflet maps).
    // Running it before the next render keeps listeners and maps from leaking.
    teardownView?.();
    teardownView = render(content) || null;
    const active = currentRoute();
    buttons.forEach((button, index) => {
      button.classList.toggle('active', TABS[index].name === active);
    });
    window.scrollTo(0, 0);
  }

  for (const tab of TABS) route(tab.name, () => show(tab.render));
  setFallback(() => navigate('schedule'));
}

if (!isConfigured) {
  renderSetupNotice();
} else {
  let routerStarted = false;

  onAuthStateChanged(auth, (user) => {
    if (user) {
      setCurrentUser(user);
      startPhotoSync();
      renderShell(user);
      // startRouter() attaches the hashchange listener once for the page's
      // lifetime; a later sign-in just re-resolves the current hash against the
      // freshly built shell.
      if (routerStarted) {
        resolve();
      } else {
        startRouter();
        routerStarted = true;
      }
    } else {
      teardownView?.();
      teardownView = null;
      setCurrentUser(null);
      stopPhotoSync();
      renderLogin(app);
    }
  });
}
