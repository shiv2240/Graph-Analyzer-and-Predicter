import path from "path";
import dotenv from "dotenv";
import { z } from "zod";

// Load .env and .env.local from project root and current directory
const rootDir = path.resolve(__dirname, "../../");
dotenv.config({ path: path.join(rootDir, ".env") });
dotenv.config({ path: path.join(rootDir, ".env.local"), override: true });
dotenv.config({ path: path.resolve(__dirname, "../.env") });
dotenv.config({ path: path.resolve(__dirname, "../.env.local"), override: true });

const envSchema = z.object({
  NODE_ENV: z.enum(["development", "production", "test"]).default("development"),
  BACKEND_PORT: z.coerce.number().default(3001),
  BACKEND_HOST: z.string().default("0.0.0.0"),
  DATABASE_URL: z.string().default("postgresql://stockintel:changeme_strong_password@localhost:5432/stockintel"),
  DATABASE_URL_UNPOOLED: z.string().optional(),
  NEON_BRANCH: z.string().optional(),
  AI_SERVICE_URL: z.string().url().default(process.env.AI_SERVICE_URL || "http://localhost:8000"),
  LOG_LEVEL: z.enum(["trace", "debug", "info", "warn", "error"]).default("info"),
  PROVIDER_REQUEST_TIMEOUT_MS: z.coerce.number().default(10000),
  CACHE_TTL_SECONDS: z.coerce.number().default(300),
  QUOTE_CACHE_TTL: z.coerce.number().default(30),
  AI_REPORT_CACHE_TTL: z.coerce.number().default(600),
  REDIS_URL: z.string().optional(),
  REDIS_ENABLED: z
    .string()
    .transform((v) => v === "true")
    .default("true"),
  YFINANCE_ENABLED: z
    .string()
    .transform((v) => v === "true")
    .default("true"),
  ALPHA_VANTAGE_API_KEY: z.string().default("DEMO"),
  FINNHUB_API_KEY: z.string().default(""),
  UPSTOX_API_KEY: z.string().default(""),
  UPSTOX_API_SECRET: z.string().default(""),
  UPSTOX_ACCESS_TOKEN: z.string().default(""),
  VITE_BACKEND_URL: z.string().url().default("http://localhost:5173"),
  GEMINI_API_KEY: z.string().default(""),
});

function loadConfig() {
  const result = envSchema.safeParse(process.env);
  if (!result.success) {
    const issues = result.error.issues
      .map((i) => `  ${i.path.join(".")}: ${i.message}`)
      .join("\n");
    throw new Error(`Configuration validation failed:\n${issues}`);
  }
  return result.data;
}

export const config = loadConfig();
export type Config = typeof config;
