import { and, desc, eq, inArray } from "drizzle-orm";
import { nanoid } from "nanoid";
import {
  commerceAuditEvents,
  commerceCartLines,
  commerceCarts,
  commerceCustomers,
  commerceDeliveryRates,
  commerceDeliveryZones,
  commerceFulfillments,
  commerceInventoryMovements,
  commerceOrderLines,
  commerceOrders,
  commerceNotifications,
  commercePaymentAttempts,
  commercePaymentEvents,
  commercePaymentProviders,
  commerceProducts,
  commerceRefunds,
  commerceReturns,
  commerceShipments,
  commerceShipmentEvents,
  commerceStoreCommercialSettings,
  commerceStorePlans,
  commerceSubscriptionInvoices,
  commerceTaxRates,
  commerceVariants,
} from "../../drizzle/schema";
import { calculateCommerceTotals, assertInventoryAvailability } from "./domain";
import { getDb } from "../db";
import { createDefaultPaymentProviderRows, validateMerchantPaymentProviderUpdate } from "../../shared/paymentCapabilities";
import { assertStoreMembership, getCart } from "./service";
import { nativePaymentAttemptStatus, normalizeChargilyWebhook, payloadDigest, verifyChargilySignature, type PaymentProviderKey } from "./payments";
import { deliverQueuedOrderNotifications } from "./mailjet";

type CheckoutAddress = {
  firstName: string;
  lastName: string;
  line1: string;
  line2?: string;
  city: string;
  region?: string;
  postalCode?: string;
  countryCode: string;
  phone: string;
};

type StorefrontCheckoutInput = {
  cartId: string;
  email: string;
  paymentProvider: PaymentProviderKey;
  deliveryRateId: string;
  shippingAddress: CheckoutAddress;
  locale: "en" | "fr" | "ar";
  bankTransferReference?: string;
};

async function requireDb() {
  const db = await getDb();
  if (!db) throw new Error("Commerce database is unavailable.");
  return db;
}

function nextOrderNumber() {
  return `FC-${new Date().getUTCFullYear()}-${nanoid(7).toUpperCase()}`;
}

function calculateTax(amountCents: number, shippingCents: number, rates: Array<{ name: string; rateBasisPoints: number; appliesToShipping: boolean }>) {
  return rates.map(rate => ({
    name: rate.name,
    rateBasisPoints: rate.rateBasisPoints,
    amountCents: Math.round((amountCents + (rate.appliesToShipping ? shippingCents : 0)) * rate.rateBasisPoints / 10_000),
  }));
}

async function resolveStoreCommercialDefaults(storeId: string) {
  const db = await requireDb();
  const [settings] = await db.select().from(commerceStoreCommercialSettings).where(eq(commerceStoreCommercialSettings.storeId, storeId)).limit(1);
  if (!settings) {
    await db.insert(commerceStoreCommercialSettings).values({ storeId, countryCode: "DZ", taxEnabled: false, checkoutRequiresAccount: false });
  }
  const providers = await db.select().from(commercePaymentProviders).where(eq(commercePaymentProviders.storeId, storeId));
  if (!providers.length) {
    await db.insert(commercePaymentProviders).values(createDefaultPaymentProviderRows(storeId, () => `pay_${nanoid(14)}`));
  }
}

export async function getStorefrontCheckoutSetup(cartId: string) {
  const cart = await getCart(cartId);
  if (!cart || cart.status !== "OPEN") throw new Error("Open cart not found.");
  await resolveStoreCommercialDefaults(cart.storeId);
  const db = await requireDb();
  const [providers, zones] = await Promise.all([
    db.select({ provider: commercePaymentProviders.provider, displayName: commercePaymentProviders.displayName, status: commercePaymentProviders.status }).from(commercePaymentProviders).where(and(eq(commercePaymentProviders.storeId, cart.storeId), inArray(commercePaymentProviders.status, ["ACTIVE", "TEST"]))),
    db.select({ zone: commerceDeliveryZones, rate: commerceDeliveryRates }).from(commerceDeliveryZones).innerJoin(commerceDeliveryRates, eq(commerceDeliveryZones.id, commerceDeliveryRates.zoneId)).where(and(eq(commerceDeliveryZones.storeId, cart.storeId), eq(commerceDeliveryZones.enabled, true), eq(commerceDeliveryRates.active, true))),
  ]);
  return {
    cart,
    paymentMethods: providers.map(provider => ({ provider: provider.provider, label: provider.displayName })),
    deliveryRates: zones.map(({ zone, rate }) => ({ id: rate.id, name: rate.name, methodCode: rate.methodCode, amountCents: rate.amountCents, regions: zone.regions, estimatedMinDays: rate.estimatedMinDays, estimatedMaxDays: rate.estimatedMaxDays, codAvailable: rate.codAvailable })),
  };
}

export async function createStorefrontCheckout(input: StorefrontCheckoutInput) {
  const cart = await getCart(input.cartId);
  if (!cart || cart.status !== "OPEN") throw new Error("Open cart not found.");
  await resolveStoreCommercialDefaults(cart.storeId);
  const db = await requireDb();
  const [provider, deliverySelection, settings] = await Promise.all([
    db.select().from(commercePaymentProviders).where(and(eq(commercePaymentProviders.storeId, cart.storeId), eq(commercePaymentProviders.provider, input.paymentProvider), inArray(commercePaymentProviders.status, ["ACTIVE", "TEST"]))).limit(1),
    db.select({ rate: commerceDeliveryRates, zone: commerceDeliveryZones }).from(commerceDeliveryRates).innerJoin(commerceDeliveryZones, eq(commerceDeliveryRates.zoneId, commerceDeliveryZones.id)).where(and(eq(commerceDeliveryRates.id, input.deliveryRateId), eq(commerceDeliveryZones.storeId, cart.storeId), eq(commerceDeliveryZones.enabled, true), eq(commerceDeliveryRates.active, true))).limit(1),
    db.select().from(commerceStoreCommercialSettings).where(eq(commerceStoreCommercialSettings.storeId, cart.storeId)).limit(1),
  ]);
  if (!provider[0]) throw new Error("This payment method is not enabled for the store.");
  const delivery = deliverySelection[0];
  if (!delivery) throw new Error("The selected delivery method is not available.");
  const regionIsServed = !delivery.zone.regions.length || delivery.zone.regions.includes(input.shippingAddress.region ?? "") || delivery.zone.regions.includes(input.shippingAddress.city);
  if (delivery.zone.countryCode !== input.shippingAddress.countryCode.toUpperCase() || !regionIsServed) throw new Error("The selected delivery method does not serve this address.");
  if (input.paymentProvider === "CASH_ON_DELIVERY" && !delivery.rate.codAvailable) throw new Error("Cash on delivery is not available for this delivery method.");

  const variants = await db.select().from(commerceVariants).where(inArray(commerceVariants.id, cart.lines.map(line => line.variantId)));
  cart.lines.forEach(line => assertInventoryAvailability({ title: line.variantTitle, requestedQuantity: line.quantity, inventoryQty: line.inventoryQty }));
  const totalsBeforeTax = calculateCommerceTotals({ lines: cart.lines, promotion: cart.promotion, shippingCents: delivery.rate.amountCents });
  const taxRates = settings[0]?.taxEnabled
    ? await db.select({ name: commerceTaxRates.name, rateBasisPoints: commerceTaxRates.rateBasisPoints, appliesToShipping: commerceTaxRates.appliesToShipping }).from(commerceTaxRates).where(and(eq(commerceTaxRates.storeId, cart.storeId), eq(commerceTaxRates.active, true)))
    : [];
  const taxLines = calculateTax(totalsBeforeTax.subtotalCents - totalsBeforeTax.discountCents, totalsBeforeTax.shippingCents, taxRates);
  const taxCents = taxLines.reduce((sum, line) => sum + line.amountCents, 0);
  const orderId = `ord_${nanoid(16)}`;
  const orderNumber = nextOrderNumber();
  const paymentAttemptId = `payatt_${nanoid(14)}`;
  const customerEmail = input.email.trim().toLowerCase();
  const existingCustomer = await db.select().from(commerceCustomers).where(and(eq(commerceCustomers.storeId, cart.storeId), eq(commerceCustomers.email, customerEmail))).limit(1);
  const customerId = existingCustomer[0]?.id ?? `cus_${nanoid(14)}`;
  const orderStatus = input.paymentProvider === "CASH_ON_DELIVERY" || input.paymentProvider === "BANK_TRANSFER" ? "PENDING_PAYMENT" as const : "PENDING_PAYMENT" as const;
  const paymentStatus = nativePaymentAttemptStatus(input.paymentProvider);
  const cashSettlementStatus = input.paymentProvider === "CASH_ON_DELIVERY" ? "EXPECTED" as const : "NOT_APPLICABLE" as const;
  const totalCents = totalsBeforeTax.totalCents + taxCents;

  await db.transaction(async tx => {
    if (!existingCustomer[0]) {
      await tx.insert(commerceCustomers).values({ id: customerId, storeId: cart.storeId, email: customerEmail, phone: input.shippingAddress.phone, firstName: input.shippingAddress.firstName, lastName: input.shippingAddress.lastName, status: "GUEST", preferredLocale: input.locale });
    } else {
      await tx.update(commerceCustomers).set({ phone: input.shippingAddress.phone, firstName: input.shippingAddress.firstName, lastName: input.shippingAddress.lastName, preferredLocale: input.locale }).where(eq(commerceCustomers.id, customerId));
    }
    await tx.insert(commerceOrders).values({
      id: orderId,
      orderNumber,
      customerProfileId: customerId,
      storeId: cart.storeId,
      email: customerEmail,
      status: orderStatus,
      paymentStatus,
      fulfillmentStatus: "UNFULFILLED",
      paymentMethod: input.paymentProvider,
      currency: cart.currency,
      subtotalCents: totalsBeforeTax.subtotalCents,
      discountCents: totalsBeforeTax.discountCents,
      taxCents,
      shippingCents: totalsBeforeTax.shippingCents,
      totalCents,
      promotionCode: cart.promotion?.code ?? null,
      shippingMethod: delivery.rate.methodCode,
      shippingAddressSnapshot: input.shippingAddress,
      billingAddressSnapshot: input.shippingAddress,
      taxLines,
      placedAt: new Date(),
    });
    await tx.insert(commerceOrderLines).values(cart.lines.map(line => ({ id: `oli_${nanoid(16)}`, orderId, variantId: line.variantId, title: `${line.title} — ${line.variantTitle}`, sku: line.sku, quantity: line.quantity, unitPriceCents: line.unitPriceCents })));
    await tx.insert(commercePaymentAttempts).values({ id: paymentAttemptId, orderId, storeId: cart.storeId, provider: input.paymentProvider, method: input.paymentProvider, status: paymentStatus, amountCents: totalCents, currency: cart.currency, idempotencyKey: `checkout:${cart.id}:${input.paymentProvider}`, metadata: { cartId: cart.id, orderId, bankTransferReference: input.bankTransferReference ?? null } });
    await tx.insert(commerceFulfillments).values({ id: `ful_${nanoid(14)}`, orderId, storeId: cart.storeId, status: "UNFULFILLED", cashSettlementStatus });
    await tx.insert(commerceAuditEvents).values({ id: `audit_${nanoid(14)}`, storeId: cart.storeId, actorType: "CUSTOMER", action: "order.created", entityType: "order", entityId: orderId, data: { paymentProvider: input.paymentProvider, paymentStatus, totalCents } });
    const notifications = [
      { id: `note_${nanoid(14)}`, storeId: cart.storeId, customerId, orderId, channel: "EMAIL" as const, type: "ORDER_RECEIVED_CUSTOMER", recipient: customerEmail, status: "QUEUED" as const, locale: input.locale, payload: { template: "order-received-customer", orderNumber, totalCents, currency: cart.currency, paymentProvider: input.paymentProvider } },
      ...(settings[0]?.businessEmail ? [{ id: `note_${nanoid(14)}`, storeId: cart.storeId, customerId, orderId, channel: "EMAIL" as const, type: "ORDER_RECEIVED_MERCHANT", recipient: settings[0].businessEmail, status: "QUEUED" as const, locale: input.locale, payload: { template: "order-received-merchant", orderNumber, totalCents, currency: cart.currency, paymentProvider: input.paymentProvider } }] : []),
    ];
    await tx.insert(commerceNotifications).values(notifications);
    for (const variant of variants) {
      const line = cart.lines.find(item => item.variantId === variant.id);
      if (line) {
        await tx.update(commerceVariants).set({ inventoryQty: variant.inventoryQty - line.quantity }).where(eq(commerceVariants.id, variant.id));
        await tx.insert(commerceInventoryMovements).values({ id: `stock_${nanoid(14)}`, storeId: cart.storeId, variantId: variant.id, delta: -line.quantity, reason: "ORDER_RESERVATION", referenceType: "order", referenceId: orderId, note: "Inventory reserved at checkout" });
      }
    }
    await tx.update(commerceCarts).set({ status: "CONVERTED" }).where(eq(commerceCarts.id, cart.id));
  });
  await deliverQueuedOrderNotifications(orderId);
  return { orderId, orderNumber, paymentAttemptId, paymentStatus, totalCents, currency: cart.currency, requiresMerchantReview: paymentStatus === "AWAITING_REVIEW" };
}

export async function updateCommercialSettings(input: { userId: number; storeId: string; legalName?: string; businessEmail?: string; businessPhone?: string; countryCode: string; taxRegistrationNumber?: string; taxEnabled: boolean; checkoutRequiresAccount: boolean }) {
  await assertStoreMembership(input.userId, input.storeId, ["OWNER", "MANAGER"]);
  const db = await requireDb();
  await db.insert(commerceStoreCommercialSettings).values({ storeId: input.storeId, legalName: input.legalName, businessEmail: input.businessEmail, businessPhone: input.businessPhone, countryCode: input.countryCode.toUpperCase(), taxRegistrationNumber: input.taxRegistrationNumber, taxEnabled: input.taxEnabled, checkoutRequiresAccount: input.checkoutRequiresAccount }).onDuplicateKeyUpdate({ set: { legalName: input.legalName, businessEmail: input.businessEmail, businessPhone: input.businessPhone, countryCode: input.countryCode.toUpperCase(), taxRegistrationNumber: input.taxRegistrationNumber, taxEnabled: input.taxEnabled, checkoutRequiresAccount: input.checkoutRequiresAccount } });
  return db.select().from(commerceStoreCommercialSettings).where(eq(commerceStoreCommercialSettings.storeId, input.storeId)).limit(1);
}

export async function updateMerchantPaymentProvider(input: { userId: number; storeId: string; provider: PaymentProviderKey; status: "DISABLED" | "TEST" | "ACTIVE" | "ERROR"; displayName: string; configuration: Record<string, unknown> }) {
  await assertStoreMembership(input.userId, input.storeId, ["OWNER", "MANAGER"]);
  const capability = validateMerchantPaymentProviderUpdate(input.provider, input.status);
  const db = await requireDb();
  await db.insert(commercePaymentProviders).values({ id: `pay_${nanoid(14)}`, storeId: input.storeId, provider: input.provider, status: input.status, displayName: capability.displayName, configuration: { ...capability.defaultConfiguration, ...input.configuration } }).onDuplicateKeyUpdate({ set: { status: input.status, displayName: capability.displayName, configuration: { ...capability.defaultConfiguration, ...input.configuration }, lastError: null } });
  await db.insert(commerceAuditEvents).values({ id: `audit_${nanoid(14)}`, storeId: input.storeId, actorUserId: input.userId, actorType: "MERCHANT", action: "payment-provider.updated", entityType: "payment-provider", entityId: input.provider, data: { status: input.status } });
  return db.select().from(commercePaymentProviders).where(eq(commercePaymentProviders.storeId, input.storeId));
}

export async function upsertMerchantDeliveryRate(input: { userId: number; storeId: string; zoneName: string; region?: string; rateName: string; amountCents: number; codAvailable: boolean; estimatedMinDays?: number; estimatedMaxDays?: number }) {
  await assertStoreMembership(input.userId, input.storeId, ["OWNER", "MANAGER"]);
  if (input.estimatedMinDays !== undefined && input.estimatedMaxDays !== undefined && input.estimatedMinDays > input.estimatedMaxDays) throw new Error("The minimum delivery estimate cannot exceed the maximum.");
  const db = await requireDb();
  const zoneName = input.zoneName.trim();
  const requestedRegion = input.region?.trim();
  const [existingZone] = await db.select().from(commerceDeliveryZones).where(and(eq(commerceDeliveryZones.storeId, input.storeId), eq(commerceDeliveryZones.name, zoneName))).limit(1);
  const zoneId = existingZone?.id ?? `zone_${nanoid(14)}`;
  const regions = Array.from(new Set([...(existingZone?.regions ?? []), ...(requestedRegion ? [requestedRegion] : [])]));
  if (existingZone) await db.update(commerceDeliveryZones).set({ regions, enabled: true }).where(eq(commerceDeliveryZones.id, zoneId));
  else await db.insert(commerceDeliveryZones).values({ id: zoneId, storeId: input.storeId, name: zoneName, countryCode: "DZ", regions, enabled: true });
  const methodCode = `STANDARD-${zoneId.slice(-8).toUpperCase()}`;
  const [existingRate] = await db.select().from(commerceDeliveryRates).where(and(eq(commerceDeliveryRates.zoneId, zoneId), eq(commerceDeliveryRates.methodCode, methodCode))).limit(1);
  const rateId = existingRate?.id ?? `rate_${nanoid(14)}`;
  const values = { name: input.rateName.trim(), amountCents: input.amountCents, codAvailable: input.codAvailable, estimatedMinDays: input.estimatedMinDays ?? null, estimatedMaxDays: input.estimatedMaxDays ?? null, active: true };
  if (existingRate) await db.update(commerceDeliveryRates).set(values).where(eq(commerceDeliveryRates.id, rateId));
  else await db.insert(commerceDeliveryRates).values({ id: rateId, zoneId, methodCode, ...values });
  await db.insert(commerceAuditEvents).values({ id: `audit_${nanoid(14)}`, storeId: input.storeId, actorUserId: input.userId, actorType: "MERCHANT", action: "delivery-rate.upserted", entityType: "delivery-rate", entityId: rateId, data: { zoneId, amountCents: input.amountCents, codAvailable: input.codAvailable } });
  return { zoneId, rateId };
}

export async function upsertMerchantTaxRate(input: { userId: number; storeId: string; name: string; rateBasisPoints: number; appliesToShipping: boolean; active: boolean }) {
  await assertStoreMembership(input.userId, input.storeId, ["OWNER", "MANAGER"]);
  const db = await requireDb();
  const name = input.name.trim();
  const [existing] = await db.select().from(commerceTaxRates).where(and(eq(commerceTaxRates.storeId, input.storeId), eq(commerceTaxRates.name, name))).limit(1);
  const taxRateId = existing?.id ?? `tax_${nanoid(14)}`;
  const values = { name, rateBasisPoints: input.rateBasisPoints, appliesToShipping: input.appliesToShipping, active: input.active };
  if (existing) await db.update(commerceTaxRates).set(values).where(eq(commerceTaxRates.id, taxRateId));
  else await db.insert(commerceTaxRates).values({ id: taxRateId, storeId: input.storeId, countryCode: "DZ", regions: [], ...values });
  await db.insert(commerceAuditEvents).values({ id: `audit_${nanoid(14)}`, storeId: input.storeId, actorUserId: input.userId, actorType: "MERCHANT", action: "tax-rate.upserted", entityType: "tax-rate", entityId: taxRateId, data: { rateBasisPoints: input.rateBasisPoints, appliesToShipping: input.appliesToShipping, active: input.active } });
  return { taxRateId };
}

async function merchantOrder(userId: number, orderId: string) {
  const db = await requireDb();
  const [order] = await db.select().from(commerceOrders).where(eq(commerceOrders.id, orderId)).limit(1);
  if (!order) throw new Error("Order not found.");
  await assertStoreMembership(userId, order.storeId, ["OWNER", "MANAGER"]);
  return order;
}

export async function listMerchantOrderOperations(userId: number, storeId: string) {
  await assertStoreMembership(userId, storeId, ["OWNER", "MANAGER", "MERCHANDISER", "ANALYST"]);
  const db = await requireDb();
  const orders = await db.select().from(commerceOrders).where(eq(commerceOrders.storeId, storeId)).orderBy(desc(commerceOrders.createdAt)).limit(100);
  const orderIds = orders.map(order => order.id);
  const [attempts, fulfillments, shipments, returns, refunds] = orderIds.length ? await Promise.all([
    db.select().from(commercePaymentAttempts).where(inArray(commercePaymentAttempts.orderId, orderIds)).orderBy(desc(commercePaymentAttempts.createdAt)),
    db.select().from(commerceFulfillments).where(inArray(commerceFulfillments.orderId, orderIds)),
    db.select().from(commerceShipments).orderBy(desc(commerceShipments.createdAt)),
    db.select().from(commerceReturns).where(inArray(commerceReturns.orderId, orderIds)).orderBy(desc(commerceReturns.createdAt)),
    db.select().from(commerceRefunds).where(inArray(commerceRefunds.orderId, orderIds)).orderBy(desc(commerceRefunds.createdAt)),
  ]) : [[], [], [], [], []];
  const fulfillmentIds = new Set(fulfillments.map(item => item.id));
  return orders.map(order => ({ ...order, paymentAttempt: attempts.find(item => item.orderId === order.id) ?? null, fulfillment: fulfillments.find(item => item.orderId === order.id) ?? null, shipments: shipments.filter(item => fulfillmentIds.has(item.fulfillmentId) && fulfillments.some(fulfillment => fulfillment.id === item.fulfillmentId && fulfillment.orderId === order.id)), returns: returns.filter(item => item.orderId === order.id), refunds: refunds.filter(item => item.orderId === order.id) }));
}

export async function getMerchantOperationsMonitoring(userId: number, storeId: string) {
  await assertStoreMembership(userId, storeId, ["OWNER", "MANAGER", "MERCHANDISER", "ANALYST"]);
  const db = await requireDb();
  const [variants, paymentReviews, notifications, recentMovements] = await Promise.all([
    db.select({ variant: commerceVariants, product: commerceProducts }).from(commerceVariants).innerJoin(commerceProducts, eq(commerceVariants.productId, commerceProducts.id)).where(eq(commerceProducts.storeId, storeId)),
    db.select({ id: commercePaymentAttempts.id }).from(commercePaymentAttempts).where(and(eq(commercePaymentAttempts.storeId, storeId), eq(commercePaymentAttempts.status, "AWAITING_REVIEW"))),
    db.select({ status: commerceNotifications.status }).from(commerceNotifications).where(eq(commerceNotifications.storeId, storeId)),
    db.select({ movement: commerceInventoryMovements, variant: commerceVariants, product: commerceProducts }).from(commerceInventoryMovements).innerJoin(commerceVariants, eq(commerceInventoryMovements.variantId, commerceVariants.id)).innerJoin(commerceProducts, eq(commerceVariants.productId, commerceProducts.id)).where(eq(commerceInventoryMovements.storeId, storeId)).orderBy(desc(commerceInventoryMovements.createdAt)).limit(10),
  ]);
  const lowStock = variants.filter(item => item.variant.lowStockThreshold > 0 && item.variant.inventoryQty <= item.variant.lowStockThreshold).map(item => ({ productId: item.product.id, productTitle: item.product.title, variantId: item.variant.id, variantTitle: item.variant.title, sku: item.variant.sku, inventoryQty: item.variant.inventoryQty, lowStockThreshold: item.variant.lowStockThreshold }));
  return {
    lowStock,
    metrics: {
      lowStockCount: lowStock.length,
      paymentReviewCount: paymentReviews.length,
      queuedNotificationCount: notifications.filter(item => item.status === "QUEUED").length,
      providerAcceptedNotificationCount: notifications.filter(item => item.status === "SENT").length,
      failedNotificationCount: notifications.filter(item => item.status === "FAILED").length,
    },
    recentMovements: recentMovements.map(item => ({ id: item.movement.id, createdAt: item.movement.createdAt, delta: item.movement.delta, reason: item.movement.reason, note: item.movement.note, productTitle: item.product.title, variantTitle: item.variant.title, sku: item.variant.sku })),
  };
}

export async function listMerchantSubscriptionInvoices(userId: number, storeId: string) {
  await assertStoreMembership(userId, storeId, ["OWNER", "MANAGER"]);
  const db = await requireDb();
  return db.select().from(commerceSubscriptionInvoices).where(eq(commerceSubscriptionInvoices.storeId, storeId)).orderBy(desc(commerceSubscriptionInvoices.createdAt)).limit(100);
}

export async function submitMerchantSubscriptionInvoiceReference(userId: number, input: { invoiceId: string; bankTransferReference: string }) {
  const db = await requireDb();
  const [invoice] = await db.select().from(commerceSubscriptionInvoices).where(eq(commerceSubscriptionInvoices.id, input.invoiceId)).limit(1);
  if (!invoice) throw new Error("Subscription invoice not found.");
  await assertStoreMembership(userId, invoice.storeId, ["OWNER", "MANAGER"]);
  if (invoice.status !== "PENDING_PAYMENT") throw new Error("Only a pending subscription invoice can receive a transfer reference.");
  await db.transaction(async tx => {
    await tx.update(commerceSubscriptionInvoices).set({ status: "AWAITING_REVIEW", bankTransferReference: input.bankTransferReference.trim() }).where(eq(commerceSubscriptionInvoices.id, invoice.id));
    await tx.insert(commerceAuditEvents).values({ id: `audit_${nanoid(14)}`, storeId: invoice.storeId, actorUserId: userId, actorType: "MERCHANT", action: "subscription_invoice.transfer_submitted", entityType: "subscription_invoice", entityId: invoice.id, data: { planKey: invoice.planKey } });
  });
  return { invoiceId: invoice.id, status: "AWAITING_REVIEW" as const };
}

export async function createAdminSubscriptionInvoice(input: { storeId: string; planKey: string; amountCents: number; currency: string; dueAt?: Date; metadata: Record<string, unknown> }) {
  const db = await requireDb();
  const [plan] = await db.select().from(commerceStorePlans).where(eq(commerceStorePlans.storeId, input.storeId)).limit(1);
  if (!plan) throw new Error("Store plan not found.");
  const invoiceId = `subinv_${nanoid(14)}`;
  await db.insert(commerceSubscriptionInvoices).values({ id: invoiceId, storeId: input.storeId, planKey: input.planKey, status: "PENDING_PAYMENT", amountCents: input.amountCents, currency: input.currency.toUpperCase(), dueAt: input.dueAt ?? null, metadata: input.metadata });
  return { invoiceId, status: "PENDING_PAYMENT" as const };
}

export async function reviewAdminSubscriptionInvoice(input: { invoiceId: string; decision: "PAID" | "VOID" }) {
  const db = await requireDb();
  const [invoice] = await db.select().from(commerceSubscriptionInvoices).where(eq(commerceSubscriptionInvoices.id, input.invoiceId)).limit(1);
  if (!invoice) throw new Error("Subscription invoice not found.");
  if (invoice.status !== "AWAITING_REVIEW") throw new Error("Only a submitted subscription invoice can be reviewed.");
  await db.transaction(async tx => {
    await tx.update(commerceSubscriptionInvoices).set({ status: input.decision, paidAt: input.decision === "PAID" ? new Date() : null }).where(eq(commerceSubscriptionInvoices.id, invoice.id));
    if (input.decision === "PAID") await tx.update(commerceStorePlans).set({ status: "ACTIVE", billingProvider: "MANUAL_BANK_TRANSFER" }).where(eq(commerceStorePlans.storeId, invoice.storeId));
    await tx.insert(commerceAuditEvents).values({ id: `audit_${nanoid(14)}`, storeId: invoice.storeId, actorType: "SYSTEM", action: `subscription_invoice.${input.decision.toLowerCase()}`, entityType: "subscription_invoice", entityId: invoice.id, data: { planKey: invoice.planKey, manualReview: true } });
  });
  return { invoiceId: invoice.id, status: input.decision };
}

export async function reviewMerchantPayment(input: { userId: number; orderId: string; decision: "APPROVE" | "REJECT"; note?: string }) {
  const order = await merchantOrder(input.userId, input.orderId);
  const db = await requireDb();
  const [attempt] = await db.select().from(commercePaymentAttempts).where(eq(commercePaymentAttempts.orderId, order.id)).orderBy(desc(commercePaymentAttempts.createdAt)).limit(1);
  if (!attempt || attempt.status !== "AWAITING_REVIEW") throw new Error("This order has no payment awaiting merchant review.");
  if (!["CASH_ON_DELIVERY", "BANK_TRANSFER"].includes(attempt.provider)) throw new Error("Only native payment methods can be reviewed manually.");
  const approved = input.decision === "APPROVE";
  const paymentStatus = approved && attempt.provider === "BANK_TRANSFER" ? "PAID" : approved ? "PENDING" : "CANCELED";
  const orderPaymentStatus = approved && attempt.provider === "BANK_TRANSFER" ? "PAID" : approved ? "PENDING" : "CANCELED";
  await db.transaction(async tx => {
    await tx.update(commercePaymentAttempts).set({ status: paymentStatus, paidAt: paymentStatus === "PAID" ? new Date() : null }).where(eq(commercePaymentAttempts.id, attempt.id));
    await tx.update(commerceOrders).set({ status: approved ? "CONFIRMED" : "CANCELLED", paymentStatus: orderPaymentStatus, cancelledAt: approved ? null : new Date() }).where(eq(commerceOrders.id, order.id));
    await tx.update(commerceFulfillments).set({ notes: input.note?.trim() || null }).where(eq(commerceFulfillments.orderId, order.id));
    await tx.insert(commerceAuditEvents).values({ id: `audit_${nanoid(14)}`, storeId: order.storeId, actorUserId: input.userId, actorType: "MERCHANT", action: approved ? "payment.reviewed.approved" : "payment.reviewed.rejected", entityType: "order", entityId: order.id, data: { paymentProvider: attempt.provider, note: input.note ?? null } });
  });
  return { orderId: order.id, approved, paymentStatus: orderPaymentStatus };
}

export async function createMerchantShipment(input: { userId: number; orderId: string; carrier: string; trackingNumber?: string; trackingUrl?: string; note?: string }) {
  const order = await merchantOrder(input.userId, input.orderId);
  if (order.status !== "CONFIRMED") throw new Error("Approve the order before creating a shipment.");
  const db = await requireDb();
  const [fulfillment] = await db.select().from(commerceFulfillments).where(eq(commerceFulfillments.orderId, order.id)).limit(1);
  if (!fulfillment) throw new Error("Order fulfilment record not found.");
  const shipmentId = `ship_${nanoid(14)}`;
  await db.transaction(async tx => {
    await tx.insert(commerceShipments).values({ id: shipmentId, fulfillmentId: fulfillment.id, provider: "MANUAL", carrier: input.carrier.trim(), trackingNumber: input.trackingNumber?.trim() || null, trackingUrl: input.trackingUrl?.trim() || null, status: "IN_TRANSIT", cashDueCents: order.paymentMethod === "CASH_ON_DELIVERY" ? order.totalCents : 0, shippedAt: new Date() });
    await tx.update(commerceFulfillments).set({ status: "FULFILLED", notes: input.note?.trim() || fulfillment.notes, fulfilledAt: new Date() }).where(eq(commerceFulfillments.id, fulfillment.id));
    await tx.update(commerceOrders).set({ status: "FULFILLED", fulfillmentStatus: "FULFILLED" }).where(eq(commerceOrders.id, order.id));
    await tx.insert(commerceAuditEvents).values({ id: `audit_${nanoid(14)}`, storeId: order.storeId, actorUserId: input.userId, actorType: "MERCHANT", action: "shipment.created", entityType: "shipment", entityId: shipmentId, data: { carrier: input.carrier, trackingNumber: input.trackingNumber ?? null } });
  });
  return { shipmentId, orderId: order.id };
}

export async function resolveMerchantReturn(input: { userId: number; returnId: string; decision: "APPROVE" | "REJECT" | "RECEIVE" | "CLOSE"; merchantNote?: string }) {
  const db = await requireDb();
  const [record] = await db.select().from(commerceReturns).where(eq(commerceReturns.id, input.returnId)).limit(1);
  if (!record) throw new Error("Return not found.");
  await assertStoreMembership(input.userId, record.storeId, ["OWNER", "MANAGER"]);
  const status = input.decision === "APPROVE" ? "APPROVED" : input.decision === "REJECT" ? "REJECTED" : input.decision === "RECEIVE" ? "RECEIVED" : "CLOSED";
  await db.transaction(async tx => {
    await tx.update(commerceReturns).set({ status, merchantNote: input.merchantNote?.trim() || record.merchantNote, resolvedAt: status === "RECEIVED" || status === "CLOSED" || status === "REJECTED" ? new Date() : null }).where(eq(commerceReturns.id, record.id));
    await tx.insert(commerceAuditEvents).values({ id: `audit_${nanoid(14)}`, storeId: record.storeId, actorUserId: input.userId, actorType: "MERCHANT", action: `return.${status.toLowerCase()}`, entityType: "return", entityId: record.id, data: { note: input.merchantNote ?? null } });
  });
  return { returnId: record.id, status };
}

export async function createMerchantRefund(input: { userId: number; orderId: string; amountCents: number; reason: string; returnId?: string }) {
  const order = await merchantOrder(input.userId, input.orderId);
  const db = await requireDb();
  const [attempt] = await db.select().from(commercePaymentAttempts).where(eq(commercePaymentAttempts.orderId, order.id)).orderBy(desc(commercePaymentAttempts.createdAt)).limit(1);
  if (!attempt || attempt.status !== "PAID") throw new Error("A refund can only be recorded for a paid order.");
  const refunded = await db.select({ amountCents: commerceRefunds.amountCents }).from(commerceRefunds).where(and(eq(commerceRefunds.orderId, order.id), eq(commerceRefunds.status, "SUCCEEDED")));
  const priorTotal = refunded.reduce((sum, item) => sum + item.amountCents, 0);
  if (priorTotal + input.amountCents > order.totalCents) throw new Error("Refund amount exceeds the paid order total.");
  const refundId = `refund_${nanoid(14)}`;
  const fullRefund = priorTotal + input.amountCents === order.totalCents;
  await db.transaction(async tx => {
    await tx.insert(commerceRefunds).values({ id: refundId, orderId: order.id, storeId: order.storeId, paymentAttemptId: attempt.id, returnId: input.returnId ?? null, status: "MANUAL_REVIEW", amountCents: input.amountCents, currency: order.currency, reason: input.reason.trim(), initiatedByUserId: input.userId });
    await tx.update(commerceOrders).set({ paymentStatus: fullRefund ? "REFUNDED" : "PARTIALLY_REFUNDED" }).where(eq(commerceOrders.id, order.id));
    await tx.insert(commerceAuditEvents).values({ id: `audit_${nanoid(14)}`, storeId: order.storeId, actorUserId: input.userId, actorType: "MERCHANT", action: "refund.recorded", entityType: "refund", entityId: refundId, data: { amountCents: input.amountCents, manualReview: true } });
  });
  return { refundId, status: "MANUAL_REVIEW" as const };
}

export async function requestCustomerReturn(input: { userId: number; orderId: string; reason: string; customerNote?: string }) {
  const db = await requireDb();
  const [order] = await db.select().from(commerceOrders).where(eq(commerceOrders.id, input.orderId)).limit(1);
  if (!order) throw new Error("Order not found.");
  const [profile] = order.customerProfileId ? await db.select().from(commerceCustomers).where(eq(commerceCustomers.id, order.customerProfileId)).limit(1) : [null];
  if (order.customerId !== input.userId && profile?.userId !== input.userId) throw new Error("You cannot request a return for this order.");
  if (order.fulfillmentStatus !== "FULFILLED") throw new Error("A return can only be requested after fulfilment.");
  const [existing] = await db.select({ id: commerceReturns.id }).from(commerceReturns).where(and(eq(commerceReturns.orderId, order.id), inArray(commerceReturns.status, ["REQUESTED", "APPROVED", "RECEIVED"]))).limit(1);
  if (existing) throw new Error("There is already an open return request for this order.");
  const returnId = `return_${nanoid(14)}`;
  await db.transaction(async tx => {
    await tx.insert(commerceReturns).values({ id: returnId, orderId: order.id, storeId: order.storeId, status: "REQUESTED", reason: input.reason.trim(), customerNote: input.customerNote?.trim() || null });
    await tx.insert(commerceAuditEvents).values({ id: `audit_${nanoid(14)}`, storeId: order.storeId, actorUserId: input.userId, actorType: "CUSTOMER", action: "return.requested", entityType: "return", entityId: returnId, data: { orderId: order.id, reason: input.reason.trim() } });
  });
  return { returnId, status: "REQUESTED" as const };
}

export async function cancelMerchantOrder(input: { userId: number; orderId: string; reason: string }) {
  const order = await merchantOrder(input.userId, input.orderId);
  if (order.status === "CANCELLED" || order.status === "FULFILLED") throw new Error("This order can no longer be cancelled.");
  const db = await requireDb();
  const [attempt, lines] = await Promise.all([
    db.select().from(commercePaymentAttempts).where(eq(commercePaymentAttempts.orderId, order.id)).orderBy(desc(commercePaymentAttempts.createdAt)).limit(1),
    db.select().from(commerceOrderLines).where(eq(commerceOrderLines.orderId, order.id)),
  ]);
  await db.transaction(async tx => {
    for (const line of lines) {
      const [variant] = await tx.select().from(commerceVariants).where(eq(commerceVariants.id, line.variantId)).limit(1);
      if (variant) {
        await tx.update(commerceVariants).set({ inventoryQty: variant.inventoryQty + line.quantity }).where(eq(commerceVariants.id, variant.id));
        await tx.insert(commerceInventoryMovements).values({ id: `stock_${nanoid(14)}`, storeId: order.storeId, variantId: variant.id, delta: line.quantity, reason: "ORDER_CANCELLATION", referenceType: "order", referenceId: order.id, actorUserId: input.userId, note: "Inventory released after merchant cancellation" });
      }
    }
    await tx.update(commerceOrders).set({ status: "CANCELLED", fulfillmentStatus: "CANCELLED", paymentStatus: attempt[0]?.status === "PAID" ? "PAID" : "CANCELED", cancelledAt: new Date() }).where(eq(commerceOrders.id, order.id));
    await tx.update(commerceFulfillments).set({ status: "CANCELLED", notes: input.reason.trim() }).where(eq(commerceFulfillments.orderId, order.id));
    if (attempt[0] && attempt[0].status !== "PAID") await tx.update(commercePaymentAttempts).set({ status: "CANCELED" }).where(eq(commercePaymentAttempts.id, attempt[0].id));
    await tx.insert(commerceAuditEvents).values({ id: `audit_${nanoid(14)}`, storeId: order.storeId, actorUserId: input.userId, actorType: "MERCHANT", action: "order.cancelled", entityType: "order", entityId: order.id, data: { reason: input.reason.trim(), stockRestored: true } });
  });
  return { orderId: order.id, status: "CANCELLED" as const };
}

export async function updateMerchantShipmentStatus(input: { userId: number; shipmentId: string; status: "IN_TRANSIT" | "OUT_FOR_DELIVERY" | "DELIVERED" | "FAILED" | "RETURNED" | "CANCELLED"; cashRemittedCents?: number; note?: string }) {
  const db = await requireDb();
  const [shipment] = await db.select().from(commerceShipments).where(eq(commerceShipments.id, input.shipmentId)).limit(1);
  if (!shipment) throw new Error("Shipment not found.");
  const [fulfillment] = await db.select().from(commerceFulfillments).where(eq(commerceFulfillments.id, shipment.fulfillmentId)).limit(1);
  if (!fulfillment) throw new Error("Shipment fulfilment not found.");
  await assertStoreMembership(input.userId, fulfillment.storeId, ["OWNER", "MANAGER"]);
  if (input.cashRemittedCents !== undefined && input.cashRemittedCents > shipment.cashDueCents) throw new Error("Cash remittance cannot exceed the amount due.");
  const cashSettlementStatus = input.cashRemittedCents && input.cashRemittedCents >= shipment.cashDueCents && shipment.cashDueCents > 0
    ? "REMITTED_TO_MERCHANT"
    : input.status === "DELIVERED" && shipment.cashDueCents > 0
      ? "COLLECTED_BY_CARRIER"
      : input.status === "FAILED"
        ? "FAILED_DELIVERY"
        : input.status === "RETURNED"
          ? "RETURNED_TO_SENDER"
          : fulfillment.cashSettlementStatus;
  await db.transaction(async tx => {
    await tx.update(commerceShipments).set({ status: input.status, cashRemittedCents: input.cashRemittedCents ?? shipment.cashRemittedCents, deliveredAt: input.status === "DELIVERED" ? new Date() : shipment.deliveredAt }).where(eq(commerceShipments.id, shipment.id));
    await tx.update(commerceFulfillments).set({ cashSettlementStatus, status: input.status === "RETURNED" ? "RETURNED" : fulfillment.status, notes: input.note?.trim() || fulfillment.notes }).where(eq(commerceFulfillments.id, fulfillment.id));
    await tx.insert(commerceShipmentEvents).values({ id: `shev_${nanoid(14)}`, shipmentId: shipment.id, status: input.status, occurredAt: new Date(), details: { cashRemittedCents: input.cashRemittedCents ?? null, note: input.note ?? null } });
    await tx.insert(commerceAuditEvents).values({ id: `audit_${nanoid(14)}`, storeId: fulfillment.storeId, actorUserId: input.userId, actorType: "MERCHANT", action: "shipment.status.updated", entityType: "shipment", entityId: shipment.id, data: { status: input.status, cashSettlementStatus } });
  });
  return { shipmentId: shipment.id, status: input.status, cashSettlementStatus };
}

export async function resolveMerchantRefund(input: { userId: number; refundId: string; decision: "SUCCEEDED" | "FAILED" | "CANCELED"; externalRefundId?: string }) {
  const db = await requireDb();
  const [refund] = await db.select().from(commerceRefunds).where(eq(commerceRefunds.id, input.refundId)).limit(1);
  if (!refund) throw new Error("Refund not found.");
  await assertStoreMembership(input.userId, refund.storeId, ["OWNER", "MANAGER"]);
  await db.transaction(async tx => {
    await tx.update(commerceRefunds).set({ status: input.decision, externalRefundId: input.externalRefundId?.trim() || null, completedAt: input.decision === "SUCCEEDED" ? new Date() : null }).where(eq(commerceRefunds.id, refund.id));
    await tx.insert(commerceAuditEvents).values({ id: `audit_${nanoid(14)}`, storeId: refund.storeId, actorUserId: input.userId, actorType: "MERCHANT", action: `refund.${input.decision.toLowerCase()}`, entityType: "refund", entityId: refund.id, data: { externalRefundId: input.externalRefundId ?? null } });
  });
  return { refundId: refund.id, status: input.decision };
}

export async function processChargilyWebhook(rawBody: Buffer, signature: string | undefined, secret: string) {
  if (!verifyChargilySignature(rawBody, signature, secret)) throw new Error("Chargily webhook signature verification failed.");
  const event = normalizeChargilyWebhook(rawBody);
  const db = await requireDb();
  const [attempt] = await db.select().from(commercePaymentAttempts).where(and(eq(commercePaymentAttempts.provider, "CHARGILY_PAY"), eq(commercePaymentAttempts.externalCheckoutId, event.externalCheckoutId))).limit(1);
  if (!attempt) throw new Error("Chargily payment attempt was not found.");
  const [duplicate] = await db.select({ id: commercePaymentEvents.id }).from(commercePaymentEvents).where(and(eq(commercePaymentEvents.storeId, attempt.storeId), eq(commercePaymentEvents.provider, "CHARGILY_PAY"), eq(commercePaymentEvents.externalEventId, event.externalEventId))).limit(1);
  if (duplicate) return { duplicate: true, paymentAttemptId: attempt.id };
  if (event.amountCents !== undefined && event.amountCents !== attempt.amountCents) throw new Error("Chargily webhook amount does not match the payment attempt.");
  if (event.currency && event.currency !== attempt.currency) throw new Error("Chargily webhook currency does not match the payment attempt.");
  const paymentStatus = event.status === "PAID" ? "PAID" : event.status === "FAILED" ? "FAILED" : event.status === "CANCELED" ? "CANCELED" : "PENDING";
  await db.transaction(async tx => {
    await tx.insert(commercePaymentEvents).values({ id: `paye_${nanoid(14)}`, storeId: attempt.storeId, paymentAttemptId: attempt.id, provider: "CHARGILY_PAY", externalEventId: event.externalEventId, type: event.type, signatureStatus: "VERIFIED", processingStatus: event.status === "IGNORED" ? "IGNORED" : "PROCESSED", payload: event.payload, payloadDigest: payloadDigest(rawBody), processedAt: new Date() });
    if (event.status !== "IGNORED") {
      await tx.update(commercePaymentAttempts).set({ status: paymentStatus, externalPaymentId: event.externalCheckoutId, paidAt: event.status === "PAID" ? new Date() : null }).where(eq(commercePaymentAttempts.id, attempt.id));
      if (event.status === "PAID") await tx.update(commerceOrders).set({ paymentStatus: "PAID", status: "CONFIRMED" }).where(eq(commerceOrders.id, attempt.orderId));
      if (event.status === "FAILED" || event.status === "CANCELED") await tx.update(commerceOrders).set({ paymentStatus }).where(eq(commerceOrders.id, attempt.orderId));
    }
    await tx.insert(commerceAuditEvents).values({ id: `audit_${nanoid(14)}`, storeId: attempt.storeId, actorType: "PROVIDER", action: `payment.${event.type}`, entityType: "payment-attempt", entityId: attempt.id, data: { externalEventId: event.externalEventId, status: event.status } });
  });
  return { duplicate: false, paymentAttemptId: attempt.id, status: paymentStatus };
}

export async function linkChargilyCheckout(input: { paymentAttemptId: string; externalCheckoutId: string; checkoutUrl: string }) {
  const db = await requireDb();
  await db.update(commercePaymentAttempts).set({ externalCheckoutId: input.externalCheckoutId, checkoutUrl: input.checkoutUrl, status: "PENDING" }).where(and(eq(commercePaymentAttempts.id, input.paymentAttemptId), eq(commercePaymentAttempts.provider, "CHARGILY_PAY")));
}
