# EverShop capability audit

## Official product model

EverShop describes itself as a modular TypeScript, React, and GraphQL commerce platform. Its product model is materially broader than a catalog and marketing landing: catalog, checkout, customer accounts, OMS, promotion, CMS, a page builder, blog, tax, settings, authentication, and GraphQL are first-class modules. The platform distinguishes a customizable storefront theme system from an extensible admin panel. Source: <https://evershop.io/docs/development/getting-started/introduction>.

## Theme model

An EverShop theme is a storefront-only overlay. It can override React components, add page components and assets, and carry a versioned content manifest. That manifest can define widgets, their route-and-area placements, and metafield definitions. Administration changes belong to extensions rather than themes. Source: <https://evershop.io/docs/development/theme/theme-overview>.

## Rebuild implications

The current product must become an operational commerce foundation instead of a two-section pitch. The minimum credible next product surface is a merchant workspace with storefront preview, theme presets, editable page sections/widgets, operational catalog and order views, and an explicit extension registry. Current payment and shipping operations must remain honest: this build has pending-payment order creation and does not yet implement a payment gateway, tax engine, customer accounts, or carrier fulfillment.
