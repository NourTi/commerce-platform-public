import { useAuth } from "@/_core/hooks/useAuth";
import { useLanguage } from "@/contexts/LanguageContext";
import { trpc } from "@/lib/trpc";
import { workspaceCopy } from "@/lib/workspaceCopy";
import { Boxes, ImagePlus, Loader2, SlidersHorizontal, X } from "lucide-react";
import { ChangeEvent, FormEvent, useMemo, useState } from "react";
import "../merchant-media-tools.css";
import "../merchant-catalog-summary.css";

const supportedTypes = ["image/jpeg", "image/png", "image/webp"];

function readAsDataUrl(file: File) {
  return new Promise<string>((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve(String(reader.result));
    reader.onerror = () => reject(new Error(`Could not read ${file.name}.`));
    reader.readAsDataURL(file);
  });
}

export default function MerchantMediaTools() {
  const { user } = useAuth();
  const { locale, direction } = useLanguage();
  const copy = workspaceCopy[locale].catalog;
  const utils = trpc.useUtils();
  const merchant = trpc.commerce.workspace.mine.useQuery(undefined, { enabled: Boolean(user) });
  const operations = trpc.commerce.workspace.operations.overview.useQuery(undefined, { enabled: Boolean(merchant.data), placeholderData: previous => previous, refetchOnWindowFocus: false });
  const [open, setOpen] = useState(false);
  const [productId, setProductId] = useState("");
  const [variantId, setVariantId] = useState<string | null>(null);
  const [kind, setKind] = useState<"GALLERY" | "HOVER">("GALLERY");
  const [feedback, setFeedback] = useState("");
  const [generationFeedback, setGenerationFeedback] = useState("");
  const [bulkResults, setBulkResults] = useState<Array<{ fileName: string; success: boolean; error?: string }>>([]);
  const canMerchandise = merchant.data?.membership.role === "OWNER" || merchant.data?.membership.role === "MANAGER" || merchant.data?.membership.role === "MERCHANDISER";
  const product = useMemo(() => operations.data?.products.find(item => item.id === productId) ?? operations.data?.products[0], [operations.data?.products, productId]);
  const bulkUpload = trpc.commerce.workspace.operations.bulkUploadProductMedia.useMutation({
    onSuccess: result => {
      utils.commerce.workspace.operations.overview.invalidate();
      setFeedback(`${copy.uploadResult}: ${result.uploaded} • ${result.failed}`);
      setBulkResults(result.results.map(result => ({ fileName: result.fileName, success: result.success, error: result.error })));
    },
  });
  const updateVariant = trpc.commerce.workspace.operations.updateVariant.useMutation({
    onSuccess: () => {
      utils.commerce.workspace.operations.overview.invalidate();
      setFeedback(copy.saveVariant);
    },
  });
  const generateVariants = trpc.commerce.workspace.operations.generateVariantCombinations.useMutation({
    onSuccess: result => {
      utils.commerce.workspace.operations.overview.invalidate();
      setGenerationFeedback(`${result.created} ${copy.combinationCreated}${result.skipped ? ` · ${result.skipped} ${copy.combinationsSkipped}` : ""}`);
    },
    onError: error => setGenerationFeedback(error.message),
  });

  async function uploadBulk(event: ChangeEvent<HTMLInputElement>) {
    const files = Array.from(event.target.files ?? []).slice(0, 5);
    event.target.value = "";
    if (!product || !files.length) return;
    const eligible = files.filter(file => supportedTypes.includes(file.type) && file.size <= 8 * 1024 * 1024);
    if (!eligible.length) return setFeedback("JPEG, PNG, WebP · 8 MB maximum");
    setFeedback(copy.optimizing);
    setBulkResults([]);
    const payload = await Promise.all(eligible.map(async file => ({
      fileName: file.name,
      contentType: file.type as "image/jpeg" | "image/png" | "image/webp",
      base64Data: await readAsDataUrl(file),
      altText: `${product.title} ${file.name.replace(/\.[^.]+$/, "").replace(/[-_]+/g, " ")}`,
    })));
    bulkUpload.mutate({ productId: product.id, variantId, kind, files: payload, cropX: 50, cropY: 50 });
  }

  function saveVariant(event: FormEvent<HTMLFormElement>, variant: { id: string; options: Record<string, string> }) {
    event.preventDefault();
    const form = new FormData(event.currentTarget);
    const options = Object.fromEntries(
      Object.keys(variant.options)
        .filter(key => key !== "color")
        .map(key => [key, String(form.get(`option-${key}`) ?? "").trim()])
        .filter(([, value]) => value),
    );
    updateVariant.mutate({
      variantId: variant.id,
      title: String(form.get("title") ?? ""),
      priceCents: Math.round(Number(form.get("price") ?? 0) * 100),
      inventoryQty: Number(form.get("inventory") ?? 0),
      lowStockThreshold: Number(form.get("low-stock-threshold") ?? 0),
      barcode: String(form.get("barcode") ?? "").trim() || undefined,
      color: String(form.get("color") ?? "").trim() || undefined,
      options,
    });
  }

  function generateOptionCombinations(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (!product) return;
    const form = new FormData(event.currentTarget);
    const options = Object.fromEntries(String(form.get("option-groups") ?? "").split(/\n+/).map(line => {
      const [name, values] = line.split(":", 2);
      return [name?.trim() ?? "", (values ?? "").split(",").map(value => value.trim()).filter(Boolean)];
    }).filter(([name, values]) => name && values.length));
    if (!Object.keys(options).length) return setGenerationFeedback(copy.invalidOptionGroups);
    setGenerationFeedback("");
    generateVariants.mutate({
      productId: product.id,
      skuPrefix: String(form.get("sku-prefix") ?? "").trim().toUpperCase(),
      priceCents: Math.round(Number(form.get("combination-price") ?? 0) * 100),
      inventoryQty: Number(form.get("combination-inventory") ?? 0),
      lowStockThreshold: Number(form.get("combination-low-stock") ?? 0),
      options,
    });
  }

  if (!user || !canMerchandise || !product) return null;
  const productStock = product.variants.reduce((total, variant) => total + variant.inventoryQty, 0);

  return (
    <div className="merchant-media-tools" dir={direction}>
      <button className="merchant-media-tools-trigger" type="button" onClick={() => setOpen(value => !value)} aria-expanded={open}>
        <ImagePlus size={17} />
        {copy.media}
      </button>
      {open ? (
        <aside className="merchant-media-tools-panel">
          <header>
            <div>
              <small>{copy.media}</small>
              <h2>{copy.optimizing}</h2>
            </div>
            <button type="button" onClick={() => setOpen(false)} aria-label="Close media desk">
              <X size={18} />
            </button>
          </header>
          <div className="merchant-media-tools-body">
            <label>
              {copy.product}
              <select value={product.id} onChange={event => { setProductId(event.target.value); setVariantId(null); setFeedback(""); setGenerationFeedback(""); setBulkResults([]); }}>
                {operations.data?.products.map(item => <option key={item.id} value={item.id}>{item.title}</option>)}
              </select>
            </label>
            <div className="merchant-catalog-summary" aria-live="polite"><b>{product.title}</b><span>{copy.selectedProduct(product.variants.length, productStock)}</span></div>
            <form className="merchant-combination-tools" onSubmit={generateOptionCombinations}>
              <div><Boxes size={15} /><small>{copy.combinationTitle}</small></div>
              <p>{copy.combinationHelp}</p>
              <label>{copy.optionGroups}<textarea name="option-groups" defaultValue={"Color: Orange, Lemon\nSize: Small, Large"} aria-label={copy.optionGroups} /></label>
              <div className="merchant-combination-tools-grid">
                <label>{copy.skuPrefix}<input name="sku-prefix" required pattern="[A-Z0-9-]+" defaultValue={`${merchant.data?.store.handle ?? "STORE"}-${product.handle}`.toUpperCase()} /></label>
                <label>{copy.price}<input name="combination-price" required type="number" min="0" step="0.01" defaultValue={((product.variants[0]?.priceCents ?? 0) / 100).toFixed(2)} /></label>
                <label>{copy.openingStock}<input name="combination-inventory" required type="number" min="0" defaultValue="0" /></label>
                <label>{copy.lowStockAlert}<input name="combination-low-stock" required type="number" min="0" defaultValue="0" /></label>
              </div>
              <button type="submit" disabled={generateVariants.isPending}>{generateVariants.isPending ? <Loader2 className="animate-spin" size={14} /> : <Boxes size={14} />}{generateVariants.isPending ? copy.generatingVariants : copy.generateVariants}</button>
              {generationFeedback ? <p className="merchant-media-tools-feedback" role="status">{generationFeedback}</p> : null}
              {generateVariants.error ? <p className="merchant-media-tools-error" role="alert">{generateVariants.error.message}</p> : null}
            </form>
            <div className="merchant-variant-tools">
              <div><SlidersHorizontal size={15} /><small>{copy.variants}</small></div>
              {product.variants.map(variant => (
                <form key={variant.id} onSubmit={event => saveVariant(event, variant)}>
                  <input name="title" defaultValue={variant.title} aria-label="Variant title" />
                  <button type="submit" disabled={updateVariant.isPending}>
                    {updateVariant.isPending ? <Loader2 className="animate-spin" size={14} /> : null}
                    {updateVariant.isPending ? copy.savingVariant : copy.saveVariant}
                  </button>
                  <div className="merchant-variant-tools-grid">
                    <label>{copy.color}<input name="color" defaultValue={variant.options.color ?? ""} placeholder="e.g. Citrus orange" /></label>
                    <label>{copy.price}<input name="price" type="number" min="0" step="0.01" defaultValue={(variant.priceCents / 100).toFixed(2)} /></label>
                    <label>{copy.inventory}<input name="inventory" type="number" min="0" defaultValue={variant.inventoryQty} /></label>
                    <label>Low-stock alert<input name="low-stock-threshold" type="number" min="0" defaultValue={variant.lowStockThreshold ?? 0} /></label>
                    <label>Barcode<input name="barcode" defaultValue={variant.barcode ?? ""} placeholder="Optional barcode" /></label>
                    {Object.entries(variant.options).filter(([key]) => key !== "color").map(([key, value]) => (
                      <label key={key}>{key}<input name={`option-${key}`} defaultValue={value} /></label>
                    ))}
                  </div>
                </form>
              ))}
            </div>
            <label>
              {copy.mediaFor}
              <select value={variantId ?? "product"} onChange={event => setVariantId(event.target.value === "product" ? null : event.target.value)}>
                <option value="product">{copy.productGallery}</option>
                {product.variants.map(variant => <option key={variant.id} value={variant.id}>{variant.title}</option>)}
              </select>
            </label>
            <label>
              {copy.gallery}
              <select value={kind} onChange={event => setKind(event.target.value as "GALLERY" | "HOVER")}>
                <option value="GALLERY">{copy.gallery}</option>
                <option value="HOVER">{copy.hover}</option>
              </select>
            </label>
            <label className="merchant-media-tools-upload">
              <ImagePlus size={16} />
              {bulkUpload.isPending ? copy.optimizing : copy.bulkUpload}
              <input className="merchant-media-tools-file-input" aria-label="Select product image files" type="file" multiple accept="image/jpeg,image/png,image/webp" onChange={uploadBulk} disabled={bulkUpload.isPending} />
            </label>
            {feedback ? <p className="merchant-media-tools-feedback">{feedback}</p> : null}
            {bulkResults.length ? (
              <ul className="merchant-media-tools-results">
                {bulkResults.map(result => (
                  <li key={result.fileName} className={result.success ? "is-success" : "is-error"}>
                    <b>{result.fileName}</b>
                    <span>{result.success ? copy.uploadResult : result.error}</span>
                  </li>
                ))}
              </ul>
            ) : null}
          </div>
        </aside>
      ) : null}
    </div>
  );
}
