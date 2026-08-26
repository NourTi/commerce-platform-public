import type { NextFunction, Request, Response } from "express";

const windows = new Map<string, { count: number; resetAt: number }>();
const WINDOW_MS = 60_000;
const MAX_REQUESTS = 180;

export function apiRateLimit(req: Request, res: Response, next: NextFunction) {
  const client = req.ip || req.socket.remoteAddress || "unknown";
  const now = Date.now();
  const current = windows.get(client);
  if (!current || current.resetAt <= now) {
    windows.set(client, { count: 1, resetAt: now + WINDOW_MS });
    res.setHeader("RateLimit-Remaining", String(MAX_REQUESTS - 1));
    return next();
  }
  current.count += 1;
  res.setHeader("RateLimit-Remaining", String(Math.max(0, MAX_REQUESTS - current.count)));
  if (current.count <= MAX_REQUESTS) return next();
  res.setHeader("Retry-After", String(Math.ceil((current.resetAt - now) / 1000)));
  res.status(429).json({ error: "Too many requests. Please retry shortly." });
}
