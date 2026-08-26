# Algeria-first commerce integration research

## Verified payment baseline

The first live online-payment adapter should target **Chargily Pay V2**, rather than Stripe or PayPal. Its official documentation states that it supports Algerian EDAHABIA and CIB payment methods and returns a hosted checkout URL. The checkout payload supports Arabic, French, and English, supplies a payment state, can collect a shipping address, and provides success/failure return URLs.

Payment state must be driven by the verified webhook, never by the browser return URL. Chargily documents an HTTPS JSON webhook with an HMAC-SHA256 `signature` header and payment events including `checkout.paid`, `checkout.failed`, and `checkout.canceled`. The platform must preserve the raw request body, verify the signature before parsing, process every provider event idempotently, and link its external checkout via internal order metadata.

| Capability | Algeria-first decision |
|---|---|
| Online card checkout | Chargily adapter, merchant-owned account, CIB and EDAHABIA support |
| Payment confirmation | Signed `checkout.*` webhook with durable event log and idempotency key |
| Launch fallback | Native cash on delivery and manual bank transfer, both with explicit settlement states |
| Money movement | Merchant-owned checkout; the platform does not hold funds or make merchant payouts |
| International expansion | Future adapters only; no Stripe or PayPal dependency in core commerce code |

## Delivery research

The delivery layer should be an adapter registry, separate from checkout. Local evidence confirms Yalidine and Maystro expose merchant integrations, but their detailed API contracts require merchant account access or provider confirmation before production activation. The platform will first implement a carrier-independent dispatch, cash collection, tracking, return, and settlement state machine; a carrier adapter then maps provider-specific fields to this record.

| Launch delivery mode | Behaviour |
|---|---|
| Merchant-managed delivery | Merchant records parcel, tracking number, carrier, collection amount, and status manually |
| Carrier integration | Provider adapter creates parcels, receives tracking updates, and stores immutable provider events |
| Cash-on-delivery | Collected, failed delivery, returned, remitted, and disputed amounts remain explicit; “fulfilled” is not treated as “cash settled” |

## Required commercial safeguards

1. Provider secrets remain server-only and are stored separately for each merchant store.
2. Every external event is saved before business-state mutation, checked for duplicate delivery, and replayable by an authorised owner.
3. Tax starts as merchant-configured rates and invoice records; the platform does not claim to file Algerian taxes or replace an accountant.
4. Product availability, delivery price, payment state, refunds, and cash settlement remain server-owned records with an audit trail.

## Sources

1. [Chargily Pay V2 introduction](https://dev.chargily.com/pay-v2/introduction)
2. [Chargily Pay V2 webhook security](https://dev.chargily.com/pay-v2/webhooks)
3. [Chargily Pay V2 checkout object](https://dev.chargily.com/pay-v2/api-reference/checkouts/checkout-object)
4. [Maystro delivery integrations](https://maystro-delivery.com/integration.html)
5. [Yalidine integration overview](https://www.cirtasoft.com/yalidine-plugin/en/)
