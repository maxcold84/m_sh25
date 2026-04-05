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
  function promptDialog(options = {}) {
    return openDialog("prompt", options);
  }

  // <stdin>
  function showAdminPostsToast(message, type = "info", duration) {
    toast(message, { type, duration });
  }
  function confirmAdminPostsAction(options) {
    return confirmDialog(options);
  }
  function promptAdminPostsAction(options) {
    return promptDialog(options);
  }
  var AdminPosts = {
    pb: null,
    currentPost: null,
    imageToUpload: null,
    existingImage: null,
    easyMDE: null,
    modal: null,
    _currentTrigger: null,
    _previousBodyOverflow: "",
    _escapeHandlerBound: false,
    init: async function() {
      this.pb = getAdminPb();
      if (!checkAdmin()) {
        return;
      }
      document.body.addEventListener("htmx:configRequest", (event) => {
        if (this.pb && this.pb.authStore.isValid) {
          event.detail.headers.Authorization = this.pb.authStore.token;
        }
      });
      this.bindEvents();
      this.bindModalEvents();
      this.loadPosts();
      const titleInput = document.getElementById("post-title");
      if (titleInput) {
        titleInput.addEventListener("input", this._slugGenerator);
      }
      this.easyMDE = new EasyMDE({
        element: document.getElementById("post-content"),
        autosave: {
          enabled: false
        },
        spellChecker: false,
        status: false,
        toolbar: [
          "bold",
          "italic",
          "heading",
          "|",
          "quote",
          "unordered-list",
          "ordered-list",
          "|",
          "link",
          "image",
          {
            name: "video",
            action: (editor) => {
              AdminPosts.drawVideoButton(editor);
            },
            className: "fa fa-video-camera",
            // FontAwesome icon class
            title: "Insert Video"
          },
          "|",
          "preview",
          "side-by-side",
          "fullscreen",
          "|",
          "guide"
        ]
      });
    },
    bindEvents: function() {
      const addPostBtn = document.getElementById("add-post-btn");
      if (addPostBtn && !addPostBtn.dataset.bound) {
        addPostBtn.dataset.bound = "true";
        addPostBtn.addEventListener("click", (event) => this.openAddModal(event.currentTarget));
      }
      const postForm = document.getElementById("post-form");
      if (postForm && !postForm.dataset.bound) {
        postForm.dataset.bound = "true";
        postForm.addEventListener("submit", (event) => {
          event.preventDefault();
          this.savePost();
        });
      }
      const postImage = document.getElementById("post-image");
      if (postImage && !postImage.dataset.bound) {
        postImage.dataset.bound = "true";
        postImage.addEventListener("change", (event) => this.handleImageSelect(event.target));
      }
      const clearImageBtn = document.getElementById("clear-post-image-btn");
      if (clearImageBtn && !clearImageBtn.dataset.bound) {
        clearImageBtn.dataset.bound = "true";
        clearImageBtn.addEventListener("click", () => this.clearImage());
      }
      const tableBody = document.getElementById("post-table-body");
      if (tableBody && !tableBody.dataset.bound) {
        tableBody.dataset.bound = "true";
        tableBody.addEventListener("click", (event) => {
          const button = event.target.closest("[data-action]");
          if (!button) return;
          const { action, postId } = button.dataset;
          if (action === "edit-post") {
            this.openEditModal(postId, button);
          } else if (action === "delete-post") {
            this.deletePost(postId);
          }
        });
      }
    },
    bindModalEvents: function() {
      const modal = this.modal || document.getElementById("postModal");
      if (!modal || modal.dataset.bound) return;
      this.modal = modal;
      modal.dataset.bound = "true";
      modal.addEventListener("click", (event) => {
        if (event.target === modal || event.target.closest("[data-post-modal-close]")) {
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
      const modal = this.modal || document.getElementById("postModal");
      if (!modal) return;
      this.modal = modal;
      this._previousBodyOverflow = document.body.style.overflow;
      modal.hidden = false;
      modal.setAttribute("aria-hidden", "false");
      document.body.style.overflow = "hidden";
      setTimeout(() => {
        if (this.easyMDE) {
          this.easyMDE.codemirror.refresh();
        }
        const focusTarget = document.getElementById("post-title") || modal.querySelector("input, textarea, select, button");
        if (focusTarget && typeof focusTarget.focus === "function") {
          focusTarget.focus();
        }
      }, 0);
    },
    closeModal: function() {
      const modal = this.modal || document.getElementById("postModal");
      if (!modal) return;
      modal.hidden = true;
      modal.setAttribute("aria-hidden", "true");
      document.body.style.overflow = this._previousBodyOverflow || "";
      if (this._currentTrigger && typeof this._currentTrigger.focus === "function") {
        this._currentTrigger.focus();
      }
      this._currentTrigger = null;
    },
    loadPosts: async function() {
      const tableBody = document.getElementById("post-table-body");
      const spinner = document.getElementById("loading-spinner");
      spinner.style.display = "flex";
      tableBody.innerHTML = "";
      try {
        const records = await this.pb.collection("posts").getFullList({
          sort: "-created"
        });
        spinner.style.display = "none";
        if (records.length === 0) {
          tableBody.innerHTML = '<tr><td colspan="5" class="admin-empty-state">\uB4F1\uB85D\uB41C \uAE00\uC774 \uC5C6\uC2B5\uB2C8\uB2E4</td></tr>';
          return;
        }
        records.forEach((post) => {
          const tr = document.createElement("tr");
          let imageHtml = "";
          if (post.image) {
            const imageUrl = this.pb.files.getUrl(post, post.image, { thumb: "100x100" });
            imageHtml = `<img src="${imageUrl}" alt="${post.title}" style="width: 100%; height: 100%; object-fit: cover;">`;
          }
          const statusBadge = post.published ? '<span class="admin-pill admin-pill--success">\uACF5\uAC1C</span>' : '<span class="admin-pill admin-pill--muted">\uBE44\uACF5\uAC1C</span>';
          const createdDate = new Date(post.created).toLocaleDateString("ko-KR");
          const imageCellHtml = imageHtml ? `<div class="admin-post-thumb">${imageHtml}</div>` : '<div class="admin-post-thumb admin-post-thumb--empty">-</div>';
          tr.innerHTML = `
                    <td>
                        ${imageCellHtml}
                    </td>
                    <td>
                        <div class="admin-post-title">
                            <div class="admin-post-title__main">${post.title}</div>
                            <div class="admin-post-title__slug">/${post.slug}</div>
                        </div>
                    </td>
                    <td>${statusBadge}</td>
                    <td>${createdDate}</td>
                    <td>
                        <div class="admin-post-actions">
                            <button class="admin-post-action-btn admin-post-action-btn--edit" type="button" data-action="edit-post" data-post-id="${post.id}">\uC218\uC815</button>
                            <button class="admin-post-action-btn admin-post-action-btn--delete" type="button" data-action="delete-post" data-post-id="${post.id}">\uC0AD\uC81C</button>
                            <a href="/ko/blog/${post.slug}/" target="_blank" rel="noreferrer" class="admin-post-action-btn admin-post-action-btn--preview">\uBBF8\uB9AC\uBCF4\uAE30</a>
                        </div>
                    </td>
                `;
          tableBody.appendChild(tr);
        });
      } catch (error) {
        console.error("Error loading posts:", error);
        spinner.style.display = "none";
        if (error.status === 404) {
          tableBody.innerHTML = '<tr><td colspan="5" class="admin-empty-state" style="color: #b91c1c;">PocketBase\uC5D0 "posts" \uCEEC\uB809\uC158\uC774 \uC5C6\uC2B5\uB2C8\uB2E4.</td></tr>';
        } else {
          showAdminPostsToast("\uAE00 \uBAA9\uB85D\uC744 \uBD88\uB7EC\uC624\uB294 \uC911 \uC624\uB958\uAC00 \uBC1C\uC0DD\uD588\uC2B5\uB2C8\uB2E4", "error");
        }
      }
    },
    openAddModal: function(trigger) {
      this.currentPost = null;
      this.imageToUpload = null;
      this.existingImage = null;
      this._currentTrigger = trigger || document.getElementById("add-post-btn") || document.activeElement;
      document.getElementById("post-form").reset();
      if (this.easyMDE) this.easyMDE.value("");
      document.getElementById("post-id").value = "";
      document.getElementById("postModalLabel").innerText = "\uAE00 \uC4F0\uAE30";
      document.getElementById("post-image-preview").style.display = "none";
      document.getElementById("post-published").checked = true;
      this.openModal();
    },
    openEditModal: async function(id, trigger) {
      try {
        const post = await this.pb.collection("posts").getOne(id);
        this.currentPost = post;
        this.imageToUpload = null;
        this.existingImage = post.image;
        this._currentTrigger = trigger || document.activeElement;
        document.getElementById("post-id").value = post.id;
        document.getElementById("post-title").value = post.title;
        document.getElementById("post-slug").value = post.slug;
        if (this.easyMDE) this.easyMDE.value(post.content || "");
        document.getElementById("post-published").checked = post.published;
        let tags = post.tags;
        if (Array.isArray(tags)) tags = tags.join(", ");
        let categories = post.categories;
        if (Array.isArray(categories)) categories = categories.join(", ");
        else if (typeof categories === "object" && categories !== null) {
          categories = "";
        }
        document.getElementById("post-tags").value = tags || "";
        document.getElementById("post-categories").value = categories || "";
        if (post.image) {
          const imgUrl = this.pb.files.getUrl(post, post.image);
          const preview = document.getElementById("post-image-preview");
          preview.querySelector("img").src = imgUrl;
          preview.style.display = "block";
        } else {
          document.getElementById("post-image-preview").style.display = "none";
        }
        document.getElementById("postModalLabel").innerText = "\uAE00 \uC218\uC815";
        this.openModal();
      } catch (error) {
        console.error("Error fetching post details:", error);
        showAdminPostsToast("\uAE00 \uC815\uBCF4\uB97C \uBD88\uB7EC\uC624\uB294 \uC911 \uC624\uB958\uAC00 \uBC1C\uC0DD\uD588\uC2B5\uB2C8\uB2E4", "error");
      }
    },
    savePost: async function() {
      const id = document.getElementById("post-id").value;
      const title = document.getElementById("post-title").value;
      const slug = document.getElementById("post-slug").value;
      const content = this.easyMDE ? this.easyMDE.value() : document.getElementById("post-content").value;
      const published = document.getElementById("post-published").checked;
      const tagsStr = document.getElementById("post-tags").value;
      const categoriesStr = document.getElementById("post-categories").value;
      const tags = tagsStr ? tagsStr.split(",").map((s) => s.trim()).filter((s) => s) : [];
      const categories = categoriesStr ? categoriesStr.split(",").map((s) => s.trim()).filter((s) => s) : [];
      if (!title.trim()) {
        showAdminPostsToast("\uC81C\uBAA9\uC744 \uC785\uB825\uD574\uC8FC\uC138\uC694.", "error");
        return;
      }
      if (!slug.trim()) {
        showAdminPostsToast("\uC2AC\uB7EC\uADF8(URL)\uB97C \uC785\uB825\uD574\uC8FC\uC138\uC694.", "error");
        return;
      }
      const formData = new FormData();
      formData.append("title", title);
      formData.append("slug", slug);
      formData.append("content", content);
      formData.append("published", published);
      formData.append("tags", JSON.stringify(tags));
      formData.append("categories", JSON.stringify(categories));
      if (this.imageToUpload) {
        formData.append("image", this.imageToUpload);
      } else if (id && this.existingImage === null) {
        formData.append("image", "");
      }
      try {
        if (id) {
          await this.pb.collection("posts").update(id, formData);
        } else {
          await this.pb.collection("posts").create(formData);
        }
        this.closeModal();
        this.loadPosts();
      } catch (error) {
        console.error("Error saving post:", error);
        let errorMsg = "\uAE00 \uC800\uC7A5 \uC2E4\uD328:\n";
        if (error.response && error.response.data) {
          const details = [];
          for (const field in error.response.data) {
            details.push(`- ${field}: ${error.response.data[field].message}`);
          }
          if (details.length > 0) {
            errorMsg += details.join("\n");
          } else {
            errorMsg += error.message;
          }
        } else {
          errorMsg += error.message;
        }
        showAdminPostsToast(errorMsg, "error", 5200);
      }
    },
    deletePost: async function(id) {
      const confirmed = await confirmAdminPostsAction({
        title: "\uAE00 \uC0AD\uC81C",
        message: "\uC815\uB9D0 \uC774 \uAE00\uC744 \uC0AD\uC81C\uD558\uC2DC\uACA0\uC2B5\uB2C8\uAE4C?",
        confirmLabel: "\uC0AD\uC81C",
        danger: true
      });
      if (!confirmed) return;
      try {
        await this.pb.collection("posts").delete(id);
        this.loadPosts();
        showAdminPostsToast("\uAE00\uC774 \uC0AD\uC81C\uB418\uC5C8\uC2B5\uB2C8\uB2E4. \uBE14\uB85C\uADF8\uC5D0 \uBC18\uC601\uD558\uB824\uBA74 \uD130\uBBF8\uB110\uC5D0\uC11C pnpm sync\uB97C \uC2E4\uD589\uD558\uC138\uC694.", "success", 4200);
      } catch (error) {
        console.error("Error deleting post:", error);
        showAdminPostsToast("\uAE00 \uC0AD\uC81C \uC2E4\uD328", "error");
      }
    },
    handleImageSelect: function(input) {
      if (input.files && input.files[0]) {
        const file = input.files[0];
        this.imageToUpload = file;
        const reader = new FileReader();
        reader.onload = function(e) {
          const preview = document.getElementById("post-image-preview");
          preview.querySelector("img").src = e.target.result;
          preview.style.display = "block";
        };
        reader.readAsDataURL(file);
      }
    },
    clearImage: function() {
      const input = document.getElementById("post-image");
      if (input) input.value = "";
      const preview = document.getElementById("post-image-preview");
      if (preview) {
        const image = preview.querySelector("img");
        if (image) image.src = "";
        preview.style.display = "none";
      }
      this.imageToUpload = null;
      this.existingImage = null;
    },
    _slugGenerator: function() {
      const titleInput = document.getElementById("post-title");
      const slugInput = document.getElementById("post-slug");
      const title = titleInput.value;
      let slug = title.toLowerCase().trim().replace(/\s+/g, "-").replace(/[^\w\-가-힣]/g, "").replace(/^-|-$/g, "");
      if (!slug) {
        slug = "post-" + Date.now();
      }
      slugInput.value = slug;
    },
    // --- Helper Functions for Video Button ---
    _extractVideoInfo: function(input) {
      if (!input) return null;
      const ytMatch = input.match(/(?:youtube\.com\/(?:[^\/]+\/.+\/|(?:v|e(?:mbed)?)\/|.*[?&]v=)|youtu\.be\/)([^"&?\/\s]{11})/i);
      if (ytMatch && ytMatch[1]) {
        return { type: "youtube", id: ytMatch[1] };
      }
      const vimeoMatch = input.match(/(?:vimeo\.com\/|player\.vimeo\.com\/video\/)([0-9]+)/);
      if (vimeoMatch && vimeoMatch[1]) {
        return { type: "vimeo", id: vimeoMatch[1] };
      }
      if (input.match(/\.(mp4|webm|ogg)$/i)) {
        return { type: "video", src: input };
      }
      return null;
    },
    drawVideoButton: async function(editor) {
      const cm = editor.codemirror;
      const input = await promptAdminPostsAction({
        title: "\uB3D9\uC601\uC0C1 \uC0BD\uC785",
        message: "\uB3D9\uC601\uC0C1 URL \uB610\uB294 Embed \uCF54\uB4DC\uB97C \uC785\uB825\uD558\uC138\uC694.\n\uC9C0\uC6D0: YouTube, Vimeo, .mp4",
        placeholder: "https://www.youtube.com/watch?v=...",
        confirmLabel: "\uC0BD\uC785",
        validate(value) {
          return value ? "" : "\uB3D9\uC601\uC0C1 \uB9C1\uD06C\uB97C \uC785\uB825\uD574\uC8FC\uC138\uC694.";
        }
      });
      if (!input) return;
      const info = AdminPosts._extractVideoInfo(input);
      if (!info) {
        showAdminPostsToast("\uC720\uD6A8\uD55C \uB3D9\uC601\uC0C1 \uB9C1\uD06C\uB098 \uCF54\uB4DC\uAC00 \uC544\uB2D9\uB2C8\uB2E4.\n\uC9C0\uC6D0: YouTube, Vimeo, .mp4 \uD30C\uC77C \uB9C1\uD06C", "error", 4200);
        return;
      }
      let shortcode = "";
      if (info.type === "youtube") {
        shortcode = `{{< youtube ${info.id} >}}`;
      } else if (info.type === "vimeo") {
        shortcode = `{{< vimeo ${info.id} >}}`;
      } else if (info.type === "video") {
        shortcode = `{{< video src="${info.src}" >}}`;
      }
      cm.replaceSelection(shortcode);
    }
  };
  document.addEventListener("DOMContentLoaded", function() {
    AdminPosts.init();
  });
})();
