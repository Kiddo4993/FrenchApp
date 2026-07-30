import fs from "node:fs";
import path from "node:path";
import { conjugateVerb, VERB_LIST } from "../src/lib/conjugation";
import { verbFileSchema } from "../src/content/schema";

const OUT_PATH = path.join(__dirname, "..", "content", "verbs", "verbs.json");

const verbs = VERB_LIST.map((entry) => {
  const conjugated = conjugateVerb(entry);
  return {
    infinitive: conjugated.infinitive,
    group: conjugated.group,
    auxiliary: conjugated.auxiliary,
    pastParticiple: conjugated.pastParticiple,
    frequencyRank: entry.frequencyRank,
    conjugations: conjugated.conjugations,
  };
});

const parsed = verbFileSchema.safeParse(verbs);
if (!parsed.success) {
  console.error("Generated verbs.json failed schema validation:");
  for (const issue of parsed.error.issues.slice(0, 20)) {
    console.error(`  ${issue.path.join(".")}: ${issue.message}`);
  }
  process.exit(1);
}

fs.mkdirSync(path.dirname(OUT_PATH), { recursive: true });
fs.writeFileSync(OUT_PATH, `${JSON.stringify(parsed.data, null, 2)}\n`, "utf-8");
console.log(`Wrote ${parsed.data.length} verbs to ${OUT_PATH}`);
