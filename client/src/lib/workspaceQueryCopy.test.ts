import { describe, expect, it } from "vitest";
import { workspaceQueryCopy } from "./workspaceQueryCopy";

describe("workspace query copy", () => {
  it("provides complete retained-data feedback for every supported locale", () => {
    for (const locale of ["en", "fr", "ar"] as const) {
      const text = workspaceQueryCopy[locale];
      expect(text.refresh).not.toHaveLength(0);
      expect(text.refreshing).not.toHaveLength(0);
      expect(text.refreshFailed).not.toHaveLength(0);
      expect(text.empty).not.toHaveLength(0);
    }
  });
});
