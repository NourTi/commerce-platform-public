import { describe, expect, it } from "vitest";
import { assertInventoryAvailability, assertPromotionCanApply, calculateCommerceTotals, isPromotionAvailable, preparePendingOrder, resolveCartLineQuantity } from "./domain";

describe("Commerce totals", () => {
  const lines = [
    { id: "line_1", title: "Arc Lamp", sku: "ARC-BLK", quantity: 2, unitPriceCents: 24500 },
    { id: "line_2", title: "Form Vessel", sku: "FORM-CLR", quantity: 1, unitPriceCents: 9500 },
  ];

  it("calculates percentage promotion and shipping server-side", () => {
    expect(calculateCommerceTotals({
      lines,
      promotion: { code: "WELCOME15", type: "PERCENT", value: 15, minSubtotalCents: 10000 },
      shippingCents: 1500,
    })).toEqual({ subtotalCents: 58500, discountCents: 8775, shippingCents: 1500, totalCents: 51225 });
  });

  it("does not apply a promotion below its minimum subtotal", () => {
    expect(calculateCommerceTotals({
      lines: [lines[1]],
      promotion: { code: "SYSTEM10", type: "FIXED", value: 1000, minSubtotalCents: 10000 },
    })).toMatchObject({ subtotalCents: 9500, discountCents: 0, totalCents: 9500 });
  });

  it("rejects expired promotions", () => {
    expect(isPromotionAvailable({ active: true, startsAt: null, endsAt: new Date("2026-08-23T00:00:00Z"), now: new Date("2026-08-24T00:00:00Z") })).toBe(false);
  });

  it("rejects an order quantity above current inventory", () => {
    expect(() => assertInventoryAvailability({ title: "Arc Lamp", requestedQuantity: 2, inventoryQty: 1 })).toThrow("Arc Lamp is no longer available in the requested quantity.");
    expect(() => assertInventoryAvailability({ title: "Arc Lamp", requestedQuantity: 1, inventoryQty: 1 })).not.toThrow();
  });

  it("creates an inventory-safe next cart quantity", () => {
    expect(resolveCartLineQuantity({ title: "Arc Lamp", existingQuantity: 1, incomingQuantity: 2, inventoryQty: 5 })).toBe(3);
    expect(() => resolveCartLineQuantity({ title: "Arc Lamp", existingQuantity: 4, incomingQuantity: 2, inventoryQty: 5 })).toThrow("Arc Lamp is no longer available");
  });

  it("accepts an eligible promotion and rejects one below its threshold", () => {
    const promotion = { code: "WELCOME15", type: "PERCENT" as const, value: 15, minSubtotalCents: 10_000 };
    expect(assertPromotionCanApply({ promotion, subtotalCents: 24_500 })).toEqual(promotion);
    expect(() => assertPromotionCanApply({ promotion, subtotalCents: 9_900 })).toThrow("requires a subtotal");
  });

  it("prepares a pending-payment order with a stock decrement and snapshot totals", () => {
    const result = preparePendingOrder({
      lines: [{ id: "line_1", variantId: "var_arc", title: "Arc Lamp", sku: "ARC-BLK", quantity: 1, unitPriceCents: 24_500 }],
      promotion: { code: "WELCOME15", type: "PERCENT", value: 15, minSubtotalCents: 10_000 },
      shippingCents: 1500,
      inventory: [{ variantId: "var_arc", title: "Arc Lamp", inventoryQty: 18 }],
    });
    expect(result).toEqual({
      status: "PENDING_PAYMENT",
      totals: { subtotalCents: 24_500, discountCents: 3675, shippingCents: 1500, totalCents: 22_325 },
      inventoryAdjustments: [{ variantId: "var_arc", nextInventoryQty: 17 }],
    });
  });
});
