import { createElement } from "react";
import { renderToStaticMarkup } from "react-dom/server";
import { describe, expect, it, vi } from "vitest";

const mockState = vi.hoisted(() => ({ locale: "en", direction: "ltr" }));

vi.mock("@/_core/hooks/useAuth", () => ({ useAuth: () => ({ user: { id: 1 } }) }));
vi.mock("@/contexts/LanguageContext", () => ({ useLanguage: () => mockState }));
vi.mock("@/lib/trpc", () => {
  const mutation = { isPending: false, error: null, mutate: vi.fn() };
  const workspace = {
    store: { id: "store-1", name: "Studio store", seoTitle: null, seoDescription: null, canonicalOrigin: null },
    membership: { role: "OWNER" }, commercialSettings: { legalName: null, businessEmail: null, businessPhone: null, taxRegistrationNumber: null, taxEnabled: false, checkoutRequiresAccount: false },
    paymentProviders: [], plan: { planKey: "STARTER" }, dataPolicy: null, deliveryRates: [], taxRates: [],
  };
  const invoices = [{ id: "invoice-1", planKey: "STARTER", currency: "DZD", amountCents: 1000, status: "PENDING_PAYMENT", dueAt: new Date("2026-09-01T00:00:00.000Z") }];
  return { trpc: { useUtils: () => ({ commerce: { workspace: { mine: { invalidate: vi.fn() } } } }), commerce: { workspace: { mine: { useQuery: () => ({ data: workspace }) }, updateSeo: { useMutation: () => mutation }, updateDataPolicy: { useMutation: () => mutation }, operations: { updateCommercialSettings: { useMutation: () => mutation }, updatePaymentProvider: { useMutation: () => mutation }, upsertDeliveryRate: { useMutation: () => mutation }, upsertTaxRate: { useMutation: () => mutation }, subscriptionInvoices: { useQuery: () => ({ isLoading: false, data: invoices }) }, submitSubscriptionInvoiceReference: { useMutation: () => mutation } } } } } };
});

import MerchantCommercialTools from "./MerchantCommercialTools";

describe("MerchantCommercialTools localization", () => {
  it("renders localized English, French, and Arabic RTL setup controls", () => {
    mockState.locale = "en"; mockState.direction = "ltr";
    let markup = renderToStaticMarkup(createElement(MerchantCommercialTools, { initialOpen: true }));
    expect(markup).toContain("Commerce setup");
    expect(markup).toContain("Legal business name");
    expect(markup).toContain("Search metadata");
    expect(markup).toContain("Awaiting transfer reference");
    expect(markup).toContain("Standard delivery");
    expect(markup).toContain("Standard tax");
    mockState.locale = "fr"; mockState.direction = "ltr";
    markup = renderToStaticMarkup(createElement(MerchantCommercialTools, { initialOpen: true }));
    expect(markup).toContain("Configuration commerce");
    expect(markup).toContain("Raison sociale");
    expect(markup).toContain("Métadonnées de recherche");
    expect(markup).toContain("En attente de référence de virement");
    expect(markup).toContain("Livraison standard");
    expect(markup).toContain("Taxe standard");
    expect(markup).not.toContain("Commerce setup");
    mockState.locale = "ar"; mockState.direction = "rtl";
    markup = renderToStaticMarkup(createElement(MerchantCommercialTools, { initialOpen: true }));
    expect(markup).toContain('dir="rtl"');
    expect(markup).toContain("إعداد التجارة");
    expect(markup).toContain("هوية التاجر");
    expect(markup).toContain("بيانات البحث");
    expect(markup).toContain("بانتظار مرجع التحويل");
    expect(markup).toContain("تسليم قياسي");
    expect(markup).toContain("ضريبة قياسية");
    expect(markup).not.toContain("Commerce setup");
  });
});
