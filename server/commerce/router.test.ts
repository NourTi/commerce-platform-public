import { describe, expect, it } from "vitest";
import { appRouter } from "../routers";
import type { TrpcContext } from "../_core/context";

function context(role: "user" | "admin" | null): TrpcContext {
  return {
    user: role ? {
      id: 99,
      openId: `commerce-${role}`,
      email: "operator@example.com",
      name: "Commerce Operator",
      loginMethod: "manus",
      role,
      createdAt: new Date(),
      updatedAt: new Date(),
      lastSignedIn: new Date(),
    } : null,
    req: {} as TrpcContext["req"],
    res: {} as TrpcContext["res"],
  };
}

describe("Commerce procedure guards", () => {
  it("does not permit a non-admin account to access the admin overview", async () => {
    await expect(appRouter.createCaller(context("user")).commerce.adminOverview()).rejects.toMatchObject({ code: "FORBIDDEN" });
  });

  it("does not permit an anonymous cart to create an order", async () => {
    await expect(appRouter.createCaller(context(null)).commerce.checkout({
      cartId: "cart_12345678",
      email: "buyer@example.com",
      shippingMethod: "STANDARD",
    })).rejects.toMatchObject({ code: "UNAUTHORIZED" });
  });

  it("rejects an invalid line quantity before the public cart mutation reaches storage", async () => {
    await expect(appRouter.createCaller(context(null)).commerce.addCartLine({
      cartId: "cart_12345678",
      variantId: "var_test",
      quantity: 0,
    })).rejects.toMatchObject({ code: "BAD_REQUEST" });
  });

  it("requires authentication before a tenant retention policy can be updated", async () => {
    await expect(appRouter.createCaller(context(null)).commerce.workspace.updateDataPolicy({
      storeId: "store_123",
      customerDataRetentionDays: 365,
      legalReviewAcknowledged: false,
    })).rejects.toMatchObject({ code: "UNAUTHORIZED" });
  });
});
