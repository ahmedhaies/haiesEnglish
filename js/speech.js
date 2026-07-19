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

export function speak(text, { rate = 0.92 } = {}) {
  if (!('speechSynthesis' in window)) return;
  if (store.settings.sound === false) return;
  try {
    window.speechSynthesis.cancel();
    const u = new SpeechSynthesisUtterance(text);
    if (usVoice) u.voice = usVoice;
    u.lang = 'en-US';
    u.rate = rate;
    u.pitch = 1;
    window.speechSynthesis.speak(u);
  } catch (e) { /* ignore */ }
}
