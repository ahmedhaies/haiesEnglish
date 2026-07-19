// Search & browse every word, with learning-stage filters. (Units/lessons now
// live inside Levels.)
import { t, getLang } from '../i18n.js';
import { store } from '../store.js';
import { words, wordAt, total } from '../data.js';
import { ICONS } from '../icons.js';
import { escapeHtml, fmtNum, posColor } from '../util.js';
import { openWordDetail, wordThumb } from '../ui.js';

const PAGE = 60;
let state = { q: '', filter: 'all', shown: PAGE };

export function render(root) {
  root.innerHTML = `
    <div class="section-title"><h2>${t('nav_browse')}</h2><span class="muted">${fmtNum(total())} ${t('words')}</span></div>
    <div class="searchbar">${ICONS.browse}<input id="q" placeholder="${t('search_placeholder')}" value="${escapeHtml(state.q)}" autocomplete="off" /></div>
    <div class="segment" id="filt" style="margin-bottom:14px;flex-wrap:wrap">
      ${['all', 'new', 'learning', 'learned', 'mastered'].map((f) => `<button data-v="${f}" class="${state.filter === f ? 'on' : ''}">${t('filter_' + f)}</button>`).join('')}
    </div>
    <div class="wordlist wordlist-2" id="list"></div>
    <div id="more" style="text-align:center;margin-top:16px"></div>`;

  const input = root.querySelector('#q');
  input.addEventListener('input', () => { state.q = input.value.trim().toLowerCase(); state.shown = PAGE; paint(root); });
  root.querySelector('#filt').querySelectorAll('button').forEach((b) => b.addEventListener('click', () => {
    state.filter = b.dataset.v; state.shown = PAGE;
    root.querySelector('#filt').querySelectorAll('button').forEach((x) => x.classList.remove('on'));
    b.classList.add('on'); paint(root);
  }));
  paint(root);
}

function matches(rec, i) {
  if (state.filter !== 'all' && store.stageOf(i) !== state.filter) return false;
  if (!state.q) return true;
  return rec.w.includes(state.q) || (rec.d && rec.d.toLowerCase().includes(state.q));
}

function paint(root) {
  const all = words();
  const results = [];
  for (let i = 0; i < all.length; i++) {
    if (matches(all[i], i)) results.push(i);
    if (results.length > state.shown + 1) break;
  }
  const list = root.querySelector('#list');
  const slice = results.slice(0, state.shown);
  list.innerHTML = slice.length ? slice.map(wordRow).join('') : `<div class="empty-state"><div class="em">🔍</div><p class="muted">${t('no_results')}</p></div>`;
  list.querySelectorAll('[data-idx]').forEach((r) => r.addEventListener('click', () => openWordDetail(wordAt(+r.dataset.idx))));
  const more = root.querySelector('#more');
  more.innerHTML = results.length > state.shown ? `<button class="btn btn-ghost" id="loadmore">${getLang() === 'ar' ? 'عرض المزيد' : 'Load more'}</button>` : '';
  const lm = more.querySelector('#loadmore');
  if (lm) lm.addEventListener('click', () => { state.shown += PAGE; paint(root); });
}

function wordRow(i) {
  const rec = wordAt(i);
  const stage = store.stageOf(i);
  return `<div class="wcard" data-idx="${i}">
    <div class="wcard-ic">${wordThumb(rec)}</div>
    <div class="wcard-mid">
      <div class="wcard-en">${escapeHtml(rec.w)} <span class="stage-dot st-${stage}" style="display:inline-block;vertical-align:middle"></span></div>
      <div class="wcard-def">${escapeHtml(rec.d)}</div>
    </div>
    <div class="wcard-rank">#${i + 1}</div>
  </div>`;
}
