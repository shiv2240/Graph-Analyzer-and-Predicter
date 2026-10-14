import { Pool } from "pg";
import { config } from "../config";
import { logger } from "../utils/logger";

let pool: Pool | null = null;

function isSslRequired(connStr: string): boolean {
  return connStr.includes("neon.tech") || connStr.includes("sslmode=require");
}

export function getPool(): Pool {
  if (!pool) {
    const connStr = config.DATABASE_URL;
    pool = new Pool({
      connectionString: connStr,
      ssl: isSslRequired(connStr) ? { rejectUnauthorized: false } : undefined,
      max: 10,
      idleTimeoutMillis: 30000,
      connectionTimeoutMillis: 10000,
    });

    pool.on("error", (err) => {
      logger.error({ err }, "PostgreSQL pool error");
    });

    pool.on("connect", () => {
      logger.debug("New PostgreSQL connection established");
    });
  }
  return pool;
}

export function getDirectPool(): Pool {
  const connStr = config.DATABASE_URL_UNPOOLED || config.DATABASE_URL;
  return new Pool({
    connectionString: connStr,
    ssl: isSslRequired(connStr) ? { rejectUnauthorized: false } : undefined,
    max: 2,
    connectionTimeoutMillis: 10000,
  });
}

export async function checkDatabaseHealth(): Promise<boolean> {
  try {
    const client = await getPool().connect();
    await client.query("SELECT 1");
    client.release();
    return true;
  } catch (err) {
    logger.error({ err }, "Database health check failed");
    return false;
  }
}

export async function closePool(): Promise<void> {
  if (pool) {
    await pool.end();
    pool = null;
    logger.info("PostgreSQL pool closed");
  }
}

/**
 * Execute a parameterized query.
 * Always use this instead of string interpolation to prevent SQL injection.
 */
export async function query<T extends Record<string, unknown>>(
  sql: string,
  params?: unknown[]
): Promise<T[]> {
  const result = await getPool().query(sql, params);
  return result.rows as T[];
}

/**
 * Execute a parameterized query returning a single row or null.
 */
export async function queryOne<T extends Record<string, unknown>>(
  sql: string,
  params?: unknown[]
): Promise<T | null> {
  const rows = await query<T>(sql, params);
  return rows[0] ?? null;
}
