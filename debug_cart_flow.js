// const fetch = require('node-fetch'); // Native fetch in Node 18+

const PB_URL = 'http://127.0.0.1:8090';

async function run() {
    try {
        console.log('--- Starting Debug Flow ---');

        // 1. Create Guest Cart
        console.log('1. Creating Guest Cart...');
        const guestCartRes = await fetch(`${PB_URL}/api/collections/carts/records`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                session_id: `guest_${Date.now()}`
            })
        });
        const guestCart = await guestCartRes.json();
        if (!guestCartRes.ok) throw new Error(`Failed to create guest cart: ${JSON.stringify(guestCart)}`);
        console.log(`   Guest Cart ID: ${guestCart.id}`);

        // 2. Create User
        const id = Math.floor(Math.random() * 10000);
        const email = `debug_user_${id}@example.com`;
        const password = 'password123';
        console.log(`2. Creating User: ${email}`);
        const userRes = await fetch(`${PB_URL}/api/collections/users/records`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                username: `user_${id}`,
                email: email,
                emailVisibility: true,
                password: password,
                passwordConfirm: password,
                name: 'Debug User'
            })
        });
        const user = await userRes.json();
        if (!userRes.ok) throw new Error(`Failed to create user: ${JSON.stringify(user)}`);
        console.log(`   User ID: ${user.id}`);

        // 3. Simulate "Login" and Assign Cart
        console.log('3. Assigning Guest Cart to User...');
        const updateRes = await fetch(`${PB_URL}/api/collections/carts/records/${guestCart.id}`, {
            method: 'PATCH',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                user: user.id
            })
        });
        const updatedCart = await updateRes.json();
        if (!updateRes.ok) throw new Error(`Failed to update cart: ${JSON.stringify(updatedCart)}`);
        console.log(`   Cart updated. User field: ${updatedCart.user}`);

        if (updatedCart.user !== user.id) {
            throw new Error('User field mismatch!');
        }

        // 4. Simulate "Login Again" (Find cart by user)
        console.log('4. Searching for User Cart...');
        const searchRes = await fetch(`${PB_URL}/api/collections/carts/records?filter=(user='${user.id}')`, {
            method: 'GET',
            headers: { 'Content-Type': 'application/json' }
        });
        const searchData = await searchRes.json();
        if (!searchRes.ok) throw new Error(`Failed to search carts: ${JSON.stringify(searchData)}`);

        console.log(`   Found ${searchData.items.length} carts.`);
        if (searchData.items.length > 0) {
            console.log(`   Found Cart ID: ${searchData.items[0].id}`);
            if (searchData.items[0].id === guestCart.id) {
                console.log('SUCCESS: Flow verified!');
            } else {
                console.error('FAILURE: Found wrong cart?');
            }
        } else {
            console.error('FAILURE: Could not find cart by user filter.');
        }

    } catch (e) {
        console.error('ERROR:', e.message);
    }
}

run();
