#!/usr/bin/env node
import { execSync } from 'child_process';
import fs from 'fs';
import path from 'path';

// Create the gh-pages directory if it doesn't exist
try {
  fs.mkdirSync('gh-pages');
} catch (err) {
  if (err.code !== 'EEXIST') throw err;
}

// Build the static frontend with GitHub Pages config
console.log('Building for GitHub Pages...');
execSync('vite build --config vite.config.gh-pages.js', { stdio: 'inherit' });

// Create a 404.html that's identical to index.html for GitHub Pages SPA routing
console.log('Creating 404.html for SPA routing...');
const indexHtml = fs.readFileSync(path.join('gh-pages', 'index.html'), 'utf8');
fs.writeFileSync(path.join('gh-pages', '404.html'), indexHtml);

// Create a simple API mock that will be used when the real backend is not available
console.log('Creating API mocks for GitHub Pages...');
const apiDir = path.join('gh-pages', 'api');
try {
  fs.mkdirSync(apiDir);
} catch (err) {
  if (err.code !== 'EEXIST') throw err;
}

// Create a mock stores endpoint
const mockStores = [
  { id: 1, name: 'Best Buy', url: 'https://www.bestbuy.com/site/computer-cards-components/video-graphics-cards/abcat0507002.c' },
  { id: 2, name: 'Amazon Electronics', url: 'https://www.amazon.com/s?k=electronics' },
  { id: 3, name: 'Walmart Tech', url: 'https://www.walmart.com/browse/electronics/3944' }
];
fs.writeFileSync(path.join(apiDir, 'stores.json'), JSON.stringify(mockStores, null, 2));

console.log('GitHub Pages build complete!');
