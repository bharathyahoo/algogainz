/**
 * Icon Generator Script for AlgoGainz PWA
 *
 * Generates PNG icons in multiple sizes from the base SVG icon
 * Required sizes: 72, 96, 128, 144, 152, 192, 384, 512
 */

import sharp from 'sharp';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Icon sizes required by manifest.json
const SIZES = [72, 96, 128, 144, 152, 192, 384, 512];

// Paths
const SVG_SOURCE = path.join(__dirname, 'public', 'icon.svg');
const OUTPUT_DIR = path.join(__dirname, 'public', 'icons');

async function generateIcons() {
  console.log('🎨 AlgoGainz Icon Generator\n');
  console.log(`📁 Source: ${SVG_SOURCE}`);
  console.log(`📂 Output: ${OUTPUT_DIR}\n`);

  // Ensure output directory exists
  if (!fs.existsSync(OUTPUT_DIR)) {
    fs.mkdirSync(OUTPUT_DIR, { recursive: true });
    console.log('✅ Created icons directory\n');
  }

  // Check if source SVG exists
  if (!fs.existsSync(SVG_SOURCE)) {
    console.error('❌ Error: icon.svg not found in public directory');
    process.exit(1);
  }

  // Generate PNG for each size
  console.log('🔄 Generating PNG icons...\n');

  for (const size of SIZES) {
    try {
      const outputPath = path.join(OUTPUT_DIR, `icon-${size}x${size}.png`);

      await sharp(SVG_SOURCE)
        .resize(size, size, {
          fit: 'contain',
          background: { r: 0, g: 0, b: 0, alpha: 0 } // Transparent background
        })
        .png({
          quality: 100,
          compressionLevel: 9
        })
        .toFile(outputPath);

      const stats = fs.statSync(outputPath);
      console.log(`✅ Generated ${size}x${size} (${(stats.size / 1024).toFixed(2)} KB)`);
    } catch (error) {
      console.error(`❌ Failed to generate ${size}x${size}:`, error.message);
    }
  }

  console.log('\n🎉 Icon generation complete!');
  console.log('\n📋 Generated files:');

  // List generated files
  const files = fs.readdirSync(OUTPUT_DIR);
  files.forEach(file => {
    const filePath = path.join(OUTPUT_DIR, file);
    const stats = fs.statSync(filePath);
    console.log(`   - ${file} (${(stats.size / 1024).toFixed(2)} KB)`);
  });

  console.log('\n✨ Icons are ready for PWA installation!');
}

// Run the generator
generateIcons().catch(error => {
  console.error('❌ Icon generation failed:', error);
  process.exit(1);
});
