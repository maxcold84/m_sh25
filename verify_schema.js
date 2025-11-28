// const fetch = require('node-fetch'); // Native fetch in Node 18+

const PB_URL = 'http://127.0.0.1:8090';

async function run() {
    try {
        // 1. Create a random user
        const id = Math.floor(Math.random() * 10000);
        const email = `test_cart_${id}@example.com`;
        const password = 'password123';

        console.log(`1. Creating user: ${email}`);
        const userRes = await fetch(`${PB_URL}/api/collections/users/records`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                username: `user_${id}`,
                email: email,
                emailVisibility: true,
                password: password,
                passwordConfirm: password,
                name: 'Test User'
            })
        });

        const userData = await userRes.json();
        if (!userRes.ok) throw new Error(`Failed to create user: ${JSON.stringify(userData)}`);
        const userId = userData.id;
        console.log(`   User created: ${userId}`);

        // 2. Authenticate (to get token, though we might not strictly need it if rules allow public create, but let's be safe)
        // Actually, we can just try to create a cart. Carts are usually public create.
        // But we want to set the 'user' field.

        console.log('2. Creating cart with user field...');
        const cartRes = await fetch(`${PB_URL}/api/collections/carts/records`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                session_id: `sess_${id}`,
                user: userId
            })
        });

        const cartData = await cartRes.json();
        if (!cartRes.ok) throw new Error(`Failed to create cart: ${JSON.stringify(cartData)}`);

        console.log(`   Cart created: ${cartData.id}`);
        console.log(`   Cart Data:`, cartData);

        // 3. Verify 'user' field
        if (cartData.user === userId) {
            console.log('SUCCESS: Cart has correct user field!');
        } else {
            console.error('FAILURE: Cart created but user field is missing or incorrect.');
            console.error('Expected:', userId);
            console.error('Actual:', cartData.user);
            console.log('This implies the PocketBase schema does NOT have the "user" field yet.');
        }

    } catch (e) {
        console.error('Error:', e.message);
    }
}

run();
