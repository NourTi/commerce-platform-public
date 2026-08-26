import { describe, expect, it } from "vitest";

const domain = process.env.AUTH0_DOMAIN;
const clientId = process.env.AUTH0_CLIENT_ID;
const clientSecret = process.env.AUTH0_CLIENT_SECRET;
const appBaseUrl = process.env.AUTH0_APP_BASE_URL;

const hasCredentials = Boolean(domain && clientId && clientSecret);

describe.skipIf(!hasCredentials)("Auth0 confidential-client credentials", () => {
  it("are accepted by the Auth0 token endpoint without exposing the secret", async () => {
    const response = await fetch(`https://${domain}/oauth/token`, {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({
        client_id: clientId,
        client_secret: clientSecret,
        grant_type: "client_credentials",
        audience: `https://${domain}/api/v2/`,
      }),
    });

    const payload = (await response.json()) as {
      error?: string;
      error_description?: string;
    };

    // An unauthorized_client response proves Auth0 accepted the credentials but
    // this Regular Web Application has not been granted Management API access.
    // Only invalid_client indicates a bad client ID/secret pair.
    if (payload.error === "invalid_client") {
      throw new Error("Auth0 rejected the configured confidential-client credentials.");
    }

    expect([200, 403]).toContain(response.status);
    expect(payload.error).not.toBe("invalid_client");
  });
});

describe.skipIf(!appBaseUrl)("Auth0 published callback origin", () => {
  it("is an available HTTPS endpoint", async () => {
    const response = await fetch(appBaseUrl!, {
      method: "HEAD",
      redirect: "manual",
    });

    expect(new URL(appBaseUrl!).protocol).toBe("https:");
    expect(response.status).toBeGreaterThanOrEqual(200);
    expect(response.status).toBeLessThan(400);
  });
});
