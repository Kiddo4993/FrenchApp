import path from "node:path";
import fs from "node:fs";
import { drizzle as drizzlePostgres } from "drizzle-orm/postgres-js";
import { drizzle as drizzlePglite } from "drizzle-orm/pglite";
import { PGlite } from "@electric-sql/pglite";
import postgres from "postgres";
import * as schema from "./schema";

/**
 * One schema, one dialect (Postgres) everywhere — no more maintaining a SQLite schema and a
 * Postgres schema in parallel. Locally, with no DATABASE_URL set, this runs against an embedded,
 * file-backed Postgres (PGlite — real Postgres compiled to WASM, not an emulation) so `npm run
 * dev` stays zero-config exactly like the SQLite setup did. Set DATABASE_URL (Vercel Postgres,
 * Neon, Supabase, or any standard Postgres connection string) to run against a real hosted
 * database instead — that's what a Vercel deployment needs, since serverless functions have no
 * persistent local disk. See DECISIONS.md.
 */
const DATABASE_URL = process.env.DATABASE_URL;

function createDb() {
  if (DATABASE_URL) {
    const client = postgres(DATABASE_URL, { max: 1 });
    return drizzlePostgres(client, { schema });
  }
  const DB_DIR = process.env.DATABASE_PATH ?? path.join(process.cwd(), "data", "maitrise-pg");
  fs.mkdirSync(path.dirname(DB_DIR), { recursive: true });
  const client = new PGlite(DB_DIR);
  return drizzlePglite(client, { schema });
}

// PGlite is a single-writer, file-locking embedded engine (like SQLite) — a second instance
// opened against the same directory while the first is still live will contend with it. Next.js
// dev's hot-module-reloading can re-evaluate this module (and re-run `createDb()`) more than once
// per process without tearing down the previous instance first, which produced exactly that:
// intermittent, transiently-stale reads (a freshly-bootstrapped row invisible to the very next
// render) right after a cold `next dev` start. Cache the instance on `globalThis` so HMR reuses
// the same live connection instead of racing a new one against it — the standard fix for this
// class of bug with any embedded/pooled DB client under Next dev.
//
// A lazy Proxy wrapper (constructing `db` only on first property access, to also dodge the rarer
// case of next-build's parallel "collecting page data" workers each importing this module) was
// tried and reverted — it made `db.transaction(...)` calls hang indefinitely, almost certainly
// because Drizzle's internals lose correct `this` identity when invoked through a Proxy. A hang in
// every seed/write path is a far worse trade than an occasional non-fatal WASM abort message
// during a local `npm run build` with no DATABASE_URL set (build still exits 0; production always
// sets DATABASE_URL and uses postgres-js, which has no single-writer constraint at all). See
// DECISIONS.md.
declare global {
  var __maitriseDb: ReturnType<typeof createDb> | undefined;
}

export const db = globalThis.__maitriseDb ?? createDb();
globalThis.__maitriseDb = db;

export type Db = typeof db;
export const usingHostedPostgres = Boolean(DATABASE_URL);
