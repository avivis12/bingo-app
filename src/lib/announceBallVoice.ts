/**
 * הכרזה קולית בעברית של מספר כדור.
 * משתמש ב-Web Speech API המובנה בדפדפן (SpeechSynthesis).
 */

let voicesCache: SpeechSynthesisVoice[] | null = null;

function getVoices(): SpeechSynthesisVoice[] {
  if (voicesCache && voicesCache.length > 0) return voicesCache;
  const voices = window.speechSynthesis?.getVoices?.() ?? [];
  if (voices.length > 0) voicesCache = voices;
  return voices;
}

function pickHebrewVoice(): SpeechSynthesisVoice | null {
  const voices = getVoices();
  return (
    voices.find((v) => v.lang === "he-IL") ??
    voices.find((v) => v.lang.startsWith("he")) ??
    voices.find((v) => v.lang.startsWith("iw")) ??
    null
  );
}

function numberToHebrewWords(n: number): string {
  const ones = ["", "אחת", "שתיים", "שלוש", "ארבע", "חמש", "שש", "שבע", "שמונה", "תשע"];
  const tens = ["", "עשר", "עשרים", "שלושים", "ארבעים", "חמישים", "שישים", "שבעים"];

  if (n < 1 || n > 75) return String(n);
  if (n < 10) return ones[n];
  if (n === 10) return "עשר";
  if (n < 20) return `${ones[n - 10]} עשרה`;
  if (n === 20) return "עשרים";
  if (n === 30) return "שלושים";
  if (n === 40) return "ארבעים";
  if (n === 50) return "חמישים";
  if (n === 60) return "שישים";
  if (n === 70) return "שבעים";

  const ten = Math.floor(n / 10);
  const one = n % 10;
  if (one === 0) return tens[ten];
  return `${tens[ten]} ו${ones[one]}`;
}

export function announceBallVoice(ballNumber: number, options?: { rate?: number; pitch?: number }) {
  if (typeof window === "undefined") return;
  if (!window.speechSynthesis) return;

  window.speechSynthesis.cancel();

  const text = numberToHebrewWords(ballNumber);
  const utterance = new SpeechSynthesisUtterance(text);
  utterance.lang = "he-IL";
  utterance.rate = options?.rate ?? 0.9;
  utterance.pitch = options?.pitch ?? 1;
  utterance.volume = 1;

  const voice = pickHebrewVoice();
  if (voice) utterance.voice = voice;

  window.speechSynthesis.speak(utterance);
}

export function initVoices() {
  if (typeof window === "undefined") return;
  if (!window.speechSynthesis) return;
  window.speechSynthesis.getVoices();
  window.speechSynthesis.onvoiceschanged = () => {
    voicesCache = window.speechSynthesis.getVoices();
  };
}

/**
 * "פותח" את ערוץ השמע בדפדפן — חייב להיקרא בתוך אירוע לחיצה.
 * משמיע טקסט ריק בווליום 0.
 */
export function unlockAudio() {
  if (typeof window === "undefined") return;
  if (!window.speechSynthesis) return;
  const utterance = new SpeechSynthesisUtterance("");
  utterance.volume = 0;
  window.speechSynthesis.speak(utterance);
}

/* ============================================================
 * ניהול מצב הקול (localStorage)
 * ============================================================ */

const VOICE_KEY = "bingoVoiceEnabled";

export function isVoiceEnabled(): boolean {
  if (typeof window === "undefined") return true;
  return localStorage.getItem(VOICE_KEY) !== "false";
}

export function setVoiceEnabled(enabled: boolean) {
  if (typeof window === "undefined") return;
  localStorage.setItem(VOICE_KEY, enabled ? "true" : "false");
  if (!enabled && window.speechSynthesis) {
    window.speechSynthesis.cancel();
  }
}