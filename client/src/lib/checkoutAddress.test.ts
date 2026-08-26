import { describe, expect, it } from "vitest";
import { applySavedAddressToCheckout } from "./checkoutAddress";

describe("applySavedAddressToCheckout", () => {
  it("copies a saved delivery address without overwriting the checkout email", () => {
    const initial = {
      email: "buyer@example.com",
      firstName: "",
      lastName: "",
      line1: "",
      city: "",
      region: "",
      phone: "",
      transferReference: "REF-01",
    };
    const result = {
      ...initial,
      ...applySavedAddressToCheckout(initial, {
        id: "addr_demo",
        label: "Home",
        firstName: "Amel",
        lastName: "Benali",
        line1: "12 Rue Didouche Mourad",
        city: "Alger",
        region: "Alger",
        phone: "+213500000000",
      }),
    };

    expect(result).toMatchObject({
      email: "buyer@example.com",
      transferReference: "REF-01",
      firstName: "Amel",
      lastName: "Benali",
      line1: "12 Rue Didouche Mourad",
      city: "Alger",
      region: "Alger",
      phone: "+213500000000",
    });
  });

  it("normalizes nullable saved fields to editable empty strings", () => {
    const result = applySavedAddressToCheckout(
      { firstName: "Old", lastName: "Name", line1: "Old street", city: "Oran", region: "Oran", phone: "123" },
      { id: "addr_demo", label: null, firstName: "Amel", lastName: "Benali", line1: "12 Rue Didouche Mourad", city: "Alger", region: null, phone: null },
    );

    expect(result.region).toBe("");
    expect(result.phone).toBe("");
  });
});
