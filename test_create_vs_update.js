// const fetch = require('node-fetch');

const PB_URL = 'http://127.0.0.1:8090';

async function run() {
    try {
        console.log('--- Testing Create vs Update ---');

        // Create User
        const id = Math.floor(Math.random() * 10000);
        const userRes = await fetch(`${PB_URL}/api/collections/users/records`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                username: `test_${id}`,
                email: `test_${id}@example.com`,
                password: 'password123',
                passwordConfirm: 'password123',
                name: 'Test User'
            })
        });
        const user = await userRes.json();
        const userId = user.id;
        console.log(`User created: ${userId}`);

        // Test 1: Create with User
        console.log('\nTest 1: Create Cart WITH User field');
        const cart1Res = await fetch(`${PB_URL}/api/collections/carts/records`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                session_id: `sess_1_${id}`,
                user: userId
            })
        });
        const cart1 = await cart1Res.json();
        console.log(`Cart 1 created. User field: ${cart1.user}`);

        if (cart1.user !== userId) {
            console.error('FAIL: User field NOT set during create.');
        } else {
            console.log('PASS: User field set during create.');
        }

        // Test 2: Create then Update
        console.log('\nTest 2: Create Cart WITHOUT User, then UPDATE');
        const cart2Res = await fetch(`${PB_URL}/api/collections/carts/records`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                session_id: `sess_2_${id}`
            })
        });
        const cart2 = await cart2Res.json();
        console.log(`Cart 2 created. ID: ${cart2.id}`);

        const updateRes = await fetch(`${PB_URL}/api/collections/carts/records/${cart2.id}`, {
            method: 'PATCH',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                user: userId
            })
        });
        const cart2Updated = await updateRes.json();
        console.log(`Cart 2 updated. User field: ${cart2Updated.user}`);

        if (cart2Updated.user !== userId) {
            console.error('FAIL: User field NOT set during update.');
        } else {
            console.log('PASS: User field set during update.');
        }

    } catch (e) {
        console.error('ERROR:', e.message);
    }
}

run();
