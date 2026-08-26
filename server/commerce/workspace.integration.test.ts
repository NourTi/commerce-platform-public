import { afterAll, describe, expect, it } from "vitest";
import { eq } from "drizzle-orm";
import { commerceInventoryMovements, commerceProductMedia, commerceStoreMembers, users } from "../../drizzle/schema";
import { getDb } from "../db";
import { createMerchantProduct, deleteMerchantProductMedia, generateMerchantVariantCombinations, getStoreProduct, importMerchantCatalogCsv, setMerchantProductStatus, setMerchantVariantInventory, updateMerchantProductMedia, updateMerchantVariant } from "./service";
import { getMerchantOperationsMonitoring } from "./commercial";
import { bootstrapMerchantStore, createStoreHandoff, getMerchantWorkspace, getPublicHandoff, getPublicStorefront, publishStorefront, updateDashboardPreference, updateExtensionStatus, updatePageSection, updateStoreDataPolicy, updateStoreHandoffStatus, updateStoreSeo, updateStoreTheme } from "./workspace";

const suffix = `workspace_${Date.now().toString(36)}`;
const openId = `test-${suffix}`;
let userId = 0;
let intruderId = 0;
let managerId = 0;
let merchandiserId = 0;
let analystId = 0;

describe("Merchant workspace integration", () => {
  it("creates a tenant-owned store and persists studio, extension, and publication changes", async () => {
    const db = await getDb();
    if (!db) throw new Error("A database connection is required for merchant workspace tests.");
    const inserted = await db.insert(users).values({ openId, name: "Workspace Test Merchant", email: `${suffix}@example.test`, loginMethod: "test", role: "user" });
    userId = Number(inserted[0].insertId);

    const bootstrapped = await bootstrapMerchantStore({ userId, userName: "Workspace Test Merchant", workspaceName: "Test workspace", storeName: "Test storefront", handle: `test-${suffix}` });
    expect(bootstrapped.created).toBe(true);
    const workspace = await getMerchantWorkspace(userId);
    expect(workspace?.membership.role).toBe("OWNER");
    expect(workspace?.pages[0]?.sections).toHaveLength(4);
    expect(workspace?.extensions).toHaveLength(2);

    await updateStoreTheme({ userId, storeId: bootstrapped.storeId, preset: "STUDIO" });
    const afterTheme = await getMerchantWorkspace(userId);
    expect(afterTheme?.themes.find(theme => theme.isActive)?.preset).toBe("STUDIO");

    const sectionId = afterTheme?.pages[0]?.sections[0]?.id;
    if (!sectionId) throw new Error("Expected a seeded homepage section.");
    await updatePageSection({ userId, storeId: bootstrapped.storeId, sectionId, visible: false });
    const afterSection = await getMerchantWorkspace(userId);
    expect(afterSection?.pages[0]?.sections[0]?.visible).toBe(false);

    const extension = afterSection?.extensions.find(candidate => candidate.status === "DISABLED");
    if (!extension) throw new Error("Expected a disabled extension seed.");
    await updateExtensionStatus({ userId, storeId: bootstrapped.storeId, extensionId: extension.id, status: "ENABLED" });
    await publishStorefront({ userId, storeId: bootstrapped.storeId });
    await updateStoreSeo({ userId, storeId: bootstrapped.storeId, seoTitle: "Test storefront | Algeria", seoDescription: "A tenant-scoped SEO description for the merchant storefront.", canonicalOrigin: "https://merchant.example.dz/" });
    const publicStore = await getPublicStorefront(`test-${suffix}`);
    expect(publicStore?.store.status).toBe("ACTIVE");
    expect(publicStore?.store).toMatchObject({ seoTitle: "Test storefront | Algeria", seoDescription: "A tenant-scoped SEO description for the merchant storefront.", canonicalOrigin: "https://merchant.example.dz" });
    expect(publicStore?.theme?.preset).toBe("STUDIO");
    expect(publicStore?.sections.some(section => section.id === sectionId)).toBe(false);

    const manager = await db.insert(users).values({ openId: `manager-${suffix}`, name: "Workspace Test Manager", email: `manager-${suffix}@example.test`, loginMethod: "test", role: "user" });
    const merchandiser = await db.insert(users).values({ openId: `merch-${suffix}`, name: "Workspace Test Merchandiser", email: `merch-${suffix}@example.test`, loginMethod: "test", role: "user" });
    const analyst = await db.insert(users).values({ openId: `analyst-${suffix}`, name: "Workspace Test Analyst", email: `analyst-${suffix}@example.test`, loginMethod: "test", role: "user" });
    managerId = Number(manager[0].insertId);
    merchandiserId = Number(merchandiser[0].insertId);
    analystId = Number(analyst[0].insertId);
    await db.insert(commerceStoreMembers).values([
      { id: `member_manager_${suffix}`, storeId: bootstrapped.storeId, userId: managerId, role: "MANAGER" },
      { id: `member_merch_${suffix}`, storeId: bootstrapped.storeId, userId: merchandiserId, role: "MERCHANDISER" },
      { id: `member_analyst_${suffix}`, storeId: bootstrapped.storeId, userId: analystId, role: "ANALYST" },
    ]);

    await updateStoreDataPolicy({ userId, storeId: bootstrapped.storeId, customerDataRetentionDays: 365, orderRecordRetentionDays: 3650, auditRecordRetentionDays: 3650, policyReference: "merchant-policy-v1", recoveryProcedureReference: "independent-backup-runbook-v1", lastRecoveryTestedAt: "2026-08-01T00:00:00.000Z", legalReviewAcknowledged: true, notes: "Owner-approved operational record." });
    expect((await getMerchantWorkspace(userId))?.dataPolicy).toMatchObject({ customerDataRetentionDays: 365, orderRecordRetentionDays: 3650, auditRecordRetentionDays: 3650, policyReference: "merchant-policy-v1", legalReviewAcknowledged: true });
    await updateStoreDataPolicy({ userId: managerId, storeId: bootstrapped.storeId, legalReviewAcknowledged: true, notes: "Manager confirmed the recorded procedure." });
    await expect(updateStoreDataPolicy({ userId: merchandiserId, storeId: bootstrapped.storeId, legalReviewAcknowledged: true })).rejects.toThrow("do not have access");

    await updateExtensionStatus({ userId: managerId, storeId: bootstrapped.storeId, extensionId: extension.id, status: "DISABLED" });
    await publishStorefront({ userId: managerId, storeId: bootstrapped.storeId });
    await updateStoreTheme({ userId: merchandiserId, storeId: bootstrapped.storeId, preset: "MONO" });
    const merchProduct = await createMerchantProduct(merchandiserId, { handle: `role-product-${suffix}`, title: "Role product", subtitle: "Role coverage", description: "Created by a merchandiser.", category: "Objects", status: "DRAFT", variant: { sku: `ROLE-${suffix}`, title: "Default", priceCents: 4200, inventoryQty: 7 } });
    await setMerchantProductStatus(merchandiserId, merchProduct.productId, "PUBLISHED");
    await setMerchantVariantInventory(merchandiserId, merchProduct.variantId, 5);
    const updatedVariant = await updateMerchantVariant(merchandiserId, { variantId: merchProduct.variantId, title: "Signal orange", priceCents: 4600, inventoryQty: 8, lowStockThreshold: 3, barcode: "ROLE-001", color: "Signal orange", options: { finish: "Matte" } });
    expect(updatedVariant).toMatchObject({ title: "Signal orange", priceCents: 4600, inventoryQty: 8, lowStockThreshold: 3, barcode: "ROLE-001", options: { color: "Signal orange", finish: "Matte" } });
    const movements = await db.select().from(commerceInventoryMovements).where(eq(commerceInventoryMovements.variantId, merchProduct.variantId));
    expect(movements).toHaveLength(1);
    expect(movements[0]).toMatchObject({ delta: 3, reason: "MANUAL_ADJUSTMENT", storeId: bootstrapped.storeId });
    const mediaId = `media_${suffix}`;
    await db.insert(commerceProductMedia).values({ id: mediaId, productId: merchProduct.productId, variantId: null, kind: "GALLERY", storageKey: `test/${suffix}.png`, url: `/manus-storage/test/${suffix}.png`, altText: "Role product gallery image", sortOrder: 0, cropX: 50, cropY: 50 });
    const variantMediaId = `variant_media_${suffix}`;
    const secondMediaId = `gallery_media_${suffix}`;
    await db.insert(commerceProductMedia).values([
      { id: variantMediaId, productId: merchProduct.productId, variantId: merchProduct.variantId, kind: "HOVER", storageKey: `test/${suffix}-alternate.png`, url: `/manus-storage/test/${suffix}-alternate.png`, altText: "Role product alternate image", sortOrder: 1, cropX: 35, cropY: 65 },
      { id: secondMediaId, productId: merchProduct.productId, variantId: null, kind: "GALLERY", storageKey: `test/${suffix}-detail.png`, url: `/manus-storage/test/${suffix}-detail.png`, altText: "Role product detail image", sortOrder: 2, cropX: 20, cropY: 80 },
    ]);
    await updateMerchantProductMedia(merchandiserId, { mediaId, cropX: 35, cropY: 65, sortOrder: 0 });
    const publicAfterMedia = await getPublicStorefront(`test-${suffix}`);
    const publicRoleProduct = publicAfterMedia?.products.find(product => product.id === merchProduct.productId);
    expect(publicRoleProduct?.media.map(media => media.id)).toEqual([mediaId, secondMediaId]);
    expect(publicRoleProduct?.variants[0]?.media[0]).toMatchObject({ id: variantMediaId, kind: "HOVER", cropX: 35, cropY: 65 });
    const productWithGallery = await getStoreProduct(`role-product-${suffix}`, bootstrapped.storeId);
    expect(productWithGallery?.media[0]?.id).toBe(mediaId);
    expect(productWithGallery?.variants[0]?.media[0]?.kind).toBe("HOVER");
    const productWithoutMedia = await createMerchantProduct(merchandiserId, { handle: `fallback-product-${suffix}`, title: "Fallback product", subtitle: "No media", description: "A published product with no media records.", category: "Objects", status: "PUBLISHED", variant: { sku: `FALLBACK-${suffix}`, title: "Default", priceCents: 1900, inventoryQty: 3 } });
    const fallbackGallery = await getStoreProduct(`fallback-product-${suffix}`, bootstrapped.storeId);
    expect(fallbackGallery).toMatchObject({ id: productWithoutMedia.productId, media: [] });
    expect(fallbackGallery?.variants[0]?.media).toEqual([]);
    await expect(updateExtensionStatus({ userId: merchandiserId, storeId: bootstrapped.storeId, extensionId: extension.id, status: "ENABLED" })).rejects.toThrow("do not have access");
    await expect(updateStoreTheme({ userId: analystId, storeId: bootstrapped.storeId, preset: "EDITORIAL" })).rejects.toThrow("do not have access");
    await expect(createMerchantProduct(analystId, { handle: `blocked-${suffix}`, title: "Blocked", subtitle: "Blocked", description: "Blocked", category: "Objects", status: "DRAFT", variant: { sku: `BLOCK-${suffix}`, title: "Default", priceCents: 1000, inventoryQty: 1 } })).rejects.toThrow("required access");
    await expect(updateMerchantProductMedia(analystId, { mediaId, cropX: 0 })).rejects.toThrow("required access");
    await expect(deleteMerchantProductMedia(analystId, mediaId)).rejects.toThrow("required access");
    await expect(updateMerchantVariant(analystId, { variantId: merchProduct.variantId, title: "Blocked", priceCents: 1, inventoryQty: 1, lowStockThreshold: 0, color: "Blocked", options: {} })).rejects.toThrow("required access");
    const csvSlug = suffix.replace(/_/g, "-");
    const catalogCsv = [
      "handle,title,subtitle,description,category,status,sku,variant_title,price,inventory,low_stock_threshold,barcode,color,options_json",
      `imported-${csvSlug},Imported product,CSV catalog item,A tenant-scoped product imported from a validated CSV row.,Objects,PUBLISHED,IMPORTED-${csvSlug.toUpperCase()},Default,12.50,9,2,CSV-001,Orange,"{""finish"":""Matte""}"`,
    ].join("\n");
    const imported = await importMerchantCatalogCsv(merchandiserId, catalogCsv);
    expect(imported).toMatchObject({ created: 1, failed: 0 });
    const importedProduct = await getStoreProduct(`imported-${csvSlug}`, bootstrapped.storeId);
    expect(importedProduct?.variants[0]).toMatchObject({ sku: `IMPORTED-${csvSlug.toUpperCase()}`, priceCents: 1250, inventoryQty: 9, lowStockThreshold: 2, barcode: "CSV-001", options: { color: "Orange", finish: "Matte" } });
    if (!importedProduct?.variants[0]) throw new Error("Expected an imported variant.");
    const importMovements = await db.select().from(commerceInventoryMovements).where(eq(commerceInventoryMovements.variantId, importedProduct.variants[0].id));
    expect(importMovements).toMatchObject([{ delta: 9, reason: "IMPORT", storeId: bootstrapped.storeId }]);
    await expect(importMerchantCatalogCsv(analystId, catalogCsv)).rejects.toThrow("required access");
    const variantGenerator = await generateMerchantVariantCombinations(merchandiserId, { productId: merchProduct.productId, skuPrefix: `COMBO-${csvSlug.toUpperCase()}`, priceCents: 4800, inventoryQty: 4, lowStockThreshold: 1, options: { Color: ["Orange", "Lemon"], Size: ["Small", "Large"] } });
    expect(variantGenerator).toMatchObject({ created: 4, skipped: 0 });
    const combinationProduct = await getStoreProduct(`role-product-${suffix}`, bootstrapped.storeId);
    expect(combinationProduct?.variants).toEqual(expect.arrayContaining([expect.objectContaining({ sku: `COMBO-${csvSlug.toUpperCase()}-ORANGE-SMALL`, options: { Color: "Orange", Size: "Small" }, inventoryQty: 4 })]));
    const generatedMovements = await db.select().from(commerceInventoryMovements).where(eq(commerceInventoryMovements.referenceType, "variant-generator"));
    expect(generatedMovements).toEqual(expect.arrayContaining([expect.objectContaining({ storeId: bootstrapped.storeId, delta: 4, reason: "MANUAL_ADJUSTMENT" })]));
    await expect(generateMerchantVariantCombinations(analystId, { productId: merchProduct.productId, skuPrefix: `BLOCK-${csvSlug.toUpperCase()}`, priceCents: 1, inventoryQty: 1, lowStockThreshold: 0, options: { Size: ["One"] } })).rejects.toThrow("required access");
    await setMerchantVariantInventory(merchandiserId, merchProduct.variantId, 3);
    const monitoring = await getMerchantOperationsMonitoring(merchandiserId, bootstrapped.storeId);
    expect(monitoring.metrics.lowStockCount).toBeGreaterThanOrEqual(1);
    expect(monitoring.metrics).toEqual(expect.objectContaining({ queuedNotificationCount: expect.any(Number), providerAcceptedNotificationCount: expect.any(Number), failedNotificationCount: expect.any(Number) }));
    expect(monitoring.lowStock).toEqual(expect.arrayContaining([expect.objectContaining({ variantId: merchProduct.variantId, inventoryQty: 3, lowStockThreshold: 3 })]));
    expect(monitoring.recentMovements).toEqual(expect.arrayContaining([expect.objectContaining({ variantTitle: "Signal orange", reason: "MANUAL_ADJUSTMENT" })]));
    await expect(getMerchantOperationsMonitoring(analystId, "missing-store")).rejects.toThrow("required access");

    await updateDashboardPreference({ userId: analystId, storeId: bootstrapped.storeId, dashboardView: "CATALOG" });
    const analystWorkspace = await getMerchantWorkspace(analystId);
    expect(analystWorkspace?.preferences.dashboardView).toBe("CATALOG");
    const handoffWorkspace = await createStoreHandoff({ userId: managerId, storeId: bootstrapped.storeId, label: "Agency review" });
    const handoff = handoffWorkspace?.handoffs[0];
    if (!handoff) throw new Error("Expected a client handoff.");
    expect((await getPublicHandoff(handoff.token))?.handoff.status).toBe("SHARED");
    await updateStoreHandoffStatus({ userId: managerId, storeId: bootstrapped.storeId, handoffId: handoff.id, status: "APPROVED" });
    expect((await getPublicHandoff(handoff.token))?.handoff.status).toBe("APPROVED");
    await expect(createStoreHandoff({ userId: merchandiserId, storeId: bootstrapped.storeId, label: "Not allowed" })).rejects.toThrow("do not have access");
    await expect(createStoreHandoff({ userId: analystId, storeId: bootstrapped.storeId, label: "Not allowed" })).rejects.toThrow("do not have access");

    const intruder = await db.insert(users).values({ openId: `intruder-${suffix}`, name: "Workspace Test Intruder", email: `intruder-${suffix}@example.test`, loginMethod: "test", role: "user" });
    intruderId = Number(intruder[0].insertId);
    await bootstrapMerchantStore({ userId: intruderId, userName: "Workspace Test Intruder", workspaceName: "Intruder workspace", storeName: "Intruder storefront", handle: `intruder-${suffix}` });
    await expect(updateStoreTheme({ userId: intruderId, storeId: bootstrapped.storeId, preset: "MONO" })).rejects.toThrow("do not have access");
  }, 30_000);

  afterAll(async () => {
    const db = await getDb();
    if (db && intruderId) await db.delete(users).where(eq(users.id, intruderId));
    if (db && analystId) await db.delete(users).where(eq(users.id, analystId));
    if (db && merchandiserId) await db.delete(users).where(eq(users.id, merchandiserId));
    if (db && managerId) await db.delete(users).where(eq(users.id, managerId));
    if (db && userId) await db.delete(users).where(eq(users.id, userId));
  });
});
