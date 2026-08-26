# Medusa Customer-Authentication Foundation

## Selected scope

Medusa is selected for **customer authentication only**. The existing platform remains the source of truth for merchant workspaces, tenant roles, product operations, orders, COD and bank-transfer handling, and Mailjet notifications.

## Required foundation

The official Medusa deployment model requires a separately deployed Medusa application, PostgreSQL, Redis, and production secrets. Medusa documents server and worker modes for production and recommends at least 2 GB of RAM for an optimal deployment.[1]

| Resource | Purpose | Current state |
|---|---|---|
| Medusa backend | Customer registration, sign-in, and identity tokens | Not deployed |
| PostgreSQL | Medusa customer/authentication records | Not provisioned |
| Redis | Medusa session and workflow infrastructure | Not provisioned |
| Store API key | Browser-to-Medusa Store API scope | Not created |
| Published platform origin | CORS allow-list entry | Available: `https://everhours-qr4dvska.manus.space` |

## Free-tier constraint

Render currently offers free web, PostgreSQL, and key-value services, but its free web instance is limited to 512 MB RAM and free PostgreSQL expires after 30 days.[2] That does not meet Medusa’s documented 2 GB production recommendation or provide a stable sellable foundation. Neon documents a supported PostgreSQL setup path for Medusa, but it still requires a separately hosted Medusa server and Redis service.[3]

No Medusa customer sign-in is enabled yet. The platform continues to use its existing authentication boundary until a compatible Medusa backend is available and its customer identity can be mapped safely into the platform’s local account record.

## References

[1] [Medusa, General deployment guide](https://docs.medusajs.com/learn/deployment/general)

[2] [Render, Deploy for Free](https://render.com/docs/free)

[3] [Neon, Self-host Medusa with Neon](https://neon.com/docs/guides/medusajs)
