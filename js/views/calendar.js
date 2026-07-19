// Study calendar: a month grid + a GitHub-style activity heatmap so progress
// is visible and missed days are gently surfaced for catch-up.
import { t, getLang } from '../i18n.js';
import { store } from '../store.js';
import { navigate } from '../router.js';
import { ICONS } from '../icons.js';
import { dayKey, DAY_MS } from '../util.js';

let cursor = new Date();

export function render(root) {
  const lang = getLang();
  cursor = new Date();
  const hist = store.s.history;
  const activeDays = Object.values(hist).filter((h) => (h.n + h.r) > 0).length;
  const missed = store.missedDays();

  root.innerHTML = `
    <div class="section-title"><h2>${t('calendar_title')}</h2></div>

    ${missed >= 2 ? `<div class="card card-p" style="border:1px solid var(--amber);margin-bottom:16px">
      <b>🫂 ${t('missed_days')}: ${missed}</b>
      <div class="muted" style="font-size:.9rem;margin-top:2px">${t('catch_up_msg')}</div>
      <button class="btn btn-primary btn-block" style="margin-top:12px" data-go="learn">${t('catch_up')}</button>
    </div>` : ''}

    <div class="tiles" style="margin-bottom:16px">
      <div class="tile"><div class="tile-ic" style="background:var(--grad-amber)">🔥</div><b>${store.s.streak.current}</b><span>${t('streak')}</span></div>
      <div class="tile"><div class="tile-ic" style="background:var(--grad-success)">✅</div><b>${activeDays}</b><span>${t('active_days')}</span></div>
    </div>

    <div class="cal-cols">
      <div class="cal" id="monthcal"></div>
      <div class="cal" id="heat"></div>
    </div>`;

  root.querySelectorAll('[data-go]').forEach((b) => b.addEventListener('click', () => navigate(b.dataset.go)));
  drawMonth(root.querySelector('#monthcal'));
  drawHeat(root.querySelector('#heat'));
}

function monthName(d, lang) {
  return d.toLocaleDateString(lang === 'ar' ? 'ar-EG' : 'en-US', { month: 'long', year: 'numeric' });
}

function drawMonth(host) {
  const lang = getLang();
  const y = cursor.getFullYear(), m = cursor.getMonth();
  const first = new Date(y, m, 1);
  const startDow = first.getDay(); // 0 Sun
  const days = new Date(y, m + 1, 0).getDate();
  const todayKey = dayKey();
  const dows = lang === 'ar' ? ['أحد', 'اثن', 'ثلا', 'أرب', 'خمي', 'جمع', 'سبت'] : ['S', 'M', 'T', 'W', 'T', 'F', 'S'];

  let cells = dows.map((d) => `<div class="dow">${d}</div>`).join('');
  for (let i = 0; i < startDow; i++) cells += `<div class="mday empty"></div>`;
  for (let d = 1; d <= days; d++) {
    const key = keyOf(y, m, d);
    const h = store.s.history[key];
    const done = h && (h.n + h.r) > 0;
    const isToday = key === todayKey;
    cells += `<div class="mday ${done ? 'done' : ''} ${isToday ? 'today' : ''}" title="${key}${h ? ` · ${h.n + h.r}` : ''}">${d}${done ? '<span class="dot"></span>' : ''}</div>`;
  }

  host.innerHTML = `
    <div class="cal-head">
      <button class="icon-btn" data-prev>${ICONS.chevron}</button>
      <b>${monthName(cursor, lang)}</b>
      <button class="icon-btn" data-next style="transform:scaleX(-1)">${ICONS.chevron}</button>
    </div>
    <div class="month">${cells}</div>`;
  // In RTL the chevrons visually flip via layout; ensure prev goes back
  host.querySelector('[data-prev]').addEventListener('click', () => { cursor = new Date(y, m - 1, 1); drawMonth(host); });
  host.querySelector('[data-next]').addEventListener('click', () => { cursor = new Date(y, m + 1, 1); drawMonth(host); });
}

function keyOf(y, m, d) {
  const dt = new Date(y, m, d);
  return dayKey(dt);
}

function drawHeat(host) {
  const lang = getLang();
  const weeks = 18;
  const today = new Date();
  // align to end of current week (Saturday)
  const end = new Date(today);
  end.setDate(end.getDate() + (6 - end.getDay()));
  const totalDays = weeks * 7;
  let cells = '';
  let max = 1;
  const vals = [];
  for (let i = totalDays - 1; i >= 0; i--) {
    const d = new Date(end.getTime() - i * DAY_MS);
    const h = store.s.history[dayKey(d)];
    const v = h ? h.n + h.r : 0;
    vals.push({ d, v });
    if (v > max) max = v;
  }
  for (const { d, v } of vals) {
    const lvl = v === 0 ? 0 : v >= max * 0.75 ? 4 : v >= max * 0.5 ? 3 : v >= max * 0.25 ? 2 : 1;
    cells += `<div class="cal-cell" data-l="${lvl}" title="${dayKey(d)}${v ? ` · ${v}` : ''}"></div>`;
  }
  host.innerHTML = `
    <div class="cal-head"><b>${t('activity')}</b><span class="muted" style="font-size:.82rem">${lang === 'ar' ? 'آخر 18 أسبوعًا' : 'Last 18 weeks'}</span></div>
    <div class="cal-grid">${cells}</div>
    <div class="cal-legend"><span>${t('calendar_legend_less')}</span>
      <div class="cal-cell" data-l="0"></div><div class="cal-cell" data-l="1"></div><div class="cal-cell" data-l="2"></div><div class="cal-cell" data-l="3"></div><div class="cal-cell" data-l="4"></div>
      <span>${t('calendar_legend_more')}</span></div>`;
}
