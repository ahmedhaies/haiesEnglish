// Spaced repetition — a compact SM-2 variant.
// Grades: 0 again, 1 hard, 2 good, 3 easy.
import { dayNum, clamp } from './util.js';
import { store } from './store.js';

const XP_BY_GRADE = [2, 4, 6, 8];   // reward effort; more for confident recalls
const XP_NEW = 5;

// Update (or create) the SRS record for a word after a grade. Returns
// { xp, leveledTo, correct } for the UI.
export function grade(idx, g, isNew) {
  const today = dayNum();
  const s = store.s;
  let r = s.srs[idx];
  if (!r) r = s.srs[idx] = { ef: 2.5, iv: 0, due: today, reps: 0, lapses: 0, last: today, seen: today };

  const correct = g >= 2;
  if (g === 0) {
    // failed — relearn today/tomorrow
    r.reps = 0;
    r.lapses = (r.lapses || 0) + 1;
    r.iv = 0;                // due again this session / next day
    r.ef = clamp(r.ef - 0.2, 1.3, 2.6);
    r.due = today;          // keep in today's queue
  } else {
    // SM-2 quality mapping: hard~3, good~4, easy~5
    const q = g === 1 ? 3 : g === 2 ? 4 : 5;
    r.ef = clamp(r.ef + (0.1 - (5 - q) * (0.08 + (5 - q) * 0.02)), 1.3, 2.8);
    if (r.reps === 0) r.iv = g === 1 ? 1 : g === 3 ? 4 : 2;
    else if (r.reps === 1) r.iv = g === 1 ? 3 : g === 3 ? 8 : 6;
    else r.iv = Math.max(r.reps ? r.iv + 1 : 1, Math.round(r.iv * r.ef * (g === 1 ? 0.6 : g === 3 ? 1.3 : 1)));
    r.iv = clamp(r.iv, 1, 400);
    r.reps += 1;
    r.due = today + r.iv;
  }
  r.last = today;

  // advance the "next new word" pointer if this was a brand-new intro
  if (isNew) store.advanceNewPos(1e9);

  const xp = isNew ? XP_NEW : XP_BY_GRADE[g];
  const leveledTo = store.addXp(xp);
  store.logActivity({ isNew, correct });
  return { xp, leveledTo, correct };
}

// Preview the next interval (in days) for each grade, without mutating state.
// Returns [again, hard, good, easy]; 0 means "again this session".
export function previewIntervals(idx) {
  const r = store.s.srs[idx] || { ef: 2.5, iv: 0, reps: 0 };
  const calc = (g) => {
    if (g === 0) return 0;
    const q = g === 1 ? 3 : g === 2 ? 4 : 5;
    const ef = clamp(r.ef + (0.1 - (5 - q) * (0.08 + (5 - q) * 0.02)), 1.3, 2.8);
    let iv;
    if (r.reps === 0) iv = g === 1 ? 1 : g === 3 ? 4 : 2;
    else if (r.reps === 1) iv = g === 1 ? 3 : g === 3 ? 8 : 6;
    else iv = Math.max(r.reps ? r.iv + 1 : 1, Math.round(r.iv * ef * (g === 1 ? 0.6 : g === 3 ? 1.3 : 1)));
    return clamp(iv, 1, 400);
  };
  return [0, calc(1), calc(2), calc(3)];
}

// Whether a due word should be shown again within THIS session (failed cards).
export function needsReintro(idx) {
  const r = store.s.srs[idx];
  return r && r.iv === 0 && r.due <= dayNum();
}
