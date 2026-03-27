#!/usr/bin/env python3
"""
GLB → MFR Encryption Script
XOR-encrypts GLB files and generates a manifest for Mafren Jewelry.
"""

import os
import hashlib
import json
import time

# XOR encryption key (must match the key in product-grid.js)
XOR_KEY = b'MfR3n_J3w3lRy_2026!aTeLi3r'

# Directories
SCRIPT_DIR = os.path.dirname(os.path.abspath(__file__))
PROJECT_DIR = os.path.dirname(SCRIPT_DIR)
MODELS_DIR = os.path.join(PROJECT_DIR, 'public', 'models')
OUTPUT_DIR = os.path.join(PROJECT_DIR, 'public', 'assets')
MANIFEST_PATH = os.path.join(PROJECT_DIR, 'js', 'asset-manifest.json')

# GLB files used by products
TARGET_FILES = [
    'mf_rectangle.glb',
    'mafren_logo_signet.glb',
    'body_05.glb',
    'earring_body_02.glb',
    'earring_body_04.glb',
    'body_03.glb',
]


def xor_encrypt(data: bytes, key: bytes) -> bytes:
    key_len = len(key)
    return bytes(b ^ key[i % key_len] for i, b in enumerate(data))


def generate_hash(filename: str) -> str:
    raw = f"{filename}{time.time()}".encode()
    return hashlib.md5(raw).hexdigest()[:12]


def main():
    print('🔐 Mafren GLB Encryption Tool')
    print('=' * 30 + '\n')

    os.makedirs(OUTPUT_DIR, exist_ok=True)

    manifest = {}
    success_count = 0

    for filename in TARGET_FILES:
        input_path = os.path.join(MODELS_DIR, filename)

        if not os.path.exists(input_path):
            print(f'⚠️  Skipping {filename} — file not found')
            continue

        # Read the GLB file
        with open(input_path, 'rb') as f:
            glb_data = f.read()
        original_size = len(glb_data)

        # Encrypt
        encrypted = xor_encrypt(glb_data, XOR_KEY)

        # Generate hashed output filename
        hash_name = generate_hash(filename)
        output_filename = f'{hash_name}.mfr'
        output_path = os.path.join(OUTPUT_DIR, output_filename)

        # Write encrypted file
        with open(output_path, 'wb') as f:
            f.write(encrypted)

        # Map original filename (without extension) to hashed filename
        key = filename.replace('.glb', '')
        manifest[key] = output_filename

        success_count += 1
        size_kb = original_size / 1024
        print(f'✅ {filename} → {output_filename} ({size_kb:.1f} KB)')

    # Write manifest
    with open(MANIFEST_PATH, 'w') as f:
        json.dump(manifest, f, indent=2)

    print(f'\n{"=" * 30}')
    print(f'🎉 Encrypted {success_count}/{len(TARGET_FILES)} files')
    print(f'📄 Manifest saved to: {MANIFEST_PATH}')
    print(f'📂 Encrypted files in: {OUTPUT_DIR}')
    print(f'\n🔑 XOR Key: "{XOR_KEY.decode()}"')
    print(f'   (Make sure this matches the key in product-grid.js)')


if __name__ == '__main__':
    main()
