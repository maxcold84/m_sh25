import fs from 'fs';
import path from 'path';
import dotenv from 'dotenv';

dotenv.config();

export const config = {
    pbUrl: process.env.POCKETBASE_URL || 'http://127.0.0.1:8090'
};

/**
 * Ensures that the directory exists.
 * @param {string} dirPath - The path to the directory.
 */
export function ensureDirectory(dirPath) {
    if (!fs.existsSync(dirPath)) {
        fs.mkdirSync(dirPath, { recursive: true });
        console.log(`Created directory: ${dirPath}`);
    }
}

/**
 * Downloads a file from a URL to a local path.
 * @param {string} url - The URL to download from.
 * @param {string} outputPath - The local path to save the file.
 * @returns {Promise<boolean>} - Returns true if successful, false otherwise.
 */
export async function downloadFile(url, outputPath) {
    try {
        const response = await fetch(url);
        if (response.ok) {
            const buffer = await response.arrayBuffer();
            fs.writeFileSync(outputPath, Buffer.from(buffer));
            return true;
        } else {
            console.warn(`  Failed to download: ${url} (Status: ${response.status})`);
            return false;
        }
    } catch (error) {
        console.error(`  Error downloading ${url}:`, error.message);
        return false;
    }
}

/**
 * Generates a YAML frontmatter string from an object.
 * @param {Object} data - The data object.
 * @returns {string} - The YAML string.
 */
export function generateFrontmatter(data) {
    return Object.entries(data).map(([key, value]) => {
        if (value === undefined || value === null) return '';

        if (Array.isArray(value)) {
            if (value.length === 0) return `${key}: []`;
            // Check if items are primitive strings that need quoting
            const items = value.map(v => {
                if (typeof v === 'string') return `"${v.replace(/"/g, '\\"')}"`;
                return v;
            });
            // Use flow style for simple lists, block style for complex ones if needed.
            // Using block style for robustness:
            return `${key}:\n${items.map(v => `  - ${v}`).join('\n')}`;
        }

        if (typeof value === 'string') {
            // Handle multi-line strings
            if (value.includes('\n')) {
                return `${key}: |\n  ${value.replace(/\n/g, '\n  ')}`;
            }
            return `${key}: "${value.replace(/"/g, '\\"')}"`;
        }

        if (typeof value === 'boolean') {
            return `${key}: ${value}`;
        }

        return `${key}: ${value}`;
    }).filter(line => line).join('\n');
}
