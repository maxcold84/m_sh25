import fs from 'fs';
import path from 'path';

const root = process.cwd();

const textChecks = [
    {
        label: 'localhost dev URL',
        pattern: /localhost:1313/g
    },
    {
        label: 'livereload script',
        pattern: /livereload\.js/g
    }
];

const binaryExtensions = new Set([
    '.png',
    '.jpg',
    '.jpeg',
    '.gif',
    '.webp',
    '.woff',
    '.woff2',
    '.eot',
    '.ttf',
    '.svg',
    '.ico',
    '.pdf'
]);

const trackedPathChecks = [
    {
        label: 'database snapshot',
        test: (filePath) => /\.(db|db-shm|db-wal)$/i.test(filePath)
    }
];

const textScanDirectories = ['server'];
const pathScanDirectories = ['server', 'backup'];
const findings = [];

function shouldSkipTextScan(filePath) {
    return binaryExtensions.has(path.extname(filePath).toLowerCase());
}

function walk(dirPath, options = {}) {
    const { scanText = true, scanPaths = true } = options;

    if (!fs.existsSync(dirPath)) {
        return;
    }

    for (const entry of fs.readdirSync(dirPath, { withFileTypes: true })) {
        const fullPath = path.join(dirPath, entry.name);
        if (entry.isDirectory()) {
            walk(fullPath, options);
            continue;
        }

        const relativePath = path.relative(root, fullPath).replace(/\\/g, '/');

        if (scanPaths) {
            for (const pathCheck of trackedPathChecks) {
                if (pathCheck.test(relativePath)) {
                    findings.push(`${pathCheck.label}: ${relativePath}`);
                }
            }
        }

        if (!scanText || shouldSkipTextScan(relativePath)) {
            continue;
        }

        let content = '';
        try {
            content = fs.readFileSync(fullPath, 'utf8');
        } catch (error) {
            continue;
        }

        for (const textCheck of textChecks) {
            if (textCheck.pattern.test(content)) {
                findings.push(`${textCheck.label}: ${relativePath}`);
                textCheck.pattern.lastIndex = 0;
            }
        }
    }
}

for (const dir of pathScanDirectories) {
    walk(path.join(root, dir), { scanText: false, scanPaths: true });
}

for (const dir of textScanDirectories) {
    walk(path.join(root, dir), { scanText: true, scanPaths: false });
}

if (findings.length > 0) {
    console.error('Release safety check failed:');
    for (const finding of findings) {
        console.error(`- ${finding}`);
    }
    process.exit(1);
}

console.log('Release safety check passed.');
