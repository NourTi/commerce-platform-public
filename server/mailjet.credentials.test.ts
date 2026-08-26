import { describe, expect, it } from "vitest";

describe.runIf(process.env.MAILJET_CREDENTIAL_CHECK === "true")("Mailjet credentials", () => {
  it("can read the configured sender list without sending email", async () => {
    const apiKey = process.env.MAILJET_API_KEY;
    const secretKey = process.env.MAILJET_SECRET_KEY;
    expect(apiKey).toBeTruthy();
    expect(secretKey).toBeTruthy();

    const authorization = `Basic ${Buffer.from(`${apiKey}:${secretKey}`).toString("base64")}`;
    const response = await fetch("https://api.mailjet.com/v3/REST/sender", {
      headers: { Authorization: authorization },
    });

    expect(response.status).toBe(200);
    const payload = await response.json() as { Data?: unknown[] };
    expect(Array.isArray(payload.Data)).toBe(true);
    const senderEmail = process.env.MAILJET_SENDER_EMAIL?.toLowerCase();
    expect(senderEmail).toBeTruthy();
    const sender = payload.Data?.find(item => typeof item === "object" && item !== null && "Email" in item && String(item.Email).toLowerCase() === senderEmail) as { Status?: string } | undefined;
    expect(sender).toBeTruthy();
    expect(String(sender?.Status ?? "").toLowerCase()).toMatch(/active|approved|verified/);
  }, 15_000);
});
