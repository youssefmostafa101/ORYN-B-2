export const products = Object.freeze({
  output: { name: 'OUTPUT', type: 'Creatine Hydration Powder', image: 'assets/output-1-380.webp' },
  deep: { name: 'DEEP STATE', type: 'Ashwagandha Plus', image: 'assets/deep-1-380.webp' },
  system: { name: 'THE DAILY SYSTEM', type: 'OUTPUT + DEEP STATE', image: 'assets/product-duo-640.webp' }
});
export const clamp = (n, a = 0, b = 1) => Math.min(b, Math.max(a, n));
export const smooth = n => { const t = clamp(n); return t * t * (3 - 2 * t); };
export function sanitizeCart(value) {
  if (!Array.isArray(value)) return [];
  const totals = new Map();
  for (const item of value) {
    if (!item || !Object.hasOwn(products, item.id) || !Number.isInteger(item.quantity) || item.quantity < 1) continue;
    totals.set(item.id, clamp((totals.get(item.id) || 0) + item.quantity, 1, 10));
  }
  return [...totals].map(([id, quantity]) => ({ id, quantity }));
}
export function updateCart(cart, id, amount) {
  if (!Object.hasOwn(products, id) || !Number.isInteger(amount)) return sanitizeCart(cart);
  const next = sanitizeCart(cart);
  const item = next.find(item => item.id === id);
  if (item) item.quantity = clamp(item.quantity + amount, 0, 10);
  else if (amount > 0) next.push({ id, quantity: clamp(amount, 1, 10) });
  return next.filter(item => item.quantity > 0);
}
export function deepTimeline(progress) {
  const p = clamp(progress);
  // Opening completes before any capsule leaves the neck; closure starts after re-entry.
  return {
    arrival: smooth(p / .2),
    opening: smooth((p - .2) / .16) * (1 - smooth((p - .86) / .07)),
    expansion: smooth((p - .36) / .22) * (1 - smooth((p - .70) / .16)),
    suspension: smooth((p - .53) / .05) * (1 - smooth((p - .70) / .05)),
    phase: p < .2 ? '01 / ARRIVE' : p < .36 ? '02 / OPEN' : p < .58 ? '03 / EXPAND' : p < .7 ? '04 / SUSPEND' : p < .93 ? '05 / RETURN & CLOSE' : '06 / SETTLE'
  };
}
export function validateSignup({ email, consent, website }) {
  if (website) return { valid: false, field: 'website', message: 'Unable to submit. Please try again.' };
  if (typeof email !== 'string' || email.length > 254 || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email.trim())) return { valid: false, field: 'email', message: 'Enter a valid email address.' };
  if (consent !== true) return { valid: false, field: 'consent', message: 'Please confirm you’d like to receive ORYN B emails.' };
  return { valid: true, email: email.trim() };
}
