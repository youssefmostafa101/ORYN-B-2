const $ = (selector, context = document) => context.querySelector(selector);
const $$ = (selector, context = document) => [...context.querySelectorAll(selector)];
const names = { output: 'OUTPUT', deep: 'DEEP STATE' };
// GitHub Pages serves the public domain; the hosted service stores opt-ins.
const signupEndpoint = ['orynb.com', 'www.orynb.com'].includes(location.hostname)
  ? 'https://oryn-b-cinematic-review.proudcabin3.chatgpt.site/api/subscribe'
  : '/api/subscribe';
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
    const response = await fetch(signupEndpoint, { method: 'POST', headers: { 'Content-Type': 'application/json' }, signal: AbortSignal.timeout(12000), body: JSON.stringify({ email: email.value.trim(), consent: true, interest: form.elements.interest.value, website: form.elements.website.value, consentVersion: 'oryn-launch-v2' }) });
    const result = await response.json();
    if (response.status === 429) { status.textContent = 'Please wait a little before trying again.'; return; }
    if (response.status === 409) { status.textContent = 'This address is already registered; existing contacts do not restart the welcome series.'; return; }
    if (!response.ok || result.accepted !== true) throw Error('Not saved');
    removalToken = result.removalToken;
    status.textContent = result.pendingConfirmation
      ? 'Please check your inbox and confirm your subscription to receive launch emails.'
      : 'You’re on the list. We’ll let you know when the first drop is ready.';
    try { sessionStorage.setItem('orynb_launch_offer_seen_v1','1'); } catch {}
    $('#remove-signup').hidden = false; form.reset();
  } catch { status.textContent = 'We couldn’t save your signup. Please try again. You haven’t been added to the list.'; }
  finally { button.disabled = false; }
});
$('#remove-signup').addEventListener('click', async event => {
  if (!removalToken) return;
  event.currentTarget.disabled = true;
  try {
    const response = await fetch(signupEndpoint, { method: 'DELETE', headers: { 'Content-Type': 'application/json' }, signal: AbortSignal.timeout(12000), body: JSON.stringify({ token: removalToken }) });
    if (!response.ok) throw Error('Not removed');
    status.textContent = 'Your signup has been removed.'; removalToken = null; $('#remove-signup').hidden = true;
  } catch { status.textContent = 'We couldn’t remove the signup just now. Please try again.'; }
  finally { $('#remove-signup').disabled = false; }
});


// Accessible scratch-to-reveal popup. Reveal is NOT randomized; the launch-day offer is the same for everyone.
(() => {
  const overlay = $('#scratch-overlay'), dialog = $('.scratch-dialog', overlay);
  const canvas = $('#scratch-canvas'), card = $('#scratch-card');
  const panel = $('#scratch-form-panel'), revealButton = $('#scratch-reveal');
  const popupForm = $('#scratch-signup'), popupEmail = $('#scratch-email');
  const popupStatus = $('#scratch-status');
  const storageKey = 'orynb_launch_offer_seen_v1';
  let previousFocus = null, shown = false, revealed = false, drawing = false, moves = 0;
  let context = null;

  function dismiss() {
    overlay.hidden = true; document.body.style.overflow = '';
    try { sessionStorage.setItem(storageKey, '1'); } catch {}
    previousFocus?.focus?.();
  }
  function reveal() {
    if (revealed) return;
    revealed = true;
    card.classList.add('scratch-revealed');
    revealButton.hidden = true;
    panel.hidden = false;
    // Announce the result without automatically focusing or submitting the form.
    $('#scratch-reward').setAttribute('aria-label', 'Buy one, get one free, on launch day');
  }
  function paint(event) {
    if (!drawing || revealed || !context) return;
    const bounds = canvas.getBoundingClientRect();
    const x = event.clientX - bounds.left, y = event.clientY - bounds.top;
    context.globalCompositeOperation = 'destination-out';
    context.lineWidth = 29; context.lineJoin = 'round'; context.lineCap = 'round';
    if (moves++ === 0) { context.beginPath(); context.moveTo(x, y); }
    else { context.lineTo(x, y); context.stroke(); }
  }
  function measure() {
    if (!context || revealed || moves < 4) return;
    const {data,width,height} = context.getImageData(0,0,canvas.width,canvas.height);
    let sampled = 0, transparent = 0;
    for(let y=0;y<height;y+=16) for(let x=0;x<width;x+=16) {
      sampled++;
      if (data[(y*width+x)*4+3] < 50) transparent++;
    }
    if(transparent/sampled > .32) reveal();
  }
  function prepareCanvas() {
    const box = card.getBoundingClientRect();
    const scale = Math.min(devicePixelRatio||1,2);
    canvas.width = Math.round(box.width*scale);
    canvas.height = Math.round(box.height*scale);
    context = canvas.getContext('2d',{willReadFrequently:true});
    if (!context) { reveal(); return; }
    context.scale(scale,scale);
    const grad=context.createLinearGradient(0,0,box.width,box.height);
    grad.addColorStop(0,'#c6a35e');grad.addColorStop(.5,'#ecd197');grad.addColorStop(1,'#b58b47');
    context.fillStyle=grad;context.fillRect(0,0,box.width,box.height);
    context.fillStyle='#193627';context.textAlign='center';context.font='800 21px system-ui, sans-serif';
    context.fillText('SCRATCH HERE',box.width/2,box.height/2-2);
    context.font='700 11px system-ui, sans-serif';context.fillText('↔  REVEAL THE OFFER  ↔',box.width/2,box.height/2+26);
  }
  function open() {
    if (shown) return;
    shown = true; previousFocus = document.activeElement;
    overlay.hidden = false; document.body.style.overflow = 'hidden';
    dialog.focus(); prepareCanvas();
  }

  $('#scratch-close').addEventListener('click',dismiss);
  overlay.addEventListener('click',event=>{if(event.target===overlay)dismiss();});
  overlay.addEventListener('keydown',event=>{
    if(event.key==='Escape') {event.preventDefault();dismiss();}
    if(event.key!=='Tab')return;
    const focusable=$$('button:not([hidden]):not([disabled]),a[href],input:not([hidden]):not([disabled])',dialog)
      .filter(x=>x.getClientRects().length);
    if(!focusable.length) return;
    const first=focusable[0],last=focusable[focusable.length-1];
    if(event.shiftKey && document.activeElement===first){event.preventDefault();last.focus();}
    else if(!event.shiftKey && document.activeElement===last){event.preventDefault();first.focus();}
  });
  revealButton.addEventListener('click',reveal);
  canvas.addEventListener('pointerdown',event=>{
    drawing=true;moves=0;canvas.setPointerCapture?.(event.pointerId);
    paint(event);
  });
  canvas.addEventListener('pointermove',paint);
  canvas.addEventListener('pointerup',()=>{drawing=false;measure();});
  canvas.addEventListener('pointercancel',()=>{drawing=false;measure();});

  popupForm.addEventListener('submit',async event=>{
    event.preventDefault();popupEmail.removeAttribute('aria-invalid');
    if(!popupEmail.validity.valid||!popupEmail.value.trim()) {
      popupStatus.textContent='Enter a valid email address.';
      popupEmail.setAttribute('aria-invalid','true');popupEmail.focus();return;
    }
    if(!popupForm.elements.consent.checked) {
      popupStatus.textContent='Please confirm your marketing-email consent.';
      popupForm.elements.consent.focus();return;
    }
    const button=$('button[type="submit"]',popupForm);
    button.disabled=true;popupStatus.textContent='Joining the launch list…';
    try {
      const response=await fetch(signupEndpoint,{
        method:'POST',headers:{'Content-Type':'application/json'},signal:AbortSignal.timeout(12000),
        body:JSON.stringify({email:popupEmail.value.trim(),consent:true,interest:'BOTH',website:popupForm.elements.website.value,consentVersion:'oryn-launch-v2'})
      });
      const result=await response.json();
      if(response.status===409){popupStatus.textContent='This address is already registered. Existing signups do not restart the welcome series.';return;}
      if(!response.ok||result.accepted!==true)throw Error('Signup not confirmed');
      popupStatus.textContent=result.pendingConfirmation
        ?'Check your inbox for a confirmation email to complete your signup.'
        :'You’re on the launch list. Watch your inbox for updates.';
      try{sessionStorage.setItem(storageKey,'1');}catch{}
      popupForm.reset();
    } catch {
      popupStatus.textContent='We could not confirm your signup. Please try again.';
    } finally {button.disabled=false;}
  });

  // Respect an in-session dismissal. Store no email, personal data or tracking token in the browser.
  const seen=(()=>{try{return sessionStorage.getItem(storageKey)==='1';}catch{return false;}})();
  if(!seen) setTimeout(()=>{
    if(!shown && !$('#signup').contains(document.activeElement))open();
  },6500);
})();
