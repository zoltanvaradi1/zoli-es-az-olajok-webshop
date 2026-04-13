// Shared JS for HU + EN pages (cart, modals, mailto, basic UI)
// NOTE: if you change your email address, update EMAIL_TO below and in the HTML contact links.
const EMAIL_TO = "sntsnt75@gmail.com"; // TODO: change to your email if needed

// Load year in footers
document.addEventListener("DOMContentLoaded", () => {
  const yearSpans = document.querySelectorAll("#year");
  yearSpans.forEach((el) => (el.textContent = new Date().getFullYear()));

  initPage();
});

// Simple in-memory cart (optionally persisted to localStorage)
const CART_KEY = "zoli_olajok_cart_v1";

function loadCart() {
  try {
    const raw = localStorage.getItem(CART_KEY);
    return raw ? JSON.parse(raw) : [];
  } catch (e) {
    return [];
  }
}

function saveCart(cart) {
  try {
    localStorage.setItem(CART_KEY, JSON.stringify(cart));
  } catch (e) {
    // ignore
  }
}

let cart = loadCart(); // array of {id, qty}

/**
 * Load products from assets/products.json using a relative path that works
 * on GitHub Pages from both root and subdirectories. [web:1][web:4][web:10]
 */
async function loadProducts() {
  // When we are in /hu or /en, we need "../assets/products.json".
  // On root index page we would use "assets/products.json", but the language
  // selector does not need products, so this function is only used in /hu and /en.
  return fetch("../assets/products.json")
    .then((res) => res.json())
    .catch(() => []);
}

// Main init per page
function initPage() {
  const body = document.body;
  const lang = body.getAttribute("data-lang");

  initAccordion();
  initModals();

  if (lang === "hu" || lang === "en") {
    initShop(lang);
    initCartUI(lang);
    initOrderForm(lang);
  }
}

/* ----------------- Accordion (FAQ) ----------------- */
function initAccordion() {
  document.querySelectorAll(".accordion-header").forEach((btn) => {
    btn.addEventListener("click", () => {
      const item = btn.closest(".accordion-item");
      const body = item.querySelector(".accordion-body");
      const isOpen = item.classList.contains("open");

      if (isOpen) {
        item.classList.remove("open");
        body.style.maxHeight = "0px";
      } else {
        item.classList.add("open");
        body.style.maxHeight = body.scrollHeight + "px";
      }
    });
  });
}

/* ----------------- Modals ----------------- */
function openModal(modalId) {
  const modal = document.getElementById(modalId);
  if (!modal) return;
  modal.classList.add("show");
  modal.setAttribute("aria-hidden", "false");
}

function closeModal(modalId) {
  const modal = document.getElementById(modalId);
  if (!modal) return;
  modal.classList.remove("show");
  modal.setAttribute("aria-hidden", "true");
}

function initModals() {
  document.querySelectorAll("[data-close]").forEach((el) => {
    el.addEventListener("click", () => {
      const key = el.getAttribute("data-close");
      if (key === "cartHu") closeModal("cartModalHu");
      if (key === "cartEn") closeModal("cartModalEn");
      if (key === "productHu") closeModal("productModalHu");
      if (key === "productEn") closeModal("productModalEn");
    });
  });
}

/* ----------------- Shop rendering ----------------- */
async function initShop(lang) {
  const gridId = lang === "hu" ? "productsGridHu" : "productsGridEn";
  const container = document.getElementById(gridId);
  if (!container) return;

  const products = await loadProducts();
  renderProducts(container, products, lang);
  initFilterButtons(container, products, lang);
}

function renderProducts(container, products, lang, filter = "all") {
  container.innerHTML = "";

  products
    .filter((p) => (filter === "all" ? true : p.category === filter))
    .forEach((p) => {
      const card = document.createElement("article");
      card.className = "product-card";

      const name = lang === "hu" ? p.name_hu : p.name_en;
      const short = lang === "hu" ? p.short_hu : p.short_en;
      const price = lang === "hu" ? p.price_hu : p.price_en;

      const labelOil = lang === "hu" ? "Olaj" : "Oil";
      const labelKit = lang === "hu" ? "Készlet" : "Kit";
      const detailsText = lang === "hu" ? "Részletek" : "Details";
      const addText = lang === "hu" ? "Kosárba" : "Add to cart";
      const fbText =
        lang === "hu"
          ? "Bővebb leírás a Facebookon"
          : "More details on Facebook";

      const categoryLabel = p.category === "oil" ? labelOil : labelKit;

      card.innerHTML = `
        <div class="product-category">${categoryLabel}</div>
        <div class="product-name">${name}</div>
        <div class="product-short">${short}</div>
        <div class="product-price">${price}</div>
        <div class="product-actions">
          <button class="btn secondary product-details-btn" data-id="${p.id}" data-lang="${lang}">
            ${detailsText}
          </button>
          <button class="btn primary product-add-btn" data-id="${p.id}" data-lang="${lang}">
            ${addText}
          </button>
          ${
            p.fb_link
              ? `<a href="${p.fb_link}" target="_blank" rel="noopener" class="product-facebook-link">
                   <span>🔗</span><span>${fbText}</span>
                 </a>`
              : ""
          }
        </div>
      `;

      container.appendChild(card);
    });

  // Attach listeners for new buttons
  container.querySelectorAll(".product-details-btn").forEach((btn) => {
    btn.addEventListener("click", () => {
      const id = btn.getAttribute("data-id");
      const lang = btn.getAttribute("data-lang");
      openProductModal(id, lang);
    });
  });

  container.querySelectorAll(".product-add-btn").forEach((btn) => {
    btn.addEventListener("click", () => {
      const id = btn.getAttribute("data-id");
      addToCart(id);
      updateCartUI();
    });
  });
}

function initFilterButtons(container, products, lang) {
  document.querySelectorAll(".filter-btn").forEach((btn) => {
    btn.addEventListener("click", () => {
      const filter = btn.getAttribute("data-filter");
      document.querySelectorAll(".filter-btn").forEach((b) => b.classList.remove("active"));
      btn.classList.add("active");
      renderProducts(container, products, lang, filter);
    });
  });
}

/* ----------------- Product details modal ----------------- */
async function openProductModal(id, lang) {
  const products = await loadProducts();
  const product = products.find((p) => p.id === id);
  if (!product) return;

  const modalId = lang === "hu" ? "productModalHu" : "productModalEn";
  const titleId = lang === "hu" ? "productModalTitleHu" : "productModalTitleEn";
  const bodyId = lang === "hu" ? "productModalBodyHu" : "productModalBodyEn";

  const titleEl = document.getElementById(titleId);
  const bodyEl = document.getElementById(bodyId);

  const name = lang === "hu" ? product.name_hu : product.name_en;
  const longText = lang === "hu" ? product.long_hu : product.long_en;
  const bullets = lang === "hu" ? product.bullets_hu : product.bullets_en;

  titleEl.textContent = name;

  

  const bulletsHtml = bullets
    .map((b) => `<li>${b}</li>`)
    .join("");

  bodyEl.innerHTML = `
    <p class="product-modal-description">${longText}</p>
    ${
      bullets && bullets.length
        ? `<ul class="product-modal-bullets">${bulletsHtml}</ul>`
        : ""
    }
  `;

  openModal(modalId);
}

/* ----------------- Cart operations ----------------- */
function addToCart(productId) {
  const existing = cart.find((item) => item.id === productId);
  if (existing) {
    existing.qty += 1;
  } else {
    cart.push({ id: productId, qty: 1 });
  }
  saveCart(cart);
}

function changeQty(productId, delta) {
  const item = cart.find((c) => c.id === productId);
  if (!item) return;
  item.qty += delta;
  if (item.qty <= 0) {
    cart = cart.filter((c) => c.id !== productId);
  }
  saveCart(cart);
}

function clearCart() {
  cart = [];
  saveCart(cart);
}

/* ----------------- Cart UI ----------------- */
async function initCartUI(lang) {
  const toggleId = lang === "hu" ? "cartToggleHu" : "cartToggleEn";
  const modalId = lang === "hu" ? "cartModalHu" : "cartModalEn";
  const clearId = lang === "hu" ? "clearCartHu" : "clearCartEn";

  const toggleBtn = document.getElementById(toggleId);
  const clearBtn = document.getElementById(clearId);

  if (toggleBtn) {
    toggleBtn.addEventListener("click", () => {
      renderCartModal(lang); // ensure latest state
      openModal(modalId);
    });
  }

  if (clearBtn) {
    clearBtn.addEventListener("click", () => {
      clearCart();
      updateCartUI();
      renderCartModal(lang);
    });
  }

  updateCartUI();
}

// Calculate totals using current language prices
async function getCartSummary(lang) {
  const products = await loadProducts();
  let items = [];
  let total = 0;
  cart.forEach((entry) => {
    const product = products.find((p) => p.id === entry.id);
    if (!product) return;
    const priceStr = lang === "hu" ? product.price_hu : product.price_en;

    const priceNumber = parseFloat(
      (priceStr || "0").replace(/[^\d.,]/g, "").replace(",", ".")
    );
    const price = isNaN(priceNumber) ? 0 : priceNumber;

    const lineTotal = price * entry.qty;
    total += lineTotal;

    items.push({
      product,
      qty: entry.qty,
      price,
      lineTotal,
    });
  });

  return { items, total };
}

async function updateCartUI() {
  const langHu = "hu";
  const langEn = "en";

  const count = cart.reduce((sum, item) => sum + item.qty, 0);

  const countHuEl = document.getElementById("cartCountHu");
  const countEnEl = document.getElementById("cartCountEn");
  if (countHuEl) countHuEl.textContent = count;
  if (countEnEl) countEnEl.textContent = count;

  const totalHuEl = document.getElementById("cartTotalHu");
  if (totalHuEl) {
    const { total } = await getCartSummary(langHu);
    totalHuEl.textContent = total ? `${total.toFixed(0)} Ft` : "0 Ft";
  }

  const totalEnEl = document.getElementById("cartTotalEn");
  if (totalEnEl) {
    const { total } = await getCartSummary(langEn);
    totalEnEl.textContent = total ? `${total.toFixed(2)} €` : "0 €";
  }
}

async function renderCartModal(lang) {
  const containerId = lang === "hu" ? "cartItemsHu" : "cartItemsEn";
  const subtotalId = lang === "hu" ? "cartSubtotalHu" : "cartSubtotalEn";

  const container = document.getElementById(containerId);
  const subtotalEl = document.getElementById(subtotalId);
  if (!container || !subtotalEl) return;

  const { items, total } = await getCartSummary(lang);
  container.innerHTML = "";

  if (!items.length) {
    container.textContent =
      lang === "hu" ? "A kosár jelenleg üres." : "Your cart is currently empty.";
    subtotalEl.textContent = lang === "hu" ? "0 Ft" : "0 €";
    return;
  }

  items.forEach(({ product, qty, lineTotal }) => {
    const name = lang === "hu" ? product.name_hu : product.name_en;
    const unitPrice = lang === "hu" ? product.price_hu : product.price_en;

    const row = document.createElement("div");
    row.className = "cart-item-row";
    row.innerHTML = `
      <div>
        <div class="cart-item-name">${name}</div>
        <div class="cart-item-unit">${unitPrice}</div>
      </div>
      <div class="cart-item-controls">
        <button class="cart-qty-btn" data-id="${product.id}" data-delta="-1">–</button>
        <span>${qty}</span>
        <button class="cart-qty-btn" data-id="${product.id}" data-delta="1">+</button>
      </div>
    `;
    container.appendChild(row);
  });

  const currency = lang === "hu" ? "Ft" : "€";
  subtotalEl.textContent = total ? `${total.toFixed(lang === "hu" ? 0 : 2)} ${currency}` : `0 ${currency}`;

  container.querySelectorAll(".cart-qty-btn").forEach((btn) => {
    btn.addEventListener("click", () => {
      const id = btn.getAttribute("data-id");
      const delta = parseInt(btn.getAttribute("data-delta"), 10);
      changeQty(id, delta);
      updateCartUI();
      renderCartModal(lang);
    });
  });
}

/* ----------------- Order by email (mailto) ----------------- */
// We URL‑encode subject/body to build a safe mailto link. [web:3][web:6][web:9]
async function initOrderForm(lang) {
  const buttonId = lang === "hu" ? "emailOrderHu" : "emailOrderEn";
  const summaryId = lang === "hu" ? "orderSummaryHu" : "orderSummaryEn";
  const formId = lang === "hu" ? "orderFormHu" : "orderFormEn";

  const button = document.getElementById(buttonId);
  const summaryTextarea = document.getElementById(summaryId);
  const form = document.getElementById(formId);

  if (!button || !summaryTextarea || !form) return;

  button.addEventListener("click", async () => {
    const formData = new FormData(form);
    const name = formData.get("name") || "";
    const email = formData.get("email") || "";
    const phone = formData.get("phone") || "";
    const address = formData.get("address") || "";
    const comment = formData.get("comment") || "";

    const { items, total } = await getCartSummary(lang);

    const lines = [];

    if (lang === "hu") {
      lines.push("Új rendelés – Zoli és az Olajok");
      lines.push("");
      lines.push("Termékek:");
    } else {
      lines.push("New order – Zoli és az Olajok");
      lines.push("");
      lines.push("Products:");
    }

    if (!items.length) {
      if (lang === "hu") {
        lines.push("(A kosár jelenleg üres.)");
      } else {
        lines.push("(The cart is currently empty.)");
      }
    } else {
      items.forEach(({ product, qty }) => {
        const name = lang === "hu" ? product.name_hu : product.name_en;
        const price = lang === "hu" ? product.price_hu : product.price_en;
        lines.push(`- ${name} | ${price} | Mennyiség / Qty: ${qty}`);
      });
    }

    lines.push("");
    if (lang === "hu") {
      lines.push(`Összeg (becsült, tájékoztató jellegű): ${total.toFixed(0)} Ft`);
    } else {
      lines.push(`Total (estimated): ${total.toFixed(2)} €`);
    }
    lines.push("");
    if (lang === "hu") {
      lines.push("Vevő adatai:");
    } else {
      lines.push("Customer details:");
    }
    lines.push(`Név / Name: ${name}`);
    lines.push(`E‑mail: ${email}`);
    lines.push(`Telefon / Phone: ${phone}`);
    lines.push(`Cím / Address: ${address}`);
    lines.push("");
    lines.push(`Megjegyzés / Comment: ${comment}`);

    const summaryText = lines.join("\n");
    summaryTextarea.value = summaryText;

    const subject =
      lang === "hu"
        ? "Új rendelés – Zoli és az Olajok"
        : "New order – Zoli és az Olajok";

    const mailtoLink =
      "mailto:" +
      encodeURIComponent(EMAIL_TO) +
      "?subject=" +
      encodeURIComponent(subject) +
      "&body=" +
      encodeURIComponent(summaryText);

    // Try to open mail client, but the textarea still shows the text for copy‑paste.
    window.location.href = mailtoLink;
  });
}