import { products, sanitizeCart, updateCart, validateSignup } from './lib/state.js';
import { signupConfig } from './site-config.js';

const $ = (selector, scope = document) => scope.querySelector(selector);
const $$ = (selector, scope = document) => [...scope.querySelectorAll(selector)];
const storageKey = 'oryn-b-launch-bag-v2';
let cart = [];
try { cart = sanitizeCart(JSON.parse(localStorage.getItem(storageKey) || '[]')); } catch { /* Private browsing still supports an in-memory bag. */ }
const cartDialog = $('#cart');
let previousFocus;
function openDialog(dialog) { previousFocus = document.activeElement; dialog.showModal(); }
function closeDialog(dialog) { dialog.close(); previousFocus?.focus({ preventScroll: true }); }
for (const dialog of $$('dialog')) dialog.addEventListener('click', event => { if (event.target === dialog) { const rect = dialog.getBoundingClientRect(); if (event.clientX < rect.left || event.clientX > rect.right || event.clientY < rect.top || event.clientY > rect.bottom) closeDialog(dialog); } });
function renderCart() {
  const count = cart.reduce((n, item) => n + item.quantity, 0);
  $$('[data-count]').forEach(el => el.textContent = count);
  $('#cart-items').innerHTML = cart.length ? cart.map(({ id, quantity }) => {
    const product = products[id];
    return `<article class="cart-item"><img src="${product.image}" class="${id === 'system' ? 'bundle-thumb' : ''}" width="95" height="115" alt="${product.name}"><div><h3>${product.name}</h3><p>${product.type}</p><p>COMING SOON</p><div class="quantity"><button data-change="-1" data-id="${id}" aria-label="Decrease ${product.name} quantity">−</button><span aria-label="Quantity">${quantity}</span><button data-change="1" data-id="${id}" aria-label="Increase ${product.name} quantity" ${quantity === 10 ? 'disabled' : ''}>+</button><button class="remove" data-remove="${id}" aria-label="Remove ${product.name}">Remove</button></div></div></article>`;
  }).join('') : '<div class="cart-empty"><p class="eyebrow">A ROUTINE OF YOUR OWN</p><h3>Your first drop<br>starts here.</h3><p>Explore the formulas and build your launch selection.</p><a class="underlink" href="#products" data-cart-products>Explore the first drop <span>→</span></a></div>';
  try { localStorage.setItem(storageKey, JSON.stringify(cart)); } catch { /* Storage is optional. */ }
}
renderCart();
$$('[data-open-cart]').forEach(button => button.addEventListener('click', () => { closeMenu(); openDialog(cartDialog); }));
$('[data-close-cart]').addEventListener('click', () => closeDialog(cartDialog));
$$('[data-add]').forEach(button => button.addEventListener('click', () => { cart = updateCart(cart, button.dataset.add, 1); renderCart(); $('#announcement').textContent = `${products[button.dataset.add].name} added to your launch bag.`; openDialog(cartDialog); }));
cartDialog.addEventListener('click', event => {
  const change = event.target.closest('[data-change]');
  const remove = event.target.closest('[data-remove]');
  if (change || remove) {
    const id = change?.dataset.id || remove.dataset.remove;
    cart = remove ? cart.filter(item => item.id !== id) : updateCart(cart, id, Number(change.dataset.change));
    const focusSelector = change ? `[data-id="${id}"][data-change="${change.dataset.change}"]` : null;
    renderCart();
    const target = focusSelector && $(focusSelector, cartDialog);
    (target && !target.disabled ? target : $('[data-close-cart]')).focus({ preventScroll: true });
    $('#announcement').textContent = 'Launch bag updated.';
  }
  if (event.target.closest('[data-cart-founders],[data-cart-products]')) closeDialog(cartDialog);
});
addEventListener('storage', event => { if (event.key === storageKey) { try { cart = sanitizeCart(JSON.parse(event.newValue || '[]')); renderCart(); } catch { /* Ignore invalid external storage. */ } } });

const menuButton = $('.menu-button'), mobileNav = $('#mobile-nav');
function closeMenu() { mobileNav.hidden = true; menuButton.setAttribute('aria-expanded', 'false'); menuButton.setAttribute('aria-label', 'Open navigation'); }
menuButton.addEventListener('click', () => { const opened = mobileNav.hidden; mobileNav.hidden = !opened; menuButton.setAttribute('aria-expanded', String(opened)); menuButton.setAttribute('aria-label', opened ? 'Close navigation' : 'Open navigation'); });
$$('a', mobileNav).forEach(a => a.addEventListener('click', closeMenu));
document.addEventListener('keydown', event => { if (event.key === 'Escape' && !mobileNav.hidden) { closeMenu(); menuButton.focus(); } });
matchMedia('(min-width:761px)').addEventListener('change', event => { if (event.matches) closeMenu(); });

const galleryState = new Map();
const lightbox = $('#lightbox');
let activeGallery;
function selectImage(gallery, index) {
  const state = galleryState.get(gallery);
  state.index = (index + 5) % 5;
  const label = products[state.kind].name;
  $('.gallery-image', gallery).src = `assets/${state.kind}-${state.index + 1}-760.webp`;
  $('.gallery-image', gallery).alt = `${label} packaging, view ${state.index + 1} of 5`;
  $('.gallery-counter', gallery).textContent = `0${state.index + 1} / 05`;
  $$('button', $('.gallery-thumbs', gallery)).forEach((button, i) => button.setAttribute('aria-pressed', String(i === state.index)));
  if (lightbox.open && activeGallery === gallery) renderLightbox();
}
function renderLightbox() {
  const state = galleryState.get(activeGallery);
  $('#lightbox-title').textContent = `${products[state.kind].name} / PRODUCT GALLERY`;
  $('#lightbox-image').src = `assets/${state.kind}-${state.index + 1}-760.webp`;
  $('#lightbox-image').alt = `${products[state.kind].name} packaging, view ${state.index + 1} of 5`;
  $('[data-lightbox-counter]').textContent = `${state.index + 1} / 5`;
}
$$('[data-gallery]').forEach(gallery => {
  const kind = gallery.dataset.gallery;
  galleryState.set(gallery, { kind, index: 0 });
  for (let i = 0; i < 5; i++) {
    const button = document.createElement('button');
    button.type = 'button'; button.setAttribute('aria-label', `${products[kind].name} image ${i + 1}`); button.setAttribute('aria-pressed', String(i === 0));
    button.innerHTML = `<img src="assets/${kind}-${i + 1}-160.webp" width="160" height="160" loading="lazy" alt="">`;
    button.addEventListener('click', () => selectImage(gallery, i));
    $('.gallery-thumbs', gallery).append(button);
  }
  const enlarge = () => { activeGallery = gallery; renderLightbox(); openDialog(lightbox); };
  $('.zoom-button', gallery).addEventListener('click', enlarge);
  $('.gallery-image', gallery).addEventListener('click', enlarge);
});
$('[data-close-lightbox]').addEventListener('click', () => closeDialog(lightbox));
function moveGallery(step) { selectImage(activeGallery, galleryState.get(activeGallery).index + step); }
$('[data-gallery-prev]').addEventListener('click', () => moveGallery(-1));
$('[data-gallery-next]').addEventListener('click', () => moveGallery(1));
lightbox.addEventListener('keydown', event => { if (event.key === 'ArrowLeft') moveGallery(-1); if (event.key === 'ArrowRight') moveGallery(1); });
let touchStart;
$('#lightbox-image').addEventListener('pointerdown', event => { touchStart = event.clientX; });
$('#lightbox-image').addEventListener('pointerup', event => { const delta = event.clientX - touchStart; if (Math.abs(delta) > 45) moveGallery(delta < 0 ? 1 : -1); });

const canvas = $('#scratch'), ctx = canvas.getContext('2d', { willReadFrequently: true });
const invitation = $('.invitation');
let revealed = false, scratching = false, previousPoint, scratchCount = 0;
function revealInvitation(focus = false) {
  if (revealed) return;
  revealed = true; invitation.classList.add('revealed'); $('#signup-panel').hidden = false;
  $('#reveal-invitation').hidden = true;
  $('#announcement').textContent = 'Your founders’ invitation is revealed. Email registration is not connected in this preview.';
  if (focus) $('#email').focus({ preventScroll: true });
}
$('#reveal-invitation').addEventListener('click', () => revealInvitation(true));
function paintScratch() {
  if (!ctx || revealed) return;
  const rect = invitation.getBoundingClientRect(), dpr = Math.min(devicePixelRatio || 1, 2);
  canvas.width = Math.round(rect.width * dpr); canvas.height = Math.round(rect.height * dpr);
  ctx.setTransform(dpr, 0, 0, dpr, 0, 0); ctx.globalCompositeOperation = 'source-over';
  const gradient = ctx.createLinearGradient(0, 0, rect.width, rect.height);
  gradient.addColorStop(0, '#83927b'); gradient.addColorStop(.42, '#5e765b'); gradient.addColorStop(1, '#263f2c');
  ctx.fillStyle = gradient; ctx.fillRect(0, 0, rect.width, rect.height);
  // Deterministic brushed foil texture, independent of device rendering speed.
  ctx.strokeStyle = '#e9e4d30b'; ctx.lineWidth = .5;
  for (let y = 0; y < rect.height; y += 3) { ctx.beginPath(); ctx.moveTo(0, y); ctx.lineTo(rect.width, y - 25); ctx.stroke(); }
  scratchCount = 0;
}
if (ctx) {
  new ResizeObserver(paintScratch).observe(invitation);
  canvas.addEventListener('pointerdown', event => { scratching = true; previousPoint = null; canvas.setPointerCapture(event.pointerId); scratch(event); });
  canvas.addEventListener('pointermove', event => { if (scratching) scratch(event); });
  canvas.addEventListener('pointerup', () => { scratching = false; previousPoint = null; });
  canvas.addEventListener('pointercancel', () => { scratching = false; previousPoint = null; });
} else { canvas.hidden = true; $('.scratch-label').hidden = true; }
function scratch(event) {
  if (revealed) return;
  const rect = canvas.getBoundingClientRect(), x = event.clientX - rect.left, y = event.clientY - rect.top;
  ctx.globalCompositeOperation = 'destination-out'; ctx.strokeStyle = '#000'; ctx.lineWidth = 44; ctx.lineCap = 'round'; ctx.lineJoin = 'round';
  ctx.beginPath(); ctx.moveTo(previousPoint?.x ?? x, previousPoint?.y ?? y); ctx.lineTo(x + .1, y); ctx.stroke();
  previousPoint = { x, y };
  $('.scratch-label').style.opacity = '0';
  if (++scratchCount % 12 === 0) {
    const data = ctx.getImageData(0, 0, canvas.width, canvas.height).data;
    let clear = 0, total = 0;
    for (let i = 3; i < data.length; i += 64) { total++; if (data[i] < 60) clear++; }
    if (clear / total > .32) revealInvitation();
  }
}

const form = $('#early-access'), status = $('#form-status');
if (signupConfig.endpoint) $('#form-note').textContent = 'Launch news and updates from ORYN B. Unsubscribe at any time.';
form.addEventListener('submit', async event => {
  event.preventDefault();
  const input = $('#email'), consent = form.elements.consent;
  input.removeAttribute('aria-invalid'); consent.removeAttribute('aria-invalid');
  const validation = validateSignup({ email: input.value, consent: consent.checked, website: form.elements.website.value });
  if (!validation.valid) { status.textContent = validation.message; const target = form.elements[validation.field]; target?.setAttribute('aria-invalid', 'true'); if (validation.field !== 'website') target?.focus(); return; }
  if (!signupConfig.endpoint) { status.textContent = 'Registration is not open in this preview. Your email has not been saved or sent.'; return; }
  const endpoint = new URL(signupConfig.endpoint, location.href);
  if (endpoint.origin !== location.origin || !endpoint.pathname.startsWith('/api/')) { status.textContent = 'Registration is temporarily unavailable. Please try again later.'; return; }
  const submit = $('button[type=submit]', form); submit.disabled = true; status.textContent = 'Submitting your request…';
  try {
    const response = await fetch(endpoint, { method: 'POST', headers: { 'Content-Type': 'application/json' }, credentials: 'same-origin', signal: AbortSignal.timeout(12000), body: JSON.stringify({ email: validation.email, consent: true, consentVersion: signupConfig.consentVersion, source: signupConfig.source, website: '' }) });
    if (!response.ok) throw new Error('Submission failed');
    const result = await response.json();
    if (result.accepted !== true) throw new Error('Consent not accepted');
    status.textContent = 'Your request is received. Check your inbox for the next step.';
    form.reset();
  } catch { status.textContent = 'We couldn’t submit your request. Your registration is not confirmed. Please try again.'; }
  finally { submit.disabled = false; }
});

// Defer the entire 3D engine until the visitor approaches the motion chapters.
let motionLoaded = false;
const motionObserver = new IntersectionObserver(async entries => {
  if (!entries.some(entry => entry.isIntersecting) || motionLoaded || matchMedia('(prefers-reduced-motion:reduce)').matches) return;
  motionLoaded = true;
  try { const { initializeMotion } = await import('./motion.js'); await initializeMotion(); }
  catch (error) { console.warn('Cinematic scenes are using product-photo fallbacks.', error); $$('[data-stage]').forEach(stage => stage.dataset.fallback = 'true'); }
}, { rootMargin: '700px' });
$$('.motion-section').forEach(section => motionObserver.observe(section));
matchMedia('(prefers-reduced-motion:reduce)').addEventListener('change', event => { if (!event.matches && !motionLoaded) { motionObserver.disconnect(); $$('.motion-section').forEach(section => motionObserver.observe(section)); } });
