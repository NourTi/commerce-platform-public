import { describe, expect, it } from "vitest";
import { auth0TestUtils } from "./auth0";

describe("Auth0 customer-login transaction helpers", () => {
  const transaction = {
    state: "state-value",
    nonce: "nonce-value",
    codeVerifier: "verifier-value",
    returnTo: "/account",
  };
  const secret = "test-session-secret";

  it("signs and verifies the one-time PKCE transaction", () => {
    const encoded = auth0TestUtils.signTransaction(transaction, secret);

    expect(auth0TestUtils.parseTransaction(encoded, secret)).toEqual(transaction);
    expect(auth0TestUtils.parseTransaction(`${encoded}tampered`, secret)).toBeNull();
  });

  it("keeps post-login navigation on local paths", () => {
    expect(auth0TestUtils.safeReturnTo("/account")).toBe("/account");
    expect(auth0TestUtils.safeReturnTo("https://attacker.example")).toBe("/account");
    expect(auth0TestUtils.safeReturnTo("//attacker.example")).toBe("/account");
  });

  it("uses a SHA-256 PKCE challenge", () => {
    expect(auth0TestUtils.codeChallenge("verifier-value")).toBe(
      "GPXfFfmq30W8w5PWMLNtzZR2q9pxnxZ4FkY2A8xIsF4"
    );
  });

  it("namespaces Auth0 customer subjects away from local merchant identities", () => {
    expect(auth0TestUtils.localAuth0OpenId("auth0|customer-123")).toBe(
      "auth0:auth0|customer-123"
    );
    expect(auth0TestUtils.localAuth0OpenId("auth0|customer-123")).not.toBe(
      "customer-123"
    );
  });
});
