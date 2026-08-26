# Multi-tenant commerce platform architecture

## Product boundary

This product is a **commerce operating system for merchants and agencies**, not a themed demonstration store. A signed-in merchant owns a workspace, operates one or more stores, and can delegate access to teammates. Each store owns its catalog, promotion rules, carts, orders, page content, themes, and extension configuration. Public storefront routes resolve against an explicit store rather than the global catalog.

The existing global commerce tables remain the transactional kernel during migration, but every operational record will be scoped to a store before a feature claims to be merchant-ready. The legacy made-to-order domain remains isolated.

## Core data model

| Domain | Record | Responsibility |
| --- | --- | --- |
| Tenancy | `commerceWorkspaces` | Commercial account and primary owner. |
| Tenancy | `commerceStores` | Store identity, handle, default locale, currency, and publication state. |
| Access | `commerceStoreMembers` | Store-level owner, manager, merchandiser, and analyst roles. |
| Storefront | `commerceThemes` | Store-owned active theme preset and style tokens. |
| Storefront | `commercePages` | Store route/page identity and publishing state. |
| Storefront | `commercePageSections` | Ordered page sections with type, visibility, and settings JSON. |
| Commerce | Products, promotions, carts, orders | Existing kernel records expanded with store ownership. |
| Extensibility | `commerceExtensions` | Store-scoped extension registry configuration and state. |

## Role model

| Role | Primary permissions |
| --- | --- |
| Owner | Billing/configuration, members, all merchant actions. |
| Manager | Catalog, orders, promotions, storefront publishing. |
| Merchandiser | Catalog, collection, theme, and page-section editing. |
| Analyst | Read-only operational and conversion views. |

## Product surfaces

### Public product journey

The root page becomes a full product journey: platform thesis, operational surfaces, live storefront preview, studio workflow, extension model, and deliberate routes into a demo storefront and merchant workspace. The MotionSites video composition remains a crafted hero treatment; it is no longer the entire product.

### Merchant workspace

The merchant workspace provides store switching, a real operational overview, catalog and inventory control, order queue, promotion control, storefront studio, and an extension registry. It is a product surface, not a static dashboard mockup.

### Storefront studio

The studio offers named visual presets, editable homepage sections, preview mode for desktop and mobile, and publish state. The preview renders the same section configuration used by the public demo storefront, so a marketer changes a real storefront model rather than a disconnected mock screen.

## Delivery sequence

1. Establish tenancy schema, migration, member roles, and store-scoped service guards.
2. Introduce first-store onboarding and workspace routing.
3. Build the persisted storefront studio and public store resolver.
4. Expand merchant operations and extension registry.
5. Replace the short landing with the full product journey and test tenant isolation, studio persistence, and commerce regression.

## Honest limits in this build

The current implementation supports a pending-payment order state, not payment capture. It does not yet include a real payment provider, tax engine, carrier labels, customer account management, or user-installed third-party code. The product will expose those as planned integrations rather than implying that they are active.
