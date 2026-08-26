import { describe, expect, it } from "vitest";
import { catalogCsvHeaders, formatCatalogCsv } from "./catalogCsv";

describe("formatCatalogCsv", () => {
  it("exports the default variant with escaped product fields and preserves its option data", () => {
    const result = formatCatalogCsv([{
      handle: "citrus-chews", title: "Citrus, Chews", subtitle: "Pouch", description: "A detailed product description with enough merchant context.", category: "Snacks", status: "PUBLISHED",
      variants: [
        { sku: "CITRUS-ORANGE", title: "Orange", priceCents: 750, inventoryQty: 42, lowStockThreshold: 5, barcode: "12345", options: { color: "Orange", finish: "Matte" }, isDefault: true },
        { sku: "CITRUS-LEMON", title: "Lemon", priceCents: 800, inventoryQty: 10, lowStockThreshold: 2, barcode: null, options: { color: "Lemon" }, isDefault: false },
      ],
    }]);

    expect(result).toContain(catalogCsvHeaders.map(item => `"${item}"`).join(","));
    expect(result).toContain('"Citrus, Chews"');
    expect(result).toContain('"CITRUS-ORANGE"');
    expect(result).toContain('"7.50"');
    expect(result).toContain('"Orange"');
    expect(result).toContain('"{""finish"":""Matte""}"');
    expect(result).not.toContain("CITRUS-LEMON");
  });

  it("omits products that have no sellable variant row", () => {
    expect(formatCatalogCsv([{ handle: "empty-product", title: "Empty product", subtitle: "No variants", description: "A detailed description for an intentionally empty product.", category: "Objects", status: "DRAFT", variants: [] }]).trim()).toBe(catalogCsvHeaders.map(item => `"${item}"`).join(","));
  });
});
