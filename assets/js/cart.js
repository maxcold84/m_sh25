// Initialize PocketBase
console.log('Initializing PocketBase...');
const pb = new PocketBase('http://127.0.0.1:8090');

// Cart State Management
const Cart = {
    init(config) {
        console.log('Cart initialized with config:', config);
        this.config = config;
        this.renderCart();
    },

    async getOrCreateCart() {
        let cartId = localStorage.getItem('cart_id');
        if (cartId) {
            try {
                return await pb.collection('carts').getOne(cartId);
            } catch (e) {
                console.error('Error fetching cart:', e);
                console.log('Cart not found, creating new one');
                localStorage.removeItem('cart_id');
            }
        }

        console.log('Creating new cart...');
        try {
            const cart = await pb.collection('carts').create({
                session_id: crypto.randomUUID()
            });
            localStorage.setItem('cart_id', cart.id);
            console.log('New cart created:', cart.id);
            return cart;
        } catch (e) {
            console.error('Failed to create cart:', e);
            throw e;
        }
    },

    async addItem(product) {
        console.log('addItem called with:', product);
        try {
            const cart = await this.getOrCreateCart();

            // Check if item exists
            const items = await pb.collection('cart_items').getList(1, 1, {
                filter: `cart="${cart.id}" && product_id="${product.id}"`
            });

            if (items.items.length > 0) {
                const item = items.items[0];
                console.log('Item exists, updating quantity:', item.id);

                // Update price to match current page's price (e.g. if switching currency)
                await pb.collection('cart_items').update(item.id, {
                    price: product.price
                });

                // Use changeQuantity logic (delta +1)
                await this.changeQuantity(item.id, 1);
            } else {
                console.log('Item does not exist, creating new item');
                await pb.collection('cart_items').create({
                    cart: cart.id,
                    product_id: product.id,
                    name: product.name,
                    price: product.price,
                    image: product.image,
                    quantity: 1,
                    options: product.options
                });
                this.renderCart();
            }

            // Always open drawer after adding item
            this.toggleDrawer(true);
        } catch (e) {
            console.error('Error in addItem:', e);
            alert('Failed to add item to cart: ' + (e.message || e));
        }
    },

    async changeQuantity(itemId, delta) {
        console.log('changeQuantity called:', itemId, delta);
        try {
            const item = await pb.collection('cart_items').getOne(itemId);
            const newQuantity = item.quantity + delta;

            if (newQuantity <= 0) {
                await this.removeItem(itemId);
            } else {
                await this.updateQuantity(itemId, newQuantity);
            }
        } catch (e) {
            console.error('Error changing quantity:', e);
        }
    },

    async updateQuantity(itemId, newQuantity) {
        console.log('updateQuantity called:', itemId, newQuantity);
        try {
            const updatedItem = await pb.collection('cart_items').update(itemId, {
                quantity: newQuantity
            });

            // Optimistic UI update
            this.updateItemUI(updatedItem);
            this.updateCartTotals();
        } catch (e) {
            console.error('Error updating quantity:', e);
        }
    },

    updateItemUI(item) {
        const itemEl = document.querySelector(`.cart-item[data-item-id="${item.id}"]`);
        if (itemEl) {
            // Update Quantity
            const qtyEl = itemEl.querySelector('.quantity-value');
            if (qtyEl) qtyEl.textContent = item.quantity;

            // Update Price
            const priceEl = itemEl.querySelector('.item-price');
            if (priceEl) priceEl.textContent = this.formatCurrency(item.price * item.quantity);

            // Update Minus Button State
            const minusBtn = itemEl.querySelector('button[aria-label="Decrease quantity"]');
            if (minusBtn) {
                minusBtn.disabled = item.quantity <= 1;
            }
        }
    },

    async updateCartTotals() {
        const items = await this.getItems();
        const total = items.reduce((sum, item) => sum + (item.price * item.quantity), 0);
        const formattedTotal = this.formatCurrency(total);

        // Update Badge
        const countElement = document.getElementById('cart-item-count');
        if (countElement) {
            const count = items.reduce((sum, item) => sum + item.quantity, 0);
            countElement.textContent = count;
            countElement.style.display = count > 0 ? 'flex' : 'none';
        }

        // Update Footer Totals
        const subtotalEl = document.getElementById('cart-subtotal');
        const totalEl = document.getElementById('cart-total');
        const footerEl = document.getElementById('cart-footer');

        if (subtotalEl) subtotalEl.textContent = formattedTotal;
        if (totalEl) totalEl.textContent = formattedTotal;

        if (footerEl) {
            footerEl.style.display = items.length > 0 ? 'block' : 'none';
        }
    },

    formatCurrency(amount) {
        const isKorean = document.documentElement.lang === 'ko' || window.location.pathname.includes('/korean/');
        const currency = isKorean ? 'KRW' : 'USD';
        const locale = isKorean ? 'ko-KR' : 'en-US';

        return new Intl.NumberFormat(locale, { style: 'currency', currency: currency }).format(amount);
    },

    async removeItem(itemId) {
        console.log('removeItem called:', itemId);
        try {
            await pb.collection('cart_items').delete(itemId);
            this.renderCart();
        } catch (e) {
            console.error('Error removing item:', e);
        }
    },

    async getItems() {
        const cartId = localStorage.getItem('cart_id');
        if (!cartId) return [];
        try {
            const records = await pb.collection('cart_items').getFullList({
                filter: `cart="${cartId}"`,
                sort: '-created'
            });

            // Process items for display
            const isKorean = document.documentElement.lang === 'ko' || window.location.pathname.includes('/korean/');

            return records.map(item => {
                let displayPrice = item.price;
                if (isKorean && displayPrice < 1000) {
                    displayPrice = displayPrice * 1000;
                } else if (!isKorean && displayPrice > 1000) {
                    displayPrice = displayPrice / 1000;
                }

                return {
                    ...item,
                    formattedPrice: this.formatCurrency(displayPrice * item.quantity),
                    isMinQuantity: item.quantity <= 1
                };
            });
        } catch (e) {
            console.error('Error fetching items:', e);
            return [];
        }
    },

    checkout: async function () {
        console.log('checkout called');
        const items = await this.getItems();
        if (items.length === 0) {
            alert('Cart is empty');
            return;
        }

        // Redirect to checkout page with language support
        const lang = document.documentElement.lang || 'en';
        // If defaultContentLanguageInSubdir is true, we always need the lang prefix
        // Assuming 'ko' for Korean and 'en' for English based on hugo.toml

        // Simple check: if we are already in a lang path, preserve it.
        // Or just use the lang attribute which Hugo sets.
        window.location.href = `/${lang}/checkout`;
        this.toggleDrawer(false);
    },


    async renderCart() {
        // console.log('renderCart called');
        const items = await this.getItems();

        // Determine current page currency context
        const isKorean = document.documentElement.lang === 'ko' || window.location.pathname.includes('/korean/');

        // Calculate total with display conversion
        const total = items.reduce((sum, item) => {
            let price = item.price;
            // Simple heuristic: if price < 1000 and we are in KRW mode, assume it's USD and convert
            if (isKorean && price < 1000) {
                price = price * 1000;
            }
            // If price > 1000 and we are in USD mode, assume it's KRW and convert
            else if (!isKorean && price > 1000) {
                price = price / 1000;
            }
            return sum + (price * item.quantity);
        }, 0);

        const formattedTotal = this.formatCurrency(total);

        // Update Badge
        const countElement = document.getElementById('cart-item-count');
        if (countElement) {
            const count = items.reduce((sum, item) => sum + item.quantity, 0);
            countElement.textContent = count;
            countElement.style.display = count > 0 ? 'flex' : 'none';
        }

        // Update Footer Totals
        const subtotalEl = document.getElementById('cart-subtotal');
        const totalEl = document.getElementById('cart-total');
        const footerEl = document.getElementById('cart-footer');

        if (subtotalEl) subtotalEl.textContent = formattedTotal;
        if (totalEl) totalEl.textContent = formattedTotal;

        if (footerEl) {
            footerEl.style.display = items.length > 0 ? 'block' : 'none';
        }

        const templateElement = document.getElementById('cart-template');
        if (!templateElement) {
            console.error('Cart template not found!');
            return;
        }
        const template = templateElement.innerHTML;

        try {
            const hasItems = items.length > 0;
            const rendered = Mustache.render(template, {
                items: items,
                total: formattedTotal,
                hasItems: hasItems
            }, null, ['[[', ']]']);

            const container = document.getElementById('cart-items-container');
            if (container) {
                container.innerHTML = rendered;
            }
        } catch (e) {
            console.error('Error rendering cart:', e);
            const container = document.getElementById('cart-items-container');
            if (container) {
                container.innerHTML = `
                    <div class="cart-error" style="padding: 20px; text-align: center; color: #e53e3e;">
                        <p style="margin-bottom: 10px;">장바구니를 불러오는 중 오류가 발생했습니다.</p>
                        <p class="error-detail" style="font-size: 0.8em; color: #718096; margin-bottom: 15px;">${e.message}</p>
                        <button onclick="Cart.renderCart()" class="retry-btn" style="padding: 8px 16px; background: #4a5568; color: white; border: none; border-radius: 4px; cursor: pointer;">다시 시도</button>
                    </div>
                `;
            }
        }
    },

    toggleDrawer(forceOpen) {
        const drawer = document.getElementById('cart-drawer');
        const overlay = document.getElementById('cart-overlay');

        if (drawer && overlay) {
            if (typeof forceOpen === 'boolean') {
                if (forceOpen) {
                    drawer.classList.add('open');
                    overlay.classList.add('open');
                } else {
                    drawer.classList.remove('open');
                    overlay.classList.remove('open');
                }
            } else {
                drawer.classList.toggle('open');
                overlay.classList.toggle('open');
            }

            if (drawer.classList.contains('open')) {
                this.renderCart();
            }
        }
    }
};

// Expose to window for HTMX or inline calls
window.Cart = Cart;
console.log('Cart object exposed to window');

// Custom Event Listeners
document.body.addEventListener('cart-updated', function () {
    console.log('cart-updated event received');
    Cart.renderCart();
});
