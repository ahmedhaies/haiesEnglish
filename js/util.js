// Small shared helpers.
export const DAY_MS = 86400000;

// Integer day number in the user's LOCAL timezone (stable across a day).
export function dayNum(d = new Date()) {
  return Math.floor((d.getTime() - d.getTimezoneOffset() * 60000) / DAY_MS);
}
export function dayKey(d = new Date()) {
  const n = new Date(d.getTime() - d.getTimezoneOffset() * 60000);
  return n.toISOString().slice(0, 10);
}
export function dateFromDayNum(n) {
  return new Date(n * DAY_MS + new Date().getTimezoneOffset() * 60000);
}
export function clamp(v, lo, hi) { return Math.max(lo, Math.min(hi, v)); }

export function shuffle(arr) {
  const a = arr.slice();
  for (let i = a.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [a[i], a[j]] = [a[j], a[i]];
  }
  return a;
}
export function sample(arr, n) { return shuffle(arr).slice(0, n); }

export function debounce(fn, ms) {
  let t;
  return (...args) => { clearTimeout(t); t = setTimeout(() => fn(...args), ms); };
}

// Level curve from XP (gentle exponential).
export function levelFromXp(xp) {
  let level = 1, need = 100, acc = 0;
  while (xp >= acc + need) { acc += need; level++; need = Math.round(need * 1.35); }
  return { level, into: xp - acc, need, floor: acc };
}

export function fmtNum(n) { return (n || 0).toLocaleString('en-US'); }

export function escapeHtml(s) {
  return String(s == null ? '' : s).replace(/[&<>"']/g, (c) => (
    { '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]
  ));
}

// Part-of-speech display metadata (short code -> {ar, en, color})
export const POS_META = {
  n:    { ar: 'اسم',      en: 'noun',        c: '#6366f1' },
  v:    { ar: 'فعل',      en: 'verb',        c: '#ec4899' },
  adj:  { ar: 'صفة',      en: 'adjective',   c: '#14b8a6' },
  adv:  { ar: 'ظرف',      en: 'adverb',      c: '#f59e0b' },
  pron: { ar: 'ضمير',     en: 'pronoun',     c: '#8b5cf6' },
  prep: { ar: 'حرف جر',   en: 'preposition', c: '#0ea5e9' },
  conj: { ar: 'أداة ربط', en: 'conjunction', c: '#22c55e' },
  interj:{ar: 'تعجب',     en: 'interjection',c: '#ef4444' },
  art:  { ar: 'أداة',     en: 'article',     c: '#64748b' },
  det:  { ar: 'محدِّد',    en: 'determiner',  c: '#64748b' },
  phr:  { ar: 'تعبير',    en: 'phrase',      c: '#a855f7' },
};
export function posLabel(code, lang) {
  const m = POS_META[code];
  if (!m) return code || '';
  return lang === 'ar' ? m.ar : m.en;
}
export function posColor(code) { return (POS_META[code] || {}).c || '#6366f1'; }
