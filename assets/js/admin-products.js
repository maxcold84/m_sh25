/**
 * Admin Products Manager
 * Handles product CRUD operations for the admin interface
 */

const AdminCategories = {
    pb: null,
    categories: [],

    init: async function (pb) {
        this.pb = pb;
        const form = document.getElementById('category-form');
        if (form) {
            form.addEventListener('submit', (e) => {
                e.preventDefault();
                this.addCategory();
            });
        }
        await this.loadCategories();
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
                if (list) list.innerHTML = '<div class="text-center text-danger">카테고리 컬렉션이 없습니다.</div>';
            }
        }
    },

    renderList: function () {
        const list = document.getElementById('category-list');
        if (!list) return;

        if (this.categories.length === 0) {
            list.innerHTML = '<div class="text-center py-3 text-muted">카테고리가 없습니다.</div>';
            return;
        }

        list.innerHTML = '';
        this.categories.forEach(cat => {
            const item = document.createElement('div');
            item.className = 'list-group-item d-flex justify-content-between align-items-center';
            item.innerHTML = `
                <span>${cat.name}</span>
                <button class="btn btn-sm btn-outline-danger" onclick="AdminCategories.deleteCategory('${cat.id}')">
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
            alert('카테고리 추가 실패: ' + error.message);
        }
    },

    deleteCategory: async function (id) {
        if (!confirm('정말 삭제하시겠습니까?')) return;
        try {
            await this.pb.collection('categories').delete(id);
            await this.loadCategories();
        } catch (error) {
            console.error('Error deleting category:', error);
            alert('카테고리 삭제 실패');
        }
    },

    openModal: function () {
        $('#categoryModal').modal('show');
    }
};

const AdminProducts = {
    pb: null,
    currentProduct: null,
    visualItems: [], // Array of { type: 'existing'|'new', value: filename|File, id: uniqueId }
    sortable: null,

    init: async function () {
        // Use shared PocketBase instance
        this.pb = window.AdminAuth?.pb || window.PBClient.getInstance();

        // Check auth
        if (!AdminAuth.checkAdmin()) {
            return;
        }

        // Load categories FIRST so dropdowns can be populated
        await AdminCategories.init(this.pb);

        // Initialize HTMX Auth
        document.body.addEventListener('htmx:configRequest', (event) => {
            if (AdminAuth && AdminAuth.pb && AdminAuth.pb.authStore.isValid) {
                event.detail.headers['Authorization'] = AdminAuth.pb.authStore.token;
            }
        });

        this.loadProducts();
    },

    loadProducts: async function () {
        const tableBody = document.getElementById('product-table-body');
        const spinner = document.getElementById('loading-spinner');

        spinner.style.display = 'block';
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
                tableBody.innerHTML = '<tr><td colspan="7" class="text-center">등록된 상품이 없습니다</td></tr>';
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
                const categoryName = product.expand && product.expand.category ? product.expand.category.name : '-';
                const imageUrl = product.images && product.images.length > 0
                    ? this.pb.files.getUrl(product, product.images[0], { thumb: '100x100' })
                    : 'https://via.placeholder.com/50';

                // Generate Category Dropdown HTML
                let categorySelectHtml = `<select class="form-control form-control-sm" onchange="AdminProducts.updateCategory('${product.id}', this.value)" style="width: 140px;">
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
                    // Use simple icon class if available, assuming tf-ion-chatbubbles or similar from context
                    const iconClass = stats.waiting > 0 ? 'text-danger' : 'text-secondary';
                    inquiryBadge = `<span class="${iconClass}" style="font-size: 1.2em;" title="문의 ${stats.total}건 (답변대기 ${stats.waiting})">
                        <i class="tf-ion-chatbubbles"></i> ${stats.waiting > 0 ? `<small class="font-weight-bold">${stats.waiting}</small>` : ''}
                     </span>`;
                }

                tr.innerHTML = `
                    <td><img src="${imageUrl}" alt="${product.title}" style="width: 50px; height: 50px; object-fit: cover;"></td>
                    <td>${categorySelectHtml}</td>
                    <td>${product.title}</td>
                    <td>${product.discount_price && product.discount_price > 0
                        ? `<del class="text-muted small">${product.price.toLocaleString()}</del> <br><span class="text-danger font-weight-bold">${product.discount_price.toLocaleString()}</span>`
                        : product.price.toLocaleString()
                    }</td>
                    <td>${product.stock || 0}</td>
                    <td class="text-center">${inquiryBadge}</td>
                    <td>
                        <div class="custom-control custom-switch">
                            <input type="checkbox" class="custom-control-input" id="status-${product.id}" 
                                ${product.enabled ? 'checked' : ''}
                                hx-patch="${window.SiteConfig?.pocketbaseUrl || ""}/api/collections/products/records/${product.id}"
                                hx-trigger="change"
                                hx-vals='js:{"enabled": event.target.checked}'
                                hx-swap="none">
                            <label class="custom-control-label" for="status-${product.id}"></label>
                        </div>
                    </td>
                    <td>
                        <button class="btn btn-sm btn-info" onclick="AdminProducts.openEditModal('${product.id}')">수정</button>
                        <button class="btn btn-sm btn-danger" onclick="AdminProducts.deleteProduct('${product.id}')">삭제</button>
                        <a href="/${product.language || 'ko'}/products/${product.slug}/" target="_blank" class="btn btn-sm btn-success">상세페이지</a>
                    </td>
                `;
                tableBody.appendChild(tr);
                htmx.process(tr);
            });
        } catch (error) {
            console.error('Error loading products:', error);
            spinner.style.display = 'none';
            alert('상품 목록을 불러오는 중 오류가 발생했습니다');
        }
    },

    openAddModal: function () {
        this.currentProduct = null;
        document.getElementById('product-form').reset();
        document.getElementById('product-id').value = '';
        document.getElementById('product-category').value = '';
        document.getElementById('productModalLabel').innerText = '상품 추가';
        document.getElementById('product-stock').value = '0';
        document.getElementById('product-admin-memo').value = '';

        this.visualItems = [];
        this.renderImages();

        // Add auto-slug generation
        const titleInput = document.getElementById('product-title');
        const slugInput = document.getElementById('product-slug');

        // Remove existing listener if any
        titleInput.removeEventListener('input', this._slugGenerator);

        // Create slug generator function
        this._slugGenerator = function () {
            const title = titleInput.value;
            let slug = title
                .toLowerCase()
                .trim()
                // Replace spaces with hyphens
                .replace(/\s+/g, '-')
                // Remove special characters except hyphens
                .replace(/[^\w\-가-힣]/g, '')
                // For Korean characters, convert to romanized or use timestamp
                .replace(/[가-힣]/g, function (match) {
                    // Simple approach: remove Korean and use timestamp
                    return '';
                })
                // Remove multiple consecutive hyphens
                .replace(/\-+/g, '-')
                // Remove leading/trailing hyphens
                .replace(/^-|-$/g, '');

            // If slug is empty (was all Korean), use timestamp-based slug
            if (!slug) {
                slug = 'product-' + Date.now();
            }

            slugInput.value = slug;
        };

        titleInput.addEventListener('input', this._slugGenerator);

        $('#productModal').modal('show');
    },

    openEditModal: async function (id) {
        try {
            const product = await this.pb.collection('products').getOne(id);
            this.currentProduct = product;

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
            $('#productModal').modal('show');
        } catch (error) {
            console.error('Error fetching product details:', error);
            alert('상품 정보를 불러오는 중 오류가 발생했습니다');
        }
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

            $('#productModal').modal('hide');
            this.loadProducts();
        } catch (error) {
            console.error('Error saving product:', error);
            alert('상품 저장 실패: ' + error.message);
        }
    },

    deleteProduct: async function (id) {
        if (!confirm('이 상품을 삭제하시겠습니까?')) return;

        try {
            await this.pb.collection('products').delete(id);
            this.loadProducts();
        } catch (error) {
            console.error('Error deleting product:', error);
            alert('상품 삭제에 실패했습니다');
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
            alert('카테고리 수정 실패: ' + error.message);
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
            container.innerHTML = '<div class="w-100 text-center text-muted py-4">이미지가 없습니다</div>';
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
            div.className = 'mr-2 mb-2 position-relative sortable-item';
            div.setAttribute('data-id', item.id);
            div.style.cursor = 'move';

            // HTML structure placeholder
            let imgHtml = '';

            if (item.type === 'existing') {
                const imgUrl = this.pb.files.getUrl(this.currentProduct, item.value, { thumb: '100x100' });
                imgHtml = `<img src="${imgUrl}" class="w-100 h-100" style="object-fit: cover;">`;
                div.innerHTML = `
                    <div class="border rounded overflow-hidden" style="width: 100px; height: 100px; background: #fff;">
                        ${imgHtml}
                    </div>
                `;
            } else {
                div.innerHTML = `
                    <div class="border rounded overflow-hidden" style="width: 100px; height: 100px; display: flex; align-items: center; justify-content: center; background: #f8f9fa;">
                         <div class="spinner-border spinner-border-sm text-secondary" role="status"></div>
                    </div>
                `;
                const reader = new FileReader();
                reader.onload = (e) => {
                    const imgContainer = div.querySelector('.border');
                    imgContainer.style.background = 'none';
                    imgContainer.innerHTML = `<img src="${e.target.result}" class="w-100 h-100" style="object-fit: cover;">`;
                };
                reader.readAsDataURL(item.value);
            }

            // Delete button
            const delBtn = document.createElement('button');
            delBtn.type = 'button';
            delBtn.className = 'btn btn-xs btn-danger position-absolute rounded-circle p-0 d-flex justify-content-center align-items-center';
            delBtn.style.cssText = 'top: -5px; right: -5px; width: 24px; height: 24px; z-index: 10;';
            delBtn.innerHTML = '&times;';
            delBtn.onclick = (e) => {
                e.stopPropagation(); // prevent drag start
                this.deleteImage(index);
            };

            div.appendChild(delBtn);

            // Badge for first item
            if (index === 0) {
                const badge = document.createElement('span');
                badge.className = 'badge badge-primary position-absolute';
                badge.style.bottom = '5px';
                badge.style.left = '5px';
                badge.style.fontSize = '10px';
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

