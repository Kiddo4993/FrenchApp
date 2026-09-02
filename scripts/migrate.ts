import fs from "node:fs";
import path from "node:path";

const DATABASE_URL = process.env.DATABASE_URL;

async function migratePostgres(url: string) {
  const { drizzle } = await import("drizzle-orm/postgres-js");
  const { migrate } = await import("drizzle-orm/postgres-js/migrator");
  const postgres = (await import("postgres")).default;
  const client = postgres(url, { max: 1 });
  const db = drizzle(client);
  await migrate(db, { migrationsFolder: path.join(process.cwd(), "drizzle") });
  await client.end();
  console.log(`Migrations applied to hosted Postgres (${new URL(url).hostname}).`);
}

async function migratePglite() {
  const { drizzle } = await import("drizzle-orm/pglite");
  const { migrate } = await import("drizzle-orm/pglite/migrator");
  const { PGlite } = await import("@electric-sql/pglite");
  const DB_DIR = process.env.DATABASE_PATH ?? path.join(process.cwd(), "data", "maitrise-pg");
  fs.mkdirSync(path.dirname(DB_DIR), { recursive: true });
  const client = new PGlite(DB_DIR);
  const db = drizzle(client);
  await migrate(db, { migrationsFolder: path.join(process.cwd(), "drizzle") });
  console.log(`Migrations applied to local embedded Postgres (${DB_DIR}).`);
}

async function main() {
  if (DATABASE_URL) {
    await migratePostgres(DATABASE_URL);
  } else {
    await migratePglite();
  }
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
