export type MatchStatus = "correct" | "accent_warning" | "minor_typo" | "incorrect";

export interface MatchResult {
  status: MatchStatus;
  /** which accepted answer it matched against, if any */
  matchedAgainst?: string;
}

const FUZZY_THRESHOLD = 0.85;

export function normalize(input: string): string {
  return input
    .trim()
    .toLowerCase()
    .replace(/\s*[.!?,;:]+$/g, "")
    .replace(/\s+/g, " ")
    .trim();
}

export function stripAccents(input: string): string {
  return input.normalize("NFD").replace(/[̀-ͯ]/g, "");
}

function levenshtein(a: string, b: string): number {
  const m = a.length;
  const n = b.length;
  if (m === 0) return n;
  if (n === 0) return m;

  let prev = Array.from({ length: n + 1 }, (_, j) => j);
  for (let i = 1; i <= m; i++) {
    const curr = [i];
    for (let j = 1; j <= n; j++) {
      const cost = a[i - 1] === b[j - 1] ? 0 : 1;
      curr[j] = Math.min(curr[j - 1] + 1, prev[j] + 1, prev[j - 1] + cost);
    }
    prev = curr;
  }
  return prev[n];
}

function similarity(a: string, b: string): number {
  const maxLen = Math.max(a.length, b.length);
  if (maxLen === 0) return 1;
  return 1 - levenshtein(a, b) / maxLen;
}

/**
 * Grades a free-typed answer against one or more accepted phrasings. Distinguishes an
 * accent-only mismatch (PLAN.md: warn, don't fail, the first time) from a real typo and from a
 * genuinely wrong answer — the caller decides how "accent_warning"/"minor_typo" affect scoring
 * (e.g. still counts as correct for SRS grading, but surfaces a gentle correction).
 */
export function matchAnswer(input: string, acceptedAnswers: string[]): MatchResult {
  const normInput = normalize(input);
  const strippedInput = stripAccents(normInput);

  let best: MatchResult = { status: "incorrect" };

  for (const accepted of acceptedAnswers) {
    const normAccepted = normalize(accepted);
    if (normInput === normAccepted) {
      return { status: "correct", matchedAgainst: accepted };
    }

    const strippedAccepted = stripAccents(normAccepted);
    if (strippedInput === strippedAccepted) {
      best = { status: "accent_warning", matchedAgainst: accepted };
      continue;
    }

    if (best.status === "incorrect" && similarity(strippedInput, strippedAccepted) >= FUZZY_THRESHOLD) {
      best = { status: "minor_typo", matchedAgainst: accepted };
    }
  }

  return best;
}

export function isPassing(status: MatchStatus): boolean {
  return status !== "incorrect";
}
