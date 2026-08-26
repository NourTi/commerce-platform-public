import { describe, expect, it } from "vitest";
import { referenceFurnitureBlueprint } from "@shared/forge";
import { evaluateConfiguration } from "./domain";

describe("Forge configuration engine", () => {
  it("rejects an invalid power rail / worktop width combination", () => {
    const result = evaluateConfiguration(referenceFurnitureBlueprint, {
      width: "120",
      depth: "75",
      timber: "oak",
      base: "a_frame",
      cable: "power_rail",
      finish: "natural",
    });

    expect(result.isValid).toBe(false);
    expect(result.issues).toContainEqual(
      expect.objectContaining({
        field: "width",
        code: "RULE_VIOLATION",
        message: "Integrated power rail requires a 160 cm or 200 cm worktop.",
      }),
    );
    expect(result.priceTrace).toBeNull();
  });

  it("produces a reproducible price trace and deposit for a valid configuration", () => {
    const selections = {
      width: "160",
      depth: "75",
      timber: "walnut",
      base: "floating_frame",
      cable: "power_rail",
      finish: "smoked",
    };
    const first = evaluateConfiguration(referenceFurnitureBlueprint, selections);
    const second = evaluateConfiguration(referenceFurnitureBlueprint, selections);

    expect(first.isValid).toBe(true);
    expect(first.priceTrace).toMatchObject({
      totalCents: 212500,
      depositCents: 85000,
      leadTimeDays: 33,
      rulesVersion: "oak-line-rules@1.0.0",
    });
    expect(first.fingerprint).toBe(second.fingerprint);
  });
});
