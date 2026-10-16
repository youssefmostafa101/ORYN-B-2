const $ = (selector, context = document) => context.querySelector(selector);
const $$ = (selector, context = document) => [...context.querySelectorAll(selector)];
const names = { output: 'OUTPUT', deep: 'DEEP STATE' };
const heroImage = $('#hero-product');
let heroChange = 0;
$$('[data-hero]').forEach(button => button.addEventListener('click', async () => {
  const kind = button.dataset.hero;
  const change = ++heroChange;
  const next = new Image(); next.src = `assets/${kind}-1-760.webp`;
  try { await next.decode(); } catch { return; }
  if (change !== heroChange) return;
  heroImage.src = next.src;
  heroImage.alt = `Original ORYN B ${names[kind]} product mockup`;
  $('#hero-product-name').textContent = names[kind];
  $$('[data-hero]').forEach(b => b.setAttribute('aria-pressed', String(b === button)));
}));
$('#motion-toggle').addEventListener('click', event => {
  const paused = $('#hero-photo').classList.toggle('motion-paused');
  event.currentTarget.setAttribute('aria-pressed', String(paused));
  event.currentTarget.setAttribute('aria-label', `${paused ? 'Resume' : 'Pause'} gentle product motion`);
  event.currentTarget.innerHTML = `${paused ? 'Play' : 'Pause'} <span aria-hidden="true">${paused ? '▷' : 'Ⅱ'}</span>`;
});
$$('[data-gallery]').forEach(gallery => {
  const kind = gallery.dataset.gallery;
  for (let i = 1; i <= 5; i++) {
    const button = document.createElement('button'); button.type = 'button';
    button.setAttribute('aria-label', `${names[kind]} photo ${i}`);
    button.setAttribute('aria-pressed', String(i === 1));
    button.innerHTML = `<img src="assets/${kind}-${i}-160.webp" width="160" height="160" alt="" loading="lazy">`;
    button.addEventListener('click', () => {
      const image = $('.product-image>img', gallery);
      image.src = `assets/${kind}-${i}-760.webp`;
      image.alt = `Original ${names[kind]} product mockup, view ${i} of 5`;
      $('.image-counter', gallery).textContent = `0${i} / 05`;
      $$('button', $('.thumbnails', gallery)).forEach(b => b.setAttribute('aria-pressed', String(b === button)));
    });
    $('.thumbnails', gallery).append(button);
  }
});
const form = $('#signup'), email = $('#email'), consent = form.elements.consent, status = $('#form-status');
let removalToken = null;
$$('a[href="#notify"]').forEach(link => link.addEventListener('click', () => {
  form.elements.interest.value = link.dataset.interest || 'BOTH';
  // Keep the focus transition after the anchor has positioned the section.
  setTimeout(() => email.focus({ preventScroll: true }), matchMedia('(prefers-reduced-motion:reduce)').matches ? 0 : 450);
}));
form.addEventListener('submit', async event => {
  event.preventDefault(); email.removeAttribute('aria-invalid'); consent.removeAttribute('aria-invalid');
  if (!email.value.trim() || !email.validity.valid || email.value.length > 254) {
    status.textContent = 'Please enter a valid email address.'; email.setAttribute('aria-invalid', 'true'); email.focus(); return;
  }
  if (!consent.checked) {
    status.textContent = 'Please confirm you’d like to receive ORYN B emails.'; consent.setAttribute('aria-invalid', 'true'); consent.focus(); return;
  }
  const button = $('button[type="submit"]', form); button.disabled = true; status.textContent = 'Adding you to the list…';
  try {
    const response = await fetch('/api/subscribe', { method: 'POST', headers: { 'Content-Type': 'application/json' }, signal: AbortSignal.timeout(12000), body: JSON.stringify({ email: email.value.trim(), consent: true, interest: form.elements.interest.value, website: form.elements.website.value, consentVersion: 'oryn-launch-v2' }) });
    const result = await response.json();
    if (response.status === 429) { status.textContent = 'Please wait a little before trying again.'; return; }
    if (!response.ok || result.accepted !== true) throw Error('Not saved');
    removalToken = result.removalToken;
    status.textContent = 'You’re on the list. We’ll let you know when the first drop is ready.';
    $('#remove-signup').hidden = false; form.reset();
  } catch { status.textContent = 'We couldn’t save your signup. Please try again. You haven’t been added to the list.'; }
  finally { button.disabled = false; }
});
$('#remove-signup').addEventListener('click', async event => {
  if (!removalToken) return;
  event.currentTarget.disabled = true;
  try {
    const response = await fetch('/api/subscribe', { method: 'DELETE', headers: { 'Content-Type': 'application/json' }, signal: AbortSignal.timeout(12000), body: JSON.stringify({ token: removalToken }) });
    if (!response.ok) throw Error('Not removed');
    status.textContent = 'Your signup has been removed.'; removalToken = null; $('#remove-signup').hidden = true;
  } catch { status.textContent = 'We couldn’t remove the signup just now. Please try again.'; }
  finally { $('#remove-signup').disabled = false; }
});
