import { fireEvent, render, screen } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";
import type { McqPrompt } from "@/types/exercise";
import { ExerciseShell } from "./ExerciseShell";
import { McqExercise } from "./McqExercise";

function makePrompt(id: string): McqPrompt {
  return {
    id,
    kind: "mcq_recognition",
    promptText: "le chat",
    options: ["cat", "dog", "house", "car"],
    correctIndex: 0,
  };
}

function renderMcq(prompt: McqPrompt, onComplete = vi.fn()) {
  render(
    <ExerciseShell prompt={prompt} progress={{ current: 1, total: 5 }} onComplete={onComplete}>
      <McqExercise prompt={prompt} />
    </ExerciseShell>,
  );
  return onComplete;
}

describe("ExerciseShell + McqExercise", () => {
  it("selecting the correct option shows correct feedback; Continuer calls onComplete", () => {
    const onComplete = renderMcq(makePrompt("p1"));
    fireEvent.click(screen.getByText("cat"));
    expect(screen.getByText("Correct !")).toBeTruthy();

    fireEvent.click(screen.getByText("Continuer"));
    expect(onComplete).toHaveBeenCalledTimes(1);
    expect(onComplete.mock.calls[0][0]).toMatchObject({ correct: true, userAnswer: "cat" });
    expect(onComplete.mock.calls[0][0].latencyMs).toBeGreaterThanOrEqual(0);
  });

  it("selecting the wrong option shows incorrect feedback and reports correct:false", () => {
    const onComplete = renderMcq(makePrompt("p2"));
    fireEvent.click(screen.getByText("dog"));
    expect(screen.getByText("Pas tout à fait")).toBeTruthy();

    fireEvent.click(screen.getByText("Continuer"));
    expect(onComplete.mock.calls[0][0]).toMatchObject({ correct: false, userAnswer: "dog" });
  });

  it("number key 1-4 activates the corresponding option", () => {
    renderMcq(makePrompt("p3"));
    fireEvent.keyDown(window, { key: "1" });
    expect(screen.getByText("Correct !")).toBeTruthy();
  });

  it("Enter on the feedback screen advances to the next exercise", () => {
    const onComplete = renderMcq(makePrompt("p4"));
    fireEvent.click(screen.getByText("cat"));
    fireEvent.keyDown(window, { key: "Enter" });
    expect(onComplete).toHaveBeenCalledTimes(1);
  });

  it("resets to the answering phase when the prompt id changes", () => {
    const onComplete = vi.fn();
    const { rerender } = render(
      <ExerciseShell prompt={makePrompt("p5")} progress={{ current: 1, total: 5 }} onComplete={onComplete}>
        <McqExercise prompt={makePrompt("p5")} />
      </ExerciseShell>,
    );
    fireEvent.click(screen.getByText("cat"));
    expect(screen.getByText("Correct !")).toBeTruthy();

    rerender(
      <ExerciseShell prompt={makePrompt("p6")} progress={{ current: 2, total: 5 }} onComplete={onComplete}>
        <McqExercise prompt={makePrompt("p6")} />
      </ExerciseShell>,
    );
    // Framer Motion's exit animation keeps the old feedback node mounted mid-transition under
    // jsdom (no real animation frames), so assert on the new answering-phase UI being live
    // (number-key shortcuts re-registered) rather than the old node's absence.
    fireEvent.keyDown(window, { key: "2" });
    expect(onComplete).not.toHaveBeenCalled();
    fireEvent.click(screen.getByText("Continuer"));
    expect(onComplete).toHaveBeenCalledTimes(1);
    expect(onComplete.mock.calls[0][0]).toMatchObject({ correct: false, userAnswer: "dog" });
  });
});
