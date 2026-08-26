import { describe, expect, it } from "vitest";
import { operationsMonitorCopy } from "./operationsMonitorCopy";

describe("operations monitor copy", () => {
  it("provides complete English, French, and Arabic provider-state boundaries", () => {
    for (const locale of ["en", "fr", "ar"] as const) {
      const text = operationsMonitorCopy[locale];
      expect(text.trigger).not.toHaveLength(0);
      expect(text.queued).not.toHaveLength(0);
      expect(text.providerAccepted).not.toHaveLength(0);
      expect(text.providerFailed).not.toHaveLength(0);
      expect(text.boundary).toContain("Mailjet");
    }
  });
});
