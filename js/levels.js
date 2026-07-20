// The learning journey is divided into levels (CEFR-inspired frequency bands).
// Finishing every level = mastering the whole 8,500-word set.
import { store } from './store.js';
import { total, unitSize } from './data.js';

// start is inclusive, end exclusive (word indices). end of last level is clamped to total().
export const LEVELS = [
  { id: 1, cefr: 'A1', ar: 'المبتدئ', en: 'Beginner',      emoji: '🌱', color: '#22c55e', start: 0,    end: 600 },
  { id: 2, cefr: 'A2', ar: 'الأساسي', en: 'Elementary',    emoji: '🌿', color: '#14b8a6', start: 600,  end: 1500 },
  { id: 3, cefr: 'B1', ar: 'المتوسط', en: 'Intermediate',  emoji: '⭐', color: '#0ea5e9', start: 1500, end: 3000 },
  { id: 4, cefr: 'B2', ar: 'فوق المتوسط', en: 'Upper-Int.', emoji: '🔥', color: '#f59e0b', start: 3000, end: 5000 },
  { id: 5, cefr: 'C1', ar: 'المتقدّم', en: 'Advanced',      emoji: '💎', color: '#8b5cf6', start: 5000, end: 7000 },
  { id: 6, cefr: 'C2', ar: 'الإتقان',  en: 'Mastery',       emoji: '👑', color: '#ec4899', start: 7000, end: 8500 },
];

export function levelName(lvl, lang) { return lang === 'ar' ? lvl.ar : lvl.en; }

export function levelEnd(lvl) { return Math.min(lvl.end, total() || lvl.end); }

export function levelOfIndex(idx) {
  for (const l of LEVELS) if (idx >= l.start && idx < levelEnd(l)) return l;
  return LEVELS[LEVELS.length - 1];
}

// Progress for a range of words (a level or a lesson). The bar fills as you
// study: a word you've started counts half, a learned/mastered word counts
// full — so a first study pass shows real movement (not a stuck 0%).
export function bandStat(start, end) {
  const size = Math.max(1, end - start);
  let seen = 0, learned = 0, mastered = 0, score = 0;
  for (let i = start; i < end; i++) {
    const st = store.stageOf(i);
    if (st === 'new') continue;
    seen++;
    if (st === 'mastered') { mastered++; learned++; score += 1; }
    else if (st === 'learned') { learned++; score += 1; }
    else score += 0.5;   // seen but still learning
  }
  const pct = Math.round((score / size) * 100);
  return { size, seen, learned, mastered, score, pct, complete: learned >= size, started: seen > 0 };
}

// Progress for one level from the current SRS state.
export function levelStat(lvl) {
  return bandStat(lvl.start, levelEnd(lvl));
}

// Level the learner is currently working through (first not-complete).
export function currentLevel() {
  for (const l of LEVELS) if (!levelStat(l).complete) return l;
  return LEVELS[LEVELS.length - 1];
}

export function allComplete() {
  return LEVELS.every((l) => levelStat(l).complete);
}

// Units (lesson blocks) that belong to a level.
export function unitsOfLevel(lvl) {
  const u = unitSize();
  const end = levelEnd(lvl);
  const out = [];
  for (let s = lvl.start; s < end; s += u) out.push({ unit: Math.floor(s / u), start: s, end: Math.min(s + u, end) });
  return out;
}

// Overall progress across everything (same weighting as bandStat).
export function overall() {
  const t = total() || 1;
  const c = store.counts();
  const learned = c.learned + c.mastered;
  const score = c.learning * 0.5 + learned;
  return { learned, seen: c.seen, total: t, pct: Math.round((score / t) * 100) };
}
