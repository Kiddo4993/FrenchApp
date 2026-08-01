"use client";

import type { ExercisePrompt } from "@/types/exercise";
import { ClozeExercise } from "./ClozeExercise";
import { ConjugationDrillExercise } from "./ConjugationDrillExercise";
import { DictationExercise } from "./DictationExercise";
import { FreeTranslationExercise } from "./FreeTranslationExercise";
import { GenderDrillExercise } from "./GenderDrillExercise";
import { ListeningExercise } from "./ListeningExercise";
import { MatchingPairsExercise } from "./MatchingPairsExercise";
import { McqExercise } from "./McqExercise";
import { OddOneOutExercise } from "./OddOneOutExercise";
import { ReadingComprehensionExercise } from "./ReadingComprehensionExercise";
import { RegisterSwapExercise } from "./RegisterSwapExercise";
import { SentenceOrderingExercise } from "./SentenceOrderingExercise";
import { SpeakingExercise } from "./SpeakingExercise";
import { WordBankExercise } from "./WordBankExercise";

export function ExerciseRenderer({ prompt }: { prompt: ExercisePrompt }) {
  switch (prompt.kind) {
    case "mcq_recognition":
    case "mcq_production":
      return <McqExercise prompt={prompt} />;
    case "listening":
      return <ListeningExercise prompt={prompt} />;
    case "dictation":
      return <DictationExercise prompt={prompt} />;
    case "word_bank":
      return <WordBankExercise prompt={prompt} />;
    case "free_translation":
      return <FreeTranslationExercise prompt={prompt} />;
    case "cloze":
      return <ClozeExercise prompt={prompt} />;
    case "gender_drill":
      return <GenderDrillExercise prompt={prompt} />;
    case "conjugation_drill":
      return <ConjugationDrillExercise prompt={prompt} />;
    case "matching_pairs":
      return <MatchingPairsExercise prompt={prompt} />;
    case "speaking":
      return <SpeakingExercise prompt={prompt} />;
    case "sentence_ordering":
      return <SentenceOrderingExercise prompt={prompt} />;
    case "reading_comprehension":
      return <ReadingComprehensionExercise prompt={prompt} />;
    case "odd_one_out":
      return <OddOneOutExercise prompt={prompt} />;
    case "register_swap":
      return <RegisterSwapExercise prompt={prompt} />;
  }
}
