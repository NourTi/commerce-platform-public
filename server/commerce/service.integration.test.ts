import { afterAll, beforeAll, describe, expect, it } from "vitest";
import { eq } from "drizzle-orm";
import { commerceCarts, commerceOrders, commercePrivacyRequests, commerceProducts, commercePromotions, commerceStores, commerceVariants, users } from "../../drizzle/schema";
import { getDb } from "../db";
import { addCartLine, applyPromotion, createCart, createOrder, exportCustomerPrivacyData, getCart, getCommerceAdminOverview, requestCustomerPrivacyErasure, resolveAdminPrivacyRequest, updateCartLine } from "./service";

const suffix = `it_${Date.now().toString(36)}`;
const productId = `prd_${suffix}`;
const variantId = `var_${suffix}`;
const promotionId = `promo_${suffix}`;
const promotionCode = `IT10${Date.now().toString(36).toUpperCase()}`;
let cartId = "";
let ownerId = 0;
let storeId = "";
let orderId = "";
let privacyRequestId = "";

async function retryDatabase<T>(operation: () => Promise<T>, attempts = 3): Promise<T> {
  let latestError: unknown;
  for (let attempt = 1; attempt <= attempts; attempt += 1) {
    try {
      return await operation();
    } catch (error) {
      latestError = error;
      const isTransient = typeof error === "object" && error !== null && "cause" in error
        && typeof (error as { cause?: unknown }).cause === "object"
        && (error as { cause?: { code?: string } }).cause?.code === "ETIMEDOUT";
      if (!isTransient || attempt === attempts) throw error;
      await new Promise(resolve => setTimeout(resolve, attempt * 500));
    }
  }
  throw latestError;
}

describe("Commerce service integration", () => {
  beforeAll(async () => {
    const db = await getDb();
    if (!db) throw new Error("A database connection is required for the commerce integration suite.");
    const owner = await db.select({ id: users.id }).from(users).limit(1);
    if (!owner[0]) throw new Error("The commerce integration suite requires an authenticated project user.");
    ownerId = owner[0].id;
    const store = await db.select({ id: commerceStores.id }).from(commerceStores).limit(1);
    if (!store[0]) throw new Error("The commerce integration suite requires a merchant store.");
    storeId = store[0].id;
    await db.insert(commerceProducts).values({
      id: productId,
      handle: `integration-${suffix}`,
      title: "Integration Product",
      subtitle: "Temporary test record",
      description: "A temporary record created and removed by the service integration suite.",
      category: "Testing",
      status: "PUBLISHED",
      ownerId,
      storeId,
    });
    await db.insert(commerceVariants).values({
      id: variantId,
      productId,
      sku: `IT-${suffix}`.toUpperCase(),
      title: "Test variant",
      priceCents: 1500,
      inventoryQty: 5,
      options: { test: "variant" },
      isDefault: true,
    });
    await db.insert(commercePromotions).values({ id: promotionId, storeId, code: promotionCode, type: "PERCENT", value: 10, minSubtotalCents: 1000, active: true });
  }, 30_000);

  afterAll(async () => {
    const db = await getDb();
    if (!db) return;
    if (orderId) await db.delete(commerceOrders).where(eq(commerceOrders.id, orderId));
    if (cartId) await db.delete(commerceCarts).where(eq(commerceCarts.id, cartId));
    if (privacyRequestId) await db.delete(commercePrivacyRequests).where(eq(commercePrivacyRequests.id, privacyRequestId));
    await db.delete(commercePromotions).where(eq(commercePromotions.id, promotionId));
    await db.delete(commerceVariants).where(eq(commerceVariants.id, variantId));
    await db.delete(commerceProducts).where(eq(commerceProducts.id, productId));
  });

  it("persists cart changes, applies promotion totals, converts the cart, decrements inventory, and exposes the order to administration", async () => {
    const cart = await retryDatabase(() => createCart(`session_${suffix}`, storeId));
    cartId = cart.id;
    await retryDatabase(() => addCartLine({ cartId, variantId, quantity: 1 }));
    let hydrated = await retryDatabase(() => getCart(cartId));
    expect(hydrated?.lines).toHaveLength(1);
    expect(hydrated?.totals.subtotalCents).toBe(1500);

    const lineId = hydrated?.lines[0]?.id;
    if (!lineId) throw new Error("Expected a persisted cart line.");
    await retryDatabase(() => updateCartLine({ cartId, lineId, quantity: 2 }));
    hydrated = await retryDatabase(() => applyPromotion(cartId, promotionCode));
    expect(hydrated?.promotion?.code).toBe(promotionCode);
    expect(hydrated?.totals).toMatchObject({ subtotalCents: 3000, discountCents: 300, totalCents: 2700 });

    const order = await retryDatabase(() => createOrder({ cartId, customerId: ownerId, email: "integration@example.test", shippingMethod: "STANDARD" }));
    orderId = order.id;
    expect(order.status).toBe("PENDING_PAYMENT");
    expect(order.totals).toMatchObject({ subtotalCents: 3000, discountCents: 300, shippingCents: 1500, totalCents: 4200 });

    const convertedCart = await retryDatabase(() => getCart(cartId));
    expect(convertedCart?.status).toBe("CONVERTED");
    const db = await getDb();
    if (!db) throw new Error("Database connection disappeared during integration test.");
    const variant = await db.select({ inventoryQty: commerceVariants.inventoryQty }).from(commerceVariants).where(eq(commerceVariants.id, variantId)).limit(1);
    expect(variant[0]?.inventoryQty).toBe(3);
    const overview = await retryDatabase(() => getCommerceAdminOverview(storeId));
    expect(overview.orders.some(candidate => candidate.id === order.id)).toBe(true);
  }, 30_000);

  it("exports customer-owned commerce data and records a non-destructive erasure request", async () => {
    const exportBefore = await exportCustomerPrivacyData(ownerId);
    expect(exportBefore.account?.id).toBe(ownerId);
    expect(exportBefore.orders.some(order => order.id === orderId)).toBe(true);
    const request = await requestCustomerPrivacyErasure(ownerId, "Please review my account data.");
    privacyRequestId = request.requestId;
    expect(request.status).toBe("REQUESTED");
    await expect(requestCustomerPrivacyErasure(ownerId)).rejects.toThrow("already under review");
    const reviewed = await resolveAdminPrivacyRequest({ requestId: privacyRequestId, status: "UNDER_REVIEW", resolution: "Identity and retention review started." });
    expect(reviewed.status).toBe("UNDER_REVIEW");
    const exportAfter = await exportCustomerPrivacyData(ownerId);
    expect(exportAfter.privacyRequests).toEqual(expect.arrayContaining([expect.objectContaining({ id: privacyRequestId, type: "ERASURE", status: "UNDER_REVIEW" })]));
  }, 30_000);
});
