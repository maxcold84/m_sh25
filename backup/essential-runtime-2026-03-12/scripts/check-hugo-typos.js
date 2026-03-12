import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const ROOT_DIR = path.resolve(__dirname, '..');
const LAYOUTS_DIR = path.join(ROOT_DIR, 'layouts');

// Detecting patterns like: if eq $v " login" or if ne $v "login "
const TYPO_PATTERNS = [
    {
        name: 'Leading space in comparison',
        regex: /((?:eq|ne)\s+\$\w+\s+"\s+[^"]+")/g,
        hint: 'Remove space after opening quote: " value" -> "value"'
    },
    {
        name: 'Trailing space in comparison',
        regex: /((?:eq|ne)\s+\$\w+\s+"[^"]+\s+")/g,
        hint: 'Remove space before closing quote: "value " -> "value"'
    }
];

function getFiles(dir, allFiles = []) {
    const files = fs.readdirSync(dir);
    for (const file of files) {
        const name = path.join(dir, file);
        if (fs.statSync(name).isDirectory()) {
            getFiles(name, allFiles);
        } else if (file.endsWith('.html')) {
            allFiles.push(name);
        }
    }
    return allFiles;
}

function checkFiles() {
    console.log('🔍 Scanning layouts for Hugo template typos...');
    const files = getFiles(LAYOUTS_DIR);
    let totalErrors = 0;

    files.forEach(file => {
        const content = fs.readFileSync(file, 'utf8');
        const relativePath = path.relative(ROOT_DIR, file);

        let fileHasError = false;

        TYPO_PATTERNS.forEach(pattern => {
            let match;
            while ((match = pattern.regex.exec(content)) !== null) {
                if (!fileHasError) {
                    console.log(`\n📄 File: ${relativePath}`);
                    fileHasError = true;
                }
                const line = content.substring(0, match.index).split('\n').length;
                console.log(`  ❌ [${pattern.name}] at line ${line}:`);
                console.log(`     Code: ${match[1]}`);
                console.log(`     Hint: ${pattern.hint}`);
                totalErrors++;
            }
        });
    });

    if (totalErrors === 0) {
        console.log('\n✅ No space-related typos found in Go Templates!');
        process.exit(0);
    } else {
        console.log(`\nTotal errors found: ${totalErrors}`);
        console.log('Please fix these typos to ensure correct template logic.');
        process.exit(1);
    }
}

checkFiles();
