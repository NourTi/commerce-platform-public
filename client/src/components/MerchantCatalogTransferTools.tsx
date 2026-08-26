import { useAuth } from "@/_core/hooks/useAuth";
import { useLanguage } from "@/contexts/LanguageContext";
import { catalogCsvHeaders, formatCatalogCsv } from "@/lib/catalogCsv";
import { trpc } from "@/lib/trpc";
import { Download, FileSpreadsheet, Loader2, Upload, X } from "lucide-react";
import { ChangeEvent, useState } from "react";
import "../merchant-catalog-transfer-tools.css";

const sampleRow = ["sample-candy", "Sample Candy", "Retail pouch", "A sufficiently detailed product description for the catalog import.", "Snacks", "DRAFT", "SAMPLE-CANDY", "Default", "7.50", "0", "0", "", "", "{}"];
const copy = {
  en: { trigger: "Catalog CSV", eyebrow: "CATALOG TRANSFER", title: "Import and export", body: "Use one default variant per product row. Invalid rows never create a product; each successful import records opening stock in the inventory ledger.", template: "Download template", export: "Export catalog", import: "Import CSV", reading: "Reading CSV…", close: "Close catalog transfer", result: "rows imported", exported: "catalog rows prepared for download", failed: "rows need attention", noProducts: "The export is empty until this store has products." },
  fr: { trigger: "CSV catalogue", eyebrow: "TRANSFERT CATALOGUE", title: "Importer et exporter", body: "Utilisez une variante par défaut par ligne de produit. Les lignes invalides ne créent aucun produit ; chaque import réussi enregistre le stock initial dans le registre.", template: "Télécharger le modèle", export: "Exporter le catalogue", import: "Importer un CSV", reading: "Lecture du CSV…", close: "Fermer le transfert catalogue", result: "lignes importées", exported: "lignes de catalogue prêtes au téléchargement", failed: "lignes à corriger", noProducts: "L’export est vide tant que la boutique n’a pas de produits." },
  ar: { trigger: "CSV الكتالوج", eyebrow: "نقل الكتالوج", title: "استيراد وتصدير", body: "استخدم متغيراً افتراضياً واحداً لكل سطر منتج. الصفوف غير الصالحة لا تنشئ منتجاً؛ وكل استيراد ناجح يسجل المخزون الافتتاحي في السجل.", template: "تنزيل النموذج", export: "تصدير الكتالوج", import: "استيراد CSV", reading: "تجري قراءة CSV…", close: "إغلاق نقل الكتالوج", result: "صفوف مستوردة", exported: "صفوف الكتالوج جاهزة للتنزيل", failed: "صفوف تحتاج مراجعة", noProducts: "يبقى التصدير فارغاً حتى يحتوي المتجر على منتجات." },
} as const;

function downloadCsv(fileName: string, content: string) {
  const blob = new Blob([content], { type: "text/csv;charset=utf-8" });
  const url = URL.createObjectURL(blob);
  const anchor = document.createElement("a");
  anchor.href = url;
  anchor.download = fileName;
  anchor.click();
  window.setTimeout(() => URL.revokeObjectURL(url), 0);
}

export default function MerchantCatalogTransferTools() {
  const { user } = useAuth();
  const { locale, direction } = useLanguage();
  const text = copy[locale];
  const utils = trpc.useUtils();
  const merchant = trpc.commerce.workspace.mine.useQuery(undefined, { enabled: Boolean(user) });
  const overview = trpc.commerce.workspace.operations.overview.useQuery(undefined, { enabled: Boolean(merchant.data), placeholderData: previous => previous, refetchOnWindowFocus: false });
  const [open, setOpen] = useState(false);
  const [feedback, setFeedback] = useState("");
  const [results, setResults] = useState<Array<{ row: number; success: boolean; error?: string }>>([]);
  const canMerchandise = ["OWNER", "MANAGER", "MERCHANDISER"].includes(merchant.data?.membership.role ?? "");
  const importCsv = trpc.commerce.workspace.operations.importCatalogCsv.useMutation({
    onSuccess: result => {
      utils.commerce.workspace.operations.overview.invalidate();
      setResults(result.results);
      setFeedback(`${result.created} ${text.result} · ${result.failed} ${text.failed}`);
    },
  });

  const exportCatalog = () => {
    const products = overview.data?.products ?? [];
    const exportedRows = products.filter(product => product.variants.length).length;
    downloadCsv("merchant-catalog-export.csv", formatCatalogCsv(products));
    setFeedback(exportedRows ? `${exportedRows} ${text.exported}` : text.noProducts);
  };

  const importFile = async (event: ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    event.target.value = "";
    if (!file) return;
    setFeedback(text.reading);
    setResults([]);
    importCsv.mutate({ csvText: await file.text() });
  };

  if (!user || !canMerchandise) return null;
  return <div className="merchant-catalog-transfer-tools" dir={direction}>
    <button className="merchant-catalog-transfer-trigger" type="button" onClick={() => setOpen(value => !value)} aria-expanded={open}><FileSpreadsheet size={16} />{text.trigger}</button>
    {open ? <aside className="merchant-catalog-transfer-panel"><header><div><small>{text.eyebrow}</small><h2>{text.title}</h2></div><button type="button" onClick={() => setOpen(false)} aria-label={text.close}><X size={18} /></button></header><div className="merchant-catalog-transfer-body"><p>{text.body}</p><div className="merchant-catalog-transfer-actions"><button type="button" onClick={() => downloadCsv("merchant-catalog-template.csv", `${[catalogCsvHeaders, sampleRow].map(row => row.map(cell => `"${cell}"`).join(",")).join("\n")}\n`)}><Download size={14} />{text.template}</button><button type="button" onClick={exportCatalog} disabled={overview.isLoading}><Download size={14} />{text.export}</button><label><Upload size={14} />{importCsv.isPending ? <Loader2 className="animate-spin" size={14} /> : null}{importCsv.isPending ? text.reading : text.import}<input type="file" accept=".csv,text/csv" onChange={importFile} disabled={importCsv.isPending} /></label></div>{feedback ? <p className="merchant-catalog-transfer-feedback">{feedback}</p> : null}{importCsv.error ? <p className="merchant-catalog-transfer-error">{importCsv.error.message}</p> : null}{results.length ? <ul>{results.map(result => <li className={result.success ? "is-success" : "is-error"} key={`${result.row}-${result.error ?? "created"}`}><b>Row {result.row}</b><span>{result.success ? "Created" : result.error}</span></li>)}</ul> : null}</div></aside> : null}
  </div>;
}
