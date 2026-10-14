import { Request, Response } from "express";
import { checkDatabaseHealth } from "../db/client";
import axios from "axios";
import { config } from "../config";

export async function healthHandler(_req: Request, res: Response): Promise<void> {
  const [dbOk, aiOk] = await Promise.all([
    checkDatabaseHealth(),
    checkAiServiceHealth(),
  ]);

  const status = dbOk && aiOk ? "ok" : "degraded";

  res.status(status === "ok" ? 200 : 503).json({
    status,
    version: process.env.npm_package_version ?? "1.0.0",
    timestamp: new Date().toISOString(),
    dependencies: {
      postgres: dbOk ? "ok" : "unavailable",
      ai_service: aiOk ? "ok" : "unavailable",
    },
  });
}

async function checkAiServiceHealth(): Promise<boolean> {
  try {
    const response = await axios.get(`${config.AI_SERVICE_URL}/health`, {
      timeout: 3000,
    });
    return response.status === 200;
  } catch {
    return false;
  }
}
