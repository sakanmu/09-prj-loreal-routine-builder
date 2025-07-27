const categoryFilter = document.getElementById("categoryFilter");
const productsContainer = document.getElementById("productsContainer");
const chatForm = document.getElementById("chatForm");
const chatWindow = document.getElementById("chatWindow");
const selectedProductsList = document.getElementById("selectedProductsList");
const generateRoutineBtn = document.getElementById("generateRoutine");
const clearBtn = document.getElementById("clearSelections");


let allProducts = [];
let selectedProducts = loadSelectedProducts();

/* Initial placeholder */
productsContainer.innerHTML = `
  <div class="placeholder-message">Select a category to view products</div>
`;

/* Load product data */
async function loadProducts() {
  const response = await fetch("products.json");
  const data = await response.json();
  allProducts = data.products;
  return allProducts;
}

/* Display products in grid */
function displayProducts(products) {
  productsContainer.innerHTML = "";

  products.forEach((product) => {
    const isSelected = selectedProducts.some((p) => p.id === product.id);

    const card = document.createElement("div");
    card.className = "product-card";
    if (isSelected) card.classList.add("selected");

    card.innerHTML = `
      <div class="image-wrapper">
        <img src="${product.image}" alt="${product.name}">
        <div class="overlay">
          <strong>${product.name}</strong><br>
          Brand: ${product.brand}<br>
          <div class="description">${product.description}</div>
        </div>
      </div>
      <div class="product-info">
        <h3>${product.name}</h3>
        <p>${product.brand}</p>
      </div>
    `;

    // Toggle product selection on card click
    card.addEventListener("click", () => {
      toggleProductSelection(product);
      displayProducts(products);
      renderSelectedProducts();
      saveSelectedProducts();
    });

    productsContainer.appendChild(card);
  });
}

/* Toggle select/unselect product */
function toggleProductSelection(product) {
  const index = selectedProducts.findIndex((p) => p.id === product.id);
  if (index > -1) {
    selectedProducts.splice(index, 1);
  } else {
    selectedProducts.push(product);
  }
}

/* Render selected product list */
function renderSelectedProducts() {
  selectedProductsList.innerHTML = "";

  if (selectedProducts.length === 0) {
    selectedProductsList.innerHTML = "<p>No products selected.</p>";
    return;
  }

  selectedProducts.forEach((product) => {
    const item = document.createElement("div");
    item.className = "selected-product";
    item.innerHTML = `
      <span>${product.name}</span>
      <button aria-label="Remove" data-id="${product.id}">&times;</button>
    `;

    item.querySelector("button").addEventListener("click", () => {
      selectedProducts = selectedProducts.filter((p) => p.id !== product.id);
      displayProducts(allProducts.filter((p) => p.category === categoryFilter.value));
      renderSelectedProducts();
      saveSelectedProducts();
    });

    selectedProductsList.appendChild(item);
      // Show clear button if any products selected
  clearBtn.style.display = selectedProducts.length > 0 ? "inline-block" : "none";
  });
}

/* Save to localStorage */
function saveSelectedProducts() {
  localStorage.setItem("selectedProducts", JSON.stringify(selectedProducts));
}

/* Load from localStorage */
function loadSelectedProducts() {
  const data = localStorage.getItem("selectedProducts");
  return data ? JSON.parse(data) : [];
}

/* Category filter logic */
categoryFilter.addEventListener("change", async (e) => {
  const products = await loadProducts();
  const selectedCategory = e.target.value;
  const filtered = products.filter((p) => p.category === selectedCategory);
  displayProducts(filtered);
});

/* Placeholder chat handler */
const userInput = document.getElementById("userInput");
const WORKER_URL = "https://loreal-chatbot-proxy.sfa60.workers.dev";

// Initial system prompt
const systemPrompt = {
  role: "system",
  content: "You are a helpful assistant trained to answer questions only about L’Oréal skincare, haircare, makeup, and fragrance products, and to provide beauty-related recommendations and routines. If the user asks about anything unrelated, politely say you can only assist with beauty topics."
};

// Full conversation history
const conversationHistory = [systemPrompt];

// Handle chat submit
chatForm.addEventListener("submit", async (e) => {
  e.preventDefault();
  const userMessage = userInput.value.trim();
  if (!userMessage) return;

  // Display user message
  conversationHistory.push({ role: "user", content: userMessage });
  chatWindow.innerHTML += `<div><strong>You:</strong> ${userMessage}</div>`;
  userInput.value = "";

  // Show loading message
  chatWindow.innerHTML += `<div><em>Bot is typing...</em></div>`;
  chatWindow.scrollTop = chatWindow.scrollHeight;

  try {
    const response = await fetch(WORKER_URL, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ messages: conversationHistory })
    });

    const data = await response.json();
    const assistantReply = data.choices[0].message.content;

    conversationHistory.push({ role: "assistant", content: assistantReply });

    // Remove loading message and show reply
    chatWindow.innerHTML = chatWindow.innerHTML.replace(`<div><em>Bot is typing...</em></div>`, "");
    chatWindow.innerHTML += `<div><strong>Bot:</strong> ${assistantReply}</div>`;
    chatWindow.scrollTop = chatWindow.scrollHeight;
  } catch (error) {
    chatWindow.innerHTML += `<div style="color: red;"><strong>Error:</strong> ${error.message}</div>`;
  }
});

generateRoutineBtn.addEventListener("click", async () => {
  if (selectedProducts.length === 0) {
    chatWindow.innerHTML += `<div><em>No products selected. Please choose products to generate a routine.</em></div>`;
    return;
  }

  const productNames = selectedProducts.map(p => `${p.name} (${p.brand})`).join(", ");
  const routinePrompt = `Generate a personalized skincare, haircare, or beauty routine using the following L’Oréal products: ${productNames}`;

  // Display user message
  conversationHistory.push({ role: "user", content: routinePrompt });
  chatWindow.innerHTML += `<div><strong>You:</strong> ${routinePrompt}</div>`;
  chatWindow.innerHTML += `<div><em>Bot is typing...</em></div>`;
  chatWindow.scrollTop = chatWindow.scrollHeight;

  try {
    const response = await fetch(WORKER_URL, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ messages: conversationHistory })
    });

    const data = await response.json();
    const assistantReply = data.choices[0].message.content;

    conversationHistory.push({ role: "assistant", content: assistantReply });

    chatWindow.innerHTML = chatWindow.innerHTML.replace(`<div><em>Bot is typing...</em></div>`, "");
    chatWindow.innerHTML += `<div><strong>Bot:</strong> ${assistantReply}</div>`;
    chatWindow.scrollTop = chatWindow.scrollHeight;
  } catch (error) {
    chatWindow.innerHTML += `<div style="color: red;"><strong>Error:</strong> ${error.message}</div>`;
  }
});

/* Initial selected list render */
renderSelectedProducts();

clearBtn.addEventListener("click", () => {
  selectedProducts = [];
  localStorage.removeItem("selectedProducts");
  displayProducts(allProducts.filter((p) => p.category === categoryFilter.value));
  renderSelectedProducts();
});
