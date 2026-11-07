#!/usr/bin/env node
/**
 * Builds the deployable site into dist/: refresh the manifest, copy the page
 * files and every photograph. No bundler, no dependencies.
 */
import { cp, copyFile, mkdir, rm, writeFile } from 'node:fs/promises';
import { execFileSync } from 'node:child_process';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const DIST = path.join(ROOT, 'dist');
const FILES = ['index.html', 'styles.css', 'app.js', 'photos.json'];
const DIRS = ['shotbyjulian', 'vendor'];

execFileSync(process.execPath, [path.join(ROOT, 'scripts', 'sync-photos.mjs')], { stdio: 'inherit' });

await rm(DIST, { recursive: true, force: true });
await mkdir(DIST, { recursive: true });

for (const file of FILES) {
  await copyFile(path.join(ROOT, file), path.join(DIST, file));
}

for (const dir of DIRS) {
  await cp(path.join(ROOT, dir), path.join(DIST, dir), { recursive: true });
}
await writeFile(path.join(DIST, '.nojekyll'), '');

console.log('✓ dist/ ready to deploy');
