import { describe, expect, it } from "vitest";
import { isAuthorizedMailjetWebhook, processMailjetDeliveryEvents } from "./mailjet";

describe("Mailjet delivery-event webhook safeguards", () => {
  it("requires a separate mailjet basic-auth token and rejects malformed authorization", () => {
    const token = "callback-only-token";
    const authorization = `Basic ${Buffer.from(`mailjet:${token}`).toString("base64")}`;
    expect(isAuthorizedMailjetWebhook(authorization, token)).toBe(true);
    expect(isAuthorizedMailjetWebhook(`Basic ${Buffer.from("mailjet:wrong").toString("base64")}`, token)).toBe(false);
    expect(isAuthorizedMailjetWebhook(`Basic ${Buffer.from(`${token}:mailjet`).toString("base64")}`, token)).toBe(false);
    expect(isAuthorizedMailjetWebhook(undefined, token)).toBe(false);
  });

  it("rejects non-grouped callback payloads before any notification mutation", async () => {
    await expect(processMailjetDeliveryEvents({ event: "sent" })).rejects.toThrow("grouped Mailjet event array");
  });
});
