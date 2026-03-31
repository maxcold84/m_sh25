/**
 * Cart Module (ES6)
 * 장바구니 상태 관리 및 기능
 * @module cart
 */
import { pb } from './core/pb-client.js';
import { formatCurrency as formatCurrencyUtil, showToast } from './core/utils.js';

function isKoreanPage() {
    return document.documentElement.lang === 'ko' || window.location.pathname.includes('/korean/');
}

function escapeFilterValue(value) {
    return String(value)
        .replace(/\\/g, '\\\\')
        .replace(/"/g, '\\"');
}

function sortObjectDeep(value) {
    if (Array.isArray(value)) {
        return value.map(sortObjectDeep);
    }

    if (value && typeof value === 'object') {
        return Object.keys(value)
            .sort()
            .reduce((acc, key) => {
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

    if (typeof options === 'string') {
        try {
            return normalizeOptions(JSON.parse(options));
        } catch (error) {
            console.warn('Failed to parse cart item options:', error);
            return {};
        }
    }

    if (typeof options !== 'object') {
        return {};
    }

    return options;
}

function splitOptions(options) {
    const normalized = normalizeOptions(options);
    const variantOptions = {};
    const metaOptions = {};

    Object.entries(normalized).forEach(([key, value]) => {
        if (value === undefined || value === null || value === '') {
            return;
        }

        if (key.startsWith('__')) {
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
    return `${productId || ''}::${JSON.stringify(sortObjectDeep(options || {}))}`;
}

function buildStoredOptions(options, meta = {}) {
    const variantOptions = sortObjectDeep(options || {});
    const metaOptions = sortObjectDeep(meta || {});

    return {
        ...variantOptions,
        ...metaOptions,
        __variantKey: buildVariantKey(metaOptions.__productId || '', variantOptions)
    };
}

function formatOptionSummary(options) {
    const { variantOptions } = splitOptions(options);
    const labels = isKoreanPage()
        ? { color: '색상', size: '사이즈' }
        : { color: 'Color', size: 'Size' };

    return Object.entries(variantOptions)
        .map(([key, value]) => `${labels[key] || key}: ${Array.isArray(value) ? value.join(', ') : value}`)
        .join(' / ');
}

function buildProductUrl(product, itemOptions) {
    const metaUrl = itemOptions.__productUrl;
    if (metaUrl) {
        return metaUrl;
    }

    const lang = document.documentElement.lang === 'ko' ? 'ko' : 'en';
    const slug = product?.slug || itemOptions.__productSlug || '';

    return slug ? `/${lang}/products/${slug}/` : null;
}

async function fetchProductsByIds(productIds) {
    const uniqueIds = [...new Set(productIds.filter(Boolean))];
    if (uniqueIds.length === 0) {
        return new Map();
    }

    try {
        const filter = uniqueIds
            .map(id => `id="${escapeFilterValue(id)}"`)
            .join(' || ');

        const products = await pb.collection('products').getFullList({
            filter
        });

        return new Map(products.map(product => [product.id, product]));
    } catch (error) {
        console.warn('Batch product lookup failed, falling back to per-item fetch:', error);

        const entries = await Promise.allSettled(
            uniqueIds.map(async id => {
                const product = await pb.collection('products').getOne(id);
                return [id, product];
            })
        );

        return new Map(
            entries
                .filter(entry => entry.status === 'fulfilled')
                .map(entry => entry.value)
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
        console.warn('Failed to parse cart button payload:', error);
        return {};
    }
}

function buildCartItemFromButton(button) {
    if (!button) {
        return null;
    }

    const price = Number(button.dataset.cartPrice);
    const id = button.dataset.cartId || '';
    const name = button.dataset.cartName || '';

    if (!id || !name || !Number.isFinite(price)) {
        return null;
    }

    return {
        id,
        name,
        price,
        image: button.dataset.cartImage || '',
        options: parseJsonDataAttribute(button.dataset.cartOptions)
    };
}

// ============================================
// Core / Manager
// ============================================
export const Cart = {
    config: null,
    realtimeCartId: null,
    realtimeCleanup: null,

    async init(config) {
        console.log('Cart initialized with config:', config);
        this.config = config;

        if (pb.authStore.isValid) {
            await this.getOrCreateCart();
        }

        await this.renderCart();

        pb.authStore.onChange(async () => {
            console.log('Auth state changed in Cart, syncing...');

            if (pb.authStore.isValid) {
                await this.getOrCreateCart();
            } else {
                localStorage.removeItem('cart_id');
                await this.disposeRealtimeSubscription();
            }

            await this.renderCart();
        });
    },

    notify(message, isError = false) {
        showToast(message, { isError, duration: isError ? 4000 : 2500 });
    },

    async rememberCart(cart) {
        if (!cart?.id) {
            return cart;
        }

        localStorage.setItem('cart_id', cart.id);
        await this.syncRealtimeSubscription(cart.id);
        return cart;
    },

    async disposeRealtimeSubscription() {
        if (typeof this.realtimeCleanup === 'function') {
            try {
                await this.realtimeCleanup();
            } catch (error) {
                console.warn('Failed to dispose cart realtime subscription:', error);
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
            this.realtimeCleanup = await pb.collection('cart_items').subscribe('*', (event) => {
                if (!event?.record) {
                    return;
                }

                if (event.record.cart === cartId) {
                    this.renderCart();
                }
            });
            this.realtimeCartId = cartId;
        } catch (error) {
            console.warn('Cart realtime subscription unavailable:', error);
        }
    },

    async getOrCreateCart() {
        if (pb.authStore.isValid) {
            const userId = pb.authStore.model.id;
            console.log('User logged in:', userId);

            try {
                const carts = await pb.collection('carts').getList(1, 1, {
                    filter: `user="${escapeFilterValue(userId)}"`,
                    sort: '-created'
                });

                if (carts.items.length > 0) {
                    const userCart = carts.items[0];
                    const localCartId = localStorage.getItem('cart_id');

                    if (localCartId && localCartId !== userCart.id) {
                        console.log('Merging local cart into user cart...');
                        await this.mergeCarts(localCartId, userCart.id);
                        localStorage.removeItem('cart_id');
                    }

                    return this.rememberCart(userCart);
                }

                const localCartId = localStorage.getItem('cart_id');
                if (localCartId) {
                    try {
                        const updatedCart = await pb.collection('carts').update(localCartId, {
                            user: userId
                        });
                        return this.rememberCart(updatedCart);
                    } catch (error) {
                        console.error('Failed to assign guest cart to user, creating a new cart:', error);

                        const newCart = await pb.collection('carts').create({
                            session_id: crypto.randomUUID(),
                            user: userId
                        });

                        await this.mergeCarts(localCartId, newCart.id);
                        return this.rememberCart(newCart);
                    }
                }

                const newCart = await pb.collection('carts').create({
                    session_id: crypto.randomUUID(),
                    user: userId
                });
                return this.rememberCart(newCart);
            } catch (error) {
                console.error('Error handling user cart:', error);
            }
        }

        const cartId = localStorage.getItem('cart_id');
        if (cartId) {
            try {
                const cart = await pb.collection('carts').getOne(cartId);
                if (cart.user) {
                    localStorage.removeItem('cart_id');
                    await this.disposeRealtimeSubscription();
                } else {
                    return this.rememberCart(cart);
                }
            } catch (error) {
                console.error('Error fetching cart:', error);
                localStorage.removeItem('cart_id');
                await this.disposeRealtimeSubscription();
            }
        }

        const cart = await pb.collection('carts').create({
            session_id: crypto.randomUUID(),
            user: ''
        });

        return this.rememberCart(cart);
    },

    async mergeCarts(fromCartId, toCartId) {
        try {
            const [sourceItems, targetItems] = await Promise.all([
                pb.collection('cart_items').getFullList({
                    filter: `cart="${escapeFilterValue(fromCartId)}"`
                }),
                pb.collection('cart_items').getFullList({
                    filter: `cart="${escapeFilterValue(toCartId)}"`
                })
            ]);

            const targetMap = new Map();
            targetItems.forEach(item => {
                const { variantOptions } = splitOptions(item.options);
                targetMap.set(buildVariantKey(item.product_id, variantOptions), item);
            });

            for (const item of sourceItems) {
                const { variantOptions, metaOptions } = splitOptions(item.options);
                const variantKey = buildVariantKey(item.product_id, variantOptions);
                const existingItem = targetMap.get(variantKey);

                if (existingItem) {
                    await pb.collection('cart_items').update(existingItem.id, {
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
                    await pb.collection('cart_items').delete(item.id);
                    continue;
                }

                await pb.collection('cart_items').update(item.id, {
                    cart: toCartId,
                    options: buildStoredOptions(variantOptions, {
                        ...metaOptions,
                        __productId: item.product_id
                    })
                });
            }
        } catch (error) {
            console.error('Error merging carts:', error);
        }
    },

    async addItem(product) {
        console.log('addItem called with:', product);

        try {
            const cart = await this.getOrCreateCart();
            const quantityToAdd = Math.max(1, Number(product.quantity) || 1);
            const { variantOptions, metaOptions } = splitOptions(product.options);
            const storedOptions = buildStoredOptions(variantOptions, {
                ...metaOptions,
                __productId: product.id,
                __productSlug: product.slug || metaOptions.__productSlug || '',
                __productUrl: product.url || metaOptions.__productUrl || ''
            });
            const variantKey = buildVariantKey(product.id, variantOptions);
            const existingItems = await pb.collection('cart_items').getFullList({
                filter: `cart="${escapeFilterValue(cart.id)}" && product_id="${escapeFilterValue(product.id)}"`
            });

            const existingItem = existingItems.find(item => {
                const itemVariantKey = buildVariantKey(item.product_id, splitOptions(item.options).variantOptions);
                return itemVariantKey === variantKey;
            });

            if (existingItem) {
                await pb.collection('cart_items').update(existingItem.id, {
                    quantity: existingItem.quantity + quantityToAdd,
                    price: product.price,
                    image: product.image,
                    name: product.name,
                    options: storedOptions
                });
            } else {
                await pb.collection('cart_items').create({
                    cart: cart.id,
                    product_id: product.id,
                    name: product.name,
                    price: product.price,
                    image: product.image,
                    quantity: quantityToAdd,
                    options: storedOptions
                });
            }

            this.notify(isKoreanPage() ? `${product.name} 상품을 장바구니에 담았습니다.` : `${product.name} added to cart.`);
            await this.renderCart();
            this.toggleDrawer(true);
        } catch (error) {
            console.error('Error in addItem:', error);
            this.notify(
                isKoreanPage()
                    ? `장바구니 추가에 실패했습니다. ${error.message || ''}`.trim()
                    : `Failed to add item to cart. ${error.message || ''}`.trim(),
                true
            );
        }
    },

    async changeQuantity(itemId, delta) {
        try {
            const item = await pb.collection('cart_items').getOne(itemId);
            const newQuantity = item.quantity + delta;

            if (newQuantity <= 0) {
                await this.removeItem(itemId);
            } else {
                await this.updateQuantity(itemId, newQuantity);
            }
        } catch (error) {
            console.error('Error changing quantity:', error);
            this.notify(isKoreanPage() ? '수량 변경에 실패했습니다.' : 'Failed to change quantity.', true);
        }
    },

    async updateQuantity(itemId, newQuantity) {
        try {
            const updatedItem = await pb.collection('cart_items').update(itemId, {
                quantity: newQuantity
            });

            this.updateItemUI(updatedItem);
            await this.updateCartTotals();
        } catch (error) {
            console.error('Error updating quantity:', error);
            this.notify(isKoreanPage() ? '수량 업데이트에 실패했습니다.' : 'Failed to update quantity.', true);
        }
    },

    updateItemUI(item) {
        const itemEl = document.querySelector(`.cart-item[data-item-id="${item.id}"]`);
        if (!itemEl) {
            return;
        }

        const qtyEl = itemEl.querySelector('.quantity-value');
        if (qtyEl) {
            qtyEl.textContent = item.quantity;
        }

        const priceEl = itemEl.querySelector('.item-price');
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
        const total = items.reduce((sum, item) => sum + (item.price * item.quantity), 0);
        const formattedTotal = this.formatCurrency(total);

        const countElement = document.getElementById('cart-item-count');
        if (countElement) {
            const count = items.reduce((sum, item) => sum + item.quantity, 0);
            countElement.textContent = count;
            countElement.style.display = count > 0 ? 'flex' : 'none';
        }

        const subtotalEl = document.getElementById('cart-subtotal');
        const totalEl = document.getElementById('cart-total');
        const footerEl = document.getElementById('cart-footer');

        if (subtotalEl) {
            subtotalEl.textContent = formattedTotal;
        }
        if (totalEl) {
            totalEl.textContent = formattedTotal;
        }
        if (footerEl) {
            footerEl.style.display = items.length > 0 ? 'block' : 'none';
        }
    },

    formatCurrency(amount) {
        return formatCurrencyUtil(amount);
    },

    async removeItem(itemId) {
        try {
            await pb.collection('cart_items').delete(itemId);
            await this.renderCart();
        } catch (error) {
            console.error('Error removing item:', error);
            this.notify(isKoreanPage() ? '상품 삭제에 실패했습니다.' : 'Failed to remove item.', true);
        }
    },

    async getItems() {
        const cartId = localStorage.getItem('cart_id');
        if (!cartId) {
            return [];
        }

        try {
            const records = await pb.collection('cart_items').getFullList({
                filter: `cart="${escapeFilterValue(cartId)}"`,
                sort: '-created'
            });
            const productMap = await fetchProductsByIds(records.map(item => item.product_id));

            return records.map(item => {
                const options = normalizeOptions(item.options);
                const displayOptions = splitOptions(options).variantOptions;
                const product = productMap.get(item.product_id);
                let displayPrice = item.price;

                if (isKoreanPage() && displayPrice < 1000) {
                    displayPrice *= 1000;
                } else if (!isKoreanPage() && displayPrice > 1000) {
                    displayPrice /= 1000;
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
            console.error('Error fetching items:', error);
            return [];
        }
    },

    async checkout() {
        const items = await this.getItems();
        if (items.length === 0) {
            this.notify(isKoreanPage() ? '장바구니가 비어 있습니다.' : 'Cart is empty.', true);
            return;
        }

        const baseUrl = window.location.origin;
        const lang = document.documentElement.lang || 'en';
        window.location.href = `${baseUrl}/${lang}/checkout/`;
        this.toggleDrawer(false);
    },

    async renderCart() {
        const items = await this.getItems();
        const total = items.reduce((sum, item) => {
            let price = item.price;
            if (isKoreanPage() && price < 1000) {
                price *= 1000;
            } else if (!isKoreanPage() && price > 1000) {
                price /= 1000;
            }
            return sum + (price * item.quantity);
        }, 0);

        const formattedTotal = this.formatCurrency(total);

        const countElement = document.getElementById('cart-item-count');
        if (countElement) {
            const count = items.reduce((sum, item) => sum + item.quantity, 0);
            countElement.textContent = count;
            countElement.style.display = count > 0 ? 'flex' : 'none';
        }

        const subtotalEl = document.getElementById('cart-subtotal');
        const totalEl = document.getElementById('cart-total');
        const footerEl = document.getElementById('cart-footer');

        if (subtotalEl) {
            subtotalEl.textContent = formattedTotal;
        }
        if (totalEl) {
            totalEl.textContent = formattedTotal;
        }
        if (footerEl) {
            footerEl.style.display = items.length > 0 ? 'block' : 'none';
        }

        const templateElement = document.getElementById('cart-template');
        if (!templateElement) {
            console.error('Cart template not found!');
            return;
        }

        try {
            const rendered = Mustache.render(templateElement.innerHTML, {
                items,
                total: formattedTotal,
                hasItems: items.length > 0
            }, null, ['[[', ']]']);

            const container = document.getElementById('cart-items-container');
            if (container) {
                container.innerHTML = rendered;
            }
        } catch (error) {
            console.error('Error rendering cart:', error);

            const container = document.getElementById('cart-items-container');
            if (container) {
                container.innerHTML = `
                    <div class="cart-error" style="padding: 20px; text-align: center; color: #e53e3e;">
                        <p style="margin-bottom: 10px;">장바구니를 불러오는 중 오류가 발생했습니다.</p>
                        <p class="error-detail" style="font-size: 0.8em; color: #718096; margin-bottom: 15px;">${error.message}</p>
                        <button type="button" data-cart-action="retry" class="retry-btn" style="padding: 8px 16px; background: #4a5568; color: white; border: none; border-radius: 4px; cursor: pointer;">다시 시도</button>
                    </div>
                `;
            }
        }
    },

    toggleDrawer(forceOpen) {
        const drawer = document.getElementById('cart-drawer');
        const overlay = document.getElementById('cart-overlay');

        if (!drawer || !overlay) {
            return;
        }

        if (typeof forceOpen === 'boolean') {
            drawer.classList.toggle('open', forceOpen);
            overlay.classList.toggle('open', forceOpen);
        } else {
            drawer.classList.toggle('open');
            overlay.classList.toggle('open');
        }

        if (drawer.classList.contains('open')) {
            this.renderCart();
        }
    }
};

// ============================================
// Compatibility / UI hooks
// ============================================
if (typeof window !== 'undefined') {
    window.Cart = Cart;
}

let cartEventsBound = false;

function setupCartEvents() {
    if (cartEventsBound) {
        return;
    }

    cartEventsBound = true;

    document.addEventListener('click', function (event) {
        const actionEl = event.target.closest('[data-cart-action]');
        if (!actionEl) {
            return;
        }

        const action = actionEl.dataset.cartAction;

        switch (action) {
            case 'toggle':
                event.preventDefault();
                Cart.toggleDrawer();
                break;
            case 'add-item': {
                event.preventDefault();
                const payload = buildCartItemFromButton(actionEl);

                if (payload) {
                    Cart.addItem(payload);
                } else {
                    console.warn('Cart add-item button is missing required data attributes.');
                }
                break;
            }
            case 'checkout':
                event.preventDefault();
                Cart.checkout();
                break;
            case 'change-quantity': {
                event.preventDefault();
                const itemId = actionEl.dataset.cartItemId;
                const delta = Number(actionEl.dataset.cartDelta);

                if (itemId && Number.isFinite(delta)) {
                    Cart.changeQuantity(itemId, delta);
                }
                break;
            }
            case 'remove-item':
                event.preventDefault();
                if (actionEl.dataset.cartItemId) {
                    Cart.removeItem(actionEl.dataset.cartItemId);
                }
                break;
            case 'retry':
                event.preventDefault();
                Cart.renderCart();
                break;
            default:
                break;
        }
    });

    document.addEventListener('change', function (event) {
        const actionEl = event.target.closest('[data-nav-action]');
        if (!actionEl) {
            return;
        }

        if (actionEl.dataset.navAction === 'language-select') {
            const nextUrl = actionEl.value;
            if (nextUrl) {
                window.location.href = nextUrl;
            }
        }
    });

    document.body.addEventListener('cart-updated', function () {
        Cart.renderCart();
    });
}

if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', setupCartEvents);
} else {
    setupCartEvents();
}

export default Cart;
