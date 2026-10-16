# ORYN B

Production implementation of the approved Creative Handoff V2, prepared as a private preview for approval. The live `main` baseline and `CNAME` are preserved; this branch is not authorization to deploy to orynb.com.

## Run

Use Node.js 22+ and pnpm. Run `pnpm install --frozen-lockfile`, `pnpm build`, then `pnpm dev`. The preview serves at http://127.0.0.1:4173. `pnpm test` runs cart, motion-timeline, and signup-handler tests.

The deployable site is `dist/`, not the repository root. The build vendors the pinned Three.js modules locally. Responsive images and fonts are checked in; rebuilding does not need font or image-service access. `node tools/prepare-assets.mjs` regenerates image derivatives from retained source assets and can fetch missing fonts. Set Node's standard proxy configuration when needed. Font and Three.js licenses are included.

## Browser verification

`node tools/browser-check.mjs` runs responsive/accessibility checks at 320, 390, 768 and 1440px, galleries, cart, persistence, mobile navigation, scratch gesture, consent states, transport mocks, no-JavaScript, real WebGL timelines, fallback and initial-payload checks. It defaults to installed Edge; set `BROWSER_CHANNEL=chromium` when using Playwright's installed Chromium. Outputs go to `test-results/` unless `ORYN_QA_OUTPUT` names another directory.

`node tools/capture.mjs` records desktop/mobile screenshot evidence. These checks emulate screen sizes and touch capability; they do not replace physical-device GPU/touch QA or field Web Vitals. A private preview URL and final QA record are documented in `docs/QA.md` when available.

## Experience

- Native HTML hero, separate cleaned environment and product assets, approved palette and locally hosted Manrope/Space Grotesk.
- Scroll-controlled WebGL product scenes, actual modeled cap and capsule geometry, original label ink, reversible phase timing, pause and static fallbacks. Engine is deferred until a motion chapter approaches.
- Five original views per product, zoom/lightbox with keyboard and swipe navigation.
- Responsive dialog bag with quantity bounds, validated local persistence and a Daily System selection. No checkout or invented prices.
- Touch scratch reveal with keyboard equivalent and a transparent same-invitation mechanic.
- Email/consent form ready for a later same-origin integration. The preview saves or sends no emails.

## Launch gates

Read [production readiness](docs/PRODUCTION-READINESS.md) and [email integration](docs/OMNISEND-INTEGRATION.md). Exact manufacturer packaging fidelity requires proper CAD/dimensions and label artwork. Final supplier facts, business policies, commerce arrangements, email integration, real-device verification and explicit user approval remain launch gates. The 3D scene is a real implementation with photo-derived approximations, not a claim that missing 3D source assets have been supplied.

The review preview is deliberately private and noindexed. The quality workflow builds and tests only; it does not publish, replace the live site, modify DNS, or change GitHub Pages settings.
