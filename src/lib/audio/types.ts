export interface TtsOptions {
  rate?: number;
  pitch?: number;
}

export interface SpeechService {
  isSupported(): boolean;
  speak(text: string, options?: TtsOptions): Promise<void>;
  cancel(): void;
}

export interface RecognitionResult {
  transcript: string;
  confidence: number;
}

export interface RecognitionService {
  isSupported(): boolean;
  listen(options?: { lang?: string; timeoutMs?: number }): Promise<RecognitionResult>;
  cancel(): void;
}
