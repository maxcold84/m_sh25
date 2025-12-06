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

    init: function () {
        this.pb = new PocketBase('http://127.0.0.1:8090');

        // Check auth
        if (!AdminAuth.checkAdmin()) {
            return;
        }

        this.loadProducts();
        AdminCategories.init(this.pb);
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

            displayRecords.forEach(product => {
                const tr = document.createElement('tr');
                const categoryName = product.expand && product.expand.category ? product.expand.category.name : '-';
                const imageUrl = product.images && product.images.length > 0
                    ? this.pb.files.getUrl(product, product.images[0], { thumb: '100x100' })
                    : 'https://via.placeholder.com/50';

                tr.innerHTML = `
                    <td><img src="${imageUrl}" alt="${product.title}" style="width: 50px; height: 50px; object-fit: cover;"></td>
                    <td><span class="badge badge-light">${categoryName}</span></td>
                    <td>${product.title}</td>
                    <td>${product.price.toLocaleString()}</td>
                    <td>${product.stock || 0}</td>
                    <td>
                        <span class="badge badge-${product.enabled ? 'success' : 'secondary'}">
                            ${product.enabled ? '활성화' : '비활성화'}
                        </span>
                    </td>
                    <td>
                        <button class="btn btn-sm btn-info" onclick="AdminProducts.openEditModal('${product.id}')">수정</button>
                        <button class="btn btn-sm btn-danger" onclick="AdminProducts.deleteProduct('${product.id}')">삭제</button>
                        <a href="/ko/products/${product.slug}/" target="_blank" class="btn btn-sm btn-success">상세페이지</a>
                    </td>
                `;
                tableBody.appendChild(tr);
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
        document.getElementById('current-images').innerHTML = '';

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

            // Show current images
            const imagesContainer = document.getElementById('current-images');
            imagesContainer.innerHTML = '';
            if (product.images && product.images.length > 0) {
                product.images.forEach(img => {
                    const imgUrl = this.pb.files.getUrl(product, img, { thumb: '100x100' });
                    const div = document.createElement('div');
                    div.className = 'mr-2 mb-2 position-relative';
                    div.innerHTML = `
                        <img src="${imgUrl}" class="img-thumbnail" style="width: 80px; height: 80px; object-fit: cover;">
                        <button type="button" class="btn btn-xs btn-danger position-absolute" style="top: -5px; right: -5px;" 
                            onclick="AdminProducts.deleteImage('${product.id}', '${img}')">&times;</button>
                    `;
                    imagesContainer.appendChild(div);
                });
            }

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

        const formData = new FormData();
        formData.append('title', title);
        if (category) formData.append('category', category);
        formData.append('slug', slug);
        formData.append('description', description || '');
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

        // Handle image uploads
        const fileInput = document.getElementById('product-images');
        if (fileInput.files.length > 0) {
            for (let file of fileInput.files) {
                formData.append('images', file);
            }
        }

        try {
            if (id) {
                await this.pb.collection('products').update(id, formData);
            } else {
                await this.pb.collection('products').create(formData);
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

    deleteImage: async function (productId, imageName) {
        if (!confirm('이 이미지를 삭제하시겠습니까?')) return;

        try {
            // PocketBase doesn't support deleting single file from array via API easily without re-uploading or complex update
            // But we can update the record by filtering out the image
            // Note: This requires fetching the record first which we already have in currentProduct

            if (!this.currentProduct) return;

            const newImages = this.currentProduct.images.filter(img => img !== imageName);

            await this.pb.collection('products').update(productId, {
                images: newImages
            });

            // Refresh modal
            this.openEditModal(productId);
        } catch (error) {
            console.error('Error deleting image:', error);
            alert('이미지 삭제에 실패했습니다');
        }
    }
};

document.addEventListener('DOMContentLoaded', function () {
    AdminProducts.init();
});
