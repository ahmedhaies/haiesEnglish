// Dashboard — greeting, streak, today's plan, progress, quick actions, badges.
import { t, getLang } from '../i18n.js';
import { store } from '../store.js';
import { total } from '../data.js';
import { navigate } from '../router.js';
import { ICONS } from '../icons.js';
import { levelFromXp, fmtNum } from '../util.js';
import { ringSVG, animateRings, animateCounts, greeting } from '../ui.js';
import { todayGoal } from '../session.js';
import { BADGES, badgeName } from '../achievements.js';

export function render(root) {
  const lang = getLang();
  const c = store.counts();
  const lvl = levelFromXp(store.s.xp);
  const g = todayGoal();
  const missed = store.missedDays();
  const pct = total() ? Math.round((c.seen / total()) * 100) : 0;
  const goalPct = g.remaining <= 0 && g.doneCount > 0 ? 100
    : Math.min(100, Math.round((g.doneCount / Math.max(1, g.doneCount + g.remaining)) * 100));

  const streakN = store.s.streak.current;
  const enc = (STRINGS_pick());

  root.innerHTML = `
    <section class="hero">
      <div class="hero-greet">${greeting()} 👋</div>
      <h1>${t('tagline')}</h1>
      <div class="hero-row">
        <span class="hero-pill"><span class="flame">🔥</span> ${streakN} ${streakN === 1 ? t('day') : t('days')} · ${t('streak')}</span>
        <span class="hero-pill">⭐ ${t('level')} ${lvl.level}</span>
        <span class="hero-pill">✨ ${fmtNum(store.s.xp)} ${t('xp')}</span>
      </div>
    </section>

    ${missed >= 2 ? `<div class="card card-p" style="margin-top:16px;border:1px solid var(--amber)">
      <div style="display:flex;gap:12px;align-items:center">
        <div style="font-size:34px">🫂</div>
        <div style="flex:1"><b>${t('welcome_back')}</b><div class="muted" style="font-size:.9rem">${t('catch_up_msg')}</div></div>
      </div>
      <button class="btn btn-primary btn-block" style="margin-top:14px" data-go="learn">${t('catch_up')} · ${store.dueCount()} ${t('reviews')}</button>
    </div>` : ''}

    <div class="card card-p" style="margin-top:16px">
      <div class="plan">
        ${ringSVG(goalPct, 116, 12, `<div class="ring-label"><b>${goalPct}%</b><span>${t('today_plan')}</span></div>`)}
        <div class="plan-metrics">
          <div class="plan-metric"><b class="count" style="color:var(--primary)">${g.due}</b><span>${t('due_now')}</span></div>
          <div class="plan-metric"><b class="count" style="color:var(--accent)">${Math.min(g.newLeft, store.settings.wordsPerDay)}</b><span>${t('new_words')}</span></div>
        </div>
      </div>
      <div style="margin-top:16px">
        ${g.remaining > 0
      ? `<button class="btn btn-primary btn-lg btn-block" data-go="learn" style="white-space:normal">${ICONS.play} ${g.doneCount > 0 ? t('continue_session') : t('start_session')}</button>`
      : `<div class="pill-note" style="justify-content:center">${ICONS.check} ${t('all_done_today')}</div>
         <button class="btn btn-soft btn-block" style="margin-top:10px" data-go="learn">${t('review_more')}</button>`}
      </div>
    </div>

    <div class="tiles" style="margin-top:16px">
      <div class="tile"><div class="tile-ic" style="background:var(--grad)">${wIcon(ICONS.book)}</div><b class="count" data-count="${c.seen}">0</b><span>${t('learned')}</span></div>
      <div class="tile"><div class="tile-ic" style="background:var(--grad-success)">💎</div><b class="count" data-count="${c.mastered}">0</b><span>${t('mastered')}</span></div>
      <div class="tile"><div class="tile-ic" style="background:var(--grad-amber)">🔥</div><b class="count" data-count="${store.s.streak.longest}">0</b><span>${t('longest')}</span></div>
      <div class="tile"><div class="tile-ic" style="background:var(--grad-teal)">📚</div><b>${pct}%</b><span>${t('progress')}</span></div>
    </div>

    <div class="section-title"><h2>${t('quiz_title')}</h2><a class="link" data-go="quiz">${t('quiz_start')} ${ICONS.chevron}</a></div>
    <div class="grid" style="grid-template-columns:1fr 1fr">
      <button class="card card-p" style="text-align:start" data-go="quiz">
        <div style="font-size:30px">🎯</div><b style="display:block;margin-top:6px">${t('quiz_choose_meaning')}</b>
        <span class="muted" style="font-size:.85rem">${t('quiz_intro')}</span>
      </button>
      <button class="card card-p" style="text-align:start" data-go="browse">
        <div style="font-size:30px">🔎</div><b style="display:block;margin-top:6px">${t('browse_all')}</b>
        <span class="muted" style="font-size:.85rem">${fmtNum(total())} ${t('words')}</span>
      </button>
    </div>

    <div class="section-title"><h2>${t('achievements_title')}</h2><a class="link" data-go="achievements">${t('nav_achievements')} ${ICONS.chevron}</a></div>
    <div class="grid" style="grid-auto-flow:column;grid-auto-columns:minmax(120px,1fr);overflow-x:auto;padding-bottom:6px">
      ${recentBadges(lang)}
    </div>

    <div class="pill-note" style="margin:22px auto 0;justify-content:center;text-align:center;display:flex">${enc}</div>
  `;

  root.querySelectorAll('[data-go]').forEach((b) => b.addEventListener('click', () => navigate(b.dataset.go)));
  animateRings(root);
  animateCounts(root);
}

function wIcon(svg) { return `<span style="color:#fff;display:grid;place-content:center">${svg}</span>`; }

function recentBadges(lang) {
  const unlocked = BADGES.filter((b) => store.s.achievements[b.id]);
  const next = BADGES.filter((b) => !store.s.achievements[b.id]).slice(0, 2);
  const show = [...unlocked.slice(-3), ...next].slice(0, 4);
  if (!show.length) return `<div class="muted">${t('keep_going')}</div>`;
  return show.map((b) => {
    const on = !!store.s.achievements[b.id];
    return `<div class="badge ${on ? 'unlocked' : 'locked'}" style="min-width:120px"><span class="badge-ic">${b.icon}</span><b style="font-size:.85rem">${badgeName(b, lang)}</b></div>`;
  }).join('');
}

function STRINGS_pick() {
  const arr = t('encourage');
  if (!Array.isArray(arr)) return '';
  return arr[Math.floor(Math.random() * arr.length)];
}
