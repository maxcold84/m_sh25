import PocketBase from 'pocketbase';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import { ensureDirectory, generateFrontmatter, config } from './utils.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const PB_URL = config.pbUrl;
const CONTENT_DIR = path.join(__dirname, '../content/korean/products');
const IMAGES_DIR = path.join(__dirname, '../assets/images/products');
const IMAGE_META_SUFFIX = '.meta.json';
const INVALID_FILENAME_CHARS = /[<>:"/\\|?*\u0000-\u001F]/g;
const WINDOWS_RESERVED_NAMES = new Set([
    'CON',
    'PRN',
    'AUX',
    'NUL',
    'COM1',
    'COM2',
    'COM3',
    'COM4',
    'COM5',
    'COM6',
    'COM7',
    'COM8',
    'COM9',
    'LPT1',
    'LPT2',
    'LPT3',
    'LPT4',
    'LPT5',
    'LPT6',
    'LPT7',
    'LPT8',
    'LPT9'
]);

const args = new Set(process.argv.slice(2));
const options = {
    force: args.has('--force'),
    dryRun: args.has('--dry-run')
};

const pb = new PocketBase(PB_URL);

function normalizeText(value) {
    if (typeof value === 'string') {
        return value.replace(/\r\n/g, '\n').trim();
    }

    if (value === undefined || value === null) {
        return '';
    }

    return String(value).trim();
}

function escapeHtmlEntities(value) {
    return value
        .replace(/&/g, '&amp;')
        .replace(/</g, '&lt;')
        .replace(/>/g, '&gt;')
        .replace(/"/g, '&quot;')
        .replace(/'/g, '&#39;');
}

function sanitizeFilenameSegment(value) {
    return normalizeText(value)
        .normalize('NFKC')
        .replace(INVALID_FILENAME_CHARS, '-')
        .replace(/\s+/g, '-')
        .replace(/-+/g, '-')
        .replace(/^\.+/, '')
        .replace(/\.+$/, '')
        .replace(/^-+/, '')
        .replace(/-+$/, '');
}

function normalizeSlug(product, usedSlugs) {
    const originalSlug = normalizeText(product.slug);
    let safeSlug = sanitizeFilenameSegment(originalSlug);

    if (!safeSlug) {
        console.warn(`[sync-products] Missing or invalid slug for ${product.id}; using id fallback.`);
        safeSlug = product.id;
    } else if (safeSlug !== originalSlug) {
        console.warn(`[sync-products] Sanitized slug "${originalSlug}" -> "${safeSlug}" for ${product.id}.`);
    }

    if (WINDOWS_RESERVED_NAMES.has(safeSlug.toUpperCase())) {
        safeSlug = `${safeSlug}-${product.id}`;
        console.warn(`[sync-products] Reserved filename slug detected; adjusted to "${safeSlug}".`);
    }

    const duplicateOwner = usedSlugs.get(safeSlug);
    if (duplicateOwner && duplicateOwner !== product.id) {
        safeSlug = `${safeSlug}-${product.id}`;
        console.warn(`[sync-products] Duplicate slug detected; adjusted to "${safeSlug}".`);
    }

    usedSlugs.set(safeSlug, product.id);
    return safeSlug;
}

function parseJsonArray(value) {
    if (Array.isArray(value)) {
        return value.filter(Boolean);
    }

    if (typeof value === 'string' && value.trim()) {
        try {
            const parsed = JSON.parse(value);
            return Array.isArray(parsed) ? parsed.filter(Boolean) : [];
        } catch (error) {
            console.warn('[sync-products] Failed to parse JSON array:', error.message);
        }
    }

    return [];
}

function readImageMeta(metaPath) {
    if (!fs.existsSync(metaPath)) {
        return null;
    }

    try {
        return JSON.parse(fs.readFileSync(metaPath, 'utf8'));
    } catch (error) {
        console.warn(`[sync-products] Failed to read image cache metadata ${path.basename(metaPath)}: ${error.message}`);
        return null;
    }
}

function writeImageMeta(metaPath, meta) {
    if (options.dryRun) {
        return;
    }

    fs.writeFileSync(metaPath, `${JSON.stringify(meta, null, 2)}\n`, 'utf8');
}

async function downloadImageWithCache(imageUrl, outputPath) {
    const metaPath = `${outputPath}${IMAGE_META_SUFFIX}`;
    const headers = {};

    if (!options.force) {
        const savedMeta = readImageMeta(metaPath);
        if (savedMeta?.etag) {
            headers['If-None-Match'] = savedMeta.etag;
        }
        if (savedMeta?.lastModified) {
            headers['If-Modified-Since'] = savedMeta.lastModified;
        } else if (fs.existsSync(outputPath)) {
            headers['If-Modified-Since'] = fs.statSync(outputPath).mtime.toUTCString();
        }
    }

    try {
        const response = await fetch(imageUrl, { headers });

        if (response.status === 304 && fs.existsSync(outputPath)) {
            return { success: true, skipped: true };
        }

        if (!response.ok) {
            console.warn(`[sync-products] Failed to download ${imageUrl} (status: ${response.status}).`);
            return { success: false, skipped: false };
        }

        const buffer = Buffer.from(await response.arrayBuffer());
        const meta = {
            etag: response.headers.get('etag') || '',
            lastModified: response.headers.get('last-modified') || new Date().toUTCString(),
            source: imageUrl
        };

        if (!options.dryRun) {
            fs.writeFileSync(outputPath, buffer);
        }
        writeImageMeta(metaPath, meta);

        return { success: true, skipped: false };
    } catch (error) {
        console.error(`[sync-products] Error downloading ${imageUrl}: ${error.message}`);
        return { success: false, skipped: false };
    }
}

function buildMarkdownContent(frontmatterData, descriptionBody) {
    const yaml = generateFrontmatter(frontmatterData);
    const body = descriptionBody ? `${descriptionBody}\n` : '';
    return `---\n${yaml}\n---\n\n${body}`;
}

async function syncProducts() {
    console.log('Starting product sync...');
    console.log(`Options: force=${options.force}, dryRun=${options.dryRun}`);

    try {
        const products = await pb.collection('products').getFullList({
            sort: '-created'
        });

        console.log(`Found ${products.length} products.`);

        ensureDirectory(CONTENT_DIR);
        ensureDirectory(IMAGES_DIR);

        const usedSlugs = new Map();
        let syncedCount = 0;
        let skippedCount = 0;
        let failedCount = 0;

        for (const product of products) {
            try {
                const slug = normalizeSlug(product, usedSlugs);
                const filename = `${slug}.md`;
                const filePath = path.join(CONTENT_DIR, filename);
                const images = Array.isArray(product.images) ? product.images : [];
                const localImagePaths = [];

                for (let index = 0; index < images.length; index += 1) {
                    const imgName = images[index];
                    if (!imgName) {
                        continue;
                    }

                    const safeImageName = sanitizeFilenameSegment(`${product.id}_${index}_${path.basename(imgName)}`) || `${product.id}_${index}`;
                    const imageUrl = `${PB_URL}/api/files/${product.collectionId}/${product.id}/${imgName}`;
                    const localImagePath = path.join(IMAGES_DIR, safeImageName);
                    const downloadResult = await downloadImageWithCache(imageUrl, localImagePath);

                    if (downloadResult.success) {
                        localImagePaths.push(safeImageName);
                        console.log(`  ${downloadResult.skipped ? 'Cached' : 'Downloaded'}: ${safeImageName}`);
                    } else {
                        localImagePaths.push(imageUrl);
                    }
                }

                const descriptionBody = normalizeText(product.description);
                const frontmatterDescription = escapeHtmlEntities(descriptionBody);
                const colors = parseJsonArray(product.colors);
                const sizes = parseJsonArray(product.sizes);
                const mainImage = localImagePaths[0] || '';
                const frontmatterData = {
                    title: normalizeText(product.title) || product.id,
                    slug,
                    date: product.created,
                    draft: !product.enabled,
                    price: product.price,
                    discount_price: product.discount_price,
                    description: frontmatterDescription,
                    images: localImagePaths,
                    mainImage,
                    colors,
                    sizes,
                    id: product.id,
                    layout: 'single'
                };
                const fileContent = buildMarkdownContent(frontmatterData, descriptionBody);

                if (fs.existsSync(filePath) && !options.force) {
                    const currentContent = fs.readFileSync(filePath, 'utf8');
                    if (currentContent === fileContent) {
                        skippedCount += 1;
                        console.log(`Skipped unchanged: ${filename}`);
                        continue;
                    }
                }

                if (!options.dryRun) {
                    fs.writeFileSync(filePath, fileContent, 'utf8');
                }

                syncedCount += 1;
                console.log(`${options.dryRun ? 'Dry run:' : 'Synced:'} ${filename}`);
            } catch (error) {
                failedCount += 1;
                console.error(`[sync-products] Failed to sync product ${product.id}:`, error);
            }
        }

        console.log(`Product sync completed. synced=${syncedCount}, skipped=${skippedCount}, failed=${failedCount}`);

        if (failedCount > 0) {
            process.exitCode = 1;
        }
    } catch (error) {
        console.error('Error syncing products:', error);
        process.exit(1);
    }
}

syncProducts();
