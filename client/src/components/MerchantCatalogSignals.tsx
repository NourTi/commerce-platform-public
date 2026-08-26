import { useLanguage } from "@/contexts/LanguageContext";
import { trpc } from "@/lib/trpc";
import { useAuth } from "@/_core/hooks/useAuth";
import { Boxes, PackageCheck, TriangleAlert } from "lucide-react";
import "../merchant-catalog-signals.css";

const copy = {
  en: { trigger: "Catalog pulse", title: "Catalog health", published: "Published", variants: "Variants", low: "Low stock" },
  fr: { trigger: "Signal catalogue", title: "Santé du catalogue", published: "Publiés", variants: "Variantes", low: "Stock bas" },
  ar: { trigger: "نبض الكتالوج", title: "حالة الكتالوج", published: "منشور", variants: "متغيرات", low: "مخزون منخفض" },
} as const;

export default function MerchantCatalogSignals() {
  const { user } = useAuth();
  const { locale, direction } = useLanguage();
  const merchant = trpc.commerce.workspace.mine.useQuery(undefined, { enabled: Boolean(user) });
  const overview = trpc.commerce.workspace.operations.overview.useQuery(undefined, { enabled: Boolean(merchant.data), placeholderData: previous => previous, refetchOnWindowFocus: false });
  const role = merchant.data?.membership.role;
  if (!user || !["OWNER", "MANAGER", "MERCHANDISER"].includes(role ?? "")) return null;
  const products = overview.data?.products ?? [];
  const variants = products.flatMap(product => product.variants);
  const lowStock = variants.filter(variant => (variant.lowStockThreshold ?? 0) > 0 && variant.inventoryQty <= (variant.lowStockThreshold ?? 0)).length;
  const text = copy[locale];
  return <aside className="merchant-catalog-signals" dir={direction} aria-label={text.trigger}>
    <header><Boxes size={16} /><div><span>{text.trigger}</span><b>{text.title}</b></div></header>
    <div className="merchant-catalog-signal-grid"><div><PackageCheck size={14} /><span>{text.published}</span><b>{products.filter(product => product.status === "PUBLISHED").length}/{products.length}</b></div><div><Boxes size={14} /><span>{text.variants}</span><b>{variants.length}</b></div><div className={lowStock ? "is-attention" : ""}><TriangleAlert size={14} /><span>{text.low}</span><b>{lowStock}</b></div></div>
  </aside>;
}
