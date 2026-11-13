import { existsSync, readFileSync, mkdtempSync, writeFileSync, rmSync } from 'node:fs';
import { resolve, join, basename } from 'node:path';
import { tmpdir } from 'node:os';
import { spawnSync } from 'node:child_process';

const root = resolve(process.argv.includes('--dist') ? 'dist' : '.');
const errors = [];
const fail = message => errors.push(message);
const read = file => {
  const target = join(root, file);
  if (!existsSync(target)) {
    fail('Arquivo obrigatório ausente: ' + file);
    return '';
  }
  return readFileSync(target, 'utf8');
};
const checkJs = (file, content) => {
  const tempDir = mkdtempSync(join(tmpdir(), 'saras-check-'));
  const tempFile = join(tempDir, basename(file));
  try {
    writeFileSync(tempFile, content);
    const result = spawnSync(process.execPath, ['--check', tempFile], { encoding: 'utf8' });
    if (result.status !== 0) fail('Sintaxe inválida em ' + file + ':\n' + (result.stderr || result.stdout));
  } finally {
    rmSync(tempDir, { recursive: true, force: true });
  }
};

const html = read('index.html');
const sw = read('sw.js');
const policy = read('adaptive-policy.js');
const manifestText = read('manifest.webmanifest');\nconst autotestHtml = read('autotest.html');\nconst autotestJs = read('autotest.js');

if (html) {
  const ids = [...html.matchAll(/\bid=["']([^"']+)["']/g)].map(match => match[1]);
  const seen = new Set();
  for (const id of ids) {
    if (seen.has(id)) fail('ID HTML duplicado: ' + id);
    seen.add(id);
  }

  const selectors = [...html.matchAll(/\$\(\s*['"]([^'"]+)['"]\s*\)/g)].map(match => match[1]);
  for (const id of new Set(selectors)) {
    if (!seen.has(id)) fail('Seletor JavaScript sem elemento HTML: #' + id);
  }

  const localRefs = [...html.matchAll(/\b(?:src|href)=["']([^"']+)["']/g)]
    .map(match => match[1])
    .filter(ref => !/^(?:[a-z]+:)?\/\//i.test(ref) && !ref.startsWith('data:') && !ref.startsWith('#'));
  for (const ref of localRefs) {
    const file = decodeURIComponent(ref.split(/[?#]/)[0]);
    if (file && !existsSync(join(root, file))) fail('Recurso local não encontrado: ' + file);
  }

  const inlineScripts = [...html.matchAll(/<script\b[^>]*>([\s\S]*?)<\/script>/gi)]
    .map(match => match[1])
    .filter(content => content.trim());
  if (inlineScripts.length !== 1) fail('Esperado 1 script inline principal; encontrados: ' + inlineScripts.length);
  for (let i = 0; i < inlineScripts.length; i++) checkJs('index-inline-' + (i + 1) + '.js', inlineScripts[i]);
  if (!html.includes('adaptive-policy.js')) fail('index.html não carrega adaptive-policy.js');
}

if (sw) checkJs('sw.js', sw);
if (policy) checkJs('adaptive-policy.js', policy);\nif (autotestJs) checkJs('autotest.js', autotestJs);\nif (autotestHtml && !autotestHtml.includes('<script src="autotest.js"></script>')) fail('autotest.html não carrega autotest.js');

if (manifestText) {
  try {
    const manifest = JSON.parse(manifestText);
    if (!manifest.name || !manifest.start_url || !Array.isArray(manifest.icons)) fail('manifest.webmanifest sem campos essenciais');
  } catch (error) {
    fail('manifest.webmanifest inválido: ' + error.message);
  }
}

if (errors.length) {
  console.error(errors.join('\n\n'));
  process.exitCode = 1;
} else {
  console.log('Verificação concluída: ' + root + ' — HTML, IDs, referências, JavaScript e manifest válidos.');
}
