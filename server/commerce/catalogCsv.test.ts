import { describe, expect, it } from "vitest";
import { parseCatalogCsv } from "./catalogCsv";

const header = "handle,title,subtitle,description,category,status,sku,variant_title,price,inventory,low_stock_threshold,barcode,color,options_json";

describe("parseCatalogCsv", () => {
  it("parses quoted values and option JSON into a validated catalog row", () => {
    const csv = `${header}\ncitrus-chews,Citrus Chews,Orange candy,Chewy citrus candies in a sealed retail pouch.,Snacks,PUBLISHED,CITRUS-ORANGE,Orange pouch,7.50,42,5,123456789,Orange,"{""finish"":""Matte"",""size"":""200g""}"`;
    const result = parseCatalogCsv(csv);

    expect(result.issues).toEqual([]);
    expect(result.rows[0]).toMatchObject({ handle: "citrus-chews", priceCents: 750, inventoryQty: 42, lowStockThreshold: 5, options: { color: "Orange", finish: "Matte", size: "200g" } });
  });

  it("reports row-level errors while retaining valid rows", () => {
    const csv = `${header}\nvalid-snack,Valid snack,Snack subtitle,A sufficiently detailed snack description.,Snacks,DRAFT,VALID-SNACK,Default,4.00,2,0,,,{}\ninvalid snack,Invalid,Too short,short,Snacks,PUBLISHED,bad sku,Default,not-a-price,-1,0,,,{}`;
    const result = parseCatalogCsv(csv);

    expect(result.rows).toHaveLength(1);
    expect(result.issues).toHaveLength(1);
    expect(result.issues[0]).toMatchObject({ row: 3 });
  });
});
