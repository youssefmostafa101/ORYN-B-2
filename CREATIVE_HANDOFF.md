# ORYN B — Creative & Production Handoff v2

## Approved
- Approved full-screen cinematic hero: `assets/approved-hero.png`. Preserve general framing, packaging and dark laboratory aesthetic.
- Palette: #101712 near-black, #18291F forest, #E9E4D3 cream, #F6F4EE chalk.
- Real supplied mockups: `assets/output-1.jpg` through `output-5.jpg`, and `deep-1.jpg` through `deep-5.jpg`. Do not fabricate label text.
- Fonts concept: Manrope UI, Space Grotesk display. Refine as needed while retaining visual hierarchy.
- Clean product photography + intense controlled motion; 70% Dark Laboratory, 30% Performance Underground.

## Pages / layout
1. Full-screen cinematic hero, real CTAs, responsive alternate mobile typesetting.
2. Two-product choice.
3. OUTPUT motion section: jar in dimensional orbit with precise powder/electrolyte particle field, distinct from DEEP STATE.
4. DEEP STATE sticky scroll sequence: bottle approaches, cap twists/lifts, realistic capsule forms launch outward in slow motion, hover in depth with camera parallax, reverse trajectories and assemble back inside, cap descends and closes.
5. Complete product details and real image galleries for each product.
6. Bundle / Daily System section.
7. Founders' early access and scratch-reveal, with a transparent guaranteed-offer mechanic.
8. FAQ, legal footer and accessible navigation.

## Motion development requirements
- `index.html` is an art-direction study, NOT a production animation or verified 3D bottle model. Replace CSS bottle with a properly modeled bottle and cap, real approved label texture and physically believable capsule rendering.
- For a site that must remain performant on mid-range phones, use optimized 3D rendering (Three.js/React Three Fiber where justified) or a compressed image/video sequence with a static fallback. Benchmark both; do not use an oversized video just to simulate a small animation.
- Scroll-driven timeline phases, not autonomous chaotic animation. Proposed DEEP STATE proportions: 0–20% arrive; 20–36% twist/open; 36–58% expand; 58–70% suspension; 70–93% reverse/close; 93–100% settle. Smooth both scroll directions.
- Mobile: shorter sequence or lightweight rendering; provide prefers-reduced-motion fallback, visible content without JS and keyboard-usable CTAs. No scroll-jacking.
- Aim for strong web vitals and visual clarity. Image assets responsive, compressed; avoid blocking font loading, avoid layout shift, test on touch devices.

## Commerce / compliance gates
- Coming soon; no actual checkout or price promises until the user explicitly approves live selling.
- Omnisend forms and automated email flows are *not connected* in this prototype. Implement securely, test consent capture and consent copy before public release.
- Offer magnitude (e.g. BOGO) TBD pending contribution margin, product costs, shipping and tax. Do not claim guaranteed discounts without signoff.
- Verify Supliful's final ingredients, amounts, servings, actual manufacturer images, directions, statements and regulatory disclosures before publishing.
- Preserve the user's preferred product names: OUTPUT and DEEP STATE.
- Do not push to live domain until preview, visual QA, legal review, and user approval.

## Production workflow
Use this ZIP as source-of-truth references alongside original ORYN B assets. In Work mode inspect current GitHub repository first; build on a new branch, retain existing working files as backup, and produce preview link/screenshots/video capture (desktop + mobile). Report what was achieved and what is blocked. Ask for approval before touching production.
