import { beforeEach, describe, expect, it } from "vitest";
import type { ExercisePrompt } from "@/types/exercise";
import { useLessonSessionStore } from "./lesson-session";

function mcq(id: string, cardId: string): ExercisePrompt {
  return {
    id,
    kind: "mcq_recognition",
    cardId,
    promptText: id,
    options: ["a", "b", "c", "d"],
    correctIndex: 0,
  };
}

beforeEach(() => {
  useLessonSessionStore.getState().reset();
});

describe("useLessonSessionStore", () => {
  it("start() loads the queue and resets counters", () => {
    const prompts = [mcq("p1", "c1"), mcq("p2", "c2")];
    useLessonSessionStore.getState().start("lesson-1", 2, prompts);
    const state = useLessonSessionStore.getState();
    expect(state.lessonId).toBe("lesson-1");
    expect(state.crownLevel).toBe(2);
    expect(state.queue).toEqual(prompts);
    expect(state.totalExercises).toBe(2);
    expect(state.isComplete).toBe(false);
  });

  it("a correct answer advances the queue and records a first-attempt result", () => {
    useLessonSessionStore.getState().start("lesson-1", 1, [mcq("p1", "c1"), mcq("p2", "c2")]);
    useLessonSessionStore.getState().recordOutcome({ correct: true, userAnswer: "a", hintUsed: false, latencyMs: 1000 });
    const state = useLessonSessionStore.getState();
    expect(state.queue.map((p) => p.id)).toEqual(["p2"]);
    expect(state.firstAttemptResults).toEqual([{ kind: "mcq_recognition", correct: true }]);
    expect(state.isComplete).toBe(false);
  });

  it("an incorrect answer re-queues the item at the end instead of dropping it", () => {
    useLessonSessionStore.getState().start("lesson-1", 1, [mcq("p1", "c1"), mcq("p2", "c2")]);
    useLessonSessionStore.getState().recordOutcome({ correct: false, userAnswer: "x", hintUsed: false, latencyMs: 1000 });
    const state = useLessonSessionStore.getState();
    // p1 should reappear later in the queue, not immediately next (never repeat the same word twice in a row)
    expect(state.queue.map((p) => p.id)).toEqual(["p2", "p1"]);
    expect(state.firstAttemptResults).toEqual([{ kind: "mcq_recognition", correct: false }]);
  });

  it("retrying a re-queued item does not add a second first-attempt result", () => {
    useLessonSessionStore.getState().start("lesson-1", 1, [mcq("p1", "c1"), mcq("p2", "c2")]);
    useLessonSessionStore.getState().recordOutcome({ correct: false, userAnswer: "x", hintUsed: false, latencyMs: 1000 }); // p1 wrong, requeued
    useLessonSessionStore.getState().recordOutcome({ correct: true, userAnswer: "b", hintUsed: false, latencyMs: 1000 }); // p2 correct
    let state = useLessonSessionStore.getState();
    expect(state.queue.map((p) => p.id)).toEqual(["p1"]);
    useLessonSessionStore.getState().recordOutcome({ correct: true, userAnswer: "a", hintUsed: false, latencyMs: 1000 }); // p1 retry, correct
    state = useLessonSessionStore.getState();
    expect(state.firstAttemptResults).toEqual([
      { kind: "mcq_recognition", correct: false },
      { kind: "mcq_recognition", correct: true },
    ]);
    expect(state.isComplete).toBe(true);
  });

  it("marks the session complete once the queue empties", () => {
    useLessonSessionStore.getState().start("lesson-1", 1, [mcq("p1", "c1")]);
    useLessonSessionStore.getState().recordOutcome({ correct: true, userAnswer: "a", hintUsed: false, latencyMs: 1000 });
    expect(useLessonSessionStore.getState().isComplete).toBe(true);
  });
});
