import { and, eq, inArray } from "drizzle-orm";
import { timingSafeEqual } from "node:crypto";
import { commerceNotifications } from "../../drizzle/schema";
import { getDb } from "../db";

type MailjetMessage = {
  Messages?: Array<{
    Status?: string;
    To?: Array<{ MessageID?: number; MessageUUID?: string }>;
    Errors?: Array<{ ErrorMessage?: string }>;
  }>;
};

function credentials() {
  const apiKey = process.env.MAILJET_API_KEY;
  const secretKey = process.env.MAILJET_SECRET_KEY;
  const senderEmail = process.env.MAILJET_SENDER_EMAIL;
  const senderName = process.env.MAILJET_SENDER_NAME || "Commerce";
  if (!apiKey || !secretKey || !senderEmail) return null;
  return { apiKey, secretKey, senderEmail, senderName };
}

function copy(locale: string, type: string, orderNumber: string) {
  const merchant = type === "ORDER_RECEIVED_MERCHANT";
  if (locale === "fr") return merchant
    ? { subject: `Nouvelle commande ${orderNumber}`, text: `Une nouvelle commande ${orderNumber} attend votre validation.` }
    : { subject: `Commande ${orderNumber} enregistrée`, text: `Votre commande ${orderNumber} est enregistrée et attend la validation du marchand.` };
  if (locale === "ar") return merchant
    ? { subject: `طلب جديد ${orderNumber}`, text: `يوجد طلب جديد ${orderNumber} بانتظار مراجعتك.` }
    : { subject: `تم تسجيل الطلب ${orderNumber}`, text: `تم تسجيل طلبك ${orderNumber} وهو بانتظار مراجعة التاجر.` };
  return merchant
    ? { subject: `New order ${orderNumber}`, text: `A new order ${orderNumber} is awaiting your review.` }
    : { subject: `Order ${orderNumber} recorded`, text: `Your order ${orderNumber} is recorded and awaits merchant review.` };
}

function isReservedTestAddress(address: string) {
  const domain = address.trim().toLowerCase().split("@")[1] ?? "";
  return domain === "example.test" || domain.endsWith(".test");
}

export async function deliverQueuedOrderNotifications(orderId: string) {
  if (process.env.NODE_ENV === "test") return { attempted: 0, sent: 0, skipped: true };
  const configuration = credentials();
  if (!configuration) return { attempted: 0, sent: 0, skipped: true };
  const db = await getDb();
  if (!db) return { attempted: 0, sent: 0, skipped: true };
  const notifications = await db.select().from(commerceNotifications).where(and(eq(commerceNotifications.orderId, orderId), eq(commerceNotifications.channel, "EMAIL"), eq(commerceNotifications.status, "QUEUED")));
  let sent = 0;
  for (const notification of notifications) {
    if (isReservedTestAddress(notification.recipient)) continue;
    const orderNumber = typeof notification.payload.orderNumber === "string" ? notification.payload.orderNumber : "";
    const content = copy(notification.locale, notification.type, orderNumber);
    try {
      const authorization = `Basic ${Buffer.from(`${configuration.apiKey}:${configuration.secretKey}`).toString("base64")}`;
      const response = await fetch("https://api.mailjet.com/v3.1/send", {
        method: "POST",
        headers: { Authorization: authorization, "Content-Type": "application/json" },
        body: JSON.stringify({ Messages: [{ From: { Email: configuration.senderEmail, Name: configuration.senderName }, To: [{ Email: notification.recipient }], Subject: content.subject, TextPart: content.text, CustomID: notification.id }] }),
      });
      const result = await response.json().catch(() => ({})) as MailjetMessage;
      const message = result.Messages?.[0];
      const providerMessageId = message?.To?.[0]?.MessageUUID ?? message?.To?.[0]?.MessageID?.toString() ?? null;
      if (!response.ok || message?.Status?.toLowerCase() !== "success" || !providerMessageId) throw new Error(message?.Errors?.[0]?.ErrorMessage ?? `Mailjet returned ${response.status}`);
      await db.update(commerceNotifications).set({ status: "SENT", providerMessageId, sentAt: new Date() }).where(and(eq(commerceNotifications.id, notification.id), eq(commerceNotifications.status, "QUEUED")));
      sent += 1;
    } catch {
      await db.update(commerceNotifications).set({ status: "FAILED" }).where(and(eq(commerceNotifications.id, notification.id), eq(commerceNotifications.status, "QUEUED")));
    }
  }
  return { attempted: notifications.length, sent, skipped: false };
}

type MailjetEvent = { event?: unknown; time?: unknown; MessageID?: unknown; Message_GUID?: unknown; mj_message_id?: unknown };

function providerEventId(event: MailjetEvent) {
  for (const value of [event.Message_GUID, event.MessageID, event.mj_message_id]) {
    if (typeof value === "string" && value.trim()) return value.trim();
    if (typeof value === "number" && Number.isFinite(value)) return String(value);
  }
  return null;
}

function eventTimestamp(value: unknown) {
  if (typeof value !== "number" || !Number.isFinite(value) || value <= 0) return null;
  const timestamp = new Date(value * 1_000);
  return Number.isNaN(timestamp.getTime()) ? null : timestamp;
}

export function isAuthorizedMailjetWebhook(authorization: string | undefined, token: string | undefined) {
  if (!authorization?.startsWith("Basic ") || !token) return false;
  let decoded = "";
  try {
    decoded = Buffer.from(authorization.slice(6), "base64").toString("utf8");
  } catch {
    return false;
  }
  const separator = decoded.indexOf(":");
  if (separator < 1 || decoded.slice(0, separator) !== "mailjet") return false;
  const supplied = Buffer.from(decoded.slice(separator + 1));
  const expected = Buffer.from(token);
  return supplied.length === expected.length && timingSafeEqual(supplied, expected);
}

export async function processMailjetDeliveryEvents(payload: unknown) {
  if (!Array.isArray(payload)) throw new Error("Expected a grouped Mailjet event array.");
  const db = await getDb();
  if (!db) throw new Error("Database unavailable.");
  const outcome = { delivered: 0, suppressed: 0, ignored: 0 };
  for (const candidate of payload) {
    if (!candidate || typeof candidate !== "object") {
      outcome.ignored += 1;
      continue;
    }
    const event = candidate as MailjetEvent;
    const eventType = typeof event.event === "string" ? event.event.toLowerCase() : "";
    const messageId = providerEventId(event);
    if (!messageId || !["sent", "bounce", "blocked", "spam"].includes(eventType)) {
      outcome.ignored += 1;
      continue;
    }
    if (eventType === "sent") {
      const [notification] = await db.select({ id: commerceNotifications.id, status: commerceNotifications.status }).from(commerceNotifications).where(and(eq(commerceNotifications.providerMessageId, messageId), eq(commerceNotifications.status, "SENT"))).limit(1);
      if (!notification) {
        outcome.ignored += 1;
        continue;
      }
      await db.update(commerceNotifications).set({ status: "DELIVERED", deliveredAt: eventTimestamp(event.time) ?? new Date() }).where(and(eq(commerceNotifications.id, notification.id), eq(commerceNotifications.status, "SENT")));
      outcome.delivered += 1;
      continue;
    }
    const [notification] = await db.select({ id: commerceNotifications.id }).from(commerceNotifications).where(and(eq(commerceNotifications.providerMessageId, messageId), inArray(commerceNotifications.status, ["SENT", "DELIVERED"]))).limit(1);
    if (!notification) {
      outcome.ignored += 1;
      continue;
    }
    await db.update(commerceNotifications).set({ status: "SUPPRESSED" }).where(and(eq(commerceNotifications.id, notification.id), inArray(commerceNotifications.status, ["SENT", "DELIVERED"])));
    outcome.suppressed += 1;
  }
  return outcome;
}
