# ORYN B — Coming soon

The final simplified direction follows the clarity of the user-selected Trenchies reference: bold system typography, a two-column hero, restrained motion, original product photography, green/cream brand colors and a single launch-list action. The user's revised brief supersedes the cinematic requirements in the archived Creative Handoff V2. The former 3D/cart/scratch implementation remains recoverable in Git history.

## Run

Node.js 24 and pnpm are used. Run `pnpm install --frozen-lockfile`, `pnpm build`, `pnpm dev`. The local preview is http://127.0.0.1:4173. Its signup database is in memory and discarded when the server stops. `pnpm test` tests the actual signup handler with SQLite. `node tools/browser-check.mjs` checks sizes, original photo treatment, gallery, motion, opt-in and accessibility. Set `BROWSER_CHANNEL=chromium` in CI or use installed Edge locally. Optional `ORYN_QA_OUTPUT` sets the screenshot/report directory.

## Site

- Original OUTPUT and DEEP STATE mockups only. No generated hero/product composites, color filters or blend modes. Aspect ratios are preserved with `object-fit: contain`.
- A subtle six-second tilt/float of the original photo, with pause and reduced-motion support. No WebGL, bottle opening, exploded capsules, cart, checkout or scratch reveal.
- Five photo views per product. Notify actions all lead to the same simple opt-in form.
- The form validates email and explicit unchecked marketing consent; the server saves email, interest, exact consent text/version and server timestamp in D1 before confirming success. Duplicate emails are deduplicated. A private per-signup token permits immediate removal; only its hash is stored. Form failures never claim success. No personal information is written to browser storage or logs.
- Omnisend is not connected. The first-party launch list works independently. Connect a provider and test unsubscribe before sending launch messages. No email-sending or selling is performed by this site.

## Hosting and release

`.openai/hosting.json` retains the existing private preview identity. The minimal Worker embeds the selected original-photo assets and serves both the page and `/api/subscribe`. D1 migrations are generated with Drizzle and included under `dist/.openai/drizzle`. There are no runtime npm dependencies. The deterministic build produces `dist/server/index.js` and hosting metadata.

The GitHub workflow tests and packages; it does not deploy or change DNS. `main`, `CNAME` and orynb.com remain untouched until the user approves replacing the live site. Final business/contact/privacy details and confirmed product facts are needed before public release. No prices, ingredient amounts, discounts or launch dates are invented.
