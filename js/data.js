// Loads and indexes the word database. Words are an ordered array (by frequency);
// a word's index IS its rank-1 and is the stable key used everywhere else.
let WORDS = [];
let EMOJI = {};
let MANIFEST = { total: 0, unitSize: 50, wordsPerDayDefault: 15 };
let byWord = new Map();

export async function loadData(onProgress) {
  const [manifest, emoji] = await Promise.all([
    fetch('data/manifest.json').then((r) => r.json()).catch(() => ({})),
    fetch('data/emoji.json').then((r) => r.json()).catch(() => ({})),
  ]);
  MANIFEST = Object.assign(MANIFEST, manifest);
  EMOJI = emoji || {};
  if (onProgress) onProgress(0.2);

  // stream words.json with progress if possible
  const res = await fetch('data/words.json');
  let json;
  if (res.body && res.headers.get('content-length')) {
    const total = +res.headers.get('content-length');
    const reader = res.body.getReader();
    let received = 0; const chunks = [];
    for (;;) {
      const { done, value } = await reader.read();
      if (done) break;
      chunks.push(value); received += value.length;
      if (onProgress) onProgress(0.2 + 0.75 * (received / total));
    }
    const buf = new Uint8Array(received);
    let pos = 0; for (const c of chunks) { buf.set(c, pos); pos += c.length; }
    json = JSON.parse(new TextDecoder('utf-8').decode(buf));
  } else {
    json = await res.json();
  }
  WORDS = json;
  MANIFEST.total = WORDS.length;
  byWord = new Map(WORDS.map((w, i) => [w.w, i]));
  if (onProgress) onProgress(1);
  return { total: WORDS.length };
}

export function words() { return WORDS; }
export function total() { return WORDS.length; }
export function manifest() { return MANIFEST; }
export function wordAt(idx) { return WORDS[idx]; }
export function indexOfWord(w) { return byWord.has(w) ? byWord.get(w) : -1; }
export function emojiFor(w) { return EMOJI[w] || null; }

// Units (for testing "in parts"): fixed-size contiguous blocks by frequency.
export function unitSize() { return MANIFEST.unitSize || 50; }
export function unitCount() { return Math.ceil(WORDS.length / unitSize()); }
export function unitRange(u) {
  const s = u * unitSize();
  return [s, Math.min(s + unitSize(), WORDS.length)];
}
export function unitWords(u) {
  const [a, b] = unitRange(u);
  const out = [];
  for (let i = a; i < b; i++) out.push(i);
  return out;
}
