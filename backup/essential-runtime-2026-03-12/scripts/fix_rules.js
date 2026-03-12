import PocketBase from 'pocketbase';

const pb = new PocketBase('http://127.0.0.1:8090');

async function fixRules() {
    const adminEmail = process.argv[2];
    const adminPass = process.argv[3];

    if (!adminEmail || !adminPass) {
        console.log('Usage: node scripts/fix_rules.js <admin_email> <admin_password>');
        console.log('Example: node scripts/fix_rules.js admin@example.com 1234567890');
        process.exit(1);
    }

    try {
        console.log('Authenticating as admin...');
        await pb.admins.authWithPassword(adminEmail, adminPass);

        console.log('Fetching collections...');
        const collections = await pb.collections.getFullList();

        // Fix Users Collection
        const usersCol = collections.find(c => c.name === 'users');
        if (usersCol) {
            console.log('Updating users collection rules...');
            usersCol.listRule = 'id = @request.auth.id';
            usersCol.viewRule = 'id = @request.auth.id';
            usersCol.updateRule = 'id = @request.auth.id';
            // deleteRule usually restricted to admin or self
            usersCol.deleteRule = 'id = @request.auth.id';

            await pb.collections.update(usersCol.id, usersCol);
            console.log('Users collection updated.');
        } else {
            console.warn('Users collection not found!');
        }

        // Fix Orders Collection
        const ordersCol = collections.find(c => c.name === 'orders');
        if (ordersCol) {
            console.log('Updating orders collection rules...');
            ordersCol.listRule = 'user = @request.auth.id';
            ordersCol.viewRule = 'user = @request.auth.id';
            ordersCol.createRule = '@request.auth.id != ""';
            ordersCol.updateRule = 'user = @request.auth.id'; // For cancellation

            await pb.collections.update(ordersCol.id, ordersCol);
            console.log('Orders collection updated.');
        } else {
            console.warn('Orders collection not found!');
        }

        console.log('All rules fixed successfully.');

    } catch (e) {
        console.error('Error fixing rules:', e.originalError || e.message);
    }
}

fixRules();
