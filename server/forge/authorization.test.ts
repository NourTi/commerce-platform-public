import { describe, expect, it } from "vitest";
import { appRouter } from "../routers";
import type { TrpcContext } from "../_core/context";

describe("Forge authorization", () => {
  it("rejects an unauthenticated workspace request", async () => {
    const caller = appRouter.createCaller({
      user: null,
      req: {} as TrpcContext["req"],
      res: {} as TrpcContext["res"],
    });

    await expect(caller.legacyMadeToOrder.workspace()).rejects.toMatchObject({ code: "UNAUTHORIZED" });
  });
});
