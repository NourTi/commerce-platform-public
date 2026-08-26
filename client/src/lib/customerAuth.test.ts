import { readFileSync } from "node:fs";
import { describe, expect, it } from "vitest";
import { CUSTOMER_AUTH0_LOGIN_HREF } from "./customerAuth";

describe("customer authentication routing", () => {
  it("uses Auth0 for the shared customer sign-in destination", () => {
    expect(CUSTOMER_AUTH0_LOGIN_HREF).toBe("/api/auth0/login?returnTo=%2Faccount");
  });

  it("does not retain a global Manus redirect for unauthenticated requests", () => {
    const main = readFileSync(new URL("../main.tsx", import.meta.url), "utf8");
    expect(main).not.toContain("startLogin()");
    expect(main).not.toContain("redirectToLoginIfUnauthorized");
  });

  it("routes every public customer sign-in surface through the shared Auth0 destination", () => {
    for (const file of ["../components/ShopShell.tsx", "../pages/PlatformHome.tsx", "../pages/CustomerAccount.tsx"]) {
      const source = readFileSync(new URL(file, import.meta.url), "utf8");
      expect(source).toContain("CUSTOMER_AUTH0_LOGIN_HREF");
      expect(source).not.toContain("startLogin");
    }
  });

  it("does not treat a legacy local session as a customer Auth0 session", () => {
    const account = readFileSync(new URL("../pages/CustomerAccount.tsx", import.meta.url), "utf8");
    expect(account).toContain('user?.loginMethod === "auth0"');
    expect(account).toContain("!customerUser ?");
  });
});
