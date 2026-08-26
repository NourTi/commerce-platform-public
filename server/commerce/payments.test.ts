import { createHmac } from "crypto";
import { describe, expect, it } from "vitest";
import { algeriaFirstPaymentCapabilities, createDefaultPaymentProviderRows, validateMerchantPaymentProviderUpdate } from "../../shared/paymentCapabilities";
import { nativePaymentAttemptStatus, normalizeChargilyWebhook, payloadDigest, verifyChargilySignature } from "./payments";

const secret = "chargily-test-webhook-secret";
const payload = JSON.stringify({
  id: "01hjjjzf7wbc454te45mwx35fe",
  entity: "event",
  livemode: false,
  type: "checkout.paid",
  data: {
    id: "01hjjj9aymmrwe664nbzrv84sg",
    entity: "checkout",
    amount: 50000,
    currency: "dzd",
    locale: "ar",
    status: "paid",
  },
});

describe("Algeria-first payment primitives", () => {
  it("verifies and normalizes the documented Chargily paid checkout event", () => {
    const raw = Buffer.from(payload, "utf8");
    const signature = createHmac("sha256", secret).update(raw).digest("hex");
    expect(verifyChargilySignature(raw, signature, secret)).toBe(true);
    expect(verifyChargilySignature(raw, "tampered", secret)).toBe(false);
    expect(normalizeChargilyWebhook(raw)).toMatchObject({
      externalEventId: "01hjjjzf7wbc454te45mwx35fe",
      externalCheckoutId: "01hjjj9aymmrwe664nbzrv84sg",
      status: "PAID",
      amountCents: 50000,
      currency: "DZD",
      payloadDigest: payloadDigest(raw),
    });
  });

  it("requires merchant review for cash on delivery and bank transfer", () => {
    expect(nativePaymentAttemptStatus("CASH_ON_DELIVERY")).toBe("AWAITING_REVIEW");
    expect(nativePaymentAttemptStatus("BANK_TRANSFER")).toBe("AWAITING_REVIEW");
    expect(nativePaymentAttemptStatus("CHARGILY_PAY")).toBe("PENDING");
  });

  it("preserves merchant-owned native defaults and leaves Chargily credential-gated", () => {
    const rows = createDefaultPaymentProviderRows("store_capabilities", (() => {
      let index = 0;
      return () => `pay_${++index}`;
    })());
    expect(rows.map(row => row.provider)).toEqual(["CASH_ON_DELIVERY", "BANK_TRANSFER", "CHARGILY_PAY"]);
    expect(rows.find(row => row.provider === "CASH_ON_DELIVERY")).toMatchObject({ status: "ACTIVE", configuration: { settlementMode: "merchant-managed" } });
    expect(rows.find(row => row.provider === "BANK_TRANSFER")).toMatchObject({ status: "DISABLED", configuration: { settlementMode: "merchant-managed" } });
    expect(algeriaFirstPaymentCapabilities.find(capability => capability.provider === "CHARGILY_PAY")).toMatchObject({ defaultStatus: "DISABLED", requiresExternalCredentials: true, merchantOwnedFunds: true, checkoutMode: "WEBHOOK_ONLY" });
    expect(algeriaFirstPaymentCapabilities.every(capability => capability.merchantOwnedFunds)).toBe(true);
    expect(() => validateMerchantPaymentProviderUpdate("CHARGILY_PAY", "ACTIVE")).toThrow("remains disabled");
    expect(() => validateMerchantPaymentProviderUpdate("MANUAL", "DISABLED")).toThrow("internal");
    expect(validateMerchantPaymentProviderUpdate("BANK_TRANSFER", "ACTIVE").provider).toBe("BANK_TRANSFER");
  });
});
