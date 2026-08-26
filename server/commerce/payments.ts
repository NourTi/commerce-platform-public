import { createHash, createHmac, timingSafeEqual } from "crypto";
import { paymentProviderKeys, type PaymentProviderKey } from "../../shared/paymentCapabilities";

export { paymentProviderKeys, type PaymentProviderKey };

export type PaymentEventStatus = "PAID" | "FAILED" | "CANCELED" | "IGNORED";

export type NormalizedPaymentEvent = {
  externalEventId: string;
  externalCheckoutId: string;
  type: string;
  status: PaymentEventStatus;
  amountCents?: number;
  currency?: string;
  payload: Record<string, unknown>;
  payloadDigest: string;
};

type ChargilyCheckoutData = {
  id?: unknown;
  status?: unknown;
  amount?: unknown;
  currency?: unknown;
};

type ChargilyWebhookPayload = {
  id?: unknown;
  type?: unknown;
  data?: ChargilyCheckoutData;
  [key: string]: unknown;
};

export function payloadDigest(rawBody: Buffer | string) {
  return createHash("sha256").update(rawBody).digest("hex");
}

export function verifyChargilySignature(rawBody: Buffer, receivedSignature: string | undefined, secret: string) {
  if (!receivedSignature || !secret) return false;
  const expected = createHmac("sha256", secret).update(rawBody).digest("hex");
  const actual = Buffer.from(receivedSignature, "utf8");
  const expectedBuffer = Buffer.from(expected, "utf8");
  return actual.length === expectedBuffer.length && timingSafeEqual(actual, expectedBuffer);
}

export function normalizeChargilyWebhook(rawBody: Buffer): NormalizedPaymentEvent {
  const parsed = JSON.parse(rawBody.toString("utf8")) as ChargilyWebhookPayload;
  const externalEventId = typeof parsed.id === "string" ? parsed.id : "";
  const type = typeof parsed.type === "string" ? parsed.type : "unknown";
  const data = parsed.data ?? {};
  const externalCheckoutId = typeof data.id === "string" ? data.id : "";
  if (!externalEventId || !externalCheckoutId) throw new Error("Chargily webhook is missing its event or checkout identifier.");
  const status: PaymentEventStatus = type === "checkout.paid" || data.status === "paid"
    ? "PAID"
    : type === "checkout.failed" || data.status === "failed"
      ? "FAILED"
      : type === "checkout.canceled" || data.status === "canceled"
        ? "CANCELED"
        : "IGNORED";
  return {
    externalEventId,
    externalCheckoutId,
    type,
    status,
    amountCents: typeof data.amount === "number" ? data.amount : undefined,
    currency: typeof data.currency === "string" ? data.currency.toUpperCase() : undefined,
    payload: parsed,
    payloadDigest: payloadDigest(rawBody),
  };
}

export function nativePaymentAttemptStatus(provider: PaymentProviderKey) {
  if (provider === "CASH_ON_DELIVERY" || provider === "BANK_TRANSFER") return "AWAITING_REVIEW" as const;
  return "PENDING" as const;
}
