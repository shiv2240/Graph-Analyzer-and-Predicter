import fs from "fs";
import path from "path";
import { Pool } from "pg";
import { getDirectPool } from "./client";
import { logger } from "../utils/logger";

const MIGRATIONS_DIR = path.resolve(__dirname, "../../../database/migrations");

interface MigrationRecord {
  id: number;
  filename: string;
  applied_at: string;
}

let migrationPool: Pool | null = null;

function getMigrationPool(): Pool {
  if (!migrationPool) {
    migrationPool = getDirectPool();
  }
  return migrationPool;
}

async function ensureMigrationsTable(): Promise<void> {
  const pool = getMigrationPool();
  await pool.query(`
    CREATE TABLE IF NOT EXISTS schema_migrations (
      id          SERIAL PRIMARY KEY,
      filename    VARCHAR(256) NOT NULL UNIQUE,
      applied_at  TIMESTAMPTZ NOT NULL DEFAULT NOW()
    )
  `);
}

async function getAppliedMigrations(): Promise<Set<string>> {
  const pool = getMigrationPool();
  const result = await pool.query<MigrationRecord>(
    "SELECT filename FROM schema_migrations ORDER BY id"
  );
  return new Set(result.rows.map((r) => r.filename));
}

async function applyMigration(filename: string, sql: string): Promise<void> {
  const pool = getMigrationPool();
  const client = await pool.connect();
  try {
    await client.query("BEGIN");
    await client.query(sql);
    await client.query(
      "INSERT INTO schema_migrations (filename) VALUES ($1)",
      [filename]
    );
    await client.query("COMMIT");
    logger.info({ filename }, "Migration applied");
  } catch (err) {
    await client.query("ROLLBACK");
    throw err;
  } finally {
    client.release();
  }
}

export async function runMigrations(): Promise<void> {
  logger.info("Starting database migrations");
  await ensureMigrationsTable();

  const applied = await getAppliedMigrations();

  const files = fs
    .readdirSync(MIGRATIONS_DIR)
    .filter((f) => f.endsWith(".sql"))
    .sort();

  let count = 0;
  for (const filename of files) {
    if (applied.has(filename)) {
      logger.debug({ filename }, "Migration already applied, skipping");
      continue;
    }
    const sql = fs.readFileSync(path.join(MIGRATIONS_DIR, filename), "utf-8");
    await applyMigration(filename, sql);
    count++;
  }

  logger.info({ count }, "Migrations complete");
}

// Allow running directly: ts-node src/db/migrate.ts
if (require.main === module) {
  runMigrations()
    .then(async () => {
      if (migrationPool) await migrationPool.end();
    })
    .catch(async (err) => {
      logger.error({ err }, "Migration failed");
      if (migrationPool) await migrationPool.end();
      process.exit(1);
    });
}
