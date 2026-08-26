# Merchant Launch Readiness

This guide distinguishes features that are usable without an external provider from features that remain dependent on the merchant’s own provider account, legal policy, or signed-in acceptance testing.

| Capability | Current platform behavior | Merchant action before relying on it |
|---|---|---|
| Cash on Delivery | Native, merchant-owned workflow with order review, fulfilment records, and carrier cash-settlement recording. | Configure delivery zones and rates; define the carrier’s collection process. |
| Bank transfer | Native manual-review workflow; customers submit a transfer reference and merchants approve the payment record. | Enable the method and publish the merchant’s own transfer instructions. |
| Inventory and orders | Tenant-scoped catalog, stock reservations, audit records, shipment records, returns, and manual refund records. | Set catalogue, stock thresholds, tax, delivery, and operating procedures. |
| Customer privacy | Browser-local account export and manual deletion-review requests. Commercial records are not deleted automatically. | Define and record the merchant’s retention policy and independent recovery procedure. |
| Search and localization | Store SEO controls plus English, French, and Arabic RTL customer and merchant flows. | Supply accurate merchant metadata and inspect the final public storefront. |
| Chargily Pay | Shown as a disabled, credential-gated capability. No online checkout is active. | Provide merchant-owned credentials and a supported hosted-checkout connector before activation work begins. |
| Carrier labels and live tracking | Manual carrier shipment details only. No label is purchased and no carrier status is fetched. | Provide a supported carrier account, API documentation, and approval to implement the adapter. |
| Outbound notifications and customer access | New order notifications use the configured Mailjet sender and are marked `SENT` only after provider acceptance. A dedicated-token Mailjet callback route is prepared but no provider event URL is registered, so no delivered/bounced state is live. Customer sign-in is handled by Manus OAuth, not a platform-owned password-recovery flow. | After publication, configure the callback URL with a separate credential before relying on Mailjet destination-server acceptance, bounce, or block events. Change the authentication model explicitly before designing application-owned recovery email. |
| Legal retention and recovery | Store-scoped policy and recovery records document merchant decisions only. | Obtain appropriate legal review and independently validate backup/restoration procedures. |

> **Merchant-owned funds boundary:** The platform records native COD and bank-transfer operations but does not take custody of merchant money, issue payouts, purchase shipping labels, send refunds, or claim external settlement automatically.

Before a production launch, a merchant should test their own configured checkout and fulfilment process in a signed-in session, verify local legal/accounting obligations, and activate only provider integrations they have independently supplied and approved.
