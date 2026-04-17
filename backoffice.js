const productForm = document.getElementById("product-form");
const productIdInput = document.getElementById("product-id");
const nameInput = document.getElementById("name");
const descriptionInput = document.getElementById("description");
const brandInput = document.getElementById("brand");
const priceInput = document.getElementById("price");
const imageUrlInput = document.getElementById("imageUrl");
const resetBtn = document.getElementById("reset-btn");
const refreshBtn = document.getElementById("refresh-btn");
const submitBtn = document.getElementById("submit-btn");
const productsTableBody = document.getElementById("products-table-body");
const backofficeResults = document.getElementById("backoffice-results");
const backofficeAlert = document.getElementById("backoffice-alert");
const presetButtons = document.getElementById("preset-buttons");

let products = [];

const productPresets = {
  "garden-set": {
    name: "Set tavolo da giardino",
    description: "Set da esterno ideale per terrazza e giardino, perfetto per pranzi e cene all'aperto.",
    brand: "Giardino",
    price: 199.99,
    imageUrl:
      "https://images.unsplash.com/photo-1600210492493-0946911123ea?auto=format&fit=crop&w=1200&q=80",
  },
  "beach-bed": {
    name: "Lettino da mare",
    description: "Lettino da spiaggia leggero e resistente, perfetto per relax in riva al mare e in piscina.",
    brand: "Mare",
    price: 89.9,
    imageUrl:
      "https://images.unsplash.com/photo-1519046904884-53103b34b206?auto=format&fit=crop&w=1200&q=80",
  },
  "folding-chair": {
    name: "Sedia outdoor pieghevole",
    description: "Sedia da esterno leggera e resistente, perfetta per balcone, campeggio e terrazza.",
    brand: "Relax",
    price: 39.9,
    imageUrl:
      "https://images.unsplash.com/photo-1533090481720-856c6e3c1fdc?auto=format&fit=crop&w=1200&q=80",
  },
  kayak: {
    name: "Kayak gonfiabile estivo",
    description: "Kayak pratico e versatile per lago e mare, pensato per il tempo libero all'aperto.",
    brand: "Mare",
    price: 149.99,
    imageUrl:
      "https://images.unsplash.com/photo-1544551763-46a013bb70d5?auto=format&fit=crop&w=1200&q=80",
  },
};

function showBackofficeAlert(message, type = "warning") {
  backofficeAlert.innerHTML = `
    <div class="alert alert-${type} alert-dismissible fade show" role="alert">
      ${message}
      <button type="button" class="btn-close" data-bs-dismiss="alert" aria-label="Chiudi"></button>
    </div>
  `;
}

function resetForm() {
  productForm.reset();
  productIdInput.value = "";
  submitBtn.textContent = "Salva prodotto";
}

function handleResetClick() {
  const hasContent =
    nameInput.value.trim() ||
    descriptionInput.value.trim() ||
    brandInput.value.trim() ||
    priceInput.value.trim() ||
    imageUrlInput.value.trim();

  if (hasContent && !window.confirm("Vuoi davvero svuotare il form?")) {
    return;
  }
  resetForm();
}

function fillForm(product) {
  productIdInput.value = product._id;
  nameInput.value = product.name;
  descriptionInput.value = product.description;
  brandInput.value = product.brand;
  priceInput.value = product.price;
  imageUrlInput.value = product.imageUrl;
  submitBtn.textContent = "Aggiorna prodotto";
  window.scrollTo({ top: 0, behavior: "smooth" });
}

function fillFormFromPreset(preset) {
  productIdInput.value = "";
  nameInput.value = preset.name;
  descriptionInput.value = preset.description;
  brandInput.value = preset.brand;
  priceInput.value = preset.price;
  imageUrlInput.value = preset.imageUrl;
  submitBtn.textContent = "Salva prodotto";
  window.scrollTo({ top: 0, behavior: "smooth" });
}

function renderTable() {
  backofficeResults.textContent = `${products.length} prodotti nel catalogo`;

  if (!products.length) {
    productsTableBody.innerHTML = `
      <tr>
        <td colspan="4" class="text-center text-secondary py-4">
          Nessun prodotto presente. Aggiungine uno dal form.
        </td>
      </tr>
    `;
    return;
  }

  const fallbackImage = "https://placehold.co/120x120?text=No+img";
  productsTableBody.innerHTML = products
    .map(
      (product) => `
        <tr>
          <td>
            <div class="d-flex align-items-center gap-3">
              <img src="${product.imageUrl}" alt="${product.name}" class="cart-thumb" onerror="this.onerror=null;this.src='${fallbackImage}';" />
              <div>
                <p class="fw-semibold mb-1">${product.name}</p>
                <p class="text-secondary small mb-0">${product.description.slice(0, 70)}...</p>
              </div>
            </div>
          </td>
          <td>${product.brand}</td>
          <td>${new Intl.NumberFormat("it-IT", {
            style: "currency",
            currency: "EUR",
          }).format(product.price)}</td>
          <td class="text-end">
            <div class="d-flex justify-content-end gap-2">
              <button class="btn btn-sm btn-outline-dark rounded-pill" data-action="edit" data-id="${product._id}">
                Modifica
              </button>
              <button class="btn btn-sm btn-outline-danger rounded-pill" data-action="delete" data-id="${product._id}">
                Elimina
              </button>
            </div>
          </td>
        </tr>
      `
    )
    .join("");
}

async function fetchProducts() {
  if (!API_CONFIG.token) {
    products = [];
    renderTable();
    showBackofficeAlert("Inserisci il token in config.js prima di usare il backoffice.", "warning");
    return;
  }

  try {
    const response = await fetch(API_CONFIG.baseUrl, {
      headers: getAuthHeaders(),
    });

    if (!response.ok) {
      throw new Error(`Errore API: ${response.status}`);
    }

    products = await response.json();
    renderTable();
    preloadEditFromUrl();
  } catch (error) {
    products = [];
    renderTable();
    showBackofficeAlert("Non sono riuscito a caricare i prodotti dalla API.", "danger");
    console.error(error);
  }
}

async function saveProduct(event) {
  event.preventDefault();

  if (!API_CONFIG.token) {
    showBackofficeAlert("Inserisci il token in config.js per salvare i prodotti.", "warning");
    return;
  }

  const payload = {
    name: nameInput.value.trim(),
    description: descriptionInput.value.trim(),
    brand: brandInput.value.trim(),
    imageUrl: imageUrlInput.value.trim(),
    price: Number(priceInput.value),
  };

  const isEditing = Boolean(productIdInput.value);
  const url = isEditing ? `${API_CONFIG.baseUrl}${productIdInput.value}` : API_CONFIG.baseUrl;
  const method = isEditing ? "PUT" : "POST";

  try {
    const response = await fetch(url, {
      method,
      headers: getAuthHeaders(true),
      body: JSON.stringify(payload),
    });

    if (!response.ok) {
      throw new Error(`Errore salvataggio: ${response.status}`);
    }

    resetForm();
    await fetchProducts();
    showBackofficeAlert(
      isEditing ? "Prodotto aggiornato correttamente." : "Prodotto creato correttamente.",
      "success"
    );
  } catch (error) {
    showBackofficeAlert("Non sono riuscito a salvare il prodotto. Controlla i campi.", "danger");
    console.error(error);
  }
}

async function deleteProduct(productId) {
  if (!API_CONFIG.token) {
    showBackofficeAlert("Inserisci il token in config.js per eliminare i prodotti.", "warning");
    return;
  }

  const confirmed = window.confirm("Vuoi davvero eliminare questo prodotto?");
  if (!confirmed) return;

  try {
    const response = await fetch(`${API_CONFIG.baseUrl}${productId}`, {
      method: "DELETE",
      headers: getAuthHeaders(),
    });

    if (!response.ok) {
      throw new Error(`Errore eliminazione: ${response.status}`);
    }

    await fetchProducts();
    showBackofficeAlert("Prodotto eliminato correttamente.", "success");
  } catch (error) {
    showBackofficeAlert("Non sono riuscito a eliminare il prodotto.", "danger");
    console.error(error);
  }
}

productsTableBody.addEventListener("click", (event) => {
  const button = event.target.closest("button");
  if (!button) return;

  const product = products.find((item) => item._id === button.dataset.id);
  if (!product) return;

  if (button.dataset.action === "edit") fillForm(product);
  if (button.dataset.action === "delete") deleteProduct(product._id);
});

function preloadEditFromUrl() {
  const params = new URLSearchParams(window.location.search);
  const idToEdit = params.get("id");
  if (!idToEdit) return;

  const product = products.find((item) => item._id === idToEdit);
  if (product) {
    fillForm(product);
    showBackofficeAlert(
      `Stai modificando il prodotto "${product.name}". Cambia i campi e premi Aggiorna.`,
      "info"
    );
  }
}

productForm.addEventListener("submit", saveProduct);
resetBtn.addEventListener("click", handleResetClick);
refreshBtn.addEventListener("click", fetchProducts);

presetButtons.addEventListener("click", (event) => {
  const button = event.target.closest("button[data-preset]");
  if (!button) return;

  const preset = productPresets[button.dataset.preset];
  if (!preset) return;

  fillFormFromPreset(preset);
});

fetchProducts();
