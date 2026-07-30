import type { CardState } from "./types";

export interface QueueCard {
  id: string;
  state: CardState;
  dueDate: Date;
}

/**
 * Due reviews first, new cards capped at `newCardsPerDay` and spread evenly through the due
 * queue (not dumped at the end) so a session doesn't front-load fifty reviews before any new
 * material. `cards` should already be in curriculum order for ties among new cards.
 */
export function buildDailyQueue<T extends QueueCard>(
  cards: T[],
  now: Date,
  newCardsPerDay: number,
): T[] {
  const due = cards
    .filter((c) => c.state !== "new" && c.dueDate.getTime() <= now.getTime())
    .sort((a, b) => a.dueDate.getTime() - b.dueDate.getTime());
  const fresh = cards.filter((c) => c.state === "new").slice(0, Math.max(0, newCardsPerDay));

  return interleave(due, fresh);
}

function interleave<T>(due: T[], fresh: T[]): T[] {
  if (fresh.length === 0) return due;
  if (due.length === 0) return fresh;

  const step = Math.max(1, Math.ceil(due.length / (fresh.length + 1)));
  const result: T[] = [];
  let freshIdx = 0;
  due.forEach((card, i) => {
    result.push(card);
    if ((i + 1) % step === 0 && freshIdx < fresh.length) {
      result.push(fresh[freshIdx]);
      freshIdx++;
    }
  });
  while (freshIdx < fresh.length) {
    result.push(fresh[freshIdx]);
    freshIdx++;
  }
  return result;
}
