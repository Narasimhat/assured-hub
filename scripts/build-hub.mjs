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

// Two entry points: the experiment workspace and the learning area.
const homeHtml = `<!doctype html>
<html lang="en"><head><meta charset="UTF-8">
<meta name="viewport" content="width=device-width, initial-scale=1.0">
<meta name="description" content="ASSURED Academy for teaching, training, and learning. ASSURED Bench for genome editing experiments.">
<title>ASSURED — Academy &amp; Bench</title>
<style>
*{box-sizing:border-box}body{margin:0;background:#0f172a;color:#f8fafc;font-family:system-ui,-apple-system,sans-serif;line-height:1.6}header,main,footer{max-width:1100px;margin:auto;padding:28px}header{font-weight:750;letter-spacing:.06em}main{padding-top:65px;padding-bottom:80px}.eyebrow{color:#94a3b8;font-size:14px;letter-spacing:.12em;text-transform:uppercase}h1{font-size:clamp(36px,6vw,60px);line-height:1.12;letter-spacing:-.04em;max-width:800px;margin:18px 0}p{color:#94a3b8}.intro{font-size:18px;max-width:650px}.choices{display:grid;grid-template-columns:1fr 1fr;gap:24px;margin-top:45px}article{background:#1e293b;border:1px solid #334155;border-radius:20px;padding:32px;display:flex;flex-direction:column}h2{font-size:28px;margin:12px 0}.label{color:#38bdf8;font-size:13px;font-weight:700;text-transform:uppercase;letter-spacing:.08em}.learn .label{color:#6ee7b7}.action{display:inline-block;align-self:flex-start;margin-top:auto;padding:12px 20px;border-radius:10px;background:#38bdf8;color:#082f49;text-decoration:none;font-weight:700}.learn .action{background:#6ee7b7;color:#064e3b}article p{margin-bottom:28px}a:focus-visible{outline:3px solid #f8fafc;outline-offset:4px}a:hover{filter:brightness(1.1)}footer{border-top:1px solid #334155;color:#64748b;font-size:13px}@media(max-width:650px){.choices{grid-template-columns:1fr}main{padding-top:30px}article{padding:24px}}
.contact{margin-top:48px;padding:28px 0 0;border-top:1px solid #334155}.contact h2{font-size:24px}.contact-links{display:flex;flex-wrap:wrap;gap:12px;margin:20px 0 0}.contact-links a{color:#bae6fd;text-decoration:none;border:1px solid #334155;border-radius:10px;padding:10px 14px;overflow-wrap:anywhere}.contact-links a:hover{background:#1e293b}
</style></head><body>
<header>ASSURED</header>
<main><div class="eyebrow">Genome engineering · Learn, practice, apply</div>
<h1>Learn. Practice. Apply.</h1>
<p class="intro">Learn with ASSURED Academy, then design, analyse, and validate your edits with ASSURED Bench.</p>
<section class="choices" aria-label="Choose your workspace">
<article class="learn"><span class="label">Teaching · Training · Learning</span><h2>ASSURED Academy</h2><p>Learn genome editing through curriculum lessons, quizzes, and demonstrations.</p><a class="action" href="./academy/">Explore Academy →</a></article>
<article><span class="label">Experiments</span><h2>ASSURED Bench</h2><p>Design, analyse, and validate your edits. Plan reagents, review Sanger traces, and select clones in one workspace.</p><a class="action" href="./studio/">Open ASSURED Bench →</a></article>
</section>
<section class="contact" aria-labelledby="contact-heading">
<div class="eyebrow">Creator &amp; contact</div>
<h2 id="contact-heading">Dr. Narasimha Swamy Telugu</h2>
<p>Get in touch about ASSURED, teaching, training, and collaboration.</p>
<nav class="contact-links" aria-label="Contact and research profiles">
<a href="https://scholar.google.com/citations?user=nN8TOfMAAAAJ&amp;hl=en" target="_blank" rel="noopener noreferrer">Google Scholar ↗</a>
<a href="https://www.linkedin.com/in/narasimha-telugu-phd-b8386b26" target="_blank" rel="noopener noreferrer">LinkedIn ↗</a>
<a href="https://github.com/Narasimhat" target="_blank" rel="noopener noreferrer">GitHub ↗</a>
<a href="mailto:narasimhaswamy.telugu@gmail.com">narasimhaswamy.telugu@gmail.com</a>
<a href="https://wa.me/4917669336478" target="_blank" rel="noopener noreferrer">WhatsApp · +49 176 69336478 ↗</a>
</nav>
</section></main>
<footer>ASSURED · Academy &amp; Bench</footer>
</body></html>`;
fs.writeFileSync(path.join(distDir, 'index.html'), homeHtml, 'utf8');
console.log('✓ Created ASSURED Bench and Academy landing page');
