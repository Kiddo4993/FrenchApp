"use client";

import { useCallback, useState } from "react";
import { ttsService } from "@/lib/audio";

export function useSpeak() {
  const [speaking, setSpeaking] = useState(false);

  const speak = useCallback(async (text: string) => {
    if (!ttsService.isSupported()) return;
    setSpeaking(true);
    try {
      await ttsService.speak(text);
    } catch {
      // Speech synthesis failures (no voices installed, interrupted utterance) are non-fatal —
      // the learner can still read the text on screen.
    } finally {
      setSpeaking(false);
    }
  }, []);

  return { speak, speaking, supported: ttsService.isSupported() };
}
