const fs = require('fs');
const path = require('path');

const cssDir = './css';
const jsDir = './js';

// The hardcoded color hexes to replace
const colorReplacements = {
    '#22C55E': 'var(--c-success)',
    '#F59E0B': 'var(--c-warning)',
    '#EF4444': 'var(--c-danger)',
    '#3B82F6': 'var(--c-info)',
    '#A855F7': 'var(--c-purple)',
    '#FF6B35': 'var(--c-orange)',
    '#22c55e': 'var(--c-success)',
    '#f59e0b': 'var(--c-warning)',
    '#ef4444': 'var(--c-danger)',
    '#3b82f6': 'var(--c-info)',
    '#a855f7': 'var(--c-purple)',
    '#ff6b35': 'var(--c-orange)'
};

// Typography Scale Mapping
const SCALE = {
    7: "--text-3xs",
    8: "--text-2xs",
    9: "--text-xs",
    10: "--text-sm",
    11: "--text-md",
    12: "--text-base",
    13: "--text-lg",
    14: "--text-xl",
    16: "--text-2xl",
    18: "--text-3xl",
    20: "--text-4xl",
    22: "--text-5xl",
    26: "--text-6xl",
    28: "--text-7xl",
    32: "--text-8xl",
    36: "--text-9xl",
    40: "--text-hero",
    52: "--text-hero"
};

function closestScale(pxVal) {
    let closestKey = null;
    let minDiff = Infinity;
    for (const key of Object.keys(SCALE)) {
        const diff = Math.abs(parseInt(key) - pxVal);
        if (diff < minDiff) {
            minDiff = diff;
            closestKey = key;
        }
    }
    return SCALE[closestKey];
}

let totalColorsReplaced = 0;
let totalFontsReplaced = 0;

function walk(dir) {
    let results = [];
    const list = fs.readdirSync(dir);
    list.forEach(file => {
        file = path.join(dir, file);
        const stat = fs.statSync(file);
        if (stat && stat.isDirectory()) {
            results = results.concat(walk(file));
        } else {
            results.push(file);
        }
    });
    return results;
}

function processFiles(files) {
    files.forEach(file => {
        if (!file.endsWith('.js') && !file.endsWith('.css') && !file.endsWith('.html')) return;

        let content = fs.readFileSync(file, 'utf8');
        let newContent = content;

        // 1. Replace Colors
        for (const [hex, cssVar] of Object.entries(colorReplacements)) {
            // regex to match hex regardless of case, except if it's already inside a var() somehow
            const regex = new RegExp(hex, 'gi');
            newContent = newContent.replace(regex, (match) => {
                totalColorsReplaced++;
                return cssVar;
            });
        }

        // 2. Replace font-size: Xpx
        const fontRegex = /font-size:\s*([0-9.]+)px/gi;
        newContent = newContent.replace(fontRegex, (match, sizeStr) => {
            const sizePx = parseFloat(sizeStr);
            const varName = closestScale(sizePx);
            totalFontsReplaced++;
            return `font-size: var(${varName})`;
        });

        if (content !== newContent) {
            fs.writeFileSync(file, newContent, 'utf8');
            console.log(`Updated ${file}`);
        }
    });
}

const allFiles = [...walk('.'), ...walk(cssDir), ...walk(jsDir)];
// deduplicate
const uniqueFiles = [...new Set(allFiles)];
processFiles(uniqueFiles);

console.log(`Replaced ${totalColorsReplaced} hardcoded color hexes and ${totalFontsReplaced} hardcoded font-sizes.`);
