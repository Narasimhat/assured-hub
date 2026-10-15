import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const rootDir = path.resolve(__dirname, '..');
const distDir = path.join(rootDir, 'dist');

// Ensure root dist exists
if (fs.existsSync(distDir)) {
  fs.rmSync(distDir, { recursive: true, force: true });
}
fs.mkdirSync(distDir, { recursive: true });

// Copy QC dist if it exists
const qcDist = path.join(rootDir, 'apps', 'qc', 'dist');
if (fs.existsSync(qcDist)) {
  fs.cpSync(qcDist, path.join(distDir, 'qc'), { recursive: true });
  console.log('✓ Copied apps/qc/dist to dist/qc');
}

// Copy Design dist if it exists
const designDist = path.join(rootDir, 'apps', 'design', 'assured-crispr-designer', 'dist');
if (fs.existsSync(designDist)) {
  fs.cpSync(designDist, path.join(distDir, 'design'), { recursive: true });
  console.log('✓ Copied apps/design/assured-crispr-designer/dist to dist/design');
}

// Copy Studio dist if it exists
const studioDist = path.join(rootDir, 'apps', 'studio', 'dist');
if (fs.existsSync(studioDist)) {
  fs.cpSync(studioDist, path.join(distDir, 'studio'), { recursive: true });
  console.log('✓ Copied apps/studio/dist to dist/studio');
}

// Copy Academy UI dist if it exists
const academyDist = path.join(rootDir, 'apps', 'academy-ui', 'dist');
if (fs.existsSync(academyDist)) {
  fs.cpSync(academyDist, path.join(distDir, 'academy'), { recursive: true });
  console.log('✓ Copied apps/academy-ui/dist to dist/academy');
}

// Static-host fallback; Vercel and the local preview redirect at the server.
const homeHtml = `<!doctype html>
<html lang="en"><head><meta charset="UTF-8">
<meta name="viewport" content="width=device-width, initial-scale=1.0">
<meta http-equiv="refresh" content="0;url=./studio/">
<title>Assured Genome Studio</title></head>
<body><a href="./studio/">Open Assured Genome Studio</a></body></html>`;
fs.writeFileSync(path.join(distDir, 'index.html'), homeHtml, 'utf8');
console.log('✓ Created Studio home redirect');
