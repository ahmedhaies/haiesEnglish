// The learning journey: 6 levels (CEFR bands) that tile the whole word set.
// Finishing them all completes the system. Each level drills into its lessons.
import { t, getLang } from '../i18n.js';
import { store } from '../store.js';
import { unitWords, unitRange, wordAt, emojiFor } from '../data.js';
import { navigate } from '../router.js';
import { ICONS } from '../icons.js';
import { ringSVG, animateRings, openWordDetail } from '../ui.js';
import { escapeHtml, fmtNum } from '../util.js';
import { LEVELS, levelName, levelStat, levelEnd, unitsOfLevel, overall, currentLevel, allComplete } from '../levels.js';

export function render(root, params) {
  if (params && params[0] != null) return renderLevel(root, +params[0]);
  renderPath(root);
}

function renderPath(root) {
  const lang = getLang();
  const ov = overall();
  const cur = currentLevel();
  const done = allComplete();

  root.innerHTML = `
    <div class="section-title"><h2>${t('levels_title')}</h2></div>

    <div class="card card-p journey-head">
      ${ringSVG(ov.pct, 128, 13, `<div class="ring-label"><b>${ov.pct}%</b><span>${t('overall_progress')}</span></div>`)}
      <div class="journey-head-info">
        <div class="jh-big"><b data-count="${ov.learned}">0</b> <span>/ ${fmtNum(ov.total)} ${t('words')}</span></div>
        <div class="progressbar" style="height:12px;margin:12px 0"><span style="width:${ov.pct}%"></span></div>
        <div class="muted" style="font-size:.88rem">${done ? t('system_complete') : `${lang === 'ar' ? 'مستواك الحالي' : 'Current level'}: ${cur.emoji} ${cur.cefr} · ${levelName(cur, lang)}`}</div>
      </div>
    </div>

    ${done ? `<div class="card card-p center" style="margin-top:16px;background:var(--grad);color:#fff">
      <div style="font-size:48px">🎓</div><b style="font-size:1.3rem;font-family:var(--font-head)">${t('system_complete')}</b>
      <div style="opacity:.9">${t('system_complete_sub')}</div></div>` : ''}

    <div class="levels-path">
      ${LEVELS.map((lvl, i) => levelCard(lvl, i, lang, cur)).join('')}
    </div>`;

  root.querySelectorAll('[data-level]').forEach((c) => c.addEventListener('click', () => navigate('levels/' + c.dataset.level)));
  animateRings(root);
  root.querySelectorAll('[data-count]').forEach((n) => {
    const to = +n.dataset.count; let s = null;
    const step = (ts) => { if (!s) s = ts; const p = Math.min(1, (ts - s) / 900); n.textContent = Math.round(to * (1 - Math.pow(1 - p, 3))).toLocaleString('en-US'); if (p < 1) requestAnimationFrame(step); };
    requestAnimationFrame(step);
  });
}

function levelCard(lvl, i, lang, cur) {
  const st = levelStat(lvl);
  const end = levelEnd(lvl);
  const isCurrent = lvl.id === cur.id && !st.complete;
  const state = st.complete ? 'complete' : isCurrent ? 'current' : st.started ? 'current' : (lvl.id < cur.id ? 'complete' : 'upcoming');
  const badge = st.complete ? `<span class="lvl-badge done">✅ ${t('level_complete')}</span>`
    : isCurrent ? `<span class="lvl-badge cur">${t('level_current')}</span>` : '';
  return `
    <div class="level-card ${state}" data-level="${lvl.id}" style="--lc:${lvl.color}">
      <div class="level-node">${lvl.emoji}</div>
      <div class="level-body">
        <div class="level-top">
          <b>${t('level')} ${lvl.id} · <span style="color:${lvl.color}">${lvl.cefr}</span> ${levelName(lvl, lang)}</b>
          ${badge}
        </div>
        <div class="muted" style="font-size:.78rem;font-family:var(--font-en);direction:ltr;text-align:${lang === 'ar' ? 'right' : 'left'}">#${lvl.start + 1}–${end} · ${end - lvl.start} ${t('words')}</div>
        <div class="unit-prog" style="margin-top:8px"><span style="width:${st.pct}%;background:${lvl.color}"></span></div>
        <div class="muted" style="font-size:.76rem;margin-top:5px">${st.learned}/${st.size} · ${st.pct}%</div>
      </div>
      <div class="level-chev">${ICONS.chevron}</div>
    </div>`;
}

function renderLevel(root, id) {
  const lang = getLang();
  const lvl = LEVELS.find((l) => l.id === id) || LEVELS[0];
  const st = levelStat(lvl);
  const units = unitsOfLevel(lvl);
  const firstOpen = units.find((u) => {
    for (let i = u.start; i < u.end; i++) if (!store.isSeen(i)) return true;
    return false;
  });

  root.innerHTML = `
    <div class="session-top" style="margin-bottom:16px">
      <button class="icon-btn" data-back>${ICONS.back}</button>
      <b style="flex:1;font-family:var(--font-head);font-size:1.15rem">${lvl.emoji} ${t('level')} ${lvl.id} · ${lvl.cefr} ${levelName(lvl, lang)}</b>
    </div>

    <div class="card card-p" style="display:flex;align-items:center;gap:18px;flex-wrap:wrap">
      ${ringSVG(st.pct, 104, 11, `<div class="ring-label"><b>${st.pct}%</b></div>`)}
      <div style="flex:1;min-width:160px">
        <div class="muted" style="font-size:.9rem">${st.learned} / ${st.size} ${t('learned')}</div>
        <div class="progressbar" style="height:10px;margin-top:8px"><span style="width:${st.pct}%;background:${lvl.color}"></span></div>
      </div>
      ${firstOpen ? `<button class="btn btn-primary" data-study="${firstOpen.unit}">${ICONS.play} ${t('study_level')}</button>` : `<div class="pill-note">${ICONS.check} ${t('level_complete')}</div>`}
    </div>

    <div class="section-title"><h2>${t('lessons')}</h2><span class="muted">${units.length} ${t('lesson')}</span></div>
    <div class="units-grid">
      ${units.map((u) => unitCard(u, lang, lvl)).join('')}
    </div>`;

  root.querySelector('[data-back]').addEventListener('click', () => navigate('levels'));
  root.querySelectorAll('[data-study]').forEach((b) => b.addEventListener('click', (e) => { e.stopPropagation(); navigate('learn/unit/' + b.dataset.study); }));
  root.querySelectorAll('[data-openunit]').forEach((c) => c.addEventListener('click', () => openUnitSheet(+c.dataset.openunit, lvl)));
  animateRings(root);
}

function unitProgress(u) {
  let done = 0, size = u.end - u.start;
  for (let i = u.start; i < u.end; i++) if (['learned', 'mastered'].includes(store.stageOf(i))) done++;
  return { done, size, pct: Math.round((done / size) * 100) };
}

function unitCard(u, lang, lvl) {
  const p = unitProgress(u);
  const n = u.unit + 1;
  return `<div class="unit-card" data-openunit="${u.unit}">
    ${p.pct === 100 ? '<span class="unit-badge">✅</span>' : ''}
    <b>${t('lesson')} ${n}</b>
    <div class="rng">#${u.start + 1}–${u.end}</div>
    <div class="unit-prog"><span style="width:${p.pct}%;background:${lvl.color}"></span></div>
    <div class="muted" style="font-size:.74rem;margin-top:6px">${p.done}/${p.size}</div>
  </div>`;
}

function openUnitSheet(unitIdx, lvl) {
  import('../ui.js').then(({ openSheet, closeSheet }) => {
    const [a, b] = unitRange(unitIdx);
    const idxs = unitWords(unitIdx);
    const p = unitProgress({ start: a, end: b });
    const rows = idxs.map((i) => {
      const rec = wordAt(i); const em = emojiFor(rec.w); const stg = store.stageOf(i);
      return `<div class="wcard" data-idx="${i}"><div class="wcard-ic">${em || `<span style="font-family:var(--font-en);font-weight:800;color:${lvl.color}">${escapeHtml(rec.w[0].toUpperCase())}</span>`}</div>
        <div class="wcard-mid"><div class="wcard-en">${escapeHtml(rec.w)} <span class="stage-dot st-${stg}"></span></div><div class="wcard-def">${escapeHtml(rec.d)}</div></div></div>`;
    }).join('');
    const inner = `
      <h2 style="font-size:1.25rem">${t('lesson')} ${unitIdx + 1}</h2>
      <div class="muted" style="font-family:var(--font-en);direction:ltr">#${a + 1}–${b} · ${p.done}/${p.size} ${t('learned')}</div>
      <div style="display:flex;gap:10px;margin:14px 0">
        <button class="btn btn-primary" style="flex:1" data-studyu>${ICONS.play} ${t('study_unit')}</button>
        <button class="btn btn-ghost" style="flex:1" data-quizu>${ICONS.target} ${t('quiz_unit')}</button>
      </div>
      <div class="wordlist">${rows}</div>`;
    const ov = openSheet(inner);
    ov.querySelector('[data-studyu]').addEventListener('click', () => { closeSheet(); navigate('learn/unit/' + unitIdx); });
    ov.querySelector('[data-quizu]').addEventListener('click', () => { closeSheet(); navigate('quiz/unit/' + unitIdx); });
    ov.querySelectorAll('[data-idx]').forEach((r) => r.addEventListener('click', () => openWordDetail(wordAt(+r.dataset.idx))));
  });
}
