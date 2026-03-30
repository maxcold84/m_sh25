(() => {
  var __defProp = Object.defineProperty;
  var __export = (target, all) => {
    for (var name in all)
      __defProp(target, name, { get: all[name], enumerable: true });
  };

  // ns-hugo-imp:C:\hugo\ex\shop\assets\js\core\pb-client.js
  var _instance = null;
  var getUrl = () => window.SiteConfig?.pocketbaseUrl || "http://127.0.0.1:8090";
  function getInstance() {
    if (!_instance) {
      _instance = new PocketBase(getUrl());
      console.log("[PBClient] PocketBase instance created:", getUrl());
    }
    return _instance;
  }
  var pb = getInstance();
  function isAdmin() {
    return pb.authStore.isValid && pb.authStore.isAdmin;
  }
  function getUser() {
    return pb.authStore.isValid ? pb.authStore.model : null;
  }
  function isAuthenticated() {
    return pb.authStore.isValid;
  }
  var PBClient = {
    getInstance,
    isAdmin,
    getUser,
    isAuthenticated
  };
  if (typeof window !== "undefined") {
    window.PBClient = PBClient;
  }

  // ns-hugo-imp:C:\hugo\ex\shop\assets\js\core\utils.js
  var utils_exports = {};
  __export(utils_exports, {
    debounce: () => debounce,
    default: () => utils_default,
    escapeHtml: () => escapeHtml,
    formatCurrency: () => formatCurrency,
    formatDate: () => formatDate,
    isKorean: () => isKorean,
    showMessage: () => showMessage,
    showToast: () => showToast,
    throttle: () => throttle
  });
  function escapeHtml(text) {
    if (!text) return "";
    return text.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;").replace(/"/g, "&quot;").replace(/'/g, "&#039;");
  }
  function formatCurrency(amount, forceCurrency = null) {
    let currency, locale;
    if (forceCurrency) {
      currency = forceCurrency;
      locale = forceCurrency === "KRW" ? "ko-KR" : "en-US";
    } else {
      const korean = isKorean();
      currency = korean ? "KRW" : "USD";
      locale = korean ? "ko-KR" : "en-US";
    }
    return new Intl.NumberFormat(locale, { style: "currency", currency }).format(amount);
  }
  function showToast(message, options = {}) {
    const { isError = false, duration = 3e3 } = options;
    let toast = document.getElementById("toast");
    if (!toast) {
      toast = document.createElement("div");
      toast.id = "toast";
      document.body.appendChild(toast);
    }
    const bgColor = isError ? "bg-red-600" : "bg-gray-800";
    toast.className = `fixed top-4 left-1/2 transform -translate-x-1/2 px-4 py-2 rounded-lg shadow-lg text-sm transition-opacity duration-300 pointer-events-none z-50 ${bgColor} text-white`;
    toast.textContent = message;
    toast.style.opacity = "1";
    setTimeout(() => {
      toast.style.opacity = "0";
    }, duration);
  }
  function showMessage(el, message, className = "") {
    if (el) {
      el.innerText = message;
      el.className = "mt-3 text-center " + className;
      el.style.display = "block";
    } else {
      alert(message);
    }
  }
  function formatDate(date, options = {}) {
    const defaultOptions = {
      year: "numeric",
      month: "long",
      day: "numeric"
    };
    const finalOptions = { ...defaultOptions, ...options };
    const locale = isKorean() ? "ko-KR" : "en-US";
    const d = typeof date === "string" ? new Date(date) : date;
    return d.toLocaleDateString(locale, finalOptions);
  }
  function isKorean() {
    return document.documentElement.lang === "ko" || window.location.pathname.includes("/korean/");
  }
  function debounce(func, wait = 300) {
    let timeout;
    return function executedFunction(...args) {
      const later = () => {
        clearTimeout(timeout);
        func(...args);
      };
      clearTimeout(timeout);
      timeout = setTimeout(later, wait);
    };
  }
  function throttle(func, limit = 300) {
    let inThrottle;
    return function executedFunction(...args) {
      if (!inThrottle) {
        func(...args);
        inThrottle = true;
        setTimeout(() => inThrottle = false, limit);
      }
    };
  }
  var Utils = {
    escapeHtml,
    formatCurrency,
    showToast,
    showMessage,
    formatDate,
    isKorean,
    debounce,
    throttle
  };
  if (typeof window !== "undefined") {
    window.Utils = Utils;
  }
  var utils_default = Utils;

  // ns-hugo-imp:C:\hugo\ex\shop\assets\js\cart.js
  function isKoreanPage() {
    return document.documentElement.lang === "ko" || window.location.pathname.includes("/korean/");
  }
  function escapeFilterValue(value) {
    return String(value).replace(/\\/g, "\\\\").replace(/"/g, '\\"');
  }
  function sortObjectDeep(value) {
    if (Array.isArray(value)) {
      return value.map(sortObjectDeep);
    }
    if (value && typeof value === "object") {
      return Object.keys(value).sort().reduce((acc, key) => {
        acc[key] = sortObjectDeep(value[key]);
        return acc;
      }, {});
    }
    return value;
  }
  function normalizeOptions(options) {
    if (!options) {
      return {};
    }
    if (typeof options === "string") {
      try {
        return normalizeOptions(JSON.parse(options));
      } catch (error) {
        console.warn("Failed to parse cart item options:", error);
        return {};
      }
    }
    if (typeof options !== "object") {
      return {};
    }
    return options;
  }
  function splitOptions(options) {
    const normalized = normalizeOptions(options);
    const variantOptions = {};
    const metaOptions = {};
    Object.entries(normalized).forEach(([key, value]) => {
      if (value === void 0 || value === null || value === "") {
        return;
      }
      if (key.startsWith("__")) {
        metaOptions[key] = value;
        return;
      }
      variantOptions[key] = value;
    });
    return {
      variantOptions: sortObjectDeep(variantOptions),
      metaOptions: sortObjectDeep(metaOptions)
    };
  }
  function buildVariantKey(productId, options) {
    return `${productId || ""}::${JSON.stringify(sortObjectDeep(options || {}))}`;
  }
  function buildStoredOptions(options, meta = {}) {
    const variantOptions = sortObjectDeep(options || {});
    const metaOptions = sortObjectDeep(meta || {});
    return {
      ...variantOptions,
      ...metaOptions,
      __variantKey: buildVariantKey(metaOptions.__productId || "", variantOptions)
    };
  }
  function formatOptionSummary(options) {
    const { variantOptions } = splitOptions(options);
    const labels = isKoreanPage() ? { color: "\uC0C9\uC0C1", size: "\uC0AC\uC774\uC988" } : { color: "Color", size: "Size" };
    return Object.entries(variantOptions).map(([key, value]) => `${labels[key] || key}: ${Array.isArray(value) ? value.join(", ") : value}`).join(" / ");
  }
  function buildProductUrl(product, itemOptions) {
    const metaUrl = itemOptions.__productUrl;
    if (metaUrl) {
      return metaUrl;
    }
    const lang = document.documentElement.lang === "ko" ? "ko" : "en";
    const slug = product?.slug || itemOptions.__productSlug || "";
    return slug ? `/${lang}/products/${slug}/` : null;
  }
  async function fetchProductsByIds(productIds) {
    const uniqueIds = [...new Set(productIds.filter(Boolean))];
    if (uniqueIds.length === 0) {
      return /* @__PURE__ */ new Map();
    }
    try {
      const filter = uniqueIds.map((id) => `id="${escapeFilterValue(id)}"`).join(" || ");
      const products = await pb.collection("products").getFullList({
        filter
      });
      return new Map(products.map((product) => [product.id, product]));
    } catch (error) {
      console.warn("Batch product lookup failed, falling back to per-item fetch:", error);
      const entries = await Promise.allSettled(
        uniqueIds.map(async (id) => {
          const product = await pb.collection("products").getOne(id);
          return [id, product];
        })
      );
      return new Map(
        entries.filter((entry) => entry.status === "fulfilled").map((entry) => entry.value)
      );
    }
  }
  var Cart = {
    config: null,
    realtimeCartId: null,
    realtimeCleanup: null,
    async init(config) {
      console.log("Cart initialized with config:", config);
      this.config = config;
      if (pb.authStore.isValid) {
        await this.getOrCreateCart();
      }
      await this.renderCart();
      pb.authStore.onChange(async () => {
        console.log("Auth state changed in Cart, syncing...");
        if (pb.authStore.isValid) {
          await this.getOrCreateCart();
        } else {
          localStorage.removeItem("cart_id");
          await this.disposeRealtimeSubscription();
        }
        await this.renderCart();
      });
    },
    notify(message, isError = false) {
      showToast(message, { isError, duration: isError ? 4e3 : 2500 });
    },
    async rememberCart(cart) {
      if (!cart?.id) {
        return cart;
      }
      localStorage.setItem("cart_id", cart.id);
      await this.syncRealtimeSubscription(cart.id);
      return cart;
    },
    async disposeRealtimeSubscription() {
      if (typeof this.realtimeCleanup === "function") {
        try {
          await this.realtimeCleanup();
        } catch (error) {
          console.warn("Failed to dispose cart realtime subscription:", error);
        }
      }
      this.realtimeCleanup = null;
      this.realtimeCartId = null;
    },
    async syncRealtimeSubscription(cartId) {
      if (!cartId) {
        await this.disposeRealtimeSubscription();
        return;
      }
      if (this.realtimeCartId === cartId && this.realtimeCleanup) {
        return;
      }
      await this.disposeRealtimeSubscription();
      try {
        this.realtimeCleanup = await pb.collection("cart_items").subscribe("*", (event) => {
          if (!event?.record) {
            return;
          }
          if (event.record.cart === cartId) {
            this.renderCart();
          }
        });
        this.realtimeCartId = cartId;
      } catch (error) {
        console.warn("Cart realtime subscription unavailable:", error);
      }
    },
    async getOrCreateCart() {
      if (pb.authStore.isValid) {
        const userId = pb.authStore.model.id;
        console.log("User logged in:", userId);
        try {
          const carts = await pb.collection("carts").getList(1, 1, {
            filter: `user="${escapeFilterValue(userId)}"`,
            sort: "-created"
          });
          if (carts.items.length > 0) {
            const userCart = carts.items[0];
            const localCartId2 = localStorage.getItem("cart_id");
            if (localCartId2 && localCartId2 !== userCart.id) {
              console.log("Merging local cart into user cart...");
              await this.mergeCarts(localCartId2, userCart.id);
              localStorage.removeItem("cart_id");
            }
            return this.rememberCart(userCart);
          }
          const localCartId = localStorage.getItem("cart_id");
          if (localCartId) {
            try {
              const updatedCart = await pb.collection("carts").update(localCartId, {
                user: userId
              });
              return this.rememberCart(updatedCart);
            } catch (error) {
              console.error("Failed to assign guest cart to user, creating a new cart:", error);
              const newCart2 = await pb.collection("carts").create({
                session_id: crypto.randomUUID(),
                user: userId
              });
              await this.mergeCarts(localCartId, newCart2.id);
              return this.rememberCart(newCart2);
            }
          }
          const newCart = await pb.collection("carts").create({
            session_id: crypto.randomUUID(),
            user: userId
          });
          return this.rememberCart(newCart);
        } catch (error) {
          console.error("Error handling user cart:", error);
        }
      }
      const cartId = localStorage.getItem("cart_id");
      if (cartId) {
        try {
          const cart2 = await pb.collection("carts").getOne(cartId);
          if (cart2.user) {
            localStorage.removeItem("cart_id");
            await this.disposeRealtimeSubscription();
          } else {
            return this.rememberCart(cart2);
          }
        } catch (error) {
          console.error("Error fetching cart:", error);
          localStorage.removeItem("cart_id");
          await this.disposeRealtimeSubscription();
        }
      }
      const cart = await pb.collection("carts").create({
        session_id: crypto.randomUUID(),
        user: ""
      });
      return this.rememberCart(cart);
    },
    async mergeCarts(fromCartId, toCartId) {
      try {
        const [sourceItems, targetItems] = await Promise.all([
          pb.collection("cart_items").getFullList({
            filter: `cart="${escapeFilterValue(fromCartId)}"`
          }),
          pb.collection("cart_items").getFullList({
            filter: `cart="${escapeFilterValue(toCartId)}"`
          })
        ]);
        const targetMap = /* @__PURE__ */ new Map();
        targetItems.forEach((item) => {
          const { variantOptions } = splitOptions(item.options);
          targetMap.set(buildVariantKey(item.product_id, variantOptions), item);
        });
        for (const item of sourceItems) {
          const { variantOptions, metaOptions } = splitOptions(item.options);
          const variantKey = buildVariantKey(item.product_id, variantOptions);
          const existingItem = targetMap.get(variantKey);
          if (existingItem) {
            await pb.collection("cart_items").update(existingItem.id, {
              quantity: existingItem.quantity + item.quantity,
              price: item.price,
              image: item.image || existingItem.image,
              name: item.name || existingItem.name,
              options: buildStoredOptions(variantOptions, {
                ...splitOptions(existingItem.options).metaOptions,
                ...metaOptions,
                __productId: item.product_id
              })
            });
            await pb.collection("cart_items").delete(item.id);
            continue;
          }
          await pb.collection("cart_items").update(item.id, {
            cart: toCartId,
            options: buildStoredOptions(variantOptions, {
              ...metaOptions,
              __productId: item.product_id
            })
          });
        }
      } catch (error) {
        console.error("Error merging carts:", error);
      }
    },
    async addItem(product) {
      console.log("addItem called with:", product);
      try {
        const cart = await this.getOrCreateCart();
        const quantityToAdd = Math.max(1, Number(product.quantity) || 1);
        const { variantOptions, metaOptions } = splitOptions(product.options);
        const storedOptions = buildStoredOptions(variantOptions, {
          ...metaOptions,
          __productId: product.id,
          __productSlug: product.slug || metaOptions.__productSlug || "",
          __productUrl: product.url || metaOptions.__productUrl || ""
        });
        const variantKey = buildVariantKey(product.id, variantOptions);
        const existingItems = await pb.collection("cart_items").getFullList({
          filter: `cart="${escapeFilterValue(cart.id)}" && product_id="${escapeFilterValue(product.id)}"`
        });
        const existingItem = existingItems.find((item) => {
          const itemVariantKey = buildVariantKey(item.product_id, splitOptions(item.options).variantOptions);
          return itemVariantKey === variantKey;
        });
        if (existingItem) {
          await pb.collection("cart_items").update(existingItem.id, {
            quantity: existingItem.quantity + quantityToAdd,
            price: product.price,
            image: product.image,
            name: product.name,
            options: storedOptions
          });
        } else {
          await pb.collection("cart_items").create({
            cart: cart.id,
            product_id: product.id,
            name: product.name,
            price: product.price,
            image: product.image,
            quantity: quantityToAdd,
            options: storedOptions
          });
        }
        this.notify(isKoreanPage() ? `${product.name} \uC0C1\uD488\uC744 \uC7A5\uBC14\uAD6C\uB2C8\uC5D0 \uB2F4\uC558\uC2B5\uB2C8\uB2E4.` : `${product.name} added to cart.`);
        await this.renderCart();
        this.toggleDrawer(true);
      } catch (error) {
        console.error("Error in addItem:", error);
        this.notify(
          isKoreanPage() ? `\uC7A5\uBC14\uAD6C\uB2C8 \uCD94\uAC00\uC5D0 \uC2E4\uD328\uD588\uC2B5\uB2C8\uB2E4. ${error.message || ""}`.trim() : `Failed to add item to cart. ${error.message || ""}`.trim(),
          true
        );
      }
    },
    async changeQuantity(itemId, delta) {
      try {
        const item = await pb.collection("cart_items").getOne(itemId);
        const newQuantity = item.quantity + delta;
        if (newQuantity <= 0) {
          await this.removeItem(itemId);
        } else {
          await this.updateQuantity(itemId, newQuantity);
        }
      } catch (error) {
        console.error("Error changing quantity:", error);
        this.notify(isKoreanPage() ? "\uC218\uB7C9 \uBCC0\uACBD\uC5D0 \uC2E4\uD328\uD588\uC2B5\uB2C8\uB2E4." : "Failed to change quantity.", true);
      }
    },
    async updateQuantity(itemId, newQuantity) {
      try {
        const updatedItem = await pb.collection("cart_items").update(itemId, {
          quantity: newQuantity
        });
        this.updateItemUI(updatedItem);
        await this.updateCartTotals();
      } catch (error) {
        console.error("Error updating quantity:", error);
        this.notify(isKoreanPage() ? "\uC218\uB7C9 \uC5C5\uB370\uC774\uD2B8\uC5D0 \uC2E4\uD328\uD588\uC2B5\uB2C8\uB2E4." : "Failed to update quantity.", true);
      }
    },
    updateItemUI(item) {
      const itemEl = document.querySelector(`.cart-item[data-item-id="${item.id}"]`);
      if (!itemEl) {
        return;
      }
      const qtyEl = itemEl.querySelector(".quantity-value");
      if (qtyEl) {
        qtyEl.textContent = item.quantity;
      }
      const priceEl = itemEl.querySelector(".item-price");
      if (priceEl) {
        priceEl.textContent = this.formatCurrency(item.price * item.quantity);
      }
      const minusBtn = itemEl.querySelector('button[aria-label="Decrease quantity"]');
      if (minusBtn) {
        minusBtn.disabled = item.quantity <= 1;
      }
    },
    async updateCartTotals() {
      const items = await this.getItems();
      const total = items.reduce((sum, item) => sum + item.price * item.quantity, 0);
      const formattedTotal = this.formatCurrency(total);
      const countElement = document.getElementById("cart-item-count");
      if (countElement) {
        const count = items.reduce((sum, item) => sum + item.quantity, 0);
        countElement.textContent = count;
        countElement.style.display = count > 0 ? "flex" : "none";
      }
      const subtotalEl = document.getElementById("cart-subtotal");
      const totalEl = document.getElementById("cart-total");
      const footerEl = document.getElementById("cart-footer");
      if (subtotalEl) {
        subtotalEl.textContent = formattedTotal;
      }
      if (totalEl) {
        totalEl.textContent = formattedTotal;
      }
      if (footerEl) {
        footerEl.style.display = items.length > 0 ? "block" : "none";
      }
    },
    formatCurrency(amount) {
      return formatCurrency(amount);
    },
    async removeItem(itemId) {
      try {
        await pb.collection("cart_items").delete(itemId);
        await this.renderCart();
      } catch (error) {
        console.error("Error removing item:", error);
        this.notify(isKoreanPage() ? "\uC0C1\uD488 \uC0AD\uC81C\uC5D0 \uC2E4\uD328\uD588\uC2B5\uB2C8\uB2E4." : "Failed to remove item.", true);
      }
    },
    async getItems() {
      const cartId = localStorage.getItem("cart_id");
      if (!cartId) {
        return [];
      }
      try {
        const records = await pb.collection("cart_items").getFullList({
          filter: `cart="${escapeFilterValue(cartId)}"`,
          sort: "-created"
        });
        const productMap = await fetchProductsByIds(records.map((item) => item.product_id));
        return records.map((item) => {
          const options = normalizeOptions(item.options);
          const displayOptions = splitOptions(options).variantOptions;
          const product = productMap.get(item.product_id);
          let displayPrice = item.price;
          if (isKoreanPage() && displayPrice < 1e3) {
            displayPrice *= 1e3;
          } else if (!isKoreanPage() && displayPrice > 1e3) {
            displayPrice /= 1e3;
          }
          return {
            ...item,
            options,
            optionSummary: formatOptionSummary(displayOptions),
            formattedPrice: this.formatCurrency(displayPrice * item.quantity),
            isMinQuantity: item.quantity <= 1,
            productLink: buildProductUrl(product, options)
          };
        });
      } catch (error) {
        console.error("Error fetching items:", error);
        return [];
      }
    },
    async checkout() {
      const items = await this.getItems();
      if (items.length === 0) {
        this.notify(isKoreanPage() ? "\uC7A5\uBC14\uAD6C\uB2C8\uAC00 \uBE44\uC5B4 \uC788\uC2B5\uB2C8\uB2E4." : "Cart is empty.", true);
        return;
      }
      const baseUrl = window.location.origin;
      const lang = document.documentElement.lang || "en";
      window.location.href = `${baseUrl}/${lang}/checkout/`;
      this.toggleDrawer(false);
    },
    async renderCart() {
      const items = await this.getItems();
      const total = items.reduce((sum, item) => {
        let price = item.price;
        if (isKoreanPage() && price < 1e3) {
          price *= 1e3;
        } else if (!isKoreanPage() && price > 1e3) {
          price /= 1e3;
        }
        return sum + price * item.quantity;
      }, 0);
      const formattedTotal = this.formatCurrency(total);
      const countElement = document.getElementById("cart-item-count");
      if (countElement) {
        const count = items.reduce((sum, item) => sum + item.quantity, 0);
        countElement.textContent = count;
        countElement.style.display = count > 0 ? "flex" : "none";
      }
      const subtotalEl = document.getElementById("cart-subtotal");
      const totalEl = document.getElementById("cart-total");
      const footerEl = document.getElementById("cart-footer");
      if (subtotalEl) {
        subtotalEl.textContent = formattedTotal;
      }
      if (totalEl) {
        totalEl.textContent = formattedTotal;
      }
      if (footerEl) {
        footerEl.style.display = items.length > 0 ? "block" : "none";
      }
      const templateElement = document.getElementById("cart-template");
      if (!templateElement) {
        console.error("Cart template not found!");
        return;
      }
      try {
        const rendered = Mustache.render(templateElement.innerHTML, {
          items,
          total: formattedTotal,
          hasItems: items.length > 0
        }, null, ["[[", "]]"]);
        const container = document.getElementById("cart-items-container");
        if (container) {
          container.innerHTML = rendered;
        }
      } catch (error) {
        console.error("Error rendering cart:", error);
        const container = document.getElementById("cart-items-container");
        if (container) {
          container.innerHTML = `
                    <div class="cart-error" style="padding: 20px; text-align: center; color: #e53e3e;">
                        <p style="margin-bottom: 10px;">\uC7A5\uBC14\uAD6C\uB2C8\uB97C \uBD88\uB7EC\uC624\uB294 \uC911 \uC624\uB958\uAC00 \uBC1C\uC0DD\uD588\uC2B5\uB2C8\uB2E4.</p>
                        <p class="error-detail" style="font-size: 0.8em; color: #718096; margin-bottom: 15px;">${error.message}</p>
                        <button onclick="Cart.renderCart()" class="retry-btn" style="padding: 8px 16px; background: #4a5568; color: white; border: none; border-radius: 4px; cursor: pointer;">\uB2E4\uC2DC \uC2DC\uB3C4</button>
                    </div>
                `;
        }
      }
    },
    toggleDrawer(forceOpen) {
      const drawer = document.getElementById("cart-drawer");
      const overlay = document.getElementById("cart-overlay");
      if (!drawer || !overlay) {
        return;
      }
      if (typeof forceOpen === "boolean") {
        drawer.classList.toggle("open", forceOpen);
        overlay.classList.toggle("open", forceOpen);
      } else {
        drawer.classList.toggle("open");
        overlay.classList.toggle("open");
      }
      if (drawer.classList.contains("open")) {
        this.renderCart();
      }
    }
  };
  if (typeof window !== "undefined") {
    window.Cart = Cart;
  }
  function setupCartEvents() {
    document.body.addEventListener("cart-updated", function() {
      Cart.renderCart();
    });
  }
  if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", setupCartEvents);
  } else {
    setupCartEvents();
  }

  // ns-hugo-imp:C:\hugo\ex\shop\assets\js\auth.js
  var Auth = /* @__PURE__ */ (function() {
    let nicknameChecked = false;
    let checkedNickname = "";
    let nicknameCheckTimeout = null;
    function init4() {
      updateAuthUI();
      const isAuthPage = window.location.pathname.includes("/login/") || window.location.pathname.includes("/signup/") || window.location.pathname.endsWith("/login") || window.location.pathname.endsWith("/signup");
      if (pb.authStore.isValid && isAuthPage) {
        console.log("[Auth] Already logged in, redirecting to home...");
        window.location.href = getHomeUrl();
        return;
      }
      pb.authStore.onChange(() => {
        updateAuthUI();
      });
      const hash = window.location.hash;
      if (hash === "#signup") {
        $('#authTab a[href="#signup"]').tab("show");
      }
      const logoutButton = document.getElementById("auth-logout-link");
      if (logoutButton) {
        logoutButton.addEventListener("click", (e) => {
          e.preventDefault();
          logout();
        });
      }
      const loginForm = document.getElementById("login-form");
      if (loginForm) {
        loginForm.addEventListener("submit", handleLogin);
      }
      const signupForm = document.getElementById("signup-form");
      if (signupForm) {
        signupForm.addEventListener("submit", handleSignup);
      }
      const emailInputs = document.querySelectorAll('input[type="email"]');
      emailInputs.forEach((input) => {
        input.addEventListener("blur", handleMailcheck);
        input.addEventListener("input", handleEmailAutocomplete);
      });
      const rememberEmailCheckbox = document.getElementById("remember-email");
      const loginEmailInput = document.getElementById("login-email");
      if (rememberEmailCheckbox && loginEmailInput) {
        const savedEmail = localStorage.getItem("remembered_email");
        if (savedEmail) {
          loginEmailInput.value = savedEmail;
          rememberEmailCheckbox.checked = true;
        }
      }
      const oauthButtons = document.querySelectorAll(".oauth-login-btn");
      oauthButtons.forEach((button) => {
        button.addEventListener("click", (e) => {
          e.preventDefault();
          const button2 = e.currentTarget;
          if (button2) {
            const provider = button2.dataset.provider;
            handleOAuth2Login(provider);
          }
        });
      });
      setupNicknameCheck();
    }
    function updateAuthUI() {
      const isLoggedIn = pb.authStore.isValid;
      const user = pb.authStore.model;
      document.querySelectorAll(".auth-hidden").forEach((el) => el.style.display = isLoggedIn ? "none" : "block");
      document.querySelectorAll(".auth-visible").forEach((el) => el.style.display = isLoggedIn ? "block" : "none");
      const loginLink = document.getElementById("auth-login-link");
      const signupLink = document.getElementById("auth-signup-link");
      const logoutLink = document.getElementById("auth-logout-link");
      const profileLink = document.getElementById("auth-profile-link");
      if (isLoggedIn) {
        if (loginLink) loginLink.style.display = "none";
        if (signupLink) signupLink.style.display = "none";
        if (logoutLink) logoutLink.style.display = "block";
        if (profileLink) profileLink.style.display = "block";
      } else {
        if (loginLink) loginLink.style.display = "block";
        if (signupLink) signupLink.style.display = "block";
        if (logoutLink) logoutLink.style.display = "none";
        if (profileLink) profileLink.style.display = "none";
      }
      const userDisplay = document.getElementById("auth-user-name");
      const avatarEl = document.getElementById("nav-avatar-img");
      const avatarIcon = document.getElementById("nav-avatar-icon");
      if (userDisplay && isLoggedIn && user) {
        userDisplay.textContent = user.name || user.username || user.email || "User";
      }
      if (isLoggedIn && user) {
        if (avatarEl && user.avatar) {
          const avatarUrl = pb.files.getUrl(user, user.avatar, { thumb: "50x50" });
          avatarEl.src = avatarUrl;
          avatarEl.style.display = "block";
          if (avatarIcon) avatarIcon.style.display = "none";
        } else if (avatarIcon) {
          avatarIcon.style.display = "block";
          if (avatarEl) avatarEl.style.display = "none";
        }
      } else {
        if (avatarEl) avatarEl.style.display = "none";
        if (avatarIcon) avatarIcon.style.display = "none";
      }
    }
    async function handleLogin(event) {
      event.preventDefault();
      const form = event.target;
      const email = form.email.value;
      const password = form.password.value;
      const messageEl = document.getElementById("login-message");
      try {
        showMessage2(messageEl, "\uB85C\uADF8\uC778 \uC911...", "text-info");
        await pb.collection("users").authWithPassword(email, password);
        showMessage2(messageEl, "\uB85C\uADF8\uC778 \uC131\uACF5!", "text-success");
        showToast2("\uB85C\uADF8\uC778 \uC131\uACF5!");
        const rememberEmailCheckbox = document.getElementById("remember-email");
        if (rememberEmailCheckbox && rememberEmailCheckbox.checked) {
          localStorage.setItem("remembered_email", email);
        } else {
          localStorage.removeItem("remembered_email");
        }
        setTimeout(() => {
          const redirectUrl = localStorage.getItem("auth_redirect") || getHomeUrl();
          localStorage.removeItem("auth_redirect");
          window.location.href = redirectUrl;
        }, 500);
      } catch (error) {
        console.error("Login failed:", error);
        showMessage2(messageEl, "\uC774\uBA54\uC77C \uB610\uB294 \uBE44\uBC00\uBC88\uD638\uAC00 \uC77C\uCE58\uD558\uC9C0 \uC54A\uC2B5\uB2C8\uB2E4.", "text-danger");
      }
    }
    async function handleSignup(event) {
      event.preventDefault();
      const form = event.target;
      const email = form.email.value;
      const password = form.password.value;
      const passwordConfirm = form.passwordConfirm.value;
      const name = form.name?.value || "";
      const nickname = form.nickname?.value || "";
      const messageEl = document.getElementById("signup-message");
      if (password !== passwordConfirm) {
        showMessage2(messageEl, "\uBE44\uBC00\uBC88\uD638\uAC00 \uC77C\uCE58\uD558\uC9C0 \uC54A\uC2B5\uB2C8\uB2E4.", "text-danger");
        return;
      }
      if (nickname && !nicknameChecked) {
        showMessage2(messageEl, "\uB2C9\uB124\uC784 \uC911\uBCF5 \uD655\uC778\uC774 \uD544\uC694\uD569\uB2C8\uB2E4.", "text-warning");
        return;
      }
      try {
        showMessage2(messageEl, "\uD68C\uC6D0\uAC00\uC785 \uCC98\uB9AC \uC911...", "text-info");
        const data = {
          email,
          password,
          passwordConfirm,
          name,
          username: nickname || email.split("@")[0]
        };
        await pb.collection("users").create(data);
        await pb.collection("users").authWithPassword(email, password);
        showMessage2(messageEl, "\uD68C\uC6D0\uAC00\uC785 \uC131\uACF5! \uB85C\uADF8\uC778 \uC911...", "text-success");
        showToast2("\uD68C\uC6D0\uAC00\uC785\uC744 \uCD95\uD558\uD569\uB2C8\uB2E4!");
        setTimeout(() => {
          window.location.href = getHomeUrl();
        }, 1e3);
      } catch (error) {
        console.error("Signup failed:", error);
        let errorMsg = "\uD68C\uC6D0\uAC00\uC785\uC5D0 \uC2E4\uD328\uD588\uC2B5\uB2C8\uB2E4.";
        if (error.data?.data?.email) {
          errorMsg = "\uC774\uBBF8 \uAC00\uC785\uB41C \uC774\uBA54\uC77C\uC785\uB2C8\uB2E4.";
        } else if (error.data?.data?.username) {
          errorMsg = "\uC774\uBBF8 \uC0AC\uC6A9 \uC911\uC778 \uB2C9\uB124\uC784\uC785\uB2C8\uB2E4.";
        }
        showMessage2(messageEl, errorMsg, "text-danger");
      }
    }
    async function handleOAuth2Login(provider) {
      try {
        const currentUrl = window.location.pathname + window.location.search;
        localStorage.setItem("auth_redirect", currentUrl);
        const authData = await pb.collection("users").authWithOAuth2({ provider });
        if (authData && authData.record) {
          showToast2(`${provider} \uB85C\uADF8\uC778 \uC131\uACF5!`);
          const redirectUrl = localStorage.getItem("auth_redirect") || getHomeUrl();
          localStorage.removeItem("auth_redirect");
          window.location.href = redirectUrl;
        }
      } catch (error) {
        console.error(`${provider} OAuth login failed:`, error);
        showToast2(`${provider} \uB85C\uADF8\uC778\uC5D0 \uC2E4\uD328\uD588\uC2B5\uB2C8\uB2E4.`);
      }
    }
    function logout() {
      pb.authStore.clear();
      showToast2("\uB85C\uADF8\uC544\uC6C3 \uB418\uC5C8\uC2B5\uB2C8\uB2E4.");
      window.location.href = getHomeUrl();
    }
    function showMessage2(el, message, className) {
      if (el) {
        el.innerText = message;
        el.className = "mt-3 text-center " + className;
        el.style.display = "block";
      } else {
        alert(message);
      }
    }
    function getHomeUrl() {
      const isKo = document.documentElement.lang === "ko" || window.location.pathname.includes("/ko/");
      return isKo ? "/ko/" : "/";
    }
    function showToast2(message) {
      const toast = document.createElement("div");
      toast.className = "fixed top-4 left-1/2 transform -translate-x-1/2 bg-gray-800 text-white px-4 py-2 rounded-lg shadow-lg text-sm z-50 transition-opacity duration-300";
      toast.style.opacity = "0";
      toast.innerText = message;
      document.body.appendChild(toast);
      requestAnimationFrame(() => {
        toast.style.opacity = "1";
      });
      setTimeout(() => {
        toast.style.opacity = "0";
        setTimeout(() => {
          document.body.removeChild(toast);
        }, 300);
      }, 3e3);
    }
    function handleEmailAutocomplete(event) {
      const input = event.target;
      const value = input.value;
      const atIndex = value.indexOf("@");
      if (atIndex === -1 || value.endsWith("@")) {
        return;
      }
      const domains = ["gmail.com", "naver.com", "daum.net", "hanmail.net", "kakao.com"];
      const currentDomain = value.slice(atIndex + 1);
      const matchedDomain = domains.find((d) => d.startsWith(currentDomain) && d !== currentDomain);
      let datalist = document.getElementById("emailDomains");
      if (!datalist) {
        datalist = document.createElement("datalist");
        datalist.id = "emailDomains";
        document.body.appendChild(datalist);
        input.setAttribute("list", "emailDomains");
      }
      datalist.innerHTML = "";
      if (matchedDomain) {
        const localPart = value.slice(0, atIndex);
        domains.forEach((domain) => {
          if (domain.startsWith(currentDomain)) {
            const option = document.createElement("option");
            option.value = localPart + "@" + domain;
            datalist.appendChild(option);
          }
        });
      }
    }
    function handleMailcheck(event) {
      const input = event.target;
      if (typeof Mailcheck === "undefined") return;
      Mailcheck.run({
        email: input.value,
        suggested: function(suggestion) {
          const suggestionLink = document.getElementById("email-suggestion-link");
          const suggestionContainer = document.getElementById("email-suggestion");
          if (suggestionLink && suggestionContainer) {
            suggestionLink.textContent = suggestion.full;
            suggestionContainer.style.display = "block";
            suggestionLink.onclick = (e) => {
              e.preventDefault();
              input.value = suggestion.full;
              suggestionContainer.style.display = "none";
            };
          }
        },
        empty: function() {
          const suggestionContainer = document.getElementById("email-suggestion");
          if (suggestionContainer) suggestionContainer.style.display = "none";
        }
      });
    }
    async function checkNickname(nickname) {
      if (!nickname || nickname.length < 2) {
        updateNicknameStatus("", "");
        nicknameChecked = false;
        return;
      }
      try {
        const result = await pb.collection("users").getList(1, 1, {
          filter: `username = "${nickname}"`
        });
        if (result.totalItems > 0) {
          updateNicknameStatus("\uC774\uBBF8 \uC0AC\uC6A9 \uC911\uC778 \uB2C9\uB124\uC784\uC785\uB2C8\uB2E4.", "text-danger");
          nicknameChecked = false;
        } else {
          updateNicknameStatus("\uC0AC\uC6A9 \uAC00\uB2A5\uD55C \uB2C9\uB124\uC784\uC785\uB2C8\uB2E4.", "text-success");
          nicknameChecked = true;
          checkedNickname = nickname;
        }
      } catch (error) {
        console.error("Nickname check failed:", error);
        updateNicknameStatus("\uB2C9\uB124\uC784 \uD655\uC778 \uC911 \uC624\uB958\uAC00 \uBC1C\uC0DD\uD588\uC2B5\uB2C8\uB2E4.", "text-warning");
        nicknameChecked = false;
      }
    }
    function updateNicknameStatus(message, className) {
      const statusEl = document.getElementById("nickname-status");
      if (statusEl) {
        statusEl.textContent = message;
        statusEl.className = "small " + className;
      }
    }
    function setupNicknameCheck() {
      const nicknameInput = document.getElementById("signup-nickname");
      if (!nicknameInput) return;
      nicknameInput.addEventListener("input", function() {
        const nickname = nicknameInput.value.trim();
        if (nickname !== checkedNickname) nicknameChecked = false;
        if (nicknameCheckTimeout) clearTimeout(nicknameCheckTimeout);
        nicknameCheckTimeout = setTimeout(() => {
          checkNickname(nickname);
        }, 500);
      });
    }
    return {
      init: init4,
      logout,
      handleOAuth2Login
    };
  })();
  if (typeof window !== "undefined") {
    window.Auth = Auth;
  }
  if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", () => Auth.init());
  } else {
    Auth.init();
  }

  // ns-hugo-imp:C:\hugo\ex\shop\assets\js\products-api.js
  var ProductsApi = class {
    constructor() {
      this.pb = pb;
      this.collection = "products";
      this.currentLang = document.documentElement.lang || "ko";
    }
    /**
     * Get list of products with optional filtering
     * @param {Object} options - Filter options
     * @param {number} options.page - Page number (default: 1)
     * @param {number} options.perPage - Items per page (default: 20)
     * @param {string} options.sort - Sort order (default: '-created')
     * @param {string} options.filter - Additional filter string
     * @returns {Promise<Object>} - Paginated result list
     */
    async getList({ page = 1, perPage = 20, sort = "-order,-created", filter = "" } = {}) {
      try {
        const baseFilter = `language = "${this.currentLang}" && enabled = true`;
        const finalFilter = filter ? `${baseFilter} && (${filter})` : baseFilter;
        console.log("Fetching products with filter:", finalFilter);
        const records = await this.pb.collection(this.collection).getList(page, perPage, {
          sort,
          filter: finalFilter
        });
        console.log("Products fetched:", records);
        return records;
      } catch (error) {
        console.error("Error fetching product list:", error);
        return { items: [], totalItems: 0, totalPages: 0 };
      }
    }
    /**
     * Get a single product by slug
     * @param {string} slug - Product slug
     * @returns {Promise<Object|null>} - Product record or null
     */
    async getBySlug(slug) {
      try {
        const record = await this.pb.collection(this.collection).getFirstListItem(
          `slug = "${slug}" && language = "${this.currentLang}"`
        );
        return record;
      } catch (error) {
        console.error(`Error fetching product with slug ${slug}:`, error);
        return null;
      }
    }
    /**
     * Get a single product by ID
     * @param {string} id - Product ID
     * @returns {Promise<Object|null>} - Product record or null
     */
    async getById(id) {
      try {
        const record = await this.pb.collection(this.collection).getOne(id);
        return record;
      } catch (error) {
        console.error(`Error fetching product with id ${id}:`, error);
        return null;
      }
    }
    /**
     * Get full image URL
     * @param {Object} record - Product record
     * @param {string} filename - Image filename
     * @param {string} thumb - Thumb size (e.g., '100x100')
     * @returns {string} - Full image URL
     */
    getImageUrl(record, filename, thumb = "") {
      if (!record || !filename) return "";
      const url = this.pb.files.getUrl(record, filename, { thumb });
      return url;
    }
  };
  var productsApi = new ProductsApi();
  if (typeof window !== "undefined") {
    window.productsApi = productsApi;
    window.ProductsApi = ProductsApi;
  }

  // ns-hugo-imp:C:\hugo\ex\shop\assets\js\reviews.js
  var reviewForm = null;
  var reviewList = null;
  var authMessage = null;
  var imageInput = null;
  var imagePreview = null;
  var imageCount = null;
  var selectedFiles = [];
  var currentProductId = null;
  function init(productId) {
    currentProductId = productId;
    reviewForm = document.getElementById("review-form");
    reviewList = document.getElementById("review-list");
    authMessage = document.getElementById("review-auth-message");
    imageInput = document.getElementById("review-images");
    imagePreview = document.getElementById("review-image-preview");
    imageCount = document.getElementById("review-image-count");
    updateUI();
    loadReviews();
    if (reviewForm) {
      reviewForm.addEventListener("submit", handleReviewSubmit);
    }
    if (imageInput) {
      imageInput.addEventListener("change", handleImageSelect);
    }
    pb.authStore.onChange(() => {
      updateUI();
      loadReviews();
    });
  }
  function updateUI() {
    const isLoggedIn = pb.authStore.isValid;
    if (reviewForm) {
      reviewForm.style.display = isLoggedIn ? "block" : "none";
    }
    if (authMessage) {
      authMessage.style.display = isLoggedIn ? "none" : "block";
    }
  }
  function handleImageSelect(e) {
    const files = Array.from(e.target.files);
    const MAX_SIZE = 10 * 1024 * 1024;
    const ALLOWED_TYPES = ["image/jpeg", "image/png", "image/gif", "image/webp"];
    const validFiles = [];
    for (const file of files) {
      if (!ALLOWED_TYPES.includes(file.type)) {
        alert(`\uC9C0\uC6D0\uB418\uC9C0 \uC54A\uB294 \uD30C\uC77C \uD615\uC2DD\uC785\uB2C8\uB2E4: ${file.name}
(jpg, png, gif, webp\uB9CC \uAC00\uB2A5)`);
        continue;
      }
      if (file.size > MAX_SIZE) {
        alert(`\uD30C\uC77C \uD06C\uAE30\uAC00 \uB108\uBB34 \uD07D\uB2C8\uB2E4: ${file.name}
(\uCD5C\uB300 10MB)`);
        continue;
      }
      validFiles.push(file);
    }
    if (selectedFiles.length + validFiles.length > 5) {
      alert("\uCD5C\uB300 5\uC7A5\uAE4C\uC9C0 \uC5C5\uB85C\uB4DC\uD560 \uC218 \uC788\uC2B5\uB2C8\uB2E4.");
      return;
    }
    selectedFiles = [...selectedFiles, ...validFiles].slice(0, 5);
    updateImagePreview();
    e.target.value = "";
  }
  function updateImagePreview() {
    if (!imagePreview) return;
    imagePreview.innerHTML = "";
    selectedFiles.forEach((file, index) => {
      const reader = new FileReader();
      reader.onload = (e) => {
        const wrapper = document.createElement("div");
        wrapper.style.cssText = "position: relative; display: inline-block;";
        wrapper.innerHTML = `
                <img src="${e.target.result}" alt="Preview ${index + 1}" 
                     style="width: 80px; height: 80px; object-fit: cover; border-radius: 8px; border: 1px solid #ddd;">
                <button type="button" class="remove-image-btn" data-index="${index}"
                        style="position: absolute; top: -8px; right: -8px; width: 20px; height: 20px; 
                               border-radius: 50%; border: none; background: #dc3545; color: white; 
                               font-size: 12px; cursor: pointer; line-height: 1;">\xD7</button>
            `;
        imagePreview.appendChild(wrapper);
        wrapper.querySelector(".remove-image-btn").addEventListener("click", () => {
          selectedFiles.splice(index, 1);
          updateImagePreview();
        });
      };
      reader.readAsDataURL(file);
    });
    if (imageCount) {
      imageCount.textContent = selectedFiles.length > 0 ? `${selectedFiles.length}\uAC1C \uC120\uD0DD` : "";
    }
  }
  async function loadReviews() {
    if (!currentProductId || !reviewList) return;
    reviewList.innerHTML = '<p class="text-center">\uB9AC\uBDF0\uB97C \uBD88\uB7EC\uC624\uB294 \uC911...</p>';
    try {
      const resultList = await pb.collection("reviews").getList(1, 50, {
        filter: `product_id = "${currentProductId}"`,
        sort: "-created",
        expand: "user"
      });
      renderReviews(resultList.items);
    } catch (error) {
      console.error("Error loading reviews:", error);
      reviewList.innerHTML = '<p class="text-center text-danger">\uB9AC\uBDF0\uB97C \uBD88\uB7EC\uC624\uB294\uB370 \uC2E4\uD328\uD588\uC2B5\uB2C8\uB2E4.</p>';
    }
  }
  function renderReviews(reviews) {
    if (reviews.length === 0) {
      reviewList.innerHTML = '<p class="text-center text-muted">\uC544\uC9C1 \uB9AC\uBDF0\uAC00 \uC5C6\uC2B5\uB2C8\uB2E4. \uCCAB \uBC88\uC9F8 \uB9AC\uBDF0\uB97C \uC791\uC131\uD574\uBCF4\uC138\uC694!</p>';
      return;
    }
    reviewList.innerHTML = reviews.map((review) => createReviewHTML(review)).join("");
    attachReviewEventListeners();
  }
  function attachReviewEventListeners() {
    document.querySelectorAll(".review-image").forEach((img) => {
      img.addEventListener("click", () => openLightbox(img.dataset.full || img.src));
    });
    document.querySelectorAll(".btn-edit-review").forEach((btn) => {
      btn.addEventListener("click", (e) => {
        const reviewId = e.target.closest(".review-item").dataset.reviewId;
        openEditModal(reviewId);
      });
    });
    document.querySelectorAll(".btn-delete-review").forEach((btn) => {
      btn.addEventListener("click", (e) => {
        const reviewId = e.target.closest(".review-item").dataset.reviewId;
        confirmDeleteReview(reviewId);
      });
    });
  }
  function createReviewHTML(review) {
    const user = review.expand?.user;
    const userName = user?.username || user?.name || "\uC775\uBA85";
    const userAvatar = user?.avatar ? pb.files.getUrl(user, user.avatar) : null;
    const createdDate = new Date(review.created).toLocaleDateString("ko-KR");
    const stars = "\u2605".repeat(review.rating) + "\u2606".repeat(5 - review.rating);
    const isOwner = pb.authStore.isValid && pb.authStore.model?.id === review.user;
    const actionsHTML = isOwner ? `
        <div class="review-actions mt-2">
            <button type="button" class="btn btn-sm btn-outline-secondary btn-edit-review mr-1">\uC218\uC815</button>
            <button type="button" class="btn btn-sm btn-outline-danger btn-delete-review">\uC0AD\uC81C</button>
        </div>
    ` : "";
    let imagesHTML = "";
    if (review.images && review.images.length > 0) {
      const imageItems = review.images.map((img) => {
        const thumbUrl = pb.files.getUrl(review, img, { thumb: "200x200" });
        const imgUrl = pb.files.getUrl(review, img);
        return `<img src="${thumbUrl}" data-full="${imgUrl}" alt="\uB9AC\uBDF0 \uC774\uBBF8\uC9C0" class="review-image" 
                        style="width: 80px; height: 80px; object-fit: cover; border-radius: 8px; cursor: pointer; border: 1px solid #ddd;">`;
      }).join("");
      imagesHTML = `<div class="review-images d-flex flex-wrap mt-2" style="gap: 8px;">${imageItems}</div>`;
    }
    const avatarHTML = userAvatar ? `<img src="${userAvatar}" class="mr-3 rounded-circle" alt="${escapeHtml(userName)}" style="width: 40px; height: 40px; object-fit: cover;" onerror="this.parentElement.innerHTML='<i class=\\'tf-ion-android-person mr-3\\' style=\\'font-size: 32px; width: 40px; height: 40px; display: flex; align-items: center; justify-content: center; color: #666;\\'></i>'">` : `<i class="tf-ion-android-person mr-3" style="font-size: 32px; width: 40px; height: 40px; display: flex; align-items: center; justify-content: center; color: #666;"></i>`;
    return `
        <div class="review-item media mb-4 p-3 border rounded" data-review-id="${review.id}" data-rating="${review.rating}" data-content="${escapeHtml(review.content)}">
            ${avatarHTML}
            <div class="media-body">
                <h6 class="mt-0 mb-1">${escapeHtml(userName)} <small class="text-muted ml-2">${createdDate}</small></h6>
                <div class="text-warning mb-2">${stars}</div>
                <p class="mb-2 review-content-text">${escapeHtml(review.content)}</p>
                ${imagesHTML}
                ${actionsHTML}
            </div>
        </div>
    `;
  }
  function openEditModal(reviewId) {
    const reviewElement = document.querySelector(`[data-review-id="${reviewId}"]`);
    if (!reviewElement) return;
    const currentRating = reviewElement.dataset.rating;
    const currentContent = reviewElement.dataset.content;
    const modal = document.createElement("div");
    modal.id = "edit-review-modal";
    modal.style.cssText = `
        position: fixed; top: 0; left: 0; width: 100%; height: 100%;
        background: rgba(0,0,0,0.5); display: flex; align-items: center; justify-content: center; z-index: 10000;
    `;
    modal.innerHTML = `
        <div style="background: white; padding: 30px; border-radius: 12px; max-width: 500px; width: 90%; max-height: 90vh; overflow-y: auto;">
            <h4 style="margin-bottom: 20px;">\uB9AC\uBDF0 \uC218\uC815</h4>
            <form id="edit-review-form">
                <div class="form-group">
                    <label for="edit-rating">\uD3C9\uC810</label>
                    <select class="form-control" id="edit-rating" required>
                        <option value="5" ${Number(currentRating) === 5 ? "selected" : ""}>\u2B50\u2B50\u2B50\u2B50\u2B50 (5\uC810)</option>
                        <option value="4" ${Number(currentRating) === 4 ? "selected" : ""}>\u2B50\u2B50\u2B50\u2B50 (4\uC810)</option>
                        <option value="3" ${Number(currentRating) === 3 ? "selected" : ""}>\u2B50\u2B50\u2B50 (3\uC810)</option>
                        <option value="2" ${Number(currentRating) === 2 ? "selected" : ""}>\u2B50\u2B50 (2\uC810)</option>
                        <option value="1" ${Number(currentRating) === 1 ? "selected" : ""}>\u2B50 (1\uC810)</option>
                    </select>
                </div>
                <div class="form-group">
                    <label for="edit-content">\uB0B4\uC6A9</label>
                    <textarea class="form-control" id="edit-content" rows="4" required>${currentContent}</textarea>
                </div>
                <div style="display: flex; gap: 10px; justify-content: flex-end;">
                    <button type="button" class="btn btn-secondary" id="cancel-edit">\uCDE8\uC18C</button>
                    <button type="submit" class="btn btn-primary" id="save-edit">\uC800\uC7A5</button>
                </div>
            </form>
        </div>
    `;
    document.body.appendChild(modal);
    modal.querySelector("#cancel-edit").addEventListener("click", () => modal.remove());
    modal.addEventListener("click", (e) => {
      if (e.target === modal) modal.remove();
    });
    modal.querySelector("#edit-review-form").addEventListener("submit", async (e) => {
      e.preventDefault();
      const newRating = parseInt(document.getElementById("edit-rating").value);
      const newContent = document.getElementById("edit-content").value.trim();
      const saveBtn = modal.querySelector("#save-edit");
      if (!newContent) {
        alert("\uB9AC\uBDF0 \uB0B4\uC6A9\uC744 \uC785\uB825\uD574\uC8FC\uC138\uC694.");
        return;
      }
      try {
        saveBtn.disabled = true;
        saveBtn.textContent = "\uC800\uC7A5 \uC911...";
        await pb.collection("reviews").update(reviewId, { rating: newRating, content: newContent });
        modal.remove();
        showSuccessMessage("\uB9AC\uBDF0\uAC00 \uC218\uC815\uB418\uC5C8\uC2B5\uB2C8\uB2E4.");
        loadReviews();
      } catch (error) {
        console.error("Error updating review:", error);
        alert("\uB9AC\uBDF0 \uC218\uC815\uC5D0 \uC2E4\uD328\uD588\uC2B5\uB2C8\uB2E4: " + error.message);
        saveBtn.disabled = false;
        saveBtn.textContent = "\uC800\uC7A5";
      }
    });
  }
  async function confirmDeleteReview(reviewId) {
    if (!confirm("\uC815\uB9D0\uB85C \uC774 \uB9AC\uBDF0\uB97C \uC0AD\uC81C\uD558\uC2DC\uACA0\uC2B5\uB2C8\uAE4C?")) return;
    try {
      await pb.collection("reviews").delete(reviewId);
      const reviewElement = document.querySelector(`[data-review-id="${reviewId}"]`);
      if (reviewElement) {
        reviewElement.style.transition = "all 0.3s ease-out";
        reviewElement.style.opacity = "0";
        reviewElement.style.transform = "translateX(-20px)";
        setTimeout(() => {
          reviewElement.remove();
          if (reviewList && reviewList.children.length === 0) {
            reviewList.innerHTML = '<p class="text-center text-muted">\uC544\uC9C1 \uB9AC\uBDF0\uAC00 \uC5C6\uC2B5\uB2C8\uB2E4. \uCCAB \uBC88\uC9F8 \uB9AC\uBDF0\uB97C \uC791\uC131\uD574\uBCF4\uC138\uC694!</p>';
          }
        }, 300);
      }
      showSuccessMessage("\uB9AC\uBDF0\uAC00 \uC0AD\uC81C\uB418\uC5C8\uC2B5\uB2C8\uB2E4.");
    } catch (error) {
      console.error("Error deleting review:", error);
      alert("\uB9AC\uBDF0 \uC0AD\uC81C\uC5D0 \uC2E4\uD328\uD588\uC2B5\uB2C8\uB2E4: " + error.message);
    }
  }
  function showSuccessMessage(message) {
    const toast = document.createElement("div");
    toast.className = "alert alert-success";
    toast.style.cssText = `position: fixed; top: 20px; right: 20px; z-index: 9999; animation: slideIn 0.3s ease-out; box-shadow: 0 4px 12px rgba(0,0,0,0.15);`;
    toast.textContent = message;
    document.body.appendChild(toast);
    setTimeout(() => {
      toast.style.animation = "slideOut 0.3s ease-in";
      setTimeout(() => toast.remove(), 300);
    }, 3e3);
  }
  function openLightbox(src) {
    const lightbox = document.createElement("div");
    lightbox.id = "review-lightbox";
    lightbox.style.cssText = `
        position: fixed; top: 0; left: 0; width: 100%; height: 100%;
        background: rgba(0,0,0,0.9); display: flex; align-items: center; justify-content: center;
        z-index: 10000; cursor: zoom-out;
    `;
    lightbox.innerHTML = `
        <img src="${src}" style="max-width: 90%; max-height: 90%; object-fit: contain; border-radius: 8px;">
        <button style="position: absolute; top: 20px; right: 20px; width: 40px; height: 40px; 
                       border-radius: 50%; border: none; background: white; font-size: 24px; cursor: pointer;">\xD7</button>
    `;
    lightbox.addEventListener("click", () => lightbox.remove());
    document.body.appendChild(lightbox);
  }
  async function handleReviewSubmit(e) {
    e.preventDefault();
    if (!pb.authStore.isValid) {
      alert("\uB9AC\uBDF0\uB97C \uC791\uC131\uD558\uB824\uBA74 \uB85C\uADF8\uC778\uC774 \uD544\uC694\uD569\uB2C8\uB2E4.");
      return;
    }
    const ratingSelect = document.getElementById("review-rating");
    const ratingRadio = document.querySelector('input[name="rating"]:checked');
    const rating = ratingSelect?.value || ratingRadio?.value;
    const contentInput = document.getElementById("review-content");
    const content = contentInput?.value?.trim();
    const submitBtn = reviewForm.querySelector('button[type="submit"]');
    if (!rating) {
      alert("\uD3C9\uC810\uC744 \uC120\uD0DD\uD574\uC8FC\uC138\uC694.");
      return;
    }
    if (!content) {
      alert("\uB9AC\uBDF0 \uB0B4\uC6A9\uC744 \uC785\uB825\uD574\uC8FC\uC138\uC694.");
      return;
    }
    try {
      submitBtn.disabled = true;
      submitBtn.innerText = "\uC81C\uCD9C \uC911...";
      const formData = new FormData();
      formData.append("user", pb.authStore.model.id);
      formData.append("product_id", currentProductId);
      formData.append("rating", parseInt(rating));
      formData.append("content", content);
      selectedFiles.forEach((file) => formData.append("images", file));
      const newReview = await pb.collection("reviews").create(formData, { expand: "user" });
      reviewForm.reset();
      selectedFiles = [];
      updateImagePreview();
      addNewReviewToList(newReview);
      showSuccessMessage("\uB9AC\uBDF0\uAC00 \uC131\uACF5\uC801\uC73C\uB85C \uB4F1\uB85D\uB418\uC5C8\uC2B5\uB2C8\uB2E4!");
    } catch (error) {
      console.error("Error submitting review:", error);
      let errorMsg = "\uB9AC\uBDF0 \uC81C\uCD9C\uC5D0 \uC2E4\uD328\uD588\uC2B5\uB2C8\uB2E4.";
      if (error.data && error.data.data) {
        const fieldErrors = Object.entries(error.data.data).map(([field, err]) => `- ${field}: ${err.message}`).join("\n");
        if (fieldErrors) errorMsg += "\n" + fieldErrors;
      } else if (error.message) {
        errorMsg += "\n(" + error.message + ")";
      }
      alert(errorMsg);
    } finally {
      submitBtn.disabled = false;
      submitBtn.innerText = "\uB9AC\uBDF0 \uC81C\uCD9C";
    }
  }
  function addNewReviewToList(newReview) {
    if (!reviewList) return;
    const noReviewsMsg = reviewList.querySelector(".text-muted");
    if (noReviewsMsg && noReviewsMsg.textContent.includes("\uC544\uC9C1 \uB9AC\uBDF0\uAC00 \uC5C6\uC2B5\uB2C8\uB2E4")) {
      reviewList.innerHTML = "";
    }
    const newReviewHTML = createReviewHTML({ ...newReview, expand: { user: pb.authStore.model } });
    const tempDiv = document.createElement("div");
    tempDiv.innerHTML = newReviewHTML;
    const newElement = tempDiv.firstElementChild;
    newElement.style.opacity = "0";
    newElement.style.transform = "translateY(-20px)";
    newElement.style.transition = "all 0.3s ease-out";
    reviewList.insertBefore(newElement, reviewList.firstChild);
    attachReviewEventListeners();
    requestAnimationFrame(() => {
      newElement.style.opacity = "1";
      newElement.style.transform = "translateY(0)";
    });
  }
  var Reviews = {
    init
  };
  if (typeof window !== "undefined") {
    window.Reviews = Reviews;
  }

  // ns-hugo-imp:C:\hugo\ex\shop\assets\js\qna.js
  var qnaForm = null;
  var qnaList = null;
  var authMessage2 = null;
  var currentProductId2 = null;
  function init2(productId) {
    currentProductId2 = productId;
    qnaForm = document.getElementById("qna-form");
    qnaList = document.getElementById("qna-list");
    authMessage2 = document.getElementById("qna-auth-message");
    updateUI2();
    loadInquiries();
    if (qnaForm) {
      qnaForm.addEventListener("submit", handleInquirySubmit);
    }
    pb.authStore.onChange(() => {
      updateUI2();
      loadInquiries();
    });
  }
  function updateUI2() {
    const isLoggedIn = pb.authStore.isValid;
    const formContainer = document.getElementById("qna-form-container");
    if (formContainer) {
      formContainer.style.display = isLoggedIn ? "block" : "none";
    }
    if (authMessage2) {
      authMessage2.style.display = isLoggedIn ? "none" : "block";
    }
  }
  async function loadInquiries() {
    if (!currentProductId2 || !qnaList) return;
    qnaList.innerHTML = '<div class="text-center py-3"><div class="spinner-border text-primary" role="status"><span class="sr-only">Loading...</span></div></div>';
    try {
      const resultList = await pb.collection("product_inquiries").getList(1, 50, {
        filter: `product_id = "${currentProductId2}"`,
        sort: "-created",
        expand: "user"
      });
      renderInquiries(resultList.items);
    } catch (error) {
      if (error.status === 404) {
        renderInquiries([]);
        return;
      }
      console.error("Error loading inquiries:", error);
      qnaList.innerHTML = '<div class="alert alert-danger">\uBB38\uC758 \uBAA9\uB85D\uC744 \uBD88\uB7EC\uC624\uB294\uB370 \uC2E4\uD328\uD588\uC2B5\uB2C8\uB2E4.</div>';
    }
  }
  function renderInquiries(items) {
    if (items.length === 0) {
      qnaList.innerHTML = '<div class="text-center text-muted py-5">\uB4F1\uB85D\uB41C \uBB38\uC758\uAC00 \uC5C6\uC2B5\uB2C8\uB2E4.</div>';
      return;
    }
    qnaList.innerHTML = items.map((item) => createInquiryHTML(item)).join("");
    qnaList.querySelectorAll(".btn-delete-qna").forEach((btn) => {
      btn.addEventListener("click", (e) => {
        const id = e.target.closest(".qna-item").dataset.id;
        deleteInquiry(id);
      });
    });
    qnaList.querySelectorAll(".btn-reply-qna").forEach((btn) => {
      btn.addEventListener("click", (e) => {
        const itemEl = e.target.closest(".qna-item");
        const formEl = itemEl.querySelector(".reply-form");
        if (formEl.style.display === "none") {
          formEl.style.display = "block";
        } else {
          formEl.style.display = "none";
        }
      });
    });
    qnaList.querySelectorAll(".btn-cancel-reply").forEach((btn) => {
      btn.addEventListener("click", (e) => {
        const itemEl = e.target.closest(".qna-item");
        itemEl.querySelector(".reply-form").style.display = "none";
      });
    });
    qnaList.querySelectorAll(".btn-save-reply").forEach((btn) => {
      btn.addEventListener("click", (e) => handleReplySave(e));
    });
  }
  function createInquiryHTML(item) {
    const user = item.expand?.user;
    const userName = user?.username || user?.name || "\uC775\uBA85";
    const createdDate = new Date(item.created).toLocaleDateString("ko-KR");
    const isSecret = item.is_secret;
    const currentUserId = pb.authStore.model?.id;
    const isOwner = pb.authStore.isValid && currentUserId === item.user;
    const isAdmin2 = pb.authStore.isAdmin;
    const canView = !isSecret || isOwner || isAdmin2;
    let contentDisplay = "";
    if (canView) {
      contentDisplay = `
            <p class="mb-2 qna-content">${escapeHtml(item.content)}</p>
            ${item.reply ? `<div class="admin-reply bg-light p-3 rounded mt-3">
                <strong class="text-primary">\uB2F5\uBCC0:</strong>
                <p class="mb-0 mt-1">${escapeHtml(item.reply)}</p>
                <small class="text-muted">${new Date(item.reply_date || item.updated).toLocaleDateString("ko-KR")}</small>
            </div>` : ""}
        `;
    } else {
      contentDisplay = `<p class="mb-2 text-muted font-italic"><i class="tf-ion-locked mr-2"></i>\uBE44\uBC00\uAE00\uC785\uB2C8\uB2E4.</p>`;
    }
    let actionsHTML = "";
    if (isOwner || isAdmin2) {
      actionsHTML += `<button type="button" class="btn btn-sm btn-outline-danger btn-delete-qna mr-1">\uC0AD\uC81C</button>`;
    }
    if (isAdmin2) {
      actionsHTML += `<button type="button" class="btn btn-sm btn-primary btn-reply-qna">\u{1F4AC} \uB2F5\uBCC0 \uC791\uC131/\uC218\uC815</button>`;
    }
    if (actionsHTML) {
      actionsHTML = `<div class="qna-actions mt-2">${actionsHTML}</div>`;
    }
    const replyFormHTML = isAdmin2 ? `
        <div class="reply-form mt-3 p-3 bg-white border rounded" style="display: none;">
            <div class="form-group pb-0 mb-2">
                <label class="small text-muted">\uAD00\uB9AC\uC790 \uB2F5\uBCC0</label>
                <textarea class="form-control form-control-sm admin-reply-input" rows="3">${item.reply || ""}</textarea>
            </div>
            <div class="text-right">
                <button type="button" class="btn btn-sm btn-secondary btn-cancel-reply">\uCDE8\uC18C</button>
                <button type="button" class="btn btn-sm btn-primary btn-save-reply">\uC800\uC7A5</button>
            </div>
        </div>
    ` : "";
    return `
        <div class="qna-item border-bottom py-3" data-id="${item.id}">
            <div class="d-flex justify-content-between align-items-start">
                <div class="w-100">
                    <div class="mb-1">
                        <span class="font-weight-bold mr-2">${isSecret ? '<i class="tf-ion-locked text-warning" title="\uBE44\uBC00\uAE00"></i> ' : ""}${canView ? escapeHtml(userName) : "***"}</span>
                        <small class="text-muted">${createdDate}</small>
                        <span class="badge badge-pill ${item.reply ? "badge-success" : "badge-secondary"} ml-2">
                            ${item.reply ? "\uB2F5\uBCC0\uC644\uB8CC" : "\uB2F5\uBCC0\uB300\uAE30"}
                        </span>
                    </div>
                    ${contentDisplay}
                    ${item.reply ? "" : actionsHTML}
                    ${item.reply && isAdmin2 ? actionsHTML : ""} 
                    ${replyFormHTML}
                </div>
            </div>
        </div>
    `;
  }
  async function handleInquirySubmit(e) {
    e.preventDefault();
    if (!pb.authStore.isValid) {
      alert("\uB85C\uADF8\uC778\uC774 \uD544\uC694\uD569\uB2C8\uB2E4.");
      return;
    }
    const content = document.getElementById("qna-content").value.trim();
    const isSecret = document.getElementById("qna-secret").checked;
    const submitBtn = qnaForm.querySelector('button[type="submit"]');
    if (!content) {
      alert("\uB0B4\uC6A9\uC744 \uC785\uB825\uD574\uC8FC\uC138\uC694.");
      return;
    }
    try {
      submitBtn.disabled = true;
      const data = {
        product_id: currentProductId2,
        user: pb.authStore.model.id,
        content,
        is_secret: isSecret
        // reply is empty initially
      };
      await pb.collection("product_inquiries").create(data);
      qnaForm.reset();
      loadInquiries();
      alert("\uBB38\uC758\uAC00 \uB4F1\uB85D\uB418\uC5C8\uC2B5\uB2C8\uB2E4.");
    } catch (error) {
      console.error("Error creating inquiry:", error);
      let checkMsg = "";
      if (error.data && error.data.data) {
        checkMsg = "\n" + Object.entries(error.data.data).map(([key, val]) => `${key}: ${val.message}`).join("\n");
      }
      alert("\uBB38\uC758 \uB4F1\uB85D \uC2E4\uD328: " + error.message + checkMsg);
    } finally {
      submitBtn.disabled = false;
    }
  }
  async function handleReplySave(e) {
    const itemEl = e.target.closest(".qna-item");
    const id = itemEl.dataset.id;
    const replyText = itemEl.querySelector(".admin-reply-input").value.trim();
    const btn = e.target;
    try {
      btn.disabled = true;
      btn.textContent = "\uC800\uC7A5 \uC911...";
      await pb.collection("product_inquiries").update(id, {
        reply: replyText,
        reply_date: /* @__PURE__ */ new Date()
      });
      loadInquiries();
    } catch (error) {
      console.error("Reply failed", error);
      alert("\uB2F5\uBCC0 \uC800\uC7A5 \uC2E4\uD328: " + error.message + getValidationMsg(error));
      btn.disabled = false;
      btn.textContent = "\uC800\uC7A5";
    }
  }
  async function deleteInquiry(id) {
    if (!confirm("\uC815\uB9D0 \uC0AD\uC81C\uD558\uC2DC\uACA0\uC2B5\uB2C8\uAE4C?")) return;
    try {
      await pb.collection("product_inquiries").delete(id);
      loadInquiries();
    } catch (error) {
      console.error("delete failed", error);
      alert("\uC0AD\uC81C \uC2E4\uD328");
    }
  }
  function getValidationMsg(error) {
    if (error.data && error.data.data) {
      return "\n" + Object.entries(error.data.data).map(([key, val]) => `${key}: ${val.message}`).join("\n");
    }
    return "";
  }
  var QnA = {
    init: init2
  };
  if (typeof window !== "undefined") {
    window.QnA = QnA;
  }

  // ns-hugo-imp:C:\hugo\ex\shop\assets\js\profile.js
  function init3() {
    const saveBtn = document.getElementById("save-button");
    const orderHistory = document.getElementById("order-history-list");
    if (!saveBtn && !orderHistory) {
      return;
    }
    const currentUser = pb.authStore.model;
    if (!currentUser) {
      showToast("\uB85C\uADF8\uC778\uC774 \uD544\uC694\uD569\uB2C8\uB2E4.", { isError: true });
      setTimeout(() => {
        window.location.href = document.documentElement.lang === "ko" ? "/ko/login/" : "/en/login/";
      }, 1500);
      return;
    }
    loadUserProfile();
    loadOrderHistory();
    if (saveBtn) {
      saveBtn.addEventListener("click", handleSave);
    }
    const changePasswordBtn = document.getElementById("change-password-btn");
    if (changePasswordBtn) {
      changePasswordBtn.addEventListener("click", handlePasswordChange);
    }
  }
  async function loadUserProfile() {
    try {
      const currentUser = pb.authStore.model;
      const nameInput = document.getElementById("name");
      if (nameInput) nameInput.value = currentUser.name || "";
      const nicknameInput = document.getElementById("nickname");
      if (nicknameInput) nicknameInput.value = currentUser.username || "";
      const emailInput = document.getElementById("email");
      if (emailInput) emailInput.value = currentUser.email || "";
      const phoneInput = document.getElementById("phone");
      if (phoneInput) phoneInput.value = currentUser.phone || "";
      const postcodeInput = document.getElementById("postcode");
      if (postcodeInput) postcodeInput.value = currentUser.postcode || "";
      const addressInput = document.getElementById("address");
      if (addressInput) addressInput.value = currentUser.address || "";
      const detailAddressInput = document.getElementById("detailAddress");
      if (detailAddressInput) detailAddressInput.value = currentUser.detailAddress || "";
      const extraAddressInput = document.getElementById("extraAddress");
      if (extraAddressInput) extraAddressInput.value = currentUser.extraAddress || "";
    } catch (error) {
      console.error("Failed to load user profile:", error);
      showToast("\uD504\uB85C\uD544\uC744 \uBD88\uB7EC\uC624\uB294\uB370 \uC2E4\uD328\uD588\uC2B5\uB2C8\uB2E4.", { isError: true });
    }
  }
  async function handleSave() {
    const saveBtn = document.getElementById("save-button");
    const currentUser = pb.authStore.model;
    if (!currentUser) {
      showToast("\uB85C\uADF8\uC778\uC774 \uD544\uC694\uD569\uB2C8\uB2E4.", { isError: true });
      return;
    }
    const nickname = document.getElementById("nickname").value.trim();
    const phone = document.getElementById("phone").value.trim();
    const postcode = document.getElementById("postcode").value.trim();
    const address = document.getElementById("address").value.trim();
    const detailAddress = document.getElementById("detailAddress").value.trim();
    const extraAddress = document.getElementById("extraAddress").value.trim();
    saveBtn.disabled = true;
    saveBtn.textContent = "\uC800\uC7A5\uC911...";
    try {
      const data = {
        phone,
        postcode,
        address,
        detailAddress,
        extraAddress,
        username: nickname
      };
      await pb.collection("users").update(currentUser.id, data);
      await pb.collection("users").authRefresh();
      showToast("\uD504\uB85C\uD544\uC774 \uC131\uACF5\uC801\uC73C\uB85C \uC800\uC7A5\uB418\uC5C8\uC2B5\uB2C8\uB2E4!", { isError: false });
    } catch (error) {
      console.error("Failed to save profile:", error);
      showToast("\uD504\uB85C\uD544 \uC800\uC7A5\uC5D0 \uC2E4\uD328\uD588\uC2B5\uB2C8\uB2E4: " + error.message, { isError: true });
    } finally {
      saveBtn.disabled = false;
      saveBtn.textContent = "\uC800\uC7A5\uD558\uAE30";
    }
  }
  async function loadOrderHistory() {
    const container = document.getElementById("order-history-list");
    const currentUser = pb.authStore.model;
    if (!currentUser || !container) return;
    try {
      const orders = await pb.collection("orders").getFullList({
        filter: `user="${currentUser.id}"`,
        sort: "-created",
        expand: "user"
        // Expand if needed, though we have currentUser
      });
      if (orders.length === 0) {
        container.innerHTML = '<div class="text-center py-6 text-gray-400 text-sm">\uC8FC\uBB38 \uB0B4\uC5ED\uC774 \uC5C6\uC2B5\uB2C8\uB2E4.</div>';
        return;
      }
      let html = "";
      for (const order of orders) {
        const date = new Date(order.created).toLocaleDateString("ko-KR", {
          year: "numeric",
          month: "long",
          day: "numeric"
        });
        let statusBadge = "";
        switch (order.status) {
          case "paid":
            statusBadge = '<span class="px-2 py-0.5 rounded-full bg-green-100 text-green-800 text-xs font-semibold">\uACB0\uC81C\uC644\uB8CC</span>';
            break;
          case "pending":
            statusBadge = '<span class="px-2 py-0.5 rounded-full bg-yellow-100 text-yellow-800 text-xs font-semibold">\uB300\uAE30\uC911</span>';
            break;
          case "preparing":
            statusBadge = '<span class="px-2 py-0.5 rounded-full bg-blue-100 text-blue-800 text-xs font-semibold">\uC0C1\uD488\uC900\uBE44\uC911</span>';
            break;
          case "shipping":
            statusBadge = '<span class="px-2 py-0.5 rounded-full bg-indigo-100 text-indigo-800 text-xs font-semibold">\uBC30\uC1A1\uC911</span>';
            break;
          case "delivered":
            statusBadge = '<span class="px-2 py-0.5 rounded-full bg-emerald-100 text-emerald-800 text-xs font-semibold">\uBC30\uC1A1\uC644\uB8CC</span>';
            break;
          case "cancelled":
            statusBadge = '<span class="px-2 py-0.5 rounded-full bg-red-100 text-red-800 text-xs font-semibold">\uC8FC\uBB38\uCDE8\uC18C</span>';
            break;
          default:
            statusBadge = '<span class="px-2 py-0.5 rounded-full bg-gray-100 text-gray-800 text-xs font-semibold">' + order.status + "</span>";
        }
        let itemsHtml = "";
        if (order.items && order.items.length > 0) {
          for (const item of order.items) {
            let productTitle = "\uC0C1\uD488\uC815\uBCF4 \uC5C6\uC74C";
            let imgUrl = "https://via.placeholder.com/60";
            try {
              const product = await pb.collection("products").getOne(item.product_id);
              productTitle = product.title;
              if (product.images && product.images.length > 0) {
                imgUrl = pb.files.getUrl(product, product.images[0], { thumb: "100x100" });
              }
            } catch (e) {
              productTitle = "\uC0AD\uC81C\uB41C \uC0C1\uD488";
            }
            itemsHtml += `
                        <div class="flex items-center gap-3 mt-2">
                            <img src="${imgUrl}" class="w-12 h-12 object-cover rounded bg-gray-100 flex-shrink-0">
                            <div class="flex-1 min-w-0">
                                <p class="text-sm font-medium text-gray-900 truncate">${productTitle}</p>
                                <p class="text-xs text-gray-500">${item.qty}\uAC1C / ${(item.price || 0).toLocaleString()}\uC6D0</p>
                            </div>
                        </div>
                    `;
          }
        }
        const canCancel = order.status === "pending" || order.status === "paid";
        const cancelBtnHtml = canCancel ? `
                <button onclick="Profile.cancelOrder('${order.id}')" class="mt-2 w-full py-2 px-4 bg-red-500 hover:bg-red-600 text-white text-sm font-medium rounded-lg transition-colors">
                    \uC8FC\uBB38 \uCDE8\uC18C
                </button>
            ` : "";
        const canTrack = order.status === "shipping" || order.status === "delivered";
        const trackingNumber = order.tracking_number || "";
        const carrier = order.carrier || "";
        let trackingBtnHtml = "";
        if (canTrack && trackingNumber) {
          trackingBtnHtml = `
                    <button onclick="Profile.openTrackingModal('${carrier}', '${trackingNumber}')" class="mt-2 w-full py-2 px-4 bg-indigo-500 hover:bg-indigo-600 text-white text-sm font-medium rounded-lg transition-colors flex items-center justify-center gap-2">
                        <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2m-3 7h3m-3 4h3m-6-4h.01M9 16h.01"/>
                        </svg>
                        \uBC30\uC1A1\uC870\uD68C
                    </button>
                `;
        } else if (order.status === "preparing") {
          trackingBtnHtml = `
                    <div class="mt-2 w-full py-2 px-4 bg-gray-100 text-gray-500 text-sm font-medium rounded-lg text-center">
                        \uC0C1\uD488 \uC900\uBE44\uC911\uC785\uB2C8\uB2E4
                    </div>
                `;
        } else if (order.status === "paid") {
          trackingBtnHtml = `
                    <div class="mt-2 w-full py-2 px-4 bg-gray-100 text-gray-500 text-sm font-medium rounded-lg text-center">
                        \uBC30\uC1A1 \uC900\uBE44 \uB300\uAE30\uC911
                    </div>
                `;
        }
        html += `
            <div class="border rounded-lg p-4 bg-gray-50" id="order-${order.id}">
                <div class="flex justify-between items-start mb-2">
                    <div>
                        <p class="text-xs text-gray-500 mb-1">${date}</p>
                        <p class="text-sm font-bold text-gray-900">\uC8FC\uBB38\uBC88\uD638: ${order.payment_id || order.id.substring(0, 8)}</p>
                    </div>
                    ${statusBadge}
                </div>
                <div class="divide-y divide-gray-200">
                    ${itemsHtml}
                </div>
                <div class="mt-3 pt-3 border-t border-gray-200 flex justify-between items-center">
                    <span class="text-sm font-medium text-gray-600">\uCD1D \uACB0\uC81C\uAE08\uC561</span>
                    <span class="text-base font-bold text-blue-600">${(order.total_amount || 0).toLocaleString()}\uC6D0</span>
                </div>
                ${trackingBtnHtml}
                ${cancelBtnHtml}
            </div>
            `;
      }
      container.innerHTML = html;
    } catch (error) {
      console.error("Failed to load order history:", error);
      container.innerHTML = '<div class="text-center py-6 text-red-500 text-sm">\uC8FC\uBB38 \uB0B4\uC5ED\uC744 \uBD88\uB7EC\uC624\uB294\uB370 \uC2E4\uD328\uD588\uC2B5\uB2C8\uB2E4.</div>';
    }
  }
  async function handlePasswordChange() {
    const changeBtn = document.getElementById("change-password-btn");
    const currentUser = pb.authStore.model;
    if (!currentUser) {
      showToast("\uB85C\uADF8\uC778\uC774 \uD544\uC694\uD569\uB2C8\uB2E4.", { isError: true });
      return;
    }
    const oldPassword = document.getElementById("oldPassword").value;
    const newPassword = document.getElementById("newPassword").value;
    const newPasswordConfirm = document.getElementById("newPasswordConfirm").value;
    if (!oldPassword || !newPassword || !newPasswordConfirm) {
      showToast("\uBAA8\uB4E0 \uD544\uB4DC\uB97C \uC785\uB825\uD574\uC8FC\uC138\uC694.", { isError: true });
      return;
    }
    if (newPassword !== newPasswordConfirm) {
      showToast("\uC0C8 \uBE44\uBC00\uBC88\uD638\uAC00 \uC77C\uCE58\uD558\uC9C0 \uC54A\uC2B5\uB2C8\uB2E4.", { isError: true });
      return;
    }
    changeBtn.disabled = true;
    changeBtn.textContent = "\uBCC0\uACBD\uC911...";
    try {
      await pb.collection("users").update(currentUser.id, {
        oldPassword,
        password: newPassword,
        passwordConfirm: newPasswordConfirm
      });
      showToast("\uBE44\uBC00\uBC88\uD638\uAC00 \uC131\uACF5\uC801\uC73C\uB85C \uBCC0\uACBD\uB418\uC5C8\uC2B5\uB2C8\uB2E4.", { isError: false });
      document.getElementById("oldPassword").value = "";
      document.getElementById("newPassword").value = "";
      document.getElementById("newPasswordConfirm").value = "";
    } catch (error) {
      console.error("Failed to change password:", error);
      showToast("\uBE44\uBC00\uBC88\uD638 \uBCC0\uACBD \uC2E4\uD328: " + error.message, { isError: true });
    } finally {
      changeBtn.disabled = false;
      changeBtn.textContent = "\uBE44\uBC00\uBC88\uD638 \uBCC0\uACBD";
    }
  }
  async function cancelOrder(orderId) {
    if (!confirm("\uC815\uB9D0\uB85C \uC774 \uC8FC\uBB38\uC744 \uCDE8\uC18C\uD558\uC2DC\uACA0\uC2B5\uB2C8\uAE4C?\n\uCDE8\uC18C \uD6C4\uC5D0\uB294 \uB418\uB3CC\uB9B4 \uC218 \uC5C6\uC2B5\uB2C8\uB2E4.")) {
      return;
    }
    try {
      await pb.collection("orders").update(orderId, {
        status: "cancelled"
      });
      showToast("\uC8FC\uBB38\uC774 \uC131\uACF5\uC801\uC73C\uB85C \uCDE8\uC18C\uB418\uC5C8\uC2B5\uB2C8\uB2E4.", { isError: false });
      loadOrderHistory();
    } catch (error) {
      console.error("Failed to cancel order:", error);
      showToast("\uC8FC\uBB38 \uCDE8\uC18C\uC5D0 \uC2E4\uD328\uD588\uC2B5\uB2C8\uB2E4: " + error.message, { isError: true });
    }
  }
  var carriers = {
    "cj": { name: "CJ\uB300\uD55C\uD1B5\uC6B4", url: "https://www.cjlogistics.com/ko/tool/parcel/tracking?gnbInvcNo=" },
    "lotte": { name: "\uB86F\uB370\uD0DD\uBC30", url: "https://www.lotteglogis.com/home/reservation/tracking/index?InvNo=" },
    "hanjin": { name: "\uD55C\uC9C4\uD0DD\uBC30", url: "https://www.hanjin.com/kor/CMS/DeliveryMgr/WaybillResult.do?mession=open&wblnum=" },
    "post": { name: "\uC6B0\uCCB4\uAD6D\uD0DD\uBC30", url: "https://service.epost.go.kr/trace.RetrieveDomRi498.postal?sid1=" },
    "logen": { name: "\uB85C\uC820\uD0DD\uBC30", url: "https://www.ilogen.com/web/personal/trace/" },
    "cu": { name: "CU \uD3B8\uC758\uC810\uD0DD\uBC30", url: "https://www.cupost.co.kr/postbox/delivery/localResult.cupost?invoice_no=" },
    "gs": { name: "GS Postbox \uD0DD\uBC30", url: "https://www.cvsnet.co.kr/invoice/tracking.do?invoice_no=" },
    "kdexp": { name: "\uACBD\uB3D9\uD0DD\uBC30", url: "https://kdexp.com/basicNew498.kd?barcode=" }
  };
  function openTrackingModal(carrier, trackingNumber) {
    const modal = document.getElementById("tracking-modal");
    const carrierSelect = document.getElementById("tracking-carrier");
    const numberInput = document.getElementById("tracking-number");
    if (carrier && carriers[carrier]) {
      carrierSelect.value = carrier;
    }
    if (trackingNumber) {
      numberInput.value = trackingNumber;
    }
    if (modal) modal.classList.remove("hidden");
  }
  function closeTrackingModal() {
    const modal = document.getElementById("tracking-modal");
    if (modal) modal.classList.add("hidden");
  }
  function trackDelivery() {
    const carrier = document.getElementById("tracking-carrier").value;
    const trackingNumber = document.getElementById("tracking-number").value.trim();
    if (!carrier) {
      showToast("\uD0DD\uBC30\uC0AC\uB97C \uC120\uD0DD\uD574\uC8FC\uC138\uC694.", { isError: true });
      return;
    }
    if (!trackingNumber) {
      showToast("\uC6B4\uC1A1\uC7A5 \uBC88\uD638\uB97C \uC785\uB825\uD574\uC8FC\uC138\uC694.", { isError: true });
      return;
    }
    const carrierInfo = carriers[carrier];
    if (carrierInfo) {
      window.open(carrierInfo.url + trackingNumber, "_blank");
    } else {
      showToast("\uC9C0\uC6D0\uD558\uC9C0 \uC54A\uB294 \uD0DD\uBC30\uC0AC\uC785\uB2C8\uB2E4.", { isError: true });
    }
  }
  var Profile = {
    init: init3,
    cancelOrder,
    openTrackingModal,
    closeTrackingModal,
    trackDelivery
  };
  if (typeof window !== "undefined") {
    window.Profile = Profile;
  }
  if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", init3);
  } else {
    init3();
  }

  // <stdin>
  if (typeof window !== "undefined") {
    window.PBClient = {
      getInstance,
      isAdmin,
      getUser,
      isAuthenticated
    };
    window.Utils = utils_exports;
    window.pb = pb;
    window.Cart = Cart;
    window.Auth = Auth;
    window.ProductsApi = ProductsApi;
    window.productsApi = productsApi;
    window.Reviews = Reviews;
    window.QnA = QnA;
    window.Profile = Profile;
  }
  function initializeApp() {
    console.log("[Main] Initializing application...");
    console.log("[Main] Application initialized");
  }
  if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", initializeApp);
  } else {
    initializeApp();
  }
})();
