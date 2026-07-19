// Self-testing: multiple-choice (meaning / word), and spelling.
// Scope can be recent words, a specific unit, or everything learned.
import { t, getLang } from '../i18n.js';
import { store } from '../store.js';
import { wordAt, total, unitCount, unitWords, unitRange } from '../data.js';
import { navigate } from '../router.js';
import { ICONS } from '../icons.js';
import { speak } from '../speech.js';
import { shuffle, sample, escapeHtml, posColor, posLabel, clamp } from '../util.js';
import { wordVisual } from '../ui.js';
import { checkBadges, badgeName } from '../achievements.js';
import { toast, confetti } from '../fx.js';

let quiz = null;
const refreshChrome = () => window.dispatchEvent(new CustomEvent('app:refresh'));

export function render(root, params) {
  if (params && params[0] === 'unit' && params[1] != null) {
    return start(root, { scope: 'unit', unit: +params[1], type: 'mixed', count: 12, id: 'unit' + params[1] });
  }
  renderSetup(root);
}

function renderSetup(root) {
  const lang = getLang();
  const learned = store.counts().seen;
  root.innerHTML = `
   <div class="narrow">
    <div class="section-title"><h2>${t('quiz_title')}</h2></div>
    <p class="muted" style="margin:0 4px 16px">${t('quiz_intro')}</p>

    <div class="card card-p">
      <div class="def-lbl">${lang === 'ar' ? 'اختر النطاق' : 'Scope'}</div>
      <div class="segment" id="scope" style="margin:8px 0 18px">
        <button data-v="recent" class="on">🕒 ${t('quiz_today')}</button>
        <button data-v="learned">🎓 ${t('quiz_learned')}</button>
        <button data-v="units">🧩 ${t('quiz_unit')}</button>
      </div>

      <div id="scope-extra"></div>

      <div class="def-lbl">${lang === 'ar' ? 'نوع الاختبار' : 'Quiz type'}</div>
      <div class="segment" id="qtype" style="margin:8px 0 18px">
        <button data-v="mixed" class="on">🔀 ${lang === 'ar' ? 'متنوّع' : 'Mixed'}</button>
        <button data-v="meaning">📖 ${t('quiz_choose_meaning')}</button>
        <button data-v="word">🔤 ${t('quiz_choose_word')}</button>
        <button data-v="spell">⌨️ ${t('quiz_spelling')}</button>
      </div>

      <div class="def-lbl">${lang === 'ar' ? 'عدد الأسئلة' : 'Questions'}</div>
      <div class="segment" id="qcount" style="margin:8px 0 6px">
        <button data-v="8">8</button><button data-v="12" class="on">12</button><button data-v="20">20</button>
      </div>
    </div>

    <button class="btn btn-primary btn-lg btn-block" id="startq" style="margin-top:18px" ${learned < 4 ? 'disabled' : ''}>${ICONS.play} ${t('quiz_start')}</button>
    ${learned < 4 ? `<p class="muted center" style="margin-top:10px">${lang === 'ar' ? 'تعلّم بعض الكلمات أولًا لفتح الاختبارات.' : 'Learn a few words first to unlock quizzes.'}</p>` : ''}
   </div>
  `;

  const state = { scope: 'recent', type: 'mixed', count: 12, unit: 0 };
  segments(root, 'scope', (v) => { state.scope = v; renderScopeExtra(root, state); });
  segments(root, 'qtype', (v) => (state.type = v));
  segments(root, 'qcount', (v) => (state.count = +v));
  renderScopeExtra(root, state);
  root.querySelector('#startq').addEventListener('click', () => start(root, { ...state, id: state.scope === 'unit' ? 'unit' + state.unit : state.scope }));
}

function renderScopeExtra(root, state) {
  const box = root.querySelector('#scope-extra');
  if (state.scope !== 'units') { box.innerHTML = ''; return; }
  const uc = unitCount();
  state.scope = 'unit';
  box.innerHTML = `<div class="def-lbl">${t('unit')}</div>
    <select class="select" id="unitsel" style="width:100%;margin:8px 0 18px">
      ${Array.from({ length: uc }, (_, i) => {
        const [a, b] = unitRange(i);
        return `<option value="${i}">${t('unit')} ${i + 1} · #${a + 1}–${b}</option>`;
      }).join('')}
    </select>`;
  box.querySelector('#unitsel').addEventListener('change', (e) => (state.unit = +e.target.value));
}

function segments(root, id, cb) {
  const seg = root.querySelector('#' + id);
  seg.querySelectorAll('button').forEach((b) => b.addEventListener('click', () => {
    seg.querySelectorAll('button').forEach((x) => x.classList.remove('on'));
    b.classList.add('on'); cb(b.dataset.v);
  }));
}

// ---- pools ----
function poolFor(scope, unit) {
  if (scope === 'unit') return unitWords(unit);
  const entries = Object.keys(store.s.srs).map(Number);
  if (scope === 'learned') {
    const l = entries.filter((i) => ['learned', 'mastered'].includes(store.stageOf(i)));
    return (l.length >= 4 ? l : entries);
  }
  // recent: most recently seen
  return entries.sort((a, b) => (store.s.srs[b].seen - store.s.srs[a].seen) || (store.s.srs[b].last - store.s.srs[a].last)).slice(0, 30);
}

function start(root, cfg) {
  let pool = poolFor(cfg.scope, cfg.unit);
  if (pool.length < 4) {
    // pad with nearby frequent words so MCQ always has distractors
    const pad = [];
    for (let i = 0; pad.length < 8 && i < total(); i++) if (!pool.includes(i)) pad.push(i);
    pool = [...new Set([...pool, ...pad])];
  }
  const count = clamp(cfg.count, 4, pool.length);
  const targets = sample(pool, count);
  const questions = targets.map((idx) => makeQuestion(idx, cfg.type, pool));
  quiz = { cfg, questions, i: 0, correct: 0, mistakes: [], answered: false };
  root.innerHTML = `<div id="quizrun"></div>`;
  drawQuestion();
}

function makeQuestion(idx, type, pool) {
  const rec = wordAt(idx);
  let qtype = type;
  if (type === 'mixed') qtype = ['meaning', 'word', 'spell'][Math.floor(Math.random() * 3)];
  // choose distractors, prefer same POS
  const others = pool.filter((i) => i !== idx);
  const samePos = others.filter((i) => wordAt(i).p === rec.p);
  const distr = sample(samePos.length >= 3 ? samePos : others, 3);
  return { idx, rec, qtype, distr };
}

function drawQuestion() {
  const host = document.getElementById('quizrun');
  const q = quiz.questions[quiz.i];
  const rec = q.rec;
  const lang = getLang();
  quiz.answered = false;
  const prog = Math.round((quiz.i / quiz.questions.length) * 100);
  const head = `<div class="session-top">
      <button class="icon-btn" data-exit>${ICONS.x}</button>
      <div class="progressbar"><span style="width:${prog}%"></span></div>
      <span class="session-count">${quiz.i + 1}/${quiz.questions.length}</span>
    </div>`;

  if (q.qtype === 'meaning') {
    const opts = shuffle([q.idx, ...q.distr]);
    host.innerHTML = head + `
      <div class="quiz-q">
        <div class="quiz-prompt">${t('quiz_choose_meaning')}</div>
        <div style="display:flex;justify-content:center;transform:scale(.7)">${wordVisual(rec)}</div>
        <div class="quiz-word">${escapeHtml(rec.w)}</div>
        ${rec.i ? `<div class="word-ipa">/${escapeHtml(rec.i)}/</div>` : ''}
        <button class="fab-hear" data-hear style="margin-top:8px">${ICONS.speaker}</button>
      </div>
      <div class="opt-list">${opts.map((i, k) => optHTML(k, wordAt(i).d, i === q.idx)).join('')}</div>`;
    speak(rec.w);
  } else if (q.qtype === 'word') {
    const opts = shuffle([q.idx, ...q.distr]);
    host.innerHTML = head + `
      <div class="quiz-q">
        <div class="quiz-prompt">${t('quiz_choose_word')}</div>
        <span class="pos-badge" style="background:${posColor(rec.p)}">${posLabel(rec.p, lang)}</span>
        <div class="quiz-def" style="margin-top:10px">${escapeHtml(rec.d)}</div>
      </div>
      <div class="opt-list">${opts.map((i, k) => optHTML(k, wordAt(i).w, i === q.idx, true)).join('')}</div>`;
  } else { // spell
    host.innerHTML = head + `
      <div class="quiz-q">
        <div class="quiz-prompt">${t('quiz_spelling')}</div>
        <button class="fab-hear" data-hear style="width:56px;height:56px;font-size:22px;margin:6px auto">${ICONS.speaker}</button>
        <div class="quiz-def" style="font-size:1.05rem;margin-top:8px">${escapeHtml(rec.d)}</div>
      </div>
      <input class="spell-input" id="spellin" placeholder="${t('type_here')}" autocomplete="off" autocorrect="off" autocapitalize="off" spellcheck="false" />
      <div style="display:flex;gap:10px;justify-content:center;margin-top:16px">
        <button class="btn btn-primary" id="checkspell">${t('check')}</button>
        <button class="btn btn-ghost" id="skipspell">${t('skip')}</button>
      </div>`;
    speak(rec.w);
    const inp = host.querySelector('#spellin');
    setTimeout(() => inp.focus(), 100);
    inp.addEventListener('keydown', (e) => { if (e.key === 'Enter') checkSpell(); });
    host.querySelector('#checkspell').addEventListener('click', checkSpell);
    host.querySelector('#skipspell').addEventListener('click', () => answer(false, null));
  }

  host.querySelectorAll('.opt').forEach((o) => o.addEventListener('click', () => {
    if (quiz.answered) return;
    answer(o.dataset.correct === '1', o);
  }));
  const hear = host.querySelector('[data-hear]');
  if (hear) hear.addEventListener('click', () => speak(rec.w));
  host.querySelector('[data-exit]').addEventListener('click', () => navigate('home'));
}

function optHTML(k, text, correct, ltr) {
  const key = String.fromCharCode(65 + k);
  return `<button class="opt" data-correct="${correct ? 1 : 0}"><span class="key">${key}</span><span${ltr ? ' style="font-family:var(--font-en);font-weight:700"' : ''}>${escapeHtml(text)}</span></button>`;
}

function checkSpell() {
  if (quiz.answered) return;
  const inp = document.getElementById('spellin');
  const q = quiz.questions[quiz.i];
  const norm = (s) => s.toLowerCase().replace(/[^a-z]/g, '');
  const ok = norm(inp.value) === norm(q.rec.w);
  inp.classList.add(ok ? 'correct' : 'wrong');
  if (!ok) inp.value = q.rec.w;
  inp.disabled = true;
  answer(ok, null, true);
}

function answer(correct, node, isSpell) {
  if (quiz.answered) return;
  quiz.answered = true;
  const q = quiz.questions[quiz.i];
  if (correct) { quiz.correct++; } else { quiz.mistakes.push(q.idx); }
  if (!isSpell) {
    const host = document.getElementById('quizrun');
    host.querySelectorAll('.opt').forEach((o) => {
      o.classList.add('disabled');
      if (o.dataset.correct === '1') o.classList.add('correct');
    });
    if (node && !correct) node.classList.add('wrong');
  }
  if (correct) speak(q.rec.w);
  setTimeout(() => { quiz.i++; if (quiz.i >= quiz.questions.length) finish(); else drawQuestion(); }, correct ? 650 : 1350);
}

function finish() {
  const pct = Math.round((quiz.correct / quiz.questions.length) * 100);
  store.recordQuiz(quiz.cfg.id, pct);
  const newBadges = checkBadges();
  store.save();
  refreshChrome();

  const lang = getLang();
  const emoji = pct >= 90 ? '🏆' : pct >= 60 ? '🎉' : '📚';
  const host = document.getElementById('quizrun');
  host.innerHTML = `
    <div class="result">
      <div class="result-emoji">${emoji}</div>
      <h2>${t('your_score')}</h2>
      <div class="result-score">${pct}%</div>
      <div class="muted">${quiz.correct} / ${quiz.questions.length} ${t('correct')}</div>
      ${newBadges.length ? `<div style="display:flex;gap:12px;justify-content:center;flex-wrap:wrap;margin:16px 0">
        ${newBadges.map((b) => `<div class="badge unlocked" style="min-width:120px"><span class="badge-ic">${b.icon}</span><b style="font-size:.85rem">${badgeName(b, lang)}</b></div>`).join('')}</div>` : ''}
      ${quiz.mistakes.length ? `<div class="def-lbl" style="text-align:center;margin-top:16px">${t('review_mistakes')}</div>
        <div class="wordlist" style="max-width:520px;margin:0 auto">${[...new Set(quiz.mistakes)].map(mistakeRow).join('')}</div>` : ''}
      <div style="display:flex;gap:10px;justify-content:center;flex-wrap:wrap;margin-top:20px">
        <button class="btn btn-primary" data-retry>${ICONS.refresh} ${t('quiz_again')}</button>
        <button class="btn btn-ghost" data-home>${t('back_home')}</button>
      </div>
    </div>`;
  host.querySelector('[data-retry]').addEventListener('click', () => start(document.getElementById('view'), quiz.cfg));
  host.querySelector('[data-home]').addEventListener('click', () => navigate('home'));
  host.querySelectorAll('[data-idx]').forEach((r) => r.addEventListener('click', () => { import('../ui.js').then((m) => m.openWordDetail(wordAt(+r.dataset.idx))); }));
  if (pct >= 80 || newBadges.length) confetti();
}

function mistakeRow(idx) {
  const rec = wordAt(idx);
  return `<div class="wcard" data-idx="${idx}"><div class="wcard-mid"><div class="wcard-en">${escapeHtml(rec.w)}</div><div class="wcard-def">${escapeHtml(rec.d)}</div></div>${ICONS.chevron}</div>`;
}
