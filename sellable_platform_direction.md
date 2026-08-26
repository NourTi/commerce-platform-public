# Rivet Commerce — Product and Visual Direction

## Product proposition

**Rivet Commerce** is the working name for a commerce-in-a-box platform that lets a merchant or agency launch a branded, functional store without assembling the commercial core from separate services. A project begins with a usable storefront, merchant console, catalog, cart, promotion, checkout-readiness, order operations, and theme foundation. Developers retain a typed extension surface for the work that makes a store unique.

> The promise is not “a toolkit to start building commerce.” It is “a launch-ready store that remains yours to extend.”

The first market is agencies and ambitious independent merchants. Agencies need a repeatable platform that they can brand and extend for clients; merchants need a usable store and operations console on day one.

| Ships on day one | Deliberate upgrade path |
|---|---|
| Branded storefront and theme starter | Theme and section package registry |
| Merchant console for catalog, inventory, discounts, and orders | GraphQL façade and typed SDK |
| Variant-aware catalog, cart, promotion, and pending-payment checkout | Payment, tax, shipping, PIM, ERP, and CRM adapters |
| Customer-ready order record and merchant operations view | Multi-store, staff roles, analytics, and marketplace packs |

## Design adaptation

The supplied MotionSites material is used as a **visual-language reference**, not copied as a Targo replica. The adaptation keeps its strongest principles: a motion-led spatial composition, strong staircase typography, clipped technical CTAs, deliberate cinematic contrast, and a responsive video-first hero. It changes the brand, copy, composition, information hierarchy, visual assets, and page structure for Rivet Commerce.

| Reference principle | Rivet adaptation |
|---|---|
| One technical hero video | An original commerce-launch hero with a muted motion layer, depth scrim, orbit lines, and animated control-plane signals. |
| Staircase headline | “LAUNCH / THE STORE / OPERATING / SYSTEM / FOR YOUR / BUSINESS,” rebalanced for Rivet’s own messaging. |
| Cyan action signal | A signal-cyan accent used against graphite/ivory surfaces, with high-contrast orange reserved for transaction states. |
| Two-section composition | A full product page: motion hero, launch-readiness stack, merchant/admin visual surfaces, theme and extension layers, and the commercial offer. |
| Plain product mock-up | Layered interactive product frames: storefront, merchant console, and extension boundary with staggered depth and parallax motion. |

## Interface system

The implementation uses **Framer Motion** for motion hierarchy, **Lucide** for consistent iconography, existing typed **tRPC** contracts for all commerce actions, and custom CSS tokens generated from the existing UI Pro Max design system. It will avoid a repetitive full-bleed SaaS template: every major section resolves into a distinct visual object, depth plane, or product proof point.

The resulting visual language is intentionally high-contrast and physical: graphite as the structural layer, ivory as the reading plane, signal cyan as the motion/action layer, and a restrained warm orange for payment/order states. Animation is restricted to transform and opacity, respects `prefers-reduced-motion`, and never carries information by motion alone.
