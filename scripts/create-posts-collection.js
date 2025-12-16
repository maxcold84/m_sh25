import PocketBase from 'pocketbase';
import dotenv from 'dotenv';
import path from 'path';
import { fileURLToPath } from 'url';

// Load environment variables
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
dotenv.config({ path: path.join(__dirname, '../.env') });

const PB_URL = process.env.PB_URL || 'http://127.0.0.1:8090';
const PB_ADMIN_EMAIL = process.env.PB_ADMIN_EMAIL;
const PB_ADMIN_PASSWORD = process.env.PB_ADMIN_PASSWORD;

if (!PB_ADMIN_EMAIL || !PB_ADMIN_PASSWORD) {
    console.error('Error: PB_ADMIN_EMAIL and PB_ADMIN_PASSWORD must be set in .env file');
    process.exit(1);
}

const pb = new PocketBase(PB_URL);

async function createPostsCollection() {
    try {
        console.log(`Authenticating as ${PB_ADMIN_EMAIL}...`);
        await pb.admins.authWithPassword(PB_ADMIN_EMAIL, PB_ADMIN_PASSWORD);
        console.log('Authentication successful.');

        const collectionData = {
            name: 'posts',
            type: 'base',
            schema: [
                {
                    name: 'title',
                    type: 'text',
                    required: true,
                    unique: false,
                    options: { min: 1, max: 255 }
                },
                {
                    name: 'slug',
                    type: 'text',
                    required: true,
                    unique: true,
                    options: { min: 1, max: 255, pattern: '' }
                },
                {
                    name: 'content',
                    type: 'editor', // Rich text editor
                    required: false,
                    unique: false,
                    options: { convertUrls: false }
                },
                {
                    name: 'published',
                    type: 'bool',
                    required: false,
                    unique: false,
                    options: {}
                },
                {
                    name: 'tags',
                    type: 'json', // Using JSON for array of strings
                    required: false,
                    unique: false,
                    options: { maxSize: 2000000 }
                },
                {
                    name: 'categories',
                    type: 'json', // Using JSON for array of strings
                    required: false,
                    unique: false,
                    options: { maxSize: 2000000 }
                },
                {
                    name: 'image',
                    type: 'file',
                    required: false,
                    unique: false,
                    options: {
                        maxSelect: 1,
                        maxSize: 5242880, // 5MB
                        mimeTypes: ['image/jpeg', 'image/png', 'image/webp', 'image/gif'],
                        thumbs: ['100x100']
                    }
                }
            ],
            listRule: "", // Public read
            viewRule: "", // Public read
            createRule: null, // Admin only (by default if null, though null usually means "nobody" or "admin only"? Empty string is public. Null is admin only.)
            updateRule: null,
            deleteRule: null,
            // Actually, for admin-dashboard management via API client (JS SDK is client-side usually, but here we are using it server-side for sync). 
            // Wait, the Admin UI (posts.html) uses JS SDK client-side. 
            // If it uses Admin Auth (admin-auth.js handles admin token?), it can bypass rules.
            // If strictly admin only, rules should be null (Admin only).
            // But if we want to read it for Sync (server-side script), that script needs admin access OR public read.
            // Sync script doesn't seem to have admin login, so it needs Public Read.
            // The existing `sync-products.js` has no auth, so products must be public read.
            // So `posts` should also be public read (list/view).
            // Create/Update/Delete should be Admin only (null).
        };

        try {
            const collection = await pb.collections.create(collectionData);
            console.log('Collection "posts" created successfully.');
        } catch (err) {
            if (err.status === 400 && err.response?.data?.name?.code === 'validation_is_unique') {
                console.log('Collection "posts" already exists.');
                // Optional: Update capabilities if needed
            } else {
                throw err;
            }
        }

    } catch (error) {
        console.error('Error creating collection:', error);
        process.exit(1);
    }
}

createPostsCollection();
