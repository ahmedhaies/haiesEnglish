// Builds the daily study queue: due reviews (spaced repetition) + a batch of
// brand-new words, and reports today's progress toward the goal.
import { store } from './store.js';
import { total } from './data.js';
import { dayKey } from './util.js';
import { shuffle } from './util.js';

export function dueReviewIdx() { return store.dueList(); }
export function newBatchIdx() {
  return store.nextNewWords(store.settings.wordsPerDay, total());
}

// The ordered queue for a session. `mode`: 'daily' | 'reviews' | 'new'
export function buildQueue(mode = 'daily', extraNew = 0) {
  const due = store.dueList();
  let fresh = [];
  if (mode === 'daily' || mode === 'new') {
    fresh = store.nextNewWords((mode === 'new' ? 0 : store.settings.wordsPerDay) + extraNew, total());
  }
  if (mode === 'reviews') fresh = [];
  // Interleave: lead with a few reviews, then weave new words in.
  const q = [];
  const reviews = due.slice();
  const news = fresh.slice();
  // start with up to 3 reviews to warm up
  for (let i = 0; i < 3 && reviews.length; i++) q.push({ idx: reviews.shift(), isNew: false });
  while (reviews.length || news.length) {
    if (news.length) q.push({ idx: news.shift(), isNew: true });
    if (reviews.length) q.push({ idx: reviews.shift(), isNew: false });
    if (reviews.length) q.push({ idx: reviews.shift(), isNew: false });
  }
  return q;
}

export function todayStats() {
  const h = store.s.history[dayKey()] || { n: 0, r: 0, c: 0, t: 0, ms: 0 };
  return h;
}

// Goal = new words per day + due reviews at day start (approx via due now + done).
export function todayGoal() {
  const done = todayStats();
  const due = store.dueCount();
  const newLeft = store.nextNewWords(store.settings.wordsPerDay, total()).length;
  const target = store.settings.wordsPerDay + due + done.r; // rough but stable enough
  const doneCount = done.n + done.r;
  const remaining = due + Math.min(newLeft, store.settings.wordsPerDay);
  return { target, doneCount, remaining, due, newLeft, done };
}
