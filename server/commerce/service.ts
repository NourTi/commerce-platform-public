import { and, desc, eq, inArray, or } from "drizzle-orm";
import { nanoid } from "nanoid";
import sharp from "sharp";
import {
  commerceCartLines,
  commerceCarts,
  commerceCustomerAddresses,
  commerceCustomers,
  commercePrivacyRequests,
  commerceInventoryMovements,
  commerceOrderLines,
  commerceOrders,
  commerceProductMedia,
  commerceProducts,
  commercePromotions,
  commerceStoreMembers,
  commerceStores,
  commerceStorePlans,
  commerceVariants,
  users,
} from "../../drizzle/schema";
import type { AppliedPromotion, CartLineForPricing } from "@shared/commerce";
import { referenceCatalog } from "@shared/commerce";
import { getDb } from "../db";
import { storagePut } from "../storage";
import { parseCatalogCsv } from "./catalogCsv";
import { buildVariantCombinations } from "./variantCombinations";
import { assertPromotionCanApply, assertInventoryAvailability, calculateCommerceTotals, isPromotionAvailable, preparePendingOrder, resolveCartLineQuantity } from "./domain";

async function requireDb() {
  const db = await getDb();
  if (!db) throw new Error("Forge Commerce database is unavailable.");
  return db;
}

async function resolvePrimaryStoreId(userId?: number) {
  const db = await requireDb();
  if (userId) {
    const membership = await db
      .select({ storeId: commerceStoreMembers.storeId })
      .from(commerceStoreMembers)
      .where(eq(commerceStoreMembers.userId, userId))
      .limit(1);
    if (membership[0]) return membership[0].storeId;
  }
  const store = await db.select({ id: commerceStores.id }).from(commerceStores).where(eq(commerceStores.status, "ACTIVE")).limit(1);
  if (!store[0]) throw new Error("No active merchant store is available.");
  return store[0].id;
}

export async function assertStoreMembership(userId: number, storeId: string, roles?: Array<"OWNER" | "MANAGER" | "MERCHANDISER" | "ANALYST">) {
  const db = await requireDb();
  const rows = await db.select().from(commerceStoreMembers).where(and(eq(commerceStoreMembers.userId, userId), eq(commerceStoreMembers.storeId, storeId))).limit(1);
  const member = rows[0];
  if (!member || (roles && !roles.includes(member.role))) throw new Error("You do not have the required access to this store.");
  return member;
}

function orderNumber() {
  return `FC-${new Date().getUTCFullYear()}-${nanoid(7).toUpperCase()}`;
}

async function catalogRows(storeId?: string) {
  const db = await requireDb();
  const resolvedStoreId = storeId ?? await resolvePrimaryStoreId();
  const [products, variants, media] = await Promise.all([
    db.select().from(commerceProducts).where(and(eq(commerceProducts.storeId, resolvedStoreId), eq(commerceProducts.status, "PUBLISHED"))).orderBy(desc(commerceProducts.createdAt)),
    db.select().from(commerceVariants).orderBy(commerceVariants.createdAt),
    db.select().from(commerceProductMedia).orderBy(commerceProductMedia.sortOrder, commerceProductMedia.createdAt),
  ]);
  return products.map(product => ({
    ...product,
    media: media.filter(item => item.productId === product.id && !item.variantId),
    variants: variants.filter(variant => variant.productId === product.id).map(variant => ({ ...variant, media: media.filter(item => item.variantId === variant.id) })),
  }));
}

export async function listStoreProducts(category?: string, storeId?: string) {
  const products = await catalogRows(storeId);
  return category && category !== "All" ? products.filter(product => product.category === category) : products;
}

export async function getStoreProduct(handle: string, storeId?: string) {
  const products = await catalogRows(storeId);
  return products.find(product => product.handle === handle) ?? null;
}

export async function initializeCommerceDemoCatalog(ownerId: number) {
  const db = await requireDb();
  const storeId = await resolvePrimaryStoreId(ownerId);
  const existing = await db.select({ id: commerceProducts.id }).from(commerceProducts).where(eq(commerceProducts.storeId, storeId)).limit(1);
  if (existing.length > 0) return { initialized: false, reason: "Catalog already contains products." };

  await db.transaction(async tx => {
    for (const product of referenceCatalog) {
      await tx.insert(commerceProducts).values({
        id: product.id,
        handle: product.handle,
        title: product.title,
        subtitle: product.subtitle,
        description: product.description,
        category: product.category,
        status: "PUBLISHED",
        ownerId,
        storeId,
      });
      for (let index = 0; index < product.variants.length; index += 1) {
        const variant = product.variants[index];
        if (!variant) continue;
        await tx.insert(commerceVariants).values({
          id: variant.id,
          productId: product.id,
          sku: variant.sku,
          title: variant.title,
          priceCents: variant.priceCents,
          inventoryQty: variant.inventoryQty,
          options: { finish: variant.title },
          isDefault: index === 0,
        });
      }
    }
    await tx.insert(commercePromotions).values([
      { id: "promo_welcome15", storeId, code: "WELCOME15", type: "PERCENT", value: 15, minSubtotalCents: 10000, active: true },
      { id: "promo_system10", storeId, code: "SYSTEM10", type: "FIXED", value: 1000, minSubtotalCents: 10000, active: true },
    ]);
  });
  return { initialized: true, reason: "Reference catalog and promotions created." };
}

export async function createCommerceProduct(ownerId: number, input: {
  handle: string;
  title: string;
  subtitle: string;
  description: string;
  category: string;
  status: "DRAFT" | "PUBLISHED" | "ARCHIVED";
  variant: { sku: string; title: string; priceCents: number; inventoryQty: number };
}) {
  const db = await requireDb();
  const storeId = await resolvePrimaryStoreId(ownerId);
  const productId = `prd_${nanoid(14)}`;
  const variantId = `var_${nanoid(14)}`;
  await db.transaction(async tx => {
    await tx.insert(commerceProducts).values({
      id: productId,
      handle: input.handle,
      title: input.title,
      subtitle: input.subtitle,
      description: input.description,
      category: input.category,
      status: input.status,
      ownerId,
      storeId,
    });
    await tx.insert(commerceVariants).values({
      id: variantId,
      productId,
      sku: input.variant.sku,
      title: input.variant.title,
      priceCents: input.variant.priceCents,
      inventoryQty: input.variant.inventoryQty,
      options: { default: input.variant.title },
      isDefault: true,
    });
  });
  return { productId, variantId };
}

export async function createMerchantProduct(userId: number, input: {
  handle: string;
  title: string;
  subtitle: string;
  description: string;
  category: string;
  status: "DRAFT" | "PUBLISHED" | "ARCHIVED";
  variant: { sku: string; title: string; priceCents: number; inventoryQty: number };
}) {
  const db = await requireDb();
  const storeId = await resolvePrimaryStoreId(userId);
  await assertStoreMembership(userId, storeId, ["OWNER", "MANAGER", "MERCHANDISER"]);
  const [planRows, existingProducts] = await Promise.all([
    db.select({ entitlementSnapshot: commerceStorePlans.entitlementSnapshot }).from(commerceStorePlans).where(eq(commerceStorePlans.storeId, storeId)).limit(1),
    db.select({ id: commerceProducts.id }).from(commerceProducts).where(eq(commerceProducts.storeId, storeId)),
  ]);
  const plan = planRows[0];
  const maxProducts = plan?.entitlementSnapshot && typeof plan.entitlementSnapshot === "object" && "maxProducts" in plan.entitlementSnapshot && typeof plan.entitlementSnapshot.maxProducts === "number"
    ? plan.entitlementSnapshot.maxProducts
    : null;
  if (maxProducts !== null && existingProducts.length >= maxProducts) throw new Error(`This store has reached its plan limit of ${maxProducts} products.`);
  const productId = `prd_${nanoid(14)}`;
  const variantId = `var_${nanoid(14)}`;
  await db.transaction(async tx => {
    await tx.insert(commerceProducts).values({
      id: productId,
      handle: input.handle,
      title: input.title,
      subtitle: input.subtitle,
      description: input.description,
      category: input.category,
      status: input.status,
      ownerId: userId,
      storeId,
    });
    await tx.insert(commerceVariants).values({
      id: variantId,
      productId,
      sku: input.variant.sku,
      title: input.variant.title,
      priceCents: input.variant.priceCents,
      inventoryQty: input.variant.inventoryQty,
      options: { default: input.variant.title },
      isDefault: true,
    });
  });
  return { productId, variantId };
}

export async function importMerchantCatalogCsv(userId: number, csvText: string) {
  const parsed = parseCatalogCsv(csvText);
  const db = await requireDb();
  const storeId = await resolvePrimaryStoreId(userId);
  await assertStoreMembership(userId, storeId, ["OWNER", "MANAGER", "MERCHANDISER"]);
  const [planRows, existingProducts, allVariants] = await Promise.all([
    db.select({ entitlementSnapshot: commerceStorePlans.entitlementSnapshot }).from(commerceStorePlans).where(eq(commerceStorePlans.storeId, storeId)).limit(1),
    db.select({ handle: commerceProducts.handle }).from(commerceProducts).where(eq(commerceProducts.storeId, storeId)),
    db.select({ sku: commerceVariants.sku }).from(commerceVariants),
  ]);
  const maxProducts = planRows[0]?.entitlementSnapshot && typeof planRows[0].entitlementSnapshot === "object" && "maxProducts" in planRows[0].entitlementSnapshot && typeof planRows[0].entitlementSnapshot.maxProducts === "number" ? planRows[0].entitlementSnapshot.maxProducts : null;
  const handles = new Set(existingProducts.map(item => item.handle));
  const skus = new Set(allVariants.map(item => item.sku));
  const results: Array<{ row: number; success: boolean; productId?: string; error?: string }> = parsed.issues.map(issue => ({ row: issue.row, success: false, error: issue.error }));
  let accepted = 0;
  for (const row of parsed.rows) {
    if (handles.has(row.handle)) { results.push({ row: row.row, success: false, error: `Handle “${row.handle}” already exists in this store.` }); continue; }
    if (skus.has(row.sku)) { results.push({ row: row.row, success: false, error: `SKU “${row.sku}” already exists.` }); continue; }
    if (maxProducts !== null && existingProducts.length + accepted >= maxProducts) { results.push({ row: row.row, success: false, error: `Plan limit of ${maxProducts} products reached.` }); continue; }
    const productId = `prd_${nanoid(14)}`;
    const variantId = `var_${nanoid(14)}`;
    try {
      await db.transaction(async tx => {
        await tx.insert(commerceProducts).values({ id: productId, storeId, ownerId: userId, handle: row.handle, title: row.title, subtitle: row.subtitle, description: row.description, category: row.category, status: row.status });
        await tx.insert(commerceVariants).values({ id: variantId, productId, sku: row.sku, barcode: row.barcode, title: row.variantTitle, priceCents: row.priceCents, inventoryQty: row.inventoryQty, lowStockThreshold: row.lowStockThreshold, options: row.options, isDefault: true });
        if (row.inventoryQty > 0) await tx.insert(commerceInventoryMovements).values({ id: `stock_${nanoid(14)}`, storeId, variantId, delta: row.inventoryQty, reason: "IMPORT", referenceType: "catalog-csv", referenceId: productId, actorUserId: userId, note: `CSV import row ${row.row}` });
      });
      handles.add(row.handle);
      skus.add(row.sku);
      accepted += 1;
      results.push({ row: row.row, success: true, productId });
    } catch (error) {
      results.push({ row: row.row, success: false, error: error instanceof Error ? error.message : "Unable to import this row." });
    }
  }
  return { created: results.filter(item => item.success).length, failed: results.filter(item => !item.success).length, results: results.sort((left, right) => left.row - right.row) };
}

export async function setCommerceProductStatus(productId: string, status: "DRAFT" | "PUBLISHED" | "ARCHIVED") {
  const db = await requireDb();
  const result = await db.update(commerceProducts).set({ status }).where(eq(commerceProducts.id, productId));
  if (!result[0]?.affectedRows) throw new Error("Product not found.");
  return { productId, status };
}

export async function setCommerceVariantInventory(variantId: string, inventoryQty: number) {
  const db = await requireDb();
  const result = await db.update(commerceVariants).set({ inventoryQty }).where(eq(commerceVariants.id, variantId));
  if (!result[0]?.affectedRows) throw new Error("Variant not found.");
  return { variantId, inventoryQty };
}

export async function setMerchantProductStatus(userId: number, productId: string, status: "DRAFT" | "PUBLISHED" | "ARCHIVED") {
  const db = await requireDb();
  const product = await db.select({ storeId: commerceProducts.storeId }).from(commerceProducts).where(eq(commerceProducts.id, productId)).limit(1);
  if (!product[0]) throw new Error("Product not found.");
  await assertStoreMembership(userId, product[0].storeId, ["OWNER", "MANAGER", "MERCHANDISER"]);
  return setCommerceProductStatus(productId, status);
}

export async function setMerchantVariantInventory(userId: number, variantId: string, inventoryQty: number) {
  const db = await requireDb();
  const variant = await db
    .select({ storeId: commerceProducts.storeId })
    .from(commerceVariants)
    .innerJoin(commerceProducts, eq(commerceVariants.productId, commerceProducts.id))
    .where(eq(commerceVariants.id, variantId))
    .limit(1);
  if (!variant[0]) throw new Error("Variant not found.");
  await assertStoreMembership(userId, variant[0].storeId, ["OWNER", "MANAGER", "MERCHANDISER"]);
  return setCommerceVariantInventory(variantId, inventoryQty);
}

function decodeImageData(base64Data: string) {
  const encoded = base64Data.includes(",") ? base64Data.slice(base64Data.indexOf(",") + 1) : base64Data;
  const bytes = Buffer.from(encoded, "base64");
  if (!bytes.length || bytes.length > 8 * 1024 * 1024) throw new Error("Image upload must be between 1 byte and 8 MB.");
  return bytes;
}

function safeMediaName(fileName: string) {
  const stem = fileName.toLowerCase().replace(/\.[a-z0-9]+$/i, "").replace(/[^a-z0-9-]+/g, "-").replace(/(^-|-$)/g, "").slice(0, 96) || "image";
  return `${stem}.webp`;
}

async function optimizeMerchantImage(bytes: Buffer) {
  const optimized = await sharp(bytes, { limitInputPixels: 25_000_000, failOn: "error" })
    .rotate()
    .resize({ width: 2000, withoutEnlargement: true })
    .webp({ quality: 84, effort: 4 })
    .toBuffer();
  if (!optimized.length) throw new Error("Image optimization did not produce output.");
  return optimized;
}

async function mediaWithProduct(mediaId: string) {
  const db = await requireDb();
  const rows = await db.select({ media: commerceProductMedia, product: commerceProducts }).from(commerceProductMedia).innerJoin(commerceProducts, eq(commerceProductMedia.productId, commerceProducts.id)).where(eq(commerceProductMedia.id, mediaId)).limit(1);
  return rows[0] ?? null;
}

export async function uploadMerchantProductMedia(userId: number, input: {
  productId: string;
  variantId?: string | null;
  kind: "GALLERY" | "HOVER";
  fileName: string;
  contentType: "image/jpeg" | "image/png" | "image/webp";
  base64Data: string;
  altText: string;
  cropX: number;
  cropY: number;
}) {
  const db = await requireDb();
  const product = await db.select().from(commerceProducts).where(eq(commerceProducts.id, input.productId)).limit(1);
  if (!product[0]) throw new Error("Product not found.");
  await assertStoreMembership(userId, product[0].storeId, ["OWNER", "MANAGER", "MERCHANDISER"]);
  if (input.variantId) {
    const variant = await db.select({ productId: commerceVariants.productId }).from(commerceVariants).where(eq(commerceVariants.id, input.variantId)).limit(1);
    if (!variant[0] || variant[0].productId !== input.productId) throw new Error("Variant does not belong to this product.");
  }
  const bytes = decodeImageData(input.base64Data);
  const optimized = await optimizeMerchantImage(bytes);
  const stored = await storagePut(`commerce/${product[0].storeId}/products/${input.productId}/${safeMediaName(input.fileName)}`, optimized, "image/webp");
  const latest = await db.select({ sortOrder: commerceProductMedia.sortOrder }).from(commerceProductMedia).where(eq(commerceProductMedia.productId, input.productId)).orderBy(desc(commerceProductMedia.sortOrder)).limit(1);
  const record = {
    id: `media_${nanoid(14)}`,
    productId: input.productId,
    variantId: input.variantId ?? null,
    kind: input.kind,
    storageKey: stored.key,
    url: stored.url,
    sourceContentType: input.contentType,
    originalBytes: bytes.byteLength,
    optimizedBytes: optimized.byteLength,
    altText: input.altText.trim(),
    sortOrder: (latest[0]?.sortOrder ?? -1) + 1,
    cropX: input.cropX,
    cropY: input.cropY,
  } as const;
  await db.insert(commerceProductMedia).values(record);
  return record;
}

export async function bulkUploadMerchantProductMedia(userId: number, input: {
  productId: string;
  variantId?: string | null;
  kind: "GALLERY" | "HOVER";
  files: Array<{ fileName: string; contentType: "image/jpeg" | "image/png" | "image/webp"; base64Data: string; altText: string }>;
  cropX: number;
  cropY: number;
}) {
  const results: Array<{ fileName: string; success: boolean; media?: Awaited<ReturnType<typeof uploadMerchantProductMedia>>; error?: string }> = [];
  for (const file of input.files) {
    try {
      const media = await uploadMerchantProductMedia(userId, { ...input, ...file });
      results.push({ fileName: file.fileName, success: true, media });
    } catch (error) {
      results.push({ fileName: file.fileName, success: false, error: error instanceof Error ? error.message : "Unable to optimize and upload image." });
    }
  }
  return { results, uploaded: results.filter(result => result.success).length, failed: results.filter(result => !result.success).length };
}

export async function updateMerchantProductMedia(userId: number, input: { mediaId: string; kind?: "GALLERY" | "HOVER"; altText?: string; sortOrder?: number; cropX?: number; cropY?: number }) {
  const record = await mediaWithProduct(input.mediaId);
  if (!record) throw new Error("Product image not found.");
  await assertStoreMembership(userId, record.product.storeId, ["OWNER", "MANAGER", "MERCHANDISER"]);
  const db = await requireDb();
  const values = {
    ...(input.kind ? { kind: input.kind } : {}),
    ...(input.altText ? { altText: input.altText.trim() } : {}),
    ...(input.sortOrder === undefined ? {} : { sortOrder: input.sortOrder }),
    ...(input.cropX === undefined ? {} : { cropX: input.cropX }),
    ...(input.cropY === undefined ? {} : { cropY: input.cropY }),
  };
  await db.update(commerceProductMedia).set(values).where(eq(commerceProductMedia.id, input.mediaId));
  return { mediaId: input.mediaId };
}

export async function deleteMerchantProductMedia(userId: number, mediaId: string) {
  const record = await mediaWithProduct(mediaId);
  if (!record) throw new Error("Product image not found.");
  await assertStoreMembership(userId, record.product.storeId, ["OWNER", "MANAGER", "MERCHANDISER"]);
  const db = await requireDb();
  await db.delete(commerceProductMedia).where(eq(commerceProductMedia.id, mediaId));
  return { mediaId };
}

export async function updateMerchantVariant(userId: number, input: { variantId: string; title: string; priceCents: number; inventoryQty: number; lowStockThreshold: number; barcode?: string; color?: string; options: Record<string, string> }) {
  const db = await requireDb();
  const rows = await db.select({ variant: commerceVariants, product: commerceProducts }).from(commerceVariants).innerJoin(commerceProducts, eq(commerceVariants.productId, commerceProducts.id)).where(eq(commerceVariants.id, input.variantId)).limit(1);
  const record = rows[0];
  if (!record) throw new Error("Variant not found.");
  await assertStoreMembership(userId, record.product.storeId, ["OWNER", "MANAGER", "MERCHANDISER"]);
  const options = { ...record.variant.options, ...input.options, ...(input.color?.trim() ? { color: input.color.trim() } : {}) };
  const inventoryDelta = input.inventoryQty - record.variant.inventoryQty;
  await db.transaction(async tx => {
    await tx.update(commerceVariants).set({ title: input.title.trim(), priceCents: input.priceCents, inventoryQty: input.inventoryQty, lowStockThreshold: input.lowStockThreshold, barcode: input.barcode?.trim() || null, options }).where(eq(commerceVariants.id, input.variantId));
    if (inventoryDelta !== 0) await tx.insert(commerceInventoryMovements).values({ id: `stock_${nanoid(14)}`, storeId: record.product.storeId, variantId: input.variantId, delta: inventoryDelta, reason: "MANUAL_ADJUSTMENT", referenceType: "merchant-variant", referenceId: input.variantId, actorUserId: userId, note: "Merchant variant inventory update" });
  });
  return { variantId: input.variantId, title: input.title.trim(), priceCents: input.priceCents, inventoryQty: input.inventoryQty, lowStockThreshold: input.lowStockThreshold, barcode: input.barcode?.trim() || null, options };
}

function optionSignature(options: Record<string, string>) {
  return JSON.stringify(Object.entries(options).sort(([left], [right]) => left.localeCompare(right)));
}

export async function generateMerchantVariantCombinations(userId: number, input: { productId: string; skuPrefix: string; priceCents: number; inventoryQty: number; lowStockThreshold: number; options: Record<string, string[]> }) {
  const db = await requireDb();
  const [product] = await db.select().from(commerceProducts).where(eq(commerceProducts.id, input.productId)).limit(1);
  if (!product) throw new Error("Product not found.");
  await assertStoreMembership(userId, product.storeId, ["OWNER", "MANAGER", "MERCHANDISER"]);
  const combinations = buildVariantCombinations(input.options);
  const [productVariants, allSkus] = await Promise.all([
    db.select().from(commerceVariants).where(eq(commerceVariants.productId, product.id)),
    db.select({ sku: commerceVariants.sku }).from(commerceVariants),
  ]);
  const existingOptions = new Set(productVariants.map(variant => optionSignature(variant.options)));
  const existingSkus = new Set(allSkus.map(item => item.sku));
  const candidates = combinations.filter(combination => !existingOptions.has(optionSignature(combination.options)));
  if (!candidates.length) return { created: 0, skipped: combinations.length, variants: [] as Array<{ id: string; sku: string; title: string }> };
  const records = candidates.map(combination => ({ id: `var_${nanoid(14)}`, sku: `${input.skuPrefix}-${combination.skuSuffix}`, title: combination.title, options: combination.options }));
  const duplicate = records.find(record => existingSkus.has(record.sku)) ?? records.find((record, index) => records.findIndex(candidate => candidate.sku === record.sku) !== index);
  if (duplicate) throw new Error(`Variant SKU “${duplicate.sku}” already exists. Choose a different SKU prefix.`);
  await db.transaction(async tx => {
    await tx.insert(commerceVariants).values(records.map(record => ({ id: record.id, productId: product.id, sku: record.sku, title: record.title, priceCents: input.priceCents, inventoryQty: input.inventoryQty, lowStockThreshold: input.lowStockThreshold, options: record.options, isDefault: false })));
    if (input.inventoryQty > 0) await tx.insert(commerceInventoryMovements).values(records.map(record => ({ id: `stock_${nanoid(14)}`, storeId: product.storeId, variantId: record.id, delta: input.inventoryQty, reason: "MANUAL_ADJUSTMENT" as const, referenceType: "variant-generator", referenceId: product.id, actorUserId: userId, note: "Opening stock from merchant option-combination generator" })));
  });
  return { created: records.length, skipped: combinations.length - records.length, variants: records };
}

export async function createCart(sessionKey: string, storeId?: string) {
  const db = await requireDb();
  const resolvedStoreId = storeId ?? await resolvePrimaryStoreId();
  const current = await db.select().from(commerceCarts).where(and(eq(commerceCarts.storeId, resolvedStoreId), eq(commerceCarts.sessionKey, sessionKey))).limit(1);
  if (current[0] && current[0].status === "OPEN") return current[0];
  const [store] = await db.select({ currency: commerceStores.currency }).from(commerceStores).where(eq(commerceStores.id, resolvedStoreId)).limit(1);
  if (!store) throw new Error("Merchant store not found.");
  const id = `cart_${nanoid(16)}`;
  await db.insert(commerceCarts).values({ id, storeId: resolvedStoreId, sessionKey, currency: store.currency, status: "OPEN" });
  const created = await db.select().from(commerceCarts).where(eq(commerceCarts.id, id)).limit(1);
  return created[0];
}

async function usablePromotion(code: string | null, storeId: string): Promise<AppliedPromotion> {
  if (!code) return null;
  const db = await requireDb();
  const rows = await db.select().from(commercePromotions).where(and(eq(commercePromotions.storeId, storeId), eq(commercePromotions.code, code.toUpperCase()))).limit(1);
  const promotion = rows[0];
  if (!promotion || !isPromotionAvailable(promotion)) return null;
  return { code: promotion.code, type: promotion.type, value: promotion.value, minSubtotalCents: promotion.minSubtotalCents };
}

export async function getCart(cartId: string) {
  const db = await requireDb();
  const cartRows = await db.select().from(commerceCarts).where(eq(commerceCarts.id, cartId)).limit(1);
  const cart = cartRows[0];
  if (!cart) return null;
  const rows = await db
    .select({ line: commerceCartLines, variant: commerceVariants, product: commerceProducts })
    .from(commerceCartLines)
    .innerJoin(commerceVariants, eq(commerceCartLines.variantId, commerceVariants.id))
    .innerJoin(commerceProducts, eq(commerceVariants.productId, commerceProducts.id))
    .where(eq(commerceCartLines.cartId, cartId));

  const lines = rows.map(row => ({
    id: row.line.id,
    variantId: row.variant.id,
    handle: row.product.handle,
    title: row.product.title,
    subtitle: row.product.subtitle,
    variantTitle: row.variant.title,
    sku: row.variant.sku,
    quantity: row.line.quantity,
    unitPriceCents: row.line.unitPriceCents,
    inventoryQty: row.variant.inventoryQty,
  }));
  const promotion = await usablePromotion(cart.promotionCode, cart.storeId);
  const totals = calculateCommerceTotals({ lines, promotion });
  return { ...cart, lines, promotion, totals };
}

export async function addCartLine(input: { cartId: string; variantId: string; quantity: number }) {
  const db = await requireDb();
  const [cartRows, variantRows] = await Promise.all([
    db.select().from(commerceCarts).where(and(eq(commerceCarts.id, input.cartId), eq(commerceCarts.status, "OPEN"))).limit(1),
    db.select().from(commerceVariants).where(eq(commerceVariants.id, input.variantId)).limit(1),
  ]);
  const cart = cartRows[0];
  const variant = variantRows[0];
  if (!cart) throw new Error("Open cart not found.");
  if (!variant) throw new Error("Selected product is unavailable in the requested quantity.");
  const nextQuantity = resolveCartLineQuantity({ title: variant.title, existingQuantity: 0, incomingQuantity: input.quantity, inventoryQty: variant.inventoryQty });

  const lines = await db.select().from(commerceCartLines).where(and(eq(commerceCartLines.cartId, input.cartId), eq(commerceCartLines.variantId, input.variantId))).limit(1);
  const line = lines[0];
  if (line) {
    const nextQuantity = resolveCartLineQuantity({ title: variant.title, existingQuantity: line.quantity, incomingQuantity: input.quantity, inventoryQty: variant.inventoryQty });
    await db.update(commerceCartLines).set({ quantity: nextQuantity, unitPriceCents: variant.priceCents }).where(eq(commerceCartLines.id, line.id));
  } else {
    await db.insert(commerceCartLines).values({ id: `line_${nanoid(16)}`, cartId: input.cartId, variantId: input.variantId, quantity: nextQuantity, unitPriceCents: variant.priceCents });
  }
  return getCart(input.cartId);
}

export async function updateCartLine(input: { cartId: string; lineId: string; quantity: number }) {
  const db = await requireDb();
  const rows = await db
    .select({ line: commerceCartLines, variant: commerceVariants })
    .from(commerceCartLines)
    .innerJoin(commerceVariants, eq(commerceCartLines.variantId, commerceVariants.id))
    .where(and(eq(commerceCartLines.id, input.lineId), eq(commerceCartLines.cartId, input.cartId)))
    .limit(1);
  const row = rows[0];
  if (!row) throw new Error("Cart line not found.");
  if (input.quantity === 0) await db.delete(commerceCartLines).where(eq(commerceCartLines.id, input.lineId));
  else {
    assertInventoryAvailability({ title: row.variant.title, requestedQuantity: input.quantity, inventoryQty: row.variant.inventoryQty });
    await db.update(commerceCartLines).set({ quantity: input.quantity, unitPriceCents: row.variant.priceCents }).where(eq(commerceCartLines.id, input.lineId));
  }
  return getCart(input.cartId);
}

export async function applyPromotion(cartId: string, rawCode: string) {
  const db = await requireDb();
  const cart = await getCart(cartId);
  if (!cart || cart.status !== "OPEN") throw new Error("Open cart not found.");
  const promotion = await usablePromotion(rawCode, cart.storeId);
  if (!promotion) throw new Error("Promotion code is invalid or inactive.");
  assertPromotionCanApply({ promotion, subtotalCents: cart.totals.subtotalCents });
  await db.update(commerceCarts).set({ promotionCode: promotion.code }).where(eq(commerceCarts.id, cartId));
  return getCart(cartId);
}

export async function createOrder(input: { cartId: string; customerId: number; email: string; shippingMethod: "STANDARD" | "EXPRESS" }) {
  const db = await requireDb();
  const cart = await getCart(input.cartId);
  if (!cart || cart.status !== "OPEN") throw new Error("Open cart not found.");
  const shippingCents = input.shippingMethod === "EXPRESS" ? 3000 : 1500;
  const variants = await db.select().from(commerceVariants).where(inArray(commerceVariants.id, cart.lines.map(line => line.variantId)));
  const pendingOrder = preparePendingOrder({
    lines: cart.lines as Array<CartLineForPricing & { variantId: string }>,
    promotion: cart.promotion,
    shippingCents,
    inventory: variants.map(variant => ({ variantId: variant.id, title: variant.title, inventoryQty: variant.inventoryQty })),
  });

  const id = `ord_${nanoid(16)}`;
  const number = orderNumber();
  await db.transaction(async tx => {
    await tx.insert(commerceOrders).values({
      id,
      orderNumber: number,
      customerId: input.customerId,
      storeId: cart.storeId,
      email: input.email,
      status: pendingOrder.status,
      subtotalCents: pendingOrder.totals.subtotalCents,
      discountCents: pendingOrder.totals.discountCents,
      taxLines: [],
      shippingCents: pendingOrder.totals.shippingCents,
      totalCents: pendingOrder.totals.totalCents,
      promotionCode: cart.promotion?.code ?? null,
      shippingMethod: input.shippingMethod,
    });
    await tx.insert(commerceOrderLines).values(cart.lines.map(line => ({
      id: `oli_${nanoid(16)}`,
      orderId: id,
      variantId: line.variantId,
      title: `${line.title} — ${line.variantTitle}`,
      sku: line.sku,
      quantity: line.quantity,
      unitPriceCents: line.unitPriceCents,
    })));
    for (const adjustment of pendingOrder.inventoryAdjustments) {
      await tx.update(commerceVariants).set({ inventoryQty: adjustment.nextInventoryQty }).where(eq(commerceVariants.id, adjustment.variantId));
    }
    await tx.update(commerceCarts).set({ status: "CONVERTED" }).where(eq(commerceCarts.id, input.cartId));
  });
  return { id, orderNumber: number, status: pendingOrder.status, totals: pendingOrder.totals };
}

export async function getCustomerOrders(customerId: number) {
  const db = await requireDb();
  const profiles = await db.select({ id: commerceCustomers.id }).from(commerceCustomers).where(eq(commerceCustomers.userId, customerId));
  const profileIds = profiles.map(profile => profile.id);
  return db.select().from(commerceOrders).where(profileIds.length ? or(eq(commerceOrders.customerId, customerId), inArray(commerceOrders.customerProfileId, profileIds)) : eq(commerceOrders.customerId, customerId)).orderBy(desc(commerceOrders.createdAt));
}

export async function claimCustomerAccount(userId: number) {
  const db = await requireDb();
  const [user] = await db.select({ email: users.email }).from(users).where(eq(users.id, userId)).limit(1);
  if (!user?.email) throw new Error("Your sign-in account needs an email address before orders can be linked.");
  await db.update(commerceCustomers).set({ userId, status: "REGISTERED", emailVerifiedAt: new Date() }).where(eq(commerceCustomers.email, user.email.toLowerCase()));
  const profiles = await db.select({ id: commerceCustomers.id }).from(commerceCustomers).where(eq(commerceCustomers.userId, userId));
  if (profiles.length) await db.update(commerceOrders).set({ customerId: userId }).where(inArray(commerceOrders.customerProfileId, profiles.map(profile => profile.id)));
  return getCustomerOrders(userId);
}

export async function updateCustomerMarketingConsent(userId: number, enabled: boolean) {
  const db = await requireDb();
  await db.update(commerceCustomers).set({ marketingConsentAt: enabled ? new Date() : null }).where(eq(commerceCustomers.userId, userId));
  const profiles = await db.select({ id: commerceCustomers.id, marketingConsentAt: commerceCustomers.marketingConsentAt }).from(commerceCustomers).where(eq(commerceCustomers.userId, userId));
  return { enabled, profileCount: profiles.length, profiles };
}

export async function getCustomerSavedAddresses(userId: number) {
  const db = await requireDb();
  const profiles = await db.select({ id: commerceCustomers.id, storeId: commerceCustomers.storeId }).from(commerceCustomers).where(eq(commerceCustomers.userId, userId));
  if (!profiles.length) return [];
  return db.select().from(commerceCustomerAddresses).where(inArray(commerceCustomerAddresses.customerId, profiles.map(profile => profile.id))).orderBy(desc(commerceCustomerAddresses.isDefault), desc(commerceCustomerAddresses.updatedAt));
}

export async function upsertCustomerSavedAddress(userId: number, input: { addressId?: string; type: "SHIPPING" | "BILLING" | "BOTH"; label?: string; firstName: string; lastName: string; line1: string; line2?: string; city: string; region?: string; postalCode?: string; countryCode: string; phone?: string; isDefault: boolean }) {
  const db = await requireDb();
  const profiles = await db.select({ id: commerceCustomers.id }).from(commerceCustomers).where(eq(commerceCustomers.userId, userId));
  if (!profiles.length) throw new Error("Link an order to your account before saving an address.");
  const profileIds = profiles.map(profile => profile.id);
  const [existing] = input.addressId ? await db.select().from(commerceCustomerAddresses).where(and(eq(commerceCustomerAddresses.id, input.addressId), inArray(commerceCustomerAddresses.customerId, profileIds))).limit(1) : [null];
  if (input.addressId && !existing) throw new Error("Address not found.");
  const customerId = existing?.customerId ?? profileIds[0]!;
  const addressId = existing?.id ?? `addr_${nanoid(14)}`;
  const values = { type: input.type, label: input.label?.trim() || null, firstName: input.firstName.trim(), lastName: input.lastName.trim(), line1: input.line1.trim(), line2: input.line2?.trim() || null, city: input.city.trim(), region: input.region?.trim() || null, postalCode: input.postalCode?.trim() || null, countryCode: input.countryCode.toUpperCase(), phone: input.phone?.trim() || null, isDefault: input.isDefault };
  await db.transaction(async tx => {
    if (input.isDefault) await tx.update(commerceCustomerAddresses).set({ isDefault: false }).where(eq(commerceCustomerAddresses.customerId, customerId));
    if (existing) await tx.update(commerceCustomerAddresses).set(values).where(eq(commerceCustomerAddresses.id, addressId));
    else await tx.insert(commerceCustomerAddresses).values({ id: addressId, customerId, ...values });
  });
  return { addressId };
}

export async function deleteCustomerSavedAddress(userId: number, addressId: string) {
  const db = await requireDb();
  const profiles = await db.select({ id: commerceCustomers.id }).from(commerceCustomers).where(eq(commerceCustomers.userId, userId));
  if (!profiles.length) throw new Error("Address not found.");
  const result = await db.delete(commerceCustomerAddresses).where(and(eq(commerceCustomerAddresses.id, addressId), inArray(commerceCustomerAddresses.customerId, profiles.map(profile => profile.id))));
  if (!result[0]?.affectedRows) throw new Error("Address not found.");
  return { addressId };
}

export async function exportCustomerPrivacyData(userId: number) {
  const db = await requireDb();
  const [account, profiles, requests] = await Promise.all([
    db.select({ id: users.id, name: users.name, email: users.email, createdAt: users.createdAt }).from(users).where(eq(users.id, userId)).limit(1),
    db.select().from(commerceCustomers).where(eq(commerceCustomers.userId, userId)),
    db.select().from(commercePrivacyRequests).where(eq(commercePrivacyRequests.userId, userId)).orderBy(desc(commercePrivacyRequests.createdAt)),
  ]);
  const profileIds = profiles.map(profile => profile.id);
  const [addresses, orders] = profileIds.length ? await Promise.all([
    db.select().from(commerceCustomerAddresses).where(inArray(commerceCustomerAddresses.customerId, profileIds)),
    db.select().from(commerceOrders).where(or(eq(commerceOrders.customerId, userId), inArray(commerceOrders.customerProfileId, profileIds))).orderBy(desc(commerceOrders.createdAt)),
  ]) : [[], await db.select().from(commerceOrders).where(eq(commerceOrders.customerId, userId)).orderBy(desc(commerceOrders.createdAt))];
  return { exportedAt: new Date().toISOString(), account: account[0] ?? null, customerProfiles: profiles, savedAddresses: addresses, orders, privacyRequests: requests };
}

export async function requestCustomerPrivacyErasure(userId: number, note?: string) {
  const db = await requireDb();
  const existing = await db.select({ id: commercePrivacyRequests.id }).from(commercePrivacyRequests).where(and(eq(commercePrivacyRequests.userId, userId), eq(commercePrivacyRequests.type, "ERASURE"), inArray(commercePrivacyRequests.status, ["REQUESTED", "UNDER_REVIEW"]))).limit(1);
  if (existing[0]) throw new Error("An erasure request is already under review.");
  const id = `privacy_${nanoid(14)}`;
  await db.insert(commercePrivacyRequests).values({ id, userId, type: "ERASURE", status: "REQUESTED", note: note?.trim() || null });
  return { requestId: id, status: "REQUESTED" as const };
}

export async function listAdminPrivacyRequests() {
  const db = await requireDb();
  return db.select({ request: commercePrivacyRequests, user: { id: users.id, name: users.name, email: users.email } }).from(commercePrivacyRequests).innerJoin(users, eq(commercePrivacyRequests.userId, users.id)).orderBy(desc(commercePrivacyRequests.createdAt)).limit(200);
}

export async function resolveAdminPrivacyRequest(input: { requestId: string; status: "UNDER_REVIEW" | "COMPLETED" | "REJECTED"; resolution?: string }) {
  const db = await requireDb();
  const [request] = await db.select({ id: commercePrivacyRequests.id }).from(commercePrivacyRequests).where(eq(commercePrivacyRequests.id, input.requestId)).limit(1);
  if (!request) throw new Error("Privacy request not found.");
  await db.update(commercePrivacyRequests).set({ status: input.status, resolution: input.resolution?.trim() || null }).where(eq(commercePrivacyRequests.id, input.requestId));
  return { requestId: input.requestId, status: input.status };
}

export async function getCommerceAdminOverview(storeId?: string) {
  const db = await requireDb();
  const resolvedStoreId = storeId ?? await resolvePrimaryStoreId();
  const [products, variants, media, orders, carts] = await Promise.all([
    db.select().from(commerceProducts).where(eq(commerceProducts.storeId, resolvedStoreId)).orderBy(desc(commerceProducts.updatedAt)),
    db.select().from(commerceVariants).orderBy(desc(commerceVariants.updatedAt)),
    db.select().from(commerceProductMedia).orderBy(commerceProductMedia.sortOrder, commerceProductMedia.createdAt),
    db.select().from(commerceOrders).where(eq(commerceOrders.storeId, resolvedStoreId)).orderBy(desc(commerceOrders.createdAt)).limit(20),
    db.select().from(commerceCarts).where(and(eq(commerceCarts.storeId, resolvedStoreId), eq(commerceCarts.status, "OPEN"))).orderBy(desc(commerceCarts.updatedAt)).limit(20),
  ]);
  return { products: products.map(product => ({ ...product, media: media.filter(item => item.productId === product.id && !item.variantId), variants: variants.filter(variant => variant.productId === product.id).map(variant => ({ ...variant, media: media.filter(item => item.variantId === variant.id) })) })), orders, openCarts: carts.length };
}
