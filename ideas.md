# EverShop Office Hours — Design Direction

## Three approaches considered

| Theme Name | Very Brief Intro | Probability |
|---|---|---:|
| **Studio Ledger** | A tactile editorial commerce journal, balancing warm paper surfaces with disciplined systems diagrams. It makes complex infrastructure feel legible, human, and ready to ship. | 0.07 |
| **Quiet Hardware** | A polished industrial interface in graphite, aluminum, and cold white, treating commerce modules like precisely engineered components. It conveys speed, control, and technical confidence. | 0.04 |
| **New Market** | An optimistic gallery-like storefront using bright pigments, varied imagery, and asymmetrical content blocks to show commerce as a living publishing medium. | 0.09 |

## Chosen approach: Studio Ledger

### Design Movement

**Contemporary editorial design with technical field-notes discipline.** The site borrows the confidence of independent magazines and the clarity of architecture diagrams, positioning EverShop as a commerce engine that gives creative teams room to make an ownable storefront.

### Core Principles

1. **Editorial framing over platform dashboard language:** prominent typographic claims, annotations, and purposeful cropping will replace generic SaaS panels.
2. **System made tangible:** every technical message will resolve into a visible surface, module, or flow rather than an abstract feature list.
3. **Asymmetric continuity:** horizontal rules, vertical page notes, and stacked volumes will create a narrative scroll rather than a centered card grid.
4. **Measured contrast:** warm off-white for focus, ink for authority, and a single saturated vermilion highlight for action and status.

### Color Philosophy

The palette uses **paper-white and oxidized ink** to evoke a working studio; those neutral tones keep the site readable and make architecture feel enduring rather than trend-led. **Signal vermilion** appears only where the visitor must orient, decide, or move forward, creating a memorable visual signature without relying on a decorative gradient.

### Layout Paradigm

The page reads as an **editorial spread unfolding down a pinned margin**. The hero is arranged around a large image and a narrow technical sidecar; subsequent sections alternate between full-bleed visual “plates” and compact annotated columns. Content is deliberately offset, not container-centered.

### Signature Elements

1. A persistent vertical folio mark that tracks the visitor through the narrative.
2. Fine red registration marks and numbered captions to connect every scene to a system capability.
3. Layered “paper plates” with hairline rules, mimicking a creative director’s annotated production board.

### Interaction Philosophy

Interaction should reveal configuration rather than decorate. Users will choose between storefront, content, and commerce views through a compact module switcher; each selection changes the accompanying explanation, live indicator, and supporting diagram. Buttons behave like decisive editorial actions, not generic UI controls.

### Animation

The graphic system uses subtle 160–260ms transforms and opacity fades: lines draw in, card plates rise 4px on hover, and the active module slides into its annotated position. The hero image receives a slow, nearly imperceptible vertical drift; all non-essential motion is disabled for reduced-motion preference. No looping glows, elastic effects, or attention-seeking motion.

### Typography System

**DM Mono** is used for labels, statuses, model names, and annotation numbers; **Manrope** carries navigation and body copy; **Cormorant Garamond** supplies sparse, high-contrast editorial moments in major headlines. Headline scales are deliberately varied—large italic display phrases meet compact mono metadata—with body copy kept at an accessible, calm reading size.

### Brand Essence

**EverShop Office Hours is a hands-on editorial brief for teams turning an extensible commerce engine into a storefront with a point of view.**

Personality: **considered, precise, energetic.**

### Brand Voice

Headlines should be direct, opinionated, and grounded in practical possibility. CTAs should name the action or output, not ask users to “get started.” Microcopy should sound like a useful studio note, not promotional padding.

> “Your storefront is not a theme choice. It is a business decision.”

> “Map the module. Shape the surface.”

### Wordmark & Logo

The wordmark typesets **OFFICE / HOURS** as a stacked editorial masthead, with the slash behaving as a deliberate registration cut. The icon is a solid, square-set folded bracket: two offset geometric planes that imply an “E” without becoming a literal letter. It communicates modular assembly, software structure, and editorial crop marks.

### Signature Brand Color

**Signal Vermilion — #E84930.**

## Implementation scope

The static frontend will deliver an editorial landing page with an active commerce-module switcher, a concept storefront composition, a visual translation from EverShop modules to user-facing experiences, and direct links to the official documentation and source. It will deliberately avoid a fake checkout or fabricated reviews; EverShop is described as the backend that would power a real deployment.
