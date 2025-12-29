// Use shared PocketBase instance
const pb = window.PBClient.getInstance();

// Cart State Management
const Cart = {
    async init(config) {
        console.log('Cart initialized with config:', config);
        this.config = config;

        // If logged in, ensure we have the correct cart (and merge if needed)
        if (pb.authStore.isValid) {
            await this.getOrCreateCart();
        }

        this.renderCart();

        // Listen for auth changes to sync cart
        pb.authStore.onChange(async () => {
            console.log('Auth state changed in Cart, syncing...');
            if (pb.authStore.isValid) {
                // Logged In: Merge/Fetch user cart
                await this.getOrCreateCart();
            } else {
                // Logged Out: Clear local reference to user cart
                localStorage.removeItem('cart_id');
            }
            this.renderCart();
        });
    },

    async getOrCreateCart() {
        // 1. Check if user is logged in
        if (pb.authStore.isValid) {
            const userId = pb.authStore.model.id;
            console.log('User logged in:', userId);

            try {
                // Try to find existing cart for user
                const carts = await pb.collection('carts').getList(1, 1, {
                    filter: `user="${userId}"`,
                    sort: '-created'
                });

                if (carts.items.length > 0) {
                    const userCart = carts.items[0];
                    console.log('Found existing user cart:', userCart.id);

                    // Check if we have a local guest cart to merge
                    const localCartId = localStorage.getItem('cart_id');
                    if (localCartId && localCartId !== userCart.id) {
                        console.log('Merging local cart into user cart...');
                        await this.mergeCarts(localCartId, userCart.id);
                        localStorage.removeItem('cart_id'); // Clear local cart ref
                    }

                    localStorage.setItem('cart_id', userCart.id);
                    return userCart;
                } else {
                    // No user cart exists. 
                    // Check if we have a local guest cart to assign
                    const localCartId = localStorage.getItem('cart_id');
                    if (localCartId) {
                        console.log('Assigning local cart to user:', localCartId);
                        try {
                            const updatedCart = await pb.collection('carts').update(localCartId, {
                                user: userId
                            });
                            return updatedCart;
                        } catch (e) {
                            console.error('Failed to assign cart to user, creating new one and merging:', e);

                            // Create new cart for user
                            const newCart = await pb.collection('carts').create({
                                session_id: crypto.randomUUID(),
                                user: userId
                            });

                            // Try to merge items from the old guest cart to the new user cart
                            await this.mergeCarts(localCartId, newCart.id);

                            localStorage.setItem('cart_id', newCart.id);
                            return newCart;
                        }
                    }

                    // Create new cart for user
                    console.log('Creating new cart for user...');
                    const newCart = await pb.collection('carts').create({
                        session_id: crypto.randomUUID(),
                        user: userId
                    });
                    localStorage.setItem('cart_id', newCart.id);
                    return newCart;
                }
            } catch (e) {
                console.error('Error handling user cart:', e);
                // Fallback to guest logic if something fails
            }
        }

        // 2. Guest Logic (Existing)
        let cartId = localStorage.getItem('cart_id');
        if (cartId) {
            try {
                const cart = await pb.collection('carts').getOne(cartId);

                // Security Check: If we are a guest, but this cart belongs to a user, 
                // we should NOT access it. It likely belongs to a previously logged-in user.
                if (cart.user && cart.user !== '') {
                    console.log('Found user cart while in guest mode. Clearing and creating new guest cart.');
                    localStorage.removeItem('cart_id');
                    // Fall through to create new cart
                } else {
                    return cart;
                }
            } catch (e) {
                console.error('Error fetching cart:', e);
                console.log('Cart not found, creating new one');
                localStorage.removeItem('cart_id');
            }
        }

        console.log('Creating new guest cart...');
        try {
            const cart = await pb.collection('carts').create({
                session_id: crypto.randomUUID(),
                user: '' // Explicitly empty for guests
            });
            localStorage.setItem('cart_id', cart.id);
            console.log('New cart created:', cart.id);
            return cart;
        } catch (e) {
            console.error('Failed to create cart:', e);
            throw e;
        }
    },

    async mergeCarts(fromCartId, toCartId) {
        try {
            // Get items from source cart
            const items = await pb.collection('cart_items').getFullList({
                filter: `cart="${fromCartId}"`
            });

            console.log(`Merging ${items.length} items from ${fromCartId} to ${toCartId}`);

            for (const item of items) {
                // Check if item already exists in target cart
                const existingItems = await pb.collection('cart_items').getList(1, 1, {
                    filter: `cart="${toCartId}" && product_id="${item.product_id}"`
                });

                if (existingItems.items.length > 0) {
                    // Update quantity
                    const targetItem = existingItems.items[0];
                    await pb.collection('cart_items').update(targetItem.id, {
                        quantity: targetItem.quantity + item.quantity
                    });
                    // Delete source item
                    await pb.collection('cart_items').delete(item.id);
                } else {
                    // Move item to target cart
                    await pb.collection('cart_items').update(item.id, {
                        cart: toCartId
                    });
                }
            }

            // Delete the old cart if empty/abandoned (optional, but good for cleanup)
            // await pb.collection('carts').delete(fromCartId); 

        } catch (e) {
            console.error('Error merging carts:', e);
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

            // 각 아이템에 대해 slug를 조회하여 링크 생성
            const processedItems = [];
            for (const item of records) {
                let displayPrice = item.price;
                if (isKorean && displayPrice < 1000) {
                    displayPrice = displayPrice * 1000;
                } else if (!isKorean && displayPrice > 1000) {
                    displayPrice = displayPrice / 1000;
                }

                // product_id로 slug 조회
                let productLink = null;
                if (item.product_id) {
                    try {
                        const product = await pb.collection('products').getOne(item.product_id);
                        if (product.slug) {
                            productLink = `/ko/products/${product.slug}/`;
                        }
                    } catch (e) {
                        console.warn('Failed to fetch product slug for:', item.product_id);
                    }
                }

                processedItems.push({
                    ...item,
                    formattedPrice: this.formatCurrency(displayPrice * item.quantity),
                    isMinQuantity: item.quantity <= 1,
                    productLink: productLink
                });
            }
            return processedItems;
        } catch (e) {
            console.error('Error fetching items:', e);
            return [];
        }
    },

    async checkout() {
        console.log('checkout called');
        const items = await this.getItems();
        if (items.length === 0) {
            alert('Cart is empty');
            return;
        }

        // Redirect to checkout page with language support
        // Get the current base URL and language from the page
        const baseUrl = window.location.origin;
        // const currentPath = window.location.pathname; // Unused
        const lang = document.documentElement.lang || 'en';

        // Build the checkout URL with language prefix
        window.location.href = `${baseUrl}/${lang}/checkout/`;
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
document.addEventListener('DOMContentLoaded', function () {
    document.body.addEventListener('cart-updated', function () {
        console.log('cart-updated event received');
        Cart.renderCart();
    });
});
