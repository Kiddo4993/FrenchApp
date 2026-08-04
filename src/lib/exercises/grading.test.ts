import { describe, expect, it } from "vitest";
import { KIND_TO_TRACK, trackForKind } from "./grading";

describe("trackForKind", () => {
  it("maps single-card kinds to their SRS track", () => {
    expect(trackForKind("mcq_recognition")).toBe("recognition");
    expect(trackForKind("mcq_production")).toBe("production");
    expect(trackForKind("listening")).toBe("listening");
    expect(trackForKind("dictation")).toBe("spelling");
  });

  it("maps batch/curated kinds to null (XP-only, no SRS card update)", () => {
    expect(trackForKind("matching_pairs")).toBeNull();
    expect(trackForKind("reading_comprehension")).toBeNull();
    expect(trackForKind("odd_one_out")).toBeNull();
    expect(trackForKind("register_swap")).toBeNull();
    expect(trackForKind("conjugation_drill")).toBeNull();
  });

  it("every ExerciseKind has an explicit entry", () => {
    const kinds = Object.keys(KIND_TO_TRACK);
    expect(kinds.length).toBe(15);
  });
});
