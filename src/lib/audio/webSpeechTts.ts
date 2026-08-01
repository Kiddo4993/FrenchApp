import type { SpeechService, TtsOptions } from "./types";

const FRENCH_VOICE_LANGS = ["fr-FR", "fr-CA", "fr"];

function pickFrenchVoice(voices: SpeechSynthesisVoice[]): SpeechSynthesisVoice | undefined {
  for (const lang of FRENCH_VOICE_LANGS) {
    const match = voices.find((v) => v.lang === lang);
    if (match) return match;
  }
  return voices.find((v) => v.lang.startsWith("fr"));
}

/**
 * Web Speech API implementation of SpeechService. Kept behind the SpeechService interface so a
 * paid TTS provider can be swapped in later (PLAN.md §"TECH STACK") without touching call sites.
 */
class WebSpeechTts implements SpeechService {
  private voicesReady: Promise<SpeechSynthesisVoice[]> | null = null;

  isSupported(): boolean {
    return typeof window !== "undefined" && "speechSynthesis" in window;
  }

  private loadVoices(): Promise<SpeechSynthesisVoice[]> {
    if (this.voicesReady) return this.voicesReady;
    this.voicesReady = new Promise((resolve) => {
      const existing = window.speechSynthesis.getVoices();
      if (existing.length > 0) {
        resolve(existing);
        return;
      }
      const handle = () => {
        resolve(window.speechSynthesis.getVoices());
        window.speechSynthesis.removeEventListener("voiceschanged", handle);
      };
      window.speechSynthesis.addEventListener("voiceschanged", handle);
      // Some browsers never fire voiceschanged if voices are already loaded synchronously.
      setTimeout(() => resolve(window.speechSynthesis.getVoices()), 500);
    });
    return this.voicesReady;
  }

  async speak(text: string, options: TtsOptions = {}): Promise<void> {
    if (!this.isSupported()) return;
    this.cancel();
    const voices = await this.loadVoices();
    const voice = pickFrenchVoice(voices);

    return new Promise((resolve, reject) => {
      const utterance = new SpeechSynthesisUtterance(text);
      utterance.lang = voice?.lang ?? "fr-FR";
      if (voice) utterance.voice = voice;
      utterance.rate = options.rate ?? 0.95;
      utterance.pitch = options.pitch ?? 1;
      utterance.onend = () => resolve();
      utterance.onerror = (e) => reject(e.error);
      window.speechSynthesis.speak(utterance);
    });
  }

  cancel(): void {
    if (this.isSupported()) window.speechSynthesis.cancel();
  }
}

export const webSpeechTts = new WebSpeechTts();
