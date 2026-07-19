// Pronunciation via the browser's built-in Web Speech API — free, offline,
// no audio files needed. Prefers a US English voice.
import { store } from './store.js';

let voices = [];
let usVoice = null;

function pick() {
  voices = window.speechSynthesis ? window.speechSynthesis.getVoices() : [];
  usVoice = voices.find((v) => /en[-_]US/i.test(v.lang) && /female|Samantha|Google US|Zira|Aria|Jenny/i.test(v.name))
    || voices.find((v) => /en[-_]US/i.test(v.lang))
    || voices.find((v) => /^en/i.test(v.lang))
    || null;
}
if ('speechSynthesis' in window) {
  pick();
  window.speechSynthesis.onvoiceschanged = pick;
}

export function canSpeak() { return 'speechSynthesis' in window; }

function utter(text, rate) {
  const u = new SpeechSynthesisUtterance(text);
  if (usVoice) u.voice = usVoice;
  u.lang = 'en-US';
  u.rate = rate;
  u.pitch = 1;
  return u;
}

export function speak(text, { rate = 0.92 } = {}) {
  if (!('speechSynthesis' in window)) return;
  if (store.settings.sound === false) return;
  try {
    window.speechSynthesis.cancel();
    window.speechSynthesis.speak(utter(text, rate));
  } catch (e) { /* ignore */ }
}

// Read several English parts in order (word, definition, example…) with a small
// gap between them. onPart(index) fires as each part begins, for highlighting.
export function speakSequence(parts, { rate = 0.9, onPart, onEnd } = {}) {
  if (!('speechSynthesis' in window)) return;
  if (store.settings.sound === false) return;
  try {
    window.speechSynthesis.cancel();
    const clean = parts.map((p) => (p || '').trim()).filter(Boolean);
    clean.forEach((text, i) => {
      const u = utter(text, rate);
      if (onPart) u.onstart = () => onPart(i);
      if (onEnd && i === clean.length - 1) u.onend = () => onEnd();
      window.speechSynthesis.speak(u);
    });
  } catch (e) { /* ignore */ }
}

export function stopSpeak() {
  if ('speechSynthesis' in window) { try { window.speechSynthesis.cancel(); } catch (e) {} }
}
