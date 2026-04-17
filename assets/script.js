// --- CONFIG ---
const PRODUCTS_JSON = '../assets/products.json';
const DEFAULT_LANG = window.location.pathname.includes('/en/') ? 'en' : 'hu';
const CURRENCY = { hu: 'Ft', en: 'HUF' };

// --- STATE ---
let products = [];
let cart = JSON.parse(localStorage.getItem('zolioil_cart') || '{}');
let lang = DEFAULT_LANG;

// --- INIT ---
document.addEventListener('DOMContentLoaded', () => {
  loadProducts();
  setupCartSummary();
  setupCartModal();
  

  ['order-name', 'order-address', 'order-phone'].forEach(id => {
    const el = document.getElementById(id);
    if (el) el.oninput = updateOrderTextarea;
  });

});

function updateOrderTextarea() {
  const name = document.getElementById('order-name').value.trim();
  const address = document.getElementById('order-address').value.trim();
  const phone = document.getElementById('order-phone').value.trim();
  document.getElementById('order-email-text').value = buildOrderText(name, address, phone);

    // --- Gomb engedélyezése/letiltása ---
  const checkoutBtn = document.getElementById('checkout-btn');
  const items = getCartItems();
  if (checkoutBtn) {
    if (name && address && phone && items.length > 0) {
      checkoutBtn.disabled = false;
    } else {
      checkoutBtn.disabled = true;
    }
  }

}

// --- LOAD PRODUCTS ---
function loadProducts() {
  fetch(PRODUCTS_JSON)
    .then(res => res.json())
    .then(data => {
      products = data;
      renderProductGrid();
      updateCartSummary();
    });
}

function renderProductGrid() {
  const grid = document.getElementById('product-grid');
  if (!grid) return;
  grid.innerHTML = '';
  products.forEach(prod => {
    const card = document.createElement('div');
    card.className = 'product-card';
    card.innerHTML = `
      <img src="${prod['image_' + lang]}" alt="${prod['name_' + lang]}">
      <h3>${prod['name_' + lang]}</h3>
      <div class="product-short">${prod['short_' + lang]}</div>
      <div class="product-price">${prod['price_hu']} / ${prod['price_en']}</div>
      ${prod.fb_link ? `<div class="fb-link"><a href="${prod.fb_link}" target="_blank">${lang === 'hu' ? 'Bővebb leírás a Facebookon' : 'More details on Facebook'}</a></div>` : ''}
      <div class="card-actions">
        <button onclick="openProductModal('${prod.id}')">${lang === 'hu' ? 'Részletek' : 'Details'}</button>
        <button onclick="addToCart('${prod.id}')">${lang === 'hu' ? 'Kosárba' : 'Add to cart'}</button>
      </div>
    `;
    grid.appendChild(card);
  });
}

// --- PRODUCT MODAL ---
window.openProductModal = function(id) {
  const prod = products.find(p => p.id === id);
  if (!prod) return;
  const modal = document.getElementById('product-modal');
  const body = document.getElementById('modal-body');
  const longTextRaw = prod['long_' + lang].replace(/\n/g, "<br>");
  body.innerHTML = `
    <img src="${prod['image_' + lang]}" alt="${prod['name_' + lang]}" style="width:120px;height:120px;object-fit:cover;border-radius:0.7rem;margin-bottom:1rem;">
    <h3>${prod['name_' + lang]}</h3>
    <div style="margin-bottom:0.7rem;">${prod['price_hu']} / ${prod['price_en']}</div>
    <div style="margin-bottom:1rem;">${longTextRaw}</div>
    <ul style="margin-bottom:1rem;">${prod['bullets_' + lang].map(b => `<li>${b}</li>`).join('')}</ul>
    ${prod.fb_link ? `<div class="fb-link"><a href="${prod.fb_link}" target="_blank">${lang === 'hu' ? 'Bővebb leírás a Facebookon' : 'More details on Facebook'}</a></div>` : ''}
    <button onclick="addToCart('${prod.id}')" style="margin-top:1rem;">${lang === 'hu' ? 'Kosárba' : 'Add to cart'}</button>
  `;
  modal.style.display = 'block';
};
document.getElementById('close-modal').onclick = () => {
  document.getElementById('product-modal').style.display = 'none';
};
window.onclick = function(event) {
  if (event.target.classList.contains('modal')) {
    event.target.style.display = 'none';
  }
};

// --- CART LOGIC ---
function addToCart(id) {
  cart[id] = (cart[id] || 0) + 1;
  saveCart();
  updateCartSummary();
  renderCartModal();
}
function removeFromCart(id) {
  if (cart[id]) {
    cart[id]--;
    if (cart[id] <= 0) delete cart[id];
    saveCart();
    updateCartSummary();
    renderCartModal();
  }
}
function setCartQty(id, qty) {
  qty = Math.max(1, parseInt(qty) || 1);
  cart[id] = qty;
  saveCart();
  updateCartSummary();
  renderCartModal();
}
function saveCart() {
  localStorage.setItem('zolioil_cart', JSON.stringify(cart));
}
function getCartItems() {
  return Object.entries(cart).map(([id, qty]) => {
    const prod = products.find(p => p.id === id);
    return prod ? { ...prod, qty } : null;
  }).filter(Boolean);
}
function getCartTotal() {
  let totalHUF = 0, totalEUR = 0;
  getCartItems().forEach(item => {
    const huf = parseInt(item.price_hu.replace(/\D/g, '')) || 0;
    const eur = parseFloat(item.price_en.replace(',', '.')) || 0;
    totalHUF += huf * item.qty;
    totalEUR += eur * item.qty;
  });
  return { totalHUF, totalEUR };
}

// --- CART SUMMARY IN HEADER ---
function setupCartSummary() {
  const btn = document.getElementById('open-cart-btn');
  if (btn) btn.onclick = () => openCartModal();
}
function updateCartSummary() {
  const count = Object.values(cart).reduce((a, b) => a + b, 0);
  const { totalHUF } = getCartTotal();
  const cartCount = document.getElementById('cart-count');
  const cartTotal = document.getElementById('cart-total');
  if (cartCount) cartCount.textContent = count;
  if (cartTotal) cartTotal.textContent = totalHUF + ' Ft';
}

function clearCart() {
  cart = {};
  saveCart();
  updateCartSummary();
  renderCartModal();
}

// --- CART MODAL ---
function setupCartModal() {
  const closeBtn = document.getElementById('close-cart-modal');
  if (closeBtn) closeBtn.onclick = () => document.getElementById('cart-modal').style.display = 'none';
  
  
 const checkoutBtn = document.getElementById('checkout-btn');
if (checkoutBtn) checkoutBtn.onclick = () => {
  const name = document.getElementById('order-name').value.trim();
  const address = document.getElementById('order-address').value.trim();
  const phone = document.getElementById('order-phone').value.trim();
  if (!name || !address || !phone) {
    alert(lang === 'hu'
      ? 'Kérjük, add meg a neved, címed és telefonszámod!'
      : 'Please provide your name, address, and phone number!');
    return;
  }
  const subject = encodeURIComponent(lang === 'hu' ? 'Új rendelés – Zoli és az Olajok' : 'New order – Zoli és az Olajok');
  const body = encodeURIComponent(buildOrderText(name, address, phone));
  window.location.href = `mailto:sntsnt75@gmail.com?subject=${subject}&body=${body}`;
  clearCart();
  // ürítsd az input mezőket is, ha szeretnéd:
  document.getElementById('order-name').value = '';
  document.getElementById('order-address').value = '';
  document.getElementById('order-phone').value = '';
  document.getElementById('order-email-text').value = '';
  document.getElementById('cart-modal').style.display = 'none';
};
}

function updateOrderTextarea() {
  const name = document.getElementById('order-name').value.trim();
  const address = document.getElementById('order-address').value.trim();
  const phone = document.getElementById('order-phone').value.trim();
  document.getElementById('order-email-text').value = buildOrderText(name, address, phone);
}

function openCartModal() {
  renderCartModal();
  document.getElementById('cart-modal').style.display = 'block';

  // --- ÚJ: rendelési mezők eseménykezelői ---
  ['order-name', 'order-address', 'order-phone'].forEach(id => {
    const el = document.getElementById(id);
    if (el) el.oninput = updateOrderTextarea;
  });
  updateOrderTextarea(); // első megnyitáskor is frissüljön

}
function renderCartModal() {
  const itemsDiv = document.getElementById('cart-items');
  const summaryDiv = document.getElementById('cart-summary-modal');
  const items = getCartItems();
  if (!itemsDiv || !summaryDiv) return;
  if (items.length === 0) {
    itemsDiv.innerHTML = `<p>${lang === 'hu' ? 'A kosár üres.' : 'Your cart is empty.'}</p>`;
    summaryDiv.innerHTML = '';
    return;
  }
  itemsDiv.innerHTML = items.map(item => `
    <div class="cart-item">
      <span class="cart-product-name">${item['name_' + lang]}</span>
      <div class="cart-qty-controls">
        <button onclick="removeFromCart('${item.id}')">-</button>
        <input type="number" min="1" value="${item.qty}" onchange="setCartQty('${item.id}', this.value)" style="width:2.5em;">
        <button onclick="addToCart('${item.id}')">+</button>
      </div>
      <span>${item.price_hu} / ${item.price_en}</span>
    </div>
  `).join('');
  const { totalHUF, totalEUR } = getCartTotal();
  summaryDiv.innerHTML = `${lang === 'hu' ? 'Összesen:' : 'Total:'} ${totalHUF} Ft / ${totalEUR.toFixed(2)} EUR`;
}

// --- ORDER BY EMAIL ---

function buildOrderText(name, address, phone) {
  const items = getCartItems();
  if (items.length === 0) return lang === 'hu' ? 'A kosár üres.' : 'Your cart is empty.';

  let text = (lang === 'hu'
    ? 'Megrendelés – Zoli és az Olajok\n\n'
    : 'Order – Zoli és az Olajok\n\n');
  text += (lang === 'hu'
    ? 'Termékek:\n'
    : 'Products:\n');
  items.forEach(item => {
    text += `- ${item['name_' + lang]} x ${item.qty} (${item.price_hu} / ${item.price_en})\n`;
  });
  const { totalHUF, totalEUR } = getCartTotal();
  text += (lang === 'hu'
    ? `\nÖsszesen: ${totalHUF} Ft / ${totalEUR.toFixed(2)} EUR\n`
    : `\nTotal: ${totalHUF} HUF / ${totalEUR.toFixed(2)} EUR\n`);
   text += (lang === 'hu'
    ? `\nNév: ${name}\nCím: ${address}\nTelefon: ${phone}\n`
    : `\nName: ${name}\nAddress: ${address}\nPhone: ${phone}\n`);
  return text;
}
function sendOrderEmail() {
  const name = document.getElementById('order-name').value.trim();
  const address = document.getElementById('order-address').value.trim();
  const phone = document.getElementById('order-phone').value.trim();
  if (!name || !address || !phone) {
    alert(lang === 'hu'
      ? 'Kérjük, add meg a neved, címed és telefonszámod!'
      : 'Please provide your name, address, and phone number!');
    return;
  }
  const subject = encodeURIComponent(lang === 'hu' ? 'Új rendelés – Zoli és az Olajok' : 'New order – Zoli és az Olajok');
  const body = encodeURIComponent(buildOrderText(name, address, phone));
  window.location.href = `mailto:sntsnt75@gmail.com?subject=${subject}&body=${body}`;
  clearCart();
  // ürítsd az input mezőket is, ha szeretnéd:
  document.getElementById('order-name').value = '';
  document.getElementById('order-address').value = '';
  document.getElementById('order-phone').value = '';
  document.getElementById('order-email-text').value = '';
}

// --- EXPORT FOR INLINE EVENTS ---
window.addToCart = addToCart;
window.removeFromCart = removeFromCart;
window.setCartQty = setCartQty;