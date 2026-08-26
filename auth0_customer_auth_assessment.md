# Auth0 Customer Authentication Assessment

## Inspected application

The supplied Auth0 tenant contains **My App**, a first-party **Regular Web Application**. It has an Auth0 database username/password connection and a Google connection enabled. Its current callback and logout configuration is development-only (`http://localhost:5000`); it has no published platform origin configured. The dashboard shows a 22-day trial banner for features outside the Free plan. No settings or credentials were changed during this review.

## Fit for this platform

Auth0 is a stronger fit than a separately hosted Medusa backend for the selected **customer-authentication-only** scope. It provides the identity service without requiring the additional Medusa, PostgreSQL, and Redis runtime. The platform must retain its existing database as the authority for store membership, tenant roles, merchant permissions, catalog, and orders.

| Area | Auth0 approach | Required boundary |
|---|---|---|
| Customer sign-in | Auth0 Universal Login using the existing regular web application | Use the authorization-code flow on the Express server; never expose the client secret in the browser. |
| Customer identity | Auth0 subject plus verified email | Create/link a local customer record only after server-side token validation. |
| Merchant authorization | Existing local tenant memberships and roles | Do not use Auth0 free-plan roles as a substitute for tenant-scoped permissions. |
| Redirects | Exact published callback and logout URLs | Allow-list only the platform’s published HTTPS address; do not use wildcards. |
| Session | Existing server-side session boundary | Rotate session identifiers and treat Auth0 tokens as identity proofs, not the local commerce authorization model. |

## Free-plan implications

Auth0 currently documents its Free plan as supporting up to 25,000 external active users, passwordless authentication, social connections, and basic attack protection. It does not include role management, account linking, or configurable email workflow; it provides one day of log retention.[1] Those restrictions are acceptable for customer sign-in while local platform roles remain authoritative, but they are not a complete multi-tenant merchant identity system.

## Required configuration before implementation

The owner must approve the authentication change. Implementation then requires the Auth0 domain and client ID already visible in the application, plus a securely stored client secret. The dashboard must be changed only after explicit confirmation to allow-list the exact published callback and logout URLs. Auth0 recommends exact production URLs rather than localhost or wildcard callbacks.[2]

## Implemented customer-login bridge

The approved bridge is now implemented. It begins at `/api/auth0/login`, creates a signed, short-lived Auth0 transaction cookie, uses PKCE, and sends the browser to Auth0 Universal Login. The callback validates the transaction state, exchanges the code server-side, verifies the Auth0 ID token issuer, audience, nonce, and verified email, then creates or updates a local customer user keyed by the Auth0 subject. It mints the project’s existing local session cookie only after that validation.

The Auth0 application was user-confirmed as saved with the exact published callback URL, logout URL, and web origin. The project-side login route was validated to generate the expected Auth0 authorization redirect without creating a customer or submitting a login.

> A complete end-to-end sign-in remains intentionally pending until a real customer chooses to register or log in. No test customer, credential, or customer order was fabricated.

## References

[1] [Auth0 Pricing](https://auth0.com/pricing)

[2] [Auth0 Application Settings](https://auth0.com/docs/get-started/applications/application-settings)
