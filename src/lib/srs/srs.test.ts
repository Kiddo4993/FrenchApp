import { describe, expect, it } from "vitest";
import { inferGrade } from "./grade";
import { currentRetrievability, newCardSnapshot, scheduleReview } from "./fsrs";
import { buildDailyQueue, type QueueCard } from "./queue";
import type { CardSnapshot } from "./types";

const NOW = new Date("2026-01-01T12:00:00Z");

describe("scheduleReview — new card transitions", () => {
  it("new + again -> learning, due in ~10 minutes, no lapse recorded", () => {
    const result = scheduleReview(newCardSnapshot(NOW), "again", NOW);
    expect(result.card.state).toBe("learning");
    expect(result.card.lapses).toBe(0);
    expect(result.card.reps).toBe(1);
    const minutesAhead = (result.card.dueDate.getTime() - NOW.getTime()) / 60000;
    expect(minutesAhead).toBeCloseTo(10, 0);
  });

  it("new + good -> review, due days in the future, positive stability", () => {
    const result = scheduleReview(newCardSnapshot(NOW), "good", NOW);
    expect(result.card.state).toBe("review");
    expect(result.card.stability).toBeGreaterThan(0);
    expect(result.card.dueDate.getTime()).toBeGreaterThan(NOW.getTime() + 24 * 60 * 60 * 1000);
  });

  it("new + easy produces a longer interval than new + good", () => {
    const good = scheduleReview(newCardSnapshot(NOW), "good", NOW);
    const easy = scheduleReview(newCardSnapshot(NOW), "easy", NOW);
    expect(easy.card.dueDate.getTime()).toBeGreaterThan(good.card.dueDate.getTime());
  });
});

describe("scheduleReview — learning transitions", () => {
  function learningCard(): CardSnapshot {
    return scheduleReview(newCardSnapshot(NOW), "again", NOW).card;
  }

  it("learning + again stays in learning and resets the short step", () => {
    const card = learningCard();
    const later = new Date(card.dueDate.getTime());
    const result = scheduleReview(card, "again", later);
    expect(result.card.state).toBe("learning");
    expect(result.card.dueDate.getTime()).toBeGreaterThan(later.getTime());
  });

  it("learning + good graduates to review", () => {
    const card = learningCard();
    const later = new Date(card.dueDate.getTime());
    const result = scheduleReview(card, "good", later);
    expect(result.card.state).toBe("review");
    expect(result.card.dueDate.getTime()).toBeGreaterThan(later.getTime());
  });
});

describe("scheduleReview — review transitions", () => {
  function reviewCard(): CardSnapshot {
    return scheduleReview(newCardSnapshot(NOW), "good", NOW).card;
  }

  it("review + good extends the interval and keeps state=review", () => {
    const card = reviewCard();
    const reviewTime = card.dueDate;
    const result = scheduleReview(card, "good", reviewTime);
    expect(result.card.state).toBe("review");
    expect(result.card.stability).toBeGreaterThan(card.stability);
    expect(result.card.dueDate.getTime()).toBeGreaterThan(reviewTime.getTime());
  });

  it("review + again is a lapse: state=relearning, lapses+1, short due step", () => {
    const card = reviewCard();
    const reviewTime = card.dueDate;
    const result = scheduleReview(card, "again", reviewTime);
    expect(result.card.state).toBe("relearning");
    expect(result.card.lapses).toBe(card.lapses + 1);
    const minutesAhead = (result.card.dueDate.getTime() - reviewTime.getTime()) / 60000;
    expect(minutesAhead).toBeCloseTo(10, 0);
  });
});

describe("scheduleReview — relearning transitions", () => {
  function relearningCard(): CardSnapshot {
    const reviewed = scheduleReview(newCardSnapshot(NOW), "good", NOW).card;
    return scheduleReview(reviewed, "again", reviewed.dueDate).card;
  }

  it("relearning + again stays in relearning", () => {
    const card = relearningCard();
    const result = scheduleReview(card, "again", card.dueDate);
    expect(result.card.state).toBe("relearning");
  });

  it("relearning + good graduates back to review", () => {
    const card = relearningCard();
    const result = scheduleReview(card, "good", card.dueDate);
    expect(result.card.state).toBe("review");
  });
});

describe("leech detection", () => {
  it("flags becameLeech exactly once six lapses in, and isLeech stays true after", () => {
    let card = scheduleReview(newCardSnapshot(NOW), "good", NOW).card;
    let now = card.dueDate;
    let flaggedAt = -1;

    for (let i = 1; i <= 8; i++) {
      const failResult = scheduleReview(card, "again", now);
      if (failResult.becameLeech) flaggedAt = i;
      card = failResult.card;
      now = card.dueDate;
      // graduate back to review so the next "again" is a genuine review-state lapse
      const recover = scheduleReview(card, "good", now);
      card = recover.card;
      now = card.dueDate;
    }

    expect(flaggedAt).toBe(6);
    expect(card.isLeech).toBe(true);
  });
});

describe("currentRetrievability", () => {
  it("is 1 for a freshly reviewed card and decays as time passes", () => {
    const card = scheduleReview(newCardSnapshot(NOW), "good", NOW).card;
    const atReview = currentRetrievability(card, card.lastReview!);
    const muchLater = currentRetrievability(
      card,
      new Date(card.lastReview!.getTime() + 365 * 24 * 60 * 60 * 1000),
    );
    expect(atReview).toBeCloseTo(1, 5);
    expect(muchLater).toBeLessThan(atReview);
    expect(muchLater).toBeGreaterThanOrEqual(0);
  });
});

describe("inferGrade", () => {
  it("incorrect answers are always 'again' regardless of latency/hints", () => {
    expect(inferGrade({ correct: false, latencyMs: 100, hintUsed: false })).toBe("again");
  });

  it("correct + hint used -> hard, even if fast", () => {
    expect(inferGrade({ correct: true, latencyMs: 100, hintUsed: true })).toBe("hard");
  });

  it("correct + much slower than median -> hard", () => {
    expect(
      inferGrade({ correct: true, latencyMs: 10_000, hintUsed: false, medianLatencyMs: 4000 }),
    ).toBe("hard");
  });

  it("correct + much faster than median, no hint -> easy", () => {
    expect(
      inferGrade({ correct: true, latencyMs: 1000, hintUsed: false, medianLatencyMs: 4000 }),
    ).toBe("easy");
  });

  it("correct + roughly typical latency -> good", () => {
    expect(
      inferGrade({ correct: true, latencyMs: 4000, hintUsed: false, medianLatencyMs: 4000 }),
    ).toBe("good");
  });
});

describe("buildDailyQueue", () => {
  function card(id: string, state: QueueCard["state"], dueOffsetMs: number): QueueCard {
    return { id, state, dueDate: new Date(NOW.getTime() + dueOffsetMs) };
  }

  it("includes only due (non-new) cards and new cards up to the daily cap", () => {
    const cards: QueueCard[] = [
      card("due-1", "review", -1000),
      card("due-2", "review", -500),
      card("not-due-yet", "review", 500),
      card("new-1", "new", 0),
      card("new-2", "new", 0),
      card("new-3", "new", 0),
    ];
    const queue = buildDailyQueue(cards, NOW, 2);
    const ids = queue.map((c) => c.id);
    expect(ids).toContain("due-1");
    expect(ids).toContain("due-2");
    expect(ids).not.toContain("not-due-yet");
    expect(ids.filter((id) => id.startsWith("new-")).length).toBe(2);
  });

  it("interleaves new cards through the due queue rather than appending them all at the end", () => {
    const due = Array.from({ length: 6 }, (_, i) => card(`due-${i}`, "review", -1000 + i));
    const fresh = [card("new-1", "new", 0), card("new-2", "new", 0)];
    const queue = buildDailyQueue([...due, ...fresh], NOW, 2);
    const positions = queue.map((c, i) => (c.id.startsWith("new-") ? i : -1)).filter((i) => i >= 0);
    expect(positions[0]).toBeLessThan(queue.length - 1);
    expect(positions[positions.length - 1]).toBeLessThan(queue.length - 1);
  });

  it("preserves due-card ordering by dueDate ascending", () => {
    const cards: QueueCard[] = [
      card("later", "review", -100),
      card("earlier", "review", -2000),
    ];
    const queue = buildDailyQueue(cards, NOW, 0);
    expect(queue.map((c) => c.id)).toEqual(["earlier", "later"]);
  });
});
