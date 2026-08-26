import { z } from "zod";
import { paymentProviderKeys } from "./paymentCapabilities";

export const commerceProductStatusSchema = z.enum(["DRAFT", "PUBLISHED", "ARCHIVED"]);
export const commerceOrderStatusSchema = z.enum(["PENDING_PAYMENT", "CONFIRMED", "FULFILLED", "CANCELLED"]);
export const promotionTypeSchema = z.enum(["PERCENT", "FIXED"]);

export const commerceProductInputSchema = z.object({
  handle: z.string().min(3).max(128).regex(/^[a-z0-9-]+$/),
  title: z.string().min(2).max(255),
  subtitle: z.string().min(2).max(255),
  description: z.string().min(8).max(4000),
  category: z.string().min(2).max(64),
  status: commerceProductStatusSchema,
});

export const commerceVariantInputSchema = z.object({
  sku: z.string().min(3).max(128).regex(/^[A-Z0-9-]+$/),
  title: z.string().min(2).max(255),
  priceCents: z.number().int().min(0).max(10_000_000),
  inventoryQty: z.number().int().min(0).max(1_000_000),
});

export const adminCreateProductInputSchema = commerceProductInputSchema.extend({
  variant: commerceVariantInputSchema,
});

export const adminProductStatusInputSchema = z.object({
  productId: z.string().min(3).max(64),
  status: commerceProductStatusSchema,
});

export const adminInventoryInputSchema = z.object({
  variantId: z.string().min(3).max(64),
  inventoryQty: z.number().int().min(0).max(1_000_000),
});

export const addCartLineInputSchema = z.object({
  cartId: z.string().min(8).max(64),
  variantId: z.string().min(3).max(64),
  quantity: z.number().int().min(1).max(20),
});

export const cartQuantityInputSchema = z.object({
  cartId: z.string().min(8).max(64),
  lineId: z.string().min(3).max(64),
  quantity: z.number().int().min(0).max(20),
});

export const promotionInputSchema = z.object({
  cartId: z.string().min(8).max(64),
  code: z.string().trim().min(2).max(64),
});

export const checkoutInputSchema = z.object({
  cartId: z.string().min(8).max(64),
  email: z.string().email().max(320),
  shippingMethod: z.enum(["STANDARD", "EXPRESS"]),
});

export const paymentProviderKeySchema = z.enum(paymentProviderKeys);

export const customerAddressInputSchema = z.object({
  firstName: z.string().trim().min(1).max(128),
  lastName: z.string().trim().min(1).max(128),
  line1: z.string().trim().min(3).max(255),
  line2: z.string().trim().max(255).optional(),
  city: z.string().trim().min(2).max(128),
  region: z.string().trim().max(128).optional(),
  postalCode: z.string().trim().max(32).optional(),
  countryCode: z.string().trim().length(2).default("DZ"),
  phone: z.string().trim().min(6).max(64),
});

export const storefrontCheckoutInputSchema = z.object({
  cartId: z.string().min(8).max(64),
  email: z.string().email().max(320),
  paymentProvider: paymentProviderKeySchema,
  deliveryRateId: z.string().min(3).max(64),
  shippingAddress: customerAddressInputSchema,
  locale: z.enum(["en", "fr", "ar"]).default("ar"),
  bankTransferReference: z.string().trim().min(3).max(128).optional(),
});

export const merchantCommercialSettingsInputSchema = z.object({
  storeId: z.string().min(3).max(64),
  legalName: z.string().trim().min(2).max(255).optional(),
  businessEmail: z.string().email().max(320).optional(),
  businessPhone: z.string().trim().min(6).max(64).optional(),
  countryCode: z.string().trim().length(2).default("DZ"),
  taxRegistrationNumber: z.string().trim().max(128).optional(),
  taxEnabled: z.boolean(),
  checkoutRequiresAccount: z.boolean(),
});

export const merchantDataPolicyInputSchema = z.object({
  storeId: z.string().min(3).max(64),
  customerDataRetentionDays: z.number().int().min(1).max(36_500).optional(),
  orderRecordRetentionDays: z.number().int().min(1).max(36_500).optional(),
  auditRecordRetentionDays: z.number().int().min(1).max(36_500).optional(),
  policyReference: z.string().trim().min(3).max(255).optional(),
  recoveryProcedureReference: z.string().trim().min(3).max(255).optional(),
  lastRecoveryTestedAt: z.string().datetime().optional(),
  legalReviewAcknowledged: z.boolean(),
  notes: z.string().trim().max(1000).optional(),
});

export const merchantPaymentProviderInputSchema = z.object({
  storeId: z.string().min(3).max(64),
  provider: paymentProviderKeySchema,
  status: z.enum(["DISABLED", "TEST", "ACTIVE", "ERROR"]),
  displayName: z.string().trim().min(2).max(128),
  configuration: z.record(z.string(), z.unknown()),
});

export const merchantDeliveryRateInputSchema = z.object({
  storeId: z.string().min(3).max(64),
  zoneName: z.string().trim().min(2).max(128),
  region: z.string().trim().max(128).optional(),
  rateName: z.string().trim().min(2).max(128),
  amountCents: z.number().int().min(0).max(10_000_000),
  codAvailable: z.boolean(),
  estimatedMinDays: z.number().int().min(0).max(60).optional(),
  estimatedMaxDays: z.number().int().min(0).max(60).optional(),
});

export const merchantTaxRateInputSchema = z.object({
  storeId: z.string().min(3).max(64),
  name: z.string().trim().min(2).max(128),
  rateBasisPoints: z.number().int().min(0).max(10000),
  appliesToShipping: z.boolean(),
  active: z.boolean(),
});

export const merchantPaymentReviewInputSchema = z.object({
  orderId: z.string().min(3).max(64),
  decision: z.enum(["APPROVE", "REJECT"]),
  note: z.string().trim().max(1000).optional(),
});

export const merchantShipmentInputSchema = z.object({
  orderId: z.string().min(3).max(64),
  carrier: z.string().trim().min(2).max(128),
  trackingNumber: z.string().trim().min(2).max(191).optional(),
  trackingUrl: z.string().url().max(1024).optional(),
  note: z.string().trim().max(1000).optional(),
});

export const merchantReturnDecisionInputSchema = z.object({
  returnId: z.string().min(3).max(64),
  decision: z.enum(["APPROVE", "REJECT", "RECEIVE", "CLOSE"]),
  merchantNote: z.string().trim().max(1000).optional(),
});

export const merchantRefundInputSchema = z.object({
  orderId: z.string().min(3).max(64),
  amountCents: z.number().int().min(1).max(10_000_000),
  reason: z.string().trim().min(2).max(128),
  returnId: z.string().min(3).max(64).optional(),
});

export const customerReturnRequestInputSchema = z.object({
  orderId: z.string().min(3).max(64),
  reason: z.string().trim().min(2).max(128),
  customerNote: z.string().trim().max(1000).optional(),
});

export const customerMarketingPreferenceInputSchema = z.object({
  enabled: z.boolean(),
});

export const customerSavedAddressInputSchema = z.object({
  addressId: z.string().min(3).max(64).optional(),
  type: z.enum(["SHIPPING", "BILLING", "BOTH"]).default("BOTH"),
  label: z.string().trim().max(128).optional(),
  firstName: z.string().trim().min(1).max(128),
  lastName: z.string().trim().min(1).max(128),
  line1: z.string().trim().min(2).max(255),
  line2: z.string().trim().max(255).optional(),
  city: z.string().trim().min(2).max(128),
  region: z.string().trim().max(128).optional(),
  postalCode: z.string().trim().max(32).optional(),
  countryCode: z.string().trim().length(2).default("DZ"),
  phone: z.string().trim().max(64).optional(),
  isDefault: z.boolean().default(false),
});

export const customerAddressDeleteInputSchema = z.object({
  addressId: z.string().min(3).max(64),
});
export const customerPrivacyErasureInputSchema = z.object({
  note: z.string().trim().max(1000).optional(),
});
export const adminPrivacyRequestResolutionInputSchema = z.object({
  requestId: z.string().min(3).max(64),
  status: z.enum(["UNDER_REVIEW", "COMPLETED", "REJECTED"]),
  resolution: z.string().trim().max(1000).optional(),
});

export const merchantOrderCancellationInputSchema = z.object({
  orderId: z.string().min(3).max(64),
  reason: z.string().trim().min(2).max(1000),
});

export const merchantShipmentStatusInputSchema = z.object({
  shipmentId: z.string().min(3).max(64),
  status: z.enum(["IN_TRANSIT", "OUT_FOR_DELIVERY", "DELIVERED", "FAILED", "RETURNED", "CANCELLED"]),
  cashRemittedCents: z.number().int().min(0).max(10_000_000).optional(),
  note: z.string().trim().max(1000).optional(),
});

export const merchantRefundResolutionInputSchema = z.object({
  refundId: z.string().min(3).max(64),
  decision: z.enum(["SUCCEEDED", "FAILED", "CANCELED"]),
  externalRefundId: z.string().trim().min(2).max(191).optional(),
});

export const merchantBootstrapInputSchema = z.object({
  workspaceName: z.string().trim().min(2).max(255),
  storeName: z.string().trim().min(2).max(255),
  handle: z.string().trim().min(3).max(128).regex(/^[a-z0-9-]+$/),
});

export const themePresetSchema = z.enum(["EDITORIAL", "STUDIO", "MONO"]);

export const merchantThemeInputSchema = z.object({
  storeId: z.string().min(3).max(64),
  preset: themePresetSchema,
  name: z.string().trim().min(2).max(255).optional(),
});
export const merchantSeoInputSchema = z.object({
  storeId: z.string().min(3).max(64),
  seoTitle: z.string().trim().min(2).max(70).optional(),
  seoDescription: z.string().trim().min(8).max(160).optional(),
  canonicalOrigin: z.string().trim().url().max(255).optional(),
});

export const merchantSectionInputSchema = z.object({
  storeId: z.string().min(3).max(64),
  sectionId: z.string().min(3).max(64),
  visible: z.boolean().optional(),
  settings: z.record(z.string(), z.unknown()).optional(),
});

export const merchantExtensionInputSchema = z.object({
  storeId: z.string().min(3).max(64),
  extensionId: z.string().min(3).max(64),
  status: z.enum(["DISABLED", "ENABLED"]),
});

export const merchantPublishInputSchema = z.object({
  storeId: z.string().min(3).max(64),
});

export const merchantDashboardViewSchema = z.enum(["OVERVIEW", "CATALOG", "ORDERS", "MARKETING", "STUDIO", "EXTENSIONS"]);

export const merchantDashboardPreferenceInputSchema = z.object({
  storeId: z.string().min(3).max(64),
  dashboardView: merchantDashboardViewSchema,
});

export const merchantHandoffInputSchema = z.object({
  storeId: z.string().min(3).max(64),
  label: z.string().trim().min(2).max(255),
});

export const merchantHandoffStatusInputSchema = z.object({
  storeId: z.string().min(3).max(64),
  handoffId: z.string().min(3).max(64),
  status: z.enum(["DRAFT", "SHARED", "APPROVED"]),
});

export const productMediaKindSchema = z.enum(["GALLERY", "HOVER"]);

const merchantMediaScopeSchema = z.object({
  productId: z.string().min(3).max(64),
  variantId: z.string().min(3).max(64).nullable().optional(),
});

export const merchantProductMediaUploadInputSchema = merchantMediaScopeSchema.extend({
  kind: productMediaKindSchema.default("GALLERY"),
  fileName: z.string().trim().min(1).max(180),
  contentType: z.enum(["image/jpeg", "image/png", "image/webp"]),
  base64Data: z.string().min(24).max(12_000_000),
  altText: z.string().trim().min(2).max(255),
  cropX: z.number().int().min(0).max(100).default(50),
  cropY: z.number().int().min(0).max(100).default(50),
});

export const merchantProductMediaBulkUploadInputSchema = merchantMediaScopeSchema.extend({
  kind: productMediaKindSchema.default("GALLERY"),
  files: z.array(z.object({
    fileName: z.string().trim().min(1).max(180),
    contentType: z.enum(["image/jpeg", "image/png", "image/webp"]),
    base64Data: z.string().min(24).max(12_000_000),
    altText: z.string().trim().min(2).max(255),
  })).min(1).max(5),
  cropX: z.number().int().min(0).max(100).default(50),
  cropY: z.number().int().min(0).max(100).default(50),
});

export const merchantProductMediaUpdateInputSchema = z.object({
  mediaId: z.string().min(3).max(64),
  kind: productMediaKindSchema.optional(),
  altText: z.string().trim().min(2).max(255).optional(),
  sortOrder: z.number().int().min(0).max(100).optional(),
  cropX: z.number().int().min(0).max(100).optional(),
  cropY: z.number().int().min(0).max(100).optional(),
});

export const merchantProductMediaDeleteInputSchema = z.object({
  mediaId: z.string().min(3).max(64),
});

export const merchantVariantUpdateInputSchema = z.object({
  variantId: z.string().min(3).max(64),
  title: z.string().trim().min(2).max(255),
  priceCents: z.number().int().min(0).max(10_000_000),
  inventoryQty: z.number().int().min(0).max(1_000_000),
  lowStockThreshold: z.number().int().min(0).max(1_000_000).default(0),
  barcode: z.string().trim().min(2).max(128).optional(),
  color: z.string().trim().min(1).max(64).optional(),
  options: z.record(z.string().min(1).max(64), z.string().min(1).max(128)).default({}),
});

export const merchantVariantCombinationInputSchema = z.object({
  productId: z.string().min(3).max(64),
  skuPrefix: z.string().trim().min(2).max(64).regex(/^[A-Z0-9-]+$/),
  priceCents: z.number().int().min(0).max(10_000_000),
  inventoryQty: z.number().int().min(0).max(1_000_000),
  lowStockThreshold: z.number().int().min(0).max(1_000_000).default(0),
  options: z.record(z.string().trim().min(1).max(64), z.array(z.string().trim().min(1).max(128)).min(1).max(12)).refine(value => Object.keys(value).length >= 1 && Object.keys(value).length <= 3, "Provide between one and three option groups."),
});

export const merchantCatalogCsvImportInputSchema = z.object({
  csvText: z.string().min(32).max(1_000_000),
});
export const merchantSubscriptionInvoiceReferenceInputSchema = z.object({
  invoiceId: z.string().min(3).max(64),
  bankTransferReference: z.string().trim().min(3).max(191),
});
export const adminSubscriptionInvoiceCreateInputSchema = z.object({
  storeId: z.string().min(3).max(64),
  planKey: z.string().trim().min(2).max(64),
  amountCents: z.number().int().min(1).max(100_000_000),
  currency: z.string().trim().length(3).default("DZD"),
  dueAt: z.date().optional(),
  metadata: z.record(z.string(), z.unknown()).default({}),
});
export const adminSubscriptionInvoiceReviewInputSchema = z.object({
  invoiceId: z.string().min(3).max(64),
  decision: z.enum(["PAID", "VOID"]),
});

export type CartLineForPricing = {
  id: string;
  title: string;
  sku: string;
  quantity: number;
  unitPriceCents: number;
};

export type AppliedPromotion = {
  code: string;
  type: z.infer<typeof promotionTypeSchema>;
  value: number;
  minSubtotalCents: number;
} | null;

export const referenceCatalog = [
  {
    id: "prd_arc-lamp",
    handle: "arc-lamp",
    title: "Arc Lamp",
    subtitle: "Directional table light",
    description: "A compact anodized-aluminum lamp with a rotating shade and an integrated touch dimmer.",
    category: "Lighting",
    artKey: "lamp",
    variants: [
      { id: "var_arc-black", sku: "ARC-BLK", title: "Graphite", priceCents: 24500, inventoryQty: 18 },
      { id: "var_arc-silver", sku: "ARC-SLV", title: "Brushed silver", priceCents: 24500, inventoryQty: 12 },
    ],
  },
  {
    id: "prd_grid-speaker",
    handle: "grid-speaker",
    title: "Grid Speaker",
    subtitle: "Desktop audio object",
    description: "A compact wireless speaker built around a precision-perforated grille and a tuned low-frequency chamber.",
    category: "Audio",
    artKey: "speaker",
    variants: [
      { id: "var_grid-ink", sku: "GRID-INK", title: "Ink", priceCents: 18000, inventoryQty: 24 },
      { id: "var_grid-sand", sku: "GRID-SND", title: "Sand", priceCents: 18000, inventoryQty: 10 },
    ],
  },
  {
    id: "prd_field-pack",
    handle: "field-pack",
    title: "Field Pack",
    subtitle: "Modular everyday carry",
    description: "A weatherproof carry system with a removable organizer panel and flexible attachment loops.",
    category: "Carry",
    artKey: "pack",
    variants: [
      { id: "var_field-olive", sku: "FIELD-OLV", title: "Olive", priceCents: 13500, inventoryQty: 34 },
      { id: "var_field-stone", sku: "FIELD-STN", title: "Stone", priceCents: 13500, inventoryQty: 16 },
    ],
  },
  {
    id: "prd_form-vessel",
    handle: "form-vessel",
    title: "Form Vessel",
    subtitle: "Cast glass object",
    description: "A substantial cast-glass vessel with a subtly asymmetric profile and soft smoked finish.",
    category: "Objects",
    artKey: "vessel",
    variants: [
      { id: "var_form-clear", sku: "FORM-CLR", title: "Clear smoke", priceCents: 9500, inventoryQty: 21 },
    ],
  },
] as const;
