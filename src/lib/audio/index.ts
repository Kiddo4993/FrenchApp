export type { RecognitionResult, RecognitionService, SpeechService, TtsOptions } from "./types";
export { webSpeechTts } from "./webSpeechTts";
export { webSpeechRecognition } from "./webSpeechRecognition";

import { webSpeechTts } from "./webSpeechTts";
import { webSpeechRecognition } from "./webSpeechRecognition";

/** Swap these to a paid provider later without touching call sites. */
export const ttsService = webSpeechTts;
export const recognitionService = webSpeechRecognition;
