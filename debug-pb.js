// debug-pb.js
// Using native fetch (Node 18+)

async function checkPocketBase() {
    const baseUrl = 'http://127.0.0.1:8090';
    console.log(`Checking PocketBase at ${baseUrl}...`);

    try {
        // Check Health
        const healthRes = await fetch(`${baseUrl}/api/health`);
        if (!healthRes.ok) throw new Error(`Health check failed: ${healthRes.status}`);
        const healthData = await healthRes.json();
        console.log('✅ PocketBase is running:', healthData);

        // Check Collections
        console.log('Checking "carts" collection access...');
        const cartsRes = await fetch(`${baseUrl}/api/collections/carts/records?perPage=1`);
        if (cartsRes.status === 404) {
            console.error('❌ Collection "carts" not found!');
        } else if (cartsRes.status === 403) {
            console.warn('⚠️ Collection "carts" exists but requires authentication (API Rules).');
        } else if (cartsRes.ok) {
            console.log('✅ Collection "carts" is accessible.');
        } else {
            console.log(`ℹ️ Collection "carts" response: ${cartsRes.status}`);
        }

        console.log('Checking "cart_items" collection access...');
        const itemsRes = await fetch(`${baseUrl}/api/collections/cart_items/records?perPage=1`);
        if (itemsRes.status === 404) {
            console.error('❌ Collection "cart_items" not found!');
        } else if (itemsRes.ok) {
            console.log('✅ Collection "cart_items" is accessible.');
        } else {
            console.log(`ℹ️ Collection "cart_items" response: ${itemsRes.status}`);
        }

    } catch (error) {
        console.error('❌ Connection failed:', error.message);
        console.error('   Make sure "pocketbase serve" is running.');
    }
}

checkPocketBase();
