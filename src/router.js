// Hash routing: GitHub Pages has no server-side rewrite, so path-based routes
// would 404 on refresh. Hashes always resolve to index.html.
const routes = new Map();
let notFound = null;
let current = null;

export function route(name, render) {
  routes.set(name, render);
}

export function setFallback(render) {
  notFound = render;
}

export function currentRoute() {
  return current;
}

export function navigate(name) {
  if (location.hash === '#/' + name) resolve();
  else location.hash = '#/' + name;
}

export function resolve() {
  const name = location.hash.replace(/^#\/?/, '') || 'schedule';
  current = name;
  const render = routes.get(name) || notFound;
  if (render) render();
}

export function startRouter() {
  window.addEventListener('hashchange', resolve);
  resolve();
}
