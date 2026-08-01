import type { RecognitionResult, RecognitionService } from "./types";

const DEFAULT_TIMEOUT_MS = 8000;

class WebSpeechRecognition implements RecognitionService {
  private active: SpeechRecognitionLike | null = null;

  private getCtor(): (new () => SpeechRecognitionLike) | undefined {
    if (typeof window === "undefined") return undefined;
    return window.SpeechRecognition ?? window.webkitSpeechRecognition;
  }

  isSupported(): boolean {
    return this.getCtor() !== undefined;
  }

  listen(options: { lang?: string; timeoutMs?: number } = {}): Promise<RecognitionResult> {
    const Ctor = this.getCtor();
    if (!Ctor) return Promise.reject(new Error("Speech recognition not supported"));

    return new Promise((resolve, reject) => {
      const recognition = new Ctor();
      this.active = recognition;
      recognition.lang = options.lang ?? "fr-FR";
      recognition.continuous = false;
      recognition.interimResults = false;
      recognition.maxAlternatives = 1;

      const timeout = setTimeout(() => {
        recognition.stop();
        reject(new Error("Speech recognition timed out"));
      }, options.timeoutMs ?? DEFAULT_TIMEOUT_MS);

      recognition.onresult = (event) => {
        clearTimeout(timeout);
        const result = event.results[0]?.[0];
        if (result) {
          resolve({ transcript: result.transcript, confidence: result.confidence });
        } else {
          reject(new Error("No speech detected"));
        }
      };
      recognition.onerror = (event) => {
        clearTimeout(timeout);
        reject(new Error(event.error));
      };
      recognition.onend = () => {
        clearTimeout(timeout);
        this.active = null;
      };

      recognition.start();
    });
  }

  cancel(): void {
    this.active?.abort();
    this.active = null;
  }
}

export const webSpeechRecognition = new WebSpeechRecognition();
