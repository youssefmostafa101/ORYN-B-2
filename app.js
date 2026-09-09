/*
  ORYN B static storefront interactions.
  CONFIGURATION: Change product names, prices, formulas, and image crop positioning here.
  CHECKOUT: The drawer intentionally uses a disabled placeholder until a Shopify / Stripe / other provider handoff is added.
  ANALYTICS: Add a privacy-appropriate analytics snippet in index.html before </head>.
*/

const products = {
  output: {
    id: 'output', index: '01 / FORMULA', name: 'OUTPUT', type: 'CREATINE HYDRATION POWDER',
    size: 'LEMON / 300 G / 30 SERVINGS',
    // PRICE: Replace this storefront placeholder before launch.
    price: 48,
    imagePosition: '18% 15%',
    use: 'See product label for serving directions.',
    formula: [['Creatine Monohydrate', '5,000 mg'], ['Magnesium', '60 mg'], ['Sodium', '1,000 mg'], ['Potassium', '200 mg']]
  },
  deep: {
    id: 'deep', index: '02 / FORMULA', name: 'DEEP STATE', type: 'ASHWAGANDHA SUPPLEMENT',
    size: '60 CAPSULES / 44 G',
    // PRICE: Replace this storefront placeholder before launch.
    price: 42,
    imagePosition: '78% 15%',
    use: 'See product label for serving directions.',
    formula: [['Vitamin D3', '20 mcg'], ['Vitamin B6', '2.5 mg'], ['Vitamin B12', '25 mcg'], ['KSM-66 Ashwagandha', '600 mg'], ['L-Arginine', '300 mg'], ['Maca', '150 mg'], ['Panax Ginseng', '100 mg'], ['Shatavari', '50 mg']]
  }
};

const outputInfo = {
  formula: { kicker: 'THE DAILY FOUNDATION', title: 'Four intentional components.', copy: 'A direct, fully disclosed blend of creatine and essential minerals. No proprietary blends. No filler story.', list: products.output.formula },
  why: { kicker: 'WHY IT’S HERE', title: 'A clear role for every component.', copy: 'Creatine anchors the formula. Sodium, potassium, and magnesium bring considered electrolyte and mineral support around it.', list: [['Creatine Monohydrate', 'performance support'], ['Sodium', 'electrolyte support'], ['Potassium', 'electrolyte support'], ['Magnesium', 'mineral support']] },
  use: { kicker: 'HOW TO USE', title: 'Keep the ritual uncomplicated.', copy: 'OUTPUT is a lemon creatine hydration powder. Refer to the product label for serving directions and complete ingredient information.', list: [['Format', 'powder'], ['Flavor', 'lemon'], ['Servings', '30'], ['Net weight', '300 g']] },
  details: { kicker: 'AT A GLANCE', title: 'Designed for the long view.', copy: 'A focused formula for people who prefer to know precisely what is in their daily supplement practice.', list: [['Formula', '4 components'], ['Creatine', '5,000 mg'], ['Electrolytes', '2'], ['Mineral', '1']] }
};

const ingredients = {
  creatine: { number: '01', amount: '5,000 MG', name: 'Creatine Monohydrate', purpose: 'Performance support at a fully disclosed 5,000 mg per serving.' },
  sodium: { number: '02', amount: '1,000 MG', name: 'Sodium', purpose: 'Electrolyte support in the OUTPUT formula.' },
  potassium: { number: '03', amount: '200 MG', name: 'Potassium', purpose: 'Electrolyte support in the OUTPUT formula.' },
  magnesium: { number: '04', amount: '60 MG', name: 'Magnesium', purpose: 'Mineral support in the OUTPUT formula.' }
};

const ledger = {
  d3: { number: '01 / 20 MCG', name: 'Vitamin D3', copy: 'A vitamin component in the DEEP STATE formula.' },
  b6: { number: '02 / 2.5 MG', name: 'Vitamin B6', copy: 'A vitamin component in the DEEP STATE formula.' },
  b12: { number: '03 / 25 MCG', name: 'Vitamin B12', copy: 'A vitamin component in the DEEP STATE formula.' },
  ashwagandha: { number: '04 / 600 MG', name: 'KSM-66 Ashwagandha', copy: 'A botanical component in the DEEP STATE formula.' },
  arginine: { number: '05 / 300 MG', name: 'L-Arginine', copy: 'An amino acid component in the DEEP STATE formula.' },
  maca: { number: '06 / 150 MG', name: 'Maca', copy: 'A botanical component in the DEEP STATE formula.' },
  ginseng: { number: '07 / 100 MG', name: 'Panax Ginseng', copy: 'A botanical component in the DEEP STATE formula.' },
  shatavari: { number: '08 / 50 MG', name: 'Shatavari', copy: 'A botanical component in the DEEP STATE formula.' }
};

const $ = (selector, context = document) => context.querySelector(selector);
const $$ = (selector, context = document) => [...context.querySelectorAll(selector)];
const currency = new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD' });

let cart = [];
try { cart = JSON.parse(localStorage.getItem('oryn-b-bag') || '[]'); } catch { cart = []; }
let activeProduct = 'output';
let modalQuantity = 1;

function saveCart() { localStorage.setItem('oryn-b-bag', JSON.stringify(cart)); }
function cartCount() { return cart.reduce((sum, item) => sum + item.quantity, 0); }
function cartSubtotal() { return cart.reduce((sum, item) => sum + products[item.id].price * item.quantity, 0); }

function renderCart() {
  const count = cartCount();
  $$('[data-cart-count]').forEach(el => { el.textContent = count; });
  $('[data-cart-subtotal]').textContent = currency.format(cartSubtotal());
  const drawer = $('.cart-drawer');
  drawer.dataset.cartEmptyState = String(cart.length === 0);
  const items = $('[data-cart-items]');
  items.innerHTML = cart.map(item => {
    const product = products[item.id];
    return `<article class="cart-item">
      <img src="assets/oryn-b-duo.png" style="object-position:${product.imagePosition}" alt="${product.name}" />
      <div class="cart-item-copy"><h3>${product.name}</h3><p>${product.type}</p><span class="cart-item-price">${currency.format(product.price)}</span>
      <div class="cart-item-actions"><button type="button" data-cart-change="${product.id}" data-change="-1" aria-label="Decrease ${product.name} quantity">−</button><span>${item.quantity}</span><button type="button" data-cart-change="${product.id}" data-change="1" aria-label="Increase ${product.name} quantity">+</button><button type="button" class="remove-item" data-cart-remove="${product.id}">Remove</button></div></div>
      <span class="cart-item-total">${currency.format(product.price * item.quantity)}</span>
    </article>`;
  }).join('');
}

function updateCart(id, amount) {
  const item = cart.find(entry => entry.id === id);
  if (item) item.quantity += amount;
  else cart.push({ id, quantity: amount });
  cart = cart.filter(entry => entry.quantity > 0);
  saveCart(); renderCart();
}

function openCart() {
  closeMenu();
  $('.cart-drawer').classList.add('is-open');
  $('.cart-drawer').setAttribute('aria-hidden', 'false');
  document.body.classList.add('no-scroll');
  $('[data-close-cart]').focus();
}
function closeCart() {
  $('.cart-drawer').classList.remove('is-open');
  $('.cart-drawer').setAttribute('aria-hidden', 'true');
  if (!document.body.classList.contains('has-modal')) document.body.classList.remove('no-scroll');
}

function setModalProduct(id) {
  activeProduct = id; modalQuantity = 1;
  const product = products[id];
  $('[data-modal-index]').textContent = product.index;
  $('[data-modal-name]').textContent = product.name;
  $('[data-modal-type]').textContent = product.type;
  $('[data-modal-size]').textContent = product.size;
  $('[data-modal-price]').textContent = `USD ${product.price.toFixed(2)}`;
  $('[data-modal-use]').textContent = product.use;
  $('[data-modal-quantity-value]').textContent = modalQuantity;
  $('[data-modal-formula]').innerHTML = product.formula.map(([name, amount]) => `<li><span>${name}</span><span>${amount}</span></li>`).join('');
  const image = $('[data-modal-image]');
  image.alt = `${product.name} ${product.type}`;
  image.style.objectPosition = product.imagePosition;
}
function openModal(id) {
  closeMenu(); closeCart(); setModalProduct(id);
  document.body.classList.add('no-scroll', 'has-modal');
  $('.product-modal').setAttribute('aria-hidden', 'false');
  $('.modal-close').focus();
}
function closeModal() {
  document.body.classList.remove('has-modal');
  $('.product-modal').setAttribute('aria-hidden', 'true');
  if (!$('.cart-drawer').classList.contains('is-open')) document.body.classList.remove('no-scroll');
}

function closeMenu() {
  const menu = $('.mobile-menu'); const toggle = $('.menu-toggle');
  menu.classList.remove('is-open'); menu.setAttribute('aria-hidden', 'true');
  toggle.setAttribute('aria-expanded', 'false');
  if (!document.body.classList.contains('has-modal') && !$('.cart-drawer').classList.contains('is-open')) document.body.classList.remove('no-scroll');
}
function toggleMenu() {
  const menu = $('.mobile-menu'); const opening = !menu.classList.contains('is-open');
  menu.classList.toggle('is-open', opening); menu.setAttribute('aria-hidden', String(!opening));
  $('.menu-toggle').setAttribute('aria-expanded', String(opening));
  document.body.classList.toggle('no-scroll', opening);
}

$$('[data-open-cart]').forEach(button => button.addEventListener('click', openCart));
$$('[data-close-cart]').forEach(button => button.addEventListener('click', closeCart));
$('.menu-toggle').addEventListener('click', toggleMenu);
$$('.mobile-menu a').forEach(link => link.addEventListener('click', closeMenu));

$$('.formula-tab').forEach(tab => tab.addEventListener('click', () => {
  const info = outputInfo[tab.dataset.outputTab];
  $$('.formula-tab').forEach(button => { button.classList.toggle('is-active', button === tab); button.setAttribute('aria-selected', String(button === tab)); });
  $('[data-output-kicker]').textContent = info.kicker;
  $('[data-output-title]').textContent = info.title;
  $('[data-output-copy]').textContent = info.copy;
  $('[data-output-list]').innerHTML = info.list.map(([name, amount]) => `<li>${name}<b>${amount}</b></li>`).join('');
}));

$$('.ingredient-point').forEach(point => point.addEventListener('click', () => {
  const info = ingredients[point.dataset.ingredient];
  $$('.ingredient-point').forEach(button => button.classList.toggle('is-selected', button === point));
  $('[data-ingredient-amount]').textContent = info.amount;
  $('[data-ingredient-name]').textContent = info.name;
  $('[data-ingredient-purpose]').textContent = info.purpose;
  $('.ingredient-readout > p:first-child').childNodes[0].nodeValue = `${info.number} / `;
}));

$$('.ledger-row').forEach(row => row.addEventListener('click', () => {
  const info = ledger[row.dataset.ledger];
  $$('.ledger-row').forEach(button => button.classList.toggle('is-open', button === row));
  $('[data-ledger-number]').textContent = info.number;
  $('[data-ledger-name]').textContent = info.name;
  $('[data-ledger-copy]').textContent = info.copy;
}));

$$('[data-product]').forEach(button => button.addEventListener('click', () => openModal(button.dataset.product)));
$('.modal-close').addEventListener('click', closeModal);
$('.modal-scrim').addEventListener('click', closeModal);
$$('[data-modal-quantity]').forEach(button => button.addEventListener('click', () => {
  modalQuantity = Math.max(1, modalQuantity + (button.dataset.modalQuantity === 'increase' ? 1 : -1));
  $('[data-modal-quantity-value]').textContent = modalQuantity;
}));
$('.add-to-bag').addEventListener('click', () => {
  updateCart(activeProduct, modalQuantity); closeModal(); openCart();
});

document.addEventListener('click', event => {
  const change = event.target.closest('[data-cart-change]');
  const remove = event.target.closest('[data-cart-remove]');
  if (change) updateCart(change.dataset.cartChange, Number(change.dataset.change));
  if (remove) { cart = cart.filter(item => item.id !== remove.dataset.cartRemove); saveCart(); renderCart(); }
});
document.addEventListener('keydown', event => { if (event.key === 'Escape') { closeModal(); closeCart(); closeMenu(); } });

const observer = new IntersectionObserver(entries => entries.forEach(entry => { if (entry.isIntersecting) { entry.target.classList.add('is-visible'); observer.unobserve(entry.target); } }), { threshold: .12 });
$$('.reveal').forEach(el => observer.observe(el));

const reduceMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
if (!reduceMotion) {
  window.addEventListener('scroll', () => {
    const scrollable = document.documentElement.scrollHeight - window.innerHeight;
    $('.scroll-progress span').style.width = `${(window.scrollY / scrollable) * 100}%`;
    $('.site-header').classList.toggle('is-scrolled', window.scrollY > 28);
    $$('[data-parallax]').forEach(el => {
      const rect = el.getBoundingClientRect();
      const movement = (window.innerHeight / 2 - (rect.top + rect.height / 2)) * .025;
      // The orbit image has an existing centering transform; preserve it while adding its subtle scroll movement.
      el.style.transform = el.classList.contains('orbit-product')
        ? `translate(-50%, calc(-50% + ${movement}px))`
        : `translateY(${movement}px)`;
    });
  }, { passive: true });
  $$('a.text-link, .inline-button, .add-to-bag').forEach(el => {
    el.classList.add('magnetic');
    el.addEventListener('pointermove', event => {
      if (event.pointerType === 'touch') return;
      const rect = el.getBoundingClientRect();
      el.style.transform = `translate(${(event.clientX - rect.left - rect.width / 2) * .08}px, ${(event.clientY - rect.top - rect.height / 2) * .08}px)`;
    });
    el.addEventListener('pointerleave', () => { el.style.transform = ''; });
  });
} else { $$('.reveal').forEach(el => el.classList.add('is-visible')); }

renderCart();
