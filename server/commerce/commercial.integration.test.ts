import { afterAll, beforeAll, describe, expect, it } from "vitest";
import { and, eq, inArray } from "drizzle-orm";
import { commerceAuditEvents, commerceCartLines, commerceCarts, commerceCustomers, commerceDeliveryRates, commerceDeliveryZones, commerceFulfillments, commerceNotifications, commerceOrderLines, commerceOrders, commercePaymentAttempts, commercePaymentEvents, commercePaymentProviders, commerceProducts, commerceRefunds, commerceReturns, commerceStoreCommercialSettings, commerceStoreMembers, commerceStorePlans, commerceStores, commerceSubscriptionInvoices, commerceTaxRates, commerceVariants, commerceWorkspaces, users } from "../../drizzle/schema";
import { getDb } from "../db";
import { addCartLine, createCart } from "./service";
import { createAdminSubscriptionInvoice, createMerchantRefund, createMerchantShipment, createStorefrontCheckout, getStorefrontCheckoutSetup, listMerchantSubscriptionInvoices, requestCustomerReturn, reviewAdminSubscriptionInvoice, resolveMerchantRefund, resolveMerchantReturn, reviewMerchantPayment, submitMerchantSubscriptionInvoiceReference, updateMerchantShipmentStatus } from "./commercial";
import { processMailjetDeliveryEvents } from "./mailjet";

const suffix = `commerce_${Date.now().toString(36)}`;
const workspaceId = `ws_${suffix}`;
const storeId = `store_${suffix}`;
const productId = `prd_${suffix}`;
const variantId = `var_${suffix}`;
const zoneId = `zone_${suffix}`;
const rateId = `rate_${suffix}`;
let ownerId = 0;
let codOrderId = "";
let transferOrderId = "";
let taxOrderId = "";

describe("Native commercial checkout integration", () => {
  beforeAll(async () => {
    const db = await getDb();
    if (!db) throw new Error("A database connection is required.");
    const [owner] = await db.select({ id: users.id }).from(users).limit(1);
    if (!owner) throw new Error("An existing project user is required.");
    ownerId = owner.id;
    await db.insert(commerceWorkspaces).values({ id: workspaceId, name: "Commercial test workspace", slug: workspaceId, ownerId });
    await db.insert(commerceStores).values({ id: storeId, workspaceId, name: "Commercial test store", handle: `commercial-${suffix}`, status: "ACTIVE", defaultLocale: "ar", currency: "DZD" });
    await db.insert(commerceStoreMembers).values({ id: `member_${suffix}`, storeId, userId: ownerId, role: "OWNER" });
    await db.insert(commerceStorePlans).values({ storeId, planKey: "STARTER", status: "TRIAL", entitlementSnapshot: { maxProducts: 25 } });
    await db.insert(commerceProducts).values({ id: productId, storeId, ownerId, handle: `commerce-product-${suffix}`, title: "Commercial test product", subtitle: "Checkout test", description: "Temporary product for native checkout validation.", category: "Testing", status: "PUBLISHED" });
    await db.insert(commerceVariants).values({ id: variantId, productId, sku: `COM-${suffix}`.toUpperCase(), title: "Standard", priceCents: 50000, inventoryQty: 8, options: { format: "test" }, isDefault: true });
    await db.insert(commerceStoreCommercialSettings).values({ storeId, countryCode: "DZ", taxEnabled: false, checkoutRequiresAccount: false });
    await db.insert(commercePaymentProviders).values([
      { id: `pay_cod_${suffix}`, storeId, provider: "CASH_ON_DELIVERY", status: "ACTIVE", displayName: "Cash on delivery", configuration: { confirmationRequired: true } },
      { id: `pay_bank_${suffix}`, storeId, provider: "BANK_TRANSFER", status: "ACTIVE", displayName: "Bank transfer", configuration: { approvalRequired: true } },
    ]);
    await db.insert(commerceDeliveryZones).values({ id: zoneId, storeId, name: "Alger", countryCode: "DZ", regions: ["Alger"], enabled: true });
    await db.insert(commerceDeliveryRates).values({ id: rateId, zoneId, name: "Alger standard", methodCode: "STANDARD-ALGER", amountCents: 4000, codAvailable: true, estimatedMinDays: 1, estimatedMaxDays: 3, active: true });
  }, 30_000);

  afterAll(async () => {
    const db = await getDb();
    if (!db) return;
    const orderIds = [codOrderId, transferOrderId, taxOrderId].filter(Boolean);
    if (orderIds.length) {
      await db.delete(commercePaymentEvents).where(and(eq(commercePaymentEvents.storeId, storeId), eq(commercePaymentEvents.provider, "CHARGILY_PAY")));
      await db.delete(commerceRefunds).where(eq(commerceRefunds.storeId, storeId));
      await db.delete(commerceReturns).where(eq(commerceReturns.storeId, storeId));
      await db.delete(commercePaymentAttempts).where(eq(commercePaymentAttempts.storeId, storeId));
      await db.delete(commerceFulfillments).where(eq(commerceFulfillments.storeId, storeId));
      await db.delete(commerceNotifications).where(eq(commerceNotifications.storeId, storeId));
      await db.delete(commerceAuditEvents).where(eq(commerceAuditEvents.storeId, storeId));
      await db.delete(commerceOrderLines).where(inArray(commerceOrderLines.orderId, orderIds));
      await db.delete(commerceOrders).where(eq(commerceOrders.storeId, storeId));
    }
    await db.delete(commerceCartLines).where(eq(commerceCartLines.cartId, `cart_${suffix}`));
    await db.delete(commerceCarts).where(eq(commerceCarts.storeId, storeId));
    await db.delete(commerceCustomers).where(eq(commerceCustomers.storeId, storeId));
    await db.delete(commerceTaxRates).where(eq(commerceTaxRates.storeId, storeId));
    await db.delete(commerceDeliveryRates).where(eq(commerceDeliveryRates.zoneId, zoneId));
    await db.delete(commerceDeliveryZones).where(eq(commerceDeliveryZones.storeId, storeId));
    await db.delete(commercePaymentProviders).where(eq(commercePaymentProviders.storeId, storeId));
    await db.delete(commerceSubscriptionInvoices).where(eq(commerceSubscriptionInvoices.storeId, storeId));
    await db.delete(commerceStorePlans).where(eq(commerceStorePlans.storeId, storeId));
    await db.delete(commerceStoreCommercialSettings).where(eq(commerceStoreCommercialSettings.storeId, storeId));
    await db.delete(commerceVariants).where(eq(commerceVariants.productId, productId));
    await db.delete(commerceProducts).where(eq(commerceProducts.id, productId));
    await db.delete(commerceStoreMembers).where(eq(commerceStoreMembers.storeId, storeId));
    await db.delete(commerceStores).where(eq(commerceStores.id, storeId));
    await db.delete(commerceWorkspaces).where(eq(commerceWorkspaces.id, workspaceId));
  });

  it("creates an Algeria delivery checkout with separate payment review and cash-settlement states", async () => {
    const cart = await createCart(`session_${suffix}_cod`, storeId);
    await addCartLine({ cartId: cart.id, variantId, quantity: 1 });
    const setup = await getStorefrontCheckoutSetup(cart.id);
    expect(setup.deliveryRates).toHaveLength(1);
    expect(setup.paymentMethods.map(method => method.provider)).toEqual(expect.arrayContaining(["CASH_ON_DELIVERY", "BANK_TRANSFER"]));
    const created = await createStorefrontCheckout({ cartId: cart.id, email: `buyer-${suffix}@example.test`, paymentProvider: "CASH_ON_DELIVERY", deliveryRateId: rateId, locale: "ar", shippingAddress: { firstName: "Amina", lastName: "Test", line1: "1 Test Street", city: "Alger", region: "Alger", countryCode: "DZ", phone: "0550000000" } });
    codOrderId = created.orderId;
    expect(created).toMatchObject({ paymentStatus: "AWAITING_REVIEW", totalCents: 54000, requiresMerchantReview: true });
    const db = await getDb();
    if (!db) throw new Error("Database unavailable.");
    const [attempt, fulfilment, order] = await Promise.all([
      db.select().from(commercePaymentAttempts).where(eq(commercePaymentAttempts.orderId, created.orderId)).limit(1),
      db.select().from(commerceFulfillments).where(eq(commerceFulfillments.orderId, created.orderId)).limit(1),
      db.select().from(commerceOrders).where(eq(commerceOrders.id, created.orderId)).limit(1),
    ]);
    expect(attempt[0]).toMatchObject({ provider: "CASH_ON_DELIVERY", status: "AWAITING_REVIEW", amountCents: 54000, currency: "DZD" });
    expect(fulfilment[0]?.cashSettlementStatus).toBe("EXPECTED");
    expect(order[0]?.shippingAddressSnapshot).toMatchObject({ city: "Alger", countryCode: "DZ" });
    const notifications = await db.select().from(commerceNotifications).where(eq(commerceNotifications.orderId, created.orderId));
    expect(notifications).toMatchObject([{ type: "ORDER_RECEIVED_CUSTOMER", recipient: `buyer-${suffix}@example.test`, status: "QUEUED" }]);
    await reviewMerchantPayment({ userId: ownerId, orderId: created.orderId, decision: "APPROVE", note: "Address confirmed" });
    const shipped = await createMerchantShipment({ userId: ownerId, orderId: created.orderId, carrier: "Manual carrier", trackingNumber: "COD-001" });
    expect(shipped.orderId).toBe(created.orderId);
    const delivered = await updateMerchantShipmentStatus({ userId: ownerId, shipmentId: shipped.shipmentId, status: "DELIVERED", cashRemittedCents: 54000 });
    expect(delivered.cashSettlementStatus).toBe("REMITTED_TO_MERCHANT");
  }, 30_000);

  it("maps matching Mailjet delivery and suppression events without modifying the order", async () => {
    const db = await getDb();
    if (!db) throw new Error("Database unavailable.");
    const [notification] = await db.select().from(commerceNotifications).where(eq(commerceNotifications.orderId, codOrderId)).limit(1);
    if (!notification) throw new Error("Expected checkout notification.");
    const providerMessageId = `mailjet-${suffix}`;
    await db.update(commerceNotifications).set({ status: "SENT", providerMessageId }).where(eq(commerceNotifications.id, notification.id));
    await expect(processMailjetDeliveryEvents([{ event: "sent", time: 1_789_000_000, Message_GUID: providerMessageId }])).resolves.toEqual({ delivered: 1, suppressed: 0, ignored: 0 });
    let [updated] = await db.select().from(commerceNotifications).where(eq(commerceNotifications.id, notification.id)).limit(1);
    expect(updated).toMatchObject({ status: "DELIVERED", providerMessageId });
    await expect(processMailjetDeliveryEvents([{ event: "bounce", time: 1_789_000_001, Message_GUID: providerMessageId }])).resolves.toEqual({ delivered: 0, suppressed: 1, ignored: 0 });
    [updated] = await db.select().from(commerceNotifications).where(eq(commerceNotifications.id, notification.id)).limit(1);
    expect(updated).toMatchObject({ status: "SUPPRESSED", providerMessageId });
    const [order] = await db.select().from(commerceOrders).where(eq(commerceOrders.id, codOrderId)).limit(1);
    expect(order?.id).toBe(codOrderId);
  });

  it("creates a bank-transfer order with merchant review and reserves inventory", async () => {
    const cart = await createCart(`session_${suffix}_bank`, storeId);
    await addCartLine({ cartId: cart.id, variantId, quantity: 1 });
    const created = await createStorefrontCheckout({ cartId: cart.id, email: `bank-${suffix}@example.test`, paymentProvider: "BANK_TRANSFER", deliveryRateId: rateId, locale: "fr", bankTransferReference: "VIR-2026-001", shippingAddress: { firstName: "Samir", lastName: "Test", line1: "2 Test Street", city: "Alger", region: "Alger", countryCode: "DZ", phone: "0660000000" } });
    transferOrderId = created.orderId;
    expect(created.paymentStatus).toBe("AWAITING_REVIEW");
    const db = await getDb();
    if (!db) throw new Error("Database unavailable.");
    const [attempt] = await db.select().from(commercePaymentAttempts).where(eq(commercePaymentAttempts.orderId, created.orderId)).limit(1);
    const [variant] = await db.select().from(commerceVariants).where(eq(commerceVariants.id, variantId)).limit(1);
    expect(attempt?.metadata).toMatchObject({ bankTransferReference: "VIR-2026-001" });
    expect(variant?.inventoryQty).toBe(6);
    const review = await reviewMerchantPayment({ userId: ownerId, orderId: created.orderId, decision: "APPROVE" });
    expect(review.paymentStatus).toBe("PAID");
  }, 30_000);

  it("persists configured tax lines and includes them in the immutable order total", async () => {
    const db = await getDb();
    if (!db) throw new Error("Database unavailable.");
    await db.update(commerceStoreCommercialSettings).set({ taxEnabled: true }).where(eq(commerceStoreCommercialSettings.storeId, storeId));
    await db.insert(commerceTaxRates).values({ id: `tax_${suffix}`, storeId, name: "Test TVA", countryCode: "DZ", regions: [], rateBasisPoints: 1900, appliesToShipping: false, active: true });
    const cart = await createCart(`session_${suffix}_tax`, storeId);
    await addCartLine({ cartId: cart.id, variantId, quantity: 1 });
    const created = await createStorefrontCheckout({ cartId: cart.id, email: `tax-${suffix}@example.test`, paymentProvider: "CASH_ON_DELIVERY", deliveryRateId: rateId, locale: "ar", shippingAddress: { firstName: "Tax", lastName: "Test", line1: "3 Test Street", city: "Alger", region: "Alger", countryCode: "DZ", phone: "0770000000" } });
    taxOrderId = created.orderId;
    expect(created.totalCents).toBe(63500);
    const [order] = await db.select().from(commerceOrders).where(eq(commerceOrders.id, created.orderId)).limit(1);
    expect(order?.taxCents).toBe(9500);
    expect(order?.taxLines).toMatchObject([{ name: "Test TVA", amountCents: 9500 }]);
  }, 30_000);

  it("records merchant return and refund decisions without moving funds", async () => {
    const db = await getDb();
    if (!db) throw new Error("Database unavailable.");
    const [order] = await db.select().from(commerceOrders).where(eq(commerceOrders.id, transferOrderId)).limit(1);
    if (!order?.customerProfileId) throw new Error("Expected a customer profile for the bank-transfer order.");
    await db.update(commerceCustomers).set({ userId: ownerId, status: "REGISTERED" }).where(eq(commerceCustomers.id, order.customerProfileId));
    const shipment = await createMerchantShipment({ userId: ownerId, orderId: transferOrderId, carrier: "Return test carrier" });
    await updateMerchantShipmentStatus({ userId: ownerId, shipmentId: shipment.shipmentId, status: "DELIVERED" });
    const returnRequest = await requestCustomerReturn({ userId: ownerId, orderId: transferOrderId, reason: "Size did not fit" });
    expect(returnRequest.status).toBe("REQUESTED");
    expect((await resolveMerchantReturn({ userId: ownerId, returnId: returnRequest.returnId, decision: "APPROVE" })).status).toBe("APPROVED");
    expect((await resolveMerchantReturn({ userId: ownerId, returnId: returnRequest.returnId, decision: "RECEIVE" })).status).toBe("RECEIVED");
    const refund = await createMerchantRefund({ userId: ownerId, orderId: transferOrderId, returnId: returnRequest.returnId, amountCents: 1000, reason: "Approved return adjustment" });
    expect(refund.status).toBe("MANUAL_REVIEW");
    expect((await resolveMerchantRefund({ userId: ownerId, refundId: refund.refundId, decision: "SUCCEEDED" })).status).toBe("SUCCEEDED");
    const [record] = await db.select().from(commerceRefunds).where(eq(commerceRefunds.id, refund.refundId)).limit(1);
    expect(record).toMatchObject({ status: "SUCCEEDED", amountCents: 1000, returnId: returnRequest.returnId });
  }, 30_000);

  it("records native subscription invoice transfer submission and manual approval without a billing provider", async () => {
    const created = await createAdminSubscriptionInvoice({ storeId, planKey: "STARTER", amountCents: 250000, currency: "DZD", metadata: { period: "2026-09" } });
    expect(created.status).toBe("PENDING_PAYMENT");
    expect(await listMerchantSubscriptionInvoices(ownerId, storeId)).toEqual(expect.arrayContaining([expect.objectContaining({ id: created.invoiceId, status: "PENDING_PAYMENT", amountCents: 250000 })]));
    expect((await submitMerchantSubscriptionInvoiceReference(ownerId, { invoiceId: created.invoiceId, bankTransferReference: "VIR-2026-SUB-01" })).status).toBe("AWAITING_REVIEW");
    expect((await reviewAdminSubscriptionInvoice({ invoiceId: created.invoiceId, decision: "PAID" })).status).toBe("PAID");
    const db = await getDb();
    if (!db) throw new Error("Database unavailable.");
    const [invoice, plan] = await Promise.all([
      db.select().from(commerceSubscriptionInvoices).where(eq(commerceSubscriptionInvoices.id, created.invoiceId)).limit(1),
      db.select().from(commerceStorePlans).where(eq(commerceStorePlans.storeId, storeId)).limit(1),
    ]);
    expect(invoice[0]).toMatchObject({ status: "PAID", bankTransferReference: "VIR-2026-SUB-01" });
    expect(plan[0]).toMatchObject({ status: "ACTIVE", billingProvider: "MANUAL_BANK_TRANSFER" });
  }, 30_000);
});
