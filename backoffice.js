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
      "https://pplx-res.cloudinary.com/image/upload/pplx_search_images/1ff95d799d158182474e01b4abd2ef443014205c.jpg",
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
      "https://pplx-res.cloudinary.com/image/upload/pplx_search_images/42fa9bfdf197f94c7e28374460c45354db48aaaf.jpg",
  },
  kayak: {
    name: "Kayak gonfiabile estivo",
    description: "Kayak pratico e versatile per lago e mare, pensato per il tempo libero all'aperto.",
    brand: "Mare",
    price: 149.99,
    imageUrl:
      "https://pplx-res.cloudinary.com/image/upload/pplx_search_images/e603b02109ce473fba5ca975999a04b1033ef4eb.jpg",
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

function describeHttpError(status, context) {
  if (status === 400)
    return {
      type: "warning",
      message: `Dati non validi: controlla di aver compilato correttamente tutti i campi (${context}).`,
    };
  if (status === 401)
    return {
      type: "warning",
      message: "Token API mancante o scaduto. Aggiorna la chiave in config.js.",
    };
  if (status === 403)
    return {
      type: "danger",
      message: "Accesso negato: il tuo token non ha i permessi necessari.",
    };
  if (status === 404)
    return {
      type: "warning",
      message: `Prodotto non trovato (${context}). Potrebbe essere stato gia eliminato.`,
    };
  if (status === 409)
    return {
      type: "warning",
      message: "Conflitto: esiste gia una risorsa con questi dati.",
    };
  if (status === 429)
    return {
      type: "warning",
      message: "Troppe richieste in poco tempo. Attendi qualche secondo.",
    };
  if (status >= 500)
    return {
      type: "danger",
      message: `Errore del server Strive (${status}). Riprova piu tardi.`,
    };
  return {
    type: "danger",
    message: `Errore inatteso (${status}) durante l'operazione ${context}.`,
  };
}

function handleNetworkError(error, context) {
  console.error(context, error);
  if (error instanceof TypeError) {
    showBackofficeAlert(
      `Impossibile raggiungere la API (${context}). Controlla la connessione internet.`,
      "danger"
    );
  } else {
    showBackofficeAlert(`Errore inatteso durante l'operazione ${context}.`, "danger");
  }
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
      const info = describeHttpError(response.status, "lettura catalogo");
      products = [];
      renderTable();
      showBackofficeAlert(info.message, info.type);
      return;
    }

    products = await response.json();
    renderTable();
    preloadEditFromUrl();
  } catch (error) {
    products = [];
    renderTable();
    handleNetworkError(error, "lettura catalogo");
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
      const info = describeHttpError(
        response.status,
        isEditing ? "aggiornamento prodotto" : "creazione prodotto"
      );
      showBackofficeAlert(info.message, info.type);
      return;
    }

    resetForm();
    await fetchProducts();
    showBackofficeAlert(
      isEditing ? "Prodotto aggiornato correttamente." : "Prodotto creato correttamente.",
      "success"
    );
  } catch (error) {
    handleNetworkError(error, isEditing ? "aggiornamento prodotto" : "creazione prodotto");
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
      const info = describeHttpError(response.status, "eliminazione prodotto");
      showBackofficeAlert(info.message, info.type);
      return;
    }

    await fetchProducts();
    showBackofficeAlert("Prodotto eliminato correttamente.", "success");
  } catch (error) {
    handleNetworkError(error, "eliminazione prodotto");
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
