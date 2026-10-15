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

// Generate root index.html portal
const portalHtml = `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>ASSURED Suite — CRISPR Design, QC & Academy</title>
  <link rel="icon" type="image/svg+xml" href="data:image/svg+xml,<svg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 100 100'><text y='.9em' font-size='90'>🧬</text></svg>">
  <script src="https://cdn.tailwindcss.com"></script>
  <link rel="preconnect" href="https://fonts.googleapis.com">
  <link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
  <link href="https://fonts.googleapis.com/css2?family=Plus+Jakarta+Sans:wght@400;500;600;700;800;900&family=JetBrains+Mono:wght@400;600;700&display=swap" rel="stylesheet">
  <style>
    body { font-family: 'Plus Jakarta Sans', -apple-system, BlinkMacSystemFont, sans-serif; }
    code, pre { font-family: 'JetBrains Mono', monospace; }
  </style>
</head>
<body class="bg-slate-950 text-slate-100 min-h-screen flex flex-col antialiased selection:bg-cyan-500 selection:text-slate-950">
  <div class="fixed inset-0 pointer-events-none bg-[radial-gradient(ellipse_at_top,_var(--tw-gradient-stops))] from-cyan-900/20 via-slate-950/80 to-slate-950"></div>

  <header class="relative border-b border-slate-800/80 bg-slate-950/80 backdrop-blur-md sticky top-0 z-50">
    <div class="max-w-6xl mx-auto px-6 h-16 flex items-center justify-between">
      <div class="flex items-center gap-3">
        <div class="w-9 h-9 rounded-xl bg-gradient-to-tr from-cyan-500 via-blue-600 to-indigo-600 flex items-center justify-center font-black text-slate-950 shadow-md shadow-cyan-500/20">
          🧬
        </div>
        <div>
          <span class="font-extrabold text-white text-base tracking-tight">ASSURED</span>
          <span class="text-xs font-semibold text-cyan-400 ml-1.5 px-2 py-0.5 rounded-full bg-cyan-950/80 border border-cyan-800/50">Hub Suite</span>
        </div>
      </div>
      <div class="flex items-center gap-4 text-xs font-semibold">
        <a href="https://github.com/Narasimhat/assured-hub" target="_blank" rel="noopener" class="text-slate-400 hover:text-white transition-colors flex items-center gap-1.5">
          <span>GitHub</span>
          <svg class="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14"/></svg>
        </a>
        <a href="https://www.cell.com/star-protocols/fulltext/S2666-1667(23)00373-8" target="_blank" rel="noopener" class="text-slate-400 hover:text-white transition-colors flex items-center gap-1.5">
          <span>STAR Protocols</span>
          <svg class="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14"/></svg>
        </a>
      </div>
    </div>
  </header>

  <main class="relative max-w-6xl mx-auto px-6 py-12 flex-1 w-full space-y-12">
    <div class="text-center max-w-3xl mx-auto space-y-4">
      <div class="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-cyan-950/60 border border-cyan-800/40 text-cyan-400 text-xs font-semibold">
        <span class="w-2 h-2 rounded-full bg-cyan-400 animate-pulse"></span>
        <span>Cell Press STAR Protocols Validated Pipeline</span>
      </div>
      <h1 class="text-4xl sm:text-5xl font-black text-white tracking-tight leading-tight">
        The ASSURED CRISPR Hub
      </h1>
      <p class="text-slate-400 text-sm sm:text-base leading-relaxed">
        An end-to-end suite for precision CRISPR knockout, SNP knock-in, and tag insertions in human pluripotent stem cells (hiPSCs), developed at MDC Berlin.
      </p>
    </div>

    <div class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 items-stretch">
      <div class="p-6 rounded-3xl bg-slate-900/80 border border-purple-500/40 hover:border-purple-400 transition-all flex flex-col justify-between group shadow-lg hover:shadow-purple-500/20 relative overflow-hidden">
        <div class="absolute top-0 right-0 bg-purple-600/30 text-purple-300 text-[10px] font-bold px-3 py-1 rounded-bl-xl border-l border-b border-purple-500/30 uppercase tracking-wider">
          Unified Studio
        </div>
        <div class="space-y-4">
          <div class="w-12 h-12 rounded-2xl bg-purple-950 border border-purple-800/60 flex items-center justify-center text-xl text-purple-400 group-hover:scale-105 transition-transform">
            ⚡
          </div>
          <div>
            <h3 class="text-lg font-bold text-white group-hover:text-purple-400 transition-colors">
              Assured Studio
            </h3>
            <p class="text-xs text-slate-400 mt-1 leading-relaxed">
              Complete end-to-end studio: in-silico design, vendor carts, in-silico PCR gel simulator, wet-lab bench protocol, and 96-well Sanger QC.
            </p>
          </div>
          <div class="space-y-1.5 pt-2 border-t border-slate-800/60 text-[11px] text-slate-400 font-mono">
            <div class="flex items-center gap-1.5">✓ Virtual PCR gel simulator</div>
            <div class="flex items-center gap-1.5">✓ 96-well microplate heatmap</div>
            <div class="flex items-center gap-1.5">✓ Wet-lab protocol & checklist</div>
          </div>
        </div>
        <div class="pt-6">
          <a href="./studio/" class="w-full py-2.5 px-4 rounded-xl font-bold text-xs bg-gradient-to-r from-purple-500 to-indigo-500 hover:from-purple-400 hover:to-indigo-400 text-white flex items-center justify-center gap-2 shadow-md shadow-purple-500/25 transition-all">
            <span>Launch Studio App</span>
            <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M14 5l7 7m0 0l-7 7m7-7H3"/></svg>
          </a>
        </div>
      </div>

      <div class="p-6 rounded-3xl bg-slate-900/80 border border-slate-800 hover:border-cyan-500/50 transition-all flex flex-col justify-between group shadow-lg hover:shadow-cyan-500/10">
        <div class="space-y-4">
          <div class="w-12 h-12 rounded-2xl bg-cyan-950 border border-cyan-800/60 flex items-center justify-center text-xl text-cyan-400 group-hover:scale-105 transition-transform">
            📐
          </div>
          <div>
            <h3 class="text-lg font-bold text-white group-hover:text-cyan-400 transition-colors">
              Assured CRISPR Design
            </h3>
            <p class="text-xs text-slate-400 mt-1 leading-relaxed">
              Design SpCas9 guide pairs, asymmetric ssODN donor templates (36/91 nt arms), silent PAM shields, and vendor order sheets for IDT & Synthego.
            </p>
          </div>
          <div class="space-y-1.5 pt-2 border-t border-slate-800/60 text-[11px] text-slate-400 font-mono">
            <div class="flex items-center gap-1.5">✓ Dual-guide redundancy</div>
            <div class="flex items-center gap-1.5">✓ Synonymous PAM locks</div>
            <div class="flex items-center gap-1.5">✓ PTO modified ssODN</div>
          </div>
        </div>
        <div class="pt-6">
          <a href="./design/" class="w-full py-2.5 px-4 rounded-xl font-bold text-xs bg-cyan-500 hover:bg-cyan-400 text-slate-950 flex items-center justify-center gap-2 shadow-md shadow-cyan-500/20 transition-all">
            <span>Launch Design App</span>
            <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M14 5l7 7m0 0l-7 7m7-7H3"/></svg>
          </a>
        </div>
      </div>

      <div class="p-6 rounded-3xl bg-slate-900/80 border border-slate-800 hover:border-emerald-500/50 transition-all flex flex-col justify-between group shadow-lg hover:shadow-emerald-500/10">
        <div class="space-y-4">
          <div class="w-12 h-12 rounded-2xl bg-emerald-950 border border-emerald-800/60 flex items-center justify-center text-xl text-emerald-400 group-hover:scale-105 transition-transform">
            🔬
          </div>
          <div>
            <h3 class="text-lg font-bold text-white group-hover:text-emerald-400 transition-colors">
              Assured QC
            </h3>
            <p class="text-xs text-slate-400 mt-1 leading-relaxed">
              In-browser Sanger chromatogram (.ab1) deconvolution engine. Reads 4-color fluorescence peaks, calls zygosity, and screens 96-well clone plates.
            </p>
          </div>
          <div class="space-y-1.5 pt-2 border-t border-slate-800/60 text-[11px] text-slate-400 font-mono">
            <div class="flex items-center gap-1.5">✓ Client-side ABIF parser</div>
            <div class="flex items-center gap-1.5">✓ Traffic-light clone calling</div>
            <div class="flex items-center gap-1.5">✓ 96-well plate heatmap</div>
          </div>
        </div>
        <div class="pt-6">
          <a href="./qc/" class="w-full py-2.5 px-4 rounded-xl font-bold text-xs bg-emerald-500 hover:bg-emerald-400 text-slate-950 flex items-center justify-center gap-2 shadow-md shadow-emerald-500/20 transition-all">
            <span>Launch QC App</span>
            <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M14 5l7 7m0 0l-7 7m7-7H3"/></svg>
          </a>
        </div>
      </div>

      <div class="p-6 rounded-3xl bg-slate-900/80 border border-slate-800 hover:border-amber-500/50 transition-all flex flex-col justify-between group shadow-lg hover:shadow-amber-500/10">
        <div class="space-y-4">
          <div class="w-12 h-12 rounded-2xl bg-amber-950 border border-amber-800/60 flex items-center justify-center text-xl text-amber-400 group-hover:scale-105 transition-transform">
            🎓
          </div>
          <div>
            <h3 class="text-lg font-bold text-white group-hover:text-amber-400 transition-colors">
              ASSURED Studio (Academy & Workbench)
            </h3>
            <p class="text-xs text-slate-400 mt-1 leading-relaxed">
              The unified 5-stage interactive lab bench companion and Khan Academy-style curriculum for stem cell biology and frugal gene editing.
            </p>
          </div>
          <div class="space-y-1.5 pt-2 border-t border-slate-800/60 text-[11px] text-slate-400 font-mono">
            <div class="flex items-center gap-1.5">✓ 5-Stage unified pipeline</div>
            <div class="flex items-center gap-1.5">✓ Guided & Pro mode switch</div>
            <div class="flex items-center gap-1.5">✓ Ensembl + CFD cutting matrix</div>
          </div>
        </div>
        <div class="pt-6">
          <a href="./academy/" class="w-full py-2.5 px-4 rounded-xl font-bold text-xs bg-gradient-to-r from-amber-500 to-emerald-500 hover:opacity-95 text-slate-950 flex items-center justify-center gap-2 shadow-md shadow-amber-500/20 transition-all">
            <span>Open Studio Workbench</span>
            <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M14 5l7 7m0 0l-7 7m7-7H3"/></svg>
          </a>
        </div>
      </div>
    </div>

    <div class="p-6 rounded-2xl bg-slate-900 border border-slate-800 flex flex-col sm:flex-row items-center justify-between gap-4 text-xs">
      <div class="space-y-1">
        <div class="font-bold text-slate-200">Protocol Citation:</div>
        <div class="text-slate-400">
          Telugu et al., <em>ASSURED-optimized CRISPR protocol for knockout/SNP knockin in hiPSCs</em>. <strong>STAR Protocols</strong> (Cell Press), 2023. DOI: 10.1016/j.xpro.2023.102406
        </div>
      </div>
      <a href="https://doi.org/10.1016/j.xpro.2023.102406" target="_blank" rel="noopener" class="px-4 py-2 rounded-lg bg-slate-800 hover:bg-slate-700 text-white font-semibold whitespace-nowrap transition-colors">
        Read Paper
      </a>
    </div>
  </main>

  <footer class="border-t border-slate-900 bg-slate-950 py-6 text-center text-xs text-slate-500">
    <p>Max Delbrück Center for Molecular Medicine (MDC) in the Helmholtz Association • Berlin Institute of Health (BIH)</p>
  </footer>
</body>
</html>
`;

fs.writeFileSync(path.join(distDir, 'index.html'), portalHtml, 'utf8');
console.log('✓ Created dist/index.html hub portal');
