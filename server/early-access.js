import { validateSignup } from '../lib/state.js';
const reply = (body, status) => new Response(JSON.stringify(body), { status, headers: { 'Content-Type': 'application/json', 'Cache-Control': 'no-store', 'X-Content-Type-Options': 'nosniff' } });
/**
 * Provider-neutral, fail-closed endpoint for the later Omnisend integration.
 * Bind a durable rate limiter and server-side subscribe handler before enabling.
 * Do not expose provider credentials or this handler's configuration to the client.
 */
export async function handleEarlyAccess(request, { enabled = false, allowedOrigin, rateLimit, subscribe, now = () => new Date() } = {}) {
  if (request.method !== 'POST') return reply({ error: 'Method not allowed' }, 405);
  if (!enabled || !allowedOrigin || typeof rateLimit !== 'function' || typeof subscribe !== 'function') return reply({ error: 'Registration is not open' }, 503);
  if (request.headers.get('Origin') !== allowedOrigin) return reply({ error: 'Request not allowed' }, 403);
  if (!request.headers.get('Content-Type')?.startsWith('application/json')) return reply({ error: 'JSON required' }, 415);
  if (Number(request.headers.get('Content-Length') || 0) > 4096) return reply({ error: 'Request too large' }, 413);
  let body;
  try {
    // Streaming limit also handles chunked bodies without trusting Content-Length.
    const reader = request.body?.getReader(); if (!reader) return reply({ error: 'Invalid request' }, 400);
    const chunks = []; let size = 0;
    for (;;) { const { value, done } = await reader.read(); if (done) break; size += value.byteLength; if (size > 4096) { await reader.cancel(); return reply({ error: 'Request too large' }, 413); } chunks.push(value); }
    const bytes = new Uint8Array(size); let offset = 0; for (const chunk of chunks) { bytes.set(chunk, offset); offset += chunk.length; }
    body = JSON.parse(new TextDecoder().decode(bytes));
  } catch { return reply({ error: 'Invalid request' }, 400); }
  if (!body || typeof body !== 'object') return reply({ error: 'Invalid request' }, 400);
  const validation = validateSignup(body);
  if (!validation.valid || body.consentVersion !== 'founders-marketing-v1' || body.source !== 'oryn-b-founders') return reply({ error: 'Valid email and consent required' }, 422);
  try {
    if (!await rateLimit(request, validation.email)) return reply({ error: 'Please try again later' }, 429);
    // The trusted adapter must confirm durable acceptance before the UI shows success.
    const result = await subscribe({ email: validation.email, consent: { marketing: true, version: 'founders-marketing-v1', text: 'I’d like ORYN B launch news and marketing emails. I can unsubscribe at any time.', capturedAt: now().toISOString(), source: 'oryn-b-founders' } });
    if (result?.accepted !== true) return reply({ error: 'Registration unavailable' }, 502);
    return reply({ accepted: true }, 202);
  } catch { return reply({ error: 'Registration unavailable' }, 502); }
}
