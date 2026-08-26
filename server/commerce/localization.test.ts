import { describe, expect, it } from "vitest";
import { money } from "../../client/src/lib/commerce";
import { commerceCopy, translateProductStatus } from "../../client/src/lib/commerceCopy";

describe("commerce localization", () => {
  it("provides complete shell, buyer, merchant, and developer copy for every supported locale", () => {
    for (const locale of ["en", "fr", "ar"] as const) {
      const copy = commerceCopy[locale];
      expect(copy.shell.store).toBeTruthy();
      expect(copy.store.heroBody).toBeTruthy();
      expect(copy.product.addToCart).toBeTruthy();
      expect(copy.cart.checkout).toBeTruthy();
      expect(copy.checkout.createOrder).toBeTruthy();
      expect(copy.admin.catalogTitle).toBeTruthy();
      expect(copy.admin.registry).toHaveLength(6);
      expect(Object.values(copy.admin.placeholders)).toHaveLength(6);
      expect(Object.values(copy.admin.placeholders).every(Boolean)).toBe(true);
      expect(copy.docs.currentContracts).toBeTruthy();
      expect(copy.notFound.goHome).toBeTruthy();
    }
  });

  it("keeps Arabic order statuses and buyer calls to action in Arabic", () => {
    expect(translateProductStatus("ar", "PENDING_PAYMENT")).toBe("بانتظار الدفع");
    expect(commerceCopy.ar.product.addToCart).toBe("أضف إلى السلة");
    expect(commerceCopy.ar.checkout.createOrder).toBe("أنشئ طلبًا بانتظار الدفع");
    expect(commerceCopy.ar.admin.registry[0]).toBe("الكتالوج / منشور");
    expect(commerceCopy.ar.admin.placeholders.title).toBe("ساعة أوربت");
  });

  it("formats the same configured USD amount according to the selected locale", () => {
    const english = money(24500, "en");
    const french = money(24500, "fr");
    const arabic = money(24500, "ar");

    expect(english).toContain("245");
    expect(french).not.toBe(english);
    expect(arabic).not.toBe(english);
  });
});
