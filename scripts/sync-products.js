import PocketBase from 'pocketbase';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Configuration
const PB_URL = 'http://127.0.0.1:8090';
const CONTENT_DIR = path.join(__dirname, '../content/korean/products');

const pb = new PocketBase(PB_URL);

async function syncProducts() {
    console.log('Starting product sync...');

    try {
        // Fetch all products
        const products = await pb.collection('products').getFullList({
            sort: '-created',
        });

        console.log(`Found ${products.length} products.`);

        // Ensure content directory exists
        if (!fs.existsSync(CONTENT_DIR)) {
            fs.mkdirSync(CONTENT_DIR, { recursive: true });
        }

        // Ensure images directory exists (changed to assets)
        const IMAGES_DIR = path.join(__dirname, '../assets/images/products');
        if (!fs.existsSync(IMAGES_DIR)) {
            fs.mkdirSync(IMAGES_DIR, { recursive: true });
        }

        for (const product of products) {
            const slug = product.slug || product.id;
            const filename = `${slug}.md`;
            const filePath = path.join(CONTENT_DIR, filename);

            // Prepare frontmatter data
            const images = product.images || [];

            // Download images and save locally
            const localImagePaths = [];
            for (let i = 0; i < images.length; i++) {
                const imgName = images[i];
                const imageUrl = `${PB_URL}/api/files/${product.collectionId}/${product.id}/${imgName}`;
                const localImageName = `${product.id}_${i}_${imgName}`;
                const localImagePath = path.join(IMAGES_DIR, localImageName);

                try {
                    // Download image
                    const response = await fetch(imageUrl);
                    if (response.ok) {
                        const buffer = await response.arrayBuffer();
                        fs.writeFileSync(localImagePath, Buffer.from(buffer));
                        // Store only filename for Hugo image processing
                        localImagePaths.push(localImageName);
                        console.log(`  Downloaded: ${localImageName}`);
                    } else {
                        console.warn(`  Failed to download image: ${imageUrl}`);
                        // Fallback to external URL
                        localImagePaths.push(imageUrl);
                    }
                } catch (error) {
                    console.error(`  Error downloading image ${imgName}:`, error.message);
                    // Fallback to external URL
                    localImagePaths.push(imageUrl);
                }
            }

            const mainImage = localImagePaths.length > 0 ? localImagePaths[0] : '';

            // Parse colors and sizes if they are strings
            let colors = product.colors;
            if (typeof colors === 'string') {
                try { colors = JSON.parse(colors); } catch (e) { colors = []; }
            }

            let sizes = product.sizes;
            if (typeof sizes === 'string') {
                try { sizes = JSON.parse(sizes); } catch (e) { sizes = []; }
            }

            const frontmatter = {
                title: product.title,
                date: product.created,
                draft: !product.enabled,
                price: product.price,
                discount_price: product.discount_price,
                description: product.description,
                images: localImagePaths,
                mainImage: mainImage,
                colors: colors,
                sizes: sizes,
                id: product.id,
                layout: 'single'
            };

            // Generate YAML frontmatter
            const fileContent = `---
${Object.entries(frontmatter).map(([key, value]) => {
                if (value === undefined || value === null) return '';
                if (Array.isArray(value)) {
                    if (value.length === 0) return `${key}: []`;
                    return `${key}:\n${value.map(v => `  - "${v.replace(/"/g, '\\"')}"`).join('\n')}`;
                }
                if (typeof value === 'string') {
                    // Handle multi-line strings
                    if (value.includes('\n')) {
                        return `${key}: |\n  ${value.replace(/\n/g, '\n  ')}`;
                    }
                    return `${key}: "${value.replace(/"/g, '\\"')}"`;
                }
                return `${key}: ${value}`;
            }).filter(line => line).join('\n')}
---

${product.description || ''}
`;

            fs.writeFileSync(filePath, fileContent);
            console.log(`Synced: ${filename}`);
        }

        console.log('Product sync completed successfully.');

    } catch (error) {
        console.error('Error syncing products:', error);
        process.exit(1);
    }
}

syncProducts();