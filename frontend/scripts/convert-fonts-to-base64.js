#!/usr/bin/env node

/**
 * Script to convert Cairo font files to base64
 * 
 * Usage:
 * 1. Place Cairo-Regular.ttf and Cairo-Bold.ttf in assets/fonts/
 * 2. Run: node scripts/convert-fonts-to-base64.js
 * 3. The output will be written to frontend/src/fonts/vfs_fonts_custom.js
 */

import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Paths - fonts are in assets/fonts/ at project root
const projectRoot = path.join(__dirname, '../..');
const fontsDir = path.join(projectRoot, 'assets', 'fonts');
const outputFile = path.join(__dirname, '../src/fonts/vfs_fonts_custom.js');

const regularFontPath = path.join(fontsDir, 'Cairo-Regular.ttf');
const boldFontPath = path.join(fontsDir, 'Cairo-Bold.ttf');

function convertFontToBase64(fontPath) {
  try {
    if (!fs.existsSync(fontPath)) {
      console.error(`❌ Font file not found: ${fontPath}`);
      return null;
    }
    
    const fontBuffer = fs.readFileSync(fontPath);
    const base64 = fontBuffer.toString('base64');
    
    console.log(`✅ Converted: ${path.basename(fontPath)} (${(fontBuffer.length / 1024).toFixed(2)} KB)`);
    return base64;
  } catch (error) {
    console.error(`❌ Error converting ${fontPath}:`, error.message);
    return null;
  }
}

// Convert fonts
console.log('🔄 Converting Cairo fonts to base64...\n');

const regularBase64 = convertFontToBase64(regularFontPath);
const boldBase64 = convertFontToBase64(boldFontPath);

if (!regularBase64 || !boldBase64) {
  console.error('\n❌ Failed to convert fonts. Please ensure:');
  console.error(`   1. Cairo-Regular.ttf exists in ${fontsDir}`);
  console.error(`   2. Cairo-Bold.ttf exists in ${fontsDir}`);
  process.exit(1);
}

// Generate the vfs_fonts_custom.js file
const fileContent = `// Custom VFS fonts for Arabic support in pdfmake
// This file contains Cairo font in base64 format
// Generated automatically by convert-fonts-to-base64.js

export const vfs = {
  "Cairo-Regular.ttf": "${regularBase64}",
  "Cairo-Bold.ttf": "${boldBase64}"
};
`;

// Write to file
try {
  fs.writeFileSync(outputFile, fileContent, 'utf8');
  console.log(`\n✅ Successfully generated: ${outputFile}`);
  console.log(`   Regular font: ${(regularBase64.length / 1024).toFixed(2)} KB base64`);
  console.log(`   Bold font: ${(boldBase64.length / 1024).toFixed(2)} KB base64`);
  console.log('\n🎉 Cairo fonts are now ready to use in pdfmake!');
} catch (error) {
  console.error(`\n❌ Error writing file: ${error.message}`);
  console.error('\nPlease manually copy the base64 strings to frontend/src/fonts/vfs_fonts_custom.js');
  console.error('\nCairo-Regular.ttf base64:');
  console.error(regularBase64);
  console.error('\nCairo-Bold.ttf base64:');
  console.error(boldBase64);
  process.exit(1);
}

