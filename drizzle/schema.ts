import { boolean, index, int, json, mysqlEnum, mysqlTable, text, timestamp, uniqueIndex, varchar } from "drizzle-orm/mysql-core";
import type { PriceTrace, ProductBlueprintDefinition, SelectionMap } from "../shared/forge";

export const users = mysqlTable("users", {
  id: int("id").autoincrement().primaryKey(),
  openId: varchar("openId", { length: 64 }).notNull().unique(),
  name: text("name"),
  email: varchar("email", { length: 320 }),
  loginMethod: varchar("loginMethod", { length: 64 }),
  role: mysqlEnum("role", ["user", "admin"]).default("user").notNull(),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
  lastSignedIn: timestamp("lastSignedIn").defaultNow().notNull(),
});

export const commerceWorkspaces = mysqlTable("commerceWorkspaces", {
  id: varchar("id", { length: 64 }).primaryKey(),
  name: varchar("name", { length: 255 }).notNull(),
  slug: varchar("slug", { length: 128 }).notNull(),
  ownerId: int("ownerId").notNull().references(() => users.id, { onDelete: "cascade" }),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
}, table => [uniqueIndex("commerceWorkspaceSlugUnique").on(table.slug), index("commerceWorkspaceOwnerIdx").on(table.ownerId)]);

export const commerceStores = mysqlTable("commerceStores", {
  id: varchar("id", { length: 64 }).primaryKey(),
  workspaceId: varchar("workspaceId", { length: 64 }).notNull().references(() => commerceWorkspaces.id, { onDelete: "cascade" }),
  name: varchar("name", { length: 255 }).notNull(),
  handle: varchar("handle", { length: 128 }).notNull(),
  status: mysqlEnum("status", ["DRAFT", "ACTIVE", "PAUSED"]).default("DRAFT").notNull(),
  defaultLocale: varchar("defaultLocale", { length: 8 }).default("en").notNull(),
  currency: varchar("currency", { length: 3 }).default("USD").notNull(),
  seoTitle: varchar("seoTitle", { length: 70 }),
  seoDescription: varchar("seoDescription", { length: 160 }),
  canonicalOrigin: varchar("canonicalOrigin", { length: 255 }),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
}, table => [uniqueIndex("commerceStoreHandleUnique").on(table.handle), index("commerceStoreWorkspaceIdx").on(table.workspaceId)]);

export const commerceStoreMembers = mysqlTable("commerceStoreMembers", {
  id: varchar("id", { length: 64 }).primaryKey(),
  storeId: varchar("storeId", { length: 64 }).notNull().references(() => commerceStores.id, { onDelete: "cascade" }),
  userId: int("userId").notNull().references(() => users.id, { onDelete: "cascade" }),
  role: mysqlEnum("role", ["OWNER", "MANAGER", "MERCHANDISER", "ANALYST"]).default("MERCHANDISER").notNull(),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
}, table => [uniqueIndex("commerceStoreMemberUnique").on(table.storeId, table.userId), index("commerceStoreMemberUserIdx").on(table.userId)]);

export const commerceThemes = mysqlTable("commerceThemes", {
  id: varchar("id", { length: 64 }).primaryKey(),
  storeId: varchar("storeId", { length: 64 }).notNull().references(() => commerceStores.id, { onDelete: "cascade" }),
  name: varchar("name", { length: 255 }).notNull(),
  preset: varchar("preset", { length: 64 }).notNull(),
  tokens: json("tokens").$type<Record<string, string>>().notNull(),
  isActive: boolean("isActive").default(false).notNull(),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
}, table => [index("commerceThemeStoreIdx").on(table.storeId)]);

export const commercePages = mysqlTable("commercePages", {
  id: varchar("id", { length: 64 }).primaryKey(),
  storeId: varchar("storeId", { length: 64 }).notNull().references(() => commerceStores.id, { onDelete: "cascade" }),
  handle: varchar("handle", { length: 128 }).notNull(),
  title: varchar("title", { length: 255 }).notNull(),
  status: mysqlEnum("status", ["DRAFT", "PUBLISHED"]).default("DRAFT").notNull(),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
}, table => [uniqueIndex("commercePageStoreHandleUnique").on(table.storeId, table.handle), index("commercePageStoreIdx").on(table.storeId)]);

export const commercePageSections = mysqlTable("commercePageSections", {
  id: varchar("id", { length: 64 }).primaryKey(),
  pageId: varchar("pageId", { length: 64 }).notNull().references(() => commercePages.id, { onDelete: "cascade" }),
  type: varchar("type", { length: 64 }).notNull(),
  sortOrder: int("sortOrder").notNull(),
  visible: boolean("visible").default(true).notNull(),
  settings: json("settings").$type<Record<string, unknown>>().notNull(),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
}, table => [uniqueIndex("commerceSectionPageSortUnique").on(table.pageId, table.sortOrder), index("commerceSectionPageIdx").on(table.pageId)]);

export const commerceExtensions = mysqlTable("commerceExtensions", {
  id: varchar("id", { length: 64 }).primaryKey(),
  storeId: varchar("storeId", { length: 64 }).notNull().references(() => commerceStores.id, { onDelete: "cascade" }),
  key: varchar("key", { length: 128 }).notNull(),
  name: varchar("name", { length: 255 }).notNull(),
  status: mysqlEnum("status", ["DISABLED", "ENABLED"]).default("DISABLED").notNull(),
  configuration: json("configuration").$type<Record<string, unknown>>().notNull(),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
}, table => [uniqueIndex("commerceExtensionStoreKeyUnique").on(table.storeId, table.key), index("commerceExtensionStoreIdx").on(table.storeId)]);

export const commerceStorePreferences = mysqlTable("commerceStorePreferences", {
  storeId: varchar("storeId", { length: 64 }).primaryKey().references(() => commerceStores.id, { onDelete: "cascade" }),
  dashboardView: mysqlEnum("dashboardView", ["OVERVIEW", "CATALOG", "ORDERS", "MARKETING", "STUDIO", "EXTENSIONS"]).default("OVERVIEW").notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
});

export const commerceStoreHandoffs = mysqlTable("commerceStoreHandoffs", {
  id: varchar("id", { length: 64 }).primaryKey(),
  storeId: varchar("storeId", { length: 64 }).notNull().references(() => commerceStores.id, { onDelete: "cascade" }),
  createdBy: int("createdBy").notNull().references(() => users.id, { onDelete: "cascade" }),
  token: varchar("token", { length: 64 }).notNull(),
  label: varchar("label", { length: 255 }).notNull(),
  status: mysqlEnum("status", ["DRAFT", "SHARED", "APPROVED"]).default("DRAFT").notNull(),
  expiresAt: timestamp("expiresAt"),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
}, table => [uniqueIndex("commerceHandoffTokenUnique").on(table.token), index("commerceHandoffStoreCreatedIdx").on(table.storeId, table.createdAt)]);

export const productBlueprints = mysqlTable("productBlueprints", {
  id: varchar("id", { length: 64 }).primaryKey(),
  slug: varchar("slug", { length: 128 }).notNull(),
  name: varchar("name", { length: 255 }).notNull(),
  summary: text("summary").notNull(),
  schemaVersion: int("schemaVersion").notNull(),
  definition: json("definition").$type<ProductBlueprintDefinition>().notNull(),
  status: mysqlEnum("status", ["DRAFT", "PUBLISHED", "ARCHIVED"]).default("DRAFT").notNull(),
  ownerId: int("ownerId").notNull().references(() => users.id, { onDelete: "cascade" }),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
}, table => [uniqueIndex("blueprintSlugUnique").on(table.slug), index("blueprintOwnerIdx").on(table.ownerId)]);

export const configurationVersions = mysqlTable("configurationVersions", {
  id: varchar("id", { length: 64 }).primaryKey(),
  blueprintId: varchar("blueprintId", { length: 64 }).notNull().references(() => productBlueprints.id, { onDelete: "restrict" }),
  ownerId: int("ownerId").notNull().references(() => users.id, { onDelete: "cascade" }),
  status: mysqlEnum("status", ["DRAFT", "QUOTED", "ACCEPTED", "PRODUCTION_RELEASED", "CANCELLED"]).default("DRAFT").notNull(),
  selections: json("selections").$type<SelectionMap>().notNull(),
  validationResult: json("validationResult").$type<{ isValid: boolean; issues: unknown[] }>().notNull(),
  priceTrace: json("priceTrace").$type<PriceTrace>().notNull(),
  fingerprint: varchar("fingerprint", { length: 128 }).notNull(),
  totalCents: int("totalCents").notNull(),
  depositCents: int("depositCents").notNull(),
  leadTimeDays: int("leadTimeDays").notNull(),
  rulesVersion: varchar("rulesVersion", { length: 128 }).notNull(),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
}, table => [index("configurationOwnerCreatedIdx").on(table.ownerId, table.createdAt), index("configurationBlueprintIdx").on(table.blueprintId)]);

export const quotes = mysqlTable("quotes", {
  id: varchar("id", { length: 64 }).primaryKey(),
  configurationId: varchar("configurationId", { length: 64 }).notNull().references(() => configurationVersions.id, { onDelete: "restrict" }),
  ownerId: int("ownerId").notNull().references(() => users.id, { onDelete: "cascade" }),
  reference: varchar("reference", { length: 64 }).notNull(),
  status: mysqlEnum("status", ["DRAFT", "SENT", "ACCEPTED", "EXPIRED", "DECLINED"]).default("DRAFT").notNull(),
  totalCents: int("totalCents").notNull(),
  depositCents: int("depositCents").notNull(),
  validUntil: timestamp("validUntil").notNull(),
  acceptedAt: timestamp("acceptedAt"),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
}, table => [uniqueIndex("quoteReferenceUnique").on(table.reference), index("quoteOwnerCreatedIdx").on(table.ownerId, table.createdAt)]);

export const productionPassports = mysqlTable("productionPassports", {
  id: varchar("id", { length: 64 }).primaryKey(),
  configurationId: varchar("configurationId", { length: 64 }).notNull().references(() => configurationVersions.id, { onDelete: "restrict" }),
  quoteId: varchar("quoteId", { length: 64 }).notNull().references(() => quotes.id, { onDelete: "restrict" }),
  ownerId: int("ownerId").notNull().references(() => users.id, { onDelete: "cascade" }),
  passportNumber: varchar("passportNumber", { length: 64 }).notNull(),
  status: mysqlEnum("status", ["QUEUED", "RELEASED", "IN_PROGRESS", "COMPLETE", "EXCEPTION"]).default("QUEUED").notNull(),
  specification: json("specification").$type<Record<string, unknown>>().notNull(),
  idempotencyKey: varchar("idempotencyKey", { length: 191 }).notNull(),
  releasedAt: timestamp("releasedAt"),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
}, table => [uniqueIndex("passportConfigurationUnique").on(table.configurationId), uniqueIndex("passportNumberUnique").on(table.passportNumber), uniqueIndex("passportIdempotencyUnique").on(table.idempotencyKey), index("passportOwnerCreatedIdx").on(table.ownerId, table.createdAt)]);

export const integrationOutbox = mysqlTable("integrationOutbox", {
  id: varchar("id", { length: 64 }).primaryKey(),
  aggregateType: varchar("aggregateType", { length: 64 }).notNull(),
  aggregateId: varchar("aggregateId", { length: 64 }).notNull(),
  eventType: varchar("eventType", { length: 128 }).notNull(),
  payload: json("payload").$type<Record<string, unknown>>().notNull(),
  idempotencyKey: varchar("idempotencyKey", { length: 191 }).notNull(),
  status: mysqlEnum("status", ["PENDING", "DELIVERED", "FAILED"]).default("PENDING").notNull(),
  attemptCount: int("attemptCount").default(0).notNull(),
  deliveredAt: timestamp("deliveredAt"),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
}, table => [uniqueIndex("outboxIdempotencyUnique").on(table.idempotencyKey), index("outboxStatusCreatedIdx").on(table.status, table.createdAt)]);

export const commerceProducts = mysqlTable("commerceProducts", {
  id: varchar("id", { length: 64 }).primaryKey(),
  handle: varchar("handle", { length: 128 }).notNull(),
  title: varchar("title", { length: 255 }).notNull(),
  subtitle: varchar("subtitle", { length: 255 }).notNull(),
  description: text("description").notNull(),
  category: varchar("category", { length: 64 }).notNull(),
  status: mysqlEnum("status", ["DRAFT", "PUBLISHED", "ARCHIVED"]).default("DRAFT").notNull(),
  ownerId: int("ownerId").notNull().references(() => users.id, { onDelete: "cascade" }),
  storeId: varchar("storeId", { length: 64 }).notNull().references(() => commerceStores.id, { onDelete: "cascade" }),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
}, table => [uniqueIndex("commerceStoreProductHandleUnique").on(table.storeId, table.handle), index("commerceProductStoreStatusCategoryIdx").on(table.storeId, table.status, table.category), index("commerceProductOwnerIdx").on(table.ownerId)]);

export const commerceVariants = mysqlTable("commerceVariants", {
  id: varchar("id", { length: 64 }).primaryKey(),
  productId: varchar("productId", { length: 64 }).notNull().references(() => commerceProducts.id, { onDelete: "cascade" }),
  sku: varchar("sku", { length: 128 }).notNull(),
  barcode: varchar("barcode", { length: 128 }),
  title: varchar("title", { length: 255 }).notNull(),
  priceCents: int("priceCents").notNull(),
  compareAtCents: int("compareAtCents"),
  inventoryQty: int("inventoryQty").default(0).notNull(),
  lowStockThreshold: int("lowStockThreshold").default(0).notNull(),
  options: json("options").$type<Record<string, string>>().notNull(),
  isDefault: boolean("isDefault").default(false).notNull(),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
}, table => [uniqueIndex("commerceVariantSkuUnique").on(table.sku), index("commerceVariantProductIdx").on(table.productId)]);

export const commerceInventoryMovements = mysqlTable("commerceInventoryMovements", {
  id: varchar("id", { length: 64 }).primaryKey(),
  storeId: varchar("storeId", { length: 64 }).notNull().references(() => commerceStores.id, { onDelete: "cascade" }),
  variantId: varchar("variantId", { length: 64 }).notNull().references(() => commerceVariants.id, { onDelete: "cascade" }),
  delta: int("delta").notNull(),
  reason: mysqlEnum("reason", ["MANUAL_ADJUSTMENT", "ORDER_RESERVATION", "ORDER_CANCELLATION", "RETURN_RESTOCK", "IMPORT"]).notNull(),
  referenceType: varchar("referenceType", { length: 64 }),
  referenceId: varchar("referenceId", { length: 64 }),
  actorUserId: int("actorUserId").references(() => users.id, { onDelete: "set null" }),
  note: text("note"),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
}, table => [index("commerceInventoryMovementStoreVariantCreatedIdx").on(table.storeId, table.variantId, table.createdAt)]);

export const commerceProductMedia = mysqlTable("commerceProductMedia", {
  id: varchar("id", { length: 64 }).primaryKey(),
  productId: varchar("productId", { length: 64 }).notNull().references(() => commerceProducts.id, { onDelete: "cascade" }),
  variantId: varchar("variantId", { length: 64 }).references(() => commerceVariants.id, { onDelete: "cascade" }),
  kind: mysqlEnum("kind", ["GALLERY", "HOVER"]).default("GALLERY").notNull(),
  storageKey: varchar("storageKey", { length: 512 }).notNull(),
  url: varchar("url", { length: 1024 }).notNull(),
  sourceContentType: varchar("sourceContentType", { length: 128 }),
  originalBytes: int("originalBytes"),
  optimizedBytes: int("optimizedBytes"),
  altText: varchar("altText", { length: 255 }).notNull(),
  sortOrder: int("sortOrder").default(0).notNull(),
  cropX: int("cropX").default(50).notNull(),
  cropY: int("cropY").default(50).notNull(),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
}, table => [index("commerceProductMediaProductIdx").on(table.productId, table.sortOrder), index("commerceProductMediaVariantIdx").on(table.variantId)]);

export const commerceCarts = mysqlTable("commerceCarts", {
  id: varchar("id", { length: 64 }).primaryKey(),
  sessionKey: varchar("sessionKey", { length: 128 }).notNull(),
  storeId: varchar("storeId", { length: 64 }).notNull().references(() => commerceStores.id, { onDelete: "cascade" }),
  status: mysqlEnum("status", ["OPEN", "CONVERTED", "ABANDONED"]).default("OPEN").notNull(),
  promotionCode: varchar("promotionCode", { length: 64 }),
  currency: varchar("currency", { length: 3 }).default("USD").notNull(),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
}, table => [uniqueIndex("commerceStoreCartSessionKeyUnique").on(table.storeId, table.sessionKey), index("commerceStoreCartStatusUpdatedIdx").on(table.storeId, table.status, table.updatedAt)]);

export const commerceCartLines = mysqlTable("commerceCartLines", {
  id: varchar("id", { length: 64 }).primaryKey(),
  cartId: varchar("cartId", { length: 64 }).notNull().references(() => commerceCarts.id, { onDelete: "cascade" }),
  variantId: varchar("variantId", { length: 64 }).notNull().references(() => commerceVariants.id, { onDelete: "restrict" }),
  quantity: int("quantity").notNull(),
  unitPriceCents: int("unitPriceCents").notNull(),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
}, table => [uniqueIndex("commerceCartVariantUnique").on(table.cartId, table.variantId), index("commerceCartLineCartIdx").on(table.cartId)]);

export const commercePromotions = mysqlTable("commercePromotions", {
  id: varchar("id", { length: 64 }).primaryKey(),
  code: varchar("code", { length: 64 }).notNull(),
  storeId: varchar("storeId", { length: 64 }).notNull().references(() => commerceStores.id, { onDelete: "cascade" }),
  type: mysqlEnum("type", ["PERCENT", "FIXED"]).notNull(),
  value: int("value").notNull(),
  minSubtotalCents: int("minSubtotalCents").default(0).notNull(),
  active: boolean("active").default(true).notNull(),
  startsAt: timestamp("startsAt"),
  endsAt: timestamp("endsAt"),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
}, table => [uniqueIndex("commerceStorePromotionCodeUnique").on(table.storeId, table.code), index("commerceStorePromotionActiveIdx").on(table.storeId, table.active)]);

export const commerceOrders = mysqlTable("commerceOrders", {
  id: varchar("id", { length: 64 }).primaryKey(),
  orderNumber: varchar("orderNumber", { length: 64 }).notNull(),
  customerId: int("customerId").references(() => users.id, { onDelete: "restrict" }),
  customerProfileId: varchar("customerProfileId", { length: 64 }).references(() => commerceCustomers.id, { onDelete: "set null" }),
  storeId: varchar("storeId", { length: 64 }).notNull().references(() => commerceStores.id, { onDelete: "restrict" }),
  email: varchar("email", { length: 320 }).notNull(),
  status: mysqlEnum("status", ["PENDING_PAYMENT", "CONFIRMED", "FULFILLED", "CANCELLED"]).default("PENDING_PAYMENT").notNull(),
  paymentStatus: mysqlEnum("paymentStatus", ["PENDING", "AWAITING_REVIEW", "PAID", "FAILED", "CANCELED", "REFUNDED", "PARTIALLY_REFUNDED"]).default("PENDING").notNull(),
  fulfillmentStatus: mysqlEnum("fulfillmentStatus", ["UNFULFILLED", "PARTIALLY_FULFILLED", "FULFILLED", "CANCELLED", "RETURNED"]).default("UNFULFILLED").notNull(),
  paymentMethod: varchar("paymentMethod", { length: 64 }),
  currency: varchar("currency", { length: 3 }).default("USD").notNull(),
  subtotalCents: int("subtotalCents").notNull(),
  discountCents: int("discountCents").default(0).notNull(),
  taxCents: int("taxCents").default(0).notNull(),
  shippingCents: int("shippingCents").default(0).notNull(),
  totalCents: int("totalCents").notNull(),
  promotionCode: varchar("promotionCode", { length: 64 }),
  shippingMethod: varchar("shippingMethod", { length: 32 }).notNull(),
  shippingAddressSnapshot: json("shippingAddressSnapshot").$type<Record<string, string>>(),
  billingAddressSnapshot: json("billingAddressSnapshot").$type<Record<string, string>>(),
  taxLines: json("taxLines").$type<Array<{ name: string; rateBasisPoints: number; amountCents: number }>>().notNull(),
  placedAt: timestamp("placedAt"),
  cancelledAt: timestamp("cancelledAt"),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
}, table => [uniqueIndex("commerceOrderNumberUnique").on(table.orderNumber), index("commerceOrderStoreCustomerIdx").on(table.storeId, table.customerId, table.createdAt), index("commerceOrderStoreProfileIdx").on(table.storeId, table.customerProfileId, table.createdAt), index("commerceOrderStoreStatusIdx").on(table.storeId, table.status, table.createdAt)]);

export const commerceOrderLines = mysqlTable("commerceOrderLines", {
  id: varchar("id", { length: 64 }).primaryKey(),
  orderId: varchar("orderId", { length: 64 }).notNull().references(() => commerceOrders.id, { onDelete: "cascade" }),
  variantId: varchar("variantId", { length: 64 }).notNull().references(() => commerceVariants.id, { onDelete: "restrict" }),
  title: varchar("title", { length: 255 }).notNull(),
  sku: varchar("sku", { length: 128 }).notNull(),
  quantity: int("quantity").notNull(),
  unitPriceCents: int("unitPriceCents").notNull(),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
}, table => [index("commerceOrderLineOrderIdx").on(table.orderId)]);

export const commerceStoreCommercialSettings = mysqlTable("commerceStoreCommercialSettings", {
  storeId: varchar("storeId", { length: 64 }).primaryKey().references(() => commerceStores.id, { onDelete: "cascade" }),
  legalName: varchar("legalName", { length: 255 }),
  businessEmail: varchar("businessEmail", { length: 320 }),
  businessPhone: varchar("businessPhone", { length: 64 }),
  countryCode: varchar("countryCode", { length: 2 }).default("DZ").notNull(),
  taxRegistrationNumber: varchar("taxRegistrationNumber", { length: 128 }),
  taxEnabled: boolean("taxEnabled").default(false).notNull(),
  checkoutRequiresAccount: boolean("checkoutRequiresAccount").default(false).notNull(),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
});

export const commerceStorePlans = mysqlTable("commerceStorePlans", {
  storeId: varchar("storeId", { length: 64 }).primaryKey().references(() => commerceStores.id, { onDelete: "cascade" }),
  planKey: varchar("planKey", { length: 64 }).default("STARTER").notNull(),
  status: mysqlEnum("status", ["TRIAL", "ACTIVE", "PAST_DUE", "PAUSED", "CANCELLED"]).default("TRIAL").notNull(),
  billingProvider: varchar("billingProvider", { length: 64 }),
  externalSubscriptionId: varchar("externalSubscriptionId", { length: 191 }),
  entitlementSnapshot: json("entitlementSnapshot").$type<Record<string, boolean | number>>().notNull(),
  currentPeriodEndsAt: timestamp("currentPeriodEndsAt"),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
}, table => [index("commerceStorePlanProviderIdx").on(table.billingProvider, table.externalSubscriptionId)]);

export const commerceSubscriptionInvoices = mysqlTable("commerceSubscriptionInvoices", {
  id: varchar("id", { length: 64 }).primaryKey(),
  storeId: varchar("storeId", { length: 64 }).notNull().references(() => commerceStores.id, { onDelete: "cascade" }),
  planKey: varchar("planKey", { length: 64 }).notNull(),
  status: mysqlEnum("status", ["PENDING_PAYMENT", "AWAITING_REVIEW", "PAID", "VOID"]).default("PENDING_PAYMENT").notNull(),
  amountCents: int("amountCents").notNull(),
  currency: varchar("currency", { length: 3 }).default("DZD").notNull(),
  bankTransferReference: varchar("bankTransferReference", { length: 191 }),
  dueAt: timestamp("dueAt"),
  paidAt: timestamp("paidAt"),
  metadata: json("metadata").$type<Record<string, unknown>>().notNull(),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
}, table => [index("commerceSubscriptionInvoiceStoreStatusIdx").on(table.storeId, table.status), index("commerceSubscriptionInvoiceDueIdx").on(table.dueAt)]);

export const commercePaymentProviders = mysqlTable("commercePaymentProviders", {
  id: varchar("id", { length: 64 }).primaryKey(),
  storeId: varchar("storeId", { length: 64 }).notNull().references(() => commerceStores.id, { onDelete: "cascade" }),
  provider: mysqlEnum("provider", ["CASH_ON_DELIVERY", "BANK_TRANSFER", "CHARGILY_PAY", "MANUAL"]).notNull(),
  status: mysqlEnum("status", ["DISABLED", "TEST", "ACTIVE", "ERROR"]).default("DISABLED").notNull(),
  displayName: varchar("displayName", { length: 128 }).notNull(),
  configuration: json("configuration").$type<Record<string, unknown>>().notNull(),
  credentialReference: varchar("credentialReference", { length: 128 }),
  webhookSecretReference: varchar("webhookSecretReference", { length: 128 }),
  lastCheckedAt: timestamp("lastCheckedAt"),
  lastError: text("lastError"),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
}, table => [uniqueIndex("commercePaymentProviderStoreTypeUnique").on(table.storeId, table.provider), index("commercePaymentProviderStoreStatusIdx").on(table.storeId, table.status)]);

export const commerceCustomers = mysqlTable("commerceCustomers", {
  id: varchar("id", { length: 64 }).primaryKey(),
  storeId: varchar("storeId", { length: 64 }).notNull().references(() => commerceStores.id, { onDelete: "cascade" }),
  userId: int("userId").references(() => users.id, { onDelete: "set null" }),
  email: varchar("email", { length: 320 }).notNull(),
  phone: varchar("phone", { length: 64 }),
  firstName: varchar("firstName", { length: 128 }),
  lastName: varchar("lastName", { length: 128 }),
  status: mysqlEnum("status", ["GUEST", "REGISTERED", "BLOCKED"]).default("GUEST").notNull(),
  preferredLocale: varchar("preferredLocale", { length: 8 }).default("ar").notNull(),
  emailVerifiedAt: timestamp("emailVerifiedAt"),
  marketingConsentAt: timestamp("marketingConsentAt"),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
}, table => [uniqueIndex("commerceCustomerStoreEmailUnique").on(table.storeId, table.email), index("commerceCustomerStoreUserIdx").on(table.storeId, table.userId)]);

export const commerceCustomerAddresses = mysqlTable("commerceCustomerAddresses", {
  id: varchar("id", { length: 64 }).primaryKey(),
  customerId: varchar("customerId", { length: 64 }).notNull().references(() => commerceCustomers.id, { onDelete: "cascade" }),
  type: mysqlEnum("type", ["SHIPPING", "BILLING", "BOTH"]).default("BOTH").notNull(),
  label: varchar("label", { length: 128 }),
  firstName: varchar("firstName", { length: 128 }).notNull(),
  lastName: varchar("lastName", { length: 128 }).notNull(),
  company: varchar("company", { length: 255 }),
  line1: varchar("line1", { length: 255 }).notNull(),
  line2: varchar("line2", { length: 255 }),
  city: varchar("city", { length: 128 }).notNull(),
  region: varchar("region", { length: 128 }),
  postalCode: varchar("postalCode", { length: 32 }),
  countryCode: varchar("countryCode", { length: 2 }).default("DZ").notNull(),
  phone: varchar("phone", { length: 64 }),
  isDefault: boolean("isDefault").default(false).notNull(),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
}, table => [index("commerceCustomerAddressCustomerIdx").on(table.customerId, table.isDefault)]);

export const commerceCustomerAuthTokens = mysqlTable("commerceCustomerAuthTokens", {
  id: varchar("id", { length: 64 }).primaryKey(),
  customerId: varchar("customerId", { length: 64 }).notNull().references(() => commerceCustomers.id, { onDelete: "cascade" }),
  type: mysqlEnum("type", ["SIGN_IN", "VERIFY_EMAIL", "PASSWORD_RESET"]).notNull(),
  tokenHash: varchar("tokenHash", { length: 128 }).notNull(),
  expiresAt: timestamp("expiresAt").notNull(),
  consumedAt: timestamp("consumedAt"),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
}, table => [uniqueIndex("commerceCustomerAuthTokenHashUnique").on(table.tokenHash), index("commerceCustomerAuthCustomerTypeIdx").on(table.customerId, table.type, table.expiresAt)]);
export const commercePrivacyRequests = mysqlTable("commercePrivacyRequests", {
  id: varchar("id", { length: 64 }).primaryKey(),
  userId: int("userId").notNull().references(() => users.id, { onDelete: "cascade" }),
  type: mysqlEnum("type", ["EXPORT", "ERASURE"]).notNull(),
  status: mysqlEnum("status", ["REQUESTED", "UNDER_REVIEW", "COMPLETED", "REJECTED"]).default("REQUESTED").notNull(),
  note: varchar("note", { length: 1000 }),
  resolution: varchar("resolution", { length: 1000 }),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
}, table => [index("commercePrivacyRequestUserStatusIdx").on(table.userId, table.status, table.createdAt)]);
export const commerceStoreDataPolicies = mysqlTable("commerceStoreDataPolicies", {
  storeId: varchar("storeId", { length: 64 }).primaryKey().references(() => commerceStores.id, { onDelete: "cascade" }),
  customerDataRetentionDays: int("customerDataRetentionDays"),
  orderRecordRetentionDays: int("orderRecordRetentionDays"),
  auditRecordRetentionDays: int("auditRecordRetentionDays"),
  policyReference: varchar("policyReference", { length: 255 }),
  recoveryProcedureReference: varchar("recoveryProcedureReference", { length: 255 }),
  lastRecoveryTestedAt: timestamp("lastRecoveryTestedAt"),
  legalReviewAcknowledged: boolean("legalReviewAcknowledged").default(false).notNull(),
  notes: varchar("notes", { length: 1000 }),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
});
export const commerceDeliveryZones = mysqlTable("commerceDeliveryZones", {
  id: varchar("id", { length: 64 }).primaryKey(),
  storeId: varchar("storeId", { length: 64 }).notNull().references(() => commerceStores.id, { onDelete: "cascade" }),
  name: varchar("name", { length: 128 }).notNull(),
  countryCode: varchar("countryCode", { length: 2 }).default("DZ").notNull(),
  regions: json("regions").$type<string[]>().notNull(),
  enabled: boolean("enabled").default(true).notNull(),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
}, table => [uniqueIndex("commerceDeliveryZoneStoreNameUnique").on(table.storeId, table.name), index("commerceDeliveryZoneStoreEnabledIdx").on(table.storeId, table.enabled)]);

export const commerceDeliveryRates = mysqlTable("commerceDeliveryRates", {
  id: varchar("id", { length: 64 }).primaryKey(),
  zoneId: varchar("zoneId", { length: 64 }).notNull().references(() => commerceDeliveryZones.id, { onDelete: "cascade" }),
  name: varchar("name", { length: 128 }).notNull(),
  methodCode: varchar("methodCode", { length: 64 }).notNull(),
  amountCents: int("amountCents").notNull(),
  minSubtotalCents: int("minSubtotalCents").default(0).notNull(),
  maxSubtotalCents: int("maxSubtotalCents"),
  codAvailable: boolean("codAvailable").default(true).notNull(),
  estimatedMinDays: int("estimatedMinDays"),
  estimatedMaxDays: int("estimatedMaxDays"),
  active: boolean("active").default(true).notNull(),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
}, table => [uniqueIndex("commerceDeliveryRateZoneMethodUnique").on(table.zoneId, table.methodCode), index("commerceDeliveryRateZoneActiveIdx").on(table.zoneId, table.active)]);

export const commerceTaxRates = mysqlTable("commerceTaxRates", {
  id: varchar("id", { length: 64 }).primaryKey(),
  storeId: varchar("storeId", { length: 64 }).notNull().references(() => commerceStores.id, { onDelete: "cascade" }),
  name: varchar("name", { length: 128 }).notNull(),
  countryCode: varchar("countryCode", { length: 2 }).default("DZ").notNull(),
  regions: json("regions").$type<string[]>().notNull(),
  rateBasisPoints: int("rateBasisPoints").notNull(),
  appliesToShipping: boolean("appliesToShipping").default(false).notNull(),
  active: boolean("active").default(true).notNull(),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
}, table => [index("commerceTaxRateStoreActiveIdx").on(table.storeId, table.active), uniqueIndex("commerceTaxRateStoreNameUnique").on(table.storeId, table.name)]);

export const commercePaymentAttempts = mysqlTable("commercePaymentAttempts", {
  id: varchar("id", { length: 64 }).primaryKey(),
  orderId: varchar("orderId", { length: 64 }).notNull().references(() => commerceOrders.id, { onDelete: "restrict" }),
  storeId: varchar("storeId", { length: 64 }).notNull().references(() => commerceStores.id, { onDelete: "restrict" }),
  provider: mysqlEnum("provider", ["CASH_ON_DELIVERY", "BANK_TRANSFER", "CHARGILY_PAY", "MANUAL"]).notNull(),
  method: varchar("method", { length: 64 }).notNull(),
  status: mysqlEnum("status", ["PENDING", "PROCESSING", "PAID", "FAILED", "CANCELED", "AWAITING_REVIEW", "EXPIRED", "REFUNDED", "PARTIALLY_REFUNDED"]).default("PENDING").notNull(),
  amountCents: int("amountCents").notNull(),
  currency: varchar("currency", { length: 3 }).notNull(),
  externalCheckoutId: varchar("externalCheckoutId", { length: 191 }),
  externalPaymentId: varchar("externalPaymentId", { length: 191 }),
  checkoutUrl: varchar("checkoutUrl", { length: 1024 }),
  idempotencyKey: varchar("idempotencyKey", { length: 191 }).notNull(),
  metadata: json("metadata").$type<Record<string, unknown>>().notNull(),
  paidAt: timestamp("paidAt"),
  expiresAt: timestamp("expiresAt"),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
}, table => [uniqueIndex("commercePaymentAttemptIdempotencyUnique").on(table.idempotencyKey), uniqueIndex("commercePaymentAttemptProviderExternalUnique").on(table.provider, table.externalCheckoutId), index("commercePaymentAttemptOrderIdx").on(table.orderId, table.createdAt), index("commercePaymentAttemptStoreStatusIdx").on(table.storeId, table.status, table.createdAt)]);

export const commercePaymentEvents = mysqlTable("commercePaymentEvents", {
  id: varchar("id", { length: 64 }).primaryKey(),
  storeId: varchar("storeId", { length: 64 }).notNull().references(() => commerceStores.id, { onDelete: "restrict" }),
  paymentAttemptId: varchar("paymentAttemptId", { length: 64 }).references(() => commercePaymentAttempts.id, { onDelete: "set null" }),
  provider: mysqlEnum("provider", ["CASH_ON_DELIVERY", "BANK_TRANSFER", "CHARGILY_PAY", "MANUAL"]).notNull(),
  externalEventId: varchar("externalEventId", { length: 191 }).notNull(),
  type: varchar("type", { length: 128 }).notNull(),
  signatureStatus: mysqlEnum("signatureStatus", ["VERIFIED", "REJECTED", "NOT_APPLICABLE"]).default("NOT_APPLICABLE").notNull(),
  processingStatus: mysqlEnum("processingStatus", ["RECEIVED", "PROCESSED", "IGNORED", "FAILED"]).default("RECEIVED").notNull(),
  payload: json("payload").$type<Record<string, unknown>>().notNull(),
  payloadDigest: varchar("payloadDigest", { length: 128 }).notNull(),
  errorMessage: text("errorMessage"),
  processedAt: timestamp("processedAt"),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
}, table => [uniqueIndex("commercePaymentEventStoreProviderExternalUnique").on(table.storeId, table.provider, table.externalEventId), index("commercePaymentEventAttemptIdx").on(table.paymentAttemptId, table.createdAt), index("commercePaymentEventStoreStatusIdx").on(table.storeId, table.processingStatus, table.createdAt)]);

export const commerceFulfillments = mysqlTable("commerceFulfillments", {
  id: varchar("id", { length: 64 }).primaryKey(),
  orderId: varchar("orderId", { length: 64 }).notNull().references(() => commerceOrders.id, { onDelete: "restrict" }),
  storeId: varchar("storeId", { length: 64 }).notNull().references(() => commerceStores.id, { onDelete: "restrict" }),
  status: mysqlEnum("status", ["UNFULFILLED", "PARTIALLY_FULFILLED", "FULFILLED", "CANCELLED", "RETURNED"]).default("UNFULFILLED").notNull(),
  cashSettlementStatus: mysqlEnum("cashSettlementStatus", ["NOT_APPLICABLE", "EXPECTED", "COLLECTED_BY_CARRIER", "REMITTED_TO_MERCHANT", "FAILED_DELIVERY", "RETURNED_TO_SENDER", "DISPUTED"]).default("NOT_APPLICABLE").notNull(),
  notes: text("notes"),
  fulfilledAt: timestamp("fulfilledAt"),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
}, table => [index("commerceFulfillmentStoreStatusIdx").on(table.storeId, table.status, table.createdAt), index("commerceFulfillmentOrderIdx").on(table.orderId)]);

export const commerceShipments = mysqlTable("commerceShipments", {
  id: varchar("id", { length: 64 }).primaryKey(),
  fulfillmentId: varchar("fulfillmentId", { length: 64 }).notNull().references(() => commerceFulfillments.id, { onDelete: "cascade" }),
  provider: varchar("provider", { length: 64 }).default("MANUAL").notNull(),
  externalShipmentId: varchar("externalShipmentId", { length: 191 }),
  carrier: varchar("carrier", { length: 128 }),
  serviceName: varchar("serviceName", { length: 128 }),
  trackingNumber: varchar("trackingNumber", { length: 191 }),
  trackingUrl: varchar("trackingUrl", { length: 1024 }),
  labelStorageKey: varchar("labelStorageKey", { length: 512 }),
  status: mysqlEnum("status", ["PENDING", "LABEL_CREATED", "IN_TRANSIT", "OUT_FOR_DELIVERY", "DELIVERED", "FAILED", "RETURNED", "CANCELLED"]).default("PENDING").notNull(),
  cashDueCents: int("cashDueCents").default(0).notNull(),
  cashRemittedCents: int("cashRemittedCents").default(0).notNull(),
  shippedAt: timestamp("shippedAt"),
  deliveredAt: timestamp("deliveredAt"),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
}, table => [uniqueIndex("commerceShipmentProviderExternalUnique").on(table.provider, table.externalShipmentId), index("commerceShipmentFulfillmentIdx").on(table.fulfillmentId), index("commerceShipmentTrackingIdx").on(table.trackingNumber)]);

export const commerceShipmentEvents = mysqlTable("commerceShipmentEvents", {
  id: varchar("id", { length: 64 }).primaryKey(),
  shipmentId: varchar("shipmentId", { length: 64 }).notNull().references(() => commerceShipments.id, { onDelete: "cascade" }),
  externalEventId: varchar("externalEventId", { length: 191 }),
  status: varchar("status", { length: 64 }).notNull(),
  occurredAt: timestamp("occurredAt").notNull(),
  details: json("details").$type<Record<string, unknown>>().notNull(),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
}, table => [uniqueIndex("commerceShipmentEventShipmentExternalUnique").on(table.shipmentId, table.externalEventId), index("commerceShipmentEventShipmentOccurredIdx").on(table.shipmentId, table.occurredAt)]);

export const commerceReturns = mysqlTable("commerceReturns", {
  id: varchar("id", { length: 64 }).primaryKey(),
  orderId: varchar("orderId", { length: 64 }).notNull().references(() => commerceOrders.id, { onDelete: "restrict" }),
  storeId: varchar("storeId", { length: 64 }).notNull().references(() => commerceStores.id, { onDelete: "restrict" }),
  status: mysqlEnum("status", ["REQUESTED", "APPROVED", "REJECTED", "RECEIVED", "CLOSED", "CANCELLED"]).default("REQUESTED").notNull(),
  reason: varchar("reason", { length: 128 }).notNull(),
  customerNote: text("customerNote"),
  merchantNote: text("merchantNote"),
  requestedAt: timestamp("requestedAt").defaultNow().notNull(),
  resolvedAt: timestamp("resolvedAt"),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
}, table => [index("commerceReturnStoreStatusIdx").on(table.storeId, table.status, table.createdAt), index("commerceReturnOrderIdx").on(table.orderId)]);

export const commerceRefunds = mysqlTable("commerceRefunds", {
  id: varchar("id", { length: 64 }).primaryKey(),
  orderId: varchar("orderId", { length: 64 }).notNull().references(() => commerceOrders.id, { onDelete: "restrict" }),
  storeId: varchar("storeId", { length: 64 }).notNull().references(() => commerceStores.id, { onDelete: "restrict" }),
  paymentAttemptId: varchar("paymentAttemptId", { length: 64 }).references(() => commercePaymentAttempts.id, { onDelete: "set null" }),
  returnId: varchar("returnId", { length: 64 }).references(() => commerceReturns.id, { onDelete: "set null" }),
  status: mysqlEnum("status", ["PENDING", "SUCCEEDED", "FAILED", "CANCELED", "MANUAL_REVIEW"]).default("PENDING").notNull(),
  amountCents: int("amountCents").notNull(),
  currency: varchar("currency", { length: 3 }).notNull(),
  reason: varchar("reason", { length: 128 }).notNull(),
  externalRefundId: varchar("externalRefundId", { length: 191 }),
  initiatedByUserId: int("initiatedByUserId").references(() => users.id, { onDelete: "set null" }),
  completedAt: timestamp("completedAt"),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
}, table => [uniqueIndex("commerceRefundProviderExternalUnique").on(table.externalRefundId), index("commerceRefundOrderIdx").on(table.orderId, table.createdAt), index("commerceRefundStoreStatusIdx").on(table.storeId, table.status, table.createdAt)]);

export const commerceAuditEvents = mysqlTable("commerceAuditEvents", {
  id: varchar("id", { length: 64 }).primaryKey(),
  storeId: varchar("storeId", { length: 64 }).notNull().references(() => commerceStores.id, { onDelete: "cascade" }),
  actorUserId: int("actorUserId").references(() => users.id, { onDelete: "set null" }),
  actorType: mysqlEnum("actorType", ["MERCHANT", "CUSTOMER", "SYSTEM", "PROVIDER"]).notNull(),
  action: varchar("action", { length: 128 }).notNull(),
  entityType: varchar("entityType", { length: 64 }).notNull(),
  entityId: varchar("entityId", { length: 64 }).notNull(),
  data: json("data").$type<Record<string, unknown>>().notNull(),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
}, table => [index("commerceAuditStoreEntityIdx").on(table.storeId, table.entityType, table.entityId, table.createdAt), index("commerceAuditActorIdx").on(table.actorUserId, table.createdAt)]);

export const commerceNotifications = mysqlTable("commerceNotifications", {
  id: varchar("id", { length: 64 }).primaryKey(),
  storeId: varchar("storeId", { length: 64 }).notNull().references(() => commerceStores.id, { onDelete: "cascade" }),
  customerId: varchar("customerId", { length: 64 }).references(() => commerceCustomers.id, { onDelete: "set null" }),
  orderId: varchar("orderId", { length: 64 }).references(() => commerceOrders.id, { onDelete: "set null" }),
  channel: mysqlEnum("channel", ["EMAIL", "SMS"]).notNull(),
  type: varchar("type", { length: 128 }).notNull(),
  recipient: varchar("recipient", { length: 320 }).notNull(),
  status: mysqlEnum("status", ["QUEUED", "SENT", "DELIVERED", "FAILED", "SUPPRESSED"]).default("QUEUED").notNull(),
  providerMessageId: varchar("providerMessageId", { length: 191 }),
  locale: varchar("locale", { length: 8 }).default("ar").notNull(),
  payload: json("payload").$type<Record<string, unknown>>().notNull(),
  sentAt: timestamp("sentAt"),
  deliveredAt: timestamp("deliveredAt"),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
}, table => [index("commerceNotificationStoreStatusIdx").on(table.storeId, table.status, table.createdAt), index("commerceNotificationCustomerIdx").on(table.customerId, table.createdAt), index("commerceNotificationProviderMessageIdx").on(table.providerMessageId)]);

export type User = typeof users.$inferSelect;
export type InsertUser = typeof users.$inferInsert;
