import type { Express } from "express";
import { and, eq } from "drizzle-orm";
import { commerceProducts, commerceStores } from "../../drizzle/schema";
import { getDb } from "../db";

function escapeXml(value: string) {
  return value.replace(/[<>&'\"]/g, character => ({ "<": "&lt;", ">": "&gt;", "&": "&amp;", "'": "&apos;", '"': "&quot;" })[character] ?? character);
}

export function registerCommerceSeoRoutes(app: Express) {
  app.get("/sitemap.xml", async (req, res) => {
    try {
      const db = await getDb();
      if (!db) throw new Error("Database unavailable");
      const stores = await db.select({ id: commerceStores.id, handle: commerceStores.handle, updatedAt: commerceStores.updatedAt }).from(commerceStores).where(eq(commerceStores.status, "ACTIVE"));
      const products = stores.length ? await db.select({ storeId: commerceProducts.storeId, handle: commerceProducts.handle, updatedAt: commerceProducts.updatedAt }).from(commerceProducts).where(and(eq(commerceProducts.status, "PUBLISHED"))) : [];
      const baseUrl = `${req.protocol}://${req.get("host")}`;
      const entries = [
        { loc: `${baseUrl}/`, updatedAt: null },
        ...stores.map(store => ({ loc: `${baseUrl}/s/${encodeURIComponent(store.handle)}`, updatedAt: store.updatedAt })),
        ...products.map(product => ({ loc: `${baseUrl}/store/products/${encodeURIComponent(product.handle)}`, updatedAt: product.updatedAt })),
      ];
      const xml = `<?xml version="1.0" encoding="UTF-8"?>\n<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">\n${entries.map(entry => `  <url><loc>${escapeXml(entry.loc)}</loc>${entry.updatedAt ? `<lastmod>${entry.updatedAt.toISOString().slice(0, 10)}</lastmod>` : ""}</url>`).join("\n")}\n</urlset>`;
      res.type("application/xml").status(200).send(xml);
    } catch {
      res.status(503).type("text/plain").send("Sitemap is temporarily unavailable.");
    }
  });
}
