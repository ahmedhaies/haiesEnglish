// Tiny hash router.  #/home, #/learn, #/quiz/unit/3 ...
const subs = new Set();

export function currentRoute() {
  const hash = location.hash.replace(/^#\/?/, '');
  const parts = hash.split('/').filter(Boolean);
  return { name: parts[0] || 'home', params: parts.slice(1) };
}
export function navigate(path) {
  const target = '#/' + String(path).replace(/^#?\/?/, '');
  if (location.hash === target) emit();
  else location.hash = target;
}
export function onRoute(cb) { subs.add(cb); return () => subs.delete(cb); }
function emit() { const r = currentRoute(); subs.forEach((f) => f(r)); }
export function startRouter() {
  window.addEventListener('hashchange', emit);
  if (!location.hash) location.replace('#/home');
  else emit();
}
