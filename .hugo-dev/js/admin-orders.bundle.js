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
  function logout() {
    const pb2 = getAdminPb();
    if (pb2) {
      pb2.authStore.clear();
    }
    location.href = "/ko/admin/login";
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
  var AdminOrders = (function() {
    let pb2;
    let allOrders = [];
    const ITEMS_PER_PAGE = 20;
    let currentPage = 1;
    let currentOrderId = null;
    const selectedOrders = /* @__PURE__ */ new Set();
    let deleteTargetId = null;
    const CARRIERS = {
      cj: { name: "CJ\uB300\uD55C\uD1B5\uC6B4", trackUrl: "https://www.cjlogistics.com/ko/tool/parcel/tracking?gnbInvcNo=" },
      hanjin: { name: "\uD55C\uC9C4\uD0DD\uBC30", trackUrl: "https://www.hanjin.com/kor/CMS/DeliveryMgr/WaybillResult.do?mession=open&wblnum=" },
      lotte: { name: "\uB86F\uB370\uD0DD\uBC30", trackUrl: "https://www.lotteglogis.com/open/tracking?invno=" },
      logen: { name: "\uB85C\uC820\uD0DD\uBC30", trackUrl: "https://www.ilogen.com/web/personal/trace/" },
      post: { name: "\uC6B0\uCCB4\uAD6D\uD0DD\uBC30", trackUrl: "https://service.epost.go.kr/trace.RetrieveDomRi498.postal?sid1=" },
      epost: { name: "\uC6B0\uCCB4\uAD6DEMS", trackUrl: "https://service.epost.go.kr/trace.RetrieveEmsRi498.postal?POST_CODE=" },
      kdexp: { name: "\uACBD\uB3D9\uD0DD\uBC30", trackUrl: "https://kdexp.com/basicNew498.kd?barcode=" }
    };
    const PLACEHOLDER_IMAGE = "https://via.placeholder.com/50?text=No+Img";
    const IMAGE_ERROR_FALLBACK = "https://via.placeholder.com/50?text=Error";
    const INTERACTIVE_SELECTOR = "button, a, input, select, textarea, label";
    const STATUS_BADGE_BASE = "inline-flex items-center rounded-full px-2.5 py-1 text-[11px] font-semibold ring-1 ring-inset";
    const MODAL_IDS = ["order-detail-modal", "delete-confirm-modal"];
    function showToast(message, type = "info", duration) {
      toast(message, { type, duration });
    }
    function confirmAction(options) {
      return confirmDialog(options);
    }
    function getStatusMeta(status) {
      switch (status) {
        case "paid":
          return { label: "\uACB0\uC81C\uC644\uB8CC", classes: `${STATUS_BADGE_BASE} bg-emerald-100 text-emerald-700 ring-emerald-200` };
        case "shipping":
          return { label: "\uBC30\uC1A1\uC911", classes: `${STATUS_BADGE_BASE} bg-sky-100 text-sky-700 ring-sky-200` };
        case "delivered":
          return { label: "\uBC30\uC1A1\uC644\uB8CC", classes: `${STATUS_BADGE_BASE} bg-indigo-100 text-indigo-700 ring-indigo-200` };
        case "pending":
          return { label: "\uACB0\uC81C\uB300\uAE30", classes: `${STATUS_BADGE_BASE} bg-amber-100 text-amber-700 ring-amber-200` };
        case "cancelled":
          return { label: "\uCDE8\uC18C\uB428", classes: `${STATUS_BADGE_BASE} bg-rose-100 text-rose-700 ring-rose-200` };
        case "archived":
          return { label: "\uBCF4\uAD00\uB428", classes: `${STATUS_BADGE_BASE} bg-slate-200 text-slate-700 ring-slate-300` };
        default:
          return { label: status || "-", classes: `${STATUS_BADGE_BASE} bg-slate-100 text-slate-700 ring-slate-200` };
      }
    }
    function syncModalScrollLock() {
      const anyModalOpen = MODAL_IDS.some((modalId) => {
        const modal = document.getElementById(modalId);
        return modal && !modal.classList.contains("hidden");
      });
      document.body.style.overflow = anyModalOpen ? "hidden" : "";
    }
    function showModal(modalId) {
      const modal = document.getElementById(modalId);
      if (!modal) {
        return;
      }
      modal.classList.remove("hidden");
      modal.setAttribute("aria-hidden", "false");
      syncModalScrollLock();
    }
    function hideModal(modalId) {
      const modal = document.getElementById(modalId);
      if (!modal) {
        return;
      }
      modal.classList.add("hidden");
      modal.setAttribute("aria-hidden", "true");
      syncModalScrollLock();
    }
    function getTopMostOpenModalId() {
      for (let i = MODAL_IDS.length - 1; i >= 0; i -= 1) {
        const modal = document.getElementById(MODAL_IDS[i]);
        if (modal && !modal.classList.contains("hidden")) {
          return MODAL_IDS[i];
        }
      }
      return null;
    }
    function init() {
      console.log("AdminOrders initializing...");
      pb2 = getAdminPb();
      if (!checkAdmin()) {
        console.warn("Backend verification check failed.");
        return;
      }
      setupEventListeners();
      loadOrders();
    }
    function setupEventListeners() {
      const logoutBtn = document.getElementById("admin-logout-btn");
      if (logoutBtn) {
        logoutBtn.addEventListener("click", () => logout());
      }
      const filterSelect = document.getElementById("status-filter");
      if (filterSelect) {
        filterSelect.addEventListener("change", () => {
          currentPage = 1;
          renderOrders();
        });
      }
      const refreshBtn = document.getElementById("refresh-btn");
      if (refreshBtn) {
        refreshBtn.addEventListener("click", loadOrders);
      }
      const bulkArchiveBtn = document.getElementById("bulk-archive-btn");
      if (bulkArchiveBtn) {
        bulkArchiveBtn.addEventListener("click", bulkArchive);
      }
      const bulkDeleteBtn = document.getElementById("bulk-delete-btn");
      if (bulkDeleteBtn) {
        bulkDeleteBtn.addEventListener("click", bulkDelete);
      }
      const tableBody = document.getElementById("orders-table-body");
      if (tableBody) {
        tableBody.addEventListener("click", handleTableBodyClick);
        tableBody.addEventListener("change", handleTableBodyChange);
        tableBody.addEventListener("keydown", handleTableBodyKeydown);
      }
      const pagination = document.getElementById("pagination-controls");
      if (pagination) {
        pagination.addEventListener("click", handlePaginationClick);
      }
      const selectAllCheckbox = document.getElementById("select-all-orders");
      if (selectAllCheckbox) {
        selectAllCheckbox.addEventListener("change", toggleSelectAll);
      }
      const saveTrackingBtn = document.getElementById("save-tracking-btn");
      if (saveTrackingBtn) {
        saveTrackingBtn.addEventListener("click", saveTrackingInfo);
      }
      const archiveOrderBtn = document.getElementById("archive-order-btn");
      if (archiveOrderBtn) {
        archiveOrderBtn.addEventListener("click", () => archiveOrder());
      }
      const deleteOrderBtn = document.getElementById("delete-order-btn");
      if (deleteOrderBtn) {
        deleteOrderBtn.addEventListener("click", () => confirmDelete());
      }
      const trackDeliveryBtn = document.getElementById("track-delivery-btn");
      if (trackDeliveryBtn) {
        trackDeliveryBtn.addEventListener("click", openTrackingUrl);
      }
      const carrierSelect = document.getElementById("tracking-carrier");
      const trackingNumberInput = document.getElementById("tracking-number");
      if (carrierSelect) {
        carrierSelect.addEventListener("change", syncTrackingUiState);
      }
      if (trackingNumberInput) {
        trackingNumberInput.addEventListener("input", syncTrackingUiState);
      }
      const confirmDeleteBtn = document.getElementById("confirm-delete-btn");
      if (confirmDeleteBtn) {
        confirmDeleteBtn.addEventListener("click", () => deleteOrder());
      }
      document.querySelectorAll("[data-modal-close]").forEach((button) => {
        button.addEventListener("click", () => hideModal(button.dataset.modalClose));
      });
      document.querySelectorAll("[data-modal-backdrop]").forEach((backdrop) => {
        backdrop.addEventListener("click", () => hideModal(backdrop.dataset.modalBackdrop));
      });
      document.addEventListener("keydown", handleGlobalKeydown);
    }
    function handleGlobalKeydown(event) {
      if (event.key !== "Escape") {
        return;
      }
      const openModalId = getTopMostOpenModalId();
      if (!openModalId) {
        return;
      }
      if (openModalId === "order-detail-modal") {
        closeModal();
      } else {
        hideModal(openModalId);
      }
    }
    function handleTableBodyClick(event) {
      const openButton = event.target.closest('[data-action="open-order"]');
      if (openButton) {
        const orderId = openButton.dataset.orderId;
        if (orderId) {
          openModal(orderId);
        }
        return;
      }
      if (event.target.closest(".order-checkbox")) {
        return;
      }
      const row = event.target.closest("tr[data-order-id]");
      if (!row) {
        return;
      }
      if (event.target.closest(INTERACTIVE_SELECTOR)) {
        return;
      }
      openModal(row.dataset.orderId);
    }
    function handleTableBodyChange(event) {
      const checkbox = event.target.closest(".order-checkbox");
      if (!checkbox) {
        return;
      }
      toggleSelectOrder(checkbox.dataset.orderId, checkbox.checked);
    }
    function handleTableBodyKeydown(event) {
      const row = event.target.closest("tr[data-order-id]");
      if (!row || event.target.closest(INTERACTIVE_SELECTOR)) {
        return;
      }
      if (event.key === "Enter" || event.key === " ") {
        event.preventDefault();
        openModal(row.dataset.orderId);
      }
    }
    function handlePaginationClick(event) {
      const pageButton = event.target.closest("[data-page]");
      if (!pageButton || pageButton.disabled) {
        return;
      }
      const nextPage = Number(pageButton.dataset.page);
      if (!Number.isNaN(nextPage)) {
        setPage(nextPage);
      }
    }
    function wireImageFallbacks(container) {
      if (!container) {
        return;
      }
      container.querySelectorAll("img[data-fallback-src]").forEach((img) => {
        img.addEventListener("error", () => {
          const fallbackSrc = img.dataset.fallbackSrc;
          if (fallbackSrc && img.src !== fallbackSrc) {
            img.src = fallbackSrc;
          }
        }, { once: true });
      });
    }
    async function loadOrders() {
      const tableBody = document.getElementById("orders-table-body");
      const countSpan = document.getElementById("total-orders-count");
      if (tableBody) {
        tableBody.innerHTML = '<tr><td colspan="8" class="px-4 py-10 text-center text-slate-500">\uBD88\uB7EC\uC624\uB294 \uC911...</td></tr>';
      }
      try {
        const records = await pb2.collection("orders").getFullList({
          sort: "-created",
          expand: "user"
        });
        allOrders = records;
        if (countSpan) {
          countSpan.textContent = allOrders.length;
        }
        renderOrders();
      } catch (err) {
        console.error("Failed to load orders:", err);
        if (err.status === 403) {
          showToast("\uAD8C\uD55C\uC774 \uC5C6\uC2B5\uB2C8\uB2E4. \uB2E4\uC2DC \uB85C\uADF8\uC778\uD574\uC8FC\uC138\uC694.", "error", 1600);
          setTimeout(() => {
            location.href = "/ko/admin/login";
          }, 700);
        } else {
          if (tableBody) {
            tableBody.innerHTML = `<tr><td colspan="8" class="px-4 py-10 text-center text-rose-600">\uC624\uB958\uAC00 \uBC1C\uC0DD\uD588\uC2B5\uB2C8\uB2E4: ${err.message}</td></tr>`;
          }
        }
      }
    }
    function renderOrders() {
      const tableBody = document.getElementById("orders-table-body");
      const statusFilterEl = document.getElementById("status-filter");
      const statusFilter = statusFilterEl ? statusFilterEl.value : "";
      if (!tableBody) {
        return;
      }
      let filtered = allOrders;
      if (statusFilter) {
        filtered = allOrders.filter((o) => o.status === statusFilter);
      }
      const totalItems = filtered.length;
      const totalPages = Math.max(1, Math.ceil(totalItems / ITEMS_PER_PAGE));
      if (currentPage > totalPages) {
        currentPage = totalPages;
      }
      const start = (currentPage - 1) * ITEMS_PER_PAGE;
      const end = start + ITEMS_PER_PAGE;
      const pageItems = filtered.slice(start, end);
      if (pageItems.length === 0) {
        tableBody.innerHTML = '<tr><td colspan="8" class="px-4 py-10 text-center text-slate-500">\uC8FC\uBB38 \uB0B4\uC5ED\uC774 \uC5C6\uC2B5\uB2C8\uB2E4.</td></tr>';
        renderPagination(0, 0);
        updateBulkActionsUI();
        updateSelectAllCheckbox();
        return;
      }
      let html = "";
      pageItems.forEach((order) => {
        const user = order.expand?.user;
        const buyerName = order.buyer_details?.customer?.fullName || user?.name || "Unknown";
        const buyerEmail = order.buyer_details?.customer?.email || user?.email || "-";
        const date = new Date(order.created).toLocaleDateString("ko-KR", {
          year: "numeric",
          month: "long",
          day: "numeric",
          hour: "2-digit",
          minute: "2-digit"
        });
        const statusMeta = getStatusMeta(order.status);
        const statusClass = statusMeta.classes;
        const statusText = statusMeta.label;
        const itemCount = order.items ? order.items.length : 0;
        const firstItemName = order.items && order.items.length > 0 ? order.items[0].expand?.product_id?.name || order.items[0].name || "\uC0C1\uD488" : "\uC0C1\uD488 \uC5C6\uC74C";
        let itemsSummary = firstItemName;
        if (itemCount > 1) {
          itemsSummary += ` \uC678 ${itemCount - 1}\uAC74`;
        }
        const carrierCode = order.tracking_carrier || "";
        const trackingNumber = order.tracking_number || "";
        const carrierName = carrierCode && CARRIERS[carrierCode] ? CARRIERS[carrierCode].name : "";
        let trackingHtml = '<span class="text-xs text-slate-500">\uBBF8\uB4F1\uB85D</span>';
        if (carrierName && trackingNumber) {
          trackingHtml = `<div class="text-xs font-medium text-slate-700">${carrierName}</div><div class="text-xs text-slate-500 break-all">${trackingNumber}</div>`;
        }
        const isSelected = selectedOrders.has(order.id);
        html += `
                <tr class="cursor-pointer transition hover:bg-slate-50 ${isSelected ? "bg-slate-50 ring-1 ring-inset ring-slate-200" : ""}" data-order-id="${order.id}" tabindex="0" role="button" aria-label="\uC8FC\uBB38 \uC0C1\uC138 \uBCF4\uAE30">
                    <td>
                        <input type="checkbox" class="order-checkbox h-4 w-4 rounded border-slate-300 text-slate-900 focus:ring-slate-400" data-order-id="${order.id}" 
                               ${isSelected ? "checked" : ""} 
                               aria-label="\uC8FC\uBB38 \uC120\uD0DD">
                    </td>
                    <td>
                        <div class="font-semibold text-slate-900">${order.payment_id || order.id.substring(0, 8)}</div>
                        <div class="text-xs text-slate-500">${date}</div>
                    </td>
                    <td>
                        <div class="text-slate-900">${buyerName}</div>
                        <div class="text-xs text-slate-500">${buyerEmail}</div>
                    </td>
                    <td>
                        <div class="text-slate-900">${itemsSummary}</div>
                    </td>
                    <td>
                        <div class="font-semibold text-slate-900">${(order.total_amount || 0).toLocaleString()}\uC6D0</div>
                    </td>
                    <td>
                        ${trackingHtml}
                    </td>
                    <td class="text-center">
                        <span class="${statusClass}">
                            ${statusText}
                        </span>
                    </td>
                    <td class="text-center">
                        <button type="button" class="inline-flex items-center justify-center rounded-full border border-slate-300 bg-white px-3 py-1.5 text-xs font-semibold text-slate-700 transition hover:border-slate-400 hover:bg-slate-50 focus:outline-none focus:ring-4 focus:ring-slate-200" data-action="open-order" data-order-id="${order.id}">\uC0C1\uC138\uBCF4\uAE30</button>
                    </td>
                </tr>
            `;
      });
      tableBody.innerHTML = html;
      renderPagination(totalPages, currentPage);
      updateBulkActionsUI();
      updateSelectAllCheckbox();
    }
    function renderPagination(totalPages, current) {
      const container = document.getElementById("pagination-controls");
      if (!container) {
        return;
      }
      if (totalPages <= 1) {
        container.innerHTML = "";
        return;
      }
      let html = "";
      const buttonBase = "inline-flex h-9 min-w-9 items-center justify-center rounded-full border px-3 text-sm font-semibold transition focus:outline-none focus:ring-4 focus:ring-slate-200";
      const enabledBase = "border-slate-300 bg-white text-slate-700 hover:border-slate-400 hover:bg-slate-50";
      const activeBase = "border-slate-900 bg-slate-900 text-white";
      const disabledBase = "cursor-not-allowed border-slate-200 bg-slate-100 text-slate-400";
      html += `<li>
            <button type="button" class="${buttonBase} ${current === 1 ? disabledBase : enabledBase}" data-page="${current - 1}" aria-label="Previous" ${current === 1 ? "disabled" : ""}>
                <span aria-hidden="true">&laquo;</span>
            </button>
        </li>`;
      for (let i = 1; i <= totalPages; i++) {
        html += `<li>
                <button type="button" class="${buttonBase} ${i === current ? activeBase : enabledBase}" data-page="${i}" ${i === current ? 'aria-current="page"' : ""}>${i}</button>
            </li>`;
      }
      html += `<li>
            <button type="button" class="${buttonBase} ${current === totalPages ? disabledBase : enabledBase}" data-page="${current + 1}" aria-label="Next" ${current === totalPages ? "disabled" : ""}>
                <span aria-hidden="true">&raquo;</span>
            </button>
        </li>`;
      container.innerHTML = html;
    }
    function setPage(page) {
      currentPage = Math.max(1, page);
      renderOrders();
    }
    async function openModal(orderId) {
      console.log("openModal called with ID:", orderId);
      const order = allOrders.find((o) => o.id === orderId);
      if (!order) {
        console.error("Order not found in memory:", orderId);
        return;
      }
      console.log("Full Order Object:", JSON.stringify(order, null, 2));
      const statusBadge = document.getElementById("modal-order-status");
      const statusMeta = getStatusMeta(order.status);
      statusBadge.textContent = statusMeta.label;
      statusBadge.className = `ml-2 ${statusMeta.classes}`;
      let buyerDetails = order.buyer_details;
      if (typeof buyerDetails === "string") {
        try {
          buyerDetails = JSON.parse(buyerDetails);
        } catch (e) {
          buyerDetails = {};
        }
      }
      buyerDetails = buyerDetails || {};
      let orderItems = order.items;
      if (typeof orderItems === "string") {
        try {
          orderItems = JSON.parse(orderItems);
        } catch (e) {
          orderItems = [];
        }
      }
      orderItems = orderItems || [];
      const user = order.expand?.user;
      const customer = buyerDetails.customer || {};
      const shipping = buyerDetails.shipping_info || {};
      const buyerName = customer.fullName || shipping.receiver || user?.name || "-";
      const buyerPhone = customer.phoneNumber || shipping.phone || user?.phone || "-";
      const buyerEmail = customer.email || user?.email || "-";
      let address = "-";
      if (shipping.address) {
        address = `(${shipping.postcode || ""}) ${shipping.address} ${shipping.detailAddress || ""} ${shipping.extraAddress || ""}`.trim();
      }
      document.getElementById("modal-payment-id").textContent = order.payment_id || order.id;
      document.getElementById("modal-buyer-name").textContent = buyerName;
      document.getElementById("modal-buyer-phone").textContent = buyerPhone;
      document.getElementById("modal-buyer-email").textContent = buyerEmail;
      document.getElementById("modal-buyer-address").textContent = address;
      document.getElementById("modal-buyer-delivery-note").textContent = shipping.deliveryNote || "-";
      document.getElementById("modal-total-amount").textContent = (order.total_amount || 0).toLocaleString() + "\uC6D0";
      const orderDate = new Date(order.created).toLocaleDateString("ko-KR", {
        year: "numeric",
        month: "long",
        day: "numeric",
        hour: "2-digit",
        minute: "2-digit"
      });
      document.getElementById("modal-order-date").textContent = orderDate;
      const itemsContainer = document.getElementById("modal-order-items");
      let itemsHtml = "";
      if (orderItems && orderItems.length > 0) {
        for (const item of orderItems) {
          console.log("Processing Order Item:", item);
          let name = item.name || item.title || item.productName || item.product_name;
          const price = item.price || item.discount_price || 0;
          const qty = item.quantity || item.qty || 1;
          let productId = item.product_id || item.productId || item.product || item.id;
          if (typeof productId === "object" && productId !== null) {
            productId = productId.id;
          }
          console.log("Resolved Product ID:", productId);
          let imgUrl = item.image ? item.image.trim() : "";
          if (!name || (!imgUrl || !imgUrl.startsWith("http") && !imgUrl.startsWith("data:"))) {
            if (productId) {
              try {
                let product = null;
                try {
                  product = await pb2.collection("products").getOne(productId);
                  console.log("Fetched product by ID:", product);
                } catch (e) {
                }
                if (!product) {
                  try {
                    product = await pb2.collection("products").getFirstListItem(`slug="${productId}"`);
                    console.log("Fetched product by Slug:", product);
                  } catch (e) {
                  }
                }
                if (product) {
                  if (!name) name = product.name;
                  if (!imgUrl || !imgUrl.startsWith("http") && !imgUrl.startsWith("data:")) {
                    if (product.images && product.images.length > 0) {
                      const imageFile = product.images[0];
                      imgUrl = pb2.files.getUrl(product, imageFile, { thumb: "100x100" });
                    }
                  }
                }
              } catch (e) {
                console.warn("Failed to fetch product info for:", productId, e);
              }
            }
          }
          if (!name) name = `\uC0C1\uD488\uBA85 \uC5C6\uC74C (${productId || "ID \uC5C6\uC74C"})`;
          if (!imgUrl || !imgUrl.startsWith("http") && !imgUrl.startsWith("data:")) {
            imgUrl = PLACEHOLDER_IMAGE;
          }
          itemsHtml += `
                    <div class="flex flex-col gap-3 border-b border-slate-200 px-4 py-4 last:border-b-0 sm:flex-row sm:items-center">
                        <div class="h-14 w-14 flex-shrink-0 overflow-hidden rounded-2xl border border-slate-200 bg-white">
                             <img src="${imgUrl}" 
                                  class="h-full w-full object-cover" 
                                  alt="${name}"
                                  loading="lazy"
                                  data-fallback-src="${IMAGE_ERROR_FALLBACK}">
                        </div>
                        <div class="min-w-0 flex-1">
                            <h6 class="mb-1 break-words text-sm font-semibold text-slate-900">${name}</h6>
                            <div class="break-words text-xs text-slate-500">ID: ${productId || "-"}</div>
                            <div class="mt-1 text-sm text-slate-600">${price.toLocaleString()}\uC6D0 \xD7 ${qty}\uAC1C</div>
                        </div>
                        <div class="whitespace-nowrap text-sm font-semibold text-slate-900">
                            ${(price * qty).toLocaleString()}\uC6D0
                        </div>
                    </div>
                `;
        }
      } else {
        itemsHtml = '<div class="px-4 py-8 text-center text-sm text-slate-500">\uC0C1\uD488 \uC815\uBCF4\uAC00 \uC5C6\uC2B5\uB2C8\uB2E4.</div>';
      }
      itemsContainer.innerHTML = itemsHtml;
      currentOrderId = orderId;
      const carrierSelect = document.getElementById("tracking-carrier");
      const numberInput = document.getElementById("tracking-number");
      const trackBtn = document.getElementById("track-delivery-btn");
      carrierSelect.value = order.tracking_carrier || "";
      numberInput.value = order.tracking_number || "";
      trackBtn.dataset.savedTracking = order.tracking_carrier && order.tracking_number ? "true" : "false";
      syncTrackingUiState();
      wireImageFallbacks(itemsContainer);
      showModal("order-detail-modal");
    }
    function closeModal() {
      hideModal("order-detail-modal");
      currentOrderId = null;
    }
    async function saveTrackingInfo() {
      if (!currentOrderId) {
        showToast("\uC8FC\uBB38 \uC815\uBCF4\uAC00 \uC5C6\uC2B5\uB2C8\uB2E4.", "error");
        return;
      }
      const carrier = document.getElementById("tracking-carrier").value;
      const number = document.getElementById("tracking-number").value.trim();
      const statusMsg = document.getElementById("tracking-status-msg");
      const trackBtn = document.getElementById("track-delivery-btn");
      if (!carrier || !number) {
        statusMsg.textContent = "\uD0DD\uBC30\uC0AC\uC640 \uC6B4\uC1A1\uC7A5\uBC88\uD638\uB97C \uBAA8\uB450 \uC785\uB825\uD574\uC8FC\uC138\uC694.";
        statusMsg.className = "mt-2 text-sm text-rose-600";
        return;
      }
      try {
        statusMsg.textContent = "\uC800\uC7A5 \uC911...";
        statusMsg.className = "mt-2 text-sm text-slate-500";
        const order = allOrders.find((o) => o.id === currentOrderId);
        const newStatus = order.status === "paid" ? "shipping" : order.status;
        await pb2.collection("orders").update(currentOrderId, {
          tracking_carrier: carrier,
          tracking_number: number,
          status: newStatus
        });
        const orderIndex = allOrders.findIndex((o) => o.id === currentOrderId);
        if (orderIndex !== -1) {
          allOrders[orderIndex].tracking_carrier = carrier;
          allOrders[orderIndex].tracking_number = number;
          allOrders[orderIndex].status = newStatus;
        }
        statusMsg.textContent = "\uC6B4\uC1A1\uC7A5\uC774 \uC800\uC7A5\uB418\uC5C8\uC2B5\uB2C8\uB2E4!";
        statusMsg.className = "mt-2 text-sm text-emerald-600";
        trackBtn.dataset.savedTracking = "true";
        syncTrackingUiState();
        const statusBadge = document.getElementById("modal-order-status");
        const statusMeta = getStatusMeta(newStatus);
        statusBadge.textContent = statusMeta.label;
        statusBadge.className = `ml-2 ${statusMeta.classes}`;
        renderOrders();
      } catch (err) {
        console.error("Failed to save tracking info:", err);
        statusMsg.textContent = "\uC800\uC7A5 \uC2E4\uD328: " + err.message;
        statusMsg.className = "mt-2 text-sm text-rose-600";
      }
    }
    function openTrackingUrl() {
      const carrier = document.getElementById("tracking-carrier").value;
      const number = document.getElementById("tracking-number").value.trim();
      if (!carrier || !number || !CARRIERS[carrier]) {
        showToast("\uD0DD\uBC30\uC0AC \uB610\uB294 \uC6B4\uC1A1\uC7A5\uBC88\uD638\uAC00 \uC5C6\uC2B5\uB2C8\uB2E4.", "error");
        return;
      }
      const url = CARRIERS[carrier].trackUrl + encodeURIComponent(number);
      open(url, "_blank");
    }
    function syncTrackingUiState() {
      const carrierSelect = document.getElementById("tracking-carrier");
      const numberInput = document.getElementById("tracking-number");
      const trackBtn = document.getElementById("track-delivery-btn");
      const statusMsg = document.getElementById("tracking-status-msg");
      if (!carrierSelect || !numberInput || !trackBtn || !statusMsg) {
        return;
      }
      const carrier = carrierSelect.value;
      const number = numberInput.value.trim();
      const hasTracking = Boolean(carrier && number && CARRIERS[carrier]);
      const hasSavedTracking = trackBtn.dataset.savedTracking === "true";
      trackBtn.classList.toggle("hidden", !hasTracking);
      if (!hasTracking) {
        if (!number && !carrier) {
          statusMsg.textContent = "";
          statusMsg.className = "mt-2 text-sm text-slate-500";
          return;
        }
        statusMsg.textContent = "\uD0DD\uBC30\uC0AC\uC640 \uC6B4\uC1A1\uC7A5\uBC88\uD638\uB97C \uBAA8\uB450 \uC785\uB825\uD558\uBA74 \uBC30\uC1A1 \uC870\uD68C\uB97C \uC0AC\uC6A9\uD560 \uC218 \uC788\uC2B5\uB2C8\uB2E4.";
        statusMsg.className = "mt-2 text-sm text-slate-500";
        return;
      }
      statusMsg.textContent = hasSavedTracking ? `${CARRIERS[carrier].name} \uC6B4\uC1A1\uC7A5\uC774 \uB4F1\uB85D\uB418\uC5B4 \uC788\uC2B5\uB2C8\uB2E4.` : `${CARRIERS[carrier].name} \uBC30\uC1A1 \uC870\uD68C\uB97C \uC0AC\uC6A9\uD560 \uC218 \uC788\uC2B5\uB2C8\uB2E4. \uC800\uC7A5 \uD6C4 \uC8FC\uBB38 \uC0C1\uD0DC\uB97C \uD568\uAED8 \uBC18\uC601\uD558\uC138\uC694.`;
      statusMsg.className = `mt-2 text-sm ${hasSavedTracking ? "text-emerald-600" : "text-sky-600"}`;
    }
    function toggleSelectOrder(orderId, checked = null) {
      if (checked === null) {
        if (selectedOrders.has(orderId)) {
          selectedOrders.delete(orderId);
        } else {
          selectedOrders.add(orderId);
        }
      } else {
        if (checked) {
          selectedOrders.add(orderId);
        } else {
          selectedOrders.delete(orderId);
        }
      }
      updateBulkActionsUI();
      updateSelectAllCheckbox();
    }
    function toggleSelectAll() {
      const selectAllCheckbox = document.getElementById("select-all-orders");
      const statusFilterEl = document.getElementById("status-filter");
      const statusFilter = statusFilterEl ? statusFilterEl.value : "";
      if (!selectAllCheckbox) {
        return;
      }
      let filtered = allOrders;
      if (statusFilter) {
        filtered = allOrders.filter((o) => o.status === statusFilter);
      }
      const start = (currentPage - 1) * ITEMS_PER_PAGE;
      const end = start + ITEMS_PER_PAGE;
      const pageItems = filtered.slice(start, end);
      if (selectAllCheckbox.checked) {
        pageItems.forEach((order) => selectedOrders.add(order.id));
      } else {
        pageItems.forEach((order) => selectedOrders.delete(order.id));
      }
      renderOrders();
    }
    function updateSelectAllCheckbox() {
      const selectAllCheckbox = document.getElementById("select-all-orders");
      if (!selectAllCheckbox) return;
      const checkboxes = document.querySelectorAll(".order-checkbox");
      const allChecked = checkboxes.length > 0 && Array.from(checkboxes).every((cb) => cb.checked);
      const someChecked = checkboxes.length > 0 && Array.from(checkboxes).some((cb) => cb.checked);
      selectAllCheckbox.checked = allChecked;
      selectAllCheckbox.indeterminate = someChecked && !allChecked;
    }
    function updateBulkActionsUI() {
      const bulkActions = document.getElementById("bulk-actions");
      const selectedCount = document.getElementById("selected-count");
      if (!bulkActions || !selectedCount) return;
      if (selectedOrders.size > 0) {
        bulkActions.classList.remove("hidden");
        selectedCount.textContent = selectedOrders.size;
      } else {
        bulkActions.classList.add("hidden");
      }
    }
    async function archiveOrder(orderId = null) {
      const targetId = orderId || currentOrderId;
      if (!targetId) {
        showToast("\uC8FC\uBB38 \uC815\uBCF4\uAC00 \uC5C6\uC2B5\uB2C8\uB2E4.", "error");
        return;
      }
      try {
        await pb2.collection("orders").update(targetId, { status: "archived" });
        const orderIndex = allOrders.findIndex((o) => o.id === targetId);
        if (orderIndex !== -1) {
          allOrders[orderIndex].status = "archived";
        }
        showToast("\uC8FC\uBB38\uC774 \uBCF4\uAD00\uB418\uC5C8\uC2B5\uB2C8\uB2E4.", "success");
        closeModal();
        renderOrders();
      } catch (err) {
        console.error("Failed to archive order:", err);
        showToast("\uBCF4\uAD00 \uC2E4\uD328: " + err.message, "error");
      }
    }
    async function bulkArchive() {
      if (selectedOrders.size === 0) {
        showToast("\uC120\uD0DD\uB41C \uC8FC\uBB38\uC774 \uC5C6\uC2B5\uB2C8\uB2E4.", "error");
        return;
      }
      const confirmed = await confirmAction({
        title: "\uC8FC\uBB38 \uC77C\uAD04 \uBCF4\uAD00",
        message: `${selectedOrders.size}\uAC1C\uC758 \uC8FC\uBB38\uC744 \uBCF4\uAD00\uD558\uC2DC\uACA0\uC2B5\uB2C8\uAE4C?`,
        confirmLabel: "\uBCF4\uAD00"
      });
      if (!confirmed) {
        return;
      }
      try {
        const promises = Array.from(selectedOrders).map(
          (orderId) => pb2.collection("orders").update(orderId, { status: "archived" })
        );
        await Promise.all(promises);
        selectedOrders.forEach((orderId) => {
          const orderIndex = allOrders.findIndex((o) => o.id === orderId);
          if (orderIndex !== -1) {
            allOrders[orderIndex].status = "archived";
          }
        });
        showToast(`${selectedOrders.size}\uAC1C\uC758 \uC8FC\uBB38\uC774 \uBCF4\uAD00\uB418\uC5C8\uC2B5\uB2C8\uB2E4.`, "success");
        selectedOrders.clear();
        renderOrders();
      } catch (err) {
        console.error("Failed to bulk archive:", err);
        showToast("\uC77C\uAD04 \uBCF4\uAD00 \uC2E4\uD328: " + err.message, "error");
      }
    }
    function confirmDelete(orderId = null) {
      deleteTargetId = orderId || currentOrderId;
      if (!deleteTargetId) {
        showToast("\uC8FC\uBB38 \uC815\uBCF4\uAC00 \uC5C6\uC2B5\uB2C8\uB2E4.", "error");
        return;
      }
      const order = allOrders.find((o) => o.id === deleteTargetId);
      if (order) {
        const infoEl = document.getElementById("delete-order-info");
        infoEl.textContent = `\uC8FC\uBB38\uBC88\uD638: ${order.payment_id || order.id.substring(0, 8)}`;
      }
      showModal("delete-confirm-modal");
    }
    async function deleteOrder() {
      if (!deleteTargetId) {
        showToast("\uC0AD\uC81C\uD560 \uC8FC\uBB38\uC774 \uC5C6\uC2B5\uB2C8\uB2E4.", "error");
        return;
      }
      try {
        await pb2.collection("orders").delete(deleteTargetId);
        allOrders = allOrders.filter((o) => o.id !== deleteTargetId);
        selectedOrders.delete(deleteTargetId);
        hideModal("delete-confirm-modal");
        closeModal();
        showToast("\uC8FC\uBB38\uC774 \uC0AD\uC81C\uB418\uC5C8\uC2B5\uB2C8\uB2E4.", "success");
        document.getElementById("total-orders-count").textContent = allOrders.length;
        renderOrders();
      } catch (err) {
        console.error("Failed to delete order:", err);
        showToast("\uC0AD\uC81C \uC2E4\uD328: " + err.message, "error");
      } finally {
        deleteTargetId = null;
      }
    }
    async function bulkDelete() {
      if (selectedOrders.size === 0) {
        showToast("\uC120\uD0DD\uB41C \uC8FC\uBB38\uC774 \uC5C6\uC2B5\uB2C8\uB2E4.", "error");
        return;
      }
      const infoEl = document.getElementById("delete-order-info");
      infoEl.textContent = `\uC120\uD0DD\uB41C ${selectedOrders.size}\uAC1C\uC758 \uC8FC\uBB38\uC744 \uC0AD\uC81C\uD569\uB2C8\uB2E4.`;
      deleteTargetId = "BULK_DELETE";
      showModal("delete-confirm-modal");
    }
    deleteOrder = async function() {
      if (deleteTargetId === "BULK_DELETE") {
        try {
          const promises = Array.from(selectedOrders).map(
            (orderId) => pb2.collection("orders").delete(orderId)
          );
          await Promise.all(promises);
          allOrders = allOrders.filter((o) => !selectedOrders.has(o.id));
          const deletedCount = selectedOrders.size;
          selectedOrders.clear();
          hideModal("delete-confirm-modal");
          showToast(`${deletedCount}\uAC1C\uC758 \uC8FC\uBB38\uC774 \uC0AD\uC81C\uB418\uC5C8\uC2B5\uB2C8\uB2E4.`, "success");
          document.getElementById("total-orders-count").textContent = allOrders.length;
          renderOrders();
        } catch (err) {
          console.error("Failed to bulk delete:", err);
          showToast("\uC77C\uAD04 \uC0AD\uC81C \uC2E4\uD328: " + err.message, "error");
        } finally {
          deleteTargetId = null;
        }
      } else {
        if (!deleteTargetId) {
          showToast("\uC0AD\uC81C\uD560 \uC8FC\uBB38\uC774 \uC5C6\uC2B5\uB2C8\uB2E4.", "error");
          return;
        }
        try {
          await pb2.collection("orders").delete(deleteTargetId);
          allOrders = allOrders.filter((o) => o.id !== deleteTargetId);
          selectedOrders.delete(deleteTargetId);
          hideModal("delete-confirm-modal");
          closeModal();
          showToast("\uC8FC\uBB38\uC774 \uC0AD\uC81C\uB418\uC5C8\uC2B5\uB2C8\uB2E4.", "success");
          document.getElementById("total-orders-count").textContent = allOrders.length;
          renderOrders();
        } catch (err) {
          console.error("Failed to delete order:", err);
          showToast("\uC0AD\uC81C \uC2E4\uD328: " + err.message, "error");
        } finally {
          deleteTargetId = null;
        }
      }
    };
    return {
      init,
      openModal,
      closeModal,
      setPage,
      saveTrackingInfo,
      openTrackingUrl,
      toggleSelectOrder,
      toggleSelectAll,
      archiveOrder,
      bulkArchive,
      confirmDelete,
      deleteOrder,
      bulkDelete
    };
  })();
  document.addEventListener("DOMContentLoaded", () => {
    AdminOrders.init();
  });
})();
