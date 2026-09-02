import { defineConfig } from "drizzle-kit";

// `drizzle-kit generate` only needs the dialect + schema to produce migration SQL — it doesn't
// connect to a database, so no DATABASE_URL is required just to (re)generate migrations locally.
export default defineConfig({
  dialect: "postgresql",
  schema: "./src/db/schema.ts",
  out: "./drizzle",
  dbCredentials: {
    url: process.env.DATABASE_URL ?? "postgres://placeholder/placeholder",
  },
  strict: true,
  verbose: true,
});
