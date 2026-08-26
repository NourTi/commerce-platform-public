import type { Express, Request, Response } from "express";
import express from "express";
import { processChargilyWebhook } from "./commercial";
import { isAuthorizedMailjetWebhook, processMailjetDeliveryEvents } from "./mailjet";

const webhookRateWindow = new Map<string, { count: number; resetAt: number }>();
const WEBHOOK_RATE_LIMIT = 60;
const WEBHOOK_WINDOW_MS = 60_000;

function isWebhookRateLimited(req: Request) {
  const client = req.ip || req.socket.remoteAddress || "unknown";
  const now = Date.now();
  const record = webhookRateWindow.get(client);
  if (!record || record.resetAt <= now) {
    webhookRateWindow.set(client, { count: 1, resetAt: now + WEBHOOK_WINDOW_MS });
    return false;
  }
  record.count += 1;
  return record.count > WEBHOOK_RATE_LIMIT;
}

async function handleChargilyWebhook(req: Request, res: Response) {
  if (isWebhookRateLimited(req)) {
    res.status(429).json({ error: "Too many webhook requests." });
    return;
  }
  const secret = process.env.CHARGILY_PAY_WEBHOOK_SECRET;
  if (!secret) {
    res.status(503).json({ error: "Chargily webhooks are not configured for this deployment." });
    return;
  }
  const rawBody = Buffer.isBuffer(req.body) ? req.body : Buffer.from("");
  if (!rawBody.length) {
    res.status(400).json({ error: "Expected raw JSON request body." });
    return;
  }
  try {
    const result = await processChargilyWebhook(rawBody, req.header("signature") ?? undefined, secret);
    res.status(200).json(result);
  } catch (error) {
    const message = error instanceof Error ? error.message : "Unable to process Chargily webhook.";
    const status = message.includes("signature") ? 403 : message.includes("not found") ? 404 : 400;
    console.warn("[commerce-webhook] Chargily webhook rejected", { status, reason: message });
    res.status(status).json({ error: status === 403 ? "Webhook signature verification failed." : status === 404 ? "Checkout was not found." : "Webhook could not be processed." });
  }
}

async function handleMailjetWebhook(req: Request, res: Response) {
  if (isWebhookRateLimited(req)) {
    res.status(429).json({ error: "Too many webhook requests." });
    return;
  }
  const token = process.env.MAILJET_WEBHOOK_TOKEN;
  if (!token) {
    res.status(503).json({ error: "Mailjet delivery-event webhooks are not configured for this deployment." });
    return;
  }
  if (!isAuthorizedMailjetWebhook(req.header("authorization") ?? undefined, token)) {
    res.status(401).json({ error: "Mailjet webhook authorization failed." });
    return;
  }
  try {
    const outcome = await processMailjetDeliveryEvents(req.body);
    res.status(200).json(outcome);
  } catch (error) {
    const message = error instanceof Error ? error.message : "Unable to process Mailjet events.";
    console.warn("[commerce-webhook] Mailjet event webhook rejected", { reason: message });
    res.status(400).json({ error: "Mailjet event webhook payload was rejected." });
  }
}

export function registerCommerceWebhooks(app: Express) {
  app.post("/api/webhooks/chargily", express.raw({ type: "application/json", limit: "1mb" }), handleChargilyWebhook);
  app.post("/api/webhooks/mailjet", express.json({ limit: "1mb" }), handleMailjetWebhook);
}
