# EverShop source audit notes

## Source checked

- Repository: https://github.com/evershopcommerce/evershop
- Official introduction: https://evershop.io/docs/development/getting-started/introduction

## Initial repository observations

The repository describes EverShop as a TypeScript-first e-commerce platform built with GraphQL and React. It presents a modular, customizable architecture and links developers to installation, extension-development, and theme-development documentation. The current source tree visibly includes packages, tests, translations, Docker configuration, and seed assets, which indicates a complete commerce platform rather than an isolated storefront UI.

## Official documentation findings

The introduction presents EverShop as an open-source Node.js commerce platform using TypeScript, React, GraphQL, PostgreSQL, and server-side rendered React. Its supplied modules cover catalog, checkout, customer accounts, order management, promotions, CMS, page-builder widgets, blog, tax, settings, authentication, and GraphQL schema assembly. Payment modules for Stripe, PayPal, and cash on delivery are included but configurable.

The architecture guide describes a modular monolith: one deployable application with decoupled feature modules. It provides GraphQL and REST endpoints, a module bootstrap lifecycle, themes for storefront presentation, and extension points built around registries/processors, hooks, asynchronous events/subscribers, and middleware. A real EverShop store is structured to add custom modules in `extensions/` and branding in `themes/` without modifying core code.

## Practical opportunity

The project can be positioned as a design-forward headless-style storefront concept backed, in a real deployment, by EverShop's catalog, checkout, CMS, promotion, and GraphQL capabilities. The static build will make that business case visually concrete while keeping the implementation honest: it will not imitate a functional commerce backend it does not contain.

## Source-level verification

The cloned `v2.2.1` project uses NPM workspaces for both `packages/*` and `extensions/*`, and includes CLI commands to create, activate, inspect, and export themes. Core modules visible in the source are `auth`, `base`, `blog`, `catalog`, `checkout`, `cms`, `customer`, `oms`, `promotion`, `setting`, `tax`, and payment modules for Stripe, PayPal, and cash on delivery.

The source exposes first-class storefront widgets for a product hero, collection spotlight, collection products, collection stack, and recommendations. This is a strong fit for an editorial commerce interface: the visual experience can translate directly into content-managed EverShop widgets rather than becoming an unmaintainable one-off template.

## Design implication

The website should frame EverShop as a composable commerce foundation, then demonstrate the product-facing layer through a tangible, editorial storefront experience. It should not try to recreate the administrative platform in a static mock-up.
