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

// Landing-page artwork and its reproducible source data.
const publicDir = path.join(rootDir, 'public');
if (fs.existsSync(publicDir)) fs.cpSync(publicDir, distDir, { recursive: true });

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

// Two entry points: the experiment workspace and the learning area.
const homeHtml = `<!doctype html>
<html lang="en"><head><meta charset="UTF-8">
<meta name="viewport" content="width=device-width, initial-scale=1.0">
<meta name="description" content="Learn genome editing with ASSURED Academy. Design experiments, analyse Sanger traces, and create reports with ASSURED Bench.">
<title>ASSURED — Academy &amp; Bench</title>
<link rel="stylesheet" href="./assets/landing.css">
<link rel="icon" type="image/svg+xml" href="./assets/assured-mark.svg">
</head><body>
<header class="site-header"><a class="brand" href="./" aria-label="ASSURED home"><span class="brand-mark" aria-hidden="true">A</span>ASSURED</a><nav aria-label="Main navigation"><a href="./academy/">Academy</a><a href="./studio/">Bench <span aria-hidden="true">↗</span></a></nav></header>
<main>
<section class="welcome" aria-labelledby="welcome-heading">
<div class="welcome-copy"><p class="eyebrow">Learn · Practice · Apply</p><h1 id="welcome-heading">From learning<br> to your next experiment.</h1><p class="intro">Build your understanding in Academy. Bring your experiment to Bench.</p></div>
<div class="workspaces" aria-label="Choose your workspace">
<article class="workspace academy"><div class="workspace-icon" aria-hidden="true"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.6"><path d="M12 5v15M3 4c4-1 6 0 9 2 3-2 5-3 9-2v14c-4-1-6 0-9 2-3-2-5-3-9-2Z"/></svg></div><p class="label">Teaching &amp; learning</p><h2>Academy</h2><p>12 lessons, guided examples, and quizzes to build experimental judgment.</p><a class="action" href="./academy/">Start learning <span aria-hidden="true">→</span></a></article>
<article class="workspace bench"><div class="workspace-icon" aria-hidden="true"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.6"><path d="M9 3h6M10 3v6l-6 10c-.5 1 .2 2 1.4 2h13.2c1.2 0 1.9-1 1.4-2L14 9V3M7.5 14h9"/><path d="M9 17h.01M14 18h.01" stroke-linecap="round" stroke-width="2"/></svg></div><p class="label">Experiment workspace</p><h2>Bench</h2><p>Design edits, plan reagents, analyse traces, and prepare your reports.</p><a class="action" href="./studio/">Open Bench <span aria-hidden="true">→</span></a></article>
</div>
</section>
<div class="workflow"><span class="workflow-label">In Bench</span><ol aria-label="Bench workflow"><li>Design</li><li>Order</li><li>Trace Analysis</li><li>Reports</li></ol></div>
<section class="example" aria-labelledby="example-heading">
<div class="example-heading"><div><p class="eyebrow">A look inside Bench</p><h2 id="example-heading">See the edit in context.</h2><p>APOE R176C, aligned with the wild-type control. Guides, cut sites, and silent blocking changes are annotated.</p></div><span class="sample-label">Simulated practice data</span></div>
<figure class="chromatogram"><a class="figure-link" href="./assets/assured-apoe-chromatogram.svg" aria-label="Open the full-size annotated APOE chromatogram"><img src="./assets/assured-apoe-chromatogram.svg" width="980" height="348" fetchpriority="high" alt="Annotated APOE R176C chromatogram comparing the wild-type control and a homozygous practice clone. The intended CGC to TGC change is purple; silent blocking changes are orange. Guide positions, cut sites, base calls, and protein residues are shown."></a><figcaption><span><span class="legend-dot intended"></span>Intended edit <span class="legend-dot blocking"></span>Silent blocking changes</span><div class="figure-links"><a href="./assets/assured-apoe-chromatogram.svg" target="_blank" rel="noopener noreferrer">View full size ↗</a><a href="./assets/assured-apoe-chromatogram.svg" download>Download SVG ↓</a></div></figcaption></figure>
</section>
</main>
<footer class="site-footer"><div><strong>Dr. Narasimha Swamy Telugu</strong><p>Creator of ASSURED · Teaching, training &amp; collaboration</p></div><nav aria-label="Contact and research profiles"><a href="https://scholar.google.com/citations?user=nN8TOfMAAAAJ&amp;hl=en" target="_blank" rel="noopener noreferrer">Scholar ↗</a><a href="https://www.linkedin.com/in/narasimha-telugu-phd-b8386b26" target="_blank" rel="noopener noreferrer">LinkedIn ↗</a><a href="https://github.com/Narasimhat" target="_blank" rel="noopener noreferrer">GitHub ↗</a><a href="mailto:narasimhaswamy.telugu@gmail.com">Email</a><a href="https://wa.me/4917669336478" target="_blank" rel="noopener noreferrer" aria-label="WhatsApp +49 176 69336478">WhatsApp +49 176 69336478 ↗</a></nav></footer>
</body></html>`;
fs.writeFileSync(path.join(distDir, 'index.html'), homeHtml, 'utf8');
console.log('✓ Created ASSURED Bench and Academy landing page');
