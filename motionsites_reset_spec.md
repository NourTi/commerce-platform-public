# MotionSites Reset Specification

The user-provided MotionSites prompt is the **implementation specification for the public landing page**, not broad inspiration. The corrected landing must be exactly two visual sections, with no product footer or generic module grid.

| Required reference rule | Corrected implementation requirement |
|---|---|
| Hero | `min-height: 100svh`, paper background, overflow hidden, one supplied hero video at desktop `top: 0; right: -20%; width: 99%`, `object-fit: contain`, and the exact left-to-right paper scrim on desktop only. |
| Navigation | Relative, lightweight header within the hero. It must use the reference spacing and mobile hamburger/menu behavior rather than a persistent SaaS navigation bar. |
| Headline | Six physical staircase lines. The final three lines are indented by the specified responsive offset. The final line alone carries the cyan accent. No extra headline treatment, rings, floating telemetry cards, or generic architecture diagrams. |
| Primary action | One chamfered, cyan, offset CTA directly under the staircase, aligned to the indented lines. |
| Second section | A two-column about/product section with the specific left stair-step heading, descriptive text, matching CTA, and supplied second video flush to the right. The cyan hue overlay must cover the second video exactly. |
| Responsiveness | The mobile hero moves content below the video at the defined `360px` staging margin and removes the desktop scrim. The desktop links/contact action become a compact hamburger and stacked menu. |
| Surface restraint | The public landing has no repeated cards, dark control planes, footer, generic SaaS proof strip, visible technical stack, product orbit, or auxiliary section. Functional commerce routes remain available separately. |
| Naming | “Office Hours” is a working skill only. It must never appear as a product/website brand. The public landing uses neutral product language until the user supplies a final name. |

## Copy adaptation

The reference’s copy is replaced, while its line staging is retained:

```text
LAUNCH
YOUR
COMMERCE
        SYSTEM
        FOR
        BUSINESS
```

The second section describes the sellable promise: a ready storefront, merchant operations, and an extension surface available in one product. It does not make unsupported claims about payment capture, tax calculation, or shipping labels.

## Decision still requiring user direction

The source prompt explicitly mandates **Quantico**, while the user’s latest feedback rejects the current tech/pixel-like type treatment. The rebuild must not assume which instruction takes priority. The user needs to choose whether the visual reference’s font requirement is authoritative or whether the same composition should use a calmer, non-pixel typeface.
