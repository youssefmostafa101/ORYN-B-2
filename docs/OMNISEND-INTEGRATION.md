# Early-access integration

The preview does not collect email addresses. `site-config.js` has `endpoint: null`. The frontend stores only launch bag product IDs and quantities. It never saves an email in localStorage, analytics, URLs or logs.

The form implements email validation, required unchecked marketing consent, a honeypot, pending/error states, a 12-second timeout, and success only after a server acknowledgement. The consent wording and version match `server/early-access.js`.

To connect later:

1. Approve the business's privacy notice, support contact, applicable markets, consent text and retention policy. Confirm any invitation/offer terms separately.
2. Deploy `handleEarlyAccess` at a same-origin `/api/early-access` endpoint. This adapter is supplied source; it is NOT deployed in the static preview. Bind a durable, privacy-conscious rate limiter and a server-only Omnisend adapter. Read the then-current official Omnisend API documentation at integration time. Confirm list identifiers and double-opt-in requirements. Never place an API key in static assets or commit it.
3. The provider adapter accepts `{email, consent}` and must return `{accepted: true}` only after durable provider acceptance (including any required verification flow). Use provider-supported idempotency/deduplication and an allowlisted source tag. Persist consent evidence with the provider or an approved secure store. Do not echo provider errors or emails in logs.
4. Set `enabled: true`, exact `allowedOrigin`, `rateLimit` and `subscribe` on the server. The endpoint otherwise fails closed. Review infrastructure security, trusted proxy behavior, bot protection and retention before public collection.
5. Set the client's `endpoint: '/api/early-access'`. Update privacy and the preview disclosure. Test successful/duplicate requests, opt-in confirmation, unsubscribe, invalid email, missing consent, rate limiting, provider outage and timeout on the deployed origin.

No discount, BOGO, price, medical claim, or launch date is encoded in this flow.
