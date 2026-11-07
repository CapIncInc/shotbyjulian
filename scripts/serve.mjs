#!/usr/bin/env node
/**
 * Zero-dependency static server for local work.
 * Refreshes photos.json whenever the photo folder changes, so a new image
 * shows up on the next page reload.
 *
 *   node scripts/serve.mjs            serve the repo
 *   node scripts/serve.mjs --dist     serve the built dist/ folder
 */
import http from 'node:http';
import { createReadStream, existsSync, statSync, watch } from 'node:fs';
import { execFileSync } from 'node:child_process';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const useDist = process.argv.includes('--dist');
const BASE = useDist ? path.join(ROOT, 'dist') : ROOT;
const requestedPort = Number(process.env.PORT);
const PORT = Number.isInteger(requestedPort) && requestedPort > 0 ? requestedPort : 4173;
const HOST = '127.0.0.1';

const TYPES = {
  '.html': 'text/html; charset=utf-8',
  '.css': 'text/css; charset=utf-8',
  '.js': 'text/javascript; charset=utf-8',
  '.json': 'application/json; charset=utf-8',
  '.jpg': 'image/jpeg',
  '.jpeg': 'image/jpeg',
  '.png': 'image/png',
  '.webp': 'image/webp',
  '.avif': 'image/avif',
  '.gif': 'image/gif',
  '.svg': 'image/svg+xml',
  '.ico': 'image/x-icon',
  '.txt': 'text/plain; charset=utf-8',
  '.map': 'application/json; charset=utf-8',
};

let lastSync = 0;

function sync(quiet = true) {
  const now = Date.now();
  if (quiet && now - lastSync < 700) return;
  lastSync = now;
  const args = [path.join(ROOT, 'scripts', 'sync-photos.mjs')];
  if (quiet) args.push('--quiet');
  try {
    execFileSync(process.execPath, args, { stdio: 'inherit' });
  } catch {
    console.error('! photo sync failed — run `npm run sync` to see why');
  }
}

const server = http.createServer((req, res) => {
  let url;
  try {
    url = decodeURIComponent((req.url || '/').split('?')[0]);
  } catch {
    res.writeHead(400, { 'Content-Type': 'text/plain; charset=utf-8' }).end('Bad request');
    return;
  }

  if (url === '/photos.json' && !useDist) sync(true);

  const relative = url === '/' ? 'index.html' : url.replace(/^\/+/, '');
  const filePath = path.resolve(BASE, relative);

  if (!filePath.startsWith(BASE + path.sep) && filePath !== BASE) {
    res.writeHead(403, { 'Content-Type': 'text/plain; charset=utf-8' }).end('Forbidden');
    return;
  }

  if (!existsSync(filePath) || statSync(filePath).isDirectory()) {
    res.writeHead(404, { 'Content-Type': 'text/plain; charset=utf-8' }).end('Not found');
    return;
  }

  res.writeHead(200, {
    'Content-Type': TYPES[path.extname(filePath).toLowerCase()] || 'application/octet-stream',
    'Cache-Control': 'no-cache',
  });
  createReadStream(filePath).pipe(res);
});

sync(false);

const photoDir = path.join(ROOT, 'shotbyjulian');
let debounce = 0;
if (!useDist && existsSync(photoDir)) {
  try {
    watch(photoDir, { persistent: false }, () => {
      clearTimeout(debounce);
      debounce = setTimeout(() => {
        sync(true);
        console.log('↻ shotbyjulian/ changed — reload the page to see it');
      }, 250);
    });
  } catch {
    /* watching is a nicety, not a requirement */
  }
}

server.listen(PORT, HOST, () => {
  console.log(`shotbyjulian → http://localhost:${PORT}`);
  console.log(`serving ${useDist ? 'dist/' : 'the repository root'}`);
});
