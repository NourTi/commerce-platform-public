# Market study notes — evidence log

## Verified product signal: EverShop B2B gap

An open EverShop GitHub feature request states that the platform currently concentrates on a B2C, single-merchant model and names missing wholesale capabilities: company accounts, wholesale pricing tiers, bulk pricing, purchase orders, tax-exempt profiles, and vendor-specific operational views. The issue is assigned to the maintainer and has five reactions. It is evidence of a real community request, not evidence that a full multi-vendor implementation is currently planned or commercially validated.

Source: https://github.com/evershopcommerce/evershop/issues/828

## Verified market baseline: Shopify B2B

Shopify positions company records, location-level payment terms, shipping and contact settings, assigned catalogs, tax exemptions, B2B checkout settings, authenticated wholesale access, reordering, order history, and return submission as B2B functionality. This establishes a credible baseline for the core purchasing workflow buyers expect from modern B2B commerce, although Shopify's strategy and commercial model are distinct from EverShop's.

Source: https://help.shopify.com/en/manual/b2b/getting-started/features

## Verified competitor workflow: BigCommerce B2B Edition

BigCommerce documents a buyer-portal quote workflow in which buyers or sales staff can create a quote, tailor product selection, line-item price, shipping, and expiry, send a finalized offer by email and PDF, and convert it into an order. It also documents permissions, quote history, and the ability to search, filter, duplicate, archive, and export quotes. This confirms that a quote-to-order workflow is a meaningful product category, not just an implementation detail.

Source: https://support.bigcommerce.com/s/article/B2B-Edition-Quotes

## Verified enterprise baseline: Adobe Commerce B2B

Adobe Commerce positions B2B around company accounts with multiple buyers, roles, and purchasing permissions; customer-specific catalogs and pricing; quick ordering; negotiable quotes; company credit; requisition lists; and purchase-order approval rules. That breadth demonstrates the full enterprise envelope. It also indicates that a new EverShop solution should deliberately focus on a narrow, operationally valuable wedge rather than claim to replace an enterprise B2B suite.

Source: https://experienceleague.adobe.com/en/docs/commerce-admin/b2b/introduction

## Early hypothesis to test

The opportunity is likely not a broad multi-vendor marketplace, which has significant compliance, payout, and operational scope. A narrower, extension-native **B2B buyer portal** for small and midsize wholesalers—company accounts, buyer roles, personalized price lists, quick-order and reorder lists, cart-to-quote, purchase-order references, and approval routing—may solve the sharper adoption blocker while fitting EverShop's existing catalog, customer, checkout, promotion, OMS, GraphQL, and extension model.

## Verified buyer-demand signal

Gartner reported in March 2026 that 67% of surveyed B2B buyers prefer a rep-free experience; the cited survey covered 646 buyers in August–September 2025. The report does not argue for removing human assistance; it argues that buyers increasingly direct critical tasks through digital workflows and still need low-friction, context-aware support. This supports a product thesis focused on self-serve ordering with an explicit approval or quote escalation path rather than an AI sales-assistant feature.

Source: https://www.gartner.com/en/newsroom/press-releases/2026-03-09-gartner-sales-survey-finds-67-percent-of-b2b-buyers-prefer-a-rep-free-experience

## Strategic implication from current B2B research

McKinsey’s 2026 Global B2B Pulse framing is that omnichannel execution and digital commerce have become a baseline, while integration and hyperpersonalization determine differentiation. For this opportunity, the relevant implication is modest: a standalone B2B portal would be weaker than a portal natively integrated with catalog data, price logic, buyer accounts, checkout, and order operations.

Source: https://www.mckinsey.com/capabilities/growth-marketing-and-sales/our-insights/the-surprising-economics-of-b2b-growth-the-new-survival-threshold-and-what-it-takes-to-thrive

## Implementation-feasibility signal

EverShop's official module-development documentation describes custom extensions, widget development, and a step-by-step first-extension tutorial as supported paths. Combined with the architecture guide's explicit hooks, events, middleware, registries/processors, pages, REST, GraphQL, and theme mechanisms, this supports an extension-first design rather than a core fork. Detailed extension contracts still need to be verified during technical design.

Source: https://evershop.io/docs/development/module

## First-hand product-demo signal (illustrative, not market proof)

Analysis of a BigCommerce B2B Edition demo reinforced the operational workflow observed in its official documentation: quick add by SKU, buyer roles, personalized price lists, reorder support, account-level payment-method rules, sales-rep assistance, and quote conversion. The demo is a vendor marketing source and therefore should not be treated as independent evidence; it is useful only for understanding how a mature B2B portal packages these workflows into a single user experience.

Source: https://www.youtube.com/watch?v=lIJ5HNUMiDo

## Open-source competitor comparison: Medusa

Medusa documents B2B as a composable recipe rather than a complete embedded suite: sales channels for product availability, customer groups for segmentation, price lists for customer-specific pricing, and custom modules for companies and employee roles. The comparison sharpens the opportunity. A useful EverShop product should not only expose equivalent low-level primitives; it should package a usable buyer-account workflow—roles, catalog access, quick ordering, quotes, approvals, and operational screens—around EverShop's existing commerce modules.

Source: https://docs.medusajs.com/resources/recipes/b2b

## Alternative opportunity screened out: returns and refunds

EverShop issue #438 requested merchant refunds and customer-side returns. The issue is now closed, and the maintainer states that refunds are currently supported for Stripe orders, with provider-specific implementation required elsewhere. Returns experience may still be an extension opportunity, but the evidence does not make it a clearer immediate wedge than B2B purchasing operations. It would also require sensitive payment-provider and policy handling.

Source: https://github.com/evershopcommerce/evershop/issues/438
