// Best-effort daily study reminder. A static site can't guarantee background
// push, so this fires while the app/PWA can run: it schedules a notification at
// the chosen time and nudges on return if today's goal isn't met yet.
import { store } from './store.js';
import { t, getLang } from './i18n.js';
import { dayKey } from './util.js';
import { todayStats } from './session.js';

let timer = null;

export async function requestReminder() {
  if (!('Notification' in window)) return false;
  if (Notification.permission === 'granted') return true;
  if (Notification.permission === 'denied') return false;
  try { return (await Notification.requestPermission()) === 'granted'; }
  catch { return false; }
}

function studiedToday() {
  const h = todayStats();
  return (h.n + h.r) > 0;
}

function notify() {
  if (studiedToday()) return;
  const key = dayKey();
  if (store.s._lastReminder === key) return;
  store.s._lastReminder = key; store.flush();
  const title = getLang() === 'ar' ? '🔥 وقت المذاكرة!' : '🔥 Time to study!';
  const body = getLang() === 'ar' ? 'حافظ على سلسلتك — بضع كلمات فقط اليوم.' : 'Keep your streak alive — just a few words today.';
  try {
    if ('Notification' in window && Notification.permission === 'granted') {
      new Notification(title, { body, icon: 'assets/icon-192.png', badge: 'assets/icon-192.png' });
    }
  } catch { /* ignore */ }
}

function msUntil(hhmm) {
  const [h, m] = hhmm.split(':').map(Number);
  const now = new Date();
  const target = new Date(now);
  target.setHours(h, m, 0, 0);
  if (target <= now) target.setDate(target.getDate() + 1);
  return target - now;
}

export function scheduleReminder() {
  clearTimeout(timer);
  const s = store.settings;
  if (!s.reminderEnabled) return;
  const wait = Math.min(msUntil(s.reminderTime), 2 ** 31 - 1);
  timer = setTimeout(() => { notify(); scheduleReminder(); }, wait);
}

// Called on load / when tab becomes visible: if the reminder time already
// passed today and nothing was studied, nudge once.
export function checkReminderOnFocus() {
  const s = store.settings;
  if (!s.reminderEnabled) return;
  const [h, m] = s.reminderTime.split(':').map(Number);
  const now = new Date();
  const passed = now.getHours() > h || (now.getHours() === h && now.getMinutes() >= m);
  if (passed) notify();
}
