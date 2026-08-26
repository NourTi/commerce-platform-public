import { describe, expect, it } from "vitest";
import { appRouter } from "../routers";
import type { TrpcContext } from "../_core/context";

describe("Forge public API", () => {
  it("evaluates the public reference blueprint without exposing database internals", async () => {
    const ctx = { user: null, req: {} as TrpcContext["req"], res: {} as TrpcContext["res"] };
    const caller = appRouter.createCaller(ctx);
    const result = await caller.legacyMadeToOrder.evaluateReference({
      selections: {
        width: "160",
        depth: "75",
        timber: "oak",
        base: "a_frame",
        cable: "grommet",
        finish: "natural",
      },
    });

    expect(result.isValid).toBe(true);
    expect(result.priceTrace?.totalCents).toBe(136000);
    expect(result).not.toHaveProperty("databaseUrl");
  });
});
