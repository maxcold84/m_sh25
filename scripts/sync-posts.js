import PocketBase from 'pocketbase';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Configuration
const PB_URL = 'http://127.0.0.1:8090';
// Target directory for Posts (Leaf Bundles)
const CONTENT_DIR = path.join(__dirname, '../content/korean/posts');

const pb = new PocketBase(PB_URL);

async function syncPosts() {
    console.log('Starting blog post sync (Page Bundles)...');

    try {
        // Fetch all posts
        // Ensure schema has: title, slug, content, published, tags (json), categories (json), image
        const posts = await pb.collection('posts').getFullList({
            sort: '-created',
        });

        console.log(`Found ${posts.length} posts.`);

        // Ensure base content directory exists
        if (!fs.existsSync(CONTENT_DIR)) {
            fs.mkdirSync(CONTENT_DIR, { recursive: true });
        }

        // Cleanup: We might want to remove old folders to ensure sync state, 
        // but for now let's just overwrite/create.

        for (const post of posts) {
            const slug = post.slug || post.id;
            const postDir = path.join(CONTENT_DIR, slug);

            // Create Leaf Bundle Directory
            if (!fs.existsSync(postDir)) {
                fs.mkdirSync(postDir, { recursive: true });
            }

            const filePath = path.join(postDir, 'index.md');

            // Handle Image Download
            let imageFilename = '';
            if (post.image) {
                const imageUrl = `${PB_URL}/api/files/${post.collectionId}/${post.id}/${post.image}`;
                // Use original filename or fixed 'cover' name? 
                // Keeping original ensures no cache weirdness if changed, but 'cover' is standard.
                // Let's use original to be safe with sync logic.
                const localImageName = post.image;
                const localImagePath = path.join(postDir, localImageName);

                try {
                    const response = await fetch(imageUrl);
                    if (response.ok) {
                        const buffer = await response.arrayBuffer();
                        fs.writeFileSync(localImagePath, Buffer.from(buffer));
                        imageFilename = localImageName;
                        console.log(`  Downloaded image: ${localImageName} to ${slug}/`);
                    }
                } catch (err) {
                    console.error(`  Failed to download image for ${slug}:`, err.message);
                }
            }

            // Parse Tags/Categories
            let tags = [];
            try {
                tags = Array.isArray(post.tags) ? post.tags : JSON.parse(post.tags || '[]');
            } catch (e) { tags = []; }

            let categories = [];
            try {
                categories = Array.isArray(post.categories) ? post.categories : JSON.parse(post.categories || '[]');
            } catch (e) { categories = []; }

            // Construct Frontmatter
            const frontmatter = {
                title: post.title,
                date: post.created,
                draft: !post.published,
                slug: slug,
                image: imageFilename, // Just the filename, Hugo Resources will find it
                tags: tags,
                categories: categories
            };

            // Generate YAML
            const yaml = Object.entries(frontmatter)
                .map(([key, val]) => {
                    if (val === undefined || val === null || val === '') return null;
                    if (Array.isArray(val)) {
                        if (val.length === 0) return null;
                        return `${key}: [${val.map(v => `"${v}"`).join(', ')}]`;
                    }
                    if (typeof val === 'boolean') return `${key}: ${val}`;
                    return `${key}: "${val}"`;
                })
                .filter(v => v !== null)
                .join('\n');

            const fileContent = `---\n${yaml}\n---\n\n${post.content || ''}`;

            fs.writeFileSync(filePath, fileContent);
            console.log(`  Synced: ${slug}/index.md`);
        }

        console.log('Blog post sync completed.');

    } catch (error) {
        console.error('Error syncing posts:', error);
        if (error.status === 404) {
            console.error('  "posts" collection not found in PocketBase. Please create it.');
        }
    }
}

syncPosts();
