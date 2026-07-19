// Flashcard study session: due reviews + new words, with flip animation,
// pronunciation, SM-2 grading, live progress, and a rewarding summary.
import { t, getLang } from '../i18n.js';
import { store } from '../store.js';
import { wordAt } from '../data.js';
import { navigate } from '../router.js';
import { ICONS } from '../icons.js';
import { grade, previewIntervals } from '../srs.js';
import { speak } from '../speech.js';
import { buildQueue, buildQueueForIndices } from '../session.js';
import { unitWords } from '../data.js';
import { wordVisual, wordThumb, definitionHTML, speakButton, listenAllButton, exploreLinks, wireSpeak, ringSVG, animateRings } from '../ui.js';
import { posLabel, posColor, escapeHtml } from '../util.js';
import { checkBadges, badgeName } from '../achievements.js';
import { toast, confetti } from '../fx.js';

const refreshChrome = () => window.dispatchEvent(new CustomEvent('app:refresh'));

let sess = null;

export function render(root, params) {
  const mode = params && params[0] ? params[0] : 'daily';
  let q;
  if (mode === 'unit' && params[1] != null) {
    q = buildQueueForIndices(unitWords(+params[1]));
  } else {
    q = buildQueue(mode, mode === 'ahead' ? store.settings.wordsPerDay : 0);
  }
  if (!q.length) return renderEmpty(root);
  sess = { q, i: 0, revealed: false, correct: 0, total: 0, newCount: 0, revCount: 0, start: Date.now(), levelUps: [], badges: [] };
  root.innerHTML = `<div id="session"></div>`;
  drawCard();
}

function renderEmpty(root) {
  root.innerHTML = `
    <div class="empty-state">
      <div class="em">🌤️</div>
      <h2>${t('empty_queue')}</h2>
      <div style="display:flex;gap:10px;justify-content:center;flex-wrap:wrap;margin-top:20px">
        <button class="btn btn-primary" data-go="learn/ahead">${t('learn_ahead')}</button>
        <button class="btn btn-ghost" data-go="quiz">${t('quiz_title')}</button>
      </div>
    </div>`;
  root.querySelectorAll('[data-go]').forEach((b) => b.addEventListener('click', () => navigate(b.dataset.go)));
}

function drawCard() {
  const host = document.getElementById('session');
  if (!host) return;
  const item = sess.q[sess.i];
  const rec = wordAt(item.idx);
  const lang = getLang();
  const prog = Math.round((sess.i / sess.q.length) * 100);

  host.innerHTML = `
    <div class="session-top">
      <button class="icon-btn" data-exit>${ICONS.x}</button>
      <div class="progressbar"><span style="width:${prog}%"></span></div>
      <span class="session-count">${sess.i + 1}/${sess.q.length}</span>
    </div>
    <div class="flashwrap">
      <div class="flashcard" id="card">
        <div class="face face-front">
          ${item.isNew ? `<span class="chip on card-flag">✦ ${t('new_short')}</span>` : ''}
          <div class="fc-visual">${wordVisual(rec)}</div>
          <div class="word-en">${escapeHtml(rec.w)}</div>
          ${rec.i ? `<div class="word-ipa">/${escapeHtml(rec.i)}/</div>` : ''}
          <span class="pos-badge" style="background:${posColor(rec.p)}">${posLabel(rec.p, lang)}</span>
          <button class="speak-btn speak-lg" data-speak="${escapeHtml(rec.w)}">${ICONS.speaker}<span>${t('pronounce')}</span></button>
          <div class="flip-hint">${ICONS.refresh} ${t('flip_hint')}</div>
        </div>
        <div class="face face-back">
          <div class="fc-back-head">
            <div class="fc-back-word">
              <span class="fc-back-emoji">${wordThumb(rec)}</span>
              <div>
                <div class="word-en" style="font-size:1.5rem;line-height:1.1">${escapeHtml(rec.w)}</div>
                ${rec.i ? `<div class="word-ipa" style="font-size:.92rem">/${escapeHtml(rec.i)}/</div>` : ''}
              </div>
            </div>
            ${listenAllButton(rec)}
          </div>
          ${definitionHTML(rec)}
          ${exploreLinks(rec.w)}
        </div>
      </div>
    </div>
    <div id="controls"></div>`;

  const card = document.getElementById('card');
  card.addEventListener('click', (e) => { if (!e.target.closest('[data-speak]')) reveal(); });
  drawControls();
  wireSpeak(host);
  host.querySelector('[data-exit]').addEventListener('click', () => navigate('home'));
  sess.revealed = false;
}

function fmtDays(d) {
  const ar = getLang() === 'ar';
  if (d <= 0) return ar ? 'الآن' : 'now';
  if (d === 1) return ar ? 'يوم' : '1d';
  if (d < 30) return ar ? `${d} يوم` : `${d}d`;
  const mo = Math.round(d / 30);
  return ar ? (mo === 1 ? 'شهر' : `${mo} شهر`) : `${mo}mo`;
}

function drawControls() {
  const c = document.getElementById('controls');
  if (!sess.revealed) {
    c.innerHTML = `<button class="btn btn-primary btn-lg btn-block reveal-btn" id="reveal">${ICONS.arrow} ${t('show_answer')}</button>`;
    c.querySelector('#reveal').addEventListener('click', reveal);
  } else {
    const iv = previewIntervals(sess.q[sess.i].idx);
    c.innerHTML = `<div class="grade-row">
      <button class="grade g-again" data-g="0">${t('again')}<small>${fmtDays(iv[0])}</small></button>
      <button class="grade g-hard" data-g="1">${t('hard')}<small>${fmtDays(iv[1])}</small></button>
      <button class="grade g-good" data-g="2">${t('good')}<small>${fmtDays(iv[2])}</small></button>
      <button class="grade g-easy" data-g="3">${t('easy')}<small>${fmtDays(iv[3])}</small></button>
    </div>`;
    c.querySelectorAll('[data-g]').forEach((b) => b.addEventListener('click', () => doGrade(+b.dataset.g)));
  }
}

function reveal() {
  if (sess.revealed) return;
  sess.revealed = true;
  document.getElementById('card').classList.add('flipped');
  drawControls();
  const rec = wordAt(sess.q[sess.i].idx);
  speak(rec.w);
}

function doGrade(g) {
  const item = sess.q[sess.i];
  const r = grade(item.idx, g, item.isNew);
  sess.total++;
  if (r.correct) sess.correct++;
  if (item.isNew) sess.newCount++; else sess.revCount++;
  if (r.leveledTo) sess.levelUps.push(r.leveledTo);
  // failed card: re-queue a few positions ahead within this session
  if (g === 0) {
    const insertAt = Math.min(sess.q.length, sess.i + 3);
    sess.q.splice(insertAt, 0, { idx: item.idx, isNew: false });
  }
  store.save();

  const card = document.getElementById('card');
  card.style.transition = 'transform .32s ease, opacity .32s ease';
  card.style.opacity = '0';
  card.style.transform = 'translateY(-24px) scale(.94)';
  setTimeout(() => { sess.i++; if (sess.i >= sess.q.length) finish(); else drawCard(); }, 240);
}

function finish() {
  // streak + badges + celebration
  const streak = store.touchStreak();
  const newBadges = checkBadges();
  store.save();
  refreshChrome();

  const lang = getLang();
  const acc = sess.total ? Math.round((sess.correct / sess.total) * 100) : 100;
  const mins = Math.max(1, Math.round((Date.now() - sess.start) / 60000));
  const emoji = acc >= 90 ? '🏆' : acc >= 70 ? '🎉' : '💪';
  const host = document.getElementById('session');

  host.innerHTML = `
    <div class="result">
      <div class="result-emoji">${emoji}</div>
      <h2>${t('session_complete')}</h2>
      <div class="result-score">${acc}%</div>
      <div class="muted">${t('accuracy_session')}</div>
      <div class="result-bars">
        ${statMini(sess.newCount, t('new_words'), 'var(--accent)')}
        ${statMini(sess.revCount, t('reviews'), 'var(--primary)')}
        ${statMini(mins + t('minutes_short'), t('time_studied'), 'var(--teal)')}
      </div>
      ${streak.changed ? `<div class="pill-note" style="justify-content:center;margin:6px auto">🔥 ${store.s.streak.current} ${t('days')} · ${streak.froze ? t('freeze_used') : t('day_streak_kept')}</div>` : ''}
      ${sess.levelUps.length ? `<div class="pill-note" style="justify-content:center;margin:8px auto;background:var(--grad);color:#fff">🚀 ${t('level_up')} ${Math.max(...sess.levelUps)}!</div>` : ''}
      ${newBadges.length ? `<div style="margin:14px 0">
        <div class="def-lbl" style="text-align:center">${t('new_badge')}</div>
        <div style="display:flex;gap:12px;justify-content:center;flex-wrap:wrap">
          ${newBadges.map((b) => `<div class="badge unlocked" style="min-width:120px"><span class="badge-ic">${b.icon}</span><b style="font-size:.85rem">${badgeName(b, lang)}</b></div>`).join('')}
        </div></div>` : ''}
      <div style="display:flex;gap:10px;justify-content:center;flex-wrap:wrap;margin-top:18px">
        <button class="btn btn-primary" data-go="home">${t('back_home')}</button>
        <button class="btn btn-ghost" data-again>${t('learn_ahead')}</button>
      </div>
    </div>`;

  host.querySelector('[data-go]').addEventListener('click', () => navigate('home'));
  host.querySelector('[data-again]').addEventListener('click', () => render(document.getElementById('view'), ['ahead']));
  if (acc >= 80 || newBadges.length || sess.levelUps.length) confetti();
  if (newBadges.length) newBadges.forEach((b, k) => setTimeout(() => toast(`${b.icon} ${badgeName(b, lang)}`, { icon: '🏅' }), 400 + k * 700));
}

function statMini(val, label, color) {
  return `<div style="text-align:center"><div style="font-size:1.6rem;font-weight:800;font-family:var(--font-head);color:${color}">${val}</div><div class="muted" style="font-size:.8rem">${label}</div></div>`;
}
