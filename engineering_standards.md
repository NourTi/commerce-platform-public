# Forge Commerce engineering standards

## Source and application

These standards adapt four task-specific guides from [piyushrajyadav/awesome-ai-dev-prompts](https://github.com/piyushrajyadav/awesome-ai-dev-prompts): **Heavy Backend Systems Engineer**, **Data Modeling Engineer**, **GraphQL Engineer**, and **Testing & QA Automation Engineer**. The guidance is applied as an engineering checklist, not copied as a substitute for product decisions.

## Non-negotiable platform rules

Forge Commerce will use a modular TypeScript architecture with PostgreSQL as its transactional source of truth. Business domains—blueprints, configurations, price traces, quotes, and production passports—will remain separate from API delivery and UI code. Every saved commercial state will be versioned; a production passport will always reference the exact configuration and pricing revision that produced it.

External calls will be treated as unreliable. Integration events will be persisted through an outbox-style model, identified with idempotency keys, and designed for retry rather than assumed delivery. Client-supplied price totals, role claims, or production data will never be trusted without server-side validation.

## Data and API contracts

The domain model will represent business reality, not screen layout. Each entity will have a stable identity, explicit ownership, temporal fields, and documented relationships. Immutable snapshots will preserve the configuration and price result at quote acceptance and production release.

GraphQL will be the primary application contract. Its schema will be domain-first; mutations will use purpose-built inputs and payloads with structured errors. Resolvers will be thin and delegate to domain services. List endpoints will use cursor pagination where applicable, and authorization will be checked at the service boundary. Query depth and complexity controls are required before public exposure.

## Quality gates

Core rule evaluation, price calculation, authorization, and snapshot creation will have behavior-focused unit tests. Persistence, GraphQL execution, and event-outbox handling will have integration tests. The buyer flow—valid configuration to price trace to production passport—will have a small number of deterministic end-to-end tests. Tests must be isolated, readable, and stable; business logic targets at least 80% coverage.

The delivered MVP must prove that invalid configurations are rejected, server-calculated prices cannot be overridden, an accepted quote yields an immutable production passport, and a mock integration event is idempotent. Structured logs must not expose PII, secrets, raw payment data, or sensitive configuration notes.

## Deliberate constraints for the foundation

Forge Commerce begins as a modular monolith with one database and a durable outbox, not a prematurely distributed system. The initial build will avoid general workflow automation, 3D rendering, full ERP replacement, and external credential storage. Those requirements may be added only after their extension contracts and failure modes are explicit.
