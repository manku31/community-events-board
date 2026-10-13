import { createHash } from "node:crypto";
import { readdir, readFile } from "node:fs/promises";
import { resolve } from "node:path";
import { closeDb, transaction } from "../lib/server/db";

async function migrate() {
  const directory = resolve("db/migrations");
  const files = (await readdir(directory)).filter((name) => /^\d+_[a-z0-9_]+\.sql$/.test(name)).sort();
  await transaction(async (client) => {
    // Transaction-level locking also works with Neon's transaction pooler.
    await client.query("SELECT pg_advisory_xact_lock(819572, 1)");
    await client.query("CREATE SCHEMA IF NOT EXISTS app_auth");
    await client.query(`CREATE TABLE IF NOT EXISTS app_auth.schema_migrations (
      name TEXT PRIMARY KEY, checksum CHAR(64) NOT NULL,
      applied_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP
    )`);
    for (const name of files) {
      const sql = await readFile(resolve(directory, name), "utf8");
      const checksum = createHash("sha256").update(sql).digest("hex");
      const existing = await client.query<{ checksum: string }>(
        "SELECT checksum FROM app_auth.schema_migrations WHERE name = $1", [name],
      );
      if (existing.rows[0]) {
        if (existing.rows[0].checksum !== checksum) {
          throw new Error(`Applied migration ${name} was modified; add a new migration instead.`);
        }
        console.log(`Already applied: ${name}`);
        continue;
      }
      await client.query(sql);
      await client.query("INSERT INTO app_auth.schema_migrations(name, checksum) VALUES ($1, $2)", [name, checksum]);
      console.log(`Applied: ${name}`);
    }
  });
  console.log("Database migrations complete.");
}

migrate().catch((error: unknown) => {
  const code = error && typeof error === "object" && "code" in error ? String(error.code) : "UNKNOWN";
  // Do not print database errors, URLs, passwords, or connection parameters.
  console.error(`Migration failed (${code}). Check database connectivity and migration checksums.`);
  process.exitCode = 1;
}).finally(closeDb);
