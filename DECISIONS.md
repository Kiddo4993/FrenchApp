# Decisions Log

Judgment calls made while building, newest first.

---

### 2026-07-26 — Isolated git repo
`frenchapp/` was created inside a git repo rooted at the user's home directory (`~`), which also had
a real `origin` remote pointing at an unrelated GitHub repo. Flagged to the user; they chose to
`git init` a fresh, self-contained repo scoped to `frenchapp/` only. No changes made to the
home-directory repo.

### 2026-07-26 — Curriculum unit count vs. exact prompt table
Prompt table specifies 10/10/10/8/6 units for A1/A2/B1/B2/C1 (44 total). Used that exactly; assigned
concrete titles/grammar focus per unit in PLAN.md §2 since the prompt only gave level-level focus, not
per-unit breakdown.

### 2026-07-26 — Postgres-compatible SQLite schema
Drizzle's SQLite dialect used for actual storage (file-based, zero-config per spec), but schema avoids
SQLite-only patterns (e.g. no `WITHOUT ROWID`, timestamps as integer-ms not SQLite `julianday`, enums
as `text` with app-level union types) so a future move to `drizzle-orm/pg-core` is a driver swap, not a
schema rewrite.
