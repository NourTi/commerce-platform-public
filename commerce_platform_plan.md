# Forge Commerce Platform Reset

## Product position

Forge Commerce is becoming a **developer-first, modular e-commerce platform** rather than a vertical workflow product. Its operating model mirrors the useful shape of EverShop—a commerce core that developers can theme and extend—while keeping the initial implementation focused on a coherent, testable foundation.

## Platform model

```text
Storefront → catalog → cart → checkout readiness → order record
                    ↓
          promotions / inventory / customers
                    ↓
Admin console → extensions → typed API contracts
```

## Module boundary

| Module | Foundation delivery |
|---|---|
| Catalog | Products, variants, collections, publish state, inventory quantity, price, product media URL, and public listing/detail queries. |
| Storefront | Responsive collection grid, product page, variant selection, cart drawer, promotion entry, and order-ready checkout summary. |
| Cart and checkout | Server-calculated line totals, promotion validation, customer details, shipping selection, and order creation. Payment capture is intentionally deferred. |
| Customer | Authenticated account context and order history boundary. Guest checkout remains a later module. |
| OMS | Immutable order lines, status progression, stock reservation, and operational order list. |
| Promotion | Code-based percentage or fixed-price promotions with active window and minimum subtotal guardrails. |
| Admin | Authenticated dashboard, catalog operations, order overview, module registry, and explicit setup/seed action. |
| API | Typed tRPC procedures organized by module. A public GraphQL façade is a later compatibility layer, not a claim in this foundation. |
| Themes and extensions | Theme tokens at the storefront layer; manifest and typed hooks for modules and connectors. |

## Initial implementation principles

The customer-visible cart and admin mutations will be server-calculated; price, discount, and stock values are never trusted from the browser. Product setup will be an administrator action, not an automatic mock-data insertion. The catalog is intentionally seeded only after the administrator activates the demo catalog, so production data is never silently fabricated.

## Not in the first reset

Payment capture, shipping-carrier rates, tax engines, product-media upload, CMS/page builder, multi-currency, guest checkout, and a GraphQL façade are separate milestones. The data and API boundaries will accommodate them without blocking the core catalog-to-order lifecycle.
