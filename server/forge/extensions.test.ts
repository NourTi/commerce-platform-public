import { describe, expect, it } from "vitest";
import { referenceFurnitureBlueprint } from "@shared/forge";
import { evaluateConfiguration } from "./domain";
import { buildProductionPassportSpecification, mockProductionConnector } from "./extensions";

describe("Forge extension contracts", () => {
  it("preserves an immutable production snapshot and delivers a deterministic connector reference", async () => {
    const evaluation = evaluateConfiguration(referenceFurnitureBlueprint, {
      width: "160",
      depth: "75",
      timber: "oak",
      base: "a_frame",
      cable: "grommet",
      finish: "natural",
    });
    if (!evaluation.priceTrace) throw new Error("Expected a price trace");

    const snapshot = buildProductionPassportSpecification({
      blueprint: referenceFurnitureBlueprint,
      configurationId: "cfg_reference",
      selections: evaluation.resolvedSelections,
      priceTrace: evaluation.priceTrace,
      approvedQuote: "FQ-2026-ABC123",
      releasedAt: "2026-08-24T00:00:00.000Z",
    });
    evaluation.resolvedSelections.width = "200";
    evaluation.priceTrace.totalCents = 1;

    expect(snapshot.selections.width).toBe("160");
    expect(snapshot.priceTrace.totalCents).toBe(136000);

    const receipt = await mockProductionConnector.deliver({
      eventId: "evt_reference",
      idempotencyKey: "production-passport:cfg_reference:fingerprint",
      payload: snapshot,
    });
    expect(receipt).toMatchObject({
      connectorId: "mock-production",
      externalReference: "MRP-MOCK-CFG_REFERENCE",
      idempotencyKey: "production-passport:cfg_reference:fingerprint",
    });
  });
});
