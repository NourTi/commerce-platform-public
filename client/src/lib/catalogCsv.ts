export const catalogCsvHeaders = ["handle", "title", "subtitle", "description", "category", "status", "sku", "variant_title", "price", "inventory", "low_stock_threshold", "barcode", "color", "options_json"];

type ExportVariant = {
  sku: string;
  title: string;
  priceCents: number;
  inventoryQty: number;
  lowStockThreshold: number | null;
  barcode: string | null;
  options: Record<string, string>;
  isDefault: boolean;
};

type ExportProduct = {
  handle: string;
  title: string;
  subtitle: string;
  description: string;
  category: string;
  status: string;
  variants: ExportVariant[];
};

export function csvCell(value: unknown) {
  return `"${String(value ?? "").replaceAll('"', '""')}"`;
}

export function formatCatalogCsv(products: ExportProduct[]) {
  const rows = products.flatMap(product => {
    const variant = product.variants.find(item => item.isDefault) ?? product.variants[0];
    if (!variant) return [];
    const options = { ...variant.options };
    const color = options.color ?? "";
    delete options.color;
    return [[product.handle, product.title, product.subtitle, product.description, product.category, product.status, variant.sku, variant.title, (variant.priceCents / 100).toFixed(2), String(variant.inventoryQty), String(variant.lowStockThreshold ?? 0), variant.barcode ?? "", color, JSON.stringify(options)]];
  });
  return `${[catalogCsvHeaders, ...rows].map(row => row.map(csvCell).join(",")).join("\n")}\n`;
}
