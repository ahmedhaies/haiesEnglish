// App entry: loads data, renders the shell chrome, and dispatches routes.
import { store } from './store.js';
import { t, setLang, getLang, STRINGS } from './i18n.js';
import { loadData } from './data.js';
import { ICONS } from './icons.js';
import { levelFromXp } from './util.js';
import { navigate, onRoute, startRouter, currentRoute } from './router.js';
import { wireSpeak } from './ui.js';
import { scheduleReminder, checkReminderOnFocus } from './reminders.js';
import { checkBadges } from './achievements.js';

import * as home from './views/home.js';
import * as learn from './views/learn.js';
import * as quiz from './views/quiz.js';
import * as levels from './views/levels.js';
import * as browse from './views/browse.js';
import * as calendar from './views/calendar.js';
import * as stats from './views/stats.js';
import * as achievements from './views/achievements.js';
import * as settings from './views/settings.js';

const VIEWS = { home, learn, quiz, levels, browse, calendar, stats, achievements, settings };

const NAV = [
  { id: 'home', icon: 'home', label: 'nav_home' },
  { id: 'learn', icon: 'learn', label: 'nav_learn' },
  { id: 'levels', icon: 'levels', label: 'nav_levels' },
  { id: 'quiz', icon: 'quiz', label: 'nav_quiz' },
  { id: 'stats', icon: 'stats', label: 'nav_stats' },
];
const SIDE = [
  { id: 'home', icon: 'home', label: 'nav_home' },
  { id: 'learn', icon: 'learn', label: 'nav_learn' },
  { id: 'levels', icon: 'levels', label: 'nav_levels' },
  { id: 'quiz', icon: 'quiz', label: 'nav_quiz' },
  { id: 'browse', icon: 'browse', label: 'nav_browse' },
  { id: 'calendar', icon: 'calendar', label: 'nav_calendar' },
  { id: 'stats', icon: 'stats', label: 'nav_stats' },
  { id: 'achievements', icon: 'badge', label: 'nav_achievements' },
  { id: 'settings', icon: 'settings', label: 'nav_settings' },
];

let deferredInstall = null;

// ---- theme + language ----
function applyChrome() {
  const lang = getLang();
  const conf = STRINGS[lang];
  const root = document.documentElement;
  root.setAttribute('lang', conf.lang);
  root.setAttribute('dir', conf.dir);
  root.setAttribute('data-theme', store.settings.theme || 'auto');
  root.style.setProperty('--dir', conf.dir === 'rtl' ? '-1' : '1');
  const tc = document.querySelector('meta[name="theme-color"]');
  if (tc) tc.setAttribute('content', getComputedStyle(document.body).getPropertyValue('--primary').trim() || '#6366f1');
}

function detectLang() {
  if (store.settings.lang) return store.settings.lang;
  const nav = (navigator.language || 'ar').toLowerCase();
  return nav.startsWith('ar') ? 'ar' : (nav.startsWith('en') ? 'en' : 'ar');
}

// ---- shell ----
function renderShell() {
  const lang = getLang();
  const streak = store.s.streak.current;
  const lvl = levelFromXp(store.s.xp);

  document.getElementById('sidebar').innerHTML = `
    <a class="brand" href="#/home"><svg class="brand-mark" viewBox="0 0 64 64"><defs><linearGradient id="bm" x1="0" y1="0" x2="1" y2="1"><stop offset="0" stop-color="#6366f1"/><stop offset=".5" stop-color="#8b5cf6"/><stop offset="1" stop-color="#ec4899"/></linearGradient></defs><rect x="4" y="4" width="56" height="56" rx="16" fill="url(#bm)"/><path d="M20 44V20h5v9h14v-9h5v24h-5V34H25v10z" fill="#fff"/><circle cx="46" cy="18" r="4" fill="#fde047"/></svg><span class="brand-name"><b>${t('appName')}</b></span></a>
    ${SIDE.map((n) => sideLink(n)).join('')}
    <div class="side-foot">
      <div class="side-stat"><span class="flame">🔥</span> <b>${streak}</b> <span class="muted">${t('streak')}</span></div>
      <div class="side-stat">⭐ <b>${t('level')} ${lvl.level}</b> <span class="muted">· ${store.s.xp} ${t('xp')}</span></div>
      <button class="side-link" id="themebtn" style="width:100%;margin-top:8px">${ICONS.moon}<span>${t('theme')}</span></button>
    </div>`;

  document.getElementById('topbar').innerHTML = `
    <a class="brand" href="#/home"><svg class="brand-mark" viewBox="0 0 64 64"><rect x="4" y="4" width="56" height="56" rx="14" fill="#6366f1"/><path d="M20 44V20h5v9h14v-9h5v24h-5V34H25v10z" fill="#fff"/></svg><span class="brand-name"><b>${t('appName')}</b></span></a>
    <span class="chip on" title="${t('streak')}"><span class="flame">🔥</span> ${streak}</span>
    <button class="icon-btn" id="themebtn2" aria-label="${t('theme')}">${ICONS.moon}</button>
    <button class="icon-btn" id="setbtn" aria-label="${t('settings_title')}" onclick="location.hash='#/settings'">${ICONS.settings}</button>`;

  document.getElementById('bottomnav').innerHTML = NAV.map((n) => `
    <a class="bn-link" href="#/${n.id}" data-nav="${n.id}">${ICONS[n.icon]}<span>${t(n.label)}</span></a>`).join('');

  document.querySelectorAll('#themebtn, #themebtn2').forEach((b) => b.addEventListener('click', toggleTheme));
  updateActiveNav(currentRoute().name);
}

function sideLink(n) {
  return `<a class="side-link" href="#/${n.id}" data-nav="${n.id}">${ICONS[n.icon]}<span>${t(n.label)}</span></a>`;
}

function updateActiveNav(name) {
  document.querySelectorAll('[data-nav]').forEach((a) => a.classList.toggle('active', a.dataset.nav === name));
  document.querySelectorAll('.bn-link').forEach((a) => a.classList.toggle('active', a.dataset.nav === name));
}

function toggleTheme() {
  const order = { auto: 'dark', dark: 'light', light: 'auto' };
  // simplest: flip between light and dark based on current computed
  const cur = store.settings.theme;
  store.settings.theme = cur === 'dark' ? 'light' : 'dark';
  store.save();
  applyChrome();
  renderShell();
}

// ---- routing ----
function dispatch({ name, params }) {
  const view = VIEWS[name] || VIEWS.home;
  const root = document.getElementById('view');
  window.scrollTo({ top: 0, behavior: 'instant' in window ? 'instant' : 'auto' });
  root.innerHTML = '';
  try { view.render(root, params); }
  catch (e) { console.error('view error', e); root.innerHTML = `<div class="empty-state"><div class="em">⚠️</div><p>${e.message}</p></div>`; }
  wireSpeak(root);
  updateActiveNav(name);
}

// public: re-render chrome after progress changes
export function afterAction() { renderShell(); }

// ---- init ----
async function init() {
  setLang(detectLang());
  applyChrome();

  const fill = document.getElementById('loader-fill');
  const sub = document.getElementById('loader-sub');
  if (sub) sub.textContent = t('loading');
  try {
    await loadData((p) => { if (fill) fill.style.width = Math.round(p * 100) + '%'; });
  } catch (e) {
    if (sub) sub.textContent = 'Failed to load data. ' + e.message;
    console.error(e);
    return;
  }

  // comeback badge flag
  if (store.missedDays() >= 3) { store.s._comeback = true; }
  checkBadges();
  store.save();

  document.getElementById('loader').style.display = 'none';
  document.getElementById('app').hidden = false;

  renderShell();
  onRoute((r) => { dispatch(r); });
  startRouter();

  // events
  window.addEventListener('app:refresh', renderShell);
  window.addEventListener('app:theme', () => { applyChrome(); renderShell(); });
  window.addEventListener('app:install', doInstall);
  document.addEventListener('visibilitychange', () => { if (!document.hidden) checkReminderOnFocus(); });

  // reminders
  scheduleReminder();
  checkReminderOnFocus();

  // PWA
  registerSW();
}

// ---- PWA ----
function registerSW() {
  if ('serviceWorker' in navigator) {
    window.addEventListener('load', () => navigator.serviceWorker.register('sw.js').catch(() => {}));
  }
  window.addEventListener('beforeinstallprompt', (e) => { e.preventDefault(); deferredInstall = e; });
}
async function doInstall() {
  if (!deferredInstall) {
    alert(getLang() === 'ar'
      ? 'لتثبيت التطبيق: افتح قائمة المتصفح ثم اختر «إضافة إلى الشاشة الرئيسية».'
      : 'To install: open your browser menu and choose "Add to Home Screen".');
    return;
  }
  deferredInstall.prompt();
  await deferredInstall.userChoice;
  deferredInstall = null;
}

init();
