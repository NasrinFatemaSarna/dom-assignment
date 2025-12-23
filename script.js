/* =========================
   TheMealDB API Endpoints
   ========================= */

/* ======================
   DOM Elements
   ====================== */
const menuItems = document.getElementById("menuItems");
const apiStatus = document.getElementById("apiStatus");

const mainSearchInput = document.getElementById("mainSearchInput");
const mainSearchBtn = document.getElementById("mainSearchBtn");
const searchForm = document.getElementById("searchForm"); // ✅ added

const asideSearchInput = document.getElementById("asideSearchInput");

const recipeModal = document.getElementById("recipeModal");
const modalClose = document.getElementById("modalClose");
const modalBody = document.getElementById("modalBody");

const mobileMenu = document.getElementById("mobileMenu");
const sideCart = document.getElementById("sideCart");
const sideSearch = document.getElementById("sideSearch");

const openMenuBtn = document.getElementById("openMenuBtn");
const openCartBtn = document.getElementById("openCartBtn");
const openSearchBtn = document.getElementById("openSearchBtn");

const closeMenuBtn = document.getElementById("closeMenuBtn");
const closeCartBtn = document.getElementById("closeCartBtn");
const closeSearchBtn = document.getElementById("closeSearchBtn");

const cartList = document.getElementById("cartList");
const cartTotal = document.getElementById("cartTotal");
const clearCartBtn = document.getElementById("clearCartBtn");

/* ======================
   State
   ====================== */
let cart = JSON.parse(localStorage.getItem("cart")) || [];
let typingTimer = null;

/* ======================
   Helpers
   ====================== */
function money(n) {
  const num = Number(n) || 0;
  return num.toFixed(2);
}

function closeAllAsides() {
  mobileMenu.classList.remove("active");
  sideCart.classList.remove("active");
  sideSearch.classList.remove("active");
}

function openAside(el) {
  closeAllAsides();
  el.classList.add("active");
}

/* ✅ No data found UI */
function showNoData(message = "No data found") {
  menuItems.innerHTML = `
    <div class="no-data">
      <h2>${message}</h2>
      <p>Try another keyword like: egg, chicken, fish, rice, pasta</p>
    </div>
  `;
}

/* ✅ Loading UI */
function showLoading(text = "Loading...") {
  menuItems.innerHTML = `
    <div class="no-data">
      <h2>${text}</h2>
    </div>
  `;
}

/* ======================
   API Functions
   ====================== */
async function fetchMealsByName(foodName) {
  const url = `https://www.themealdb.com/api/json/v1/1/search.php?s=${encodeURIComponent(foodName)}`;
  const res = await fetch(url);
  if (!res.ok) throw new Error("API Error");
  return res.json();
}

async function fetchMealById(id) {
  const url = `https://www.themealdb.com/api/json/v1/1/lookup.php?i=${encodeURIComponent(id)}`;
  const res = await fetch(url);
  if (!res.ok) throw new Error("API Error");
  return res.json();
}

async function fetchMealsByIngredient(ingredient) {
  const url = `https://www.themealdb.com/api/json/v1/1/filter.php?i=${encodeURIComponent(ingredient)}`;
  const res = await fetch(url);
  if (!res.ok) throw new Error("API Error");
  return res.json();
}

/* ======================
   Render Meals
   ====================== */
function renderMeals(meals, sourceLabel = "meals") {
  menuItems.innerHTML = "";

  if (!meals || meals.length === 0) {
    apiStatus.textContent = "No meals found.";
    showNoData("No data found");
    return;
  }

  apiStatus.textContent = `Found ${meals.length} ${sourceLabel}. Click "Details" to view recipe.`;

  meals.slice(0, 12).forEach((meal) => {
    const card = document.createElement("div");

    const thumb = meal.strMealThumb;
    const title = meal.strMeal;
    const price = (Math.random() * 12 + 4).toFixed(2);

    const subtitle =
      meal.strCategory || meal.strArea
        ? `${meal.strCategory || "Recipe"} • ${meal.strArea || "Cuisine"}`
        : "Ingredient match • Click Details";

    card.className = "menu-item api";
    card.innerHTML = `
      <img src="${thumb}" alt="${title}" />
      <h2>${title}</h2>
      <p>${subtitle}</p>

      <div class="price">
        <h3>$${price}</h3>
        <button type="button" class="add-cart"
          data-id="${meal.idMeal}"
          data-title="${title}"
          data-price="${price}">
          Add <ion-icon name="cart"></ion-icon>
        </button>
      </div>

      <div class="card-actions">
        <button type="button" class="btn btn-ghost btn-details" data-id="${meal.idMeal}">
          Details
        </button>
      </div>
    `;
    menuItems.appendChild(card);
  });
}

/* ======================
   Recipe Modal
   ====================== */
function buildIngredientsList(meal) {
  const items = [];
  for (let i = 1; i <= 20; i++) {
    const ing = meal[`strIngredient${i}`];
    const meas = meal[`strMeasure${i}`];
    if (ing && ing.trim()) items.push(`${(meas || "").trim()} ${ing.trim()}`.trim());
  }
  return items;
}

async function openRecipeModal(id) {
  try {
    modalBody.innerHTML = `<p>Loading...</p>`;
    recipeModal.classList.add("show");
    recipeModal.setAttribute("aria-hidden", "false");

    const data = await fetchMealById(id);
    const meal = data.meals?.[0];

    if (!meal) {
      modalBody.innerHTML = `<p>Recipe not found.</p>`;
      return;
    }

    const ingredients = buildIngredientsList(meal);

    modalBody.innerHTML = `
      <div class="modal-body">
        <img src="${meal.strMealThumb}" alt="${meal.strMeal}" />
        <h2>${meal.strMeal}</h2>
        <p><strong>Category:</strong> ${meal.strCategory || "N/A"} | <strong>Area:</strong> ${meal.strArea || "N/A"}</p>

        <h3 style="margin-top:12px;">Ingredients</h3>
        <ul>${ingredients.map((x) => `<li>${x}</li>`).join("")}</ul>

        <h3>Instructions</h3>
        <p>${(meal.strInstructions || "").replace(/\n/g, "<br/>")}</p>

        ${
          meal.strYoutube
            ? `<p style="margin-top:12px;">
                <a class="btn btn-primary" href="${meal.strYoutube}" target="_blank" rel="noopener">
                  Watch on YouTube
                </a>
              </p>`
            : ""
        }
      </div>
    `;
  } catch (err) {
    modalBody.innerHTML = `<p>Something went wrong loading the recipe.</p>`;
    console.error(err);
  }
}

function closeModal() {
  recipeModal.classList.remove("show");
  recipeModal.setAttribute("aria-hidden", "true");
}

/* ======================
   CART
   ====================== */
function saveCart() {
  localStorage.setItem("cart", JSON.stringify(cart));
}

function addToCart({ id, title, price }) {
  const existing = cart.find((i) => i.id === id);
  if (existing) existing.qty += 1;
  else cart.push({ id, title, price: Number(price), qty: 1 });

  saveCart();
  renderCart();
}

function removeFromCart(id) {
  cart = cart.filter((i) => i.id !== id);
  saveCart();
  renderCart();
}

function changeQty(id, delta) {
  const item = cart.find((i) => i.id === id);
  if (!item) return;
  item.qty += delta;
  if (item.qty <= 0) return removeFromCart(id);
  saveCart();
  renderCart();
}

function clearCart() {
  cart = [];
  saveCart();
  renderCart();
}

function renderCart() {
  cartList.innerHTML = "";

  if (cart.length === 0) {
    cartList.innerHTML = `<li class="cart-item"><p>Your cart is empty.</p></li>`;
    cartTotal.textContent = money(0);
    return;
  }

  let total = 0;
  cart.forEach((item) => {
    total += item.price * item.qty;
    const li = document.createElement("li");
    li.className = "cart-item";
    li.innerHTML = `
      <h4>${item.title}</h4>
      <div class="row">
        <span>$${money(item.price)} x ${item.qty}</span>
        <span><strong>$${money(item.price * item.qty)}</strong></span>
      </div>
      <div class="row">
        <button type="button" data-action="minus" data-id="${item.id}">-</button>
        <button type="button" data-action="plus" data-id="${item.id}">+</button>
        <button type="button" data-action="remove" data-id="${item.id}">Remove</button>
      </div>
    `;
    cartList.appendChild(li);
  });

  cartTotal.textContent = money(total);
}

/* ======================
   SEARCH LOGIC
   ====================== */
async function smartSearch(query) {
  const q = query.trim();

  if (!q) {
    apiStatus.textContent = "Type a keyword (ex: egg, chicken, pasta...) to load recipes.";
    menuItems.innerHTML = "";
    return;
  }

  apiStatus.textContent = `Loading "${q}"...`;
  showLoading("Loading...");

  try {
    const byName = await fetchMealsByName(q);
    if (byName.meals && byName.meals.length > 0) {
      renderMeals(byName.meals, "meals (name match)");
      return;
    }

    const byIng = await fetchMealsByIngredient(q);
    if (byIng.meals && byIng.meals.length > 0) {
      renderMeals(byIng.meals, "meals (ingredient match)");
      return;
    }

    apiStatus.textContent = `No results for "${q}"`;
    showNoData(`No data found for "${q}"`);
  } catch (err) {
    apiStatus.textContent = "API error. Please try again.";
    showNoData("Error loading data");
    console.error(err);
  }
}

/* ✅ Debounce */
function debounceSearch(value, delay = 500) {
  clearTimeout(typingTimer);
  typingTimer = setTimeout(() => smartSearch(value), delay);
}

/* ======================
   EVENTS
   ====================== */

/* ✅ FIX: Form submit prevent (STOP jump to top) */
searchForm.addEventListener("submit", (e) => {
  e.preventDefault(); // ✅ main fix
  smartSearch(mainSearchInput.value);
});

/* ✅ Optional: Enter key extra safety */
mainSearchInput.addEventListener("keydown", (e) => {
  if (e.key === "Enter") e.preventDefault();
});

/* ✅ Typing auto search */
mainSearchInput.addEventListener("input", () => {
  debounceSearch(mainSearchInput.value, 500);
});

/* ✅ Aside typing auto search */
asideSearchInput.addEventListener("input", () => {
  debounceSearch(asideSearchInput.value, 500);
});

/* ✅ Aside Enter prevent */
asideSearchInput.addEventListener("keydown", (e) => {
  if (e.key === "Enter") e.preventDefault();
});

document.addEventListener("click", (e) => {
  const detailsBtn = e.target.closest(".btn-details");
  if (detailsBtn) return openRecipeModal(detailsBtn.dataset.id);

  const addBtn = e.target.closest(".add-cart");
  if (addBtn) {
    const id = addBtn.dataset.id || `static_${Math.random()}`;
    const title = addBtn.dataset.title || "Item";
    const price = addBtn.dataset.price || 0;
    addToCart({ id, title, price });
    openAside(sideCart);
  }
});

cartList.addEventListener("click", (e) => {
  const btn = e.target.closest("button");
  if (!btn) return;
  const id = btn.dataset.id;
  const action = btn.dataset.action;
  if (action === "minus") changeQty(id, -1);
  if (action === "plus") changeQty(id, 1);
  if (action === "remove") removeFromCart(id);
});

clearCartBtn.addEventListener("click", clearCart);

openMenuBtn.addEventListener("click", () => openAside(mobileMenu));
openCartBtn.addEventListener("click", () => openAside(sideCart));
openSearchBtn.addEventListener("click", () => openAside(sideSearch));

closeMenuBtn.addEventListener("click", () => mobileMenu.classList.remove("active"));
closeCartBtn.addEventListener("click", () => sideCart.classList.remove("active"));
closeSearchBtn.addEventListener("click", () => sideSearch.classList.remove("active"));

modalClose.addEventListener("click", closeModal);
recipeModal.addEventListener("click", (e) => {
  if (e.target === recipeModal) closeModal();
});

document.addEventListener("keydown", (e) => {
  if (e.key === "Escape") {
    closeModal();
    closeAllAsides();
  }
});

/* ======================
   INIT
   ====================== */
renderCart();
apiStatus.textContent = "Type a keyword (ex: egg, chicken, pasta...) to load recipes.";
/* ===== Back to Top ===== */
const backToTopBtn = document.getElementById("backToTop");

// scroll করলে button show/hide
window.addEventListener("scroll", () => {
  if (window.scrollY > 400) backToTopBtn.classList.add("show");
  else backToTopBtn.classList.remove("show");
});

// click করলে smoothly top এ যাবে
backToTopBtn.addEventListener("click", () => {
  window.scrollTo({ top: 0, behavior: "smooth" });
});
