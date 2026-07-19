// Progress dashboard: totals, accuracy, vocabulary growth, activity, and a
// breakdown by part of speech — so effort is always visible.
import { t, getLang } from '../i18n.js';
import { store } from '../store.js';
import { wordAt, total } from '../data.js';
import { navigate } from '../router.js';
import { levelFromXp, fmtNum, dayKey, DAY_MS, POS_META, posLabel } from '../util.js';
import { ringSVG, animateRings, animateCounts } from '../ui.js';

export function render(root) {
  const lang = getLang();
  const c = store.counts();
  const lvl = levelFromXp(store.s.xp);
  const hist = store.s.history;
  const days = Object.entries(hist);
  let correct = 0, tot = 0, ms = 0, bestDay = 0;
  for (const [, h] of days) { correct += h.c; tot += h.t; ms += h.ms; bestDay = Math.max(bestDay, h.n + h.r); }
  const acc = tot ? Math.round((correct / tot) * 100) : 0;
  const mins = Math.round(ms / 60000);
  const timeStr = mins >= 60 ? `${(mins / 60).toFixed(1)}${t('hours')}` : `${mins}${t('minutes_short')}`;
  const activeDays = days.filter(([, h]) => (h.n + h.r) > 0).length;
  const avg = activeDays ? Math.round((c.seen) / activeDays) : 0;
  const pct = total() ? Math.round((c.seen / total()) * 100) : 0;

  root.innerHTML = `
    <div class="section-title"><h2>${t('stats_title')}</h2></div>

    <div class="card card-p" style="display:flex;align-items:center;gap:20px;flex-wrap:wrap;justify-content:center">
      ${ringSVG(lvl.need ? Math.round((lvl.into / lvl.need) * 100) : 100, 128, 12, `<div class="ring-label"><b>${lvl.level}</b><span>${t('level')}</span></div>`)}
      <div style="flex:1;min-width:180px">
        <div class="plan-metrics" style="flex-wrap:wrap;gap:18px">
          <div class="plan-metric"><b class="count" data-count="${store.s.xp}">0</b><span>${t('xp')}</span></div>
          <div class="plan-metric"><b>${lvl.into}/${lvl.need}</b><span>${lang === 'ar' ? 'للمستوى التالي' : 'to next level'}</span></div>
        </div>
        <div class="progressbar" style="margin-top:12px"><span style="width:${lvl.need ? (lvl.into / lvl.need) * 100 : 100}%"></span></div>
      </div>
    </div>

    <div class="tiles" style="margin-top:16px">
      <div class="tile"><div class="tile-ic" style="background:var(--grad)">📚</div><b class="count" data-count="${c.seen}">0</b><span>${t('learned')}</span></div>
      <div class="tile"><div class="tile-ic" style="background:var(--grad-success)">💎</div><b class="count" data-count="${c.mastered}">0</b><span>${t('mastered')}</span></div>
      <div class="tile"><div class="tile-ic" style="background:var(--grad-teal)">🎯</div><b>${acc}%</b><span>${t('accuracy')}</span></div>
      <div class="tile"><div class="tile-ic" style="background:var(--grad-amber)">⏱️</div><b>${timeStr}</b><span>${t('time_studied')}</span></div>
    </div>

    <div class="section-title"><h2>${t('progress')}</h2><span class="muted">${fmtNum(c.seen)} / ${fmtNum(total())}</span></div>
    <div class="card card-p">
      <div class="progressbar" style="height:16px"><span style="width:${pct}%"></span></div>
      <div style="display:flex;justify-content:space-between;margin-top:10px" class="muted">
        <span>🌱 ${c.learning} ${t('filter_learning')}</span>
        <span>🎓 ${c.learned} ${t('filter_learned')}</span>
        <span>💎 ${c.mastered} ${t('filter_mastered')}</span>
      </div>
    </div>

    <div class="section-title"><h2>${t('words_over_time')}</h2></div>
    <div class="card card-p">${areaChart()}</div>

    <div class="section-title"><h2>${t('activity')}</h2></div>
    <div class="card card-p">${activityChart()}</div>

    <div class="section-title"><h2>${t('by_pos')}</h2></div>
    <div class="card card-p">${posChart(lang)}</div>

    <div style="display:flex;gap:16px;margin-top:16px">
      <div class="tile" style="flex:1"><b>${bestDay}</b><span>${t('best_day')}</span></div>
      <div class="tile" style="flex:1"><b>${avg}</b><span>${t('avg_per_day')}</span></div>
    </div>
  `;
  animateRings(root);
  animateCounts(root);
}

function lastDays(n) {
  const out = [];
  const now = new Date();
  for (let i = n - 1; i >= 0; i--) {
    const d = new Date(now.getTime() - i * DAY_MS);
    out.push({ d, h: store.s.history[dayKey(d)] || { n: 0, r: 0, c: 0, t: 0, ms: 0 } });
  }
  return out;
}

function areaChart() {
  const data = lastDays(30);
  let cum = 0;
  const pts = data.map((x) => (cum += x.h.n, cum));
  const max = Math.max(1, cum);
  const W = 600, H = 160, pad = 6;
  if (cum === 0) return `<div class="chart-empty">${emptyMsg()}</div>`;
  const step = (W - pad * 2) / (pts.length - 1 || 1);
  const coords = pts.map((v, i) => [pad + i * step, H - pad - (v / max) * (H - pad * 2)]);
  const line = coords.map((c, i) => (i ? 'L' : 'M') + c[0].toFixed(1) + ' ' + c[1].toFixed(1)).join(' ');
  const area = `${line} L ${coords[coords.length - 1][0].toFixed(1)} ${H - pad} L ${pad} ${H - pad} Z`;
  return `<svg class="chart" viewBox="0 0 ${W} ${H}" preserveAspectRatio="none" style="height:170px">
    <defs>
      <linearGradient id="areagrad" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#6366f1" stop-opacity=".45"/><stop offset="1" stop-color="#6366f1" stop-opacity="0"/></linearGradient>
      <linearGradient id="linegrad" x1="0" y1="0" x2="1" y2="0"><stop offset="0" stop-color="#6366f1"/><stop offset="1" stop-color="#ec4899"/></linearGradient>
    </defs>
    <path d="${area}" fill="url(#areagrad)"/>
    <path d="${line}" fill="none" stroke="url(#linegrad)" stroke-width="3" stroke-linecap="round" stroke-linejoin="round"/>
  </svg>
  <div class="muted center" style="font-size:.8rem;margin-top:6px">${getLang() === 'ar' ? 'إجمالي الكلمات خلال 30 يومًا' : 'Cumulative words · last 30 days'}</div>`;
}

function activityChart() {
  const data = lastDays(14);
  const max = Math.max(1, ...data.map((x) => x.h.n + x.h.r));
  if (max === 1 && data.every((x) => x.h.n + x.h.r === 0)) return `<div class="chart-empty">${emptyMsg()}</div>`;
  const W = 560, H = 140, gap = 8;
  const bw = (W - gap * (data.length - 1)) / data.length;
  let bars = '';
  data.forEach((x, i) => {
    const v = x.h.n + x.h.r;
    const h = (v / max) * (H - 24);
    const xx = i * (bw + gap);
    bars += `<rect x="${xx}" y="${H - 20 - h}" width="${bw}" height="${Math.max(2, h)}" rx="4" fill="url(#bargrad)"/>`;
    bars += `<text x="${xx + bw / 2}" y="${H - 6}" text-anchor="middle" font-size="9" fill="var(--muted)">${x.d.getDate()}</text>`;
  });
  return `<svg class="chart" viewBox="0 0 ${W} ${H}" style="height:150px">
    <defs><linearGradient id="bargrad" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#8b5cf6"/><stop offset="1" stop-color="#6366f1"/></linearGradient></defs>
    ${bars}
  </svg>`;
}

function posChart(lang) {
  const counts = {};
  for (const idx in store.s.srs) {
    const p = wordAt(+idx).p; counts[p] = (counts[p] || 0) + 1;
  }
  const entries = Object.entries(counts).sort((a, b) => b[1] - a[1]).slice(0, 6);
  if (!entries.length) return `<div class="chart-empty">${emptyMsg()}</div>`;
  const max = Math.max(...entries.map((e) => e[1]));
  return `<div style="display:grid;gap:10px">${entries.map(([p, n]) => `
    <div style="display:flex;align-items:center;gap:10px">
      <span style="width:74px;font-size:.85rem;font-weight:600">${posLabel(p, lang)}</span>
      <div style="flex:1;height:14px;background:var(--surface-2);border-radius:99px;overflow:hidden">
        <div style="width:${(n / max) * 100}%;height:100%;background:${(POS_META[p] || {}).c || 'var(--primary)'};border-radius:99px"></div>
      </div>
      <b style="width:40px;text-align:end;font-variant-numeric:tabular-nums">${n}</b>
    </div>`).join('')}</div>`;
}

function emptyMsg() {
  return getLang() === 'ar' ? 'ابدأ المذاكرة لترى تقدّمك هنا 📈' : 'Start studying to see your progress here 📈';
}
