import PocketBase from 'pocketbase';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import { ensureDirectory, downloadFile, generateFrontmatter, config } from './utils.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Configuration
const PB_URL = config.pbUrl;
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
        ensureDirectory(CONTENT_DIR);

        // Ensure images directory exists (changed to assets)
        const IMAGES_DIR = path.join(__dirname, '../assets/images/products');
        ensureDirectory(IMAGES_DIR);

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

                const success = await downloadFile(imageUrl, localImagePath);
                if (success) {
                    // Store only filename for Hugo image processing
                    localImagePaths.push(localImageName);
                    console.log(`  Downloaded: ${localImageName}`);
                } else {
                    // Fallback to external URL if download failed
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

            const frontmatterData = {
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

            const yaml = generateFrontmatter(frontmatterData);
            const fileContent = `---\n${yaml}\n---\n\n${product.description || ''}\n`;

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
