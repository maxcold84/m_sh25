(() => {
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

  // ns-hugo-imp:C:\hugo\ex\shop\assets\js\admin-auth.js
  var pbInstance = null;
  function getAdminPb() {
    if (!pbInstance) {
      pbInstance = getInstance();
    }
    return pbInstance;
  }
  function checkAdmin() {
    const pb2 = getAdminPb();
    if (!pb2 || !pb2.authStore.isValid || !pb2.authStore.isAdmin) {
      sessionStorage.setItem("adminRedirectUrl", location.href);
      location.href = "/ko/admin/login";
      return false;
    }
    return true;
  }

  // ns-hugo-imp:C:\hugo\ex\shop\assets\js\admin-feedback.js
  var STYLE_ID = "admin-feedback-style";
  var TOAST_ROOT_ID = "admin-feedback-root";
  var DIALOG_ID = "admin-feedback-dialog";
  var dialogState = null;
  function ensureStyles() {
    if (document.getElementById(STYLE_ID)) {
      return;
    }
    const style = document.createElement("style");
    style.id = STYLE_ID;
    style.textContent = `
        #${TOAST_ROOT_ID} {
            position: fixed;
            top: 1rem;
            right: 1rem;
            z-index: 1200;
            display: grid;
            gap: 0.75rem;
            width: min(24rem, calc(100vw - 2rem));
            pointer-events: none;
        }

        .admin-feedback-toast {
            pointer-events: auto;
            border-radius: 18px;
            border: 1px solid #dbe3ef;
            background: rgba(255, 255, 255, 0.96);
            color: #0f172a;
            box-shadow: 0 20px 45px rgba(15, 23, 42, 0.18);
            padding: 0.95rem 1rem;
            line-height: 1.5;
            white-space: pre-line;
            opacity: 0;
            transform: translateY(-8px);
            transition: opacity 0.18s ease, transform 0.18s ease;
        }

        .admin-feedback-toast.is-visible {
            opacity: 1;
            transform: translateY(0);
        }

        .admin-feedback-toast--error {
            border-color: #fecaca;
            background: #fff7f7;
            color: #991b1b;
        }

        .admin-feedback-toast--success {
            border-color: #bbf7d0;
            background: #f0fdf4;
            color: #166534;
        }

        .admin-feedback-toast--info {
            border-color: #dbeafe;
            background: #eff6ff;
            color: #1d4ed8;
        }

        #${DIALOG_ID}[hidden] {
            display: none !important;
        }

        #${DIALOG_ID} {
            position: fixed;
            inset: 0;
            z-index: 1250;
            display: grid;
            place-items: center;
            padding: 1rem;
        }

        .admin-feedback-dialog__backdrop {
            position: absolute;
            inset: 0;
            background: rgba(15, 23, 42, 0.62);
            backdrop-filter: blur(3px);
        }

        .admin-feedback-dialog__panel {
            position: relative;
            z-index: 1;
            width: min(32rem, 100%);
            overflow: hidden;
            border-radius: 24px;
            border: 1px solid rgba(148, 163, 184, 0.22);
            background: linear-gradient(180deg, #ffffff 0%, #f8fafc 100%);
            box-shadow: 0 30px 80px rgba(15, 23, 42, 0.28);
        }

        .admin-feedback-dialog__header {
            padding: 1.25rem 1.25rem 1rem;
            border-bottom: 1px solid #e2e8f0;
        }

        .admin-feedback-dialog__title {
            margin: 0;
            color: #0f172a;
            font-size: 1.12rem;
            font-weight: 750;
        }

        .admin-feedback-dialog__body {
            display: grid;
            gap: 0.9rem;
            padding: 1.25rem;
        }

        .admin-feedback-dialog__message {
            margin: 0;
            color: #475569;
            line-height: 1.6;
            white-space: pre-line;
        }

        .admin-feedback-dialog__input {
            width: 100%;
            padding: 0.8rem 0.95rem;
            border: 1px solid #cbd5e1;
            border-radius: 14px;
            background: #fff;
            color: #0f172a;
        }

        .admin-feedback-dialog__input:focus {
            outline: none;
            border-color: #2563eb;
            box-shadow: 0 0 0 4px rgba(37, 99, 235, 0.12);
        }

        .admin-feedback-dialog__error {
            min-height: 1.25rem;
            color: #b91c1c;
            font-size: 0.875rem;
        }

        .admin-feedback-dialog__footer {
            display: flex;
            justify-content: flex-end;
            gap: 0.75rem;
            padding: 1rem 1.25rem 1.25rem;
            border-top: 1px solid #e2e8f0;
            background: rgba(248, 250, 252, 0.92);
        }

        .admin-feedback-dialog__button {
            display: inline-flex;
            align-items: center;
            justify-content: center;
            min-height: 2.8rem;
            padding: 0.82rem 1rem;
            border: 1px solid transparent;
            border-radius: 14px;
            font-weight: 700;
            line-height: 1;
            cursor: pointer;
        }

        .admin-feedback-dialog__button--cancel {
            background: #e2e8f0;
            color: #0f172a;
        }

        .admin-feedback-dialog__button--confirm {
            background: #0f172a;
            color: #fff;
            box-shadow: 0 12px 30px rgba(15, 23, 42, 0.16);
        }

        .admin-feedback-dialog__button--danger {
            background: #ef4444;
        }

        @media (max-width: 640px) {
            #${TOAST_ROOT_ID} {
                right: 0.75rem;
                left: 0.75rem;
                width: auto;
            }

            #${DIALOG_ID} {
                padding: 0.75rem;
            }

            .admin-feedback-dialog__header,
            .admin-feedback-dialog__body,
            .admin-feedback-dialog__footer {
                padding-left: 1rem;
                padding-right: 1rem;
            }

            .admin-feedback-dialog__footer {
                flex-direction: column-reverse;
            }

            .admin-feedback-dialog__button {
                width: 100%;
            }
        }
    `;
    document.head.appendChild(style);
  }
  function ensureToastRoot() {
    let root = document.getElementById(TOAST_ROOT_ID);
    if (!root) {
      root = document.createElement("div");
      root.id = TOAST_ROOT_ID;
      root.setAttribute("aria-live", "polite");
      root.setAttribute("aria-atomic", "true");
      document.body.appendChild(root);
    }
    return root;
  }
  function ensureDialog() {
    let dialog = document.getElementById(DIALOG_ID);
    if (dialog) {
      return dialog;
    }
    dialog = document.createElement("div");
    dialog.id = DIALOG_ID;
    dialog.hidden = true;
    dialog.innerHTML = `
        <div class="admin-feedback-dialog__backdrop" data-admin-feedback-backdrop></div>
        <section class="admin-feedback-dialog__panel" role="dialog" aria-modal="true" aria-labelledby="admin-feedback-dialog-title">
            <header class="admin-feedback-dialog__header">
                <h3 class="admin-feedback-dialog__title" id="admin-feedback-dialog-title"></h3>
            </header>
            <div class="admin-feedback-dialog__body">
                <p class="admin-feedback-dialog__message" id="admin-feedback-dialog-message"></p>
                <input class="admin-feedback-dialog__input" id="admin-feedback-dialog-input" type="text" hidden>
                <div class="admin-feedback-dialog__error" id="admin-feedback-dialog-error" aria-live="polite"></div>
            </div>
            <footer class="admin-feedback-dialog__footer">
                <button type="button" class="admin-feedback-dialog__button admin-feedback-dialog__button--cancel" data-admin-feedback-cancel></button>
                <button type="button" class="admin-feedback-dialog__button admin-feedback-dialog__button--confirm" data-admin-feedback-confirm></button>
            </footer>
        </section>
    `;
    document.body.appendChild(dialog);
    dialog.querySelector("[data-admin-feedback-backdrop]").addEventListener("click", function() {
      resolveDialog(dialogState?.kind === "prompt" ? null : false);
    });
    dialog.querySelector("[data-admin-feedback-cancel]").addEventListener("click", function() {
      resolveDialog(dialogState?.kind === "prompt" ? null : false);
    });
    dialog.querySelector("[data-admin-feedback-confirm]").addEventListener("click", function() {
      if (!dialogState) {
        return;
      }
      if (dialogState.kind === "prompt") {
        const input = dialog.querySelector("#admin-feedback-dialog-input");
        const errorEl = dialog.querySelector("#admin-feedback-dialog-error");
        const value = input.value.trim();
        const validationMessage = typeof dialogState.validate === "function" ? dialogState.validate(value) : "";
        if (validationMessage) {
          errorEl.textContent = validationMessage;
          input.focus();
          return;
        }
        resolveDialog(value);
        return;
      }
      resolveDialog(true);
    });
    document.addEventListener("keydown", function(event) {
      if (event.key !== "Escape" || !dialogState) {
        return;
      }
      resolveDialog(dialogState.kind === "prompt" ? null : false);
    });
    return dialog;
  }
  function resolveDialog(result) {
    if (!dialogState) {
      return;
    }
    const { resolve, dialog, previousOverflow, previousActiveElement } = dialogState;
    dialog.hidden = true;
    dialogState = null;
    document.body.style.overflow = previousOverflow || "";
    if (previousActiveElement && typeof previousActiveElement.focus === "function") {
      previousActiveElement.focus();
    }
    resolve(result);
  }
  function openDialog(kind, options = {}) {
    ensureStyles();
    const dialog = ensureDialog();
    const titleEl = dialog.querySelector("#admin-feedback-dialog-title");
    const messageEl = dialog.querySelector("#admin-feedback-dialog-message");
    const inputEl = dialog.querySelector("#admin-feedback-dialog-input");
    const errorEl = dialog.querySelector("#admin-feedback-dialog-error");
    const cancelButton = dialog.querySelector("[data-admin-feedback-cancel]");
    const confirmButton = dialog.querySelector("[data-admin-feedback-confirm]");
    titleEl.textContent = options.title || "";
    messageEl.textContent = options.message || "";
    errorEl.textContent = "";
    cancelButton.textContent = options.cancelLabel || "\uCDE8\uC18C";
    confirmButton.textContent = options.confirmLabel || "\uD655\uC778";
    confirmButton.classList.toggle("admin-feedback-dialog__button--danger", Boolean(options.danger));
    if (kind === "prompt") {
      inputEl.hidden = false;
      inputEl.placeholder = options.placeholder || "";
      inputEl.value = options.initialValue || "";
    } else {
      inputEl.hidden = true;
      inputEl.placeholder = "";
      inputEl.value = "";
    }
    const previousOverflow = document.body.style.overflow;
    const previousActiveElement = document.activeElement;
    dialog.hidden = false;
    document.body.style.overflow = "hidden";
    return new Promise((resolve) => {
      dialogState = {
        kind,
        resolve,
        dialog,
        previousOverflow,
        previousActiveElement,
        validate: options.validate
      };
      setTimeout(function() {
        if (kind === "prompt") {
          inputEl.focus();
          inputEl.select();
        } else {
          confirmButton.focus();
        }
      }, 0);
    });
  }
  function toast(message, options = {}) {
    ensureStyles();
    const root = ensureToastRoot();
    const toastEl = document.createElement("div");
    const type = options.type || "info";
    const duration = options.duration || (type === "error" ? 4200 : 2800);
    toastEl.className = `admin-feedback-toast admin-feedback-toast--${type}`;
    toastEl.textContent = message;
    root.appendChild(toastEl);
    requestAnimationFrame(function() {
      toastEl.classList.add("is-visible");
    });
    setTimeout(function() {
      toastEl.classList.remove("is-visible");
      setTimeout(function() {
        toastEl.remove();
      }, 180);
    }, duration);
  }
  function confirmDialog(options = {}) {
    return openDialog("confirm", options);
  }

  // <stdin>
  function showAdminProductsToast(message, type = "info", duration) {
    toast(message, { type, duration });
  }
  function confirmAdminProductsAction(options) {
    return confirmDialog(options);
  }
  var AdminCategories = {
    pb: null,
    categories: [],
    modal: null,
    _currentTrigger: null,
    _previousBodyOverflow: "",
    _escapeHandlerBound: false,
    init: async function(pb2) {
      this.pb = pb2;
      this.modal = document.getElementById("categoryModal");
      const form = document.getElementById("category-form");
      if (form) {
        form.addEventListener("submit", (e) => {
          e.preventDefault();
          this.addCategory();
        });
      }
      const categoryList = document.getElementById("category-list");
      if (categoryList && !categoryList.dataset.bound) {
        categoryList.dataset.bound = "true";
        categoryList.addEventListener("click", (event) => {
          const button = event.target.closest('[data-action="delete-category"]');
          if (!button) return;
          this.deleteCategory(button.dataset.categoryId);
        });
      }
      this.bindModalEvents();
      await this.loadCategories();
    },
    bindModalEvents: function() {
      const modal = this.modal || document.getElementById("categoryModal");
      if (!modal || modal.dataset.bound) return;
      this.modal = modal;
      modal.dataset.bound = "true";
      modal.addEventListener("click", (event) => {
        if (event.target === modal || event.target.closest("[data-category-modal-close]")) {
          this.closeModal();
        }
      });
      if (!this._escapeHandlerBound) {
        document.addEventListener("keydown", (event) => {
          if (event.key === "Escape" && this.isOpen()) {
            this.closeModal();
          }
        });
        this._escapeHandlerBound = true;
      }
    },
    isOpen: function() {
      return !!(this.modal && !this.modal.hidden);
    },
    loadCategories: async function() {
      try {
        this.categories = await this.pb.collection("categories").getFullList({
          sort: "name"
        });
        this.renderList();
        this.updateDropdowns();
      } catch (error) {
        console.error("Error loading categories:", error);
        if (error.status === 404) {
          const list = document.getElementById("category-list");
          if (list) list.innerHTML = '<div class="admin-category-state admin-category-state--error">\uCE74\uD14C\uACE0\uB9AC \uCEEC\uB809\uC158\uC774 \uC5C6\uC2B5\uB2C8\uB2E4.</div>';
        }
      }
    },
    renderList: function() {
      const list = document.getElementById("category-list");
      if (!list) return;
      if (this.categories.length === 0) {
        list.innerHTML = '<div class="admin-category-state">\uCE74\uD14C\uACE0\uB9AC\uAC00 \uC5C6\uC2B5\uB2C8\uB2E4.</div>';
        return;
      }
      list.innerHTML = "";
      this.categories.forEach((cat) => {
        const item = document.createElement("div");
        item.className = "admin-category-item";
        item.innerHTML = `
                <span class="admin-category-item__name">${cat.name}</span>
                <button class="admin-category-item__delete" type="button" data-action="delete-category" data-category-id="${cat.id}">
                    &times;
                </button>
            `;
        list.appendChild(item);
      });
    },
    updateDropdowns: function() {
      const selects = document.querySelectorAll("#product-category, #filter-category");
      selects.forEach((select) => {
        const currentVal = select.value;
        const isFilter = select.id === "filter-category";
        select.innerHTML = isFilter ? '<option value="">\uBAA8\uB4E0 \uCE74\uD14C\uACE0\uB9AC</option>' : '<option value="">\uCE74\uD14C\uACE0\uB9AC \uC120\uD0DD</option>';
        this.categories.forEach((cat) => {
          const option = document.createElement("option");
          option.value = cat.id;
          option.textContent = cat.name;
          select.appendChild(option);
        });
        if (currentVal) select.value = currentVal;
      });
    },
    addCategory: async function() {
      const input = document.getElementById("new-category-name");
      const name = input.value.trim();
      if (!name) return;
      const slug = name.toLowerCase().replace(/\s+/g, "-").replace(/[^\w\-가-힣]/g, "").replace(/^-|-$/g, "");
      try {
        await this.pb.collection("categories").create({
          name,
          slug: slug || "cat-" + Date.now()
        });
        input.value = "";
        await this.loadCategories();
      } catch (error) {
        console.error("Error creating category:", error);
        showAdminProductsToast("\uCE74\uD14C\uACE0\uB9AC \uCD94\uAC00 \uC2E4\uD328: " + error.message, "error");
      }
    },
    deleteCategory: async function(id) {
      const confirmed = await confirmAdminProductsAction({
        title: "\uCE74\uD14C\uACE0\uB9AC \uC0AD\uC81C",
        message: "\uC815\uB9D0 \uC0AD\uC81C\uD558\uC2DC\uACA0\uC2B5\uB2C8\uAE4C?",
        confirmLabel: "\uC0AD\uC81C",
        danger: true
      });
      if (!confirmed) return;
      try {
        await this.pb.collection("categories").delete(id);
        await this.loadCategories();
      } catch (error) {
        console.error("Error deleting category:", error);
        showAdminProductsToast("\uCE74\uD14C\uACE0\uB9AC \uC0AD\uC81C \uC2E4\uD328", "error");
      }
    },
    openModal: function(trigger) {
      const modal = this.modal || document.getElementById("categoryModal");
      if (!modal) return;
      this.modal = modal;
      this._previousBodyOverflow = document.body.style.overflow;
      this._currentTrigger = trigger && typeof trigger.focus === "function" ? trigger : document.activeElement && typeof document.activeElement.focus === "function" ? document.activeElement : null;
      modal.hidden = false;
      modal.setAttribute("aria-hidden", "false");
      document.body.style.overflow = "hidden";
      const input = document.getElementById("new-category-name");
      if (input) {
        setTimeout(() => input.focus(), 0);
      }
    },
    closeModal: function() {
      const modal = this.modal || document.getElementById("categoryModal");
      if (!modal) return;
      modal.hidden = true;
      modal.setAttribute("aria-hidden", "true");
      document.body.style.overflow = this._previousBodyOverflow || "";
      if (this._currentTrigger) {
        this._currentTrigger.focus();
      }
      this._currentTrigger = null;
    }
  };
  var AdminProducts = {
    pb: null,
    currentProduct: null,
    visualItems: [],
    // Array of { type: 'existing'|'new', value: filename|File, id: uniqueId }
    sortable: null,
    _slugGenerator: null,
    modal: null,
    _currentTrigger: null,
    _previousBodyOverflow: "",
    _escapeHandlerBound: false,
    init: async function() {
      this.pb = getAdminPb();
      if (!checkAdmin()) {
        return;
      }
      await AdminCategories.init(this.pb);
      this.bindEvents();
      this.bindModalEvents();
      document.body.addEventListener("htmx:configRequest", (event) => {
        if (this.pb && this.pb.authStore.isValid) {
          event.detail.headers.Authorization = this.pb.authStore.token;
        }
      });
      this.loadProducts();
    },
    bindEvents: function() {
      const addProductBtn = document.getElementById("add-product-btn");
      if (addProductBtn && !addProductBtn.dataset.bound) {
        addProductBtn.dataset.bound = "true";
        addProductBtn.addEventListener("click", (event) => this.openAddModal(event.currentTarget));
      }
      const manageCategoriesBtn = document.getElementById("manage-categories-btn");
      if (manageCategoriesBtn && !manageCategoriesBtn.dataset.bound) {
        manageCategoriesBtn.dataset.bound = "true";
        manageCategoriesBtn.addEventListener("click", (event) => AdminCategories.openModal(event.currentTarget));
      }
      const filterCategory = document.getElementById("filter-category");
      if (filterCategory && !filterCategory.dataset.bound) {
        filterCategory.dataset.bound = "true";
        filterCategory.addEventListener("change", () => this.loadProducts());
      }
      const productImages = document.getElementById("product-images");
      if (productImages && !productImages.dataset.bound) {
        productImages.dataset.bound = "true";
        productImages.addEventListener("change", (event) => this.handleImageSelect(event.target));
      }
      const productForm = document.getElementById("product-form");
      if (productForm && !productForm.dataset.bound) {
        productForm.dataset.bound = "true";
        productForm.addEventListener("submit", (event) => {
          event.preventDefault();
          this.saveProduct();
        });
      }
      const tableBody = document.getElementById("product-table-body");
      if (tableBody && !tableBody.dataset.bound) {
        tableBody.dataset.bound = "true";
        tableBody.addEventListener("click", (event) => {
          const button = event.target.closest("[data-action]");
          if (!button) return;
          const { action, productId } = button.dataset;
          if (action === "edit-product") {
            this.openEditModal(productId, button);
          } else if (action === "delete-product") {
            this.deleteProduct(productId);
          }
        });
        tableBody.addEventListener("change", (event) => {
          const select = event.target.closest('[data-action="product-category-select"]');
          if (!select) return;
          this.updateCategory(select.dataset.productId, select.value);
        });
      }
    },
    bindModalEvents: function() {
      const modal = this.modal || document.getElementById("productModal");
      if (!modal || modal.dataset.bound) return;
      this.modal = modal;
      modal.dataset.bound = "true";
      modal.addEventListener("click", (event) => {
        if (event.target === modal || event.target.closest("[data-product-modal-close]")) {
          this.closeModal();
        }
      });
      if (!this._escapeHandlerBound) {
        document.addEventListener("keydown", (event) => {
          if (event.key === "Escape" && this.isModalOpen()) {
            this.closeModal();
          }
        });
        this._escapeHandlerBound = true;
      }
    },
    isModalOpen: function() {
      return !!(this.modal && !this.modal.hidden);
    },
    openModal: function() {
      const modal = this.modal || document.getElementById("productModal");
      if (!modal) return;
      this.modal = modal;
      this._previousBodyOverflow = document.body.style.overflow;
      modal.hidden = false;
      modal.setAttribute("aria-hidden", "false");
      document.body.style.overflow = "hidden";
      setTimeout(() => {
        const focusTarget = document.getElementById("product-title") || modal.querySelector("input, textarea, select");
        if (focusTarget && typeof focusTarget.focus === "function") {
          focusTarget.focus();
        }
      }, 0);
    },
    closeModal: function() {
      const modal = this.modal || document.getElementById("productModal");
      if (!modal) return;
      modal.hidden = true;
      modal.setAttribute("aria-hidden", "true");
      document.body.style.overflow = this._previousBodyOverflow || "";
      if (this._currentTrigger && typeof this._currentTrigger.focus === "function") {
        this._currentTrigger.focus();
      }
      this._currentTrigger = null;
    },
    loadProducts: async function() {
      const tableBody = document.getElementById("product-table-body");
      const spinner = document.getElementById("loading-spinner");
      spinner.style.display = "flex";
      tableBody.innerHTML = "";
      try {
        const filterCategory = document.getElementById("filter-category").value;
        const records = await this.pb.collection("products").getFullList({
          sort: "-created",
          expand: "category"
        });
        spinner.style.display = "none";
        let displayRecords = records;
        if (filterCategory) {
          displayRecords = records.filter((p) => p.category === filterCategory);
        }
        if (displayRecords.length === 0) {
          tableBody.innerHTML = '<tr><td colspan="9" class="admin-empty-state">\uB4F1\uB85D\uB41C \uC0C1\uD488\uC774 \uC5C6\uC2B5\uB2C8\uB2E4</td></tr>';
          return;
        }
        const inquiries = await this.pb.collection("product_inquiries").getFullList({
          fields: "product_id,reply",
          sort: "-created"
        });
        const inquiryMap = {};
        inquiries.forEach((inq) => {
          if (!inquiryMap[inq.product_id]) inquiryMap[inq.product_id] = { total: 0, waiting: 0 };
          inquiryMap[inq.product_id].total++;
          if (!inq.reply) inquiryMap[inq.product_id].waiting++;
        });
        displayRecords.forEach((product) => {
          const tr = document.createElement("tr");
          const imageUrl = product.images && product.images.length > 0 ? this.pb.files.getUrl(product, product.images[0], { thumb: "100x100" }) : "";
          let categorySelectHtml = `<select class="admin-select admin-category-select" data-action="product-category-select" data-product-id="${product.id}">
                    <option value="">(\uBBF8\uC9C0\uC815)</option>`;
          AdminCategories.categories.forEach((cat) => {
            const selected = product.category === cat.id ? "selected" : "";
            categorySelectHtml += `<option value="${cat.id}" ${selected}>${cat.name}</option>`;
          });
          categorySelectHtml += `</select>`;
          const stats = inquiryMap[product.id] || { total: 0, waiting: 0 };
          let inquiryBadge = "-";
          if (stats.total > 0) {
            const badgeClass = stats.waiting > 0 ? "admin-pill admin-pill--warning" : "admin-pill admin-pill--muted";
            inquiryBadge = `<span class="${badgeClass}" title="\uBB38\uC758 ${stats.total}\uAC74 (\uB2F5\uBCC0\uB300\uAE30 ${stats.waiting})">
                        <i class="tf-ion-chatbubbles"></i> ${stats.waiting > 0 ? stats.waiting : stats.total}
                    </span>`;
          }
          const imageCellHtml = imageUrl ? `<div class="admin-table-thumb"><img src="${imageUrl}" alt="${product.title}"></div>` : '<div class="admin-table-thumb admin-table-thumb--empty">-</div>';
          tr.innerHTML = `
                    <td>
                        ${imageCellHtml}
                    </td>
                    <td>${categorySelectHtml}</td>
                    <td class="admin-product-title">${product.title}</td>
                    <td>${product.discount_price && product.discount_price > 0 ? `<del style="color: #64748b; font-size: 0.85rem;">${product.price.toLocaleString()}</del> <br><span style="color: #b91c1c; font-weight: 700;">${product.discount_price.toLocaleString()}</span>` : product.price.toLocaleString()}</td>
                    <td>${product.stock || 0}</td>
                    <td style="text-align: center;">${inquiryBadge}</td>
                    <td>
                        <div class="admin-switch">
                            <input type="checkbox" class="admin-switch__input" id="status-${product.id}" 
                                ${product.enabled ? "checked" : ""}
                                hx-patch="${getPocketBaseUrl()}/api/collections/products/records/${product.id}"
                                hx-trigger="change"
                                hx-vals='js:{"enabled": event.target.checked}'
                                hx-swap="none">
                            <label class="admin-switch__track" for="status-${product.id}">
                                <span class="admin-switch__thumb"></span>
                            </label>
                        </div>
                    </td>
                    <td>
                        <div class="admin-table-actions">
                            <button class="admin-btn admin-btn--outline admin-btn--sm" type="button" data-action="edit-product" data-product-id="${product.id}">\uC218\uC815</button>
                            <button class="admin-btn admin-btn--danger admin-btn--sm" type="button" data-action="delete-product" data-product-id="${product.id}">\uC0AD\uC81C</button>
                            <a href="/${product.language || "ko"}/products/${product.slug}/" target="_blank" rel="noreferrer" class="admin-btn admin-btn--light admin-btn--sm">\uC0C1\uC138\uD398\uC774\uC9C0</a>
                        </div>
                    </td>
                `;
          tableBody.appendChild(tr);
          htmx.process(tr);
        });
      } catch (error) {
        console.error("Error loading products:", error);
        spinner.style.display = "none";
        showAdminProductsToast("\uC0C1\uD488 \uBAA9\uB85D\uC744 \uBD88\uB7EC\uC624\uB294 \uC911 \uC624\uB958\uAC00 \uBC1C\uC0DD\uD588\uC2B5\uB2C8\uB2E4", "error");
      }
    },
    openAddModal: function(trigger) {
      this.currentProduct = null;
      document.getElementById("product-form").reset();
      document.getElementById("product-id").value = "";
      document.getElementById("product-category").value = "";
      document.getElementById("productModalLabel").innerText = "\uC0C1\uD488 \uCD94\uAC00";
      document.getElementById("product-stock").value = "0";
      document.getElementById("product-admin-memo").value = "";
      this._currentTrigger = trigger || document.getElementById("add-product-btn") || document.activeElement;
      this.visualItems = [];
      this.renderImages();
      this.bindSlugGenerator();
      this.openModal();
    },
    openEditModal: async function(id, trigger) {
      try {
        const product = await this.pb.collection("products").getOne(id);
        this.currentProduct = product;
        this._currentTrigger = trigger || document.activeElement;
        document.getElementById("product-id").value = product.id;
        document.getElementById("product-title").value = product.title;
        document.getElementById("product-category").value = product.category || "";
        document.getElementById("product-slug").value = product.slug;
        document.getElementById("product-description").value = product.description;
        document.getElementById("product-admin-memo").value = product.admin_memo || "";
        document.getElementById("product-price").value = product.price;
        document.getElementById("product-discount").value = product.discount_price;
        document.getElementById("product-stock").value = product.stock || 0;
        document.getElementById("product-order").value = product.order;
        document.getElementById("product-enabled").checked = product.enabled;
        document.getElementById("product-language").value = product.language;
        this.detachSlugGenerator();
        const colors = product.colors ? Array.isArray(product.colors) ? product.colors : JSON.parse(product.colors) : [];
        const sizes = product.sizes ? Array.isArray(product.sizes) ? product.sizes : JSON.parse(product.sizes) : [];
        document.getElementById("product-colors").value = colors.join(", ");
        document.getElementById("product-sizes").value = sizes.join(", ");
        this.visualItems = [];
        if (product.images && product.images.length > 0) {
          product.images.forEach((img) => {
            this.visualItems.push({
              type: "existing",
              value: img,
              id: "exist-" + img
            });
          });
        }
        this.renderImages();
        document.getElementById("productModalLabel").innerText = "\uC0C1\uD488 \uC218\uC815";
        this.openModal();
      } catch (error) {
        console.error("Error fetching product details:", error);
        showAdminProductsToast("\uC0C1\uD488 \uC815\uBCF4\uB97C \uBD88\uB7EC\uC624\uB294 \uC911 \uC624\uB958\uAC00 \uBC1C\uC0DD\uD588\uC2B5\uB2C8\uB2E4", "error");
      }
    },
    bindSlugGenerator: function() {
      const titleInput = document.getElementById("product-title");
      const slugInput = document.getElementById("product-slug");
      if (!titleInput || !slugInput) return;
      this.detachSlugGenerator();
      this._slugGenerator = () => {
        const title = titleInput.value;
        let slug = title.toLowerCase().trim().replace(/\s+/g, "-").replace(/[^\w\-가-힣]/g, "").replace(/[가-힣]/g, function() {
          return "";
        }).replace(/\-+/g, "-").replace(/^-|-$/g, "");
        if (!slug) {
          slug = "product-" + Date.now();
        }
        slugInput.value = slug;
      };
      titleInput.addEventListener("input", this._slugGenerator);
    },
    detachSlugGenerator: function() {
      const titleInput = document.getElementById("product-title");
      if (titleInput && this._slugGenerator) {
        titleInput.removeEventListener("input", this._slugGenerator);
      }
      this._slugGenerator = null;
    },
    saveProduct: async function() {
      const id = document.getElementById("product-id").value;
      const title = document.getElementById("product-title").value;
      const category = document.getElementById("product-category").value;
      const slug = document.getElementById("product-slug").value;
      const description = document.getElementById("product-description").value;
      const adminMemo = document.getElementById("product-admin-memo").value;
      const price = parseFloat(document.getElementById("product-price").value);
      const discountPriceStr = document.getElementById("product-discount").value;
      const stockStr = document.getElementById("product-stock").value;
      const orderStr = document.getElementById("product-order").value;
      const enabled = document.getElementById("product-enabled").checked;
      const language = document.getElementById("product-language").value;
      const colorsStr = document.getElementById("product-colors").value;
      const sizesStr = document.getElementById("product-sizes").value;
      const colors = colorsStr ? colorsStr.split(",").map((s) => s.trim()).filter((s) => s) : [];
      const sizes = sizesStr ? sizesStr.split(",").map((s) => s.trim()).filter((s) => s) : [];
      const newFiles = this.visualItems.filter((item) => item.type === "new").map((item) => item.value);
      const existingFiles = this.visualItems.filter((item) => item.type === "existing").map((item) => item.value);
      const formData = new FormData();
      formData.append("title", title);
      if (category) formData.append("category", category);
      formData.append("slug", slug);
      formData.append("description", description || "");
      formData.append("admin_memo", adminMemo || "");
      formData.append("price", price);
      if (discountPriceStr && discountPriceStr.trim() !== "") {
        formData.append("discount_price", parseFloat(discountPriceStr));
      }
      if (stockStr && stockStr.trim() !== "") {
        formData.append("stock", parseInt(stockStr));
      } else {
        formData.append("stock", 0);
      }
      if (orderStr && orderStr.trim() !== "") {
        formData.append("order", parseInt(orderStr));
      } else {
        formData.append("order", 0);
      }
      formData.append("enabled", enabled);
      formData.append("language", language);
      formData.append("colors", JSON.stringify(colors));
      formData.append("sizes", JSON.stringify(sizes));
      if (newFiles.length > 0) {
        for (const file of newFiles) {
          formData.append("images", file);
        }
      }
      if (id) {
        existingFiles.forEach((filename) => {
          formData.append("images", filename);
        });
      }
      try {
        let record;
        if (id) {
          record = await this.pb.collection("products").update(id, formData);
        } else {
          record = await this.pb.collection("products").create(formData);
        }
        const finalImages = [];
        const serverImages = record.images ? [...record.images] : [];
        const addedCount = newFiles.length;
        const newServerImages = serverImages.slice(serverImages.length - addedCount);
        let newImgIdx = 0;
        this.visualItems.forEach((item) => {
          if (item.type === "existing") {
            if (serverImages.includes(item.value)) {
              finalImages.push(item.value);
            }
          } else if (item.type === "new") {
            if (newImgIdx < newServerImages.length) {
              finalImages.push(newServerImages[newImgIdx]);
              newImgIdx++;
            }
          }
        });
        const currentServerOrder = JSON.stringify(record.images);
        const newOrder = JSON.stringify(finalImages);
        if (currentServerOrder !== newOrder) {
          await this.pb.collection("products").update(record.id, {
            images: finalImages
          });
        }
        this.closeModal();
        this.loadProducts();
      } catch (error) {
        console.error("Error saving product:", error);
        showAdminProductsToast("\uC0C1\uD488 \uC800\uC7A5 \uC2E4\uD328: " + error.message, "error", 4200);
      }
    },
    deleteProduct: async function(id) {
      const confirmed = await confirmAdminProductsAction({
        title: "\uC0C1\uD488 \uC0AD\uC81C",
        message: "\uC774 \uC0C1\uD488\uC744 \uC0AD\uC81C\uD558\uC2DC\uACA0\uC2B5\uB2C8\uAE4C?",
        confirmLabel: "\uC0AD\uC81C",
        danger: true
      });
      if (!confirmed) return;
      try {
        await this.pb.collection("products").delete(id);
        this.loadProducts();
      } catch (error) {
        console.error("Error deleting product:", error);
        showAdminProductsToast("\uC0C1\uD488 \uC0AD\uC81C\uC5D0 \uC2E4\uD328\uD588\uC2B5\uB2C8\uB2E4", "error");
      }
    },
    deleteImage: function(index) {
      this.visualItems.splice(index, 1);
      this.renderImages();
    },
    updateCategory: async function(productId, categoryId) {
      try {
        await this.pb.collection("products").update(productId, {
          category: categoryId
        });
        console.log("Category updated");
      } catch (error) {
        console.error("Error updating category:", error);
        showAdminProductsToast("\uCE74\uD14C\uACE0\uB9AC \uC218\uC815 \uC2E4\uD328: " + error.message, "error");
        this.loadProducts();
      }
    },
    handleImageSelect: function(input) {
      if (input.files && input.files.length > 0) {
        Array.from(input.files).forEach((file, idx) => {
          const exists = this.visualItems.some((item) => item.type === "new" && item.value.name === file.name && item.value.size === file.size);
          if (!exists) {
            this.visualItems.push({
              type: "new",
              value: file,
              id: "new-" + Date.now() + "-" + idx
            });
          }
        });
        this.renderImages();
        input.value = "";
      }
    },
    renderImages: function() {
      const container = document.getElementById("product-image-list");
      if (!container) return;
      if (this.visualItems.length === 0) {
        container.innerHTML = '<div class="admin-product-image-empty admin-empty-state">\uC774\uBBF8\uC9C0\uAC00 \uC5C6\uC2B5\uB2C8\uB2E4</div>';
        return;
      }
      container.innerHTML = "";
      if (!this.sortable) {
        this.sortable = new Sortable(container, {
          animation: 150,
          onEnd: (evt) => {
            const item = this.visualItems.splice(evt.oldIndex, 1)[0];
            this.visualItems.splice(evt.newIndex, 0, item);
          }
        });
      }
      this.visualItems.forEach((item, index) => {
        const div = document.createElement("div");
        div.className = "admin-sortable-item";
        div.setAttribute("data-id", item.id);
        let imgHtml = "";
        if (item.type === "existing") {
          const imgUrl = this.pb.files.getUrl(this.currentProduct, item.value, { thumb: "100x100" });
          imgHtml = `<img src="${imgUrl}" alt="" />`;
          div.innerHTML = `
                    <div class="admin-sortable-thumb">
                        ${imgHtml}
                    </div>
                `;
        } else {
          div.innerHTML = `
                    <div class="admin-sortable-thumb admin-sortable-thumb--loading">
                         <div class="admin-spinner" aria-hidden="true" style="width: 1rem; height: 1rem;"></div>
                    </div>
                `;
          const reader = new FileReader();
          reader.onload = (e) => {
            const imgContainer = div.querySelector(".admin-sortable-thumb");
            imgContainer.style.background = "none";
            imgContainer.innerHTML = `<img src="${e.target.result}" alt="" />`;
          };
          reader.readAsDataURL(item.value);
        }
        const delBtn = document.createElement("button");
        delBtn.type = "button";
        delBtn.className = "admin-btn admin-btn--danger admin-btn--sm admin-sortable-remove";
        delBtn.innerHTML = "&times;";
        delBtn.addEventListener("click", (e) => {
          e.stopPropagation();
          this.deleteImage(index);
        });
        div.appendChild(delBtn);
        if (index === 0) {
          const badge = document.createElement("span");
          badge.className = "admin-pill admin-pill--success admin-sortable-badge";
          badge.textContent = "\uB300\uD45C";
          div.appendChild(badge);
        }
        container.appendChild(div);
      });
    }
  };
  document.addEventListener("DOMContentLoaded", function() {
    AdminProducts.init();
  });
})();
