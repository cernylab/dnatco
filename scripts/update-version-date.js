#!/usr/bin/env node

const fs = require('fs');
const path = require('path');

// Generate today's date in YYYYMMDD format
const now = new Date();
const year = now.getFullYear();
const month = String(now.getMonth() + 1).padStart(2, '0');
const day = String(now.getDate()).padStart(2, '0');
const dateString = `${year}${month}${day}`;

// Path to version.ts
const versionPath = path.join(__dirname, '..', 'src', 'version.ts');

// Read the file
let content = fs.readFileSync(versionPath, 'utf8');

// Replace the Date constant
content = content.replace(
    /export const Date = '\d{8}';/,
    `export const Date = '${dateString}';`
);

// Write back
fs.writeFileSync(versionPath, content, 'utf8');

console.log(`Updated version date to: ${dateString}`);
