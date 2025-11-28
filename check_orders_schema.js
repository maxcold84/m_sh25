// const fetch = require('node-fetch');

const PB_URL = 'http://127.0.0.1:8090';

async function run() {
    try {
        console.log('--- Checking Orders Schema ---');

        // We can't easily get the schema definition without admin, 
        // but we can try to create a record with 'user' and see if it sticks, 
        // or check the collection info if public (unlikely).
        // A better way is to try to list the collections if we had admin.

        // Since we don't have admin, we'll rely on the previous failure.
        // But let's try to fetch the collection definition if possible (usually requires admin).

        // Alternative: Try to update the collection schema via API? No, needs admin.

        // Let's just try to create a record and inspect the response closely.
        // If 'user' is stripped, the field likely doesn't exist.

        const paymentId = `check_${Date.now()}`;
        const res = await fetch(`${PB_URL}/api/collections/orders/records`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                payment_id: paymentId,
                total_amount: 100,
                status: 'pending',
                items: [],
                user: 'test_user_id' // Garbage ID, but should error if field exists and is relation
            })
        });

        const data = await res.json();
        console.log('Response:', JSON.stringify(data, null, 2));

        if (data.user) {
            console.log('User field exists (returned in response).');
        } else {
            console.log('User field MISSING in response.');
        }

    } catch (e) {
        console.error('ERROR:', e.message);
    }
}

run();
