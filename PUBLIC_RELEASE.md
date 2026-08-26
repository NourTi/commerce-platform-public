# Public Release Guide

## Included

| Area | Included in this repository |
|---|---|
| Full-stack source | React client, Express server, tRPC procedures, Drizzle schema/migrations, shared types, tests, CI workflow, and build configuration. |
| Customer authentication | Server-side Auth0 authorization-code + PKCE bridge; public customer entry points route through Auth0. |
| Commerce capabilities | Multi-tenant workspace/store model, catalog, product media, cart, native COD/bank-transfer checkout, orders, returns, fulfillment records, privacy requests, and merchant operations. |
| Documentation | Architecture, capability boundaries, launch readiness, operational notes, validation log, and research notes. |
| Visual media | The landing hero frame, two motion clips, and candy product mockup in `client/public/media/`. |

## Deliberately excluded

No live `.env` file, API key, client secret, session secret, provider credential, personal sender address, customer record, order, database dump, or production access token is included. Configure every integration with your own values from `.env.example`.

## Running the stack

Install dependencies with `pnpm install`, copy `.env.example` to `.env`, configure a MySQL-compatible database and your providers, apply the reviewed Drizzle migrations, then run `pnpm dev`. Before deployment, run `pnpm check`, `pnpm test`, and `pnpm build`.

The current code expects the managed-runtime values shown in `.env.example` for legacy merchant access. Customer authentication uses Auth0 and must have this exact callback registered in the selected Auth0 application:

```text
https://YOUR_PUBLIC_DOMAIN/api/auth0/callback
```

## Media manifest

| File | Role |
|---|---|
| `hero-frame-3s_4f31c8b0.png` | Landing hero poster frame. |
| `rivet-hero-motion_25aa1119.mp4` | Landing hero motion layer. |
| `rivet-merchant-motion_10210d40.mp4` | Merchant story motion layer. |
| `candy-product-mockup_e8a2731b.png` | Product media for the candy mockup treatment. |
| `metallic-pouch-storefront-hero_2b535031.png` | Storefront and client-review hero packaging image. |

The media bundle is approximately 8.3 MB and is committed directly to make the public source snapshot visually runnable without platform-specific object-storage URLs.
