import { describe, it, expect } from "vitest";
import request from "supertest";
import app from "../app";

describe("Health API", () => {
  it("GET /health returns health status", async () => {
    const res = await request(app).get("/health");
    expect([200, 503]).toContain(res.status);
    expect(res.body).toHaveProperty("status");
    expect(res.body).toHaveProperty("version");
    expect(res.body).toHaveProperty("dependencies");
  });

  it("GET /non-existent-route returns 404 NOT_FOUND", async () => {
    const res = await request(app).get("/api/v1/invalid_path");
    expect(res.status).toBe(404);
    expect(res.body.error.code).toBe("NOT_FOUND");
  });
});
