const detailLoader = document.getElementById("detail-loader");
const detailContent = document.getElementById("detail-content");
const detailAlert = document.getElementById("detail-alert");

const FALLBACK_IMAGE = "https://placehold.co/800x600?text=Immagine+non+disponibile";

function formatPrice(value) {
  return new Intl.NumberFormat("it-IT", {
    style: "currency",
    currency: "EUR",
  }).format(value);
}

function formatDate(value) {
  if (!value) return "-";
  try {
    return new Intl.DateTimeFormat("it-IT", {
      dateStyle: "long",
      timeStyle: "short",
    }).format(new Date(value));
  } catch (error) {
    return value;
  }
}

function showAlert(message, type = "warning") {
  detailAlert.innerHTML = `
    <div class="alert alert-${type} alert-dismissible fade show" role="alert">
      ${message}
      <button type="button" class="btn-close" data-bs-dismiss="alert" aria-label="Chiudi"></button>
    </div>
  `;
}

function describeHttpError(status) {
  if (status === 401) return { type: "warning", message: "Token mancante o scaduto. Aggiorna la chiave API in config.js." };
  if (status === 403) return { type: "danger", message: "Accesso negato: non hai i permessi per questa risorsa." };
  if (status === 404) return { type: "warning", message: "Prodotto non trovato. Potrebbe essere stato eliminato." };
  if (status >= 500) return { type: "danger", message: `Errore del server (${status}). Riprova piu tardi.` };
  return { type: "danger", message: `Errore imprevisto (${status}).` };
}

function renderProduct(product) {
  detailContent.classList.remove("d-none");
  detailContent.innerHTML = `
    <div class="row g-5 align-items-start">
      <div class="col-lg-6">
        <img
          src="${product.imageUrl}"
          alt="${product.name}"
          class="img-fluid rounded-4 shadow-sm"
          onerror="this.onerror=null;this.src='${FALLBACK_IMAGE}';"
        />
      </div>
      <div class="col-lg-6">
        <span class="eyebrow">${product.brand || "Collezione"}</span>
        <h1 class="display-5 fw-bold mt-3">${product.name}</h1>
        <p class="price-tag fs-3 my-3">${formatPrice(product.price)}</p>
        <p class="lead text-secondary">${product.description}</p>

        <div class="hero-card mt-4">
          <h2 class="h5 mb-3">Informazioni tecniche</h2>
          <dl class="row mb-0">
            <dt class="col-sm-4 text-secondary">ID prodotto</dt>
            <dd class="col-sm-8"><code>${product._id || "-"}</code></dd>

            <dt class="col-sm-4 text-secondary">Brand</dt>
            <dd class="col-sm-8">${product.brand || "-"}</dd>

            <dt class="col-sm-4 text-secondary">Creato il</dt>
            <dd class="col-sm-8">${formatDate(product.createdAt)}</dd>

            <dt class="col-sm-4 text-secondary">Aggiornato il</dt>
            <dd class="col-sm-8">${formatDate(product.updatedAt)}</dd>
          </dl>
        </div>

        <div class="d-flex flex-wrap gap-2 mt-4">
          <a href="./index.html" class="btn btn-outline-dark rounded-pill px-4">Torna allo shop</a>
          <a
            href="./backoffice.html?id=${encodeURIComponent(product._id)}"
            class="btn btn-dark rounded-pill px-4"
          >Modifica nel backoffice</a>
        </div>
      </div>
    </div>
  `;
}

function showEmptyState(message) {
  detailContent.classList.remove("d-none");
  detailContent.innerHTML = `
    <div class="empty-state text-center p-5">
      <h1 class="h3 mb-3">Nessun prodotto da mostrare</h1>
      <p class="text-secondary mb-4">${message}</p>
      <a href="./index.html" class="btn btn-dark rounded-pill px-4">Torna allo shop</a>
    </div>
  `;
}

async function loadProduct() {
  const params = new URLSearchParams(window.location.search);
  const productId = params.get("id");

  if (!productId) {
    detailLoader.classList.add("d-none");
    showEmptyState("ID prodotto non specificato nell'URL.");
    return;
  }

  if (!API_CONFIG.token) {
    detailLoader.classList.add("d-none");
    showEmptyState("Imposta il token in config.js per poter leggere i dettagli.");
    showAlert("Token API mancante: imposta una chiave valida in config.js.", "warning");
    return;
  }

  try {
    const response = await fetch(`${API_CONFIG.baseUrl}${productId}`, {
      headers: getAuthHeaders(),
    });

    if (!response.ok) {
      const info = describeHttpError(response.status);
      showAlert(info.message, info.type);
      showEmptyState("Non e stato possibile caricare il prodotto richiesto.");
      return;
    }

    const product = await response.json();
    renderProduct(product);
  } catch (error) {
    console.error(error);
    showAlert(
      "Impossibile raggiungere la API. Controlla la connessione internet.",
      "danger"
    );
    showEmptyState("Errore di rete durante il caricamento del prodotto.");
  } finally {
    detailLoader.classList.add("d-none");
  }
}

loadProduct();
