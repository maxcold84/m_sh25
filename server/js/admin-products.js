/**
 * Admin Products Manager
 * Handles product CRUD operations for the admin interface
 */

function showAdminProductsToast(message, type = 'info', duration) {
    if (window.AdminFeedback?.toast) {
        window.AdminFeedback.toast(message, { type, duration });
        return;
    }

    console.warn('[AdminProducts]', message);
}

function confirmAdminProductsAction(options) {
    if (window.AdminFeedback?.confirm) {
        return window.AdminFeedback.confirm(options);
    }

    console.warn('[AdminProducts] confirm unavailable:', options?.message || options?.title || '');
    return Promise.resolve(false);
}

const AdminCategories = {
    pb: null,
    categories: [],
    modal: null,
    _currentTrigger: null,
    _previousBodyOverflow: '',
    _escapeHandlerBound: false,

    init: async function (pb) {
        this.pb = pb;
        this.modal = document.getElementById('categoryModal');
        const form = document.getElementById('category-form');
        if (form) {
            form.addEventListener('submit', (e) => {
                e.preventDefault();
                this.addCategory();
            });
        }
        const categoryList = document.getElementById('category-list');
        if (categoryList && !categoryList.dataset.bound) {
            categoryList.dataset.bound = 'true';
            categoryList.addEventListener('click', (event) => {
                const button = event.target.closest('[data-action="delete-category"]');
                if (!button) return;
                this.deleteCategory(button.dataset.categoryId);
            });
        }
        this.bindModalEvents();
        await this.loadCategories();
    },

    bindModalEvents: function () {
        const modal = this.modal || document.getElementById('categoryModal');
        if (!modal || modal.dataset.bound) return;

        this.modal = modal;
        modal.dataset.bound = 'true';

        modal.addEventListener('click', (event) => {
            if (event.target === modal || event.target.closest('[data-category-modal-close]')) {
                this.closeModal();
            }
        });

        if (!this._escapeHandlerBound) {
            document.addEventListener('keydown', (event) => {
                if (event.key === 'Escape' && this.isOpen()) {
                    this.closeModal();
                }
            });
            this._escapeHandlerBound = true;
        }
    },

    isOpen: function () {
        return !!(this.modal && !this.modal.hidden);
    },

    loadCategories: async function () {
        try {
            this.categories = await this.pb.collection('categories').getFullList({
                sort: 'name',
            });
            this.renderList();
            this.updateDropdowns();
        } catch (error) {
            console.error('Error loading categories:', error);
            if (error.status === 404) {
                const list = document.getElementById('category-list');
                if (list) list.innerHTML = '<div class="admin-category-state admin-category-state--error">카테고리 컬렉션이 없습니다.</div>';
            }
        }
    },

    renderList: function () {
        const list = document.getElementById('category-list');
        if (!list) return;

        if (this.categories.length === 0) {
            list.innerHTML = '<div class="admin-category-state">카테고리가 없습니다.</div>';
            return;
        }

        list.innerHTML = '';
        this.categories.forEach(cat => {
            const item = document.createElement('div');
            item.className = 'admin-category-item';
            item.innerHTML = `
                <span class="admin-category-item__name">${cat.name}</span>
                <button class="admin-category-item__delete" type="button" data-action="delete-category" data-category-id="${cat.id}">
                    &times;
                </button>
            `;
            list.appendChild(item);
        });
    },

    updateDropdowns: function () {
        const selects = document.querySelectorAll('#product-category, #filter-category');
        selects.forEach(select => {
            const currentVal = select.value;
            // Preserve 'All Categories' option for filter
            const isFilter = select.id === 'filter-category';
            select.innerHTML = isFilter ? '<option value="">모든 카테고리</option>' : '<option value="">카테고리 선택</option>';

            this.categories.forEach(cat => {
                const option = document.createElement('option');
                option.value = cat.id;
                option.textContent = cat.name;
                select.appendChild(option);
            });
            if (currentVal) select.value = currentVal;
        });
    },

    addCategory: async function () {
        const input = document.getElementById('new-category-name');
        const name = input.value.trim();
        if (!name) return;

        // Simple slug generation
        const slug = name.toLowerCase()
            .replace(/\s+/g, '-')
            .replace(/[^\w\-가-힣]/g, '')
            .replace(/^-|-$/g, '');

        try {
            await this.pb.collection('categories').create({
                name: name,
                slug: slug || ('cat-' + Date.now())
            });
            input.value = '';
            await this.loadCategories();
        } catch (error) {
            console.error('Error creating category:', error);
            showAdminProductsToast('카테고리 추가 실패: ' + error.message, 'error');
        }
    },

    deleteCategory: async function (id) {
        const confirmed = await confirmAdminProductsAction({
            title: '카테고리 삭제',
            message: '정말 삭제하시겠습니까?',
            confirmLabel: '삭제',
            danger: true
        });
        if (!confirmed) return;
        try {
            await this.pb.collection('categories').delete(id);
            await this.loadCategories();
        } catch (error) {
            console.error('Error deleting category:', error);
            showAdminProductsToast('카테고리 삭제 실패', 'error');
        }
    },

    openModal: function (trigger) {
        const modal = this.modal || document.getElementById('categoryModal');
        if (!modal) return;

        this.modal = modal;
        this._previousBodyOverflow = document.body.style.overflow;
        this._currentTrigger = trigger && typeof trigger.focus === 'function'
            ? trigger
            : (document.activeElement && typeof document.activeElement.focus === 'function'
                ? document.activeElement
                : null);

        modal.hidden = false;
        modal.setAttribute('aria-hidden', 'false');
        document.body.style.overflow = 'hidden';

        const input = document.getElementById('new-category-name');
        if (input) {
            window.setTimeout(() => input.focus(), 0);
        }
    },

    closeModal: function () {
        const modal = this.modal || document.getElementById('categoryModal');
        if (!modal) return;

        modal.hidden = true;
        modal.setAttribute('aria-hidden', 'true');
        document.body.style.overflow = this._previousBodyOverflow || '';

        if (this._currentTrigger) {
            this._currentTrigger.focus();
        }
        this._currentTrigger = null;
    }
};

const AdminProducts = {
    pb: null,
    currentProduct: null,
    visualItems: [], // Array of { type: 'existing'|'new', value: filename|File, id: uniqueId }
    sortable: null,
    _slugGenerator: null,
    modal: null,
    _currentTrigger: null,
    _previousBodyOverflow: '',
    _escapeHandlerBound: false,

    init: async function () {
        // Use shared PocketBase instance
        this.pb = window.AdminAuth?.pb || window.PBClient.getInstance();

        // Check auth
        if (!AdminAuth.checkAdmin()) {
            return;
        }

        // Load categories FIRST so dropdowns can be populated
        await AdminCategories.init(this.pb);
        this.bindEvents();
        this.bindModalEvents();

        // Initialize HTMX Auth
        document.body.addEventListener('htmx:configRequest', (event) => {
            if (AdminAuth && AdminAuth.pb && AdminAuth.pb.authStore.isValid) {
                event.detail.headers['Authorization'] = AdminAuth.pb.authStore.token;
            }
        });

        this.loadProducts();
    },

    bindEvents: function () {
        const addProductBtn = document.getElementById('add-product-btn');
        if (addProductBtn && !addProductBtn.dataset.bound) {
            addProductBtn.dataset.bound = 'true';
            addProductBtn.addEventListener('click', (event) => this.openAddModal(event.currentTarget));
        }

        const manageCategoriesBtn = document.getElementById('manage-categories-btn');
        if (manageCategoriesBtn && !manageCategoriesBtn.dataset.bound) {
            manageCategoriesBtn.dataset.bound = 'true';
            manageCategoriesBtn.addEventListener('click', (event) => AdminCategories.openModal(event.currentTarget));
        }

        const filterCategory = document.getElementById('filter-category');
        if (filterCategory && !filterCategory.dataset.bound) {
            filterCategory.dataset.bound = 'true';
            filterCategory.addEventListener('change', () => this.loadProducts());
        }

        const productImages = document.getElementById('product-images');
        if (productImages && !productImages.dataset.bound) {
            productImages.dataset.bound = 'true';
            productImages.addEventListener('change', (event) => this.handleImageSelect(event.target));
        }

        const productForm = document.getElementById('product-form');
        if (productForm && !productForm.dataset.bound) {
            productForm.dataset.bound = 'true';
            productForm.addEventListener('submit', (event) => {
                event.preventDefault();
                this.saveProduct();
            });
        }

        const tableBody = document.getElementById('product-table-body');
        if (tableBody && !tableBody.dataset.bound) {
            tableBody.dataset.bound = 'true';
            tableBody.addEventListener('click', (event) => {
                const button = event.target.closest('[data-action]');
                if (!button) return;

                const { action, productId } = button.dataset;
                if (action === 'edit-product') {
                    this.openEditModal(productId, button);
                } else if (action === 'delete-product') {
                    this.deleteProduct(productId);
                }
            });

            tableBody.addEventListener('change', (event) => {
                const select = event.target.closest('[data-action="product-category-select"]');
                if (!select) return;
                this.updateCategory(select.dataset.productId, select.value);
            });
        }
    },

    bindModalEvents: function () {
        const modal = this.modal || document.getElementById('productModal');
        if (!modal || modal.dataset.bound) return;

        this.modal = modal;
        modal.dataset.bound = 'true';

        modal.addEventListener('click', (event) => {
            if (event.target === modal || event.target.closest('[data-product-modal-close]')) {
                this.closeModal();
            }
        });

        if (!this._escapeHandlerBound) {
            document.addEventListener('keydown', (event) => {
                if (event.key === 'Escape' && this.isModalOpen()) {
                    this.closeModal();
                }
            });
            this._escapeHandlerBound = true;
        }
    },

    isModalOpen: function () {
        return !!(this.modal && !this.modal.hidden);
    },

    openModal: function () {
        const modal = this.modal || document.getElementById('productModal');
        if (!modal) return;

        this.modal = modal;
        this._previousBodyOverflow = document.body.style.overflow;
        modal.hidden = false;
        modal.setAttribute('aria-hidden', 'false');
        document.body.style.overflow = 'hidden';

        window.setTimeout(() => {
            const focusTarget = document.getElementById('product-title') || modal.querySelector('input, textarea, select');
            if (focusTarget && typeof focusTarget.focus === 'function') {
                focusTarget.focus();
            }
        }, 0);
    },

    closeModal: function () {
        const modal = this.modal || document.getElementById('productModal');
        if (!modal) return;

        modal.hidden = true;
        modal.setAttribute('aria-hidden', 'true');
        document.body.style.overflow = this._previousBodyOverflow || '';

        if (this._currentTrigger && typeof this._currentTrigger.focus === 'function') {
            this._currentTrigger.focus();
        }
        this._currentTrigger = null;
    },

    loadProducts: async function () {
        const tableBody = document.getElementById('product-table-body');
        const spinner = document.getElementById('loading-spinner');

        spinner.style.display = 'flex';
        tableBody.innerHTML = '';

        try {
            const filterCategory = document.getElementById('filter-category').value;
            const records = await this.pb.collection('products').getFullList({
                sort: '-created',
                expand: 'category',
            });

            spinner.style.display = 'none';

            let displayRecords = records;
            if (filterCategory) {
                displayRecords = records.filter(p => p.category === filterCategory);
            }

            if (displayRecords.length === 0) {
                tableBody.innerHTML = '<tr><td colspan="9" class="admin-empty-state">등록된 상품이 없습니다</td></tr>';
                return;
            }

            // Fetch inquiries for counts (efficiently)
            const inquiries = await this.pb.collection('product_inquiries').getFullList({
                fields: 'product_id,reply',
                sort: '-created'
            });

            const inquiryMap = {};
            inquiries.forEach(inq => {
                if (!inquiryMap[inq.product_id]) inquiryMap[inq.product_id] = { total: 0, waiting: 0 };
                inquiryMap[inq.product_id].total++;
                if (!inq.reply) inquiryMap[inq.product_id].waiting++;
            });

            displayRecords.forEach(product => {
                const tr = document.createElement('tr');
                const imageUrl = product.images && product.images.length > 0
                    ? this.pb.files.getUrl(product, product.images[0], { thumb: '100x100' })
                    : '';

                // Generate Category Dropdown HTML
                let categorySelectHtml = `<select class="admin-select admin-category-select" data-action="product-category-select" data-product-id="${product.id}">
                    <option value="">(미지정)</option>`;

                AdminCategories.categories.forEach(cat => {
                    const selected = product.category === cat.id ? 'selected' : '';
                    categorySelectHtml += `<option value="${cat.id}" ${selected}>${cat.name}</option>`;
                });
                categorySelectHtml += `</select>`;

                // Inquiry stats
                const stats = inquiryMap[product.id] || { total: 0, waiting: 0 };
                let inquiryBadge = '-';
                if (stats.total > 0) {
                    const badgeClass = stats.waiting > 0 ? 'admin-pill admin-pill--warning' : 'admin-pill admin-pill--muted';
                    inquiryBadge = `<span class="${badgeClass}" title="문의 ${stats.total}건 (답변대기 ${stats.waiting})">
                        <i class="tf-ion-chatbubbles"></i> ${stats.waiting > 0 ? stats.waiting : stats.total}
                    </span>`;
                }

                const imageCellHtml = imageUrl
                    ? `<div class="admin-table-thumb"><img src="${imageUrl}" alt="${product.title}"></div>`
                    : '<div class="admin-table-thumb admin-table-thumb--empty">-</div>';

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
                                ${product.enabled ? 'checked' : ''}
                                hx-patch="${window.SiteConfig?.pocketbaseUrl || ''}/api/collections/products/records/${product.id}"
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
                            <button class="admin-btn admin-btn--outline admin-btn--sm" type="button" data-action="edit-product" data-product-id="${product.id}">수정</button>
                            <button class="admin-btn admin-btn--danger admin-btn--sm" type="button" data-action="delete-product" data-product-id="${product.id}">삭제</button>
                            <a href="/${product.language || 'ko'}/products/${product.slug}/" target="_blank" rel="noreferrer" class="admin-btn admin-btn--light admin-btn--sm">상세페이지</a>
                        </div>
                    </td>
                `;
                tableBody.appendChild(tr);
                htmx.process(tr);
            });
        } catch (error) {
            console.error('Error loading products:', error);
            spinner.style.display = 'none';
            showAdminProductsToast('상품 목록을 불러오는 중 오류가 발생했습니다', 'error');
        }
    },

    openAddModal: function (trigger) {
        this.currentProduct = null;
        document.getElementById('product-form').reset();
        document.getElementById('product-id').value = '';
        document.getElementById('product-category').value = '';
        document.getElementById('productModalLabel').innerText = '상품 추가';
        document.getElementById('product-stock').value = '0';
        document.getElementById('product-admin-memo').value = '';
        this._currentTrigger = trigger || document.getElementById('add-product-btn') || document.activeElement;

        this.visualItems = [];
        this.renderImages();
        this.bindSlugGenerator();

        this.openModal();
    },

    openEditModal: async function (id, trigger) {
        try {
            const product = await this.pb.collection('products').getOne(id);
            this.currentProduct = product;
            this._currentTrigger = trigger || document.activeElement;

            document.getElementById('product-id').value = product.id;
            document.getElementById('product-title').value = product.title;
            document.getElementById('product-category').value = product.category || '';
            document.getElementById('product-slug').value = product.slug;
            document.getElementById('product-description').value = product.description;
            document.getElementById('product-admin-memo').value = product.admin_memo || '';
            document.getElementById('product-price').value = product.price;
            document.getElementById('product-discount').value = product.discount_price;
            document.getElementById('product-stock').value = product.stock || 0;
            document.getElementById('product-order').value = product.order;
            document.getElementById('product-enabled').checked = product.enabled;
            document.getElementById('product-language').value = product.language;
            this.detachSlugGenerator();

            // Handle arrays (colors, sizes)
            const colors = product.colors ? (Array.isArray(product.colors) ? product.colors : JSON.parse(product.colors)) : [];
            const sizes = product.sizes ? (Array.isArray(product.sizes) ? product.sizes : JSON.parse(product.sizes)) : [];

            document.getElementById('product-colors').value = colors.join(', ');
            document.getElementById('product-sizes').value = sizes.join(', ');

            // Setup visual items
            this.visualItems = [];
            if (product.images && product.images.length > 0) {
                product.images.forEach(img => {
                    this.visualItems.push({
                        type: 'existing',
                        value: img,
                        id: 'exist-' + img
                    });
                });
            }
            this.renderImages();

            document.getElementById('productModalLabel').innerText = '상품 수정';
            this.openModal();
        } catch (error) {
            console.error('Error fetching product details:', error);
            showAdminProductsToast('상품 정보를 불러오는 중 오류가 발생했습니다', 'error');
        }
    },

    bindSlugGenerator: function () {
        const titleInput = document.getElementById('product-title');
        const slugInput = document.getElementById('product-slug');
        if (!titleInput || !slugInput) return;

        this.detachSlugGenerator();

        this._slugGenerator = () => {
            const title = titleInput.value;
            let slug = title
                .toLowerCase()
                .trim()
                .replace(/\s+/g, '-')
                .replace(/[^\w\-가-힣]/g, '')
                .replace(/[가-힣]/g, function () {
                    return '';
                })
                .replace(/\-+/g, '-')
                .replace(/^-|-$/g, '');

            if (!slug) {
                slug = 'product-' + Date.now();
            }

            slugInput.value = slug;
        };

        titleInput.addEventListener('input', this._slugGenerator);
    },

    detachSlugGenerator: function () {
        const titleInput = document.getElementById('product-title');
        if (titleInput && this._slugGenerator) {
            titleInput.removeEventListener('input', this._slugGenerator);
        }
        this._slugGenerator = null;
    },

    saveProduct: async function () {
        const id = document.getElementById('product-id').value;
        const title = document.getElementById('product-title').value;
        const category = document.getElementById('product-category').value;
        const slug = document.getElementById('product-slug').value;
        const description = document.getElementById('product-description').value;
        const adminMemo = document.getElementById('product-admin-memo').value;
        const price = parseFloat(document.getElementById('product-price').value);
        const discountPriceStr = document.getElementById('product-discount').value;
        const stockStr = document.getElementById('product-stock').value;
        const orderStr = document.getElementById('product-order').value;
        const enabled = document.getElementById('product-enabled').checked;
        const language = document.getElementById('product-language').value;

        const colorsStr = document.getElementById('product-colors').value;
        const sizesStr = document.getElementById('product-sizes').value;

        const colors = colorsStr ? colorsStr.split(',').map(s => s.trim()).filter(s => s) : [];
        const sizes = sizesStr ? sizesStr.split(',').map(s => s.trim()).filter(s => s) : [];

        const newFiles = this.visualItems.filter(item => item.type === 'new').map(item => item.value);
        const existingFiles = this.visualItems.filter(item => item.type === 'existing').map(item => item.value);


        // Append basic data
        const formData = new FormData();
        formData.append('title', title);
        if (category) formData.append('category', category);
        formData.append('slug', slug);
        formData.append('description', description || '');
        formData.append('admin_memo', adminMemo || '');
        formData.append('price', price);

        if (discountPriceStr && discountPriceStr.trim() !== '') {
            formData.append('discount_price', parseFloat(discountPriceStr));
        }

        if (stockStr && stockStr.trim() !== '') {
            formData.append('stock', parseInt(stockStr));
        } else {
            formData.append('stock', 0);
        }

        if (orderStr && orderStr.trim() !== '') {
            formData.append('order', parseInt(orderStr));
        } else {
            formData.append('order', 0);
        }

        formData.append('enabled', enabled);
        formData.append('language', language);
        formData.append('colors', JSON.stringify(colors));
        formData.append('sizes', JSON.stringify(sizes));

        // Step 1: Upload new files and update other fields
        // PocketBase appends new files to the existing list
        if (newFiles.length > 0) {
            for (const file of newFiles) {
                formData.append('images', file);
            }
        }
        // To remove images, we need to explicitly send the list of images to keep
        // If we are updating, and there are existing images in visualItems, we need to tell PB to keep them
        // If we don't send 'images' field for existing images, PB will delete them if they are not in the new list.
        // So, we must send all existing images that we want to keep.
        if (id) {
            // For update, we need to explicitly tell PB which existing images to keep
            // If we don't include an existing image in the formData, PB will delete it.
            // So, we add all existing images from visualItems to formData.
            // New images are also added, PB will append them.
            existingFiles.forEach(filename => {
                formData.append('images', filename);
            });
        }


        try {
            let record;
            if (id) {
                record = await this.pb.collection('products').update(id, formData);
            } else {
                record = await this.pb.collection('products').create(formData);
            }

            // Step 2: Reorder images if necessary
            // The record.images now contains all images (existing + newly uploaded)
            // We need to construct the final desired order based on this.visualItems
            const finalImages = [];
            const serverImages = record.images ? [...record.images] : [];

            // Map visual items to server filenames
            // Existing items: use their value (filename)
            // New items: map them to the filenames returned by PocketBase for the newly uploaded files.
            // PocketBase appends new files, so we can take them from the end of serverImages.

            const addedCount = newFiles.length;
            const newServerImages = serverImages.slice(serverImages.length - addedCount);
            let newImgIdx = 0;

            this.visualItems.forEach(item => {
                if (item.type === 'existing') {
                    // Only include if it still exists in server array (sanity check, though PB should handle deletions)
                    if (serverImages.includes(item.value)) {
                        finalImages.push(item.value);
                    }
                } else if (item.type === 'new') {
                    if (newImgIdx < newServerImages.length) {
                        finalImages.push(newServerImages[newImgIdx]);
                        newImgIdx++;
                    }
                }
            });

            // If the order is different or some images were implicitly removed by not being in formData,
            // we perform a second update to set the final order.
            const currentServerOrder = JSON.stringify(record.images);
            const newOrder = JSON.stringify(finalImages);

            if (currentServerOrder !== newOrder) {
                await this.pb.collection('products').update(record.id, {
                    images: finalImages
                });
            }

            this.closeModal();
            this.loadProducts();
        } catch (error) {
            console.error('Error saving product:', error);
            showAdminProductsToast('상품 저장 실패: ' + error.message, 'error', 4200);
        }
    },

    deleteProduct: async function (id) {
        const confirmed = await confirmAdminProductsAction({
            title: '상품 삭제',
            message: '이 상품을 삭제하시겠습니까?',
            confirmLabel: '삭제',
            danger: true
        });
        if (!confirmed) return;

        try {
            await this.pb.collection('products').delete(id);
            this.loadProducts();
        } catch (error) {
            console.error('Error deleting product:', error);
            showAdminProductsToast('상품 삭제에 실패했습니다', 'error');
        }
    },

    deleteImage: function (index) {
        this.visualItems.splice(index, 1);
        this.renderImages();
    },

    updateCategory: async function (productId, categoryId) {
        try {
            await this.pb.collection('products').update(productId, {
                category: categoryId
            });
            // Optional: visual feedback like toast
            console.log('Category updated');
        } catch (error) {
            console.error('Error updating category:', error);
            showAdminProductsToast('카테고리 수정 실패: ' + error.message, 'error');
            // Revert change in UI if needed, but simplified for now
            this.loadProducts(); // Reload to reset UI state on error
        }
    },

    handleImageSelect: function (input) {
        if (input.files && input.files.length > 0) {
            Array.from(input.files).forEach((file, idx) => {
                // Prevent duplicates based on name and size (optional, but good for UX)
                const exists = this.visualItems.some(item => item.type === 'new' && item.value.name === file.name && item.value.size === file.size);
                if (!exists) {
                    this.visualItems.push({
                        type: 'new',
                        value: file,
                        id: 'new-' + Date.now() + '-' + idx
                    });
                }
            });
            this.renderImages();
            input.value = '';
        }
    },

    renderImages: function () {
        const container = document.getElementById('product-image-list');
        if (!container) return;

        if (this.visualItems.length === 0) {
            container.innerHTML = '<div class="admin-product-image-empty admin-empty-state">이미지가 없습니다</div>';
            return;
        }

        container.innerHTML = '';

        // Initialize Sortable if not already
        if (!this.sortable) {
            this.sortable = new Sortable(container, {
                animation: 150,
                onEnd: (evt) => {
                    // Reorder visualItems array matching DOM order
                    const item = this.visualItems.splice(evt.oldIndex, 1)[0];
                    this.visualItems.splice(evt.newIndex, 0, item);
                }
            });
        }

        this.visualItems.forEach((item, index) => {
            const div = document.createElement('div');
            div.className = 'admin-sortable-item';
            div.setAttribute('data-id', item.id);

            // HTML structure placeholder
            let imgHtml = '';

            if (item.type === 'existing') {
                const imgUrl = this.pb.files.getUrl(this.currentProduct, item.value, { thumb: '100x100' });
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
                    const imgContainer = div.querySelector('.admin-sortable-thumb');
                    imgContainer.style.background = 'none';
                    imgContainer.innerHTML = `<img src="${e.target.result}" alt="" />`;
                };
                reader.readAsDataURL(item.value);
            }

            // Delete button
            const delBtn = document.createElement('button');
            delBtn.type = 'button';
            delBtn.className = 'admin-btn admin-btn--danger admin-btn--sm admin-sortable-remove';
            delBtn.innerHTML = '&times;';
            delBtn.addEventListener('click', (e) => {
                e.stopPropagation(); // prevent drag start
                this.deleteImage(index);
            });

            div.appendChild(delBtn);

            // Badge for first item
            if (index === 0) {
                const badge = document.createElement('span');
                badge.className = 'admin-pill admin-pill--success admin-sortable-badge';
                badge.textContent = '대표';
                div.appendChild(badge);
            }

            container.appendChild(div);
        });
    }
};

document.addEventListener('DOMContentLoaded', function () {
    AdminProducts.init();
});

