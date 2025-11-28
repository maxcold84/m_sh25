// const fetch = require('node-fetch');

const PB_URL = 'http://127.0.0.1:8090';

async function run() {
    try {
        console.log('--- Starting Order Verification Flow ---');

        // 1. Create User
        const id = Math.floor(Math.random() * 10000);
        const email = `order_user_${id}@example.com`;
        const password = 'password123';
        console.log(`1. Creating User: ${email}`);
        const userRes = await fetch(`${PB_URL}/api/collections/users/records`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                username: `order_user_${id}`,
                email: email,
                emailVisibility: true,
                password: password,
                passwordConfirm: password,
                name: 'Order User'
            })
        });
        const user = await userRes.json();
        if (!userRes.ok) throw new Error(`Failed to create user: ${JSON.stringify(user)}`);
        console.log(`   User ID: ${user.id}`);

        // 2. Create Order with User ID
        console.log('2. Creating Order linked to User...');
        const paymentId = `ord_${Date.now()}`;
        const orderRes = await fetch(`${PB_URL}/api/collections/orders/records`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                payment_id: paymentId,
                total_amount: 1000,
                status: 'paid',
                items: [{ product_id: 'test_prod', qty: 1, price: 1000 }],
                user: user.id
            })
        });
        const order = await orderRes.json();
        if (!orderRes.ok) throw new Error(`Failed to create order: ${JSON.stringify(order)}`);
        console.log(`   Order created. ID: ${order.id}`);
        console.log(`   Order User Field: ${order.user}`);

        // 3. Verify
        if (order.user === user.id) {
            console.log('SUCCESS: Order is correctly linked to the user!');
        } else {
            console.error('FAILURE: Order user field mismatch or missing.');
        }

    } catch (e) {
        console.error('ERROR:', e.message);
    }
}

run();
