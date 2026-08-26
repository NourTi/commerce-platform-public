import { describe, expect, it } from "vitest";
import { merchantCommercialCopy, merchantCommercialDefaults, merchantCommercialDirection, merchantInvoiceStatus } from "./merchantCommercialCopy";

describe("merchant commerce configuration copy", () => {
  it("provides full Algeria-first setup controls in every supported locale", () => {
    for (const locale of ["en", "fr", "ar"] as const) {
      const text = merchantCommercialCopy[locale];
      expect(text.paymentsBody).not.toHaveLength(0);
      expect(text.codHint).not.toHaveLength(0);
      expect(text.bankHint).not.toHaveLength(0);
      expect(text.deliveryReady(2)).not.toHaveLength(0);
      expect(text.taxReady(2)).not.toHaveLength(0);
    }
  });

  it("uses locale-specific starter values, invoice labels, and RTL direction", () => {
    expect(merchantCommercialDefaults.fr.delivery).toEqual({ zoneName: "Algérie", rateName: "Livraison standard" });
    expect(merchantCommercialDefaults.ar.tax.name).toBe("ضريبة قياسية");
    expect(merchantInvoiceStatus("fr", "PENDING_PAYMENT")).toBe("En attente de référence de virement");
    expect(merchantInvoiceStatus("ar", "PAID")).toBe("مُعتمد يدوياً");
    expect(merchantCommercialDirection("ar")).toBe("rtl");
    expect(merchantCommercialDirection("fr")).toBe("ltr");
  });
});
