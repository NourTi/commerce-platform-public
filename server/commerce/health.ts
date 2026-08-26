import type { Express } from "express";
import { getDb } from "../db";

export function registerCommerceHealthRoutes(app: Express) {
  app.get("/health", (_req, res) => {
    res.status(200).json({ status: "ok", service: "commerce-platform", timestamp: new Date().toISOString(), uptimeSeconds: Math.floor(process.uptime()) });
  });
  app.get("/api/health/commerce", async (_req, res) => {
    try {
      const db = await getDb();
      if (!db) throw new Error("Database unavailable");
      await db.execute("SELECT 1");
      res.status(200).json({ status: "ok", dependency: "commerce-database", timestamp: new Date().toISOString() });
    } catch {
      res.status(503).json({ status: "degraded", dependency: "commerce-database", timestamp: new Date().toISOString() });
    }
  });
}
