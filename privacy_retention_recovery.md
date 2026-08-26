# Privacy, Retention, and Recovery Operating Boundary

This platform provides **self-service account-data export** and a **manual erasure-review workflow**. It does not automatically delete customer, order, tax, payment, stock, audit, or notification records. A merchant remains responsible for selecting retention periods, confirming the lawful basis for retention, and obtaining local legal guidance before fulfilling a deletion request.

## Customer privacy requests

| Customer action | Current platform behavior | Delivery / deletion boundary |
|---|---|---|
| Download account data | The signed-in customer can download a JSON file directly in their browser. It contains the account profile, linked customer profiles, saved addresses, linked orders, and recorded privacy requests. | The file is not sent by email and is not placed in a platform-hosted download queue. |
| Request deletion | The customer creates an `ERASURE` request with an optional note. Duplicate requests already marked `REQUESTED` or `UNDER_REVIEW` are prevented. | No profile, address, order, payment, or account record is deleted by this action. |
| Review request | A platform administrator can mark the request `UNDER_REVIEW`, `COMPLETED`, or `REJECTED` and retain a reviewer note. | Marking `COMPLETED` records the review outcome only. It is **not** an automated erasure command. |

> A completed review is not evidence that every commercial record was erased. The reviewer must separately document what was removed, anonymised, retained, or unavailable and why.

## Manual review procedure

An authorised administrator should first confirm that the request belongs to the signed-in account and read the customer’s request note. They should use the exported data only to identify the affected records, not to infer that all historical records are safe to remove. Orders, payment-review records, shipment records, tax snapshots, stock movements, refunds, audit trails, and notification records can be needed for accounting, fraud prevention, customer-service disputes, or legal obligations.

Before any manual data change, record the decision in the administrator review note. The note should state the scope reviewed, the reason for any retained records, the approving person, and the date. If erasure is approved, use a separately approved, tenant-aware operational procedure to minimise or anonymise eligible personal fields while preserving the integrity of retained commercial records. Do not change immutable stock, audit, payment, or order ledgers merely to satisfy a UI request.

## Retention rules in this release

The application deliberately does **not** hard-code jurisdictional retention periods, run scheduled deletion jobs, or promise account recovery by email. This avoids silently applying an incorrect rule across Algerian merchants, cross-border merchants, or merchants with different accounting obligations. Each merchant must maintain a written retention schedule outside this codebase and provide it to their administrators.

Owners and Managers can now record the merchant-selected customer, order, and audit retention windows, policy reference, recovery-runbook reference, most recent recovery-test date, acknowledgement, and operational note in **Commerce setup**. This is a tenant-scoped operational record, not a legal-policy validator or a background deletion engine. It must never be used to claim that a backup exists or that recovery was completed without independent evidence.

| Record category | Application status | Operational rule in this release |
|---|---|---|
| Customer account, customer profile, saved address | Exportable; erasure request can be reviewed. | Do not automatically erase. Process only after documented identity and retention review. |
| Orders, tax snapshots, payments, refunds, fulfilment | Exportable when linked to the customer. | Retain or minimise only under the merchant’s documented accounting and legal policy. |
| Inventory movements and audit records | Not customer-download content. | Treat as integrity records; do not modify through privacy controls. |
| Transactional notification records | New order notifications may be queued, sent, or failed through the configured Mailjet sender. | Treat provider acceptance as `SENT`, not recipient delivery; do not infer delivery, bounce, complaint, or recovery-email status without provider events. |

## Recovery and change control

Code recovery and customer-data recovery are separate concerns. A saved project checkpoint can restore application code and configuration, but it does **not** restore database rows, object-storage files, payment-provider events, or external merchant systems. The current product has no automated database-backup orchestration, automated retention jobs, or email-based account recovery.

Before any high-impact privacy action, an operator should capture the request identifier, reviewer note, affected store/customer identifiers, and a secure export of the data that is legitimately retained for the task. Merchants need an independently managed database-backup and restore process suitable for their own operational and regulatory needs. Test that procedure outside production before relying on it.

If application code needs to be reverted, use a recorded project checkpoint rather than attempting destructive source-control recovery. If customer data is lost or corrupted, stop further writes, identify the affected tenant, preserve relevant logs, and use the merchant’s approved database-recovery process. This release does not claim to restore customer data automatically.
