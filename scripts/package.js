#!/usr/bin/env node
/**
 * Package Chrome extension into .zip file
 */
const fs = require('fs');
const path = require('path');
const archiver = require('archiver');

const rootDir = path.join(__dirname, '..');
const extensionDir = path.join(rootDir, 'extension');
const distDir = path.join(rootDir, 'dist');
const manifestPath = path.join(extensionDir, 'manifest.json');

try {
  if (!fs.existsSync(extensionDir)) {
    throw new Error('Missing extension/ directory (expected built/unpacked source at ./extension)');
  }

  // Read manifest to get version
  const manifest = JSON.parse(fs.readFileSync(manifestPath, 'utf8'));
  const version = manifest.version;
  const name = manifest.name.replace(/\s+/g, '-').toLowerCase();

  console.log(`📦 Packaging ${manifest.name} v${version}...`);

  // Create dist directory if it doesn't exist
  if (!fs.existsSync(distDir)) {
    fs.mkdirSync(distDir, { recursive: true });
  }

  const zipFileName = `${name}-v${version}.zip`;
  const zipFilePath = path.join(distDir, zipFileName);

  // Remove old zip if exists
  if (fs.existsSync(zipFilePath)) {
    fs.unlinkSync(zipFilePath);
    console.log(`🗑️  Removed old package: ${zipFileName}`);
  }

  // Create zip file
  console.log('📁 Creating zip archive...');

  const output = fs.createWriteStream(zipFilePath);
  const archive = archiver('zip', {
    zlib: { level: 9 } // Maximum compression
  });

  // Listen for archive events
  output.on('close', () => {
    const fileSizeInBytes = archive.pointer();
    const fileSizeInKB = (fileSizeInBytes / 1024).toFixed(2);

    console.log(`\n✅ Package created successfully!`);
    console.log(`   📦 File: ${zipFileName}`);
    console.log(`   📏 Size: ${fileSizeInKB} KB`);
    console.log(`   📍 Location: ${zipFilePath}`);
  });

  archive.on('error', (err) => {
    throw err;
  });

  // Pipe archive to output file
  archive.pipe(output);

  // Add extension/ contents to archive root (so manifest.json is at zip root)
  archive.directory(extensionDir, false);
  console.log('  ✓ Added extension/');

  // Finalize the archive
  archive.finalize();

} catch (error) {
  console.error('❌ Error packaging extension:', error.message);
  process.exit(1);
}
