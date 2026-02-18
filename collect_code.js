const fs = require('fs');
const path = require('path');

const rootDir = process.cwd();
const treeFile = path.join(rootDir, 'project_tree.txt');
const codeFile = path.join(rootDir, 'all_code.txt');

// Define binary extensions to skip
const binaryExtensions = [
    '.png', '.jpg', '.jpeg', '.gif', '.ico', '.woff', '.woff2', 
    '.ttf', '.eot', '.pdf', '.zip', '.tar', '.gz', '.mp4', 
    '.webm', '.exe', '.dll', '.DS_Store', '.svg'
];

function isBinary(filePath) {
    const ext = path.extname(filePath).toLowerCase();
    return binaryExtensions.includes(ext);
}

// Ignore list
const ignoredDirs = [
    'node_modules', '.git', '.next', 'dist', 'build', 'coverage', 
    '.gemini', '.agent', '.vscode', '.idea'
];

const ignoredFiles = [
    'package-lock.json', 'pnpm-lock.yaml', 'yarn.lock', 
    'project_tree.txt', 'all_code.txt', 'collect_code.js', 'collect_code.ps1'
];

// 1. Generate Tree
let treeOutput = 'Project Tree:\n';

function generateTree(dir, prefix = '') {
    const items = fs.readdirSync(dir);
    
    // Clean up items first
    const visibleItems = items.filter(item => {
        if (ignoredDirs.includes(item)) return false;
        if (ignoredFiles.includes(item)) return false;
        return true;
    });

    // Sort: directories first, then files
    visibleItems.sort((a, b) => {
        const aPath = path.join(dir, a);
        const bPath = path.join(dir, b);
        let aStat, bStat;
        try { aStat = fs.statSync(aPath); } catch (e) { return 0; }
        try { bStat = fs.statSync(bPath); } catch (e) { return 0; }
        
        if (aStat.isDirectory() && !bStat.isDirectory()) return -1;
        if (!aStat.isDirectory() && bStat.isDirectory()) return 1;
        return a.localeCompare(b);
    });

    visibleItems.forEach((item, index) => {
        const fullPath = path.join(dir, item);
        let stat;
        try { stat = fs.statSync(fullPath); } catch (e) { return; }
        
        const isLast = index === visibleItems.length - 1;
        
        const marker = isLast ? '└─ ' : '├─ ';
        treeOutput += `${prefix}${marker}${item}\n`;
        
        if (stat.isDirectory()) {
            const newPrefix = prefix + (isLast ? '   ' : '│  ');
            generateTree(fullPath, newPrefix);
        }
    });
}
console.log('Generating project tree...');
generateTree(rootDir);
fs.writeFileSync(treeFile, treeOutput);
console.log(`Tree written to ${treeFile}`);


// 2. Collect Code
let codeOutput = '';

function collectCode(dir) {
    const items = fs.readdirSync(dir);
    
    // Sort implementation
    items.sort((a, b) => a.localeCompare(b));

    items.forEach(item => {
        if (ignoredDirs.includes(item)) return;
        if (ignoredFiles.includes(item)) return;

        const fullPath = path.join(dir, item);
        let stat;
        try { stat = fs.statSync(fullPath); } catch (e) { return; }
        
        if (stat.isDirectory()) {
            collectCode(fullPath);
        } else {
            if (isBinary(fullPath)) return;
            
            const relativePath = path.relative(rootDir, fullPath);
            // Append directly to file instead of keeping in memory for huge projects?
            // For now, in-memory string is okay for typical source code size.
            // But let's append to be safer if it's huge. 
            // Just stick to string builder for simplicity here unless it crashes.
            
            codeOutput += '----------------------------------------------------------------\n';
            codeOutput += `File: ${relativePath}\n`;
            codeOutput += '----------------------------------------------------------------\n';
            
            try {
                const content = fs.readFileSync(fullPath, 'utf8');
                codeOutput += content + '\n\n';
            } catch (err) {
                codeOutput += `Error reading file: ${err.message}\n\n`;
            }
        }
    });
}

console.log('Collecting code...');
collectCode(rootDir);
fs.writeFileSync(codeFile, codeOutput);
console.log(`Code written to ${codeFile}`);
