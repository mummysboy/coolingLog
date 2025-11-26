#!/usr/bin/env node
/**
 * PWA Icon Generator
 * Generates PWA icons from the logo.avif file
 * 
 * Usage: node scripts/generate-icons.js
 * 
 * Requires: sharp package (npm install --save-dev sharp)
 */

const sharp = require('sharp');
const path = require('path');
const fs = require('fs');

const LOGO_PATH = path.join(__dirname, '../public/logo.avif');
const OUTPUT_DIR = path.join(__dirname, '../public/icons');

// Create output directory if it doesn't exist
if (!fs.existsSync(OUTPUT_DIR)) {
  fs.mkdirSync(OUTPUT_DIR, { recursive: true });
}

const sizes = [
  { name: 'icon-96.png', size: 96 },
  { name: 'icon-192.png', size: 192 },
  { name: 'icon-192-maskable.png', size: 192 },
  { name: 'icon-512.png', size: 512 },
  { name: 'icon-512-maskable.png', size: 512 },
];

async function generateIcons() {
  try {
    console.log('🎨 Generating PWA icons from logo.avif...\n');

    for (const { name, size } of sizes) {
      const outputPath = path.join(OUTPUT_DIR, name);
      
      await sharp(LOGO_PATH)
        .resize(size, size, {
          fit: 'cover',
          position: 'center',
        })
        .png()
        .toFile(outputPath);

      console.log(`✅ Generated ${name} (${size}x${size})`);
    }

    console.log('\n🎉 All icons generated successfully!');
    console.log(`📁 Icons saved to: ${OUTPUT_DIR}`);
    console.log('\n📝 Next steps:');
    console.log('1. Deploy your app to production (HTTPS required)');
    console.log('2. On iPad/iPhone: Open the app → Share → Add to Home Screen');
    console.log('3. On Android: Open the app → Menu → Install app');
    
  } catch (error) {
    console.error('❌ Error generating icons:', error.message);
    
    if (error.code === 'MODULE_NOT_FOUND') {
      console.error('\n📦 The "sharp" package is required.');
      console.error('Install it with: npm install --save-dev sharp');
    }
    
    process.exit(1);
  }
}

generateIcons();

