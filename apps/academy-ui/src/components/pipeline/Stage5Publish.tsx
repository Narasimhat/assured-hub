import React, { useMemo, useRef, useState } from 'react';
import { BookOpen, Download, Copy, Check, Printer, ExternalLink, Layers, Award, FileText } from 'lucide-react';
import { AssuredProject, GuideRNA, QCCloneResult } from '../../types/pipeline';
import { DRAFT_NOTICE, PAPER_CITATION, PAPER_DOI_URL, buildLegendDraft, buildMethodsDraft } from '../../utils/draftText';

interface Stage5PublishProps {
  project: AssuredProject;
  onUpdateProject: (updated: AssuredProject) => void;
}

const W = 900;
const H = 660;
const COMP: Record<string, string> = { A: 'T', C: 'G', G: 'C', T: 'A' };
const revcomp = (s: string) => s.split('').reverse().map((c) => COMP[c] ?? 'N').join('');
const clip = (s: string, n: number) => (s.length > n ? `${s.slice(0, n - 1)}\u2026` : s);

const SEGMENTS: { key: string; label: string; colour: string; value: (c: QCCloneResult) => number }[] = [
  { key: 'edit', label: 'intended edit', colour: '#059669', value: (c) => c.hdrPercentage },
  { key: 'block', label: 'blocking changes only', colour: '#f59e0b', value: (c) => c.blockingOnlyPercentage ?? 0 },
  { key: 'indel', label: 'indel', colour: '#dc2626', value: (c) => c.indelPercentage },
  { key: 'wt', label: 'wild type', colour: '#94a3b8', value: (c) => c.wtPercentage },
];

export const Stage5Publish: React.FC<Stage5PublishProps> = ({ project }) => {
  const [copiedMethods, setCopiedMethods] = useState(false);
  const [copiedLegend, setCopiedLegend] = useState(false);
  const [isExportingPng, setIsExportingPng] = useState(false);
  const svgRef = useRef<SVGSVGElement | null>(null);

  const target = project.target;
  const isKnockout = target.targetType === 'KNOCKOUT' || !target.donor?.sequence;
  const methods = useMemo(() => buildMethodsDraft(project), [project]);
  const legend = useMemo(() => buildLegendDraft(project), [project]);
  const clones = project.clones.slice(0, 8);

  // Panel A geometry: the 100-nt window drawn at one fixed scale, with each guide located in the actual sequence.
  const win = (target.targetSequence5to3 || '').toUpperCase();
  const x0 = 60;
  const px = 780 / Math.max(win.length, 1);
  const centre = target.windowCentreIndex ?? Math.floor(win.length / 2);
  const placed = target.guides.slice(0, 4).map((g: GuideRNA) => {
    const seq = g.sequence.toUpperCase();
    if (g.strand === '+') {
      const i = win.indexOf(seq);
      return { g, loc: i < 0 ? null : { start: i, pamStart: i + 20, cut: i + 17 } };
    }
    const i = win.indexOf(revcomp(seq));
    return { g, loc: i < 0 ? null : { start: i, pamStart: i - 3, cut: i + 3 } };
  });

  const download = (name: string, blob: Blob) => {
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = name;
    a.click();
    URL.revokeObjectURL(url);
  };

  const handleCopy = (text: string, set: (v: boolean) => void) => {
    navigator.clipboard.writeText(text);
    set(true);
    setTimeout(() => set(false), 2000);
  };

  const handleDownloadSvg = () => {
    const svgEl = svgRef.current;
    if (!svgEl) return;
    download(`Figure1_${target.gene}_draft.svg`, new Blob([new XMLSerializer().serializeToString(svgEl)], { type: 'image/svg+xml;charset=utf-8' }));
  };

  const handleDownloadPng = () => {
    const svgEl = svgRef.current;
    if (!svgEl) return;
    setIsExportingPng(true);
    const blobURL = URL.createObjectURL(new Blob([new XMLSerializer().serializeToString(svgEl)], { type: 'image/svg+xml;charset=utf-8' }));
    const img = new Image();
    img.onload = () => {
      const scale = 2.5;
      const canvas = document.createElement('canvas');
      canvas.width = W * scale;
      canvas.height = H * scale;
      const ctx = canvas.getContext('2d');
      if (ctx) {
        ctx.scale(scale, scale);
        ctx.fillStyle = '#ffffff';
        ctx.fillRect(0, 0, W, H);
        ctx.drawImage(img, 0, 0, W, H);
        const a = document.createElement('a');
        a.href = canvas.toDataURL('image/png');
        a.download = `Figure1_${target.gene}_draft.png`;
        a.click();
      }
      URL.revokeObjectURL(blobURL);
      setIsExportingPng(false);
    };
    img.onerror = () => {
      URL.revokeObjectURL(blobURL);
      setIsExportingPng(false);
    };
    img.src = blobURL;
  };

  return (
    <div className="space-y-6 animate-in fade-in duration-200">
      <div className="p-6 rounded-3xl bg-slate-900 border border-slate-800 space-y-2">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2 text-xs font-bold uppercase tracking-wider text-cyan-400">
            <BookOpen className="w-4 h-4" />
            <span>Stage 5: Figure and methods draft</span>
          </div>
          <span className="text-xs text-slate-400 font-mono">Vector SVG &bull; PNG &bull; drawn from this project&apos;s data</span>
        </div>
        <h2 className="text-2xl font-black text-white">Draft figure for {target.gene}</h2>
        <p className="text-xs text-slate-300 leading-relaxed max-w-3xl">
          The figure and the text are generated from the design and results held in this project. Nothing here has been reviewed, and the text is not a record of what you did at the bench. Fill the bracketed fields and check each statement against your own notes.
        </p>
      </div>

      <div className="p-4 rounded-2xl bg-slate-950 border border-slate-800 flex flex-wrap items-center justify-between gap-3">
        <div className="flex items-center gap-2 text-xs text-slate-300 font-semibold">
          <Layers className="w-4 h-4 text-cyan-400" />
          <span>Figure 1 draft: panels A, B (placeholder), C, D</span>
        </div>
        <div className="flex flex-wrap items-center gap-2">
          <button onClick={handleDownloadSvg} className="flex items-center gap-1.5 px-3.5 py-2 rounded-xl bg-cyan-500 hover:bg-cyan-400 text-slate-950 text-xs font-bold transition-all shadow-md shadow-cyan-500/20">
            <Download className="w-3.5 h-3.5" />
            <span>Download SVG</span>
          </button>
          <button onClick={handleDownloadPng} disabled={isExportingPng} className="flex items-center gap-1.5 px-3.5 py-2 rounded-xl bg-emerald-500 hover:bg-emerald-400 text-slate-950 text-xs font-bold transition-all shadow-md shadow-emerald-500/20 disabled:opacity-50">
            <Download className="w-3.5 h-3.5" />
            <span>{isExportingPng ? 'Exporting...' : 'Download PNG'}</span>
          </button>
          <button onClick={() => window.print()} className="flex items-center gap-1.5 px-3.5 py-2 rounded-xl bg-slate-900 hover:bg-slate-800 border border-slate-700 text-slate-200 text-xs font-bold transition-colors">
            <Printer className="w-3.5 h-3.5 text-slate-400" />
            <span>Print / PDF</span>
          </button>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
        <div className="lg:col-span-8 space-y-6">
          <div className="p-6 rounded-2xl bg-white text-slate-950 shadow-2xl overflow-x-auto border border-slate-200">
            <svg ref={svgRef} xmlns="http://www.w3.org/2000/svg" viewBox={`0 0 ${W} ${H}`} className="w-full h-auto max-w-full font-sans" style={{ backgroundColor: '#ffffff' }}>
              <text x="30" y="30" fontSize="15" fontWeight="bold" fill="#0f172a">
                Figure 1 (draft). {target.gene}: design and Sanger QC of single-cell clones
              </text>

              {/* Panel A: the target window, drawn at one scale, with guides located in the real sequence */}
              <g id="panel-a">
                <rect x="30" y="45" width="840" height="150" rx="8" fill="#f8fafc" stroke="#cbd5e1" />
                <text x="45" y="66" fontSize="14" fontWeight="bold" fill="#0f172a">A</text>
                <text x="65" y="66" fontSize="11" fontWeight="bold" fill="#475569">
                  {win.length}-nt window ({isKnockout ? 'centred on the inferred cut' : 'centred on the edited base'})
                </text>
                <text x="855" y="66" fontSize="10" fill="#64748b" fontFamily="monospace" textAnchor="end">{clip(target.genomicCoordinate, 60)}</text>
                <text x={x0} y="110" fontSize="10" fontFamily="monospace" fill="#0f172a" textLength={px * win.length} lengthAdjust="spacing">{win}</text>
                {Array.from({ length: Math.floor(win.length / 10) + 1 }, (_, k) => k * 10).map((i) => (
                  <text key={i} x={x0 + (i + 0.5) * px} y="126" fontSize="8" fill="#94a3b8" textAnchor="middle">{i - centre}</text>
                ))}
                <line x1={x0 + (centre + 0.5) * px} y1="90" x2={x0 + (centre + 0.5) * px} y2="116" stroke={isKnockout ? '#dc2626' : '#0284c7'} strokeWidth="2" />
                <text x={x0 + (centre + 0.5) * px} y="86" fontSize="9" fontWeight="bold" fill={isKnockout ? '#dc2626' : '#0284c7'} textAnchor="middle">
                  {isKnockout ? 'inferred cut' : target.aminoAcidChange}
                </text>
                {placed.map(({ g, loc }, i) => {
                  const y = 134 + i * 14;
                  if (!loc) return <text key={g.id} x={x0} y={y + 8} fontSize="8" fill="#b91c1c">{g.name}: sequence not found in this window</text>;
                  return (
                    <g key={g.id}>
                      <rect x={x0 + loc.start * px} y={y} width={20 * px} height="9" fill="#0f766e" />
                      <rect x={x0 + loc.pamStart * px} y={y} width={3 * px} height="9" fill="#f59e0b" />
                      <text x={x0 + loc.start * px + 3} y={y + 7} fontSize="7" fill="#ffffff">{clip(g.name, 24)}</text>
                      <line x1={x0 + loc.cut * px} y1={y - 2} x2={x0 + loc.cut * px} y2={y + 11} stroke="#dc2626" strokeWidth="1.5" />
                    </g>
                  );
                })}
                <text x="855" y="190" fontSize="8" fill="#64748b" textAnchor="end">teal: protospacer &bull; amber: PAM &bull; red: cut &bull; numbers: bp from the window centre</text>
              </g>

              {/* Panel B: this app does not draw Sanger traces */}
              <g id="panel-b">
                <rect x="30" y="205" width="840" height="58" rx="8" fill="#ffffff" stroke="#cbd5e1" strokeDasharray="5 4" />
                <text x="45" y="226" fontSize="14" fontWeight="bold" fill="#0f172a">B</text>
                <text x="65" y="226" fontSize="11" fontWeight="bold" fill="#475569">Sanger traces: placeholder</text>
                <text x="65" y="246" fontSize="10" fill="#64748b">This workbench does not draw traces for figures. Export the alignment and trace panels from the Assured QC report and place them here.</text>
              </g>

              {/* Panel C: allele composition per clone, from the numbers the analysis reported */}
              <g id="panel-c">
                <rect x="30" y="273" width="840" height="190" rx="8" fill="#f8fafc" stroke="#cbd5e1" />
                <text x="45" y="294" fontSize="14" fontWeight="bold" fill="#0f172a">C</text>
                <text x="65" y="294" fontSize="11" fontWeight="bold" fill="#475569">Allele composition per clone (% of signal)</text>
                {SEGMENTS.map((s, i) => (
                  <g key={s.key} transform={`translate(${470 + i * 100}, 284)`}>
                    <rect width="9" height="9" fill={s.colour} />
                    <text x="13" y="8" fontSize="8" fill="#475569">{s.label === 'blocking changes only' ? 'blocking only' : s.label}</text>
                  </g>
                ))}
                {clones.length === 0 && <text x="65" y="340" fontSize="10" fill="#64748b">No clone data in this project.</text>}
                {clones.map((c, row) => {
                  const y = 308 + row * 18;
                  let x = 200;
                  const parts = SEGMENTS.map((s) => ({ s, v: Math.max(0, s.value(c)) }));
                  const total = parts.reduce((a, p) => a + p.v, 0);
                  const scale = total > 100 ? 100 / total : 1;
                  return (
                    <g key={c.cloneId}>
                      <text x="45" y={y + 10} fontSize="9" fontFamily="monospace" fill="#0f172a">{clip(c.cloneId, 24)}</text>
                      <rect x="200" y={y} width="620" height="13" fill="#e2e8f0" />
                      {parts.map((p) => {
                        const w = (p.v * scale * 620) / 100;
                        const rect = w > 0 ? <rect key={p.s.key} x={x} y={y} width={w} height="13" fill={p.s.colour} /> : null;
                        x += w;
                        return rect;
                      })}
                      <text x="826" y={y + 10} fontSize="8" fill="#64748b">{Math.round(Math.min(100, total))}%</text>
                    </g>
                  );
                })}
                {clones.length > 0 && <text x="200" y="455" fontSize="8" fill="#64748b">Grey is signal the analysis could not assign. Values are as reported by the source of each call (see panel D).</text>}
              </g>

              {/* Panel D: per-clone call, decision, fit */}
              <g id="panel-d">
                <rect x="30" y="473" width="840" height="175" rx="8" fill="#ffffff" stroke="#cbd5e1" />
                <text x="45" y="494" fontSize="14" fontWeight="bold" fill="#0f172a">D</text>
                <text x="65" y="494" fontSize="11" fontWeight="bold" fill="#475569">Clone calls</text>
                {clones.length === 0 ? (
                  <text x="65" y="520" fontSize="10" fill="#64748b">No clone data in this project.</text>
                ) : (
                  <>
                    {[['Clone', 45], ['Call', 190], ['Decision', 470], ['Confidence', 550], ['Fit R2', 630], ['Lab pipeline', 690]].map(([label, x]) => (
                      <text key={label as string} x={x as number} y="512" fontSize="9" fontWeight="bold" fill="#334155">{label}</text>
                    ))}
                    {clones.map((c, row) => {
                      const y = 530 + row * 14;
                      return (
                        <g key={c.cloneId}>
                          <text x="45" y={y} fontSize="8" fontFamily="monospace" fill="#0f172a">{clip(c.cloneId, 22)}</text>
                          <text x="190" y={y} fontSize="8" fill="#0f172a">{clip(c.statusLabel, 48)}</text>
                          <text x="470" y={y} fontSize="8" fill="#0f172a">{c.engineDecision ?? 'n/a'}</text>
                          <text x="550" y={y} fontSize="8" fill="#0f172a">{c.engineConfidence ?? 'n/a'}</text>
                          <text x="630" y={y} fontSize="8" fontFamily="monospace" fill="#0f172a">{c.r2ModelFit !== undefined ? c.r2ModelFit.toFixed(3) : 'n/a'}</text>
                          <text x="690" y={y} fontSize="8" fill="#0f172a">{c.labCall ? clip(c.labCall.recommendation, 24) : '\u2014'}</text>
                        </g>
                      );
                    })}
                  </>
                )}
                {project.clones.length > clones.length && <text x="45" y="642" fontSize="8" fill="#64748b">+{project.clones.length - clones.length} more clones not drawn</text>}
              </g>
            </svg>
          </div>
        </div>

        <div className="lg:col-span-4 space-y-5">
          <div className="p-4 rounded-2xl bg-gradient-to-br from-cyan-950/40 to-slate-900 border border-cyan-800/50 space-y-2">
            <div className="flex items-center gap-2 text-xs font-bold uppercase tracking-wider text-cyan-400">
              <Award className="w-4 h-4 text-cyan-400" />
              <span>Protocol citation</span>
            </div>
            <p className="text-[11px] text-slate-300 leading-relaxed">{PAPER_CITATION}</p>
            <a href={PAPER_DOI_URL} target="_blank" rel="noreferrer" className="text-[11px] text-cyan-400 hover:underline flex items-center gap-1 font-semibold pt-1">
              <span>Open the paper (DOI)</span>
              <ExternalLink className="w-3 h-3" />
            </a>
          </div>

          <div className="p-5 rounded-2xl bg-slate-900 border border-slate-800 space-y-3">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2 text-xs font-bold uppercase tracking-wider text-slate-300">
                <FileText className="w-4 h-4 text-emerald-400" />
                <span>Methods draft</span>
              </div>
              <button onClick={() => handleCopy(methods, setCopiedMethods)} className="text-xs text-cyan-400 hover:text-cyan-300 flex items-center gap-1 font-semibold">
                {copiedMethods ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5" />}
                <span>{copiedMethods ? 'Copied' : 'Copy'}</span>
              </button>
            </div>
            <p className="text-[10px] text-amber-300/90 leading-relaxed">{DRAFT_NOTICE}</p>
            <div className="p-3.5 rounded-xl bg-slate-950 border border-slate-800 text-[11px] text-slate-300 font-mono leading-relaxed max-h-72 overflow-y-auto whitespace-pre-wrap select-all">{methods}</div>
          </div>

          <div className="p-5 rounded-2xl bg-slate-900 border border-slate-800 space-y-3">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2 text-xs font-bold uppercase tracking-wider text-slate-300">
                <FileText className="w-4 h-4 text-cyan-400" />
                <span>Figure legend draft</span>
              </div>
              <button onClick={() => handleCopy(legend, setCopiedLegend)} className="text-xs text-cyan-400 hover:text-cyan-300 flex items-center gap-1 font-semibold">
                {copiedLegend ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5" />}
                <span>{copiedLegend ? 'Copied' : 'Copy'}</span>
              </button>
            </div>
            <div className="p-3.5 rounded-xl bg-slate-950 border border-slate-800 text-[11px] text-slate-300 leading-relaxed max-h-56 overflow-y-auto whitespace-pre-wrap select-all">{legend}</div>
          </div>
        </div>
      </div>
    </div>
  );
};
