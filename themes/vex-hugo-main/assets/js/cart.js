// Initialize PocketBase
const pb = new PocketBase('http://127.0.0.1:8090');

// Cart State Management
const Cart = {
    async getOrCreateCart() {
        let cartId = localStorage.getItem('cart_id');
        if (cartId) {
            try {
                return await pb.collection('carts').getOne(cartId);
            } catch (e) {
                console.log('Cart not found, creating new one');
                localStorage.removeItem('cart_id');
            }
        }

        const cart = await pb.collection('carts').create({
            session_id: crypto.randomUUID()
        });
        localStorage.setItem('cart_id', cart.id);
        return cart;
    },

    async addItem(product) {
        const cart = await this.getOrCreateCart();

        // Check if item exists
        const items = await pb.collection('cart_items').getList(1, 1, {
            filter: `cart="${cart.id}" && product_id="${product.id}"`
        });

        if (items.items.length > 0) {
            const item = items.items[0];
            await pb.collection('cart_items').update(item.id, {
                quantity: item.quantity + 1
            });
        } else {
            await pb.collection('cart_items').create({
                cart: cart.id,
                product_id: product.id,
                name: product.name,
                price: product.price,
                image: product.image,
                quantity: 1,
                options: product.options
            });
        }

        // Trigger render
        this.renderCart();
        // Open drawer
        this.toggleDrawer();
    },

    async removeItem(itemId) {
        await pb.collection('cart_items').delete(itemId);
        this.renderCart();
    },

    async getItems() {
        const cartId = localStorage.getItem('cart_id');
        if (!cartId) return [];
        const records = await pb.collection('cart_items').getFullList({
            filter: `cart="${cartId}"`,
            sort: '-created'
        });
        return records;
    },

    async checkout(storeId, channelKey) {
        const items = await this.getItems();
        if (items.length === 0) {
            alert('Cart is empty');
            return;
        }

        const totalAmount = items.reduce((sum, item) => sum + (item.price * item.quantity), 0);
        const paymentId = `order-${crypto.randomUUID()}`;

        const response = await Portone.requestPayment({
            storeId: storeId,
            channelKey: channelKey,
            paymentId: paymentId,
            orderName: items.map(i => i.name).join(', '),
            totalAmount: totalAmount,
            currency: "CURRENCY_KRW",
            payMethod: "CARD",
        });

        if (response.code != null) {
            // Error
            alert(`Payment failed: ${response.message}`);
            return;
        }

        // Success - Create Order in PocketBase
        await pb.collection('orders').create({
            payment_id: paymentId,
            total_amount: totalAmount,
            status: 'paid',
            items: items,
            buyer_details: response // Store full response if needed
        });

        // Clear Cart
        const cartId = localStorage.getItem('cart_id');
        // Delete all items
        for (const item of items) {
            await pb.collection('cart_items').delete(item.id);
        }

        alert('Payment successful!');
        this.renderCart();
        // Redirect or show success
    },

    async renderCart() {
        const items = await this.getItems();
        const total = items.reduce((sum, item) => sum + (item.price * item.quantity), 0);

        const template = document.getElementById('cart-template').innerHTML;
        const rendered = Mustache.render(template, {
            items: items,
            total: total,
            storeId: window.ShopConfig.storeId,
            channelKey: window.ShopConfig.channelKey
        }, null, ['[[', ']]']);

        document.getElementById('cart-items-container').innerHTML = rendered;
    },

    toggleDrawer() {
        const drawer = document.getElementById('cart-drawer');
        if (drawer.style.display === 'none') {
            drawer.style.display = 'block';
            this.renderCart();
        } else {
            drawer.style.display = 'none';
        }
    }
};

// Expose to window for HTMX or inline calls
window.Cart = Cart;

// Initial Render
document.addEventListener('DOMContentLoaded', () => {
    Cart.renderCart();
});

// Custom Event Listeners
document.body.addEventListener('cart-updated', function () {
    Cart.renderCart();
});
