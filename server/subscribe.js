const consentText = 'I’d like ORYN B launch news and marketing emails. I can unsubscribe at any time.';
const origin = 'https://oryn-b-cinematic-review.proudcabin3.chatgpt.site';
const reply = (body, status = 200) => new Response(JSON.stringify(body), { status, headers: { 'Content-Type': 'application/json', 'Cache-Control': 'no-store' } });
const hash = async value => [...new Uint8Array(await crypto.subtle.digest('SHA-256', new TextEncoder().encode(value)))].map(n => n.toString(16).padStart(2, '0')).join('');
async function readJson(request) {
  const reader = request.body?.getReader(); if (!reader) throw Error('Missing body');
  const chunks = []; let length = 0;
  for (;;) { const { value, done } = await reader.read(); if (done) break; length += value.length; if (length > 4096) { await reader.cancel(); throw Error('Too large'); } chunks.push(value); }
  const bytes = new Uint8Array(length); let offset = 0;
  for (const chunk of chunks) { bytes.set(chunk, offset); offset += chunk.length; }
  return JSON.parse(new TextDecoder().decode(bytes));
}
export async function handleSubscribe(request, env) {
  if (!['POST', 'DELETE'].includes(request.method)) return reply({ error: 'Method not allowed' }, 405);
  const requestOrigin = request.headers.get('Origin');
  if (![origin, new URL(request.url).origin].includes(requestOrigin)) return reply({ error: 'Request not allowed' }, 403);
  if (!request.headers.get('Content-Type')?.startsWith('application/json')) return reply({ error: 'JSON required' }, 415);
  if (!env?.DB) return reply({ error: 'Registration temporarily unavailable' }, 503);
  let body;
  try { body = await readJson(request); } catch { return reply({ error: 'Invalid request' }, 400); }
  if (!body || typeof body !== 'object') return reply({ error: 'Invalid request' }, 400);
  try {
    if (request.method === 'DELETE') {
      if (typeof body.token !== 'string' || !/^[a-f0-9]{64}$/.test(body.token)) return reply({ error: 'Invalid request' }, 422);
      await env.DB.prepare('DELETE FROM launch_subscribers WHERE removal_hash = ?').bind(await hash(body.token)).run();
      return reply({ removed: true });
    }
    const email = typeof body.email === 'string' ? body.email.trim().toLowerCase() : '';
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email) || email.length > 254 || body.consent !== true || body.consentVersion !== 'oryn-launch-v2' || body.website || !['BOTH', 'OUTPUT', 'DEEP STATE'].includes(body.interest)) return reply({ error: 'Valid email and consent required' }, 422);
    const now = Date.now();
    const bucket = await hash(`${request.headers.get('CF-Connecting-IP') || 'local'}:${Math.floor(now / 3600000)}`);
    const attempts = await env.DB.prepare('INSERT INTO signup_limits (bucket, attempts, expires_at) VALUES (?, 1, ?) ON CONFLICT(bucket) DO UPDATE SET attempts = signup_limits.attempts + 1 RETURNING attempts').bind(bucket, now + 3600000).first();
    if (attempts.attempts > 15) return reply({ error: 'Please try again later' }, 429);
    const token = [...crypto.getRandomValues(new Uint8Array(32))].map(n => n.toString(16).padStart(2, '0')).join('');
    await env.DB.batch([
      env.DB.prepare('INSERT INTO launch_subscribers (id, email, interest, consent_text, consent_version, created_at, removal_hash) VALUES (?, ?, ?, ?, ?, ?, ?) ON CONFLICT(email) DO UPDATE SET removal_hash = excluded.removal_hash, interest = excluded.interest').bind(crypto.randomUUID(), email, body.interest, consentText, 'oryn-launch-v2', new Date(now).toISOString(), await hash(token)),
      env.DB.prepare('DELETE FROM signup_limits WHERE expires_at < ?').bind(now)
    ]);
    return reply({ accepted: true, removalToken: token }, 201);
  } catch { return reply({ error: 'Registration temporarily unavailable' }, 503); }
}
