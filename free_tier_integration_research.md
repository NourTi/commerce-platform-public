# Free-tier integration assessment

## Selected transactional-email provider: Mailjet

The supplied free-for-dev directory lists Mailjet’s free tier as **6,000 emails per month**, capped at **200 emails per day**. Mailjet’s official materials state that a sender may be a manually validated sender address or a validated domain, and that a sender address/domain must be verified before sending. This permits the configured Yahoo address to be used without purchasing a domain, once Mailjet exposes it as active through the same account’s API.

Mailjet API credentials are validated by a read-only request to `GET https://api.mailjet.com/v3/REST/sender` using HTTP Basic authentication. The application must treat a successful API response as only a credential check; it may enable provider delivery only when the configured sender appears with an active/verified status.

## Not selected: alternatives and payments

Brevo was considered because the directory lists 9,000 emails/month and 300/day. However, Brevo’s own transactional-email instructions call for a configured sender and domain authentication, so it does not eliminate the user’s concern about domain setup. Resend’s official documentation explicitly requires an owned and verified domain, so it was not selected.

The directory’s payment/billing entries are billing or platform tools, not an Algeria-compatible merchant-owned payment gateway. No free-tier listing was selected to replace the platform’s live native COD/bank-transfer flows or the existing credential-gated Chargily boundary.

## Carrier-operation assessment

The supplied directory does not identify a carrier-label or shipment-tracking provider suitable for this platform. Its relevant commerce entry is Commerce Layer, which is an order and catalog commerce API with a free developer allocation; it is not a carrier network, label-purchase service, or tracking-event source.[1]

Easyship was considered separately as a representative multi-carrier API. Its official developer page describes a free account, a 14-day trial, and API capability for rates, labels, tracking, and webhooks. It also describes connecting merchant-owned carrier accounts for negotiated rates and label generation.[8] This is not a safe zero-setup replacement for the existing manual delivery workflow: Algeria-specific carrier coverage has not been verified, no merchant account or carrier documentation has been supplied, and its trial or pay-as-you-go boundary does not meet the requested free-tier-only default.

| Candidate | Assessment | Decision |
|---|---|---|
| Commerce Layer in the supplied directory | Commerce/order API; does not provide carrier labels or delivery events. | Not a carrier integration candidate. |
| Easyship, evaluated separately | Multi-carrier API, but requires an account and a carrier/billing decision; Algeria carrier support is unverified. | Not integrated. |
| Existing manual shipment records | Merchant enters shipment and tracking reference without purchasing labels or querying a carrier. | Retained as the truthful live workflow. |

No carrier service is activated. A future adapter requires an explicit merchant choice, provider documentation proving Algeria-carrier support, merchant-owned credentials/billing authorization, and webhook verification before the product can claim live labels or tracking.

## Mailjet delivery-event webhooks: prepared, not activated

Mailjet can POST grouped JSON event objects to an account-configured callback URL. It documents `sent`, `bounce`, `blocked`, and `spam` among its events; a non-`200 OK` response is retried every 30 seconds for up to 24 hours. Mailjet recommends an HTTPS callback URL protected with basic authentication.[9] [10]

The platform must not treat Mailjet's send API acceptance as recipient delivery. Its prepared callback route can map a matching `sent` event to `DELIVERED` only after it receives a Mailjet callback tied to the recorded provider message ID. This event represents destination-server acceptance, not an inbox-read guarantee. Bounce, blocked, and spam events map to notification suppression and must not silently erase an order or customer record.

Activation requires the account owner to deliberately register the deployed HTTPS endpoint in Mailjet’s Event Tracking settings, using a new dedicated callback credential rather than either Mailjet API key. No callback URL has been configured and no delivery, bounce, or complaint event is represented as received.

## Sources

1. https://github.com/ripienaar/free-for-dev
2. https://documentation.mailjet.com/hc/en-us/articles/360042759253-How-to-add-a-sender-address
3. https://documentation.mailjet.com/hc/en-us/articles/37251169295003--Quick-Start-with-Mailjet
4. https://www.mailjet.com/pricing/
5. https://developers.brevo.com/docs/send-a-transactional-email
6. https://help.brevo.com/hc/en-us/articles/7924908994450-Send-transactional-emails-using-Brevo-SMTP
7. https://resend.com/docs/dashboard/domains/introduction
8. https://www.easyship.com/developers
9. https://dev.mailjet.com/email/guides/webhooks/
10. https://documentation.mailjet.com/hc/en-us/articles/360043578154-Event-Tracking-API
