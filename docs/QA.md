# Preview verification — 16 October 2026

Private review URL: https://oryn-b-cinematic-review.proudcabin3.chatgpt.site (available after the preview deployment).

## Passed locally

- 9 automated unit/handler tests: validated cart persistence, quantity bounds and removals; deterministic reversible motion; cap/capsule sequencing; valid email and explicit consent; disabled endpoint; same-origin checks; payload limit; rate limiting; provider error handling; server timestamp and consent evidence.
- 16 browser checks in installed Microsoft Edge, including layouts at 320, 390, 768 and 1440px; WCAG 2 A/AA and 2.1 AA automated scan with zero reported violations; all product gallery views; lightbox keyboard/Escape; mobile bag, quantities, bundle, focus containment and persistence; hostile localStorage; mobile menu; accessible reveal; scratch pointer gesture; email/consent errors; honest disconnected form; mocked connected success/failure; no-JavaScript content; actual WebGL rendering and scroll phase reversal on mobile/desktop; pause/resume; unavailable-WebGL fallback; initial resource checks.
- Zero page JavaScript errors during the browser suite.
- Initial mobile local test: 242,570 bytes transferred, no third-party resource calls, no 3D engine loaded at the hero, cumulative layout shift 0. Local LCP observation 292ms without network throttling. This is a local lab observation, not a field Web Vitals score or a performance guarantee on phones.
- Desktop/mobile screenshots visually inspected; corrected label UV orientation, open-cap framing, mobile hero fit, mobile overflow and scratch opacity. Original product galleries are preserved.

## Verification boundaries

Browser motion tests use software WebGL rendering and emulate mobile viewports/touch capability. Physical iOS/Android devices, Safari/Firefox, real mobile GPU power and heat, throttled cellular performance, field Web Vitals, and a real touchscreen gesture remain unverified. No approved rendered image/video sequence was supplied, so a WebGL-versus-sequence production benchmark is pending that source asset. Exact model/label fidelity needs measured manufacturer assets and art-direction approval.

Omnisend is intentionally disconnected. Transport states are tested with intercepted local mock responses; no email was submitted externally. No real checkout, order, stock reservation, discount or price exists. Legal, business and final supplier content approvals are outstanding.

GitHub Actions supplies repeatable checks and a build artifact, without deployment permissions. A workflow result is only confirmed after GitHub reports completion; local results above do not imply a CI run has passed.

The original live baseline is commit `6a122eb5f43c6ec97b26dcfcfcc583d0b5218ae3`. `CNAME` stays unchanged. The live website is not replaced by this preview.
