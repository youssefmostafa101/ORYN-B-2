# ORYN B production readiness

## Scope and live-site protection

The source is on `preview/cinematic-production` in ORYN-B-2. The existing main branch remains the recoverable live baseline. `CNAME` is retained unchanged in Git and excluded from private preview output. No domain, DNS, Pages setting, production branch, or live deployment is changed by this work. The preview is private and noindexed. Publishing to orynb.com requires the user's approval.

## Motion fidelity

The cinematic scenes use actual WebGL meshes, physically based materials, a studio environment, modeled bottle/neck/cap geometry, cap ribs, curved label surfaces and 3D capsules with seams and fine surface texture. They are not the handoff's CSS bottle. Label ink is extracted from the supplied original mockup pixels, not typeset or generated.

The geometry is an approximation modeled from the supplied photos. No manufacturer CAD, measured dimensions, production label dieline, high-resolution wrap texture or rendered sequence was supplied. The unseen back/side label cannot be verified. The camera is deliberately limited to small angles to keep the supplied front label visible. Capsule behavior is art-directed and reversible, not a physics simulation. Manufacturer-exact final advertising fidelity still needs proper source assets and an art-direction signoff. This preview must not be described as an approved final packaging render.

DEEP STATE phases: arrive 0–20%; open 20–36%; expand 36–58%; suspend 58–70%; return 70–86%; close 86–93%; settle 93–100%. Capsules fully re-enter before the cap closes. OUTPUT uses a separate orbital powder-inspired field, with no ingredient/dosage representation.

Rendering is lazy-loaded, only responds while visible and changing, stops on hidden tabs/pause, caps pixel density and reduces mobile particles. Reduced-motion preference uses static photography and shorter content sections; no WebGL download is needed on first load with reduced motion. Unsupported/lost WebGL uses a static photo. There is no scroll-jacking. A video/image-sequence benchmark against an approved rendered sequence remains unavailable because no such sequence was supplied; do not claim this comparison passed. Real-device GPU and touch QA remain required beyond emulation.

## Content gates before live release

- Confirm current supplier product names, ingredients, amounts, servings, directions, packaging and all regulatory statements. The preview intentionally omits unverified facts, pricing and health claims in copy. Supplied packaging photos retain their original printed copy for review.
- Confirm pricing, launch date, stock, shipping, taxes and bundle terms. Checkout is intentionally absent; the launch bag is a local selection aid.
- Approve privacy/terms with business identity, contact, applicable regions, actual providers and operational details. Preview notices describe current behavior and are not the final sales policies.
- Connect and verify Omnisend following `OMNISEND-INTEGRATION.md`. No email is currently stored or transmitted.
- Approve the preview, final packaging fidelity and motion; only then plan a live deployment. Remove review-only noindex rules only for approved launch. Review canonical/social URLs and business metadata then.

## Assets

Original supplied product mockups are retained in `assets/`. Galleries use responsive WebP derivatives with black sidebars cropped away; no label words are altered. The hero combines a cleaned environment plate derived from the approved hero and a separate product composite based on the original mockups. Generated composite tiny type and edge fidelity require comparison with final source artwork before advertising signoff.

Image generation used the built-in image tool. Prompts: remove all UI text, products and logos from the approved hero while preserving its stone, water, light and forest-green laboratory composition; extract the original OUTPUT and DEEP STATE products side-by-side with transparent background and preserve label text. These are saved as `assets/hero-environment.png` and `assets/product-duo.png`, with optimized WebP variants. No external stock imagery is used. Fonts are self-hosted Manrope and Space Grotesk.
