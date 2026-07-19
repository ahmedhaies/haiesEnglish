// Central app state with localStorage persistence.
// Holds settings, per-word SRS state, streak, XP, daily history, quiz results,
// and unlocked achievements. Everything lives on the device — no account needed.
import { dayNum, dayKey, debounce, levelFromXp } from './util.js';

const KEY = 'haies_english_v1';

const DEFAULTS = () => ({
  version: 1,
  createdAt: Date.now(),
  settings: {
    lang: null,               // null => detect
    theme: 'auto',
    wordsPerDay: 15,
    reminderEnabled: false,
    reminderTime: '20:00',
    sound: true,
    onboarded: false,
  },
  srs: {},                    // idx -> { ef, iv, due, reps, lapses, last, seen }
  newPos: 0,                  // next new-word index to introduce
  streak: { current: 0, longest: 0, last: -1, freezes: 2 },
  xp: 0,
  history: {},                // dayKey -> { n:new, r:reviews, c:correct, t:total, ms }
  quizzes: {},                // scopeId -> { best, attempts, last }
  achievements: {},           // id -> unlockedAt(ms)
  lastActive: 0,
});

class Store {
  constructor() {
    this.state = this._load();
    this._save = debounce(() => this._persist(), 400);
    this.listeners = new Set();
  }
  _load() {
    try {
      const raw = localStorage.getItem(KEY);
      if (raw) {
        const parsed = JSON.parse(raw);
        return Object.assign(DEFAULTS(), parsed, {
          settings: Object.assign(DEFAULTS().settings, parsed.settings || {}),
          streak: Object.assign(DEFAULTS().streak, parsed.streak || {}),
        });
      }
    } catch (e) { console.warn('load failed', e); }
    return DEFAULTS();
  }
  _persist() {
    try { localStorage.setItem(KEY, JSON.stringify(this.state)); }
    catch (e) { console.warn('save failed', e); }
  }
  save() { this._save(); this._emit(); }
  flush() { this._persist(); }
  _emit() { this.listeners.forEach((f) => f(this.state)); }
  onChange(fn) { this.listeners.add(fn); return () => this.listeners.delete(fn); }

  get s() { return this.state; }
  get settings() { return this.state.settings; }

  // ---- SRS record helpers ----
  srsOf(idx) { return this.state.srs[idx]; }
  isSeen(idx) { return !!this.state.srs[idx]; }
  stageOf(idx) {
    const r = this.state.srs[idx];
    if (!r) return 'new';
    if (r.iv >= 21 || r.reps >= 6) return 'mastered';
    if (r.reps >= 2 && r.iv >= 4) return 'learned';
    return 'learning';
  }
  counts() {
    let learning = 0, learned = 0, mastered = 0;
    for (const idx in this.state.srs) {
      const st = this.stageOf(idx);
      if (st === 'mastered') mastered++;
      else if (st === 'learned') learned++;
      else learning++;
    }
    return { seen: Object.keys(this.state.srs).length, learning, learned, mastered };
  }
  dueList(total) {
    const today = dayNum();
    const out = [];
    for (const idx in this.state.srs) {
      if (this.state.srs[idx].due <= today) out.push(+idx);
    }
    // earliest due first
    out.sort((a, b) => this.state.srs[a].due - this.state.srs[b].due);
    return out;
  }
  dueCount() { return this.dueList().length; }

  nextNewWords(count, total) {
    const out = [];
    let p = this.state.newPos;
    while (out.length < count && p < total) {
      if (!this.state.srs[p]) out.push(p);
      p++;
    }
    return out;
  }
  advanceNewPos(total) {
    let p = this.state.newPos;
    while (p < total && this.state.srs[p]) p++;
    this.state.newPos = p;
  }

  // ---- XP + streak + history ----
  addXp(n) {
    const before = levelFromXp(this.state.xp).level;
    this.state.xp += n;
    const after = levelFromXp(this.state.xp).level;
    return after > before ? after : 0; // returns new level if leveled up
  }
  logActivity({ isNew = false, correct = null, ms = 0 }) {
    const k = dayKey();
    const h = this.state.history[k] || { n: 0, r: 0, c: 0, t: 0, ms: 0 };
    if (isNew) h.n++; else h.r++;
    if (correct !== null) { h.t++; if (correct) h.c++; }
    h.ms += ms;
    this.state.history[k] = h;
    this.state.lastActive = Date.now();
  }
  // Called when a study/quiz action happens; keeps the streak alive.
  touchStreak() {
    const today = dayNum();
    const st = this.state.streak;
    if (st.last === today) return { changed: false };
    const gap = st.last < 0 ? 1 : today - st.last;
    let froze = false;
    if (st.last < 0 || gap === 1) {
      st.current += 1;
    } else if (gap > 1) {
      // missed day(s) — try a freeze for a single missed day, else reset
      if (gap === 2 && st.freezes > 0) { st.freezes--; st.current += 1; froze = true; }
      else { st.current = 1; }
    }
    st.last = today;
    if (st.current > st.longest) st.longest = st.current;
    return { changed: true, froze, current: st.current };
  }
  missedDays() {
    const st = this.state.streak;
    if (st.last < 0) return 0;
    return Math.max(0, dayNum() - st.last);
  }

  // ---- quiz results ----
  recordQuiz(scopeId, pct) {
    const q = this.state.quizzes[scopeId] || { best: 0, attempts: 0, last: 0 };
    q.attempts++;
    q.best = Math.max(q.best, pct);
    q.last = pct;
    q.lastDate = dayKey();
    this.state.quizzes[scopeId] = q;
  }

  unlock(id) {
    if (!this.state.achievements[id]) { this.state.achievements[id] = Date.now(); return true; }
    return false;
  }

  exportJSON() { return JSON.stringify(this.state); }
  importJSON(str) {
    const parsed = JSON.parse(str);
    if (!parsed || typeof parsed !== 'object') throw new Error('bad');
    this.state = Object.assign(DEFAULTS(), parsed);
    this._persist(); this._emit();
  }
  reset() { this.state = DEFAULTS(); this._persist(); this._emit(); }
}

export const store = new Store();
