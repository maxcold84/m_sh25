(() => {
  var __defProp = Object.defineProperty;
  var __export = (target, all) => {
    for (var name in all)
      __defProp(target, name, { get: all[name], enumerable: true });
  };

  // ns-hugo-imp:C:\hugo\ex\shop\assets\js\core\runtime-config.js
  var configCache = /* @__PURE__ */ new Map();
  function normalizeConfigValue(value, id) {
    if (value && typeof value === "object" && !Array.isArray(value)) {
      return value;
    }
    if (typeof value === "string") {
      try {
        const nestedValue = JSON.parse(value);
        if (nestedValue && typeof nestedValue === "object" && !Array.isArray(nestedValue)) {
          return nestedValue;
        }
      } catch (error) {
        console.warn(`Failed to parse nested runtime config: ${id}`, error);
      }
    }
    return {};
  }
  function readJsonScript(id) {
    if (configCache.has(id)) {
      return configCache.get(id);
    }
    const scriptEl = document.getElementById(id);
    if (!scriptEl) {
      configCache.set(id, {});
      return {};
    }
    try {
      const rawValue = JSON.parse(scriptEl.textContent || "{}");
      const value = normalizeConfigValue(rawValue, id);
      configCache.set(id, value);
      return value;
    } catch (error) {
      console.warn(`Failed to parse runtime config: ${id}`, error);
      configCache.set(id, {});
      return {};
    }
  }
  function getSiteConfig() {
    return readJsonScript("site-config");
  }
  function getShopConfig() {
    return readJsonScript("shop-config");
  }
  function getPocketBaseUrl() {
    return getSiteConfig().pocketbaseUrl || "http://127.0.0.1:8090";
  }

  // ns-hugo-imp:C:\hugo\ex\shop\assets\js\core\pb-client.js
  var _instance = null;
  var getUrl = () => getPocketBaseUrl();
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
    return document.documentElement.lang === "ko" || location.pathname.includes("/korean/");
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
  var utils_default = Utils;

  // ns-hugo-imp:C:\hugo\ex\shop\assets\js\cart.js
  function withNoAutoCancel(options = {}) {
    return {
      ...options,
      requestKey: null
    };
  }
  function isKoreanPage() {
    return document.documentElement.lang === "ko" || location.pathname.includes("/korean/");
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
  function getDisplayPrice(price) {
    if (isKoreanPage() && price < 1e3) {
      return price * 1e3;
    }
    if (!isKoreanPage() && price > 1e3) {
      return price / 1e3;
    }
    return price;
  }
  function normalizeNumber(value, fallback = 0) {
    const parsed = Number(value);
    return Number.isFinite(parsed) ? parsed : fallback;
  }
  function escapeHtml2(value) {
    return String(value ?? "").replace(/[&<>"']/g, (char) => ({
      "&": "&amp;",
      "<": "&lt;",
      ">": "&gt;",
      '"': "&quot;",
      "'": "&#39;"
    })[char]);
  }
  function updateCartSummary(items) {
    const count = items.reduce((sum, item) => sum + normalizeNumber(item.quantity), 0);
    const total = items.reduce((sum, item) => sum + getDisplayPrice(normalizeNumber(item.price)) * normalizeNumber(item.quantity), 0);
    const formattedTotal = formatCurrency(total);
    const countElement = document.getElementById("cart-item-count");
    if (countElement) {
      countElement.textContent = count;
      countElement.classList.toggle("hidden", count === 0);
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
      footerEl.classList.toggle("hidden", items.length === 0);
    }
    return { count, total, formattedTotal };
  }
  function renderCartError(error) {
    const title = isKoreanPage() ? "\uC7A5\uBC14\uAD6C\uB2C8\uB97C \uBD88\uB7EC\uC624\uB294 \uC911 \uC624\uB958\uAC00 \uBC1C\uC0DD\uD588\uC2B5\uB2C8\uB2E4." : "We could not load your cart right now.";
    const detail = error?.message ? escapeHtml2(error.message) : "";
    const retryLabel = isKoreanPage() ? "\uB2E4\uC2DC \uC2DC\uB3C4" : "Retry";
    return `
        <div class="cart-error">
            <p class="cart-error-message">${title}</p>
            ${detail ? `<p class="cart-error-detail">${detail}</p>` : ""}
            <button type="button" data-cart-action="retry" class="retry-btn">${retryLabel}</button>
        </div>
    `;
  }
  function isAutoCancelledError(error) {
    return Boolean(
      error?.isAbort || error?.originalError?.name === "AbortError" || String(error?.message || "").includes("autocancelled")
    );
  }
  async function fetchProductsByIds(productIds) {
    const uniqueIds = [...new Set(productIds.filter(Boolean))];
    if (uniqueIds.length === 0) {
      return /* @__PURE__ */ new Map();
    }
    try {
      const filter = uniqueIds.map((id) => `id="${escapeFilterValue(id)}"`).join(" || ");
      const products = await pb.collection("products").getFullList(withNoAutoCancel({
        filter
      }));
      return new Map(products.map((product) => [product.id, product]));
    } catch (error) {
      console.warn("Batch product lookup failed, falling back to per-item fetch:", error);
      const entries = await Promise.allSettled(
        uniqueIds.map(async (id) => {
          const product = await pb.collection("products").getOne(id, withNoAutoCancel());
          return [id, product];
        })
      );
      return new Map(
        entries.filter((entry) => entry.status === "fulfilled").map((entry) => entry.value)
      );
    }
  }
  function parseJsonDataAttribute(value) {
    if (!value) {
      return {};
    }
    try {
      return JSON.parse(value);
    } catch (error) {
      console.warn("Failed to parse cart button payload:", error);
      return {};
    }
  }
  function buildCartItemFromButton(button) {
    if (!button) {
      return null;
    }
    const price = Number(button.dataset.cartPrice);
    const id = button.dataset.cartId || "";
    const name = button.dataset.cartName || "";
    if (!id || !name || !Number.isFinite(price)) {
      return null;
    }
    return {
      id,
      name,
      price,
      image: button.dataset.cartImage || "",
      options: parseJsonDataAttribute(button.dataset.cartOptions)
    };
  }
  var Cart = {
    config: null,
    realtimeCartId: null,
    realtimeCleanup: null,
    lastItemsSnapshot: [],
    async init(config) {
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
        try {
          const carts = await pb.collection("carts").getList(1, 1, {
            filter: `user="${escapeFilterValue(userId)}"`,
            sort: "-created"
          });
          if (carts.items.length > 0) {
            const userCart = carts.items[0];
            const localCartId2 = localStorage.getItem("cart_id");
            if (localCartId2 && localCartId2 !== userCart.id) {
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
              quantity: normalizeNumber(existingItem.quantity) + normalizeNumber(item.quantity, 1),
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
            quantity: normalizeNumber(existingItem.quantity) + quantityToAdd,
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
        const item = await pb.collection("cart_items").getOne(itemId, withNoAutoCancel());
        const newQuantity = normalizeNumber(item.quantity, 1) + delta;
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
        const updatedItem = await pb.collection("cart_items").update(itemId, withNoAutoCancel({
          quantity: newQuantity
        }));
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
        qtyEl.textContent = normalizeNumber(item.quantity, 1);
      }
      const priceEl = itemEl.querySelector(".item-price");
      if (priceEl) {
        priceEl.textContent = this.formatCurrency(getDisplayPrice(normalizeNumber(item.price)) * normalizeNumber(item.quantity, 1));
      }
      const minusBtn = itemEl.querySelector('button[aria-label="Decrease quantity"]');
      if (minusBtn) {
        minusBtn.disabled = normalizeNumber(item.quantity, 1) <= 1;
      }
    },
    async updateCartTotals() {
      const items = await this.getItems();
      updateCartSummary(items);
    },
    formatCurrency(amount) {
      return formatCurrency(amount);
    },
    async removeItem(itemId) {
      try {
        await pb.collection("cart_items").delete(itemId, withNoAutoCancel());
        await this.renderCart();
      } catch (error) {
        console.error("Error removing item:", error);
        this.notify(isKoreanPage() ? "\uC0C1\uD488 \uC0AD\uC81C\uC5D0 \uC2E4\uD328\uD588\uC2B5\uB2C8\uB2E4." : "Failed to remove item.", true);
      }
    },
    async getItems() {
      const cartId = localStorage.getItem("cart_id");
      if (!cartId) {
        this.lastItemsSnapshot = [];
        return [];
      }
      try {
        const records = await pb.collection("cart_items").getFullList(withNoAutoCancel({
          filter: `cart="${escapeFilterValue(cartId)}"`,
          sort: "-created"
        }));
        const productMap = await fetchProductsByIds(records.map((item) => item.product_id));
        const items = records.map((item) => {
          const options = normalizeOptions(item.options);
          const displayOptions = splitOptions(options).variantOptions;
          const product = productMap.get(item.product_id);
          const quantity = normalizeNumber(item.quantity, 1);
          const displayPrice = getDisplayPrice(normalizeNumber(item.price));
          return {
            ...item,
            options,
            optionSummary: formatOptionSummary(displayOptions),
            quantity,
            formattedPrice: this.formatCurrency(displayPrice * quantity),
            isMinQuantity: quantity <= 1,
            productLink: buildProductUrl(product, options)
          };
        });
        this.lastItemsSnapshot = items;
        return items;
      } catch (error) {
        console.error("Error fetching items:", error);
        if (isAutoCancelledError(error) && this.lastItemsSnapshot.length > 0) {
          return this.lastItemsSnapshot;
        }
        return [];
      }
    },
    async checkout() {
      const items = await this.getItems();
      if (items.length === 0) {
        this.notify(isKoreanPage() ? "\uC7A5\uBC14\uAD6C\uB2C8\uAC00 \uBE44\uC5B4 \uC788\uC2B5\uB2C8\uB2E4." : "Cart is empty.", true);
        return;
      }
      const baseUrl = location.origin;
      const lang = document.documentElement.lang || "en";
      location.href = `${baseUrl}/${lang}/checkout/`;
      this.toggleDrawer(false);
    },
    async renderCart() {
      const items = await this.getItems();
      const { formattedTotal } = updateCartSummary(items);
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
          container.innerHTML = renderCartError(error);
        }
      }
    },
    toggleDrawer(forceOpen) {
      const drawer = document.getElementById("cart-drawer");
      const overlay = document.getElementById("cart-overlay");
      if (!drawer || !overlay) {
        return;
      }
      const isOpen = typeof forceOpen === "boolean" ? forceOpen : !drawer.classList.contains("open");
      drawer.classList.toggle("open", isOpen);
      overlay.classList.toggle("open", isOpen);
      document.body.classList.toggle("cart-drawer-open", isOpen);
      if (isOpen) {
        this.renderCart();
      }
    }
  };
  var cartEventsBound = false;
  function setupCartEvents() {
    if (cartEventsBound) {
      return;
    }
    cartEventsBound = true;
    document.addEventListener("click", function(event) {
      const actionEl = event.target.closest("[data-cart-action]");
      if (!actionEl) {
        return;
      }
      const action = actionEl.dataset.cartAction;
      switch (action) {
        case "toggle":
          event.preventDefault();
          Cart.toggleDrawer();
          break;
        case "add-item": {
          event.preventDefault();
          const payload = buildCartItemFromButton(actionEl);
          if (payload) {
            Cart.addItem(payload);
          } else {
            console.warn("Cart add-item button is missing required data attributes.");
          }
          break;
        }
        case "checkout":
          event.preventDefault();
          Cart.checkout();
          break;
        case "change-quantity": {
          event.preventDefault();
          const itemId = actionEl.dataset.cartItemId;
          const delta = Number(actionEl.dataset.cartDelta);
          if (itemId && Number.isFinite(delta)) {
            Cart.changeQuantity(itemId, delta);
          }
          break;
        }
        case "remove-item":
          event.preventDefault();
          if (actionEl.dataset.cartItemId) {
            Cart.removeItem(actionEl.dataset.cartItemId);
          }
          break;
        case "retry":
          event.preventDefault();
          Cart.renderCart();
          break;
        default:
          break;
      }
    });
    document.addEventListener("change", function(event) {
      const actionEl = event.target.closest("[data-nav-action]");
      if (!actionEl) {
        return;
      }
      if (actionEl.dataset.navAction === "language-select") {
        const nextUrl = actionEl.value;
        if (nextUrl) {
          location.href = nextUrl;
        }
      }
    });
    document.body.addEventListener("cart-updated", function() {
      Cart.renderCart();
    });
  }
  if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", setupCartEvents);
  } else {
    setupCartEvents();
  }

  // ns-hugo-imp:C:\hugo\ex\shop\assets\js\core\email-suggestion.js
  function levenshtein(a, b) {
    const source = a.toLowerCase();
    const target = b.toLowerCase();
    const rows = source.length + 1;
    const cols = target.length + 1;
    const matrix = Array.from({ length: rows }, () => Array(cols).fill(0));
    for (let row = 0; row < rows; row += 1) {
      matrix[row][0] = row;
    }
    for (let col = 0; col < cols; col += 1) {
      matrix[0][col] = col;
    }
    for (let row = 1; row < rows; row += 1) {
      for (let col = 1; col < cols; col += 1) {
        const cost = source[row - 1] === target[col - 1] ? 0 : 1;
        matrix[row][col] = Math.min(
          matrix[row - 1][col] + 1,
          matrix[row][col - 1] + 1,
          matrix[row - 1][col - 1] + cost
        );
      }
    }
    return matrix[rows - 1][cols - 1];
  }
  function getSuggestedEmail(email, domains = []) {
    if (typeof email !== "string") {
      return null;
    }
    const trimmed = email.trim();
    const atIndex = trimmed.indexOf("@");
    if (atIndex <= 0 || atIndex === trimmed.length - 1) {
      return null;
    }
    const localPart = trimmed.slice(0, atIndex);
    const currentDomain = trimmed.slice(atIndex + 1).toLowerCase();
    const normalizedDomains = domains.filter(Boolean).map((domain) => domain.toLowerCase());
    if (!currentDomain || normalizedDomains.includes(currentDomain)) {
      return null;
    }
    const prefixMatch = normalizedDomains.find((domain) => domain.startsWith(currentDomain));
    if (prefixMatch) {
      return `${localPart}@${prefixMatch}`;
    }
    let bestDomain = null;
    let bestDistance = Number.POSITIVE_INFINITY;
    normalizedDomains.forEach((domain) => {
      const distance = levenshtein(currentDomain, domain);
      if (distance < bestDistance) {
        bestDistance = distance;
        bestDomain = domain;
      }
    });
    if (!bestDomain || bestDistance > 2) {
      return null;
    }
    return `${localPart}@${bestDomain}`;
  }

  // ns-hugo-imp:C:\hugo\ex\shop\assets\js\auth.js
  var Auth = /* @__PURE__ */ (function() {
    let nicknameChecked = false;
    let checkedNickname = "";
    let nicknameCheckTimeout = null;
    let nicknameCheckRequestId = 0;
    const AUTH_REDIRECT_KEY = "auth_redirect";
    const AUTH_TABS = ["login", "signup"];
    let oauthProvidersPromise = null;
    function withNoAutoCancel3(options = {}) {
      return {
        ...options,
        requestKey: null
      };
    }
    function escapeFilterValue3(value) {
      return String(value).replace(/\\/g, "\\\\").replace(/"/g, '\\"');
    }
    function getPocketBaseErrorMessage2(error, fallbackMessage) {
      const fieldErrors = error?.response?.data || error?.data?.data || {};
      const fieldMessages = Object.values(fieldErrors).map((detail) => detail?.message).filter(Boolean);
      if (fieldMessages.length > 0) {
        return fieldMessages.join(" / ");
      }
      return error?.response?.message || error?.message || fallbackMessage;
    }
    function setSubmitButtonState(form, isPending, pendingLabel, defaultLabel) {
      const submitButton = form?.querySelector('button[type="submit"]');
      if (!submitButton) {
        return;
      }
      submitButton.disabled = isPending;
      submitButton.textContent = isPending ? pendingLabel : defaultLabel;
    }
    function init4() {
      updateAuthUI();
      const isAuthPage = location.pathname.includes("/login/") || location.pathname.includes("/signup/") || location.pathname.endsWith("/login") || location.pathname.endsWith("/signup");
      if (pb.authStore.isValid && isAuthPage) {
        console.log("[Auth] Already logged in, redirecting to home...");
        location.href = getHomeUrl();
        return;
      }
      pb.authStore.onChange(() => {
        updateAuthUI();
      });
      setupAuthTabs();
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
      void syncOAuthButtons();
      setupNicknameCheck();
    }
    function setupAuthTabs() {
      const tabButtons = Array.from(document.querySelectorAll("[data-auth-tab]"));
      const tabPanels = new Map(
        Array.from(document.querySelectorAll("[data-auth-panel]")).map((panel) => [panel.dataset.authPanel, panel])
      );
      if (!tabButtons.length || !tabPanels.size) {
        return;
      }
      const getDefaultTab = () => {
        const activeButton = tabButtons.find((button) => button.getAttribute("aria-selected") === "true");
        const fallbackTab = activeButton?.dataset.authTab || tabButtons[0]?.dataset.authTab || "login";
        return AUTH_TABS.includes(fallbackTab) ? fallbackTab : "login";
      };
      const setActiveTab = (tabName, options = {}) => {
        if (!AUTH_TABS.includes(tabName) || !tabPanels.has(tabName)) {
          return;
        }
        const { updateUrl = true } = options;
        tabButtons.forEach((button) => {
          const isActive = button.dataset.authTab === tabName;
          button.classList.toggle("bg-white", isActive);
          button.classList.toggle("text-slate-900", isActive);
          button.classList.toggle("shadow-sm", isActive);
          button.classList.toggle("ring-1", isActive);
          button.classList.toggle("ring-slate-200", isActive);
          button.classList.toggle("text-slate-500", !isActive);
          button.setAttribute("aria-selected", String(isActive));
          button.tabIndex = isActive ? 0 : -1;
        });
        tabPanels.forEach((panel, panelName) => {
          panel.hidden = panelName !== tabName;
        });
        if (updateUrl) {
          const nextUrl = new URL(location.href);
          nextUrl.hash = tabName;
          history.replaceState(null, "", nextUrl.toString());
        }
      };
      const requestedTab = location.hash.replace("#", "");
      setActiveTab(AUTH_TABS.includes(requestedTab) ? requestedTab : getDefaultTab(), { updateUrl: false });
      tabButtons.forEach((button) => {
        button.addEventListener("click", () => {
          setActiveTab(button.dataset.authTab || "login");
        });
      });
      addEventListener("hashchange", () => {
        const hashTab = location.hash.replace("#", "");
        if (AUTH_TABS.includes(hashTab)) {
          setActiveTab(hashTab, { updateUrl: false });
        }
      });
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
    function isKoreanLocale() {
      return document.documentElement.lang === "ko" || location.pathname.includes("/ko/");
    }
    function getAuthMessageElement() {
      return document.getElementById("auth-message");
    }
    function getOAuthDisplayName(provider) {
      if (!provider) {
        return "OAuth";
      }
      return provider.charAt(0).toUpperCase() + provider.slice(1);
    }
    function getOAuthUnavailableMessage(provider) {
      const providerName = getOAuthDisplayName(provider);
      return isKoreanLocale() ? `${providerName} \uB85C\uADF8\uC778\uC774 \uC544\uC9C1 \uC124\uC815\uB418\uC9C0 \uC54A\uC558\uC2B5\uB2C8\uB2E4. PocketBase OAuth provider \uC124\uC815\uC744 \uBA3C\uC800 \uC644\uB8CC\uD574 \uC8FC\uC138\uC694.` : `${providerName} login is not configured yet. Please finish the PocketBase OAuth provider setup first.`;
    }
    function getOAuthProvidersEmptyMessage() {
      return isKoreanLocale() ? "\uD604\uC7AC \uC0AC\uC6A9 \uAC00\uB2A5\uD55C \uC18C\uC15C \uB85C\uADF8\uC778\uC774 \uC5C6\uC2B5\uB2C8\uB2E4. PocketBase OAuth provider \uC124\uC815\uC744 \uD655\uC778\uD574 \uC8FC\uC138\uC694." : "No social login providers are available right now. Please check the PocketBase OAuth provider setup.";
    }
    function getOAuthProvidersLoadErrorMessage() {
      return isKoreanLocale() ? "\uC18C\uC15C \uB85C\uADF8\uC778 \uC124\uC815\uC744 \uD655\uC778\uD558\uC9C0 \uBABB\uD588\uC2B5\uB2C8\uB2E4. \uC7A0\uC2DC \uD6C4 \uB2E4\uC2DC \uC2DC\uB3C4\uD574 \uC8FC\uC138\uC694." : "We could not verify the social login configuration. Please try again shortly.";
    }
    function getOAuthLoginFailedMessage(provider, error) {
      const providerName = getOAuthDisplayName(provider);
      const rawMessage = error?.response?.message || error?.data?.message || error?.message || "";
      if (/missing or invalid provider/i.test(rawMessage)) {
        return getOAuthUnavailableMessage(provider);
      }
      return isKoreanLocale() ? `${providerName} \uB85C\uADF8\uC778\uC5D0 \uC2E4\uD328\uD588\uC2B5\uB2C8\uB2E4.` : `${providerName} sign-in failed.`;
    }
    async function getAvailableOAuthProviders(forceRefresh = false) {
      if (!forceRefresh && oauthProvidersPromise) {
        return oauthProvidersPromise;
      }
      oauthProvidersPromise = pb.collection("users").listAuthMethods().then((authMethods) => new Set((authMethods.authProviders || []).map((provider) => provider.name))).catch((error) => {
        oauthProvidersPromise = null;
        throw error;
      });
      return oauthProvidersPromise;
    }
    async function syncOAuthButtons() {
      const oauthButtons = Array.from(document.querySelectorAll(".oauth-login-btn"));
      const oauthGrid = document.getElementById("oauth-login-grid");
      const oauthStatus = document.getElementById("oauth-provider-status");
      if (!oauthButtons.length) {
        return;
      }
      try {
        const availableProviders = await getAvailableOAuthProviders();
        let visibleButtonCount = 0;
        oauthButtons.forEach((button) => {
          const provider = button.dataset.provider || "";
          const isAvailable = availableProviders.has(provider);
          button.hidden = !isAvailable;
          button.disabled = !isAvailable;
          button.setAttribute("aria-disabled", String(!isAvailable));
          if (isAvailable) {
            visibleButtonCount += 1;
          }
        });
        if (oauthGrid) {
          oauthGrid.hidden = visibleButtonCount === 0;
        }
        if (oauthStatus) {
          oauthStatus.hidden = visibleButtonCount !== 0;
          oauthStatus.textContent = visibleButtonCount === 0 ? getOAuthProvidersEmptyMessage() : "";
        }
      } catch (error) {
        console.error("Failed to load OAuth auth methods:", error);
        oauthButtons.forEach((button) => {
          button.hidden = false;
          button.disabled = false;
          button.removeAttribute("aria-disabled");
        });
        if (oauthGrid) {
          oauthGrid.hidden = false;
        }
        if (oauthStatus) {
          oauthStatus.hidden = false;
          oauthStatus.textContent = getOAuthProvidersLoadErrorMessage();
        }
      }
    }
    async function handleLogin(event) {
      event.preventDefault();
      const form = event.target;
      const email = form.email.value.trim();
      const password = form.password.value;
      const messageEl = document.getElementById("login-message");
      try {
        setSubmitButtonState(form, true, "\uB85C\uADF8\uC778 \uC911...", "\uB85C\uADF8\uC778");
        showMessage2(messageEl, "\uB85C\uADF8\uC778 \uC911...", "info");
        await pb.collection("users").authWithPassword(email, password);
        showMessage2(messageEl, "\uB85C\uADF8\uC778 \uC131\uACF5!", "success");
        showToast3("\uB85C\uADF8\uC778 \uC131\uACF5!");
        const rememberEmailCheckbox = document.getElementById("remember-email");
        if (rememberEmailCheckbox && rememberEmailCheckbox.checked) {
          localStorage.setItem("remembered_email", email);
        } else {
          localStorage.removeItem("remembered_email");
        }
        setTimeout(() => {
          location.href = consumeAuthRedirect();
        }, 500);
      } catch (error) {
        console.error("Login failed:", error);
        showMessage2(messageEl, "\uC774\uBA54\uC77C \uB610\uB294 \uBE44\uBC00\uBC88\uD638\uAC00 \uC77C\uCE58\uD558\uC9C0 \uC54A\uC2B5\uB2C8\uB2E4.", "danger");
      } finally {
        setSubmitButtonState(form, false, "\uB85C\uADF8\uC778 \uC911...", "\uB85C\uADF8\uC778");
      }
    }
    async function handleSignup(event) {
      event.preventDefault();
      const form = event.target;
      const email = form.email.value.trim();
      const password = form.password.value;
      const passwordConfirm = form.passwordConfirm.value;
      const name = form.name?.value.trim() || "";
      const nickname = form.nickname?.value.trim() || "";
      const messageEl = document.getElementById("signup-message");
      if (form.nickname) {
        form.nickname.value = nickname;
      }
      if (!nickname) {
        showMessage2(messageEl, "\uB2C9\uB124\uC784\uC744 \uC785\uB825\uD574\uC8FC\uC138\uC694.", "warning");
        return;
      }
      if (password !== passwordConfirm) {
        showMessage2(messageEl, "\uBE44\uBC00\uBC88\uD638\uAC00 \uC77C\uCE58\uD558\uC9C0 \uC54A\uC2B5\uB2C8\uB2E4.", "danger");
        return;
      }
      if (nickname && (!nicknameChecked || nickname !== checkedNickname)) {
        if (nicknameCheckTimeout) {
          clearTimeout(nicknameCheckTimeout);
          nicknameCheckTimeout = null;
        }
        showMessage2(messageEl, "\uB2C9\uB124\uC784 \uD655\uC778 \uC911...", "info");
        const isNicknameAvailable = await checkNickname(nickname);
        if (!isNicknameAvailable || !nicknameChecked || nickname !== checkedNickname) {
          showMessage2(messageEl, "\uB2C9\uB124\uC784\uC744 \uB2E4\uC2DC \uD655\uC778\uD574\uC8FC\uC138\uC694.", "warning");
          return;
        }
      }
      try {
        setSubmitButtonState(form, true, "\uD68C\uC6D0\uAC00\uC785 \uCC98\uB9AC \uC911...", "\uD68C\uC6D0\uAC00\uC785");
        showMessage2(messageEl, "\uD68C\uC6D0\uAC00\uC785 \uCC98\uB9AC \uC911...", "info");
        const data = {
          email,
          password,
          passwordConfirm,
          name,
          username: nickname || email.split("@")[0]
        };
        await pb.collection("users").create(data, withNoAutoCancel3());
        await pb.collection("users").authWithPassword(email, password, withNoAutoCancel3());
        showMessage2(messageEl, "\uD68C\uC6D0\uAC00\uC785 \uC131\uACF5! \uB85C\uADF8\uC778 \uC911...", "success");
        showToast3("\uD68C\uC6D0\uAC00\uC785\uC744 \uCD95\uD558\uD569\uB2C8\uB2E4!");
        setTimeout(() => {
          location.href = getHomeUrl();
        }, 1e3);
      } catch (error) {
        console.error("Signup failed:", error);
        let errorMsg = "\uD68C\uC6D0\uAC00\uC785\uC5D0 \uC2E4\uD328\uD588\uC2B5\uB2C8\uB2E4.";
        if (error.data?.data?.email) {
          errorMsg = "\uC774\uBBF8 \uAC00\uC785\uB41C \uC774\uBA54\uC77C\uC785\uB2C8\uB2E4.";
        } else if (error.data?.data?.username) {
          errorMsg = getPocketBaseErrorMessage2(error, "\uB2C9\uB124\uC784\uC744 \uB2E4\uC2DC \uD655\uC778\uD574\uC8FC\uC138\uC694.");
        } else {
          errorMsg = getPocketBaseErrorMessage2(error, errorMsg);
        }
        showMessage2(messageEl, errorMsg, "danger");
      } finally {
        setSubmitButtonState(form, false, "\uD68C\uC6D0\uAC00\uC785 \uCC98\uB9AC \uC911...", "\uD68C\uC6D0\uAC00\uC785");
      }
    }
    async function handleOAuth2Login(provider) {
      const authMessageEl = getAuthMessageElement();
      try {
        const availableProviders = await getAvailableOAuthProviders(true);
        if (!availableProviders.has(provider)) {
          showMessage2(authMessageEl, getOAuthUnavailableMessage(provider), "warning");
          return;
        }
        const currentUrl = location.pathname + location.search + location.hash;
        storeAuthRedirect(currentUrl);
        const authData = await pb.collection("users").authWithOAuth2({ provider });
        if (authData && authData.record) {
          showToast3(`${provider} \uB85C\uADF8\uC778 \uC131\uACF5!`);
          location.href = consumeAuthRedirect();
        }
      } catch (error) {
        console.error(`${provider} OAuth login failed:`, error);
        const message = getOAuthLoginFailedMessage(provider, error);
        showMessage2(authMessageEl, message, "danger");
        showToast3(message);
      }
    }
    function logout() {
      pb.authStore.clear();
      showToast3("\uB85C\uADF8\uC544\uC6C3 \uB418\uC5C8\uC2B5\uB2C8\uB2E4.");
      location.href = getHomeUrl();
    }
    function showMessage2(el, message, className) {
      if (el) {
        el.innerText = message;
        el.className = "rounded-xl border px-4 py-3 text-center text-sm " + getMessageToneClasses(className);
        el.hidden = false;
      } else {
        alert(message);
      }
    }
    function getMessageToneClasses(tone) {
      switch (tone) {
        case "success":
          return "border-emerald-200 bg-emerald-50 text-emerald-700";
        case "warning":
          return "border-amber-200 bg-amber-50 text-amber-700";
        case "danger":
          return "border-rose-200 bg-rose-50 text-rose-700";
        case "info":
        default:
          return "border-sky-200 bg-sky-50 text-sky-700";
      }
    }
    function getNicknameToneClass(tone) {
      switch (tone) {
        case "success":
          return "text-emerald-600";
        case "warning":
          return "text-amber-600";
        case "danger":
          return "text-rose-600";
        default:
          return "text-slate-500";
      }
    }
    function getHomeUrl() {
      const isKo = document.documentElement.lang === "ko" || location.pathname.includes("/ko/");
      return isKo ? "/ko/" : "/";
    }
    function isSafeRedirectPath(value) {
      if (typeof value !== "string" || value.length === 0) {
        return false;
      }
      if (!value.startsWith("/") || value.startsWith("//")) {
        return false;
      }
      try {
        const url = new URL(value, location.origin);
        return url.origin === location.origin;
      } catch (error) {
        return false;
      }
    }
    function storeAuthRedirect(value) {
      if (isSafeRedirectPath(value)) {
        sessionStorage.setItem(AUTH_REDIRECT_KEY, value);
        return;
      }
      sessionStorage.removeItem(AUTH_REDIRECT_KEY);
    }
    function consumeAuthRedirect() {
      const storedRedirect = sessionStorage.getItem(AUTH_REDIRECT_KEY);
      sessionStorage.removeItem(AUTH_REDIRECT_KEY);
      return isSafeRedirectPath(storedRedirect) ? storedRedirect : getHomeUrl();
    }
    function showToast3(message) {
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
      const suggestionLink = document.getElementById("email-suggestion-link");
      const suggestionContainer = document.getElementById("email-suggestion");
      const suggestion = getSuggestedEmail(input.value, ["gmail.com", "naver.com", "daum.net", "hanmail.net", "kakao.com"]);
      if (!suggestionLink || !suggestionContainer) {
        return;
      }
      const nextLink = suggestionLink.cloneNode(true);
      suggestionLink.replaceWith(nextLink);
      if (!suggestion) {
        suggestionContainer.hidden = true;
        return;
      }
      nextLink.textContent = suggestion;
      suggestionContainer.hidden = false;
      nextLink.addEventListener("click", (e) => {
        e.preventDefault();
        input.value = suggestion;
        suggestionContainer.hidden = true;
      });
    }
    async function checkNickname(nickname) {
      if (!nickname || nickname.length < 2) {
        updateNicknameStatus("", "");
        nicknameChecked = false;
        checkedNickname = "";
        return false;
      }
      const requestId = ++nicknameCheckRequestId;
      try {
        const result = await pb.collection("users").getList(1, 1, withNoAutoCancel3({
          filter: `username = "${escapeFilterValue3(nickname)}"`
        }));
        if (requestId !== nicknameCheckRequestId) {
          return false;
        }
        if (result.totalItems > 0) {
          updateNicknameStatus("\uC774\uBBF8 \uC0AC\uC6A9 \uC911\uC778 \uB2C9\uB124\uC784\uC785\uB2C8\uB2E4.", "danger");
          nicknameChecked = false;
          checkedNickname = "";
          return false;
        } else {
          updateNicknameStatus("\uC0AC\uC6A9 \uAC00\uB2A5\uD55C \uB2C9\uB124\uC784\uC785\uB2C8\uB2E4.", "success");
          nicknameChecked = true;
          checkedNickname = nickname;
          return true;
        }
      } catch (error) {
        if (requestId !== nicknameCheckRequestId) {
          return false;
        }
        console.error("Nickname check failed:", error);
        updateNicknameStatus(getPocketBaseErrorMessage2(error, "\uB2C9\uB124\uC784 \uD655\uC778 \uC911 \uC624\uB958\uAC00 \uBC1C\uC0DD\uD588\uC2B5\uB2C8\uB2E4."), "warning");
        nicknameChecked = false;
        checkedNickname = "";
        return false;
      }
    }
    function updateNicknameStatus(message, className) {
      const statusEl = document.getElementById("nickname-status");
      if (statusEl) {
        statusEl.textContent = message;
        statusEl.className = "text-sm font-medium " + getNicknameToneClass(className);
        statusEl.hidden = !message;
      }
    }
    function setupNicknameCheck() {
      const nicknameInput = document.getElementById("signup-nickname");
      if (!nicknameInput) return;
      nicknameInput.addEventListener("input", function() {
        const nickname = nicknameInput.value.trim();
        if (nickname !== checkedNickname) {
          nicknameChecked = false;
          checkedNickname = "";
        }
        if (nicknameCheckTimeout) clearTimeout(nicknameCheckTimeout);
        nicknameCheckTimeout = setTimeout(() => {
          nicknameCheckTimeout = null;
          void checkNickname(nickname);
        }, 500);
      });
    }
    return {
      init: init4,
      logout,
      handleOAuth2Login
    };
  })();
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

  // ns-hugo-imp:C:\hugo\ex\shop\assets\js\reviews.js
  var reviewForm = null;
  var reviewList = null;
  var authMessage = null;
  var imageInput = null;
  var imagePreview = null;
  var imageCount = null;
  var selectedFiles = [];
  var currentProductId = null;
  var activeOverlay = null;
  var MAX_REVIEW_IMAGES = 5;
  var MAX_REVIEW_IMAGE_SIZE = 10 * 1024 * 1024;
  var ALLOWED_REVIEW_IMAGE_TYPES = ["image/jpeg", "image/png", "image/gif", "image/webp"];
  function showToast2(message, tone = "success") {
    if (!message) return;
    const existingToast = document.querySelector("[data-review-toast]");
    if (existingToast) {
      existingToast.remove();
    }
    const toast = document.createElement("div");
    toast.className = `review-toast review-toast--${tone}`;
    toast.dataset.reviewToast = tone;
    toast.setAttribute("role", tone === "error" ? "alert" : "status");
    toast.setAttribute("aria-live", tone === "error" ? "assertive" : "polite");
    toast.textContent = message;
    toast.style.opacity = "0";
    toast.style.transform = "translateY(-10px)";
    document.body.appendChild(toast);
    requestAnimationFrame(() => {
      toast.style.opacity = "1";
      toast.style.transform = "translateY(0)";
    });
    setTimeout(() => {
      toast.style.opacity = "0";
      toast.style.transform = "translateY(-10px)";
      setTimeout(() => toast.remove(), 300);
    }, 3e3);
  }
  function showSuccessMessage(message) {
    showToast2(message, "success");
  }
  function showErrorMessage(message) {
    showToast2(message, "error");
  }
  function showConfirmationDialog({ title, message, confirmText = "\uC0AD\uC81C", cancelText = "\uCDE8\uC18C" }) {
    return new Promise((resolve) => {
      closeActiveOverlay();
      const modal = document.createElement("div");
      modal.className = "review-modal";
      modal.dataset.reviewOverlay = "confirm";
      modal.innerHTML = `
            <div class="review-modal__panel">
                <div class="review-modal__header">
                    <div>
                        <p class="review-modal__eyebrow">Confirm action</p>
                        <h4 class="review-modal__title">${escapeHtml(title)}</h4>
                    </div>
                    <button type="button" class="review-btn review-btn--ghost review-btn--icon review-modal__close" data-confirm-cancel aria-label="\uB2EB\uAE30">\xD7</button>
                </div>
                <p class="review-modal__body">${escapeHtml(message)}</p>
                <div class="review-modal__actions">
                    <button type="button" class="review-btn review-btn--ghost" data-confirm-cancel>${escapeHtml(cancelText)}</button>
                    <button type="button" class="review-btn review-btn--danger" data-confirm-accept>${escapeHtml(confirmText)}</button>
                </div>
            </div>
        `;
      document.body.appendChild(modal);
      activeOverlay = modal;
      document.body.classList.add("overflow-hidden");
      const finish = (result) => {
        document.removeEventListener("keydown", handleKeydown);
        if (activeOverlay === modal) {
          activeOverlay = null;
        }
        modal.remove();
        document.body.classList.remove("overflow-hidden");
        resolve(result);
      };
      const handleKeydown = (event) => {
        if (event.key === "Escape") {
          finish(false);
        }
      };
      modal.querySelectorAll("[data-confirm-cancel]").forEach((button) => {
        button.addEventListener("click", () => finish(false));
      });
      modal.querySelector("[data-confirm-accept]").addEventListener("click", () => finish(true));
      modal.addEventListener("click", (event) => {
        if (event.target === modal) {
          finish(false);
        }
      });
      document.addEventListener("keydown", handleKeydown);
      modal.querySelector("[data-confirm-accept]").focus();
    });
  }
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
      reviewForm.classList.toggle("hidden", !isLoggedIn);
    }
    if (authMessage) {
      authMessage.classList.toggle("hidden", isLoggedIn);
    }
  }
  function handleImageSelect(e) {
    const files = Array.from(e.target.files);
    const validFiles = [];
    const validationMessages = [];
    for (const file of files) {
      if (!ALLOWED_REVIEW_IMAGE_TYPES.includes(file.type)) {
        validationMessages.push(`\uC9C0\uC6D0\uB418\uC9C0 \uC54A\uB294 \uD30C\uC77C \uD615\uC2DD\uC785\uB2C8\uB2E4: ${file.name}
(jpg, png, gif, webp\uB9CC \uAC00\uB2A5)`);
        continue;
      }
      if (file.size > MAX_REVIEW_IMAGE_SIZE) {
        validationMessages.push(`\uD30C\uC77C \uD06C\uAE30\uAC00 \uB108\uBB34 \uD07D\uB2C8\uB2E4: ${file.name}
(\uCD5C\uB300 10MB)`);
        continue;
      }
      validFiles.push(file);
    }
    if (selectedFiles.length + validFiles.length > MAX_REVIEW_IMAGES) {
      validationMessages.push("\uCD5C\uB300 5\uC7A5\uAE4C\uC9C0 \uC5C5\uB85C\uB4DC\uD560 \uC218 \uC788\uC2B5\uB2C8\uB2E4.");
    }
    if (validationMessages.length > 0) {
      showErrorMessage(validationMessages.join("\n"));
    }
    if (selectedFiles.length + validFiles.length > MAX_REVIEW_IMAGES) {
      e.target.value = "";
      return;
    }
    selectedFiles = [...selectedFiles, ...validFiles].slice(0, MAX_REVIEW_IMAGES);
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
        wrapper.className = "review-image-preview__item";
        wrapper.innerHTML = `
                <img src="${e.target.result}" alt="Preview ${index + 1}" class="h-full w-full object-cover">
                <button type="button" class="review-image-remove" data-index="${index}" aria-label="Remove selected image">\xD7</button>
            `;
        imagePreview.appendChild(wrapper);
        wrapper.querySelector(".review-image-remove").addEventListener("click", () => {
          selectedFiles.splice(index, 1);
          updateImagePreview();
        });
      };
      reader.readAsDataURL(file);
    });
    if (imageCount) {
      imageCount.textContent = selectedFiles.length > 0 ? `${selectedFiles.length}\uAC1C \uC120\uD0DD` : "\uC120\uD0DD\uB41C \uC0AC\uC9C4 \uC5C6\uC74C";
    }
  }
  async function loadReviews() {
    if (!currentProductId || !reviewList) return;
    reviewList.innerHTML = `
            <div class="review-empty">
                \uB9AC\uBDF0\uB97C \uBD88\uB7EC\uC624\uB294 \uC911...
            </div>
        `;
    try {
      const resultList = await pb.collection("reviews").getList(1, 50, {
        filter: `product_id = "${currentProductId}"`,
        sort: "-created",
        expand: "user"
      });
      renderReviews(resultList.items);
    } catch (error) {
      console.error("Error loading reviews:", error);
      reviewList.innerHTML = `
            <div class="review-empty review-empty--error">
                \uB9AC\uBDF0\uB97C \uBD88\uB7EC\uC624\uB294\uB370 \uC2E4\uD328\uD588\uC2B5\uB2C8\uB2E4.
            </div>
        `;
    }
  }
  function renderReviews(reviews) {
    if (reviews.length === 0) {
      reviewList.innerHTML = `
            <div data-empty-state="reviews" class="review-empty">
                \uC544\uC9C1 \uB9AC\uBDF0\uAC00 \uC5C6\uC2B5\uB2C8\uB2E4. \uCCAB \uBC88\uC9F8 \uB9AC\uBDF0\uB97C \uC791\uC131\uD574\uBCF4\uC138\uC694!
            </div>
        `;
      return;
    }
    reviewList.innerHTML = reviews.map((review) => createReviewHTML(review)).join("");
    attachReviewEventListeners();
  }
  function attachReviewEventListeners() {
    if (!reviewList) {
      return;
    }
    reviewList.querySelectorAll(".review-image").forEach((img) => {
      img.addEventListener("click", () => openLightbox(img.dataset.full || img.src));
    });
    reviewList.querySelectorAll(".review-avatar--img").forEach((img) => {
      if (img.dataset.avatarBound === "true") {
        return;
      }
      img.dataset.avatarBound = "true";
      img.addEventListener("error", function handleAvatarError() {
        const fallback = img.dataset.avatarFallback || "";
        if (fallback) {
          img.outerHTML = fallback;
        }
      });
    });
    reviewList.querySelectorAll('[data-review-action="edit"]').forEach((button) => {
      button.addEventListener("click", (event) => {
        const reviewId = event.currentTarget.closest(".review-item").dataset.reviewId;
        openEditModal(reviewId);
      });
    });
    reviewList.querySelectorAll('[data-review-action="delete"]').forEach((button) => {
      button.addEventListener("click", (event) => {
        const reviewId = event.currentTarget.closest(".review-item").dataset.reviewId;
        confirmDeleteReview(reviewId);
      });
    });
  }
  function createReviewHTML(review) {
    const user = review.expand?.user;
    const userName = user?.username || user?.name || "\uC775\uBA85";
    const userAvatar = user?.avatar ? pb.files.getUrl(user, user.avatar) : null;
    const createdDate = new Date(review.created).toLocaleDateString("ko-KR");
    const ratingValue = Number(review.rating) || 0;
    const stars = "\u2605".repeat(ratingValue) + "\u2606".repeat(Math.max(0, 5 - ratingValue));
    const isOwner = pb.authStore.isValid && pb.authStore.model?.id === review.user;
    const actionsHTML = isOwner ? `
        <div class="review-actions">
            <button type="button" data-review-action="edit" class="review-btn review-btn--ghost">\uC218\uC815</button>
            <button type="button" data-review-action="delete" class="review-btn review-btn--danger">\uC0AD\uC81C</button>
        </div>
    ` : "";
    let imagesHTML = "";
    if (review.images && review.images.length > 0) {
      const imageItems = review.images.map((img) => {
        const thumbUrl = pb.files.getUrl(review, img, { thumb: "200x200" });
        const imgUrl = pb.files.getUrl(review, img);
        return `<img src="${thumbUrl}" data-full="${imgUrl}" alt="\uB9AC\uBDF0 \uC774\uBBF8\uC9C0" class="review-image">`;
      }).join("");
      imagesHTML = `<div class="review-image-grid">${imageItems}</div>`;
    }
    const avatarHTML = userAvatar ? `<img src="${userAvatar}" class="review-avatar review-avatar--img" alt="${escapeHtml(userName)}" data-avatar-fallback="${escapeHtml('<div class="review-avatar review-avatar--fallback"><i class="tf-ion-android-person review-avatar__icon"></i></div>')}">` : `<div class="review-avatar review-avatar--fallback"><i class="tf-ion-android-person review-avatar__icon"></i></div>`;
    return `
        <article class="review-card review-item" data-review-id="${review.id}" data-rating="${ratingValue}" data-content="${escapeHtml(review.content)}">
            <div class="flex gap-4">
            ${avatarHTML}
            <div class="min-w-0 flex-1">
                <div class="flex flex-col gap-2 sm:flex-row sm:items-start sm:justify-between">
                    <div class="review-card__meta">
                        <h6 class="review-card__name">${escapeHtml(userName)}</h6>
                        <p class="review-card__date">${createdDate}</p>
                    </div>
                    <div class="review-card__stars">${stars}</div>
                </div>
                <p class="review-card__content">${escapeHtml(review.content)}</p>
                ${imagesHTML}
                ${actionsHTML}
            </div>
            </div>
        </article>
    `;
  }
  function openEditModal(reviewId) {
    const reviewElement = document.querySelector(`[data-review-id="${reviewId}"]`);
    if (!reviewElement) return;
    const currentRating = reviewElement.dataset.rating;
    const currentContent = reviewElement.dataset.content;
    closeActiveOverlay();
    const modal = document.createElement("div");
    modal.id = "edit-review-modal";
    modal.className = "review-modal";
    modal.dataset.reviewOverlay = "edit";
    modal.innerHTML = `
        <div class="review-modal__panel review-modal__panel--large">
            <div class="review-modal__header">
                <div>
                    <p class="review-modal__eyebrow">Edit review</p>
                    <h4 class="review-modal__title">\uB9AC\uBDF0 \uC218\uC815</h4>
                </div>
                <button type="button" class="review-btn review-btn--ghost review-btn--icon review-modal__close" data-edit-close aria-label="\uB2EB\uAE30">\xD7</button>
            </div>
            <form id="edit-review-form" class="mt-5 space-y-5">
                <div>
                    <label for="edit-rating" class="review-field-label">\uD3C9\uC810</label>
                    <select id="edit-rating" required class="review-field-control">
                        <option value="5" ${Number(currentRating) === 5 ? "selected" : ""}>\u2B50\u2B50\u2B50\u2B50\u2B50 (5\uC810)</option>
                        <option value="4" ${Number(currentRating) === 4 ? "selected" : ""}>\u2B50\u2B50\u2B50\u2B50 (4\uC810)</option>
                        <option value="3" ${Number(currentRating) === 3 ? "selected" : ""}>\u2B50\u2B50\u2B50 (3\uC810)</option>
                        <option value="2" ${Number(currentRating) === 2 ? "selected" : ""}>\u2B50\u2B50 (2\uC810)</option>
                        <option value="1" ${Number(currentRating) === 1 ? "selected" : ""}>\u2B50 (1\uC810)</option>
                    </select>
                </div>
                <div>
                    <label for="edit-content" class="review-field-label">\uB0B4\uC6A9</label>
                    <textarea id="edit-content" rows="4" required class="review-field-control review-field-control--textarea">${escapeHtml(currentContent)}</textarea>
                </div>
                <div class="flex flex-col-reverse gap-3 sm:flex-row sm:justify-end">
                    <button type="button" class="review-btn review-btn--ghost" id="cancel-edit">\uCDE8\uC18C</button>
                    <button type="submit" class="review-btn review-btn--primary" id="save-edit">\uC800\uC7A5</button>
                </div>
            </form>
        </div>
    `;
    document.body.appendChild(modal);
    activeOverlay = modal;
    document.body.classList.add("overflow-hidden");
    const closeModal = () => {
      document.removeEventListener("keydown", handleKeydown);
      if (activeOverlay === modal) {
        activeOverlay = null;
      }
      modal.remove();
      document.body.classList.remove("overflow-hidden");
    };
    const handleKeydown = (e) => {
      if (e.key === "Escape") {
        closeModal();
      }
    };
    modal.querySelectorAll("[data-edit-close], #cancel-edit").forEach((button) => {
      button.addEventListener("click", closeModal);
    });
    modal.addEventListener("click", (e) => {
      if (e.target === modal) closeModal();
    });
    document.addEventListener("keydown", handleKeydown);
    modal.querySelector("#edit-review-form").addEventListener("submit", async (e) => {
      e.preventDefault();
      const newRating = parseInt(modal.querySelector("#edit-rating").value);
      const newContent = modal.querySelector("#edit-content").value.trim();
      const saveBtn = modal.querySelector("#save-edit");
      if (!newContent) {
        showErrorMessage("\uB9AC\uBDF0 \uB0B4\uC6A9\uC744 \uC785\uB825\uD574\uC8FC\uC138\uC694.");
        return;
      }
      try {
        saveBtn.disabled = true;
        saveBtn.textContent = "\uC800\uC7A5 \uC911...";
        await pb.collection("reviews").update(reviewId, { rating: newRating, content: newContent });
        closeModal();
        showSuccessMessage("\uB9AC\uBDF0\uAC00 \uC218\uC815\uB418\uC5C8\uC2B5\uB2C8\uB2E4.");
        loadReviews();
      } catch (error) {
        console.error("Error updating review:", error);
        showErrorMessage("\uB9AC\uBDF0 \uC218\uC815\uC5D0 \uC2E4\uD328\uD588\uC2B5\uB2C8\uB2E4: " + error.message);
        saveBtn.disabled = false;
        saveBtn.textContent = "\uC800\uC7A5";
      }
    });
  }
  async function confirmDeleteReview(reviewId) {
    const confirmed = await showConfirmationDialog({
      title: "\uB9AC\uBDF0 \uC0AD\uC81C",
      message: "\uC815\uB9D0\uB85C \uC774 \uB9AC\uBDF0\uB97C \uC0AD\uC81C\uD558\uC2DC\uACA0\uC2B5\uB2C8\uAE4C?\n\uC0AD\uC81C\uB41C \uB9AC\uBDF0\uB294 \uB418\uB3CC\uB9B4 \uC218 \uC5C6\uC2B5\uB2C8\uB2E4.",
      confirmText: "\uC0AD\uC81C",
      cancelText: "\uCDE8\uC18C"
    });
    if (!confirmed) return;
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
            reviewList.innerHTML = `
                        <div data-empty-state="reviews" class="rounded-2xl border border-dashed border-slate-300 bg-slate-50 px-4 py-8 text-center text-sm text-slate-500">
                            \uC544\uC9C1 \uB9AC\uBDF0\uAC00 \uC5C6\uC2B5\uB2C8\uB2E4. \uCCAB \uBC88\uC9F8 \uB9AC\uBDF0\uB97C \uC791\uC131\uD574\uBCF4\uC138\uC694!
                        </div>
                    `;
          }
        }, 300);
      }
      showSuccessMessage("\uB9AC\uBDF0\uAC00 \uC0AD\uC81C\uB418\uC5C8\uC2B5\uB2C8\uB2E4.");
    } catch (error) {
      console.error("Error deleting review:", error);
      showErrorMessage("\uB9AC\uBDF0 \uC0AD\uC81C\uC5D0 \uC2E4\uD328\uD588\uC2B5\uB2C8\uB2E4: " + error.message);
    }
  }
  function openLightbox(src) {
    closeActiveOverlay();
    const lightbox = document.createElement("div");
    lightbox.id = "review-lightbox";
    lightbox.className = "review-lightbox";
    lightbox.dataset.reviewOverlay = "lightbox";
    lightbox.innerHTML = `
        <div class="review-lightbox__panel">
            <img src="${src}" alt="\uB9AC\uBDF0 \uC774\uBBF8\uC9C0 \uD655\uB300\uBCF4\uAE30" class="review-lightbox__image">
            <button type="button" data-lightbox-close class="review-btn review-btn--ghost review-btn--icon review-lightbox__close" aria-label="\uB2EB\uAE30">\xD7</button>
        </div>
    `;
    document.body.appendChild(lightbox);
    activeOverlay = lightbox;
    document.body.classList.add("overflow-hidden");
    const closeLightbox = () => {
      document.removeEventListener("keydown", handleKeydown);
      if (activeOverlay === lightbox) {
        activeOverlay = null;
      }
      lightbox.remove();
      document.body.classList.remove("overflow-hidden");
    };
    const handleKeydown = (event) => {
      if (event.key === "Escape") {
        closeLightbox();
      }
    };
    lightbox.addEventListener("click", (event) => {
      if (event.target === lightbox || event.target.closest("[data-lightbox-close]")) {
        closeLightbox();
      }
    });
    document.addEventListener("keydown", handleKeydown);
    lightbox.focus?.();
  }
  async function handleReviewSubmit(e) {
    e.preventDefault();
    if (!pb.authStore.isValid) {
      showErrorMessage("\uB9AC\uBDF0\uB97C \uC791\uC131\uD558\uB824\uBA74 \uB85C\uADF8\uC778\uC774 \uD544\uC694\uD569\uB2C8\uB2E4.");
      return;
    }
    const ratingSelect = document.getElementById("review-rating");
    const ratingRadio = document.querySelector('input[name="rating"]:checked');
    const rating = ratingSelect?.value || ratingRadio?.value;
    const contentInput = document.getElementById("review-content");
    const content = contentInput?.value?.trim();
    const submitBtn = reviewForm.querySelector('button[type="submit"]');
    if (!rating) {
      showErrorMessage("\uD3C9\uC810\uC744 \uC120\uD0DD\uD574\uC8FC\uC138\uC694.");
      return;
    }
    if (!content) {
      showErrorMessage("\uB9AC\uBDF0 \uB0B4\uC6A9\uC744 \uC785\uB825\uD574\uC8FC\uC138\uC694.");
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
      showErrorMessage(errorMsg);
    } finally {
      submitBtn.disabled = false;
      submitBtn.innerText = "\uB9AC\uBDF0 \uC81C\uCD9C";
    }
  }
  function addNewReviewToList(newReview) {
    if (!reviewList) return;
    const noReviewsMsg = reviewList.querySelector('[data-empty-state="reviews"]');
    if (noReviewsMsg) {
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
  function closeActiveOverlay() {
    if (activeOverlay) {
      activeOverlay.remove();
      activeOverlay = null;
      document.body.classList.remove("overflow-hidden");
    }
  }
  var Reviews = {
    init
  };

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
    bindStaticActions();
    pb.authStore.onChange(() => {
      updateUI2();
      loadInquiries();
    });
  }
  function bindStaticActions() {
    const scrollButtons = document.querySelectorAll('[data-qna-action="scroll-form"]');
    scrollButtons.forEach((button) => {
      if (button.dataset.qnaBound === "true") {
        return;
      }
      button.dataset.qnaBound = "true";
      button.addEventListener("click", () => {
        const formContainer = document.getElementById("qna-form-container");
        const target = pb.authStore.isValid ? formContainer : authMessage2;
        if (target) {
          target.scrollIntoView({ behavior: "smooth", block: "start" });
        }
      });
    });
  }
  function updateUI2() {
    const isLoggedIn = pb.authStore.isValid;
    const formContainer = document.getElementById("qna-form-container");
    if (formContainer) {
      formContainer.classList.toggle("hidden", !isLoggedIn);
    }
    if (authMessage2) {
      authMessage2.classList.toggle("hidden", isLoggedIn);
    }
  }
  async function loadInquiries() {
    if (!currentProductId2 || !qnaList) return;
    qnaList.innerHTML = `
        <div class="flex min-h-[160px] items-center justify-center rounded-2xl border border-slate-200 bg-slate-50 px-4 py-8">
            <div class="flex items-center gap-3 text-sm font-medium text-slate-500">
                <svg class="h-5 w-5 animate-spin text-slate-500" viewBox="0 0 24 24" fill="none" aria-hidden="true">
                    <circle class="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" stroke-width="4"></circle>
                    <path class="opacity-75" fill="currentColor" d="M4 12a8 8 0 0 1 8-8v4a4 4 0 0 0-4 4H4z"></path>
                </svg>
                <span>\uBB38\uC758 \uBAA9\uB85D\uC744 \uBD88\uB7EC\uC624\uB294 \uC911\uC785\uB2C8\uB2E4.</span>
            </div>
        </div>`;
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
      qnaList.innerHTML = `
            <div class="rounded-2xl border border-rose-200 bg-rose-50 px-4 py-4 text-sm text-rose-700">
                \uBB38\uC758 \uBAA9\uB85D\uC744 \uBD88\uB7EC\uC624\uB294\uB370 \uC2E4\uD328\uD588\uC2B5\uB2C8\uB2E4.
            </div>`;
    }
  }
  function renderInquiries(items) {
    if (items.length === 0) {
      qnaList.innerHTML = `
            <div class="rounded-2xl border border-dashed border-slate-300 bg-slate-50 px-4 py-10 text-center text-sm text-slate-500">
                \uB4F1\uB85D\uB41C \uBB38\uC758\uAC00 \uC5C6\uC2B5\uB2C8\uB2E4.
            </div>`;
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
        formEl.classList.toggle("hidden");
      });
    });
    qnaList.querySelectorAll(".btn-cancel-reply").forEach((btn) => {
      btn.addEventListener("click", (e) => {
        const itemEl = e.target.closest(".qna-item");
        itemEl.querySelector(".reply-form").classList.add("hidden");
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
            <div class="space-y-4">
                <p class="qna-content whitespace-pre-wrap break-words rounded-2xl bg-slate-50 px-4 py-3 text-sm leading-7 text-slate-700">${escapeHtml(item.content)}</p>
                ${item.reply ? `<div class="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm">
                    <div class="flex items-center gap-2 text-sm font-semibold text-slate-900">
                        <span class="inline-flex h-5 w-5 items-center justify-center rounded-full bg-emerald-100 text-[11px] font-bold text-emerald-700">A</span>
                        <span>\uB2F5\uBCC0</span>
                    </div>
                    <p class="mt-3 whitespace-pre-wrap break-words text-sm leading-7 text-slate-700">${escapeHtml(item.reply)}</p>
                    <small class="mt-2 block text-xs text-slate-500">${new Date(item.reply_date || item.updated).toLocaleDateString("ko-KR")}</small>
                </div>` : ""}
            </div>
        `;
    } else {
      contentDisplay = `
            <div class="rounded-2xl border border-dashed border-amber-200 bg-amber-50/80 px-4 py-3 text-sm text-slate-600">
                <span class="inline-flex items-center gap-2 font-medium text-amber-700">
                    <i class="tf-ion-locked"></i>
                    \uBE44\uBC00\uAE00\uC785\uB2C8\uB2E4.
                </span>
            </div>`;
    }
    let actionsHTML = "";
    if (isOwner || isAdmin2) {
      actionsHTML += `<button type="button" class="btn-delete-qna inline-flex items-center justify-center rounded-full border border-rose-200 bg-white px-3 py-1.5 text-xs font-semibold text-rose-600 transition hover:border-rose-300 hover:bg-rose-50">\uC0AD\uC81C</button>`;
    }
    if (isAdmin2) {
      actionsHTML += `<button type="button" class="btn-reply-qna inline-flex items-center justify-center rounded-full border border-slate-900 bg-slate-900 px-3 py-1.5 text-xs font-semibold text-white transition hover:bg-slate-700">\uB2F5\uBCC0 \uC791\uC131/\uC218\uC815</button>`;
    }
    if (actionsHTML) {
      actionsHTML = `<div class="qna-actions mt-4 flex flex-wrap gap-2">${actionsHTML}</div>`;
    }
    const replyFormHTML = isAdmin2 ? `
        <div class="reply-form mt-4 hidden rounded-2xl border border-slate-200 bg-slate-50 p-4">
            <div class="mb-3">
                <label class="mb-2 block text-sm font-medium text-slate-700">\uAD00\uB9AC\uC790 \uB2F5\uBCC0</label>
                <textarea class="admin-reply-input w-full rounded-2xl border border-slate-300 bg-white px-3 py-2 text-sm text-slate-900 shadow-sm outline-none transition placeholder:text-slate-400 focus:border-slate-400 focus:ring-4 focus:ring-slate-200" rows="4">${escapeHtml(item.reply || "")}</textarea>
            </div>
            <div class="flex justify-end gap-2">
                <button type="button" class="btn-cancel-reply inline-flex items-center justify-center rounded-full border border-slate-300 bg-white px-3 py-1.5 text-xs font-semibold text-slate-700 transition hover:bg-slate-100">\uCDE8\uC18C</button>
                <button type="button" class="btn-save-reply inline-flex items-center justify-center rounded-full border border-slate-900 bg-slate-900 px-3 py-1.5 text-xs font-semibold text-white transition hover:bg-slate-700">\uC800\uC7A5</button>
            </div>
        </div>
    ` : "";
    return `
        <article class="qna-item rounded-2xl border border-slate-200 bg-white p-4 shadow-sm sm:p-5" data-id="${item.id}">
            <div class="flex flex-col gap-4">
                <div class="flex flex-wrap items-center gap-x-2 gap-y-2">
                    <span class="inline-flex items-center gap-1.5 text-sm font-semibold text-slate-900">${isSecret ? '<i class="tf-ion-locked text-amber-500" title="\uBE44\uBC00\uAE00"></i> ' : ""}${canView ? escapeHtml(userName) : "***"}</span>
                    <span class="text-xs text-slate-500">${createdDate}</span>
                    <span class="inline-flex items-center rounded-full px-2.5 py-1 text-[11px] font-semibold ${item.reply ? "bg-emerald-100 text-emerald-700" : "bg-slate-100 text-slate-600"}">
                        ${item.reply ? "\uB2F5\uBCC0\uC644\uB8CC" : "\uB2F5\uBCC0\uB300\uAE30"}
                    </span>
                </div>
                ${contentDisplay}
                ${item.reply ? "" : actionsHTML}
                ${item.reply && isAdmin2 ? actionsHTML : ""}
                ${replyFormHTML}
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

  // ns-hugo-imp:C:\hugo\ex\shop\assets\js\core\daum-postcode.js
  function getDaumPostcodeConstructor() {
    return globalThis?.daum?.Postcode || null;
  }
  function hasDaumPostcode() {
    return typeof getDaumPostcodeConstructor() === "function";
  }
  function embedDaumPostcode(container, options = {}) {
    const Postcode = getDaumPostcodeConstructor();
    if (!container || !Postcode) {
      return false;
    }
    const {
      onComplete,
      onOpen,
      onClose,
      width = "100%",
      height = "100%",
      maxSuggestItems = 5
    } = options;
    new Postcode({
      oncomplete(data) {
        onComplete?.(data);
        onClose?.();
      },
      width,
      height,
      maxSuggestItems
    }).embed(container);
    onOpen?.();
    return true;
  }

  // ns-hugo-imp:C:\hugo\ex\shop\assets\js\profile.js
  var postcodeLayer = null;
  var postcodeContainer = null;
  var profileActionListenerBound = false;
  var missingUserRedirectScheduled = false;
  function withNoAutoCancel2(options = {}) {
    return {
      ...options,
      requestKey: null
    };
  }
  function escapeFilterValue2(value) {
    return String(value).replace(/\\/g, "\\\\").replace(/"/g, '\\"');
  }
  function getPocketBaseErrorMessage(error, fallbackMessage) {
    const fieldErrors = error?.response?.data || error?.data?.data || {};
    const fieldMessages = Object.values(fieldErrors).map((detail) => detail?.message).filter(Boolean);
    if (fieldMessages.length > 0) {
      return fieldMessages.join(" / ");
    }
    return error?.response?.message || error?.message || fallbackMessage;
  }
  function isNotFoundError(error) {
    return error?.status === 404 || error?.response?.code === 404;
  }
  function redirectToLoginBecauseUserIsMissing() {
    if (missingUserRedirectScheduled) {
      return;
    }
    missingUserRedirectScheduled = true;
    pb.authStore.clear();
    showToast("\uB85C\uADF8\uC778 \uC138\uC158\uC774 \uB9CC\uB8CC\uB418\uC5C8\uC2B5\uB2C8\uB2E4. \uB2E4\uC2DC \uB85C\uADF8\uC778\uD574\uC8FC\uC138\uC694.", { isError: true });
    setTimeout(() => {
      location.href = document.documentElement.lang === "ko" ? "/ko/login/" : "/en/login/";
    }, 1200);
  }
  async function getCurrentUserRecord(options = {}) {
    const { refresh = false, redirectOnMissing = false } = options;
    const authUser = pb.authStore.model;
    if (!pb.authStore.isValid || !authUser?.id) {
      return null;
    }
    const hasUsableProfile = Boolean(authUser.email) && Boolean(authUser.username || authUser.name || authUser.phone || authUser.address);
    if (!refresh && hasUsableProfile) {
      return authUser;
    }
    try {
      const freshUser = await pb.collection("users").getOne(authUser.id, withNoAutoCancel2());
      pb.authStore.save(pb.authStore.token, {
        ...authUser,
        ...freshUser
      });
      return pb.authStore.model;
    } catch (error) {
      if (isNotFoundError(error)) {
        console.warn("Current user record was not found:", error);
        if (redirectOnMissing) {
          redirectToLoginBecauseUserIsMissing();
        }
        return null;
      }
      console.warn("Failed to refresh current user record, falling back to auth store:", error);
      return authUser;
    }
  }
  async function init3() {
    const saveBtn = document.getElementById("save-button");
    const orderHistory = document.getElementById("order-history-list");
    if (!saveBtn && !orderHistory) {
      return;
    }
    const currentUser = await getCurrentUserRecord({ refresh: true, redirectOnMissing: true });
    if (!currentUser) {
      showToast("\uB85C\uADF8\uC778\uC774 \uD544\uC694\uD569\uB2C8\uB2E4.", { isError: true });
      setTimeout(() => {
        location.href = document.documentElement.lang === "ko" ? "/ko/login/" : "/en/login/";
      }, 1500);
      return;
    }
    postcodeLayer = document.getElementById("daum-layer");
    postcodeContainer = document.getElementById("daum-postcode-container");
    await loadUserProfile(currentUser);
    await loadOrderHistory();
    bindProfileActionListeners();
    if (saveBtn) {
      saveBtn.addEventListener("click", handleSave);
    }
    const changePasswordBtn = document.getElementById("change-password-btn");
    if (changePasswordBtn) {
      changePasswordBtn.addEventListener("click", handlePasswordChange);
    }
  }
  function bindProfileActionListeners() {
    if (profileActionListenerBound) {
      return;
    }
    profileActionListenerBound = true;
    document.addEventListener("click", handleProfileActionClick);
  }
  function handleProfileActionClick(event) {
    const target = event.target instanceof Element ? event.target : null;
    if (!target) {
      return;
    }
    const actionTarget = target.closest("[data-profile-action]");
    if (!actionTarget) {
      return;
    }
    const action = actionTarget.dataset.profileAction;
    switch (action) {
      case "open-postcode":
        event.preventDefault();
        openPostcode();
        break;
      case "close-postcode":
        event.preventDefault();
        closePostcode();
        break;
      case "history-back":
        event.preventDefault();
        history.back();
        break;
      case "close-tracking-modal":
        event.preventDefault();
        closeTrackingModal();
        break;
      case "track-delivery":
        event.preventDefault();
        trackDelivery();
        break;
      case "cancel-order":
        event.preventDefault();
        cancelOrder(actionTarget.dataset.orderId);
        break;
      case "open-tracking-modal":
        event.preventDefault();
        openTrackingModal(actionTarget.dataset.carrier, actionTarget.dataset.trackingNumber);
        break;
      default:
        break;
    }
  }
  function escapeHtmlAttr(value) {
    return String(value ?? "").replace(/&/g, "&amp;").replace(/"/g, "&quot;").replace(/'/g, "&#39;").replace(/</g, "&lt;").replace(/>/g, "&gt;");
  }
  function closePostcode() {
    if (postcodeLayer) {
      postcodeLayer.classList.add("hidden");
    }
  }
  function openPostcode() {
    if (!postcodeLayer || !postcodeContainer) {
      return;
    }
    if (!hasDaumPostcode()) {
      showToast("\uC8FC\uC18C \uAC80\uC0C9 \uC11C\uBE44\uC2A4\uB97C \uBD88\uB7EC\uC624\uC9C0 \uBABB\uD588\uC2B5\uB2C8\uB2E4.", { isError: true });
      return;
    }
    embedDaumPostcode(postcodeContainer, {
      onComplete(data) {
        const roadAddr = data.roadAddress;
        let extraRoadAddr = "";
        if (data.bname !== "" && /[동|로|가]$/g.test(data.bname)) {
          extraRoadAddr += data.bname;
        }
        if (data.buildingName !== "" && data.apartment === "Y") {
          extraRoadAddr += extraRoadAddr !== "" ? ", " + data.buildingName : data.buildingName;
        }
        if (extraRoadAddr !== "") {
          extraRoadAddr = " (" + extraRoadAddr + ")";
        }
        const postcodeInput = document.getElementById("postcode");
        const addressInput = document.getElementById("address");
        const extraAddressInput = document.getElementById("extraAddress");
        const guideTextBox = document.getElementById("guide");
        if (postcodeInput) postcodeInput.value = data.zonecode;
        if (addressInput) {
          if (data.userSelectedType === "R") {
            addressInput.value = roadAddr;
          } else {
            addressInput.value = data.jibunAddress;
          }
        }
        if (extraAddressInput) {
          if (roadAddr !== "") {
            extraAddressInput.value = extraRoadAddr;
          } else {
            extraAddressInput.value = "";
          }
        }
        if (guideTextBox) {
          if (data.autoRoadAddress) {
            const expRoadAddr = data.autoRoadAddress + extraRoadAddr;
            guideTextBox.innerHTML = "(\uC608\uC0C1 \uB3C4\uB85C\uBA85 \uC8FC\uC18C : " + expRoadAddr + ")";
            guideTextBox.style.display = "block";
          } else if (data.autoJibunAddress) {
            const expJibunAddr = data.autoJibunAddress;
            guideTextBox.innerHTML = "(\uC608\uC0C1 \uC9C0\uBC88 \uC8FC\uC18C : " + expJibunAddr + ")";
            guideTextBox.style.display = "block";
          } else {
            guideTextBox.innerHTML = "";
            guideTextBox.style.display = "none";
          }
        }
        const detailAddressInput = document.getElementById("detailAddress");
        if (detailAddressInput) {
          detailAddressInput.focus();
        }
      },
      onOpen() {
        postcodeLayer.classList.remove("hidden");
      },
      onClose() {
        closePostcode();
      }
    });
  }
  async function loadUserProfile(userRecord = null) {
    try {
      const currentUser = userRecord || await getCurrentUserRecord({ refresh: true });
      if (!currentUser) {
        throw new Error("Current user is unavailable");
      }
      const nameInput = document.getElementById("name");
      if (nameInput) nameInput.value = currentUser.name || "";
      const nicknameInput = document.getElementById("nickname");
      if (nicknameInput) nicknameInput.value = currentUser.username || currentUser.name || "";
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
    const currentUser = await getCurrentUserRecord({ refresh: true, redirectOnMissing: true });
    if (!currentUser) {
      showToast("\uB85C\uADF8\uC778\uC774 \uD544\uC694\uD569\uB2C8\uB2E4.", { isError: true });
      return;
    }
    const name = document.getElementById("name").value.trim();
    const nickname = document.getElementById("nickname").value.trim();
    const phone = document.getElementById("phone").value.trim();
    const postcode = document.getElementById("postcode").value.trim();
    const address = document.getElementById("address").value.trim();
    const detailAddress = document.getElementById("detailAddress").value.trim();
    const extraAddress = document.getElementById("extraAddress").value.trim();
    const currentUsername = currentUser.username || "";
    if (!nickname) {
      showToast("\uB2C9\uB124\uC784\uC744 \uC785\uB825\uD574\uC8FC\uC138\uC694.", { isError: true });
      return;
    }
    saveBtn.disabled = true;
    saveBtn.textContent = "\uC800\uC7A5\uC911...";
    try {
      if (nickname !== currentUsername) {
        const duplicateCheck = await pb.collection("users").getList(1, 1, withNoAutoCancel2({
          filter: `username = "${escapeFilterValue2(nickname)}" && id != "${escapeFilterValue2(currentUser.id)}"`
        }));
        if (duplicateCheck.totalItems > 0) {
          showToast("\uC774\uBBF8 \uC0AC\uC6A9 \uC911\uC778 \uB2C9\uB124\uC784\uC785\uB2C8\uB2E4.", { isError: true });
          return;
        }
      }
      const data = {
        name,
        phone,
        postcode,
        address,
        detailAddress,
        extraAddress,
        username: nickname
      };
      const updatedUser = await pb.collection("users").update(currentUser.id, data, withNoAutoCancel2());
      if (pb.authStore.isValid && pb.authStore.model?.id === updatedUser.id) {
        pb.authStore.save(pb.authStore.token, {
          ...pb.authStore.model,
          ...updatedUser
        });
      }
      await loadUserProfile(updatedUser);
      showToast("\uD504\uB85C\uD544\uC774 \uC131\uACF5\uC801\uC73C\uB85C \uC800\uC7A5\uB418\uC5C8\uC2B5\uB2C8\uB2E4!", { isError: false });
    } catch (error) {
      console.error("Failed to save profile:", error);
      showToast(`\uD504\uB85C\uD544 \uC800\uC7A5\uC5D0 \uC2E4\uD328\uD588\uC2B5\uB2C8\uB2E4: ${getPocketBaseErrorMessage(error, "\uC7A0\uC2DC \uD6C4 \uB2E4\uC2DC \uC2DC\uB3C4\uD574\uC8FC\uC138\uC694.")}`, { isError: true });
    } finally {
      saveBtn.disabled = false;
      saveBtn.textContent = "\uC800\uC7A5\uD558\uAE30";
    }
  }
  async function loadOrderHistory() {
    const container = document.getElementById("order-history-list");
    const currentUser = await getCurrentUserRecord({ refresh: true, redirectOnMissing: true });
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
                <button type="button" data-profile-action="cancel-order" data-order-id="${escapeHtmlAttr(order.id)}" class="mt-2 w-full py-2 px-4 bg-red-500 hover:bg-red-600 text-white text-sm font-medium rounded-lg transition-colors">
                    \uC8FC\uBB38 \uCDE8\uC18C
                </button>
            ` : "";
        const canTrack = order.status === "shipping" || order.status === "delivered";
        const trackingNumber = order.tracking_number || "";
        const carrier = order.carrier || "";
        let trackingBtnHtml = "";
        if (canTrack && trackingNumber) {
          trackingBtnHtml = `
                    <button type="button" data-profile-action="open-tracking-modal" data-carrier="${escapeHtmlAttr(carrier)}" data-tracking-number="${escapeHtmlAttr(trackingNumber)}" class="mt-2 w-full py-2 px-4 bg-indigo-500 hover:bg-indigo-600 text-white text-sm font-medium rounded-lg transition-colors flex items-center justify-center gap-2">
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
    const currentUser = await getCurrentUserRecord({ refresh: true, redirectOnMissing: true });
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
      }, withNoAutoCancel2());
      showToast("\uBE44\uBC00\uBC88\uD638\uAC00 \uC131\uACF5\uC801\uC73C\uB85C \uBCC0\uACBD\uB418\uC5C8\uC2B5\uB2C8\uB2E4.", { isError: false });
      document.getElementById("oldPassword").value = "";
      document.getElementById("newPassword").value = "";
      document.getElementById("newPasswordConfirm").value = "";
    } catch (error) {
      console.error("Failed to change password:", error);
      showToast(`\uBE44\uBC00\uBC88\uD638 \uBCC0\uACBD \uC2E4\uD328: ${getPocketBaseErrorMessage(error, "\uC7A0\uC2DC \uD6C4 \uB2E4\uC2DC \uC2DC\uB3C4\uD574\uC8FC\uC138\uC694.")}`, { isError: true });
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
      open(carrierInfo.url + trackingNumber, "_blank");
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

  // ns-hugo-imp:C:\hugo\ex\shop\assets\js\home-products.js
  var SECTION_SELECTOR = "[data-home-products]";
  var WRAPPER_SELECTOR = "[data-home-products-wrapper]";
  var CONTAINER_SELECTOR = "[data-home-products-container]";
  var LOADING_SELECTOR = "[data-home-products-loading]";
  var CARD_WIDTH = "clamp(15rem, 72vw, 16rem)";
  var CURRENCY = "\u20A9";
  function isKoreanPage2() {
    return document.documentElement.lang === "ko" || location.pathname.startsWith("/ko/");
  }
  function getLanguageCode() {
    return isKoreanPage2() ? "ko" : "en";
  }
  function createPlaceholderDataUri(label) {
    const safeLabel = String(label || "").replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;");
    const svg = `
        <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 600 600" role="img" aria-label="${safeLabel}">
            <defs>
                <linearGradient id="bg" x1="0%" y1="0%" x2="100%" y2="100%">
                    <stop offset="0%" stop-color="#e2e8f0" />
                    <stop offset="100%" stop-color="#cbd5e1" />
                </linearGradient>
            </defs>
            <rect width="600" height="600" rx="56" fill="url(#bg)" />
            <circle cx="300" cy="240" r="76" fill="#f8fafc" fill-opacity="0.75" />
            <path d="M178 378c36-54 78-81 122-81s86 27 122 81" fill="none" stroke="#94a3b8" stroke-width="24" stroke-linecap="round" />
            <text x="300" y="510" text-anchor="middle" fill="#475569" font-size="38" font-family="Arial, sans-serif" font-weight="700">${safeLabel}</text>
        </svg>
    `.trim();
    return `data:image/svg+xml;charset=utf-8,${encodeURIComponent(svg)}`;
  }
  function getPlaceholderImage() {
    return createPlaceholderDataUri(isKoreanPage2() ? "\uC774\uBBF8\uC9C0 \uC5C6\uC74C" : "No Image");
  }
  function getErrorPlaceholderImage() {
    return createPlaceholderDataUri(isKoreanPage2() ? "\uC774\uBBF8\uC9C0 \uC624\uB958" : "Image Error");
  }
  function getProductUrl(slug) {
    if (!slug) {
      return "#products";
    }
    return `/${getLanguageCode()}/products/${encodeURIComponent(slug)}/`;
  }
  function canAutoAnimate() {
    const coarsePointer = matchMedia?.("(pointer: coarse)")?.matches || matchMedia?.("(hover: none)")?.matches || false;
    const reducedMotion = matchMedia?.("(prefers-reduced-motion: reduce)")?.matches || false;
    return !coarsePointer && !reducedMotion;
  }
  function createCard(product) {
    const imageFallback = getErrorPlaceholderImage();
    const imageUrl = product.images && product.images.length > 0 ? productsApi.getImageUrl(product, product.images[0], "300x300") : getPlaceholderImage();
    const finalPrice = Number(product.discount_price || product.price || 0);
    const originalPrice = Number(product.price || 0);
    const productUrl = getProductUrl(product.slug);
    const block = document.createElement("div");
    block.className = "home-product-card h-full";
    block.style.flex = "0 0 auto";
    block.style.width = CARD_WIDTH;
    block.setAttribute("role", "listitem");
    const article = document.createElement("article");
    article.className = "group flex h-full flex-col overflow-hidden rounded-3xl bg-white shadow-sm ring-1 ring-slate-200 transition duration-300 hover:-translate-y-1 hover:shadow-xl";
    const media = document.createElement("div");
    media.className = "relative aspect-square overflow-hidden bg-slate-100";
    const image = document.createElement("img");
    image.className = "h-full w-full select-none object-cover transition duration-500 group-hover:scale-105";
    image.src = imageUrl;
    image.alt = product.title || "";
    image.loading = "lazy";
    image.draggable = false;
    image.dataset.fallbackSrc = imageFallback;
    image.addEventListener("error", () => {
      if (image.src !== imageFallback) {
        image.src = imageFallback;
      }
    }, { once: true });
    const overlay = document.createElement("div");
    overlay.className = "absolute inset-0 flex flex-col justify-between bg-gradient-to-t from-slate-950/40 via-transparent to-transparent p-4";
    const detailLink = document.createElement("a");
    detailLink.href = productUrl;
    detailLink.className = "inline-flex h-11 w-11 items-center justify-center self-end rounded-full bg-white/90 text-slate-700 shadow-lg backdrop-blur transition hover:bg-white hover:text-amber-500 focus:outline-none focus:ring-2 focus:ring-amber-400 focus:ring-offset-2";
    detailLink.setAttribute("aria-label", isKoreanPage2() ? "\uC0C1\uD488 \uC0C1\uC138\uBCF4\uAE30" : "View product details");
    detailLink.innerHTML = '<i class="tf-ion-plus-round text-xl"></i>';
    const cartButton = document.createElement("button");
    cartButton.type = "button";
    cartButton.className = "inline-flex w-full items-center justify-center gap-2 rounded-full bg-amber-400 px-4 py-3 text-sm font-semibold text-white shadow-lg shadow-amber-200 transition hover:bg-amber-500 focus:outline-none focus:ring-2 focus:ring-amber-400 focus:ring-offset-2";
    cartButton.dataset.cartAction = "add-item";
    cartButton.dataset.cartId = product.id || "";
    cartButton.dataset.cartName = product.title || "";
    cartButton.dataset.cartPrice = String(finalPrice);
    cartButton.dataset.cartImage = imageUrl;
    cartButton.dataset.cartOptions = JSON.stringify({
      __productSlug: product.slug || "",
      __productUrl: productUrl
    });
    cartButton.innerHTML = '<span aria-hidden="true">\u{1F6D2}</span><span>' + (isKoreanPage2() ? "\uC7A5\uBC14\uAD6C\uB2C8 \uCD94\uAC00" : "Add to cart") + "</span>";
    const body = document.createElement("div");
    body.className = "flex flex-1 flex-col p-4 text-center sm:p-5";
    const title = document.createElement("h4");
    title.className = "text-base font-semibold leading-6 text-slate-900";
    title.textContent = product.title || "";
    const price = document.createElement("p");
    price.className = "mt-2 text-lg font-semibold text-slate-700";
    if (product.discount_price && Number(product.discount_price) > 0) {
      const sale = document.createElement("span");
      sale.textContent = `${CURRENCY}${Number(product.discount_price).toLocaleString()}`;
      const original = document.createElement("s");
      original.className = "ml-2 text-sm font-medium text-slate-400";
      original.textContent = `${CURRENCY}${originalPrice.toLocaleString()}`;
      price.appendChild(sale);
      price.appendChild(original);
    } else {
      price.textContent = `${CURRENCY}${originalPrice.toLocaleString()}`;
    }
    overlay.appendChild(detailLink);
    overlay.appendChild(cartButton);
    media.appendChild(image);
    media.appendChild(overlay);
    body.appendChild(title);
    body.appendChild(price);
    article.appendChild(media);
    article.appendChild(body);
    block.appendChild(article);
    return block;
  }
  function createEmptyState(message) {
    const empty = document.createElement("p");
    empty.className = "flex w-full items-center justify-center py-16 text-center text-slate-500";
    empty.textContent = message;
    return empty;
  }
  function createErrorState(message) {
    const error = document.createElement("p");
    error.className = "flex w-full items-center justify-center py-16 text-center text-rose-600";
    error.textContent = message;
    return error;
  }
  function syncCarouselMode(wrapper, container, autoAnimate) {
    if (!wrapper || !container) {
      return;
    }
    if (autoAnimate) {
      wrapper.style.overflowX = "hidden";
      wrapper.style.overflowY = "hidden";
      wrapper.style.touchAction = "pan-y";
      container.style.display = "flex";
      container.style.gap = "1rem";
      container.style.width = "max-content";
      container.style.minWidth = "100%";
      container.style.transform = "translateX(0px)";
      container.style.willChange = "transform";
      return;
    }
    wrapper.style.overflowX = "auto";
    wrapper.style.overflowY = "hidden";
    wrapper.style.touchAction = "pan-x";
    wrapper.style.scrollBehavior = "smooth";
    container.style.display = "flex";
    container.style.gap = "1rem";
    container.style.width = "max-content";
    container.style.minWidth = "100%";
    container.style.transform = "none";
    container.style.willChange = "auto";
  }
  function initCarousel(container, wrapper, autoAnimate) {
    const state = {
      animationFrame: null,
      currentPosition: 0,
      totalWidth: 0,
      isHovering: false,
      isDragging: false,
      startX: 0,
      startPosition: 0,
      lastX: 0,
      lastTime: 0,
      dragVelocity: 0,
      productCount: 0
    };
    state.productCount = container.querySelectorAll(".home-product-card").length;
    function getPointerX(event) {
      if (event.touches && event.touches.length > 0) {
        return event.touches[0].pageX;
      }
      if (event.changedTouches && event.changedTouches.length > 0) {
        return event.changedTouches[0].pageX;
      }
      return event.pageX;
    }
    function measureSlider() {
      const firstItem = container.querySelector(".home-product-card");
      if (!firstItem || state.productCount === 0) {
        state.totalWidth = 0;
        return;
      }
      const gapValue = parseFloat(getComputedStyle(container).gap || "0") || 0;
      state.totalWidth = (firstItem.offsetWidth + gapValue) * state.productCount;
    }
    function animate() {
      if (!autoAnimate || !state.totalWidth) {
        state.animationFrame = requestAnimationFrame(animate);
        return;
      }
      if (!state.isHovering && !state.isDragging) {
        state.currentPosition -= 0.5;
        if (Math.abs(state.currentPosition) >= state.totalWidth) {
          state.currentPosition = 0;
        }
        container.style.transform = `translateX(${state.currentPosition}px)`;
      }
      state.animationFrame = requestAnimationFrame(animate);
    }
    function beginDrag(event) {
      if (!autoAnimate) {
        return;
      }
      if (event.target.closest("button") || event.target.closest("a")) {
        return;
      }
      state.isDragging = true;
      state.startX = getPointerX(event);
      state.startPosition = state.currentPosition;
      state.lastX = state.startX;
      state.lastTime = Date.now();
      state.dragVelocity = 0;
      wrapper.style.cursor = "grabbing";
      wrapper.style.userSelect = "none";
    }
    function moveDrag(event) {
      if (!autoAnimate || !state.isDragging) {
        return;
      }
      if (event.cancelable) {
        event.preventDefault();
      }
      const currentX = getPointerX(event);
      const diff = currentX - state.startX;
      state.currentPosition = state.startPosition + diff;
      const currentTime = Date.now();
      const timeDiff = currentTime - state.lastTime;
      if (timeDiff > 0) {
        state.dragVelocity = (currentX - state.lastX) / timeDiff;
      }
      state.lastX = currentX;
      state.lastTime = currentTime;
      if (state.totalWidth > 0) {
        if (state.currentPosition > 0) {
          state.currentPosition -= state.totalWidth;
          state.startPosition -= state.totalWidth;
          state.startX = getPointerX(event) - (state.currentPosition - state.startPosition);
        } else if (Math.abs(state.currentPosition) >= state.totalWidth * 2) {
          state.currentPosition += state.totalWidth;
          state.startPosition += state.totalWidth;
          state.startX = getPointerX(event) - (state.currentPosition - state.startPosition);
        }
      }
      container.style.transform = `translateX(${state.currentPosition}px)`;
    }
    function endDrag() {
      if (!autoAnimate || !state.isDragging) {
        return;
      }
      state.isDragging = false;
      wrapper.style.cursor = "grab";
      wrapper.style.userSelect = "";
      if (Math.abs(state.dragVelocity) <= 0.1 || !state.totalWidth) {
        return;
      }
      const inertia = () => {
        if (Math.abs(state.dragVelocity) <= 0.01) {
          return;
        }
        state.currentPosition += state.dragVelocity * 16;
        state.dragVelocity *= 0.95;
        if (state.totalWidth > 0) {
          if (state.currentPosition > 0) {
            state.currentPosition -= state.totalWidth;
          } else if (Math.abs(state.currentPosition) >= state.totalWidth * 2) {
            state.currentPosition += state.totalWidth;
          }
        }
        container.style.transform = `translateX(${state.currentPosition}px)`;
        requestAnimationFrame(inertia);
      };
      requestAnimationFrame(inertia);
    }
    function onWheel(event) {
      if (!autoAnimate || !state.isHovering) {
        return;
      }
      event.preventDefault();
      state.currentPosition -= event.deltaY * 2;
      if (state.totalWidth > 0) {
        if (state.currentPosition > 0) {
          state.currentPosition -= state.totalWidth;
        } else if (Math.abs(state.currentPosition) >= state.totalWidth * 2) {
          state.currentPosition += state.totalWidth;
        }
      }
      container.style.transform = `translateX(${state.currentPosition}px)`;
    }
    if (autoAnimate) {
      wrapper.addEventListener("mouseenter", () => {
        state.isHovering = true;
      });
      wrapper.addEventListener("mouseleave", () => {
        state.isHovering = false;
      });
      wrapper.addEventListener("mousedown", beginDrag);
      wrapper.addEventListener("touchstart", beginDrag, { passive: true });
      document.addEventListener("mousemove", moveDrag);
      document.addEventListener("touchmove", moveDrag, { passive: false });
      document.addEventListener("mouseup", endDrag);
      document.addEventListener("touchend", endDrag);
      document.addEventListener("touchcancel", endDrag);
      wrapper.addEventListener("wheel", onWheel, { passive: false });
      wrapper.style.cursor = "grab";
    }
    addEventListener("resize", () => {
      if (!container.querySelector(".home-product-card")) {
        return;
      }
      measureSlider();
      if (autoAnimate) {
        container.style.transform = `translateX(${state.currentPosition}px)`;
      }
    });
    measureSlider();
    if (autoAnimate) {
      animate();
    }
    return state;
  }
  async function loadProducts(container, wrapper, loading) {
    try {
      const result = await productsApi.getList({ perPage: 20, sort: "-order,-created" });
      const items = Array.isArray(result?.items) ? result.items : [];
      loading?.remove();
      container.replaceChildren();
      if (items.length === 0) {
        container.appendChild(createEmptyState(isKoreanPage2() ? "\uB4F1\uB85D\uB41C \uC0C1\uD488\uC774 \uC5C6\uC2B5\uB2C8\uB2E4." : "No products found."));
        return;
      }
      const autoAnimate = canAutoAnimate();
      syncCarouselMode(wrapper, container, autoAnimate);
      const repeatCount = autoAnimate ? Math.max(3, Math.ceil(20 / items.length)) : 1;
      for (let repeat = 0; repeat < repeatCount; repeat += 1) {
        items.forEach((product) => {
          container.appendChild(createCard(product));
        });
      }
      if (autoAnimate) {
        requestAnimationFrame(() => {
          initCarousel(container, wrapper, autoAnimate);
        });
      }
    } catch (error) {
      loading?.remove();
      container.replaceChildren(createErrorState(
        isKoreanPage2() ? `\uC0C1\uD488\uC744 \uBD88\uB7EC\uC624\uB294 \uC911 \uC624\uB958\uAC00 \uBC1C\uC0DD\uD588\uC2B5\uB2C8\uB2E4: ${error?.message || ""}`.trim() : `Failed to load products: ${error?.message || ""}`.trim()
      ));
    }
  }
  function initHomeProducts() {
    const section = document.querySelector(SECTION_SELECTOR);
    const container = section?.querySelector(CONTAINER_SELECTOR);
    const wrapper = section?.querySelector(WRAPPER_SELECTOR);
    const loading = section?.querySelector(LOADING_SELECTOR);
    if (!section || !container || !wrapper) {
      return;
    }
    loadProducts(container, wrapper, loading);
  }

  // ns-hugo-imp:C:\hugo\ex\shop\assets\js\product-list-page.js
  var SECTION_SELECTOR2 = "[data-product-list-page]";
  var CONTAINER_SELECTOR2 = "#product-list-container";
  function getLanguage(section) {
    const explicitLang = section?.dataset.productListLang;
    if (explicitLang) {
      return explicitLang.startsWith("ko") ? "ko" : "en";
    }
    return document.documentElement.lang === "ko" || location.pathname.startsWith("/ko/") ? "ko" : "en";
  }
  function getCurrency(section) {
    return section?.dataset.productListCurrency || "\u20A9";
  }
  function createPlaceholderImage(label) {
    const safeLabel = String(label || "").replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;");
    const svg = `
        <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 600 600" role="img" aria-label="${safeLabel}">
            <defs>
                <linearGradient id="bg" x1="0%" y1="0%" x2="100%" y2="100%">
                    <stop offset="0%" stop-color="#e2e8f0" />
                    <stop offset="100%" stop-color="#cbd5e1" />
                </linearGradient>
            </defs>
            <rect width="600" height="600" rx="56" fill="url(#bg)" />
            <circle cx="300" cy="240" r="76" fill="#f8fafc" fill-opacity="0.75" />
            <path d="M178 378c36-54 78-81 122-81s86 27 122 81" fill="none" stroke="#94a3b8" stroke-width="24" stroke-linecap="round" />
            <text x="300" y="510" text-anchor="middle" fill="#475569" font-size="38" font-family="Arial, sans-serif" font-weight="700">${safeLabel}</text>
        </svg>
    `.trim();
    return `data:image/svg+xml;charset=utf-8,${encodeURIComponent(svg)}`;
  }
  function escapeHtml3(value) {
    return String(value ?? "").replace(/[&<>"']/g, (char) => ({
      "&": "&amp;",
      "<": "&lt;",
      ">": "&gt;",
      '"': "&quot;",
      "'": "&#39;"
    })[char]);
  }
  function getProductUrl2(lang, slug) {
    return slug ? `/${lang}/products/${encodeURIComponent(slug)}/` : "#products";
  }
  function getProductCardImage(product, fallbackLabel) {
    if (product.images?.length) {
      return productsApi.getImageUrl(product, product.images[0], "300x300");
    }
    return createPlaceholderImage(fallbackLabel);
  }
  function renderEmptyState(container, lang) {
    container.innerHTML = `
        <div class="col-span-full py-12 text-center text-slate-600">
            <p>${lang === "ko" ? "\uB4F1\uB85D\uB41C \uC0C1\uD488\uC774 \uC5C6\uC2B5\uB2C8\uB2E4." : "No products found."}</p>
        </div>
    `;
  }
  function renderErrorState(container, message) {
    container.innerHTML = `
        <div class="col-span-full py-12 text-center text-rose-600">
            <p>${message}</p>
        </div>
    `;
  }
  function renderProductCard(product, lang, currency) {
    const detailUrl = getProductUrl2(lang, product.slug);
    const title = product.title || "";
    const fallbackLabel = lang === "ko" ? "\uC774\uBBF8\uC9C0 \uC5C6\uC74C" : "No Image";
    const imageUrl = getProductCardImage(product, fallbackLabel);
    const finalPrice = Number(product.discount_price || product.price || 0);
    const originalPrice = Number(product.price || 0);
    const titleHtml = escapeHtml3(title);
    const imageHtml = escapeHtml3(imageUrl);
    const detailUrlHtml = escapeHtml3(detailUrl);
    const cartOptions = JSON.stringify({ __productSlug: product.slug || "", __productUrl: detailUrl });
    const priceMarkup = product.discount_price ? `${currency}${Number(product.discount_price).toLocaleString()} <s class="text-sm font-medium text-slate-400">${currency}${originalPrice.toLocaleString()}</s>` : `${currency}${originalPrice.toLocaleString()}`;
    const card = document.createElement("div");
    card.className = "h-full";
    card.innerHTML = `
        <article class="group flex h-full flex-col overflow-hidden rounded-3xl bg-white shadow-sm ring-1 ring-slate-200 transition duration-300 hover:-translate-y-1 hover:shadow-xl">
            <div class="relative aspect-square overflow-hidden bg-slate-100">
                <img class="h-full w-full object-cover transition duration-500 group-hover:scale-105" src="${imageHtml}" alt="${titleHtml}" loading="lazy">
                <div class="absolute inset-0 flex flex-col justify-between bg-gradient-to-t from-slate-950/35 via-transparent to-transparent p-4 opacity-100 transition lg:opacity-0 lg:group-hover:opacity-100">
                    <a href="${detailUrlHtml}" class="inline-flex h-11 w-11 items-center justify-center self-end rounded-full bg-white/90 text-slate-700 shadow-lg backdrop-blur transition hover:bg-white hover:text-amber-500 focus:outline-none focus:ring-2 focus:ring-amber-400 focus:ring-offset-2" aria-label="${lang === "ko" ? "\uC0C1\uD488 \uC0C1\uC138\uBCF4\uAE30" : "View product details"}">
                        <i class="tf-ion-plus-round text-xl"></i>
                    </a>
                    <button
                        type="button"
                        class="inline-flex w-full items-center justify-center gap-2 rounded-full bg-amber-400 px-4 py-3 text-sm font-semibold text-white shadow-lg shadow-amber-200 transition hover:bg-amber-500 focus:outline-none focus:ring-2 focus:ring-amber-400 focus:ring-offset-2"
                        data-cart-action="add-item"
                        data-cart-id="${product.id || ""}"
                        data-cart-name="${titleHtml}"
                        data-cart-price="${finalPrice}"
                        data-cart-image="${imageHtml}"
                        data-cart-options='${cartOptions}'>
                        <span aria-hidden="true">\u{1F6D2}</span>
                        <span>${lang === "ko" ? "\uC7A5\uBC14\uAD6C\uB2C8 \uCD94\uAC00" : "Add to cart"}</span>
                    </button>
                </div>
            </div>
            <div class="flex flex-1 flex-col p-4 text-center sm:p-5">
                <h4 class="text-base font-semibold leading-6 text-slate-900 sm:text-lg">
                    <a href="${detailUrlHtml}" class="transition hover:text-amber-500">${titleHtml}</a>
                </h4>
                <p class="mt-2 text-lg font-semibold text-slate-700">${priceMarkup}</p>
            </div>
        </article>
    `;
    return card;
  }
  async function initProductListPage() {
    const section = document.querySelector(SECTION_SELECTOR2);
    const container = section?.querySelector(CONTAINER_SELECTOR2);
    if (!section || !container) {
      return;
    }
    const lang = getLanguage(section);
    const currency = getCurrency(section);
    try {
      const result = await productsApi.getList({ perPage: 100, sort: "-order,-created" });
      const items = Array.isArray(result?.items) ? result.items : [];
      container.replaceChildren();
      if (items.length === 0) {
        renderEmptyState(container, lang);
        return;
      }
      items.forEach((product) => {
        container.appendChild(renderProductCard(product, lang, currency));
      });
    } catch (error) {
      console.error("Failed to load products:", error);
      renderErrorState(
        container,
        lang === "ko" ? `\uC0C1\uD488\uC744 \uBD88\uB7EC\uC624\uB294 \uC911 \uC624\uB958\uAC00 \uBC1C\uC0DD\uD588\uC2B5\uB2C8\uB2E4: ${error?.message || ""}`.trim() : `Failed to load products: ${error?.message || ""}`.trim()
      );
    }
  }

  // ns-hugo-imp:C:\hugo\ex\shop\assets\js\blog-reading-progress.js
  var PROGRESS_SELECTOR = "#reading-progress";
  function getScrollState() {
    const docElement = document.documentElement;
    const docBody = document.body;
    const scrollTop = docElement.scrollTop || docBody.scrollTop || 0;
    const scrollHeight = Math.max(docElement.scrollHeight, docBody.scrollHeight);
    const viewportHeight = innerHeight || docElement.clientHeight || 0;
    const maxScroll = Math.max(scrollHeight - viewportHeight, 1);
    return Math.min(100, Math.max(0, scrollTop / maxScroll * 100));
  }
  function updateProgress(progressEl) {
    if (!progressEl) {
      return;
    }
    progressEl.style.width = `${getScrollState()}%`;
  }
  function initReadingProgress() {
    const progressEl = document.querySelector(PROGRESS_SELECTOR);
    if (!progressEl) {
      return;
    }
    let ticking = false;
    const onScroll = () => {
      if (ticking) {
        return;
      }
      ticking = true;
      requestAnimationFrame(() => {
        updateProgress(progressEl);
        ticking = false;
      });
    };
    updateProgress(progressEl);
    addEventListener("scroll", onScroll, { passive: true });
    addEventListener("resize", onScroll, { passive: true });
  }

  // ns-hugo-imp:C:\hugo\ex\shop\assets\js\product-detail-page.js
  function initSlider() {
    const slider = document.querySelector(".product-image-slider");
    if (!slider) {
      return;
    }
    slider.classList.add("is-native-slider");
  }
  function clampQuantity(value) {
    const parsed = Number.parseInt(value, 10);
    if (Number.isNaN(parsed) || parsed < 1) {
      return 1;
    }
    return parsed;
  }
  function getSelectedOption(root, groupName) {
    const group = root.querySelector(`[data-option-group-container="${groupName}"]`);
    if (!group) {
      return "";
    }
    const activeOption = group.querySelector(".product-chip.is-active");
    return activeOption ? activeOption.dataset.optionValue : "";
  }
  function updateSelectedOptionLabel(root, groupName) {
    const group = root.querySelector(`[data-option-group-container="${groupName}"]`);
    const label = root.querySelector(`[data-selected-option="${groupName}"]`);
    if (!group || !label) {
      return "";
    }
    const selectedValue = getSelectedOption(root, groupName);
    label.textContent = selectedValue;
    return selectedValue;
  }
  function initProductDetailPage() {
    const productDetailRoot = document.getElementById("product-detail-container");
    if (!productDetailRoot) {
      return;
    }
    initSlider();
    const quantityInput = productDetailRoot.querySelector("[data-product-quantity]");
    const totalPriceElement = productDetailRoot.querySelector("[data-product-total-price]");
    const addToCartButton = productDetailRoot.querySelector("[data-add-to-cart]");
    const currency = productDetailRoot.dataset.productCurrency || "";
    const unitPrice = Number(productDetailRoot.dataset.productPrice || 0);
    const formatCurrency2 = (value) => {
      const locale = document.documentElement.lang === "ko" ? "ko-KR" : "en-US";
      return currency + new Intl.NumberFormat(locale).format(value);
    };
    const updateTotalPrice = () => {
      if (!totalPriceElement) {
        return;
      }
      const quantity = clampQuantity(quantityInput ? quantityInput.value : 1);
      if (quantityInput) {
        quantityInput.value = quantity;
      }
      totalPriceElement.textContent = formatCurrency2(unitPrice * quantity);
    };
    productDetailRoot.querySelectorAll("[data-option-group-container]").forEach((group) => {
      const groupName = group.dataset.optionGroupContainer;
      group.querySelectorAll(".product-chip").forEach((button) => {
        button.addEventListener("click", function() {
          group.querySelectorAll(".product-chip").forEach((chip) => {
            chip.classList.remove("is-active");
            chip.setAttribute("aria-pressed", "false");
          });
          button.classList.add("is-active");
          button.setAttribute("aria-pressed", "true");
          updateSelectedOptionLabel(productDetailRoot, groupName);
        });
      });
      updateSelectedOptionLabel(productDetailRoot, groupName);
    });
    if (quantityInput) {
      quantityInput.addEventListener("input", updateTotalPrice);
    }
    productDetailRoot.querySelectorAll("[data-quantity-action]").forEach((button) => {
      button.addEventListener("click", function() {
        if (!quantityInput) {
          return;
        }
        const currentValue = clampQuantity(quantityInput.value);
        const nextValue = button.dataset.quantityAction === "decrease" ? Math.max(1, currentValue - 1) : currentValue + 1;
        quantityInput.value = nextValue;
        updateTotalPrice();
      });
    });
    updateTotalPrice();
    if (addToCartButton) {
      addToCartButton.addEventListener("click", async function() {
        const quantity = clampQuantity(quantityInput ? quantityInput.value : 1);
        const payload = {
          id: productDetailRoot.dataset.productId,
          name: productDetailRoot.dataset.productName,
          slug: productDetailRoot.dataset.productSlug || "",
          url: productDetailRoot.dataset.productUrl || "",
          price: unitPrice,
          image: productDetailRoot.dataset.productImage || "",
          quantity,
          options: {
            __productSlug: productDetailRoot.dataset.productSlug || "",
            __productUrl: productDetailRoot.dataset.productUrl || ""
          }
        };
        const selectedColor = getSelectedOption(productDetailRoot, "color");
        const selectedSize = getSelectedOption(productDetailRoot, "size");
        if (selectedColor) {
          payload.options.color = selectedColor;
        }
        if (selectedSize) {
          payload.options.size = selectedSize;
        }
        const defaultLabel = productDetailRoot.dataset.addLabel || addToCartButton.textContent;
        const addingLabel = productDetailRoot.dataset.addingLabel || defaultLabel;
        addToCartButton.disabled = true;
        addToCartButton.textContent = `\u{1F6D2} ${addingLabel}`;
        try {
          await Cart.addItem(payload);
        } catch (error) {
          console.error("Failed to add product to cart:", error);
          if (typeof Cart.notify === "function") {
            Cart.notify("\uC7A5\uBC14\uAD6C\uB2C8\uC5D0 \uC0C1\uD488\uC744 \uCD94\uAC00\uD558\uC9C0 \uBABB\uD588\uC2B5\uB2C8\uB2E4.", true);
          }
        } finally {
          addToCartButton.disabled = false;
          addToCartButton.textContent = `\u{1F6D2} ${defaultLabel}`;
        }
      });
    }
  }

  // <stdin>
  function initializeApp() {
    console.log("[Main] Initializing application...");
    bootstrapCartDrawer();
    setupHeaderNavigation();
    bootstrapHomeProducts();
    bootstrapProductListPage();
    bootstrapProductDetail();
    bootstrapProfilePage();
    bootstrapReadingProgress();
    console.log("[Main] Application initialized");
  }
  var cartInitialized = false;
  function bootstrapCartDrawer() {
    if (cartInitialized) {
      return;
    }
    if (!document.getElementById("cart-drawer")) {
      return;
    }
    const shopConfig = getShopConfig();
    if (!shopConfig?.storeId) {
      return;
    }
    cartInitialized = true;
    Cart.init(shopConfig);
  }
  function setupHeaderNavigation() {
    const navRoot = document.querySelector("[data-site-navigation]");
    const navPanel = document.querySelector("[data-nav-panel]");
    const toggleButton = document.querySelector("[data-nav-toggle]");
    if (!navRoot || !navPanel || !toggleButton) {
      return;
    }
    const desktopQuery = typeof matchMedia === "function" ? matchMedia("(min-width: 768px)") : { matches: true };
    let menuOpen = false;
    const syncMenuState = () => {
      if (desktopQuery.matches) {
        navPanel.classList.remove("hidden");
        toggleButton.setAttribute("aria-expanded", "false");
        menuOpen = false;
        return;
      }
      navPanel.classList.toggle("hidden", !menuOpen);
      toggleButton.setAttribute("aria-expanded", String(menuOpen));
    };
    const closeMenu = () => {
      menuOpen = false;
      syncMenuState();
    };
    const toggleMenu = () => {
      if (desktopQuery.matches) {
        return;
      }
      menuOpen = !menuOpen;
      syncMenuState();
    };
    toggleButton.addEventListener("click", function(event) {
      event.preventDefault();
      toggleMenu();
    });
    navPanel.addEventListener("click", function(event) {
      if (event.target.closest("a")) {
        closeMenu();
      }
    });
    document.addEventListener("click", function(event) {
      if (desktopQuery.matches || !menuOpen) {
        return;
      }
      if (!navRoot.contains(event.target)) {
        closeMenu();
      }
    });
    document.addEventListener("keydown", function(event) {
      if (event.key === "Escape" && !desktopQuery.matches) {
        closeMenu();
      }
    });
    addEventListener("resize", syncMenuState);
    syncMenuState();
  }
  function bootstrapProductDetail() {
    const productDetailRoot = document.getElementById("product-detail-container");
    const reviewRoot = document.getElementById("review-list");
    const qnaRoot = document.getElementById("qna-list");
    const productId = productDetailRoot?.dataset.productId || reviewRoot?.dataset.productId || qnaRoot?.dataset.productId;
    if (productDetailRoot) {
      initProductDetailPage();
    }
    if (!productId) {
      return;
    }
    if (reviewRoot) {
      Reviews.init(productId);
    }
    if (qnaRoot) {
      QnA.init(productId);
    }
  }
  function bootstrapProfilePage() {
    if (document.getElementById("profile-form") || document.getElementById("save-button")) {
      Profile.init();
    }
  }
  function bootstrapHomeProducts() {
    initHomeProducts();
  }
  function bootstrapProductListPage() {
    initProductListPage();
  }
  function bootstrapReadingProgress() {
    initReadingProgress();
  }
  if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", initializeApp);
  } else {
    initializeApp();
  }
})();
