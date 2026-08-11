# Maîtrise — Build Plan

A1→C1 French learning app. Single learner, local-only, Next.js 15 + SQLite/Drizzle.
This document is the source of truth for scope. Checkboxes are updated after every phase.

---

## 1. Data Model

SQLite via Drizzle, schema written Postgres-compatible (no SQLite-only types, use `text` for enums,
`integer` timestamps in ms, explicit FK constraints) so it can move to Postgres later without a rewrite.

### Content tables (seeded from `/content`, versioned, read-mostly)

- **vocab_entries** — id, fr, en, lemma, pos, gender, plural, ipa, cefr, topic, register, exampleFr,
  exampleEn, collocations (json), fauxAmi, mnemonic, audioText. Unique(lemma, topic).
- **verbs** — id, infinitive, group ('er'|'ir'|'re'|'irregular'), auxiliary ('avoir'|'etre'|'both'),
  pastParticiple, frequencyRank.
- **verb_conjugations** — id, verbId, tense, person ('1s'|'2s'|'3s'|'1p'|'2p'|'3p'), form,
  isIrregular. Unique(verbId, tense, person).
- **grammar_points** — id, unitId, slug, title, explanationEn, examples (json: {fr,en,note}[]),
  commonMistakes (json), whyItTrips (json), searchTags (json).
- **sentences** — id, topic, cefr, fr, en, audioText, usedFor ('reading'|'dictation'|'ordering'|'cloze').
- **reading_passages** — id, cefr, topic, title, bodyFr, questions (json: {q,options,answer}[]).
- **levels** — id ('A1'..'C1'), title, order.
- **units** — id, levelId, order, slug, title, focus, topics (json list). 44 rows, static.
- **lessons** — id, unitId, order, kind ('lesson'|'review'|'boss'), title, skillFocus (json),
  topicSlug. ~5-8 lesson rows + 1 review + 1 boss per unit.
- **achievements** — id, slug, title, description, icon, criteria (json, evaluated by achievements
  engine), tier.

### User-state tables (mutable, all local to the one profile)

- **profile** — id (singleton row), name, createdAt, currentUnitId, placementDone.
- **settings** — profileId, dailyGoalXp (20|50|100|200), heartsEnabled (bool, default false),
  targetRetention (float, default 0.9), newCardsPerDay (int, default 15), theme ('light'|'dark'|'system'),
  reducedMotion (bool).
- **cards** — id, vocabId (nullable), grammarPointId (nullable), track
  ('recognition'|'production'|'listening'|'spelling'), state ('new'|'learning'|'review'|'relearning'),
  stability, difficulty, retrievability, reps, lapses, lastReview (ts), dueDate (ts), isLeech (bool).
  Unique(vocabId, track). One card family per vocab item, one row per track.
- **review_logs** — id, cardId, ts, grade ('again'|'hard'|'good'|'easy'), correct (bool),
  latencyMs, hintUsed (bool), stabilityBefore, stabilityAfter.
- **lesson_progress** — id, lessonId, status ('locked'|'available'|'in_progress'|'complete'),
  crownLevel (0-5), bestAccuracy, lastCompletedAt.
- **unit_progress** — id, unitId, status ('locked'|'available'|'in_progress'|'complete'|'gold'|'cracked'),
  bossScore, masteredAt.
- **xp_events** — id, ts, amount, source ('exercise'|'perfect_lesson'|'boss'|'achievement').
- **user_stats** — id (singleton), totalXp, level, currentStreak, longestStreak, freezesAvailable,
  lastActiveDate, weekendAmuletActive, hearts, heartsRefillAt.
- **user_achievements** — id, achievementId, unlockedAt.
- **session_logs** — id, date, minutesStudied, exercisesCompleted — powers the study heatmap.
- **placement_result** — id (singleton), score, recommendedUnitId, completedAt, answers (json).

### Relationships

`levels 1—N units 1—N lessons`; `units 1—N grammar_points`; `vocab_entries 1—N cards` (1 per track, up
to 4); `cards 1—N review_logs`; `lessons N—1 units`, `lesson_progress 1—1 lessons`,
`unit_progress 1—1 units`. Everything user-state keys off a singleton `profile` — no multi-tenant
plumbing since this is explicitly single-user.

---

## 2. Curriculum Map (44 units)

Each unit = 5–8 lessons + 1 review lesson + 1 boss test (≥85% to unlock next unit).

### A1 — Débutant (10 units)
1. Premiers pas — salutations, se présenter, alphabet, être (present)
2. Qui êtes-vous ? — famille, pronoms sujets, avoir (present)
3. Nombres, dates et heure — chiffres 0–100, jours, mois, l'heure
4. Couleurs et descriptions — couleurs, formes, accord des adjectifs, articles définis/indéfinis
5. À table — nourriture, boissons, articles partitifs, verbes -er réguliers
6. Chez moi — la maison, meubles, prépositions de lieu, il y a
7. Ma journée — routine quotidienne, verbes pronominaux (intro), présent régulier
8. À l'école — matières scolaires, verbes -ir réguliers, formation des questions
9. Les courses — argent, nombres 70–1000, adjectifs démonstratifs
10. En ville — transports, directions, aller + destination, impératif

### A2 — Élémentaire (10 units)
1. Hier — passé composé (avoir)
2. C'était comment ? — passé composé (être), verbes pronominaux au passé
3. Autrefois — imparfait
4. Bientôt — futur proche, projets
5. Le corps et la santé — corps, chez le médecin, pronoms COD
6. Vêtements et mode — habillement, pronoms COI
7. Voyages et vacances — voyages, comparatifs
8. Le travail — métiers, superlatifs
9. Météo et saisons — météo, saisons, pronoms y et en
10. Nature et animaux — faune/flore, révision + boss renforcé

### B1 — Intermédiaire (10 units)
1. L'avenir — futur simple
2. Si j'avais... — conditionnel présent
3. Il faut que — subjonctif présent (introduction)
4. Opinions et arguments — subjonctif (verbes d'opinion), pronoms relatifs qui/que
5. Technologie — pronoms relatifs dont/où, internet et réseaux
6. Sport et forme — comparatifs/superlatifs avancés
7. Musique, art et cinéma — révision des temps du passé
8. Livres et littérature — discours indirect (intro)
9. Émotions et personnalité — verbes pronominaux avancés
10. Amitié et amour — subjonctif (révision), boss d'unité

### B2 — Avancé (8 units)
1. Le plus-que-parfait — plus-que-parfait
2. Subjonctif passé — subjonctif passé
3. La voix passive — passif
4. Discours indirect — concordance des temps
5. Administration et banque — la paperasse, registre soutenu
6. Politique et société — débat, nuance
7. Environnement et science — argumentation
8. Droit et économie — registre soutenu (révision), boss d'unité

### C1 — Maîtrise (6 units)
1. Temps littéraires — passé simple, subjonctif imparfait (reconnaissance)
2. Idiomes et expressions — expressions idiomatiques
3. Écriture formelle — correspondance formelle
4. Débat abstrait — philosophie, médias, journalisme
5. Registre familier et argot — familier, verlan
6. Maîtrise totale — synthèse, histoire et culture, boss final

---

## 3. Topic List (40 topics, each ≥80 vocab entries across CEFR levels)

Salutations & introductions · Family & relationships · Numbers, dates & time · Colours & shapes ·
Food & drink · Restaurants & ordering · The house & furniture · Clothing & fashion · Body & health ·
Daily routine · School & education · Work & professions · Shopping & money · Transport & directions ·
Travel & holidays · Weather & seasons · Nature & animals · City & buildings · Technology & internet ·
Sports & fitness · Music, art & film · Books & literature · Emotions & personality · Hobbies & free time ·
Friendship & love · Phone & communication · Banking & admin · Politics & society · Environment & climate ·
Science & innovation · Law & justice · Business & economics · Media & journalism ·
Philosophy & abstract ideas · History & culture française · Idioms & expressions · Slang & verlan ·
Connectors & discourse markers · Faux amis · Formal writing & correspondence

Target: 4,000+ total entries. `scripts/validate-content.ts` fails the build if any topic has <80
entries, any entry is missing a required field, or a duplicate lemma exists within a topic.

---

## 4. Exercise Type Catalogue

All implement one `<ExerciseShell>` contract: `prompt → input → validate → feedback → next`.
SRS track column shows which card track (recognition/production/listening/spelling) each type drives.

| Type | Track fed | Notes |
|---|---|---|
| Multiple choice FR→EN / EN→FR | recognition / production | distractors: same topic + POS |
| Listening comprehension | listening | plays audio, pick or type |
| Dictation | spelling | accent-sensitive exact match |
| Word bank translation | production | scrambled tiles → sentence |
| Free translation | production | fuzzy match, accents warn-only on first miss |
| Fill in the blank | recognition/production | cloze in context sentence |
| Gender drill | recognition | le/la/l'/les rapid-fire |
| Conjugation drill | production | infinitive+subject+tense → form |
| Matching pairs | recognition | timed 6-pair grid |
| Speaking | production (pronunciation) | Web Speech recognition, skip button |
| Sentence ordering | production | reorder scrambled words |
| Reading comprehension | recognition | passage + questions |
| Odd one out | recognition | semantic category |
| Register swap | production | familier→soutenu, B1+ only |

Lesson composition: 12–18 exercises, mixed types weighted toward weak cards, no repeated word
back-to-back. Wrong answers: show correct form + 1-line rule explanation, re-queue at end of lesson.

---

## 5. Progression + SRS Spec

### FSRS scheduler
- Per-card: `stability, difficulty, retrievability, reps, lapses, lastReview, dueDate, state`.
- Grades (`again|hard|good|easy`) inferred, never self-reported:
  - incorrect → **again**
  - correct, latency > 2.5× the card's rolling median or a hint was used → **hard**
  - correct, latency within normal band → **good**
  - correct, latency < 0.6× rolling median and no hint → **easy**
- `targetRetention` default 0.9, configurable in settings.
- Daily queue: due reviews first, then new cards up to `newCardsPerDay` (default 15), interleaved
  (not all reviews then all new) to avoid fatigue clustering.
- Leech: `lapses >= 6` → flag `isLeech`, surface in "mots difficiles", auto-generate an extra mnemonic
  + 2 extra example sentences for that item.
- Four independent scheduling tracks per vocab item (recognition/production/listening/spelling) — a
  word can be `review` in recognition and `learning` in production simultaneously.

### XP & levels
- Base 10 XP/exercise, 15 XP for hard types (dictation, speaking, free translation, register swap),
  2× multiplier on a perfect (zero-mistake) lesson.
- `xpForLevel(n) = 100 * n^1.5`, cumulative; level-up triggers a celebration screen.
- Daily goal presets: Casual 20 / Regular 50 / Serious 100 / Intense 200.

### Streaks
- Day streak + calendar heatmap. 1 freeze earned per 7-day streak, cap 2. Weekend amulet (streak
  doesn't break Sat/Sun if earned). 24h streak-repair window after a miss.

### Hearts
- Implemented, gated behind a settings toggle, **default OFF**.

### Mastery & decay
- Decay curve = FSRS retrievability at "now" per card. Unit-level mastery = mean retrievability of
  its cards' recognition track. Unit visibly cracks (gold → cracked gold) when unit mastery < 0.70.
- Home screen surfaces `"Réviser — N mots à revoir"` whenever due-card count > 0.

### Skill tree unlock rule
- All lessons in a unit complete (crown ≥1) + boss test ≥85% → next unit becomes available.
- Crown levels 1–5 per lesson node; level 5 restricted to free-translation + speaking exercise types.

### Placement test
- Adaptive 20-question test on first launch (mixed vocab/grammar difficulty, branches up/down based
  on running correctness), maps score to a starting unit instead of forcing A1.

### Achievements
- ≥30, e.g. Bilingue en herbe (500 words), Conjugueur (1,000 verb drills), Sans Faute (10 perfect
  lessons), Noctambule (study after midnight), Marathonien (30-day streak), Subjonctif Survivor.

---

## 6. Grammar System
- `GrammarLesson` page per unit: English explanation, 6–10 annotated examples, common-mistakes
  callout, "why this trips up English speakers" note.
- Searchable grammar reference, topic-organized, always accessible from nav.
- Grammar drills feed the same SRS engine as vocab (grammarPointId cards).
- Conjugation trainer: pick verbs + tenses, timed drilling, accuracy-per-tense matrix.

## 7. Dashboard & Analytics (`/progress`)
Words known by level/topic (stacked bar) · retention curve over time · accuracy by exercise type
(radar) · accuracy by grammar concept · time-studied heatmap · weakest 20 words with one-click drill ·
projected vocab size at 30/90/365 days. Recharts, all data local.

## 8. Design Direction
Ink navy (`#0B1F3A`) base, warm cream surfaces (`#FAF6EE`), accent bleu de France `#0055A4`, gold
(`#D4AF37`) reserved for mastery states only. Display serif for French text (Fraunces or similar),
geometric sans for UI (Inter). Mobile-first from 390px. Spring motion 150–250ms, restrained
celebration. Full keyboard support (Enter to check/continue, 1–4 to pick options). Dark mode,
`prefers-reduced-motion` respected, ARIA labels throughout.

---

## 9. Build Order

- [x] Phase 0 — PLAN.md, DECISIONS.md
- [x] Phase 1 — Scaffold Next.js 15 + TS strict, Tailwind, shadcn/ui, Drizzle schema + migrations,
      `scripts/validate-content.ts`
- [x] Phase 2 — Content: vocab bank (40/40 topics, 4,406 entries), grammar notes (44 units), verb
      tables (120 verbs) + conjugation engine. Sentences/readings/register-swap supplementary content
      partially seeded (10/40 reading topics) — see DECISIONS.md.
- [x] Phase 3 — FSRS engine + unit tests (no UI)
- [x] Phase 4 — Exercise components + `<ExerciseShell>` (all 14 types, generation wired + crown gating)
- [x] Phase 5 — Lesson runner + session results screen (SRS grading, XP, streaks, unlocking,
      achievements all wired end-to-end; verified live in-browser, not just typecheck)
- [x] Phase 6 — Skill tree, XP, levels, unlocking (home page; unit mastery/crack computed live)
- [ ] Phase 7 — Streaks, achievements, daily goals, placement test (engine + data model done;
      dedicated UI pages pending)
- [ ] Phase 8 — Grammar section + conjugation trainer
- [ ] Phase 9 — Dashboard & analytics
- [x] Phase 10 — Audio/TTS layer + speaking exercises
- [ ] Phase 11 — Polish pass: animations, sounds, dark mode, keyboard shortcuts, empty states, favicon
- [ ] Phase 12 — Seed realistic demo profile (week 1 / 12 / 52 snapshots)

Each phase ends with: typecheck → tests → git commit → PLAN.md checkbox update.
