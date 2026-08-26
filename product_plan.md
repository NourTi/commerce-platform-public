# EverShop opportunity study: **EverTrade**

## Recommendation

Build **EverTrade**, an extension-native B2B buyer portal for small and midsize wholesalers that already want EverShop’s developer control but cannot adopt it because their buyers purchase as companies, at contract prices, through quick-order, quote, and approval workflows.

This is not a marketplace product and it is not a visual theme. It is an operational layer that turns EverShop’s existing catalog, customer, cart, checkout, promotion, order-management, authentication, GraphQL, and extension capabilities into a credible B2B purchasing workflow. The first release should solve one high-friction task exceptionally well: **a company buyer reorders products at its agreed price, submits the order for approval when required, and reaches normal EverShop checkout without manual sales-entry work.**

> **Cold-eye conclusion.** The market does not need another claim of “all-in-one B2B.” It needs a focused, installable module that removes the adoption blocker between a developer-friendly B2C engine and a wholesaler’s actual buying process. The initial scope must therefore avoid multi-vendor payouts, ERP synchronization, complex credit operations, and unlimited approval hierarchies.

## Evidence and market gap

EverShop’s official documentation positions the platform as a modular TypeScript, React, GraphQL, and PostgreSQL commerce system with catalog, checkout, customer, OMS, promotion, CMS, page builder, and extension mechanisms. Its documented core modules do not include B2B company accounts, account-specific price lists, purchase orders, or quote management.[1] In a live EverShop feature request, a community member explicitly identifies the current B2C/single-merchant focus and requests company accounts, wholesale pricing, purchase orders, tax-exempt profiles, and B2B workflow support.[2]

The demand is not theoretical. Shopify’s B2B baseline includes company records, location-level commercial settings, assigned catalogs, tax exemptions, payment terms, authenticated wholesale access, and reorders.[3] BigCommerce documents buyer-portal quote creation, controlled pricing, shipping, expiry, sales-staff workflow, and conversion to an order.[4] Adobe Commerce extends the baseline to company roles, customer-specific pricing, quick order, negotiable quotes, and purchase-order approvals.[5] These systems establish the direction of travel, but EverTrade should not chase their full enterprise surface area.

Gartner reported that **67%** of 646 B2B buyers surveyed preferred a rep-free experience, while still emphasizing low-friction, context-aware support for buyers who increasingly direct their own purchase flow.[6] This supports the product’s design: self-service first, with a controlled approval or quote handoff rather than a chatbot or seller-replacement story.

| Candidate | Evidence of need | EverShop fit | MVP feasibility | Differentiation | Operational risk | Weighted score / 5 |
|---|---:|---:|---:|---:|---:|---:|
| **EverTrade B2B buyer portal** | 5 | 5 | 4 | 4 | 4 | **4.55** |
| Multi-vendor marketplace | 4 | 5 | 1 | 3 | 1 | 3.20 |
| Returns and refunds experience | 2 | 3 | 4 | 2 | 3 | 2.75 |

The scores are a transparent prioritization judgment, not market-size data. They weight need at 30%, EverShop leverage at 25%, MVP feasibility at 20%, differentiation at 15%, and operational risk at 10%. Returns was screened out because the related EverShop request is closed and the maintainer reports Stripe refund support; a better returns product might still exist, but it is weaker as the initial market wedge.[7]

## Customer, problem, and promise

| Element | Definition |
|---|---|
| **Primary customer** | A brand, manufacturer, distributor, or trade supplier with a small internal commerce team and 5–200 recurring wholesale buyers. They may sell B2C and B2B from one catalog but need different commercial rules. |
| **Primary user** | A purchasing buyer who knows SKUs, expects their own prices, reorders frequently, and may need approval before payment. |
| **Secondary user** | The company approver or merchant operations manager who needs visibility, control, and a clean handoff into the existing order workflow. |
| **Pain** | Reorders, special prices, purchase-order references, and approvals force manual email, spreadsheets, PDF quotes, or expensive enterprise platforms. EverShop cannot currently package this workflow as a native company-account experience. |
| **Promise** | “Give trade buyers the speed of self-service without giving up account pricing, internal control, or your existing EverShop operation.” |

## The MVP: what it does—and what it refuses to do

The MVP is intentionally narrow. A buyer logs in, is resolved to a company, sees only the company’s eligible products and prices, builds a multi-line order quickly by SKU or search, and either checks out or submits an approval request. The approver can approve or reject one request level. When approved, the buyer returns to standard checkout, where the approved commercial terms are retained as an immutable snapshot on the eventual order.

| Included in MVP | Explicitly deferred |
|---|---|
| Company account, status, addresses, tax-exemption flag, and payment-term metadata | Multi-vendor onboarding, commission, split orders, payouts, or vendor dashboards |
| Buyer, company-admin, and approver roles | Unlimited or branching approval trees |
| Company price lists at product or variant level | ERP, PIM, accounting, or EDI synchronization |
| SKU quick order, CSV-free bulk entry, and reorder-from-history | Credit-limit accounting and invoice collection |
| One-step requisition approval and purchase-order reference | AI agent, dynamic negotiation, or autonomous pricing |
| Quote request with merchant-side draft/accept/decline flow | Full PDF quote designer and attachment workflow |
| Storefront and admin pages plus GraphQL access | Standalone headless frontend or a separate backend service |

**Why no CSV upload in the first build?** Quick order proves whether buyers need to assemble a multi-line request; CSV import adds parsing, validation, preview, mapping, and recovery complexity. It belongs in the next release after the core price and approval logic is trusted.

## Information architecture

EverTrade has three contexts. The **buyer portal** presents catalog access, quick order, requisitions, quotes, reorders, and account details. The **approver workspace** presents requests awaiting decision, detail comparison, and approval history. The **merchant control area** governs companies, members, price lists, approval rules, and quote decisions.

| Surface | Primary routes | Decision it supports |
|---|---|---|
| Buyer portal | `/trade`, `/trade/quick-order`, `/trade/reorders`, `/trade/requests`, `/trade/account` | What can I buy, at what price, and what needs action? |
| Approver workspace | `/trade/approvals`, `/trade/approvals/:id` | Should this request move forward? |
| Merchant admin | `/admin/trade/companies`, `/admin/trade/price-lists`, `/admin/trade/quotes`, `/admin/trade/settings` | Which companies buy, on what terms, and under what controls? |

The portal should use a dense, operational layout rather than a lifestyle storefront. SKU search, availability, agreed price, quantity, and line total must remain visible. The merchant admin should extend EverShop rather than mimic a separate SaaS dashboard.

## Technical structure

EverTrade should be a first-class EverShop extension, installed under `extensions/evertrade-b2b/`. This aligns with EverShop’s documented extension and module model, where functionality can be registered at bootstrap and exposed through pages, GraphQL, REST, hooks, events, middleware, and theme components.[1] The extension must not modify EverShop core files.

```text
extensions/evertrade-b2b/
├── src/
│   ├── bootstrap.ts                 # Register routes, GraphQL, UI slots, hooks, events
│   ├── migrations/                  # Company and trade-order tables
│   ├── models/                      # Domain types and validation
│   ├── services/                    # Pricing, approvals, quoting, order handoff
│   ├── graphql/                     # Storefront and admin schemas/resolvers
│   ├── api/                         # Optional REST routes for imports/integrations later
│   ├── pages/                       # Buyer and EverShop-admin screens
│   ├── components/                  # Quick order and operations UI components
│   └── subscribers/                 # Notifications and post-order reconciliation
└── package.json
```

| Domain entity | Minimum responsibility | Relationship to EverShop |
|---|---|---|
| `Company` | Buying organization, commercial status, address, terms, tax flag | Maps to authenticated customer users |
| `CompanyMember` | Buyer, approver, or company-admin role | References EverShop customer/auth identity |
| `PriceList` / `PriceListItem` | Company-specific product or variant price, validity dates | Resolves against catalog product/variant and promotion context |
| `Requisition` / `RequisitionItem` | A buyer request before checkout; approver decision and history | Converts to an EverShop cart/order handoff on approval |
| `Quote` / `QuoteItem` | Merchant-managed offer with expiry and status | May seed a requisition or checkout after acceptance |
| `TradeOrderMeta` | Immutable snapshot of company, PO reference, price list, and approval | Attached to the regular OMS order flow |

### Core integration contracts

1. **Authentication and customer module.** On every trade request, resolve the authenticated customer to exactly one active `CompanyMember`. Reject access where no active company or role applies.
2. **Catalog and pricing.** Query existing product, variant, and inventory records. Calculate the eligible company price in a dedicated service, then snapshot the result on the requisition. Never recalculate an approved request silently.
3. **Cart and checkout.** An approved requisition creates or hydrates a normal EverShop cart. A checkout hook verifies that the buyer’s company, price snapshot, and approval status are still valid before order placement.
4. **Promotion and tax.** Company terms should be applied in a deterministic order relative to promotions. Tax-exemption must be checked server-side, never trusted from client state.
5. **OMS and events.** Store trade metadata on the order and publish events for `requisition_submitted`, `requisition_approved`, `quote_sent`, `quote_accepted`, and `trade_order_placed`.
6. **GraphQL.** The MVP needs queries such as `tradeMe`, `tradeCatalog`, `tradeReorders`, and `tradeRequisition`; mutations include `submitRequisition`, `approveRequisition`, `rejectRequisition`, `requestQuote`, and merchant-admin mutations for company and price-list management.

## Product quality gates

The proposal passes only if the first build demonstrates five things against a local EverShop installation: company-specific prices cannot be bypassed; an unauthorized buyer cannot approve their own request; one approved requisition reaches normal checkout with a stored commercial snapshot; a merchant can change a price list without rewriting code; and all functionality lives inside the extension with no core fork.

## Principal risks and controls

| Risk | Control |
|---|---|
| Price leakage or wrong price at checkout | Server-side price resolution, snapshotting, and checkout validation; no client-authoritative prices. |
| Scope explosion into an enterprise B2B suite | Lock the MVP to one company level, one approval level, no credit ledger, and no ERP synchronization. |
| Conflicts with promotions, tax, or payment extensions | Define order of operations and test an explicit compatibility matrix before production use. |
| Licensing or distribution ambiguity | Review EverShop’s GPL-3.0 license and the chosen distribution model with counsel before commercial release. |
| Unsupported extension seam | Start with a technical spike against the installed EverShop version before committing to all screens. |

## Decision required before implementation

Approve one of these paths:

| Path | Outcome |
|---|---|
| **A — Build the technical spike** | Create the EverTrade extension skeleton, data model, company login mapping, one price-list resolver, quick order, and one-step approval. No final visual design yet. |
| **B — Start with a design prototype** | Build a clickable buyer portal and merchant-control UX to test the workflow before connecting EverShop. |
| **C — Reframe the opportunity** | Keep the research but select another wedge, such as returns experience or marketplace operations, before any implementation. |

## References

[1]: [EverShop introduction and architecture overview](https://evershop.io/docs/development/getting-started/introduction) and [module development documentation](https://evershop.io/docs/development/module)
[2]: [EverShop GitHub issue #828: B2B + Multi-Vendor System Integration](https://github.com/evershopcommerce/evershop/issues/828)
[3]: [Shopify Help Center: Overview of B2B features](https://help.shopify.com/en/manual/b2b/getting-started/features)
[4]: [BigCommerce: Managing Sales Quotes in B2B Edition](https://support.bigcommerce.com/s/article/B2B-Edition-Quotes)
[5]: [Adobe Commerce: Introduction to B2B](https://experienceleague.adobe.com/en/docs/commerce-admin/b2b/introduction)
[6]: [Gartner: 67% of B2B buyers prefer a rep-free experience](https://www.gartner.com/en/newsroom/press-releases/2026-03-09-gartner-sales-survey-finds-67-percent-of-b2b-buyers-prefer-a-rep-free-experience)
[7]: [EverShop GitHub issue #438: refund system](https://github.com/evershopcommerce/evershop/issues/438)
