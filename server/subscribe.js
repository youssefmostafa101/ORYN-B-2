const consentText = 'I’d like ORYN B launch news and marketing emails. I can unsubscribe at any time.';
const origin = 'https://oryn-b-cinematic-review.proudcabin3.chatgpt.site';
const launchOrigins = [origin, 'https://orynb.com', 'https://www.orynb.com'];
const reply = (body, status = 200) => new Response(JSON.stringify(body), { status, headers: { 'Content-Type': 'application/json', 'Cache-Control': 'no-store' } });
const hash = async value => [...new Uint8Array(await crypto.subtle.digest('SHA-256', new TextEncoder().encode(value)))].map(n => n.toString(16).padStart(2, '0')).join('');
const emailOctopusReady = env => Boolean(env?.EMAILOCTOPUS_API_KEY && env?.EMAILOCTOPUS_LIST_ID);
const emailOctopusUrl = (env, contactId) => 'https://api.emailoctopus.com/lists/' +
  encodeURIComponent(env.EMAILOCTOPUS_LIST_ID) + '/contacts' + (contactId ? '/' + encodeURIComponent(contactId) : '');

// Credentials stay on the hosted backend. Never expose the API key in GitHub Pages markup or browser JS.
async function emailOctopusRequest(env, method, contactId, body) {
  const response = await fetch(emailOctopusUrl(env, contactId), {
    method,
    headers: { Authorization: 'Bearer ' + env.EMAILOCTOPUS_API_KEY, 'Content-Type': 'application/json' },
    signal: AbortSignal.timeout(8500),
    body: JSON.stringify(body)
  });
  if (response.status === 409 && method === 'POST') return { duplicate: true };
  if (!response.ok) return { error: true, status: response.status };
  const payload = await response.json().catch(() => ({}));
  const contact = payload?.data?.id ? payload.data : payload;
  return { contact, status: response.status };
}

async function readJson(request) {
  const reader = request.body?.getReader(); if (!reader) throw Error('Missing body');
  const chunks = []; let length = 0;
  for (;;) { const { value, done } = await reader.read(); if (done) break; length += value.length; if (length > 4096) { await reader.cancel(); throw Error('Too large'); } chunks.push(value); }
  const bytes = new Uint8Array(length); let offset = 0;
  for (const chunk of chunks) { bytes.set(chunk, offset); offset += chunk.length; }
  return JSON.parse(new TextDecoder().decode(bytes));
}

export async function handleSubscribe(request, env) {
  if (!['POST', 'DELETE', 'OPTIONS'].includes(request.method)) return reply({ error: 'Method not allowed' }, 405);
  const requestOrigin = request.headers.get('Origin');
  if (![...launchOrigins, new URL(request.url).origin].includes(requestOrigin)) return reply({ error: 'Request not allowed' }, 403);
  let response;
  if (request.method === 'OPTIONS') {
    const method = request.headers.get('Access-Control-Request-Method');
    const headers = (request.headers.get('Access-Control-Request-Headers') || '').toLowerCase().split(',').map(h => h.trim()).filter(Boolean);
    if (!['POST', 'DELETE'].includes(method) || headers.some(h => h !== 'content-type')) return reply({ error: 'Request not allowed' }, 403);
    response = new Response(null, { status: 204, headers: { 'Access-Control-Allow-Methods': 'POST, DELETE', 'Access-Control-Allow-Headers': 'Content-Type', 'Access-Control-Max-Age': '600' } });
  } else response = await processSignup(request, env);
  response.headers.set('Access-Control-Allow-Origin', requestOrigin);
  response.headers.set('Vary', 'Origin');
  return response;
}

async function processSignup(request, env) {
  if (!request.headers.get('Content-Type')?.startsWith('application/json')) return reply({ error: 'JSON required' }, 415);
  if (!env?.DB || !emailOctopusReady(env)) return reply({ error: 'Signup temporarily unavailable; ESP connection not configured' }, 503);
  let body;
  try { body = await readJson(request); } catch { return reply({ error: 'Invalid request' }, 400); }
  if (!body || typeof body !== 'object') return reply({ error: 'Invalid request' }, 400);

  try {
    if (request.method === 'DELETE') {
      if (typeof body.token !== 'string' || !/^[a-f0-9]{64}$/.test(body.token)) return reply({ error: 'Invalid request' }, 422);
      const tokenHash = await hash(body.token);
      const subscriber = await env.DB.prepare('SELECT emailoctopus_contact_id FROM launch_subscribers WHERE removal_hash = ?').bind(tokenHash).first();
      if (!subscriber) return reply({ removed: true });
      // A one-click removal must also unsubscribe the contact from the ESP before local deletion.
      if (subscriber.emailoctopus_contact_id) {
        const result = await emailOctopusRequest(env, 'PUT', subscriber.emailoctopus_contact_id, { status: 'unsubscribed' });
        if (result.error) return reply({ error: 'Unable to complete unsubscribe; please try again' }, 503);
      }
      await env.DB.prepare('DELETE FROM launch_subscribers WHERE removal_hash = ?').bind(tokenHash).run();
      return reply({ removed: true });
    }

    const email = typeof body.email === 'string' ? body.email.trim().toLowerCase() : '';
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email) || email.length > 254 || body.consent !== true ||
      body.consentVersion !== 'oryn-launch-v2' || body.website || !['BOTH', 'OUTPUT', 'DEEP STATE'].includes(body.interest))
      return reply({ error: 'Valid email and consent required' }, 422);

    const now = Date.now();
    const bucket = await hash((request.headers.get('CF-Connecting-IP') || 'local') + ':' + Math.floor(now / 3600000));
    const attempts = await env.DB.prepare(
      'INSERT INTO signup_limits (bucket, attempts, expires_at) VALUES (?, 1, ?) ON CONFLICT(bucket) DO UPDATE SET attempts = signup_limits.attempts + 1 RETURNING attempts'
    ).bind(bucket, now + 3600000).first();
    if (attempts.attempts > 15) return reply({ error: 'Please try again later' }, 429);

    // The list automation uses "Contact added": the ESP—not this website—sends welcome emails.
    // Omitting status allows the list's own double-opt-in configuration to be respected.
    const provider = await emailOctopusRequest(env, 'POST', null, { email_address: email });
    if (provider.duplicate) return reply({ error: 'This email is already registered in the list' }, 409);
    const contactId = provider.contact?.id;
    if (provider.error || typeof contactId !== 'string' || !contactId)
      return reply({ error: 'Could not confirm EmailOctopus signup; please try again' }, 503);
    const token = [...crypto.getRandomValues(new Uint8Array(32))].map(n => n.toString(16).padStart(2, '0')).join('');
    await env.DB.batch([
      env.DB.prepare(
        'INSERT INTO launch_subscribers (id, email, interest, consent_text, consent_version, created_at, removal_hash, emailoctopus_contact_id) VALUES (?, ?, ?, ?, ?, ?, ?, ?) ON CONFLICT(email) DO UPDATE SET removal_hash = excluded.removal_hash, interest = excluded.interest, consent_text = excluded.consent_text, consent_version = excluded.consent_version, emailoctopus_contact_id = excluded.emailoctopus_contact_id'
      ).bind(crypto.randomUUID(), email, body.interest, consentText, 'oryn-launch-v2', new Date(now).toISOString(), await hash(token), contactId),
      env.DB.prepare('DELETE FROM signup_limits WHERE expires_at < ?').bind(now)
    ]);
    const pendingConfirmation = String(provider.contact.status || '').toLowerCase() === 'pending';
    return reply({ accepted: true, pendingConfirmation, removalToken: token }, 201);
  } catch {
    // Never claim consent capture succeeded when the provider could not be confirmed.
    return reply({ error: 'Registration temporarily unavailable' }, 503);
  }
}
