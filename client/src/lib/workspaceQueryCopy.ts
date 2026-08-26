import type { Locale } from "./publicCopy";

type WorkspaceQueryCopy = {
  refreshLabel: string; refresh: string; loading: string; refreshing: string;
  refreshFailed: string; unavailable: string; retry: string; empty: string;
};

export const workspaceQueryCopy: Record<Locale, WorkspaceQueryCopy> = {
  en: {
    refreshLabel: "Refresh catalog operations", refresh: "Refresh catalog", loading: "Loading catalog operations…", refreshing: "Refreshing catalog; current products remain visible.",
    refreshFailed: "Catalog refresh failed; showing the last known data.", unavailable: "Catalog data is unavailable.", retry: "Retry", empty: "This store has no products yet. Use Add product or Catalog CSV to create its first item.",
  },
  fr: {
    refreshLabel: "Actualiser les opérations du catalogue", refresh: "Actualiser le catalogue", loading: "Chargement des opérations du catalogue…", refreshing: "Actualisation du catalogue ; les produits actuels restent visibles.",
    refreshFailed: "L’actualisation du catalogue a échoué ; les dernières données connues restent affichées.", unavailable: "Les données du catalogue sont indisponibles.", retry: "Réessayer", empty: "Cette boutique n’a pas encore de produits. Utilisez Ajouter un produit ou Import CSV pour créer le premier.",
  },
  ar: {
    refreshLabel: "حدّث عمليات الكتالوج", refresh: "حدّث الكتالوج", loading: "جارٍ تحميل عمليات الكتالوج…", refreshing: "جارٍ تحديث الكتالوج؛ تبقى المنتجات الحالية مرئية.",
    refreshFailed: "فشل تحديث الكتالوج؛ ما تزال آخر البيانات المعروفة معروضة.", unavailable: "بيانات الكتالوج غير متاحة.", retry: "إعادة المحاولة", empty: "لا توجد منتجات في هذا المتجر بعد. استخدم إضافة منتج أو استيراد CSV لإنشاء المنتج الأول.",
  },
};
