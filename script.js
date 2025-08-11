// Global Variables
let cart = [];
let products = [];
let stripe = null;
let paypal = null;

// Initialize Stripe (you'll need to replace with your actual Stripe publishable key)
const STRIPE_PUBLISHABLE_KEY = "pk_test_your_stripe_key_here";

// Product Data
const productsData = [
  {
    id: 1,
    name: "עגלת שולחן קמפינג",
    price: 399,
    image: "images/image_9.jpeg",
    description: "עגלת שולחן מתקפלת איכותית לקמפינג",
    category: "ריהוט",
  },
  {
    id: 2,
    name: "כיסא קמפינג",
    price: 299,
    image: "images/image_16.jpeg",
    description: "כיסא נוח וקל משקל לקמפינג",
    category: "ריהוט",
  },
  {
    id: 3,
    name: "אוהל קמפינג",
    price: 899,
    image: "images/image_1.jpeg",
    description: "אוהל 4 אנשים עם הגנה מפני גשם",
    category: "אוהלים",
  },
  {
    id: 4,
    name: "שק שינה",
    price: 199,
    image: "images/image_2.jpeg",
    description: "שק שינה חם ונוח לטמפרטורות נמוכות",
    category: "שינה",
  },
  {
    id: 5,
    name: "תרמוס קפה",
    price: 149,
    image: "images/image_3.jpeg",
    description: "תרמוס לשמירה על חום הקפה",
    category: "בישול",
  },
  {
    id: 6,
    name: "פנס קמפינג",
    price: 89,
    image: "images/image_5.jpeg",
    description: "פנס LED חזק עם סוללה נטענת",
    category: "תאורה",
  },
];

// DOM Elements
const elements = {
  productsGrid: document.getElementById("products-grid"),
  cartSidebar: document.getElementById("cart-sidebar"),
  cartItems: document.getElementById("cart-items"),
  cartTotal: document.getElementById("cart-total"),
  cartCount: document.getElementById("cart-count"),
  cartToggle: document.getElementById("cart-toggle"),
  closeCart: document.getElementById("close-cart"),
  checkoutBtn: document.getElementById("checkout-btn"),
  paymentModal: document.getElementById("payment-modal"),
  closeModal: document.getElementById("close-modal"),
  overlay: document.getElementById("overlay"),
  loadingSpinner: document.getElementById("loading-spinner"),
  successModal: document.getElementById("success-modal"),
  creditCardForm: document.getElementById("credit-card-form"),
  paypalForm: document.getElementById("paypal-form"),
  payBtn: document.getElementById("pay-btn"),
};

// Initialize the application
document.addEventListener("DOMContentLoaded", function () {
  initializeApp();
});

function initializeApp() {
  loadProducts();
  setupEventListeners();
  loadCartFromStorage();
  updateCartDisplay();

  // Initialize Stripe
  if (typeof Stripe !== "undefined") {
    stripe = Stripe(STRIPE_PUBLISHABLE_KEY);
  }

  // Initialize PayPal
  if (typeof paypal !== "undefined") {
    initializePayPal();
  }
}

function loadProducts() {
  products = productsData;
  renderProducts();
}

function renderProducts() {
  elements.productsGrid.innerHTML = "";

  products.forEach((product) => {
    const productCard = createProductCard(product);
    elements.productsGrid.appendChild(productCard);
  });
}

function createProductCard(product) {
  const card = document.createElement("div");
  card.className = "product-card";
  card.innerHTML = `
    <img src="${product.image}" alt="${product.name}" class="product-image" loading="lazy">
    <div class="product-info">
      <h3 class="product-title">${product.name}</h3>
      <p class="product-description">${product.description}</p>
      <div class="product-price">${product.price} ש״ח</div>
      <button class="add-to-cart-btn" onclick="addToCart(${product.id})">
        <i class="fas fa-shopping-cart"></i>
        הוסף לעגלה
      </button>
    </div>
  `;
  return card;
}

function setupEventListeners() {
  // Cart toggle
  elements.cartToggle.addEventListener("click", toggleCart);
  elements.closeCart.addEventListener("click", closeCart);

  // Payment methods
  document.querySelectorAll('input[name="payment"]').forEach((radio) => {
    radio.addEventListener("change", handlePaymentMethodChange);
  });

  // Checkout
  elements.checkoutBtn.addEventListener("click", openPaymentModal);
  elements.closeModal.addEventListener("click", closePaymentModal);
  elements.overlay.addEventListener("click", closePaymentModal);

  // Credit card form
  elements.payBtn.addEventListener("click", handleCreditCardPayment);

  // Form inputs
  setupFormValidation();

  // Close cart when clicking outside
  document.addEventListener("click", (e) => {
    if (
      !elements.cartSidebar.contains(e.target) &&
      !elements.cartToggle.contains(e.target) &&
      elements.cartSidebar.classList.contains("open")
    ) {
      closeCart();
    }
  });

  // Mobile-specific improvements
  setupMobileOptimizations();
}

function setupFormValidation() {
  // Card number formatting
  const cardNumber = document.getElementById("card-number");
  cardNumber.addEventListener("input", (e) => {
    let value = e.target.value.replace(/\s/g, "");
    value = value.replace(/\D/g, "");
    value = value.replace(/(\d{4})/g, "$1 ").trim();
    e.target.value = value;
  });

  // Expiry date formatting
  const expiry = document.getElementById("expiry");
  expiry.addEventListener("input", (e) => {
    let value = e.target.value.replace(/\D/g, "");
    if (value.length >= 2) {
      value = value.slice(0, 2) + "/" + value.slice(2, 4);
    }
    e.target.value = value;
  });

  // CVV validation
  const cvv = document.getElementById("cvv");
  cvv.addEventListener("input", (e) => {
    e.target.value = e.target.value.replace(/\D/g, "");
  });
}

function setupMobileOptimizations() {
  // Prevent zoom on input focus (iOS)
  const inputs = document.querySelectorAll("input, textarea, select");
  inputs.forEach((input) => {
    input.addEventListener("focus", () => {
      if (window.innerWidth <= 768) {
        setTimeout(() => {
          input.scrollIntoView({ behavior: "smooth", block: "center" });
        }, 300);
      }
    });
  });

  // Handle viewport height issues on mobile
  function setViewportHeight() {
    const vh = window.innerHeight * 0.01;
    document.documentElement.style.setProperty("--vh", `${vh}px`);
  }

  setViewportHeight();
  window.addEventListener("resize", setViewportHeight);
  window.addEventListener("orientationchange", setViewportHeight);

  // Prevent body scroll when modal is open
  function preventBodyScroll() {
    document.body.style.overflow = "hidden";
    document.body.style.position = "fixed";
    document.body.style.width = "100%";
  }

  function allowBodyScroll() {
    document.body.style.overflow = "";
    document.body.style.position = "";
    document.body.style.width = "";
  }

  // Apply to payment modal
  const originalOpenPaymentModal = openPaymentModal;
  const originalClosePaymentModal = closePaymentModal;

  openPaymentModal = function () {
    originalOpenPaymentModal();
    if (window.innerWidth <= 768) {
      preventBodyScroll();
    }
  };

  closePaymentModal = function () {
    originalClosePaymentModal();
    if (window.innerWidth <= 768) {
      allowBodyScroll();
    }
  };

  // Handle swipe gestures for cart sidebar
  let startX = 0;
  let currentX = 0;

  document.addEventListener("touchstart", (e) => {
    startX = e.touches[0].clientX;
  });

  document.addEventListener("touchmove", (e) => {
    currentX = e.touches[0].clientX;
  });

  document.addEventListener("touchend", (e) => {
    const diffX = startX - currentX;
    const threshold = 50;

    // Swipe right to open cart
    if (diffX < -threshold && startX < 50) {
      if (!elements.cartSidebar.classList.contains("open")) {
        toggleCart();
      }
    }

    // Swipe left to close cart
    if (diffX > threshold && elements.cartSidebar.classList.contains("open")) {
      closeCart();
    }
  });
}

function addToCart(productId) {
  const product = products.find((p) => p.id === productId);
  if (!product) return;

  const existingItem = cart.find((item) => item.id === productId);

  if (existingItem) {
    existingItem.quantity += 1;
  } else {
    cart.push({
      id: product.id,
      name: product.name,
      price: product.price,
      image: product.image,
      quantity: 1,
    });
  }

  saveCartToStorage();
  updateCartDisplay();
  showNotification("המוצר נוסף לעגלה בהצלחה!");
}

function removeFromCart(productId) {
  cart = cart.filter((item) => item.id !== productId);
  saveCartToStorage();
  updateCartDisplay();
  showNotification("המוצר הוסר מהעגלה");
}

function updateQuantity(productId, newQuantity) {
  const item = cart.find((item) => item.id === productId);
  if (item) {
    if (newQuantity <= 0) {
      removeFromCart(productId);
    } else {
      item.quantity = newQuantity;
      saveCartToStorage();
      updateCartDisplay();
    }
  }
}

function updateCartDisplay() {
  // Update cart items
  elements.cartItems.innerHTML = "";

  if (cart.length === 0) {
    elements.cartItems.innerHTML =
      '<p style="text-align: center; color: #666; padding: 2rem;">העגלה ריקה</p>';
  } else {
    cart.forEach((item) => {
      const cartItem = createCartItemElement(item);
      elements.cartItems.appendChild(cartItem);
    });
  }

  // Update cart count
  const totalItems = cart.reduce((sum, item) => sum + item.quantity, 0);
  elements.cartCount.textContent = totalItems;

  // Update total
  const total = cart.reduce((sum, item) => sum + item.price * item.quantity, 0);
  elements.cartTotal.textContent = `${total} ש״ח`;

  // Enable/disable checkout button
  elements.checkoutBtn.disabled = cart.length === 0;
}

function createCartItemElement(item) {
  const cartItem = document.createElement("div");
  cartItem.className = "cart-item";
  cartItem.innerHTML = `
    <img src="${item.image}" alt="${item.name}">
    <div class="cart-item-info">
      <div class="cart-item-title">${item.name}</div>
      <div class="cart-item-price">${item.price} ש״ח</div>
      <div class="cart-item-quantity">
        <button onclick="updateQuantity(${item.id}, ${
    item.quantity - 1
  })">-</button>
        <span>${item.quantity}</span>
        <button onclick="updateQuantity(${item.id}, ${
    item.quantity + 1
  })">+</button>
      </div>
    </div>
    <button class="remove-item" onclick="removeFromCart(${item.id})">
      <i class="fas fa-trash"></i>
    </button>
  `;
  return cartItem;
}

function toggleCart() {
  elements.cartSidebar.classList.toggle("open");
  elements.overlay.classList.toggle("open");
}

function closeCart() {
  elements.cartSidebar.classList.remove("open");
  elements.overlay.classList.remove("open");
}

function openPaymentModal() {
  elements.paymentModal.classList.add("open");
  elements.overlay.classList.add("open");
}

function closePaymentModal() {
  elements.paymentModal.classList.remove("open");
  elements.overlay.classList.remove("open");
}

function handlePaymentMethodChange(e) {
  const method = e.target.value;

  if (method === "credit-card") {
    elements.creditCardForm.style.display = "block";
    elements.paypalForm.style.display = "none";
  } else if (method === "paypal") {
    elements.creditCardForm.style.display = "none";
    elements.paypalForm.style.display = "block";
    initializePayPal();
  }
}

function handleCreditCardPayment() {
  const formData = getFormData();

  if (!validateForm(formData)) {
    return;
  }

  showLoading();

  // Simulate payment processing
  setTimeout(() => {
    hideLoading();
    showSuccess();
  }, 2000);
}

function getFormData() {
  return {
    cardNumber: document.getElementById("card-number").value,
    expiry: document.getElementById("expiry").value,
    cvv: document.getElementById("cvv").value,
    cardName: document.getElementById("card-name").value,
    email: document.getElementById("email").value,
  };
}

function validateForm(data) {
  const errors = [];

  if (!data.cardNumber.replace(/\s/g, "").match(/^\d{16}$/)) {
    errors.push("מספר כרטיס לא תקין");
  }

  if (!data.expiry.match(/^\d{2}\/\d{2}$/)) {
    errors.push("תוקף כרטיס לא תקין");
  }

  if (!data.cvv.match(/^\d{3,4}$/)) {
    errors.push("CVV לא תקין");
  }

  if (!data.cardName.trim()) {
    errors.push("שם בעל הכרטיס הוא שדה חובה");
  }

  if (!data.email.match(/^[^\s@]+@[^\s@]+\.[^\s@]+$/)) {
    errors.push("כתובת אימייל לא תקינה");
  }

  if (errors.length > 0) {
    showNotification(errors.join("\n"), "error");
    return false;
  }

  return true;
}

function initializePayPal() {
  if (typeof paypal === "undefined") return;

  const total = cart.reduce((sum, item) => sum + item.price * item.quantity, 0);

  paypal
    .Buttons({
      createOrder: function (data, actions) {
        return actions.order.create({
          purchase_units: [
            {
              amount: {
                value: (total / 3.6).toFixed(2), // Convert ILS to USD
              },
            },
          ],
        });
      },
      onApprove: function (data, actions) {
        showLoading();
        return actions.order.capture().then(function (details) {
          hideLoading();
          showSuccess();
        });
      },
    })
    .render("#paypal-button-container");
}

function showLoading() {
  elements.loadingSpinner.classList.add("show");
}

function hideLoading() {
  elements.loadingSpinner.classList.remove("show");
}

function showSuccess() {
  closePaymentModal();
  closeCart();
  elements.successModal.classList.add("show");

  // Clear cart
  cart = [];
  saveCartToStorage();
  updateCartDisplay();
}

function showNotification(message, type = "success") {
  const notification = document.createElement("div");
  notification.className = `notification ${type}`;
  notification.textContent = message;

  // Add styles
  notification.style.cssText = `
    position: fixed;
    top: 20px;
    left: 20px;
    background: ${type === "error" ? "#e74c3c" : "#27ae60"};
    color: white;
    padding: 1rem 2rem;
    border-radius: 8px;
    z-index: 10000;
    animation: slideInRight 0.3s ease;
  `;

  document.body.appendChild(notification);

  setTimeout(() => {
    notification.remove();
  }, 3000);
}

function saveCartToStorage() {
  localStorage.setItem("camping-cart", JSON.stringify(cart));
}

function loadCartFromStorage() {
  const savedCart = localStorage.getItem("camping-cart");
  if (savedCart) {
    cart = JSON.parse(savedCart);
  }
}

// Add CSS animation for notifications
const style = document.createElement("style");
style.textContent = `
  @keyframes slideInRight {
    from {
      transform: translateX(-100%);
      opacity: 0;
    }
    to {
      transform: translateX(0);
      opacity: 1;
    }
  }
`;
document.head.appendChild(style);

// Close success modal
document.addEventListener("click", (e) => {
  if (e.target.classList.contains("success-modal")) {
    elements.successModal.classList.remove("show");
  }
});
