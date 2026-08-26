import { describe, expect, it } from "vitest";
import { buildVariantCombinations } from "./variantCombinations";

describe("buildVariantCombinations", () => {
  it("builds deterministic cross-option variants with display titles and safe SKU suffixes", () => {
    const result = buildVariantCombinations({ Color: ["Orange", "Lemon"], Size: ["100 g", "200 g"] });

    expect(result).toHaveLength(4);
    expect(result).toContainEqual({ title: "Orange / 100 g", skuSuffix: "ORANGE-100-G", options: { Color: "Orange", Size: "100 g" } });
    expect(result).toContainEqual({ title: "Lemon / 200 g", skuSuffix: "LEMON-200-G", options: { Color: "Lemon", Size: "200 g" } });
  });

  it("rejects overly large Cartesian products", () => {
    expect(() => buildVariantCombinations({ A: Array.from({ length: 9 }, (_, index) => `a${index}`), B: Array.from({ length: 9 }, (_, index) => `b${index}`) })).toThrow("64");
  });
});
