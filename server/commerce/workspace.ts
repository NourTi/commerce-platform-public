import { and, asc, desc, eq } from "drizzle-orm";
import { nanoid } from "nanoid";
import {
  commerceExtensions,
  commerceDeliveryRates,
  commerceDeliveryZones,
  commercePages,
  commercePageSections,
  commercePaymentProviders,
  commerceStoreCommercialSettings,
  commerceStoreDataPolicies,
  commerceStoreMembers,
  commerceStoreHandoffs,
  commerceStorePlans,
  commerceTaxRates,
  commerceStorePreferences,
  commerceStores,
  commerceThemes,
  commerceWorkspaces,
} from "../../drizzle/schema";
import { getDb } from "../db";
import { createDefaultPaymentProviderRows } from "../../shared/paymentCapabilities";
import { listStoreProducts } from "./service";

export type StoreRole = "OWNER" | "MANAGER" | "MERCHANDISER" | "ANALYST";
export type ThemePreset = "EDITORIAL" | "STUDIO" | "MONO";

const themeTokens: Record<ThemePreset, Record<string, string>> = {
  EDITORIAL: { ink: "#171717", paper: "#f7f5f0", accent: "#e96526", surface: "#ffffff", radius: "0px" },
  STUDIO: { ink: "#111827", paper: "#f4f7ff", accent: "#1769ff", surface: "#ffffff", radius: "16px" },
  MONO: { ink: "#111111", paper: "#f1f1f1", accent: "#111111", surface: "#ffffff", radius: "4px" },
};

const defaultSections = [
  { type: "HERO", settings: { eyebrow: "New collection", heading: "Design a storefront that keeps moving.", body: "A visual system connected to your real catalog, order flow, and campaigns.", actionLabel: "Shop the collection" } },
  { type: "FEATURED_COLLECTION", settings: { heading: "Featured objects", collection: "all", limit: 4 } },
  { type: "STORY", settings: { eyebrow: "Built for the work", heading: "Merchandising without the handoff.", body: "Make an edit, see it at desktop and mobile, then publish a coherent storefront." } },
  { type: "NEWSLETTER", settings: { heading: "Stay in the loop", body: "Collect launch interest and campaign subscribers." } },
] as const;

async function requireDb() {
  const db = await getDb();
  if (!db) throw new Error("Commerce workspace database is unavailable.");
  return db;
}

function normalizeHandle(value: string) {
  return value.toLowerCase().trim().replace(/[^a-z0-9]+/g, "-").replace(/(^-|-$)/g, "").slice(0, 96) || `store-${nanoid(6).toLowerCase()}`;
}

async function getMemberStore(userId: number, storeId?: string) {
  const db = await requireDb();
  const rows = await db
    .select({ membership: commerceStoreMembers, store: commerceStores, workspace: commerceWorkspaces })
    .from(commerceStoreMembers)
    .innerJoin(commerceStores, eq(commerceStoreMembers.storeId, commerceStores.id))
    .innerJoin(commerceWorkspaces, eq(commerceStores.workspaceId, commerceWorkspaces.id))
    .where(storeId ? and(eq(commerceStoreMembers.userId, userId), eq(commerceStoreMembers.storeId, storeId)) : eq(commerceStoreMembers.userId, userId))
    .orderBy(asc(commerceStores.createdAt))
    .limit(1);
  return rows[0] ?? null;
}

export async function requireStoreRole(userId: number, storeId: string, allowed: StoreRole[]) {
  const record = await getMemberStore(userId, storeId);
  if (!record || !allowed.includes(record.membership.role)) throw new Error("You do not have access to this merchant store.");
  return record;
}

export async function bootstrapMerchantStore(input: { userId: number; userName?: string | null; workspaceName: string; storeName: string; handle: string }) {
  const existing = await getMemberStore(input.userId);
  if (existing) return { created: false, storeId: existing.store.id, workspaceId: existing.workspace.id };
  const db = await requireDb();
  const workspaceId = `ws_${nanoid(14)}`;
  const storeId = `store_${nanoid(14)}`;
  const themeId = `theme_${nanoid(14)}`;
  const pageId = `page_${nanoid(14)}`;
  const handle = normalizeHandle(input.handle);
  const workspaceName = input.workspaceName.trim() || `${input.userName ?? "Merchant"} workspace`;
  const storeName = input.storeName.trim() || "New storefront";

  await db.transaction(async tx => {
    await tx.insert(commerceWorkspaces).values({ id: workspaceId, name: workspaceName, slug: `${handle}-${nanoid(5).toLowerCase()}`, ownerId: input.userId });
    await tx.insert(commerceStores).values({ id: storeId, workspaceId, name: storeName, handle, status: "DRAFT", defaultLocale: "en", currency: "USD" });
    await tx.insert(commerceStoreMembers).values({ id: `member_${nanoid(14)}`, storeId, userId: input.userId, role: "OWNER" });
    await tx.insert(commerceThemes).values({ id: themeId, storeId, name: "Editorial start", preset: "EDITORIAL", tokens: themeTokens.EDITORIAL, isActive: true });
    await tx.insert(commercePages).values({ id: pageId, storeId, handle: "home", title: "Homepage", status: "DRAFT" });
    await tx.insert(commercePageSections).values(defaultSections.map((section, index) => ({ id: `section_${nanoid(14)}`, pageId, type: section.type, sortOrder: index + 1, visible: true, settings: section.settings })));
    await tx.insert(commerceExtensions).values([
      { id: `ext_${nanoid(14)}`, storeId, key: "customer-capture", name: "Customer capture", status: "ENABLED", configuration: { provider: "native" } },
      { id: `ext_${nanoid(14)}`, storeId, key: "campaign-measurement", name: "Campaign measurement", status: "DISABLED", configuration: { provider: "none" } },
    ]);
    await tx.insert(commerceStorePreferences).values({ storeId, dashboardView: "OVERVIEW" });
    await tx.insert(commerceStoreCommercialSettings).values({ storeId, countryCode: "DZ", taxEnabled: false, checkoutRequiresAccount: false });
    await tx.insert(commerceStorePlans).values({ storeId, planKey: "STARTER", status: "TRIAL", entitlementSnapshot: { maxProducts: 50, maxTeamMembers: 3, onlinePayments: true, cashOnDelivery: true } });
    await tx.insert(commercePaymentProviders).values(createDefaultPaymentProviderRows(storeId, () => `pay_${nanoid(14)}`));
  });
  return { created: true, storeId, workspaceId };
}

export async function getMerchantWorkspace(userId: number) {
  const record = await getMemberStore(userId);
  if (!record) return null;
  const db = await requireDb();
  const [themes, pages, extensions, preferences, handoffs, commercialSettings, dataPolicy, paymentProviders, deliveryZones, deliveryRates, taxRates, plan] = await Promise.all([
    db.select().from(commerceThemes).where(eq(commerceThemes.storeId, record.store.id)).orderBy(desc(commerceThemes.isActive), asc(commerceThemes.createdAt)),
    db.select().from(commercePages).where(eq(commercePages.storeId, record.store.id)).orderBy(asc(commercePages.createdAt)),
    db.select().from(commerceExtensions).where(eq(commerceExtensions.storeId, record.store.id)).orderBy(asc(commerceExtensions.createdAt)),
    db.select().from(commerceStorePreferences).where(eq(commerceStorePreferences.storeId, record.store.id)).limit(1),
    db.select().from(commerceStoreHandoffs).where(eq(commerceStoreHandoffs.storeId, record.store.id)).orderBy(desc(commerceStoreHandoffs.createdAt)),
    db.select().from(commerceStoreCommercialSettings).where(eq(commerceStoreCommercialSettings.storeId, record.store.id)).limit(1),
    db.select().from(commerceStoreDataPolicies).where(eq(commerceStoreDataPolicies.storeId, record.store.id)).limit(1),
    db.select().from(commercePaymentProviders).where(eq(commercePaymentProviders.storeId, record.store.id)),
    db.select().from(commerceDeliveryZones).where(eq(commerceDeliveryZones.storeId, record.store.id)),
    db.select().from(commerceDeliveryRates).innerJoin(commerceDeliveryZones, eq(commerceDeliveryRates.zoneId, commerceDeliveryZones.id)).where(eq(commerceDeliveryZones.storeId, record.store.id)),
    db.select().from(commerceTaxRates).where(eq(commerceTaxRates.storeId, record.store.id)),
    db.select().from(commerceStorePlans).where(eq(commerceStorePlans.storeId, record.store.id)).limit(1),
  ]);
  const sections = pages.length ? await db.select().from(commercePageSections).where(eq(commercePageSections.pageId, pages[0]!.id)).orderBy(asc(commercePageSections.sortOrder)) : [];
  return { workspace: record.workspace, store: record.store, membership: record.membership, themes, pages: pages.map(page => ({ ...page, sections: page.id === pages[0]?.id ? sections : [] })), extensions, preferences: preferences[0] ?? { storeId: record.store.id, dashboardView: "OVERVIEW" as const }, handoffs, commercialSettings: commercialSettings[0] ?? null, dataPolicy: dataPolicy[0] ?? null, paymentProviders, deliveryZones, deliveryRates, taxRates, plan: plan[0] ?? null };
}

export async function updateStoreDataPolicy(input: { userId: number; storeId: string; customerDataRetentionDays?: number; orderRecordRetentionDays?: number; auditRecordRetentionDays?: number; policyReference?: string; recoveryProcedureReference?: string; lastRecoveryTestedAt?: string; legalReviewAcknowledged: boolean; notes?: string }) {
  await requireStoreRole(input.userId, input.storeId, ["OWNER", "MANAGER"]);
  const db = await requireDb();
  const values = { customerDataRetentionDays: input.customerDataRetentionDays, orderRecordRetentionDays: input.orderRecordRetentionDays, auditRecordRetentionDays: input.auditRecordRetentionDays, policyReference: input.policyReference?.trim() || null, recoveryProcedureReference: input.recoveryProcedureReference?.trim() || null, lastRecoveryTestedAt: input.lastRecoveryTestedAt ? new Date(input.lastRecoveryTestedAt) : null, legalReviewAcknowledged: input.legalReviewAcknowledged, notes: input.notes?.trim() || null };
  await db.insert(commerceStoreDataPolicies).values({ storeId: input.storeId, ...values }).onDuplicateKeyUpdate({ set: values });
  return getMerchantWorkspace(input.userId);
}

export async function updateDashboardPreference(input: { userId: number; storeId: string; dashboardView: "OVERVIEW" | "CATALOG" | "ORDERS" | "MARKETING" | "STUDIO" | "EXTENSIONS" }) {
  await requireStoreRole(input.userId, input.storeId, ["OWNER", "MANAGER", "MERCHANDISER", "ANALYST"]);
  const db = await requireDb();
  await db.insert(commerceStorePreferences).values({ storeId: input.storeId, dashboardView: input.dashboardView }).onDuplicateKeyUpdate({ set: { dashboardView: input.dashboardView } });
  return getMerchantWorkspace(input.userId);
}

export async function createStoreHandoff(input: { userId: number; storeId: string; label: string }) {
  await requireStoreRole(input.userId, input.storeId, ["OWNER", "MANAGER"]);
  const db = await requireDb();
  const id = `handoff_${nanoid(14)}`;
  const token = nanoid(20);
  await db.insert(commerceStoreHandoffs).values({ id, storeId: input.storeId, createdBy: input.userId, token, label: input.label.trim() || "Client review", status: "SHARED" });
  return getMerchantWorkspace(input.userId);
}

export async function updateStoreHandoffStatus(input: { userId: number; storeId: string; handoffId: string; status: "DRAFT" | "SHARED" | "APPROVED" }) {
  await requireStoreRole(input.userId, input.storeId, ["OWNER", "MANAGER"]);
  const db = await requireDb();
  const handoff = await db.select().from(commerceStoreHandoffs).where(and(eq(commerceStoreHandoffs.id, input.handoffId), eq(commerceStoreHandoffs.storeId, input.storeId))).limit(1);
  if (!handoff[0]) throw new Error("Client handoff not found.");
  await db.update(commerceStoreHandoffs).set({ status: input.status }).where(eq(commerceStoreHandoffs.id, input.handoffId));
  return getMerchantWorkspace(input.userId);
}

export async function updateStoreTheme(input: { userId: number; storeId: string; preset: ThemePreset; name?: string }) {
  await requireStoreRole(input.userId, input.storeId, ["OWNER", "MANAGER", "MERCHANDISER"]);
  const db = await requireDb();
  await db.transaction(async tx => {
    await tx.update(commerceThemes).set({ isActive: false }).where(eq(commerceThemes.storeId, input.storeId));
    await tx.insert(commerceThemes).values({ id: `theme_${nanoid(14)}`, storeId: input.storeId, name: input.name?.trim() || `${input.preset[0]}${input.preset.slice(1).toLowerCase()} preset`, preset: input.preset, tokens: themeTokens[input.preset], isActive: true });
  });
  return getMerchantWorkspace(input.userId);
}

export async function updateStoreSeo(input: { userId: number; storeId: string; seoTitle?: string; seoDescription?: string; canonicalOrigin?: string }) {
  await requireStoreRole(input.userId, input.storeId, ["OWNER", "MANAGER"]);
  const db = await requireDb();
  await db.update(commerceStores).set({ seoTitle: input.seoTitle?.trim() || null, seoDescription: input.seoDescription?.trim() || null, canonicalOrigin: input.canonicalOrigin?.trim().replace(/\/$/, "") || null }).where(eq(commerceStores.id, input.storeId));
  return getMerchantWorkspace(input.userId);
}

export async function updatePageSection(input: { userId: number; storeId: string; sectionId: string; visible?: boolean; settings?: Record<string, unknown> }) {
  await requireStoreRole(input.userId, input.storeId, ["OWNER", "MANAGER", "MERCHANDISER"]);
  const db = await requireDb();
  const section = await db.select({ section: commercePageSections, page: commercePages }).from(commercePageSections).innerJoin(commercePages, eq(commercePageSections.pageId, commercePages.id)).where(eq(commercePageSections.id, input.sectionId)).limit(1);
  if (!section[0] || section[0].page.storeId !== input.storeId) throw new Error("Storefront section not found.");
  await db.update(commercePageSections).set({ ...(input.visible === undefined ? {} : { visible: input.visible }), ...(input.settings ? { settings: input.settings } : {}) }).where(eq(commercePageSections.id, input.sectionId));
  return getMerchantWorkspace(input.userId);
}

export async function updateExtensionStatus(input: { userId: number; storeId: string; extensionId: string; status: "DISABLED" | "ENABLED" }) {
  await requireStoreRole(input.userId, input.storeId, ["OWNER", "MANAGER"]);
  const db = await requireDb();
  const extension = await db.select().from(commerceExtensions).where(and(eq(commerceExtensions.id, input.extensionId), eq(commerceExtensions.storeId, input.storeId))).limit(1);
  if (!extension[0]) throw new Error("Store extension not found.");
  await db.update(commerceExtensions).set({ status: input.status }).where(eq(commerceExtensions.id, input.extensionId));
  return getMerchantWorkspace(input.userId);
}

export async function publishStorefront(input: { userId: number; storeId: string }) {
  await requireStoreRole(input.userId, input.storeId, ["OWNER", "MANAGER"]);
  const db = await requireDb();
  await db.transaction(async tx => {
    await tx.update(commerceStores).set({ status: "ACTIVE" }).where(eq(commerceStores.id, input.storeId));
    await tx.update(commercePages).set({ status: "PUBLISHED" }).where(and(eq(commercePages.storeId, input.storeId), eq(commercePages.handle, "home")));
  });
  return getMerchantWorkspace(input.userId);
}

export async function getPublicStorefront(handle: string) {
  const db = await requireDb();
  const store = await db.select().from(commerceStores).where(and(eq(commerceStores.handle, normalizeHandle(handle)), eq(commerceStores.status, "ACTIVE"))).limit(1);
  if (!store[0]) return null;
  const [theme, page] = await Promise.all([
    db.select().from(commerceThemes).where(and(eq(commerceThemes.storeId, store[0].id), eq(commerceThemes.isActive, true))).limit(1),
    db.select().from(commercePages).where(and(eq(commercePages.storeId, store[0].id), eq(commercePages.handle, "home"), eq(commercePages.status, "PUBLISHED"))).limit(1),
  ]);
  const sections = page[0] ? await db.select().from(commercePageSections).where(and(eq(commercePageSections.pageId, page[0].id), eq(commercePageSections.visible, true))).orderBy(asc(commercePageSections.sortOrder)) : [];
  const products = await listStoreProducts(undefined, store[0].id);
  return { store: store[0], theme: theme[0] ?? null, page: page[0] ?? null, sections, products };
}

export async function getPublicHandoff(token: string) {
  const db = await requireDb();
  const handoff = await db.select().from(commerceStoreHandoffs).where(eq(commerceStoreHandoffs.token, token)).limit(1);
  if (!handoff[0] || handoff[0].status === "DRAFT") return null;
  const store = await db.select().from(commerceStores).where(eq(commerceStores.id, handoff[0].storeId)).limit(1);
  if (!store[0]) return null;
  const [theme, page] = await Promise.all([
    db.select().from(commerceThemes).where(and(eq(commerceThemes.storeId, store[0].id), eq(commerceThemes.isActive, true))).limit(1),
    db.select().from(commercePages).where(and(eq(commercePages.storeId, store[0].id), eq(commercePages.handle, "home"))).limit(1),
  ]);
  const sections = page[0] ? await db.select().from(commercePageSections).where(and(eq(commercePageSections.pageId, page[0].id), eq(commercePageSections.visible, true))).orderBy(asc(commercePageSections.sortOrder)) : [];
  const products = await listStoreProducts(undefined, store[0].id);
  return { handoff: handoff[0], store: store[0], theme: theme[0] ?? null, page: page[0] ?? null, sections, products };
}
