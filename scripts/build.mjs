import { existsSync, mkdirSync, rmSync, copyFileSync } from 'node:fs';
import { resolve, join } from 'node:path';

const root = resolve('.');
const out = join(root, 'dist');
const files = [
  'index.html',
  'sw.js',
  'adaptive-policy.js',
  'manifest.webmanifest',
  'banner.jpg',
  'icon-192.png',
  'icon-512.png',
  'icon-maskable-192.png',
  'icon-maskable-512.png'
];

rmSync(out, { recursive: true, force: true });
mkdirSync(out, { recursive: true });
for (const file of files) {
  const source = join(root, file);
  if (!existsSync(source)) throw new Error('Arquivo necessário para build ausente: ' + file);
  copyFileSync(source, join(out, file));
}
console.log('Build estática criada em dist/ com ' + files.length + ' arquivos.');
