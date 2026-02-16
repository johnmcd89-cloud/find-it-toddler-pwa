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

      // Prefer higher-quality built-in voices first (natural/neural/enhanced), then calmer English voices.
      const preferred = [
        /natural|neural|enhanced|premium/i,
        /samantha|karen|moira|ava|allison|zira|aria/i,
        /female/i
      ];

      const englishVoices = voices.filter((v) => /en-/i.test(v.lang) || /english/i.test(v.name));
      const pool = englishVoices.length > 0 ? englishVoices : voices;

      let picked: SpeechSynthesisVoice | null = null;
      for (const pattern of preferred) {
        picked = pool.find((v) => pattern.test(v.name)) ?? null;
        if (picked) break;
      }

      this.voice = picked ?? pool.find((v) => /en-us/i.test(v.lang)) ?? pool[0] ?? null;
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
    // Extra-slow, calmer toddler-friendly defaults.
    utterance.rate = 0.7;
    utterance.pitch = 0.95;
    utterance.lang = 'en-US';
    if (this.voice) utterance.voice = this.voice;
    window.speechSynthesis.speak(utterance);
  }
}
