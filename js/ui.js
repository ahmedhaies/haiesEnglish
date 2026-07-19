// Shared UI helpers used across views: element builder, bottom sheet/modal,
// progress ring, animated counters, and the word-detail card.
import { t, getLang } from './i18n.js';
import { emojiFor, iconFor } from './data.js';
import { store } from './store.js';
import { posLabel, posColor, escapeHtml } from './util.js';
import { speak, canSpeak, speakSequence } from './speech.js';
import { ICONS } from './icons.js';

// Build a DOM node from an HTML string (single root).
export function el(html) {
  const tpl = document.createElement('template');
  tpl.innerHTML = html.trim();
  return tpl.content.firstElementChild;
}

// Progress ring SVG (returns markup). pct 0..100
export function ringSVG(pct, size = 118, stroke = 11, center = '') {
  const r = (size - stroke) / 2;
  const c = 2 * Math.PI * r;
  const off = c * (1 - Math.max(0, Math.min(1, pct / 100)));
  return `<div class="ring" style="width:${size}px;height:${size}px">
    <svg width="${size}" height="${size}">
      <defs><linearGradient id="ringgrad" x1="0" y1="0" x2="1" y2="1">
        <stop offset="0" stop-color="#6366f1"/><stop offset=".6" stop-color="#8b5cf6"/><stop offset="1" stop-color="#ec4899"/>
      </linearGradient></defs>
      <circle class="ring-track" cx="${size / 2}" cy="${size / 2}" r="${r}" fill="none" stroke-width="${stroke}"/>
      <circle class="ring-val" cx="${size / 2}" cy="${size / 2}" r="${r}" fill="none" stroke-width="${stroke}"
        stroke-dasharray="${c}" stroke-dashoffset="${c}" data-off="${off}"/>
    </svg>
    <div class="ring-label">${center}</div>
  </div>`;
}
// Animate any freshly-inserted rings inside `scope`.
export function animateRings(scope) {
  scope.querySelectorAll('.ring-val').forEach((c) => {
    requestAnimationFrame(() => { c.style.strokeDashoffset = c.dataset.off; });
  });
}

export function countUp(node, to, dur = 900) {
  const start = performance.now();
  const from = 0;
  function step(now) {
    const p = Math.min(1, (now - start) / dur);
    const e = 1 - Math.pow(1 - p, 3);
    node.textContent = Math.round(from + (to - from) * e).toLocaleString('en-US');
    if (p < 1) requestAnimationFrame(step);
  }
  requestAnimationFrame(step);
}
export function animateCounts(scope) {
  scope.querySelectorAll('[data-count]').forEach((n) => countUp(n, +n.dataset.count));
}

// ---- Bottom sheet / modal ----
let overlay = null;
export function openSheet(innerHTML, { center = false } = {}) {
  closeSheet();
  overlay = el(`<div class="overlay${center ? ' center' : ''}"><div class="sheet">${center ? '' : '<div class="sheet-handle"></div>'}${innerHTML}</div></div>`);
  overlay.addEventListener('click', (e) => { if (e.target === overlay) closeSheet(); });
  document.body.appendChild(overlay);
  document.body.style.overflow = 'hidden';
  return overlay;
}
export function closeSheet() {
  if (overlay) { overlay.remove(); overlay = null; document.body.style.overflow = ''; }
}

// Highlight the target word inside an example sentence.
export function highlightExample(ex, word) {
  if (!ex) return '';
  const safe = escapeHtml(ex);
  try {
    const stem = word.replace(/(e|y)$/, '');
    const re = new RegExp(`\\b(${word}|${stem}\\w{0,3})\\b`, 'ig');
    return safe.replace(re, '<em>$1</em>');
  } catch { return safe; }
}

// Big visual for a word: emoji → line icon (tinted) → colored letter tile.
// Every word gets a clean visual, so no card is ever bare.
export function wordVisual(rec, big = true) {
  const em = emojiFor(rec.w);
  if (em) return `<div class="word-emoji">${em}</div>`;
  const col = posColor(rec.p);
  const path = iconFor(rec.w);
  if (path) return `<div class="word-icon" style="--vc:${col}"><svg viewBox="0 0 24 24" aria-hidden="true"><path d="${path}"/></svg></div>`;
  return `<div class="word-tile" style="background:linear-gradient(135deg,${col},${col}bb)">${escapeHtml(rec.w[0].toUpperCase())}</div>`;
}

// Compact thumbnail (list rows, card headers): emoji char → small icon → letter.
export function wordThumb(rec, col) {
  const c = col || posColor(rec.p);
  const em = emojiFor(rec.w);
  if (em) return `<span class="wt-emoji">${em}</span>`;
  const path = iconFor(rec.w);
  if (path) return `<span class="wt-icon" style="--vc:${c}"><svg viewBox="0 0 24 24" aria-hidden="true"><path d="${path}"/></svg></span>`;
  return `<span style="font-family:var(--font-en);font-weight:800;color:${c}">${escapeHtml(rec.w[0].toUpperCase())}</span>`;
}

// "Explore" links: see the word inside real videos / photos (opens externally).
export function exploreLinks(word) {
  const w = encodeURIComponent(word);
  return `<div class="explore-row">
    <a class="explore-btn" href="https://youglish.com/pronounce/${w}/english" target="_blank" rel="noopener">🎬 <span>${t('watch_videos')}</span></a>
    <a class="explore-btn" href="https://openverse.org/search/image?q=${w}" target="_blank" rel="noopener">🖼️ <span>${t('see_images')}</span></a>
  </div>`;
}

export function speakButton(word) {
  if (!canSpeak()) return '';
  return `<button class="speak-btn" data-speak="${escapeHtml(word)}">${ICONS.speaker}<span>${t('tap_to_hear')}</span></button>`;
}

// A small round "speaker" button that reads `text` aloud when tapped.
function spk(text) {
  if (!canSpeak() || !text) return '';
  return `<button class="mini-spk" data-speak="${escapeHtml(text)}" aria-label="${escapeHtml(t('listen'))}">${ICONS.speaker}</button>`;
}
function lblRow(label, text) {
  return `<div class="def-lbl-row"><span class="def-lbl">${label}</span>${spk(text)}</div>`;
}

// "Listen to all" — reads word, then meaning, then example, in sequence.
export function listenAllButton(rec) {
  if (!canSpeak()) return '';
  const seq = [rec.w, rec.d, rec.e].filter(Boolean).join('|||');
  return `<button class="btn btn-soft listen-all" data-speak-seq="${escapeHtml(seq)}">${ICONS.speaker}<span>${t('listen_all')}</span></button>`;
}

// Full definition markup (audio on every English part) for the flashcard back
// and the word-detail sheet.
export function definitionHTML(rec) {
  const lang = getLang();
  let html = `<div class="def-block">`;
  html += `<span class="pos-badge" style="background:${posColor(rec.p)}">${posLabel(rec.p, lang)}</span>`;
  html += lblRow(t('meaning'), rec.d);
  html += `<div class="def-main" data-speak="${escapeHtml(rec.d)}">${escapeHtml(rec.d)}</div>`;
  if (rec.e) {
    html += lblRow(t('example'), rec.e);
    html += `<div class="example" data-speak="${escapeHtml(rec.e)}">${highlightExample(rec.e, rec.w)}</div>`;
  }
  if (rec.s && rec.s.length) {
    html += lblRow(t('synonyms'), rec.s.join(', '));
    html += `<div class="syn-row">${rec.s.map((x) => `<span class="syn" data-speak="${escapeHtml(x)}">${escapeHtml(x)}</span>`).join('')}</div>`;
  }
  if (rec.m && rec.m.length) {
    html += `<div class="def-lbl" style="margin-top:14px">${t('more_meanings')}</div>`;
    for (const m of rec.m) {
      const seqText = m.d + (m.e ? '. ' + m.e : '');
      html += `<div class="sense"><div class="def-lbl-row"><span class="p">${posLabel(m.p, lang)}</span>${spk(seqText)}</div>`;
      html += `<div class="def-main" style="font-size:1rem" data-speak="${escapeHtml(m.d)}">${escapeHtml(m.d)}</div>`;
      html += m.e ? `<div class="example" style="margin-top:6px" data-speak="${escapeHtml(m.e)}">${highlightExample(m.e, rec.w)}</div>` : '';
      html += `</div>`;
    }
  }
  html += `</div>`;
  return html;
}

export function openWordDetail(rec) {
  const inner = `
    <div style="text-align:center">${wordVisual(rec)}</div>
    <div style="text-align:center;margin:10px 0 4px">
      <div class="word-en">${escapeHtml(rec.w)}</div>
      ${rec.i ? `<div class="word-ipa">/${escapeHtml(rec.i)}/</div>` : ''}
      <div style="margin-top:12px;display:flex;gap:8px;justify-content:center;flex-wrap:wrap">${speakButton(rec.w)}${listenAllButton(rec)}</div>
    </div>
    ${definitionHTML(rec)}
    ${exploreLinks(rec.w)}
    <button class="btn btn-soft btn-block" style="margin-top:18px" data-close>${t('close')}</button>`;
  const ov = openSheet(inner);
  wireSpeak(ov);
  ov.querySelector('[data-close]').addEventListener('click', closeSheet);
  setTimeout(() => speak(rec.w), 250);
}

// Attach speak handlers within a scope: single [data-speak] and [data-speak-seq].
export function wireSpeak(scope) {
  scope.querySelectorAll('[data-speak]').forEach((b) => {
    b.addEventListener('click', (e) => {
      e.stopPropagation();
      speak(b.dataset.speak);
      b.classList.add('spk-on');
      setTimeout(() => b.classList.remove('spk-on'), 700);
    });
  });
  scope.querySelectorAll('[data-speak-seq]').forEach((b) => {
    b.addEventListener('click', (e) => {
      e.stopPropagation();
      const parts = b.dataset.speakSeq.split('|||');
      b.classList.add('playing');
      speakSequence(parts, { onEnd: () => b.classList.remove('playing') });
      setTimeout(() => b.classList.remove('playing'), 8000);
    });
  });
}

export function greeting() {
  const h = new Date().getHours();
  if (h < 12) return t('greeting_morning');
  if (h < 17) return t('greeting_afternoon');
  if (h < 22) return t('greeting_evening');
  return t('greeting_night');
}
