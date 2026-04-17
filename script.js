const state = {
  products: [],
  filteredProducts: [],
  cart: JSON.parse(localStorage.getItem("casaviva-cart")) || [],
};

const productsRow = document.getElementById("products-row");
const loader = document.getElementById("loader");
const resultsText = document.getElementById("results-text");
const alertBox = document.getElementById("alert-box");
const searchInput = document.getElementById("search-input");
const categorySelect = document.getElementById("category-select");
const cartItems = document.getElementById("cart-items");
const cartTotal = document.getElementById("cart-total");
const cartCount = document.getElementById("cart-count");
const clearCartBtn = document.getElementById("clear-cart-btn");
const reloadProductsBtn = document.getElementById("reload-products-btn");
const modalBodyContent = document.getElementById("modal-body-content");

const productModal = new bootstrap.Modal(document.getElementById("productModal"));

function normalizeText(value) {
  return String(value || "")
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLowerCase()
    .trim();
}

function formatPrice(value) {
  return new Intl.NumberFormat("it-IT", {
    style: "currency",
    currency: "EUR",
  }).format(value);
}

function saveCart() {
  localStorage.setItem("casaviva-cart", JSON.stringify(state.cart));
}

function showAlert(message, type = "warning") {
  alertBox.innerHTML = `
    <div class="alert alert-${type} alert-dismissible fade show" role="alert">
      ${message}
      <button type="button" class="btn-close" data-bs-dismiss="alert" aria-label="Chiudi"></button>
    </div>
  `;
}

function getCategoryFromProduct(product) {
  return product.brand?.trim() || "Collezione";
}

function populateCategories(products) {
  const categories = [...new Set(products.map(getCategoryFromProduct))].sort((a, b) => a.localeCompare(b));

  categorySelect.innerHTML = `
    <option value="all">Tutte le categorie</option>
    ${categories.map((category) => `<option value="${category}">${category}</option>`).join("")}
  `;
}

function renderProducts(products) {
  if (!products.length) {
    productsRow.classList.remove("d-none");
    productsRow.innerHTML = `
      <div class="col-12">
        <div class="empty-state text-center p-5">
          <h3 class="h4 mb-2">Nessun prodotto disponibile</h3>
          <p class="text-secondary mb-0">
            Controlla il token API oppure aggiungi i prodotti dal backoffice.
          </p>
        </div>
      </div>
    `;
    resultsText.textContent = "0 prodotti trovati";
    return;
  }

  productsRow.classList.remove("d-none");
  const fallbackImage = "https://placehold.co/600x400?text=Immagine+non+disponibile";
  productsRow.innerHTML = products
    .map(
      (product) => `
        <div class="col-md-6 col-xl-4">
          <article class="card product-card">
            <img
              src="${product.imageUrl}"
              class="card-img-top"
              alt="${product.name}"
              onerror="this.onerror=null;this.src='${fallbackImage}';"
            />
            <div class="card-body d-flex flex-column">
              <div class="d-flex justify-content-between align-items-start gap-3 mb-2">
                <h3 class="h5 mb-0">${product.name}</h3>
                <span class="badge rounded-pill">${getCategoryFromProduct(product)}</span>
              </div>
              <p class="text-secondary flex-grow-1">${product.description}</p>
              <div class="d-flex justify-content-between align-items-center mt-3">
                <span class="price-tag">${formatPrice(product.price)}</span>
                <div class="d-flex gap-2 flex-wrap">
                  <button class="btn btn-outline-dark rounded-pill" data-action="details" data-id="${product._id}">
                    Dettagli
                  </button>
                  <button class="btn btn-outline-secondary rounded-pill" data-action="edit" data-id="${product._id}">
                    Modifica
                  </button>
                  <button class="btn btn-dark rounded-pill" data-action="add-to-cart" data-id="${product._id}">
                    Aggiungi
                  </button>
                </div>
              </div>
            </div>
          </article>
        </div>
      `
    )
    .join("");

  resultsText.textContent = `${products.length} prodotti trovati`;
}

function renderCart() {
  cartCount.textContent = state.cart.reduce((sum, item) => sum + item.quantity, 0);

  if (!state.cart.length) {
    cartItems.innerHTML = `
      <div class="text-center text-secondary pt-4">
        <p class="mb-0">Il carrello e vuoto.</p>
      </div>
    `;
    cartTotal.textContent = formatPrice(0);
    return;
  }

  cartItems.innerHTML = state.cart
    .map(
      (item) => `
        <div class="d-flex gap-3 mb-3 align-items-center">
          <img src="${item.imageUrl}" alt="${item.name}" class="cart-thumb" />
          <div class="flex-grow-1">
            <p class="fw-semibold mb-1">${item.name}</p>
            <p class="text-secondary small mb-1">${item.quantity} x ${formatPrice(item.price)}</p>
            <button class="btn btn-sm btn-link text-danger p-0" data-action="remove-from-cart" data-id="${item._id}">
              Rimuovi
            </button>
          </div>
        </div>
      `
    )
    .join("");

  const total = state.cart.reduce((sum, item) => sum + item.price * item.quantity, 0);
  cartTotal.textContent = formatPrice(total);
}

function applyFilters() {
  const searchTerm = normalizeText(searchInput.value);
  const selectedCategory = categorySelect.value;

  state.filteredProducts = state.products.filter((product) => {
    const searchableText = [product.name, product.description, product.brand]
      .map(normalizeText)
      .join(" ");

    const matchesSearch = !searchTerm || searchableText.includes(searchTerm);
    const matchesCategory =
      selectedCategory === "all" || getCategoryFromProduct(product) === selectedCategory;

    return matchesSearch && matchesCategory;
  });

  renderProducts(state.filteredProducts);
}

function addToCart(productId) {
  const product = state.products.find((item) => item._id === productId);
  if (!product) return;

  const existingProduct = state.cart.find((item) => item._id === productId);

  if (existingProduct) {
    existingProduct.quantity += 1;
  } else {
    state.cart.push({ ...product, quantity: 1 });
  }

  saveCart();
  renderCart();
  showAlert(`${product.name} aggiunto al carrello.`, "success");
}

function removeFromCart(productId) {
  state.cart = state.cart.filter((item) => item._id !== productId);
  saveCart();
  renderCart();
}

function openProductModal(productId) {
  const product = state.products.find((item) => item._id === productId);
  if (!product) return;

  modalBodyContent.innerHTML = `
    <div class="row g-4 align-items-center">
      <div class="col-md-6">
        <img src="${product.imageUrl}" alt="${product.name}" class="modal-product-image" />
      </div>
      <div class="col-md-6">
        <span class="badge rounded-pill mb-3">${getCategoryFromProduct(product)}</span>
        <h3>${product.name}</h3>
        <p class="text-secondary">${product.description}</p>
        <p class="price-tag mb-4">${formatPrice(product.price)}</p>
        <button class="btn btn-dark rounded-pill px-4" data-action="add-to-cart" data-id="${product._id}">
          Aggiungi al carrello
        </button>
      </div>
    </div>
  `;

  productModal.show();
}

async function fetchProducts() {
  loader.classList.remove("d-none");
  productsRow.classList.add("d-none");
  alertBox.innerHTML = "";

  if (!API_CONFIG.token) {
    loader.classList.add("d-none");
    state.products = [];
    applyFilters();
    showAlert(
      "Inserisci il tuo token in config.js per leggere i prodotti dalla API di Strive.",
      "warning"
    );
    return;
  }

  try {
    const response = await fetch(API_CONFIG.baseUrl, {
      headers: getAuthHeaders(),
    });

    if (!response.ok) {
      throw new Error(`Errore API: ${response.status}`);
    }

    const products = await response.json();
    state.products = products;
    populateCategories(products);
    applyFilters();
    showAlert("Catalogo sincronizzato con la API.", "success");
  } catch (error) {
    state.products = [];
    applyFilters();
    showAlert("Non sono riuscito a leggere la API. Controlla token ed endpoint.", "danger");
    console.error(error);
  } finally {
    loader.classList.add("d-none");
  }
}

productsRow.addEventListener("click", (event) => {
  const button = event.target.closest("button");
  if (!button) return;

  const action = button.dataset.action;
  const productId = button.dataset.id;

  if (action === "add-to-cart") addToCart(productId);
  if (action === "details") openProductModal(productId);
  if (action === "edit") {
    window.location.href = `./backoffice.html?id=${encodeURIComponent(productId)}`;
  }
});

modalBodyContent.addEventListener("click", (event) => {
  const button = event.target.closest("button");
  if (!button) return;

  if (button.dataset.action === "add-to-cart") addToCart(button.dataset.id);
});

cartItems.addEventListener("click", (event) => {
  const button = event.target.closest("button");
  if (!button) return;

  if (button.dataset.action === "remove-from-cart") removeFromCart(button.dataset.id);
});

searchInput.addEventListener("input", applyFilters);
categorySelect.addEventListener("change", applyFilters);
reloadProductsBtn.addEventListener("click", fetchProducts);

clearCartBtn.addEventListener("click", () => {
  state.cart = [];
  saveCart();
  renderCart();
});

renderCart();
fetchProducts();
