# Algeria-first full-stack commerce architecture

## Commercial boundary

This product is a **multi-tenant merchant platform**, not a payment marketplace or merchant of record. Every store owns its payment account, delivery relationship, legal obligations, and customer funds. The platform provides the system of record for storefronts, orders, payment states, cash-on-delivery settlement, fulfilment, return/refund workflows, and event history.

The first online adapter is `CHARGILY_PAY`. It must remain one implementation of a provider capability rather than a dependency of order code. Native methods `CASH_ON_DELIVERY` and `BANK_TRANSFER` are first-class payment methods, not temporary placeholders.

## Core state model

| Aggregate | States and invariant |
|---|---|
| Order | `AWAITING_PAYMENT`, `PAYMENT_REVIEW`, `CONFIRMED`, `FULFILMENT_IN_PROGRESS`, `SHIPPED`, `DELIVERED`, `CANCELLED`, `RETURNED`, `REFUNDED`. Payment and delivery status stay separate. |
| Payment attempt | `PENDING`, `PROCESSING`, `PAID`, `FAILED`, `CANCELED`, `AWAITING_REVIEW`, `EXPIRED`, `REFUNDED`, `PARTIALLY_REFUNDED`. Only a verified provider event or authorised merchant operation can finalise it. |
| Cash settlement | `NOT_APPLICABLE`, `EXPECTED`, `COLLECTED_BY_CARRIER`, `REMITTED_TO_MERCHANT`, `FAILED_DELIVERY`, `RETURNED_TO_SENDER`, `DISPUTED`. Delivery is not proof of cash remittance. |
| Fulfilment | `UNFULFILLED`, `PARTIALLY_FULFILLED`, `FULFILLED`, `CANCELLED`, `RETURNED`. Shipment tracking adds carrier-specific detail without overriding the fulfilment record. |
| Provider event | `RECEIVED`, `PROCESSED`, `IGNORED`, `FAILED`. Provider event IDs are unique by provider/store; raw payload digest and signature result are retained for audit and safe replay. |

## Capability interfaces

```text
PaymentProvider
  createCheckout(order, customer, returnUrls) -> provider checkout URL + external ID
  verifyWebhook(rawBody, headers) -> normalised provider event
  refund(payment, amount) -> provider refund reference

DeliveryProvider
  quote(address, parcels) -> delivery options
  createShipment(order, chosenOption) -> carrier parcel + label/tracking reference
  verifyWebhook(rawBody, headers) -> normalised tracking event

NotificationProvider
  send(template, recipient, locale, data) -> provider message reference
  verifyWebhook(rawBody, headers) -> delivery or suppression event
```

The order service works only with normalised records. It cannot read provider secrets, trust browser redirects, or infer payment success from a URL.

## First-release payment sequence

1. Checkout captures a customer contact and delivery address, calculates configured tax and delivery rates, validates inventory, and creates an immutable order snapshot plus payment attempt.
2. For cash on delivery, the order enters `PAYMENT_REVIEW` / `EXPECTED` settlement and awaits merchant confirmation before dispatch.
3. For bank transfer, the order enters `AWAITING_REVIEW`; a merchant can approve or reject the supplied transfer reference.
4. For Chargily, the server creates a hosted checkout with the internal order ID as metadata. The buyer is redirected to the provider URL.
5. A raw-body `checkout.paid` webhook is HMAC-verified, deduplicated, persisted, and atomically transitions the payment attempt to `PAID` and the order to `CONFIRMED`.
6. Browser success/failure pages only show current server state; they never mutate order status.

## Data-model additions

| Domain | Required records |
|---|---|
| Customer | Store-scoped customer profile, password/account identity, addresses, notification consent, customer-session / recovery tokens. |
| Payment | Store payment configuration, payment attempt, payment event, payment refund, bank-transfer evidence/reference. |
| Delivery | Delivery zones/rates, delivery option snapshot, fulfilment, shipment, shipment event, cash settlement. |
| Tax | Store tax settings, order tax line snapshot, invoice reference. |
| Security | Store audit event, webhook delivery log, integration health, alert configuration. |
| Plans | Store plan, feature entitlement, subscription record, plan event. |

## Secrets and activation

Merchant payment and delivery configuration is stored as non-secret identifiers and status only. API keys, webhook keys, and tokens are configured server-side through managed secrets. A store cannot activate an online payment method until its adapter health check and signed webhook test succeed.

## Scope honesty

The system will record tax rules and invoices chosen by the merchant. It will not claim automatic tax filing, legal compliance, or carrier contracts without an activated merchant provider account and jurisdiction-specific review.
