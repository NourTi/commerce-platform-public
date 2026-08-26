# Commerce platform validation notes

## Browser test — catalog initialization

The authenticated preview displayed an account with the `ADMIN` role and the admin overview loaded successfully. The first `initializeDemoCatalog` mutation returned HTTP 403 (`You do not have required permission (10002)`), leaving the action in a loading state. After a server restart, the first admin overview query returned a transient 500 from the cart query; direct database checks confirmed that all commerce tables and the same open-cart SQL query were available. A subsequent reload restored the catalog setup state.

The subsequent explicit setup click succeeded. The admin console reported four published products and exposed the catalog administration controls: product creation, archive/publish control, variant display, inventory inputs, and update actions.

## Browser test — storefront and product

The populated storefront displayed all four published reference products and category tabs. The Arc Lamp product page rendered both variants, current inventory (`18` for Graphite), server-owned workflow statements, and the add-to-cart control.

## Browser test — cart

Adding the Graphite Arc Lamp produced an `Added to cart` confirmation and incremented the cart badge to one. The cart displayed the persisted SKU, unit price, quantity control, and a server-calculated subtotal of `$245` before promotion and shipping.

The `WELCOME15` promotion request did not immediately update the visible cart discount after the first wait cycle. Database inspection confirmed that the open cart persisted `promotionCode = WELCOME15`, and a fresh cart query then displayed the applied promotion, `$37` discount, and `$208` estimated total. The promotion service and recalculation path are verified.

## Browser test — checkout and order

The authenticated checkout displayed the account email, standard and express shipping options, the promoted total, and an explicit pending-payment action. Creating the order returned `FC-2026-RKBRS0V`, showed a `$223` total, cleared the cart badge, and clearly stated that payment capture is not part of this foundation.

## Browser test — post-order operations

The administrator console subsequently showed one created order, the `FC-2026-RKBRS0V` pending-payment record, zero open carts, and the Arc Lamp Graphite inventory reduced from `18` to `17`. This verifies the order record, cart conversion, and inventory-decrement lifecycle.

## Automated checks

`pnpm check` and `pnpm test` passed after the general-commerce domain, router guard, and legacy-namespace changes. The current suite contains 16 passing tests, including cart quantity planning, promotion threshold policy, pending-payment order planning, and deterministic inventory decrement coverage.

## Visual validation — Rivet commerce-in-a-box reset

The Rivet home, storefront, builder surface, and cart were reviewed at desktop and 375 px phone widths. The new public presentation uses the supplied motion clips as managed video layers, staircase typography, clipped action controls, non-repetitive depth planes, and distinct product, merchant, and builder surfaces. The small-phone view keeps the hero readable, exposes a working compact menu, wraps storefront filters, preserves two-column product browsing, and shows the empty-cart action without horizontal overflow.

## Visual validation — dedicated solutions and themes

The dedicated `/solutions` and `/themes` surfaces were reviewed at desktop and 375 px phone widths. The solutions page makes the merchant/agency choice explicit with an interactive tab switch and separate outcome architecture. The themes page provides a selectable three-theme storefront showcase with distinct presentation modes rather than only product copy. Both views retain readable type, non-overflowing controls, reachable action buttons, and the compact Rivet navigation at phone size.

## Live multilingual check — MotionSites reset (in progress)

The rebuilt public landing was opened in the live preview. The French selector state rendered localized hero, navigation, and second-section copy. The Arabic selector state rendered Arabic copy and set the document element to `lang="ar"` and `dir="rtl"`. The two managed video elements both reached `readyState: 4`, remained visible at full opacity, and had nonzero rendered dimensions. Mobile composition, RTL staging, active-route cleanup, and automated checks remain to be completed before this validation can be considered final.

The supplied hero clip was inspected at a representative three-second frame. Its essential composition is the white/charcoal split with the sphere and wireframe crossing the middle, so the desktop stage was repositioned and the scrim was lightened progressively from the protected copy field toward the exposed right-side media. A post-change live screenshot is still required.

At 375 px, the mobile landing exposes the intended top video stage, removes the desktop scrim, places the six-line copy below the staged media using the prescribed 360 px offset rule, and replaces desktop navigation with the working clipped hamburger control. Arabic RTL mobile layout remains to be verified.

Arabic mobile verification passed: `lang="ar"`, `dir="rtl"`, and the open mobile menu all used RTL; localized hero text was present; the indented lower staircase lines used only right margins; and document width equaled scroll width (375 px), confirming no horizontal overflow.

The locale choice also persisted across a fresh live-preview reload: the reopened landing rendered Arabic copy directly, confirming the local storage selection is reused by the application.

The French storefront route was tested in the live browser. The shared shell rendered French navigation and language accessibility text; storefront hero, collection controls, and promotion copy were French; and USD amounts used French presentation (`$US`). Product records themselves remain merchant catalog data and are not machine-translated by the interface.

The Arabic `/docs` route was tested in the live browser. Its shared shell, navigation, docs headings, body copy, module links, and footer were Arabic with RTL direction, while TypeScript contract code intentionally remained left-to-right.

The Arabic cart route rendered its translated empty state with `lang="ar"` and `dir="rtl"`; at the tested desktop width, document and viewport widths both measured 1280 px, confirming no horizontal overflow.

The unauthenticated Arabic merchant-console route was also verified after localizing the shared dashboard gate. Its access heading, boundary explanation, and sign-in action are Arabic; the test did not submit the sign-in action.

At 375 px, the Arabic cart route retained `lang="ar"` and `dir="rtl"`, exposed the compact navigation control, and reported equal document and viewport widths (375 px), confirming no horizontal overflow after the shared commerce RTL adjustments.

Final desktop visual review confirmed the public landing’s managed hero media is visible behind the paper scrim. The hero uses the approved desktop `right: -20%` and `width: 99%` crop with the exact left-to-right scrim stops, while the uploaded poster supplies the intended split-scene stage before video playback.

Desktop English product-detail verification passed for `/store/products/arc-lamp`: the document remained `lang="en"` / `dir="ltr"`, the product rendered, the localized buyer action read “Add to cart,” and document width matched the 1280 px viewport.

Desktop English checkout verification passed for the empty-cart state: its heading, “No open cart” recovery text, and store action were present with `lang="en"` / `dir="ltr"` and no horizontal overflow.

French mobile checkout verification passed at 375 px: `lang="fr"` and LTR direction were applied, the checkout heading and empty-cart recovery were French, the compact navigation control remained present, and document width equaled the viewport.

Arabic mobile documentation verification passed at 375 px: the route rendered `lang="ar"` / `dir="rtl"`, displayed its Arabic developer heading, retained the compact menu, and reported no horizontal overflow.

Final desktop visual review also covered `/store` and `/docs`. The storefront retained a distinct editorial collection layout with product art and catalog controls; the developer surface retained a clear dark-led contract header and readable extension content. Both rendered without visual regressions after locale and RTL updates.

A paced direct browser matrix covered all 36 combinations of EN/FR/AR × desktop/375px × `/store`, product detail, `/cart`, `/checkout`, `/docs`, and `/admin`. Every state rendered content with the selected document language; Arabic used RTL; and all initially had no overflow except the 375px product-detail route. Its large square product art was constrained to 390px by a mobile `min-height`, producing 424px document width in all three locales. The constraint was removed, then English, French, and Arabic product details were retested at 375px: each measured 375px document width, a 308px product art width, and no overflow.

Post-fix shared-shell verification also confirmed the formerly fixed lockup text responds to all three locales at 375px without overflow: English renders “COMMERCE PLATFORM”, French renders “COMMERCE PLATEFORME”, and Arabic renders “منصة التجارة” with RTL direction.

## Multi-tenant platform rebuild validation

The public landing was rebuilt from a two-section short scroll into a complete product journey. Desktop and 375 px captures confirm its merchant-studio, operations, extension, and launch sections render as a deliberate continuous page without a premature scroll boundary.

The database-backed tenant model is verified by the workspace integration test: a new user can bootstrap a workspace, store, owner membership, theme, homepage sections, and extension registry; theme, section visibility, extension status, and publication persist; a second tenant is refused access to the first tenant’s store. The migrated reference store was backfilled with the same studio records and exposes `/s/store-1` as a published storefront.

Live browser validation added Arc Lamp from `/s/store-1`, observed the cart badge increment to one, and then verified the product, USD total, and localized cart presentation after a full `/cart` reload. The active-store session persistence fix restored the same tenant cart on reload. The checkout page preserved the item and stopped at its explicit authenticated, pending-payment boundary; no order was submitted during this validation. Final `pnpm check` passed and `pnpm test` reported 21 passing tests.

At 375 px, the merchant workspace exposed overview, catalog, orders, marketing, storefront studio, and extensions without overflow; the published merchant storefront retained its full hero, real catalog, and capture journey. The mobile workspace navigation remains compact by design, with all six operational destinations reachable.

## Agency handoff and role validation

`pnpm check` passed and `pnpm test` completed with **10 test files / 21 tests passing** after the tenant extension. The database-backed workspace integration test now verifies that a Manager can publish, change an extension, and create/approve a handoff; a Merchandiser can update the theme, sections, product status, inventory, and create a product but is denied extensions/handoffs; and an Analyst remains read-only for storefront and catalog mutations while retaining a saved dashboard view preference. A second tenant remains denied access to the first store.

An end-to-end client review was generated through the same Owner/Manager handoff service used by the merchant workspace. The real `/review/:token` page was captured at desktop and 375 px. Both renders displayed the stored active theme, all four visible section records (hero, featured catalog, story, capture), four published store-scoped products, and a clear shared review state. The review route contains no merchant controls, cart mutation, or customer checkout action. The mobile capture showed no horizontal overflow.

## Authenticated workspace handoff and packaging mockup

The signed-in Owner workspace was opened in the browser, the **Agency handoff** panel was selected, and a new handoff labelled `Workspace handoff validation` was created from the actual UI. The workspace displayed its newly generated token and the corresponding **Open review** action. Opening that exact action resolved `/review/gYPx42R1mFI_ezVwxKWQ` as a read-only shared review with the active Editorial theme, four visible sections, store-scoped published catalogue, no editing controls, and no cart or checkout action.

The tenant storefront and the same client-review hero were visually checked after integrating an original unbranded metallic food-pouch asset. The asset uses an isolated studio composition, realistic foil material, warm orange background, and text-safe whitespace; it is an original generated visual informed by the supplied packaging reference, not a copied source mockup.

## Advanced demo-product mockup

The active demo catalog originally contained one published candy product. A commercially usable food-pouch source was selected from Mockups Design, whose individual source page states **commercial use** and **no attribution required**; its terms and alternatives are documented in `mockup_sourcing_notes.md`. The source preview was adapted into an unbranded candy pouch without source text, logos, or artwork, then hosted as a project asset.

The same product mockup now renders in the tenant storefront catalog, the customer product-detail route, and the read-only client review. Desktop full-page checks confirmed visual consistency across storefront and review. At 375 px, storefront, detail, and review displayed without horizontal overflow; the product-detail image retained a clear, complete pouch composition.

## Optimized media and merchant variant controls

The restored media pipeline now converts merchant JPEG, PNG, and WebP input to a rotated, bounded 2000 px WebP asset before managed storage. It records source content type, original byte count, and optimized byte count against the tenant media record. The protected bulk upload contract accepts up to five files and returns a per-file success/failure outcome; each file stays bounded by the existing 8 MB input guard.

The authenticated workspace provides a localized media desk for product- or variant-scoped bulk uploads, gallery/hover role selection, and inline variant title, color, existing option values, price, and inventory editing. At 375 px, public Store 1 catalog cards render the four snack SKU mockups without overflow, and the Citrus Chews product page retains the gallery and alternate-view strip with its cart action intact. The current automated suite passes: **10 files / 21 tests**, including merchant variant edit authorization and Analyst denial.

After the recovered per-file feedback surface was added, the authenticated user confirmed the fixed **Product media** entry point and its Product, Media for, Gallery, Bulk upload, and Variants controls. With user confirmation, the same tenant-scoped service path processed two Citrus Chews PNG files: both returned individual `success` results and were stored as WebP (1,134,048 → 198,882 bytes; 769,218 → 111,792 bytes). The product variant’s saved color and option values (`Citrus orange`, `Matte`, `Pouch`) persisted with its price and inventory values. A final `pnpm check && pnpm test` passed: **10 files / 21 tests**.

The attached user-browser session was then opened for a direct follow-up check, but remained on the workspace loading state and subsequently reverted to the sign-in gate after the sandbox-reset preview URL changed. This does not affect the confirmed workspace controls, service-level results, persisted media records, or automated tests above; it prevents only an additional automated browser capture of the authenticated post-upload result rows.

## Product-media management and coordinated SKU expansion

The `commerceProductMedia` migration added tenant-scoped, product- and variant-linked media with gallery/hover role, ordering, alt text, and persisted focal crop values. The authenticated Owner workspace now shows eight catalog records: four published snack demo SKUs (`Citrus Chews`, `Cocoa Crisp`, `Sea Salt Popcorn`, and the earlier candy item) plus four archived legacy reference products. Its Product media control exposes a real image input for JPEG, PNG, and WebP; product-gallery or named-variant destination selection; gallery/hover role; focus X/Y sliders; earlier/later ordering; save; and removal actions. The Citrus Chews `Original` variant was selected live and exposed its independent persisted hover asset; the catalog contains no controls for roles without merchandising permission.

The public storefront rendered the four published snack cards with primary and alternate product media. On `/store/products/citrus-chews`, the gallery displayed the persisted primary pouch and alternate thumb; selecting **Alternate view** visibly replaced the main product image with the stored hover asset. The shared client-review URL displayed the same expanded four-product media catalog without merchant controls. `pnpm check` and the complete suite passed with 10 test files / 21 tests, including a new tenant media persistence and analyst-denial path.

## Final authenticated bulk-upload and variant-save validation

The reconnected authenticated Owner browser opened **Product media** in `/workspace` and selected Citrus Chews. The live bulk input accepted the two user-approved local PNG files, `citrus-chews-main.png` and `citrus-chews-hover.png`. The desk showed `Optimized upload complete: 2 • 0`; the rendered live DOM contained both source filenames in their individual outcome rows. The same workspace catalog then showed Citrus Chews with five assets. Persisted records confirm both newly uploaded sources are managed WebP files with retained source type and byte metadata.

The same Owner session set Citrus Chews Original to `Citrus orange` and clicked **Save variant**. The live authenticated request returned HTTP 200 from `commerce.workspace.operations.updateVariant`, persisting title `Original`, price `$7`, inventory `42`, and the options `color: Citrus orange`, `finish: Matte`, and `format: Pouch`. The customer route `/store/products/citrus-chews` was then opened live and visibly rendered **Variant details** with Color/Citrus orange, Finish/Matte, and Format/Pouch. The product-detail presentation is localized in English, French, and Arabic RTL. After the final adjustments, `pnpm check` and `pnpm test` passed with **10 files / 21 tests**.

## Algeria-first commerce workspace checkpoint

The authenticated workspace continued to render after the Algeria-first commercial additions. The desktop capture retained the existing catalog dashboard and displayed the fixed lower-edge controls for **Commerce setup**, **Orders**, and **Product media** without overlap. The account route also rendered the signed-in customer identity, order-linking action, and empty order-history state. The latest regression run completed with **12 test files / 26 tests passing**; the database-backed commercial suite covers cash on delivery, bank transfer, merchant approval, shipment settlement, and configured tax snapshots.

The expanded authenticated `/account` route rendered the customer identity, order-linking control, notification preference, and saved-address form. The first desktop capture found that the new address inputs need a dedicated grid treatment rather than inheriting the compact inline layout; this is a visual refinement pending before the account form can be counted as fully verified.

After the form-grid refinement, the desktop `/account` capture rendered the saved-address inputs as a clean three-column grid with readable field boundaries and spacing. The lower fields continue below the viewport rather than overlapping the account card; responsive phone verification remains pending.

The 375 px `/account` capture passed after the responsive refinement: the signed-in identity, order-link button, notification preference, two-column saved-address form, default toggle, and save action all remained visible without horizontal overflow.

The 375 px workspace capture retained the catalog title, product rows, add-product action, and the fixed Commerce setup, Orders, and Product media controls. It also revealed that the compact workspace navigation starts with a clipped preceding label at the left edge; navigation treatment needs a final mobile refinement before this view is counted as fully validated.

The compact navigation was then changed to a forced two-column grid. The follow-up 375 px capture displayed Overview, Catalog, Orders, Marketing, Storefront studio, Extensions, and Agency handoff fully within the header, with no clipped first label.

Checkout now shows an authenticated customer a saved-address loading state, a non-blocking unavailable message, or an address selector that fills only delivery fields. The checked pure helper preserves the checkout email and bank-transfer reference. A connected account review found no existing saved address and no linked order profile, so no customer data was created solely for validation; authenticated selector interaction remains an explicit browser-validation task.

The merchant order desk now renders return-review actions and manual-refund record actions. The database-backed commercial integration test creates a paid, fulfilled order; submits, approves, and receives a return; records a manual-review refund; then records its external settlement. The test confirms the refund record and does not invoke any money-moving provider. A signed-in workspace browser check opened the order desk successfully; that store has zero merchant orders, so record-bearing controls were not exercised in the browser.

The signed-in workspace now exposes a Catalog CSV desk. Its browser panel presents template download, tenant catalog export, and CSV import controls, and clearly explains the current one-default-variant-per-product-row boundary. Unit coverage accepts quoted JSON options and rejects invalid rows without discarding valid ones; the tenant integration test verifies a Merchandiser import, opening-stock `IMPORT` ledger entry, and Analyst denial. No production catalog import or export was submitted during browser inspection.

With user confirmation, the signed-in merchant workspace exported its current eight catalog rows and reported that they were prepared for download. A one-row `Catalog Import Validation` CSV was then imported through the browser: the desk reported `1 rows imported · 0 rows need attention`, displayed `Row 2 · Created`, and the catalog count temporarily increased from eight to nine. Database verification confirmed the Draft product, its default SKU, `inventoryQty = 1`, and a tenant-scoped `IMPORT` movement with `referenceType = catalog-csv`. The temporary product and its opening-stock ledger row were immediately removed; a follow-up query confirmed zero remaining matching products.

The signed-in Product media desk opens for Citrus Chews after the option-combination UI addition. The panel is scrollable; only the current variant editor is visible in its initial viewport, so the newly added generator remains to be visually inspected below the fold without creating variants.

An initial container-scroll attempt did not move the media desk, and the page-level End key only moved the workspace behind the fixed panel. The generator remains covered by the panel’s internal scroll position; the next non-destructive check will move keyboard focus through the desk controls rather than submit the generator.

Keyboard focus moved through the variant editor without changing values and exposed the `Option combinations` section header at the bottom of the fixed desk. Its editable controls remain below the visible panel area and will be checked by continuing keyboard navigation only.

Focus reached the final existing option field (`Format`) without changing its value. The option-combination header remains visible below it; the remaining non-destructive check will use the desk’s scrollbar directly rather than repeat keyboard navigation.

The generator is present below the existing variant editor and its section header is visible in the live merchant desk. Browser automation could not scroll this nested fixed panel, so its editable fields were not submitted against the user’s catalog. Automated coverage verifies cross-option planning, the 64-variant bound, tenant-role authorization, unique SKU generation, persisted variants, and opening-stock ledger records; no live variants were created during this inspection.

After moving the generator directly below product selection, the connected browser briefly remained on the workspace loading state even after a development-service restart. The authentication request and browser console showed no runtime error; a hard refresh cleared the stale client query cache and restored the signed-in workspace with its eight original products.

The reordered option-combination form is now visible immediately beneath the product selector in the live merchant desk, including localized labels and its options textarea. A first approved submit with the generic `CITRUS-CHEWS` prefix stayed pending and did not persist variants. The form now defaults to the visible store-namespaced prefix `STORE-1-CITRUS-CHEWS` and surfaces mutation errors in the panel; automated checks remain green before replaying the approved temporary test.

With user confirmation, the corrected generator created four Citrus Chews combinations in the live workspace: Orange/Small, Orange/Large, Lemon/Small, and Lemon/Large. Database verification confirmed the four store-namespaced SKUs, one opening unit per variant, and four `MANUAL_ADJUSTMENT` records with `referenceType = variant-generator`. The temporary variants and their four ledger records were removed immediately; a follow-up query returned zero remaining variants and zero remaining movements. The generator controls are localized through the merchant EN/FR/AR catalog dictionary and now appear above the long per-variant editor.

The browser action completed after the store-namespaced change, but its generic feedback was rendered much lower in the media desk and therefore not visible beside the generator. Generation-specific feedback is now placed directly beneath the generator button. A final approved replay is in progress to verify that visible success state, with the existing temporary-data cleanup protocol retained.

The final user-approved replay displayed the direct inline success message `4 variant combinations created` below the Generate variants button, and the expanded Variant editor area refreshed below it. Database verification confirmed the four expected Store 1 SKUs, each with one unit and a `MANUAL_ADJUSTMENT` / `variant-generator` ledger record. The temporary four variants and four movements were then removed immediately; a follow-up query confirmed zero remaining variants and movements matching the test prefix.

After cleanup, one ordinary browser navigation temporarily displayed an empty catalog even though the database retained all eight Store 1 products; this was an isolated stale client-query display. A subsequent browser navigation returned an empty browser document without a console error. This does not alter the generator result above, which was captured before cleanup with visible success feedback and refreshed variant controls. Development checks and the complete automated suite remained green.

The authenticated workspace stability hardening moves browser storage writes from render into a guarded effect and preserves operation-query data across refetches. The updated client passed TypeScript and the full 16-file/35-test suite. A subsequent signed-in browser navigation restored and displayed all eight Store 1 catalog products without the prior empty or blank state.

Two further independent signed-in reload/navigation cycles each retained the full eight-product Store 1 catalog and rendered no blank document. The three workspace consumers of `operations.overview`—the primary catalog, media desk, and CSV desk—now retain prior result data during refetch and do not refetch on window focus. The orders desk uses its separate, opened-only order-operations query and did not require the overview retention pattern.

The merchant workspace now also exposes explicit operation-query states: a loading notice before the first result, an error notice with Retry if a query has no usable data, and a true-empty explanation only when the store has no products. A subsequent signed-in browser check showed the normal eight-product catalog with none of these fallback states incorrectly rendered.

The signed-in workspace now displays a separately reachable Monitor trigger above Catalog CSV. Its read-only panel rendered the native low-stock, payment-review, queued-notice, and recent-inventory sections without overlapping the existing merchant tool triggers. The current store correctly showed zeroes and empty-state explanations; it explicitly states that queued notices remain internal records and do not send an alert or email.

The open Monitor panel was independently rechecked in the browser. Its visible layout showed all three metric cards, the internal-notification boundary statement, the Low stock section, and the Recent inventory activity section together, while preserving access to the Monitor trigger and neighboring Catalog CSV control.

Native subscription billing now has a provider-neutral invoice lifecycle: an administrator can issue a plan invoice, a merchant submits a bank-transfer reference, and an administrator manually marks it paid or void. A paid manual review activates the store plan; no hosted billing provider, funds custody, or automatic settlement is used. The database-backed commercial integration test exercised the entire lifecycle and the 17-file/38-test suite passed. The merchant panel was not browser-inspected after the authenticated browser session became unavailable.

Per-store SEO fields for title, description, and canonical origin were added through applied migration `0011_kind_odin.sql`. The workspace integration test persists the metadata through the OWNER/MANAGER-gated update path and confirms it appears in the public storefront mapping. Merchant controls now validate the short title, description, and HTTPS canonical-origin limits. Browser inspection remains pending because the authenticated merchant browser session became unavailable.

## Privacy export and manual erasure review

Migration `0012_common_screwball.sql` is applied and provides customer privacy-request records. The customer account now exposes an in-browser JSON export of only the signed-in account’s linked profile, addresses, orders, and privacy requests, plus a non-destructive deletion-review request. The server integration test creates a request, prevents a duplicate active request, changes it to `UNDER_REVIEW` through the administrator service, and confirms the same customer export sees that status. Platform administrators have a reviewed-request panel with `UNDER_REVIEW`, `COMPLETED`, and `REJECTED` states and an explicit no-automatic-erasure notice.

The current browser session is unsigned, so neither the signed-in customer controls nor the platform administrator review panel was browser-inspected in this batch. This release does not claim automated deletion, anonymisation, retention scheduling, database backups, database recovery, email delivery, or email-based account recovery; the documented privacy and recovery boundary is in `privacy_retention_recovery.md`.

## Provider-neutral capability registry

The payment-provider keys, defaults, credential gate, merchant-owned-funds constraint, and manual-review/webhook modes are now held in `shared/paymentCapabilities.ts`. Workspace bootstrap and commercial default repair both seed from this single registry, and the merchant payment desk uses the same native-method metadata rather than duplicate fallback configuration. The registry exposes native COD as active, native bank transfer as disabled until a merchant enables it, and Chargily as disabled with a credential-plus-hosted-checkout gate. The server refuses an attempted active/test Chargily configuration and refuses the internal `MANUAL` record as a customer-checkout option. `pnpm check` and the full suite passed with **17 files / 40 tests**; signed-in merchant UI inspection remains pending.

## Workspace retained-data refresh feedback

The merchant workspace has a visible **Refresh catalog** control. During a retained-data overview refetch it changes to an accessible “Refreshing catalog; current products remain visible” notice, and a failed refresh explicitly offers Retry while preserving the last known catalog. The pure resolver test now covers initial loading, hidden/no-workspace, ready, true-empty, retained-data refetch, and retained-data refresh-error precedence. `pnpm check` and the full suite passed with **17 files / 41 tests**. The signed-in browser session is unavailable, so an interactive capture of the refresh transition remains an open browser-validation item.

## Merchant retention and recovery record

Applied migration `0013_curious_lady_vermin.sql` adds the tenant-scoped `commerceStoreDataPolicies` record. Owner/Manager controls in Commerce setup persist customer, order, and audit retention windows; policy/runbook references; a recovery-test date; acknowledgement; and a bounded operational note. Workspace integration coverage confirms owner persistence/hydration, Manager access, and Merchandiser denial. `pnpm check` and the full suite passed with **17 files / 41 tests**. The controls explicitly do not validate legal obligations, schedule deletion, create backups, or restore records; those remain merchant-controlled external operations.

The router guard suite also confirms that an anonymous caller is rejected before any tenant data-policy update can reach storage. After that addition, `pnpm check` and the full suite passed with **17 files / 42 tests**.

The merchant retention and recovery section now uses the existing English, French, and Arabic locale context for its labels, placeholders, policy acknowledgement, and save action. `pnpm check` and the full suite still pass with **17 files / 42 tests**. Its authenticated visual inspection remains pending because no signed-in browser session is available.

## Production route splitting

The application now lazy-loads route modules and merchant tool panels behind a lightweight suspense fallback. A production build completed successfully and reduced the entry JavaScript asset from **1,139.52 kB (260.96 kB gzip)** to **666.97 kB (200.52 kB gzip)**, while creating separate chunks for public storefront, checkout, account, workspace, commercial tools, and operations panels. The build still reports one shared entry chunk above the bundler’s 500 kB warning threshold; further vendor-level splitting is a future performance optimisation rather than a launch blocker. `pnpm check` and the full **17-file / 42-test** suite passed.

A post-split desktop capture of the public landing route rendered the expected hero, navigation, staged media, and primary action with no fallback or chunk-load error visible.

A 375 px capture also rendered the public hero, compact navigation trigger, staged media, headline, and primary action without horizontal clipping or a lazy-route fallback error.

Vendor chunk boundaries now separate React/runtime (**420.43 kB / 125.81 kB gzip**), tRPC/query data client (**100.92 kB / 28.13 kB gzip**), and icons (**29.68 kB / 6.00 kB gzip**) from the application entry (**141.84 kB / 44.72 kB gzip**). The production build completed without the earlier 500 kB chunk warning, while `pnpm check` and the full **17-file / 42-test** suite passed.

Merchant checkout setup now displays Chargily Pay from the shared capability registry as a read-only, disabled capability with its hosted-checkout connector and credential requirement stated inline. It cannot be changed through that panel. Registry policy tests and the full **17-file / 42-test** suite continue to enforce that it remains disabled until a merchant-configured connector exists.

Customer privacy export and deletion-review controls now use English, French, and Arabic copy for their explanatory boundary, actions, local-download status, optional note, and non-destructive review confirmation. `pnpm check` and the full **17-file / 42-test** suite pass. Signed-in browser inspection remains pending and no automatic deletion capability was introduced.

Merchant order operations now includes a visible manual-carrier notice: shipment records can store carrier details, but the platform does not purchase labels or fetch live carrier tracking without a merchant-connected supported carrier account. `pnpm check` and the full **17-file / 42-test** suite pass; no carrier adapter or external account integration was added.

## Storefront discovery and merchant catalog context

The public `/store` collection now provides localized search, category refinement, a live product-count status, and a no-match recovery action. Desktop and 375 px captures showed the search field and result count positioned cleanly within the collection controls while preserving the existing store hero and responsive navigation. The merchant product-media desk now resets stale feedback when a product changes and shows the selected product’s title, variant count, and aggregate in-stock units before variant, combination, and media work. `pnpm check` and the full **17-file / 42-test** suite pass. No checkout, provider, tenant, or role behavior changed.

The collection cards now provide inventory-aware direct add-to-cart actions that call the established native cart workflow without leaving the catalog. Full-page desktop and 375 px captures show the search controls, category filters, cards, price, direct add actions, promotion boundary, and responsive footer with no clipping. The merchant workspace now also mounts a role-gated catalog pulse panel showing published-product ratio, variant count, and low-stock variant count from the same tenant-scoped overview data; it introduces no mutation or new data-access path. `pnpm check` and the full **17-file / 42-test** suite pass.

## Mailjet transactional order notifications

The selected no-cost provider is Mailjet. Its configured credential pair passed a read-only sender-list test that requires the configured sender to appear with an active/verified status; no email is sent by that test. New real checkout notifications now attempt a server-side Mailjet send after the commerce transaction commits. Successful provider acceptance stores the provider message identifier, `SENT` status, and sent timestamp; provider rejection marks the notification `FAILED` without rolling back the order, payment-review state, inventory reservation, or checkout response. Reserved `.test` fixture addresses remain queued and are never sent externally. A dedicated-token callback route is now prepared to map a matching Mailjet `sent` event to destination-server acceptance and bounce/blocked/spam events to suppression, but no callback URL or callback token is configured. `pnpm check` and the full **19-file / 46-test** suite pass. This does not claim inbox delivery, bounce/complaint events, alerts, or account-recovery delivery as live.

## Coordinated conversion and checkout clarity pass

The public collection preserves its existing tenant-backed catalog while now supporting direct stock-aware cart handoff. Merchant catalog health is surfaced only to Owner, Manager, and Merchandiser roles from the existing tenant overview query. Native checkout now explains the selected cash-on-delivery or bank-transfer sequence in English, French, and Arabic: COD is collected at delivery and bank-transfer references are merchant-reviewed. The copy does not claim online payment capture, carrier labels, live tracking, or provider activation. `pnpm check` and the full **17-file / 42-test** suite pass.

## Browser automation boundary

An isolated public storefront check was attempted without using a customer or merchant session. The configured browser automation runtime could not start because its required Firefox executable is not installed. No browser interaction, cart mutation, or order submission occurred. Signed-in merchant/customer validation remains separately unavailable, and the public guest checkout browser task remains open rather than being counted from service-level tests.

## Auth0 customer authentication bridge

The Auth0 regular web application’s server credentials passed a no-send confidential-client token probe, and the configured published origin passed an HTTPS availability probe. The customer login route uses a signed ten-minute transaction cookie, PKCE, strict local return-path validation, and server-side ID-token verification for issuer, audience, nonce, subject, and verified email before it creates a local `auth0:`-namespaced identity and the existing local session. Focused coverage verifies transaction tamper rejection, open-redirect rejection, PKCE construction, and Auth0 customer-subject namespacing. A route-only check returned the expected Auth0 authorization redirect with the exact published callback URL and did not submit or create a customer login.

The full `pnpm test` suite completed with **24 passing files / 56 passing tests** and one intentionally skipped Mailjet credential probe; `pnpm check` and `pnpm build` also passed. The Auth0 dashboard allow-list entries were user-confirmed as saved. A subsequent `/account` capture used an existing browser session and therefore is not evidence of an Auth0 login. No test customer, customer credential, or customer order was created; the complete hosted Auth0 redirect remains a voluntary customer-validation task.

## Public Auth0 customer sign-in discovery

The public landing header now includes a distinct **Customer sign in** action that starts only the Auth0 customer flow at `/api/auth0/login?returnTo=%2Faccount`. The shared storefront header and its mobile menu expose the same destination. English, French, and Arabic labels are covered by focused regression tests. Desktop and 375 px public landing captures confirm the action is visible and reachable without horizontal clipping. The validation did not click the action, enter Auth0, or create a customer account; a completed hosted customer login remains voluntary validation work.

## Auth0 callback configuration correction pending

The deployed customer sign-in route correctly redirects to the Auth0 `/authorize` endpoint, but Auth0 initially rejected the return address because the application’s **Allowed Callback URLs** contained only `http://localhost:5000/callback`. With user approval, the production callback `https://everhours-qr4dvska.manus.space/api/auth0/callback` was added and Auth0 confirmed that the configuration was saved. A cookie-preserving no-login probe now returns Auth0’s login page (`HTTP 200`) with username/password controls and no callback mismatch. The probe did not enter credentials, complete a customer login, create an account, or create an order.

## Customer authentication no longer falls back to Manus

The client-wide unauthenticated-error redirect to Manus was removed, and the landing header, storefront shell, mobile navigation, and unauthenticated customer account action now share the same Auth0 customer-login destination. The published `/account` route remains on the customer-account screen when unsigned and shows the Auth0 customer action rather than redirecting. Opening the shared destination displays Auth0’s **Log in | My App** page with email, password, sign-up, and Google controls; no credential was entered.

An existing legacy local session is no longer treated as a customer session: customer account data renders only when the resolved local identity has `loginMethod = auth0`. A desktop account capture with an existing local session now renders the unauthenticated customer card and its Auth0 sign-in action, not the customer profile. Focused Auth0-routing coverage, the full **24-file / 60-test** suite, and the production build pass.
