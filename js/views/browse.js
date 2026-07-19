// Browse & search all words, grouped into units, with learning-stage filters.
import { t, getLang } from '../i18n.js';
import { store } from '../store.js';
import { words, wordAt, total, unitCount, unitRange, unitWords, emojiFor } from '../data.js';
import { navigate } from '../router.js';
import { ICONS } from '../icons.js';
import { escapeHtml, fmtNum, posColor } from '../util.js';
import { openWordDetail, openSheet, closeSheet, wireSpeak } from '../ui.js';

const PAGE = 50;
let state = { tab: 'units', q: '', filter: 'all', shown: PAGE };

export function render(root) {
  root.innerHTML = `
    <div class="section-title"><h2>${t('nav_browse')}</h2><span class="muted">${fmtNum(total())} ${t('words')}</span></div>
    <div class="segment" id="btab" style="margin-bottom:16px">
      <button data-v="units" class="${state.tab === 'units' ? 'on' : ''}">🧩 ${t('units')}</button>
      <button data-v="all" class="${state.tab === 'all' ? 'on' : ''}">📋 ${t('browse_all')}</button>
    </div>
    <div id="bbody"></div>`;
  root.querySelector('#btab').querySelectorAll('button').forEach((b) => b.addEventListener('click', () => {
    state.tab = b.dataset.v; state.shown = PAGE; render(root);
  }));
  if (state.tab === 'units') renderUnits(root.querySelector('#bbody'));
  else renderAll(root.querySelector('#bbody'));
}

function unitProgress(u) {
  const idxs = unitWords(u);
  let done = 0;
  for (const i of idxs) if (['learned', 'mastered'].includes(store.stageOf(i))) done++;
  return { done, total: idxs.length, pct: Math.round((done / idxs.length) * 100) };
}

function renderUnits(host) {
  const uc = unitCount();
  let html = '<div class="units-grid">';
  for (let u = 0; u < uc; u++) {
    const [a, b] = unitRange(u);
    const p = unitProgress(u);
    const mastered = p.pct === 100;
    html += `<div class="unit-card" data-unit="${u}">
      ${mastered ? '<span class="unit-badge">✅</span>' : ''}
      <b>${t('unit')} ${u + 1}</b>
      <div class="rng">#${a + 1}–${b}</div>
      <div class="unit-prog"><span style="width:${p.pct}%"></span></div>
      <div class="muted" style="font-size:.74rem;margin-top:6px">${p.done}/${p.total}</div>
    </div>`;
  }
  html += '</div>';
  host.innerHTML = html;
  host.querySelectorAll('[data-unit]').forEach((c) => c.addEventListener('click', () => openUnit(+c.dataset.unit)));
}

function openUnit(u) {
  const [a, b] = unitRange(u);
  const idxs = unitWords(u);
  const p = unitProgress(u);
  const list = idxs.map((i) => wordRow(i)).join('');
  const inner = `
    <div style="display:flex;align-items:center;justify-content:space-between;margin-bottom:6px">
      <div><h2 style="font-size:1.3rem">${t('unit')} ${u + 1}</h2><div class="muted" style="font-family:var(--font-en)">#${a + 1}–${b} · ${p.done}/${p.total} ${t('learned')}</div></div>
    </div>
    <button class="btn btn-primary btn-block" data-quiz style="margin:6px 0 16px">${ICONS.target} ${t('quiz_unit')}</button>
    <div class="wordlist">${list}</div>`;
  const ov = openSheet(inner);
  ov.querySelector('[data-quiz]').addEventListener('click', () => { closeSheet(); navigate('quiz/unit/' + u); });
  wireRows(ov);
}

function renderAll(host) {
  const lang = getLang();
  host.innerHTML = `
    <div class="searchbar">${ICONS.browse}<input id="q" placeholder="${t('search_placeholder')}" value="${escapeHtml(state.q)}" /></div>
    <div class="segment" id="filt" style="margin-bottom:14px;flex-wrap:wrap">
      ${['all', 'new', 'learning', 'learned', 'mastered'].map((f) => `<button data-v="${f}" class="${state.filter === f ? 'on' : ''}">${t('filter_' + f)}</button>`).join('')}
    </div>
    <div class="wordlist" id="list"></div>
    <div id="more" style="text-align:center;margin-top:16px"></div>`;

  const input = host.querySelector('#q');
  input.addEventListener('input', () => { state.q = input.value.trim().toLowerCase(); state.shown = PAGE; paint(host); });
  host.querySelector('#filt').querySelectorAll('button').forEach((b) => b.addEventListener('click', () => {
    state.filter = b.dataset.v; state.shown = PAGE;
    host.querySelector('#filt').querySelectorAll('button').forEach((x) => x.classList.remove('on'));
    b.classList.add('on'); paint(host);
  }));
  paint(host);
}

function matches(rec, i) {
  if (state.filter !== 'all' && store.stageOf(i) !== state.filter) return false;
  if (!state.q) return true;
  return rec.w.includes(state.q) || (rec.d && rec.d.toLowerCase().includes(state.q));
}

function paint(host) {
  const all = words();
  const results = [];
  for (let i = 0; i < all.length; i++) {
    if (matches(all[i], i)) results.push(i);
    if (results.length > state.shown + 1) break; // enough for this page (+flag)
  }
  // For accurate "load more", recount lazily only when needed
  const list = host.querySelector('#list');
  const slice = results.slice(0, state.shown);
  list.innerHTML = slice.length ? slice.map(wordRow).join('') : `<div class="empty-state"><div class="em">🔍</div><p class="muted">${t('no_results')}</p></div>`;
  wireRows(host);
  const more = host.querySelector('#more');
  more.innerHTML = results.length > state.shown ? `<button class="btn btn-ghost" id="loadmore">${getLang() === 'ar' ? 'عرض المزيد' : 'Load more'}</button>` : '';
  const lm = more.querySelector('#loadmore');
  if (lm) lm.addEventListener('click', () => { state.shown += PAGE; paint(host); });
}

function wordRow(i) {
  const rec = wordAt(i);
  const em = emojiFor(rec.w);
  const stage = store.stageOf(i);
  return `<div class="wcard" data-idx="${i}">
    <div class="wcard-ic">${em || `<span style="font-family:var(--font-en);font-weight:800;color:${posColor(rec.p)}">${escapeHtml(rec.w[0].toUpperCase())}</span>`}</div>
    <div class="wcard-mid">
      <div class="wcard-en">${escapeHtml(rec.w)} <span class="stage-dot st-${stage}" style="display:inline-block;vertical-align:middle"></span></div>
      <div class="wcard-def">${escapeHtml(rec.d)}</div>
    </div>
    <div class="wcard-rank">#${i + 1}</div>
  </div>`;
}

function wireRows(scope) {
  scope.querySelectorAll('[data-idx]').forEach((r) => r.addEventListener('click', () => openWordDetail(wordAt(+r.dataset.idx))));
}
