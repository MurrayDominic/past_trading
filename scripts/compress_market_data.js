// Build script: compress market data JSON files into individually gzipped files
// Run with: npm run compress-data
//
// Each JSON file is gzipped separately so the game can decompress on-demand
// (only the stocks actually loaded in a run get decompressed)

const fs = require('fs');
const path = require('path');
const zlib = require('zlib');

const DATA_DIR = path.join(__dirname, '..', 'assets', 'market_data');
const OUTPUT_DIR = path.join(DATA_DIR, 'compressed');

// Create output directory
if (!fs.existsSync(OUTPUT_DIR)) {
  fs.mkdirSync(OUTPUT_DIR, { recursive: true });
}

const categories = ['stocks', 'commodities', 'crypto', 'etfs'];
let totalOriginal = 0;
let totalCompressed = 0;

for (const category of categories) {
  const categoryDir = path.join(DATA_DIR, category);
  if (!fs.existsSync(categoryDir)) {
    console.log(`Skipping ${category} (directory not found)`);
    continue;
  }

  const files = fs.readdirSync(categoryDir).filter(f => f.endsWith('.json'));
  if (files.length === 0) {
    console.log(`Skipping ${category} (no JSON files)`);
    continue;
  }

  console.log(`Compressing ${category}: ${files.length} files...`);

  const compressedDir = path.join(OUTPUT_DIR, category);
  if (!fs.existsSync(compressedDir)) {
    fs.mkdirSync(compressedDir, { recursive: true });
  }

  let originalSize = 0;
  let compressedSize = 0;

  for (const file of files) {
    const filePath = path.join(categoryDir, file);
    const raw = fs.readFileSync(filePath);
    originalSize += raw.length;

    const compressed = zlib.gzipSync(raw, { level: 9 });
    compressedSize += compressed.length;

    fs.writeFileSync(path.join(compressedDir, file + '.gz'), compressed);
  }

  const ratio = ((1 - compressedSize / originalSize) * 100).toFixed(1);
  console.log(`  ${category}: ${(originalSize / 1024 / 1024).toFixed(1)}MB -> ${(compressedSize / 1024 / 1024).toFixed(1)}MB (${ratio}% reduction)`);

  totalOriginal += originalSize;
  totalCompressed += compressedSize;
}

const totalRatio = ((1 - totalCompressed / totalOriginal) * 100).toFixed(1);
console.log(`\nTotal: ${(totalOriginal / 1024 / 1024).toFixed(1)}MB -> ${(totalCompressed / 1024 / 1024).toFixed(1)}MB (${totalRatio}% reduction)`);
console.log(`Compressed files written to: ${OUTPUT_DIR}`);
