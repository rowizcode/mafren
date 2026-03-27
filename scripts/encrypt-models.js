#!/usr/bin/env node
// ============================================
// GLB → MFR Encryption Script
// XOR-encrypts GLB files and generates a manifest
// ============================================

const fs = require('fs');
const path = require('path');
const crypto = require('crypto');

// XOR encryption key (must match the key in product-grid.js)
const XOR_KEY = 'MfR3n_J3w3lRy_2026!aTeLi3r';

// Directories
const MODELS_DIR = path.join(__dirname, '..', 'public', 'models');
const OUTPUT_DIR = path.join(__dirname, '..', 'public', 'assets');
const MANIFEST_PATH = path.join(__dirname, '..', 'js', 'asset-manifest.json');

// GLB files that are actually used by products
const TARGET_FILES = [
    'mf_rectangle.glb',
    'mafren_logo_signet.glb',
    'body_05.glb',
    'earring_body_02.glb',
    'earring_body_04.glb',
    'body_03.glb',
];

function xorEncrypt(buffer, key) {
    const keyBytes = Buffer.from(key, 'utf-8');
    const result = Buffer.alloc(buffer.length);
    for (let i = 0; i < buffer.length; i++) {
        result[i] = buffer[i] ^ keyBytes[i % keyBytes.length];
    }
    return result;
}

function generateHash(filename) {
    return crypto.createHash('md5').update(filename + Date.now().toString()).digest('hex').substring(0, 12);
}

function main() {
    console.log('🔐 Mafren GLB Encryption Tool');
    console.log('==============================\n');

    // Create output directory
    if (!fs.existsSync(OUTPUT_DIR)) {
        fs.mkdirSync(OUTPUT_DIR, { recursive: true });
        console.log(`📁 Created output directory: ${OUTPUT_DIR}\n`);
    }

    const manifest = {};
    let successCount = 0;

    for (const filename of TARGET_FILES) {
        const inputPath = path.join(MODELS_DIR, filename);

        if (!fs.existsSync(inputPath)) {
            console.log(`⚠️  Skipping ${filename} — file not found`);
            continue;
        }

        // Read the GLB file
        const glbBuffer = fs.readFileSync(inputPath);
        const originalSize = glbBuffer.length;

        // Encrypt
        const encrypted = xorEncrypt(glbBuffer, XOR_KEY);

        // Generate hashed output filename
        const hashName = generateHash(filename);
        const outputFilename = `${hashName}.mfr`;
        const outputPath = path.join(OUTPUT_DIR, outputFilename);

        // Write encrypted file
        fs.writeFileSync(outputPath, encrypted);

        // Map original filename (without extension) to hashed filename
        const key = filename.replace('.glb', '');
        manifest[key] = outputFilename;

        successCount++;
        const sizeKB = (originalSize / 1024).toFixed(1);
        console.log(`✅ ${filename} → ${outputFilename} (${sizeKB} KB)`);
    }

    // Write manifest
    fs.writeFileSync(MANIFEST_PATH, JSON.stringify(manifest, null, 2));

    console.log(`\n==============================`);
    console.log(`🎉 Encrypted ${successCount}/${TARGET_FILES.length} files`);
    console.log(`📄 Manifest saved to: ${MANIFEST_PATH}`);
    console.log(`📂 Encrypted files in: ${OUTPUT_DIR}`);
    console.log(`\n🔑 XOR Key: "${XOR_KEY}"`);
    console.log(`   (Make sure this matches the key in product-grid.js)`);
}

main();
