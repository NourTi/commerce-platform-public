import { z } from "zod";

export const catalogCsvHeaders = [
  "handle",
  "title",
  "subtitle",
  "description",
  "category",
  "status",
  "sku",
  "variant_title",
  "price",
  "inventory",
  "low_stock_threshold",
  "barcode",
  "color",
  "options_json",
] as const;

export type CatalogCsvIssue = { row: number; error: string };
export type ParsedCatalogCsvRow = {
  row: number;
  handle: string;
  title: string;
  subtitle: string;
  description: string;
  category: string;
  status: "DRAFT" | "PUBLISHED" | "ARCHIVED";
  sku: string;
  variantTitle: string;
  priceCents: number;
  inventoryQty: number;
  lowStockThreshold: number;
  barcode: string | null;
  options: Record<string, string>;
};

const rowSchema = z.object({
  handle: z.string().trim().min(3).max(128).regex(/^[a-z0-9-]+$/),
  title: z.string().trim().min(2).max(255),
  subtitle: z.string().trim().min(2).max(255),
  description: z.string().trim().min(8).max(4000),
  category: z.string().trim().min(2).max(64),
  status: z.enum(["DRAFT", "PUBLISHED", "ARCHIVED"]),
  sku: z.string().trim().min(3).max(128).regex(/^[A-Z0-9-]+$/),
  variantTitle: z.string().trim().min(2).max(255),
  priceCents: z.number().int().min(0).max(10_000_000),
  inventoryQty: z.number().int().min(0).max(1_000_000),
  lowStockThreshold: z.number().int().min(0).max(1_000_000),
  barcode: z.string().trim().min(2).max(128).nullable(),
  options: z.record(z.string().min(1).max(64), z.string().min(1).max(128)),
});

export function parseCsvTable(source: string): string[][] {
  const rows: string[][] = [];
  let row: string[] = [];
  let cell = "";
  let quoted = false;
  for (let index = 0; index < source.length; index += 1) {
    const character = source[index]!;
    if (quoted) {
      if (character === '"' && source[index + 1] === '"') {
        cell += '"';
        index += 1;
      } else if (character === '"') quoted = false;
      else cell += character;
      continue;
    }
    if (character === '"') quoted = true;
    else if (character === ",") {
      row.push(cell);
      cell = "";
    } else if (character === "\n") {
      row.push(cell);
      if (row.some(value => value.trim())) rows.push(row);
      row = [];
      cell = "";
    } else if (character !== "\r") cell += character;
  }
  row.push(cell);
  if (row.some(value => value.trim())) rows.push(row);
  return rows;
}

function parsePrice(value: string) {
  if (!/^\d+(?:\.\d{1,2})?$/.test(value.trim())) return null;
  return Math.round(Number(value) * 100);
}

function parseOptions(value: string, color: string) {
  if (!value.trim()) return color.trim() ? { color: color.trim() } : {};
  const parsed: unknown = JSON.parse(value);
  if (!parsed || Array.isArray(parsed) || typeof parsed !== "object") throw new Error("options_json must be a JSON object.");
  const options = Object.fromEntries(Object.entries(parsed).map(([key, item]) => [key, String(item).trim()]));
  return color.trim() ? { ...options, color: color.trim() } : options;
}

export function parseCatalogCsv(source: string): { rows: ParsedCatalogCsvRow[]; issues: CatalogCsvIssue[] } {
  const table = parseCsvTable(source.replace(/^\uFEFF/, ""));
  if (!table.length) return { rows: [], issues: [{ row: 1, error: "CSV is empty." }] };
  const header = table[0]!.map(value => value.trim());
  const missing = catalogCsvHeaders.filter(item => !header.includes(item));
  if (missing.length) return { rows: [], issues: [{ row: 1, error: `Missing columns: ${missing.join(", ")}.` }] };
  const column = Object.fromEntries(header.map((name, index) => [name, index])) as Record<(typeof catalogCsvHeaders)[number], number>;
  const rows: ParsedCatalogCsvRow[] = [];
  const issues: CatalogCsvIssue[] = [];
  table.slice(1).forEach((cells, index) => {
    const row = index + 2;
    const value = (name: (typeof catalogCsvHeaders)[number]) => (cells[column[name]] ?? "").trim();
    try {
      const priceCents = parsePrice(value("price"));
      if (priceCents === null) throw new Error("price must be a non-negative decimal amount.");
      const inventoryQty = Number(value("inventory"));
      const lowStockThreshold = Number(value("low_stock_threshold") || "0");
      if (!Number.isInteger(inventoryQty) || inventoryQty < 0) throw new Error("inventory must be a non-negative integer.");
      if (!Number.isInteger(lowStockThreshold) || lowStockThreshold < 0) throw new Error("low_stock_threshold must be a non-negative integer.");
      const parsed = rowSchema.parse({
        handle: value("handle"), title: value("title"), subtitle: value("subtitle"), description: value("description"), category: value("category"), status: value("status"), sku: value("sku"), variantTitle: value("variant_title"), priceCents, inventoryQty, lowStockThreshold, barcode: value("barcode") || null, options: parseOptions(value("options_json"), value("color")),
      });
      rows.push({ row, ...parsed });
    } catch (error) {
      const message = error instanceof z.ZodError ? error.issues[0]?.message ?? "Invalid catalog row." : error instanceof Error ? error.message : "Invalid catalog row.";
      issues.push({ row, error: message });
    }
  });
  return { rows, issues };
}
