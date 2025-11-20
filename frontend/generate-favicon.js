import sharp from 'sharp';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const SVG_SOURCE = path.join(__dirname, 'public', 'icon.svg');
const OUTPUT_PATH = path.join(__dirname, 'public', 'favicon.ico');

sharp(SVG_SOURCE)
  .resize(32, 32)
  .toFile(OUTPUT_PATH)
  .then(() => console.log('✅ favicon.ico generated'))
  .catch(err => console.error('❌ Error:', err));
