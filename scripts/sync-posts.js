import PocketBase from 'pocketbase';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Configuration
const PB_URL = 'http://127.0.0.1:8090';
// Target directory for Posts (Single File mode)
const CONTENT_DIR = path.join(__dirname, '../content/korean/blog');
// Images directory
const IMAGES_DIR = path.join(__dirname, '../assets/images/blog');

const pb = new PocketBase(PB_URL);

async function syncPosts() {
    console.log('Starting blog post sync (Single File mode)...');

    try {
        // Fetch all posts
        // Ensure schema has: title, slug, content, published, tags (json), categories (json), image
        const posts = await pb.collection('posts').getFullList({
            sort: '-created',
        });

        console.log(`Found ${posts.length} posts.`);

        // Ensure content directory exists
        if (!fs.existsSync(CONTENT_DIR)) {
            fs.mkdirSync(CONTENT_DIR, { recursive: true });
        }

        // Ensure images directory exists
        if (!fs.existsSync(IMAGES_DIR)) {
            fs.mkdirSync(IMAGES_DIR, { recursive: true });
        }

        // Collect valid slugs from PocketBase
        const validSlugs = new Set(posts.map(p => p.slug || p.id));

        // Clean up: Delete files that no longer exist in PocketBase
        const existingFiles = fs.readdirSync(CONTENT_DIR);
        for (const file of existingFiles) {
            // Skip _index.md (section index) and non-md files
            if (file === '_index.md' || !file.endsWith('.md')) continue;

            const slug = file.replace('.md', '');
            if (!validSlugs.has(slug)) {
                // Delete the markdown file
                const filePath = path.join(CONTENT_DIR, file);
                fs.unlinkSync(filePath);
                console.log(`  Deleted: ${file} (no longer in database)`);

                // Also try to delete associated image
                const imageExtensions = ['.jpg', '.jpeg', '.png', '.gif', '.webp'];
                for (const ext of imageExtensions) {
                    const imagePath = path.join(IMAGES_DIR, `${slug}${ext}`);
                    if (fs.existsSync(imagePath)) {
                        fs.unlinkSync(imagePath);
                        console.log(`  Deleted image: ${slug}${ext}`);
                    }
                }
            }
        }

        for (const post of posts) {
            const slug = post.slug || post.id;

            // Single file mode: slug.md instead of slug/index.md
            const filePath = path.join(CONTENT_DIR, `${slug}.md`);

            // Handle Image Download
            let imagePath = '';
            if (post.image) {
                const imageUrl = `${PB_URL}/api/files/${post.collectionId}/${post.id}/${post.image}`;
                // Create unique filename with slug prefix to avoid conflicts
                const ext = path.extname(post.image);
                const localImageName = `${slug}${ext}`;
                const localImagePath = path.join(IMAGES_DIR, localImageName);

                try {
                    const response = await fetch(imageUrl);
                    if (response.ok) {
                        const buffer = await response.arrayBuffer();
                        fs.writeFileSync(localImagePath, Buffer.from(buffer));
                        // Store path relative to assets for Hugo
                        imagePath = `images/blog/${localImageName}`;
                        console.log(`  Downloaded image: ${localImageName}`);
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
                image: imagePath, // Path relative to assets directory
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
            console.log(`  Synced: ${slug}.md`);
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
