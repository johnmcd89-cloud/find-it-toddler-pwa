interface TTSOptions {
  enabled: boolean;
}

export class ToddlerTTS {
  private voice: SpeechSynthesisVoice | null = null;
  private supported = false;

  constructor() {
    this.supported = typeof window !== 'undefined' && 'speechSynthesis' in window;

    if (!this.supported) return;

    const selectVoice = () => {
      const voices = window.speechSynthesis.getVoices();
      // Prefer calmer, more natural-sounding English voices when available.
      this.voice =
        voices.find((v) => /samantha|karen|moira|ava|allison|google us english/i.test(v.name)) ??
        voices.find((v) => /female/i.test(v.name) && /en-/i.test(v.lang)) ??
        voices.find((v) => /en-us/i.test(v.lang)) ??
        voices.find((v) => /en-/i.test(v.lang)) ??
        voices[0] ??
        null;
    };

    selectVoice();
    window.speechSynthesis.onvoiceschanged = selectVoice;
  }

  speak(text: string, options: TTSOptions): void {
    if (!options.enabled) return;

    if (!this.supported) {
      console.info('[Find It TTS fallback]', text);
      return;
    }

    window.speechSynthesis.cancel();
    const utterance = new SpeechSynthesisUtterance(text);
    // Slower, calmer toddler-friendly defaults.
    utterance.rate = 0.8;
    utterance.pitch = 1.0;
    utterance.lang = 'en-US';
    if (this.voice) utterance.voice = this.voice;
    window.speechSynthesis.speak(utterance);
  }
}
