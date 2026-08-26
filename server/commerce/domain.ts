import type { AppliedPromotion, CartLineForPricing } from "@shared/commerce";

export type CommerceTotals = {
  subtotalCents: number;
  discountCents: number;
  shippingCents: number;
  totalCents: number;
};

export function calculateCommerceTotals(input: {
  lines: CartLineForPricing[];
  promotion: AppliedPromotion;
  shippingCents?: number;
}): CommerceTotals {
  const subtotalCents = input.lines.reduce((sum, line) => sum + line.unitPriceCents * line.quantity, 0);
  let discountCents = 0;

  if (input.promotion && subtotalCents >= input.promotion.minSubtotalCents) {
    discountCents = input.promotion.type === "PERCENT"
      ? Math.floor((subtotalCents * input.promotion.value) / 100)
      : input.promotion.value;
    discountCents = Math.min(discountCents, subtotalCents);
  }

  const shippingCents = input.shippingCents ?? 0;
  return {
    subtotalCents,
    discountCents,
    shippingCents,
    totalCents: Math.max(0, subtotalCents - discountCents + shippingCents),
  };
}

export function isPromotionAvailable(input: {
  active: boolean;
  startsAt: Date | null;
  endsAt: Date | null;
  now?: Date;
}) {
  const now = input.now ?? new Date();
  return input.active && (!input.startsAt || input.startsAt <= now) && (!input.endsAt || input.endsAt >= now);
}

export function assertInventoryAvailability(input: { title: string; requestedQuantity: number; inventoryQty: number }) {
  if (input.requestedQuantity < 1) throw new Error("Requested quantity must be at least one.");
  if (input.requestedQuantity > input.inventoryQty) {
    throw new Error(`${input.title} is no longer available in the requested quantity.`);
  }
}

export function resolveCartLineQuantity(input: { title: string; existingQuantity: number; incomingQuantity: number; inventoryQty: number }) {
  const requestedQuantity = input.existingQuantity + input.incomingQuantity;
  assertInventoryAvailability({ title: input.title, requestedQuantity, inventoryQty: input.inventoryQty });
  return requestedQuantity;
}

export function assertPromotionCanApply(input: { promotion: Exclude<AppliedPromotion, null>; subtotalCents: number }) {
  if (input.subtotalCents < input.promotion.minSubtotalCents) {
    throw new Error(`This promotion requires a subtotal of at least $${(input.promotion.minSubtotalCents / 100).toFixed(0)}.`);
  }
  return input.promotion;
}

export function preparePendingOrder(input: {
  lines: Array<CartLineForPricing & { variantId: string }>;
  promotion: AppliedPromotion;
  shippingCents: number;
  inventory: Array<{ variantId: string; title: string; inventoryQty: number }>;
}) {
  if (input.lines.length === 0) throw new Error("Your cart is empty.");
  const inventoryAdjustments = input.lines.map(line => {
    const variant = input.inventory.find(item => item.variantId === line.variantId);
    if (!variant) throw new Error(`${line.title} is no longer available in the requested quantity.`);
    assertInventoryAvailability({ title: line.title, requestedQuantity: line.quantity, inventoryQty: variant.inventoryQty });
    return { variantId: variant.variantId, nextInventoryQty: variant.inventoryQty - line.quantity };
  });
  return {
    status: "PENDING_PAYMENT" as const,
    totals: calculateCommerceTotals({ lines: input.lines, promotion: input.promotion, shippingCents: input.shippingCents }),
    inventoryAdjustments,
  };
}
