# Forge Commerce — open-source commerce for products that are not ready-made

> **Working name:** Forge Commerce. The name is provisional; the product thesis is the decision to make now.

## 1. What it is

**Forge Commerce is an open-source, developer-first commerce platform for configurable and made-to-order products.** It is for businesses that cannot honestly model what they sell as “choose a variant, add to cart, ship.” A buyer may need to select dimensions, materials, components, artwork, finish, compliance options, quantities, delivery constraints, or installation details. Those choices must obey rules, create a defensible price, pass through quote or deposit approval, and result in a production-ready specification.

Forge Commerce makes that entire path a native commerce flow:

```text
Product intent → valid configuration → price → quote/deposit → approval → production brief → fulfilment
```

The platform is not a visual 3D configurator, an ERP, or a generic storefront template. It is the **transaction and workflow engine** behind custom-product selling.

## 2. The problem it solves

Conventional commerce platforms are designed around catalog items, variants, promotions, carts, orders, and fulfilment. That works for stocked goods. It breaks when the purchase is an engineered or negotiated outcome.

| Situation | What happens without Forge Commerce | What Forge Commerce makes native |
|---|---|---|
| Custom furniture | Sales staff check which combinations are physically possible, calculate a manual price, then send a PDF to production. | Compatibility rules, price formulas, proof/approval, and a production specification are one transaction. |
| Packaging and print | Artwork, material, size, finish, quantity, and lead time circulate between email, spreadsheets, and print operations. | Buyer inputs become a versioned configuration, quote, deposit, and production job. |
| Industrial components | A product can require technical dimensions, certifications, compatible add-ons, or dealer pricing. | Rules prevent invalid selections; account terms and quote workflows stay attached to the configuration. |
| Made-to-order apparel | Measurements, fabric availability, personalisation, and production slot must be resolved before the order is real. | The order carries the selected constraints, calculation trace, and production lifecycle. |

Salesforce’s current configurator guidance describes the same fundamental mechanics: configuration rules enforce valid, commercially viable combinations; prices must update in real time; and the result needs inventory and ERP/CRM integration.[1] Forge Commerce takes those mechanics out of an enterprise CPQ product and places them in an open-source commerce core.

## 3. Who it is for

Forge Commerce has four users, with one deliberate priority: the developer is a first-class user because the business-specific rules will never be generic.

| User | Job to be done | What Forge gives them |
|---|---|---|
| **Commerce developer** | Add a new configurable product model or integration without forking the core. | Typed extension API, rule packages, event contracts, generated GraphQL, migrations, contract tests. |
| **Product or operations manager** | Maintain allowed options, margins, lead times, and production handoff. | Admin workbench for option sets, rules, price books, quotes, and job lifecycle. |
| **Buyer or sales rep** | Turn an ambiguous requirement into a valid, priced purchase. | Configurator API/UI, live price and lead-time feedback, saved configurations, quote/deposit flow. |
| **Production coordinator** | Receive an executable, traceable build brief rather than an incomplete order note. | Immutable configuration snapshot, production specification, approvals, milestones, and exceptions. |

## 4. What systems it enhances

Forge Commerce can run as the commerce core for a new business, but its stronger use is to **make existing systems usable for configurable selling**. It does not replace these systems; it gives them a clean, transaction-aware integration point.

| Existing system | What it already owns | What Forge Commerce adds | Integration direction |
|---|---|---|---|
| **PIM** such as Akeneo | Product data, media, base attributes | Turns selected attributes into governed configuration choices and commercial rules. | PIM → Forge product definitions; Forge returns configuration metadata if needed. |
| **ERP / MRP** such as Odoo, ERPNext, NetSuite, SAP | BOM, stock, suppliers, production routing, finance | Sends a validated production brief and receives availability, cost, and production status. | Two-way connector with idempotent events. |
| **CRM / CPQ** such as HubSpot or Salesforce | Accounts, opportunities, sales ownership | Converts a configuration into a linked quote and maintains a commercial audit trail. | Forge publishes quote/order events; CRM may supply account context. |
| **Payment processor** such as Stripe or Adyen | Payment authorization, capture, refunds | Supports a deposit or balance workflow after the exact configuration is accepted. | Forge creates payment intent; processor returns status. |
| **Storefronts** including Next.js, React Native, or an existing site | Buyer experience and acquisition | Adds a headless configurator, quote, deposit, and order-status API without forcing a visual stack. | Forge exposes GraphQL and REST plus embeddable UI primitives. |
| **Existing commerce engine** including EverShop, Medusa, or Vendure | Catalog, standard checkout, promotions, basic orders | Can act as the configurable-product and production workflow service while the other engine continues to serve stocked goods. | Start with adapters; do not embed in the core architecture. |

This makes the answer to “what system does it enhance?” precise: **it enhances the handoff between selling, pricing, and producing a non-standard product.**

## 5. Why not build another EverShop

EverShop is a capable TypeScript commerce platform built around an integrated catalog, checkout, customers, orders, promotions, CMS, GraphQL, themes, and extensions.[2] Its source visibly supports variants and custom options, but the platform does not present a first-class core for configuration validity, formula pricing, proof approval, deposits, or production lifecycle. A developer can custom-build those behaviors, but they start from general commerce primitives.

Forge Commerce adopts the useful parts of the same philosophy—open source, TypeScript, modularity, an admin surface, GraphQL, extensions—then changes the **centre of gravity**.

| Platform | Centre of gravity | Configuration and production treatment |
|---|---|---|
| EverShop | Flexible integrated online store | Custom implementation on top of catalog/options/checkout modules. |
| Medusa | Composable commerce modules and workflows | Has extensive B2B starter features, including company accounts, price lists, quote flow, bulk cart, and approvals.[3] Configuration/production remains a custom workflow concern. |
| Vendure | TypeScript/NestJS extension framework for complex commerce | Strong typed extensibility via plugins, custom fields/entities, strategy patterns, events, and jobs.[4] Product configuration and production semantics are not its advertised core product model. |
| Saleor | GraphQL-first composable commerce infrastructure | Strong API, dashboard, webhooks, configurator tooling, and observability.[5] It does not claim to be an open-source made-to-order production engine. |
| **Forge Commerce** | Valid configuration through executable production | Rules, price logic, quote/deposit, proof approval, and production brief are core modules, not a side project. |

## 6. Native modules

Forge must stay a platform, not a one-vertical application. The core therefore owns generic capabilities while extensions carry furniture-specific, print-specific, or industrial-specific logic.

| Native module | Responsibility | It does not do |
|---|---|---|
| **Product Blueprint** | Defines a configurable product, option groups, input types, default values, and compatibility dependencies. | Full PIM replacement or product photography management. |
| **Rules Engine** | Evaluates constraints, eligibility, lead-time rules, and reason codes for unavailable selections. | Invent a proprietary programming language; rules must be JSON/TypeScript packages. |
| **Price Engine** | Computes base price, option deltas, formulas, quantity tiers, deposit requirements, and margin guardrails. | Become an accounting ledger or ERP cost engine. |
| **Configuration Ledger** | Versions every buyer configuration and records inputs, ruleset version, price trace, and approvals. | Store unbounded design files or media. |
| **Quote and Deposit** | Creates an offer, expiry, acceptance, deposit/balance schedule, and audit history. | Full enterprise CPQ territory management. |
| **Proof and Approval** | Supports customer proof approval and one configurable internal decision gate. | Unlimited workflow design or general business process management. |
| **Production Passport** | Turns the accepted configuration into an immutable technical brief with BOM references, routing references, status, and exceptions. | Run a factory, schedule labour, or replace MRP. |
| **Integration Hub** | Runs typed connectors, idempotent jobs, events, and webhooks. | Embed custom client credentials in the core or prescribe one ERP. |
| **Developer Platform** | Provides extensions, UI slots, API schema additions, migrations, test fixtures, and compatibility contracts. | Let arbitrary plugins patch internal database tables. |

## 7. The core interaction

The proof of the product is a flow, not a dashboard.

```text
1. Buyer chooses a product blueprint
2. Forge evaluates rules after each selection
3. Buyer sees valid options, price, lead time, and reasons for blocked combinations
4. Buyer saves a configuration or requests a quote
5. Merchant modifies only permitted commercial fields and issues the offer
6. Buyer accepts and pays a deposit, or the internal approver releases it
7. Forge freezes a configuration snapshot and publishes a Production Passport
8. MRP/ERP acknowledges the job; fulfilment status flows back to the buyer
```

The key architectural rule is **no configuration can reach production without a versioned, reproducible ruleset and price trace**. This is what separates Forge from a normal custom-options form.

## 8. Technical architecture

The proposed starting point is a modular TypeScript monolith with a reliable event outbox. This is simpler to self-host than microservices, while keeping module boundaries clear enough to extract later. The schema is API-first; a React admin is included because operations teams need to maintain rules and inspect configurations without editing code.

```text
                         ┌──────────────────────────┐
                         │ Storefront / Sales UI     │
                         │ Next.js / native / embed  │
                         └────────────┬─────────────┘
                                      GraphQL / REST
                         ┌────────────▼─────────────┐
                         │       Forge API          │
                         │ Auth · Catalog · Quotes  │
                         └────────────┬─────────────┘
                                      │
         ┌────────────────────────────┼────────────────────────────┐
         │                            │                            │
┌────────▼────────┐         ┌─────────▼─────────┐        ┌─────────▼──────────┐
│ Rule + Price     │         │ Config / Quote /  │        │ Production Passport│
│ Runtime          │         │ Deposit Ledger    │        │ + Status           │
└────────┬────────┘         └─────────┬─────────┘        └─────────┬──────────┘
         └────────────────────────────┼────────────────────────────┘
                                      │
                         ┌────────────▼─────────────┐
                         │ PostgreSQL + Event Outbox│
                         └────────────┬─────────────┘
                                      │
      ┌───────────────────────────────┼────────────────────────────────┐
      │                │              │               │                 │
┌─────▼─────┐  ┌───────▼──────┐ ┌────▼─────┐  ┌──────▼──────┐  ┌───────▼─────┐
│ PIM       │  │ ERP / MRP    │ │ CRM / CPQ│  │ Payments    │  │ Logistics   │
└───────────┘  └──────────────┘ └──────────┘  └─────────────┘  └─────────────┘
```

### Core technology choices

| Layer | Proposed choice | Reason |
|---|---|---|
| Runtime | Node.js + TypeScript | Aligns with the developer audience and enables typed extension contracts. |
| API | GraphQL as the primary read/write API; REST/webhooks for integrations | Configurators benefit from precise shaped reads; external systems still expect operational HTTP contracts. |
| Database | PostgreSQL | Strong transactional model, JSON support for configuration payloads, mature migration tooling. |
| Admin | React + generated forms for declarative rules | Operations needs governance; raw JSON alone will not be adopted. |
| Background work | Outbox-backed worker queue | Retryable, idempotent integration events without distributed-system complexity. |
| Extensions | NPM packages with manifest, migrations, typed events, API/UI contributions, and contract tests | Provides real extensibility without core edits or undocumented monkey patches. |
| Rules | Declarative JSON rules for common constraints, TypeScript evaluator hooks for advanced logic | Lets operations own simple rules while developers retain power for domain-specific computation. |

## 9. Extension model

An extension must declare what it changes. It may add product schemas, rule functions, price components, admin panels, integration connectors, events, and API fields. It may not reach into private tables or override runtime behavior by import side effects.

```text
@forge/print-production-extension
├── forge.extension.ts       # Manifest + compatibility range
├── migrations/              # Owned database changes
├── blueprint/               # Print product types and option schemas
├── rules/                   # Bleed, material, and finish compatibility rules
├── pricing/                 # Quantity / paper / colour price calculator
├── connectors/              # Print-MIS adapter
├── admin/                   # Production workbench slot
├── graphql/                 # Schema contribution and resolvers
└── contract-tests/          # Rules, price, and event compatibility tests
```

This is the platform’s key developer promise: **if your business is unusual, add a bounded module—not a private fork you must carry forever.**

## 10. MVP: prove the platform with one vertical

The MVP must be narrower than “commerce for all custom products.” The reference vertical should be **made-to-order furniture** because it demonstrates dimension rules, material choices, price formulas, deposits, lead time, and a production handoff without needing 3D rendering.

| Build in the first platform foundation | Do not build yet |
|---|---|
| Product blueprint editor with option groups and simple compatibility rules | 3D or AR configurator |
| Configuration API and a basic React buyer configurator | AI-generated designs or AI pricing |
| Formula-based price calculator with trace | Full ERP/MRP or inventory optimisation |
| Quote acceptance plus one deposit method | Multi-currency tax suite or invoicing ledger |
| Immutable production passport and mock production-status connector | Multiple vertical packs or a marketplace |
| Extension package template and contract-test harness | Low-code visual workflow builder |

### MVP success criteria

The first release is successful only if a developer can create a new furniture blueprint without forking Forge, a buyer cannot select an invalid configuration, every accepted quote has a reproducible price trace, the production handoff contains the correct configuration version, and an extension can add one domain rule plus one connector without changing the core.

## 11. What makes it commercially credible

Forge should be open-source at the core, with a straightforward path to a sustainable commercial model that does not undermine developer trust:

| Layer | Open-source or commercial position |
|---|---|
| Core engine, API, admin, rule runtime, price engine, standard connectors | Open source |
| Vertical packs, managed hosting, operational observability, priority support, enterprise identity, advanced connector maintenance | Optional commercial offering |
| Community extensions | Open registry and transparent compatibility policy |

The product must earn adoption through a runnable local starter, excellent extension documentation, an example vertical, and a clear migration path—not through feature gating essential transactional behavior.

## 12. Boundaries and risks

The platform risks becoming an expensive CPQ clone or an incomplete ERP. The product boundary prevents that. Forge owns configuration-to-production commerce state; it delegates design rendering, factory scheduling, accounting, CRM, and rich enterprise workflow automation to specialist systems.

| Risk | Control |
|---|---|
| Too broad to ship | One vertical, one rules engine, one quote/deposit path, one connector pattern. |
| Rules engine becomes unsafe or opaque | Versioned rules, simulation mode, explanation output, test fixtures, and approval-required publication. |
| Price discrepancy damages trust | Server-calculated prices, immutable price traces, and no client-authoritative totals. |
| Integrations create fragile bespoke projects | Adapter contracts, idempotent events, retry policy, and a small certified-connector set. |
| Developers reject another framework | Use familiar TypeScript, PostgreSQL, GraphQL, NPM packages, and code-first extension patterns. |

## 13. Decision before build

If this direction is approved, the first implementation should be **the platform foundation**, not a marketing website:

1. Create the Forge Commerce monorepo and local developer environment.
2. Implement the product-blueprint, rules, configuration ledger, and price-trace modules.
3. Ship the made-to-order furniture example with a buyer configurator, quote/deposit flow, and production passport.
4. Publish one extension template and one mock ERP/MRP connector with contract tests.

No code should begin until the product boundary, reference vertical, and integration posture above are accepted.

## References

[1]: [Salesforce: Product configurator software](https://www.salesforce.com/eu/sales/revenue-lifecycle-management/product-configurator-software/)
[2]: [EverShop: introduction](https://evershop.io/docs/development/getting-started/introduction) and [architecture overview](https://evershop.io/docs/development/knowledge-base/architecture-overview)
[3]: [Medusa for B2B](https://medusajs.com/b2b)
[4]: [Vendure Core](https://vendure.io/core)
[5]: [Saleor Commerce](https://saleor.io/)
