// Lingala — shared speech utility used by the dictionary, count page,
// and anywhere else a Lingala word needs to be spoken aloud.
//
// Browser TTS doesn't ship a Lingala voice, so we pick the closest phonetic
// approximation in this order: Italian → Spanish → Portuguese (BR) →
// French → any. Italian's open five-vowel system maps most naturally onto
// Lingala. Speech is always approximate, never a native Congolese voice.

(function () {
  let preferredVoice = null;

  function loadVoices() {
    if (!('speechSynthesis' in window)) return;
    const voices = speechSynthesis.getVoices();
    if (!voices.length) return;
    const pick = (test) => voices.find(test);
    preferredVoice =
      pick((v) => v.lang === 'it-IT') ||
      pick((v) => v.lang && v.lang.startsWith('it-')) ||
      pick((v) => v.lang === 'es-ES') ||
      pick((v) => v.lang && v.lang.startsWith('es-')) ||
      pick((v) => v.lang === 'pt-BR') ||
      pick((v) => v.lang && v.lang.startsWith('pt-')) ||
      pick((v) => v.lang === 'fr-FR') ||
      pick((v) => v.lang && v.lang.startsWith('fr-')) ||
      voices[0] || null;
    try { window.dispatchEvent(new CustomEvent('lingala:voice', { detail: preferredVoice })); } catch (e) {}
  }

  function speak(text) {
    if (!('speechSynthesis' in window) || !text) return false;
    try {
      speechSynthesis.cancel();   // never queue — always pre-empt
      const u = new SpeechSynthesisUtterance(String(text));
      if (preferredVoice) { u.voice = preferredVoice; u.lang = preferredVoice.lang; }
      else u.lang = 'it-IT';
      u.rate = 0.85;
      u.pitch = 1;
      speechSynthesis.speak(u);
      return true;
    } catch (e) { return false; }
  }

  function cancel() {
    try { if ('speechSynthesis' in window) speechSynthesis.cancel(); } catch (e) {}
  }

  if ('speechSynthesis' in window) {
    loadVoices();
    speechSynthesis.onvoiceschanged = loadVoices;
  }

  window.LingalaSpeech = {
    supported: 'speechSynthesis' in window,
    speak,
    cancel,
    speaking: () => ('speechSynthesis' in window) && speechSynthesis.speaking,
    voice: () => preferredVoice,
  };
})();
