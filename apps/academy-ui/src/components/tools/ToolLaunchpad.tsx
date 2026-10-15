import React, { useState } from 'react';
import { 
  Sparkles, 
  ExternalLink, 
  Terminal, 
  Download, 
  Check, 
  FileCode, 
  Layers, 
  ArrowRight,
  Database
} from 'lucide-react';
import { SAMPLE_DATASETS } from '../../data/sampleDatasets';
import { SampleDataset } from '../../types';

export const ToolLaunchpad: React.FC = () => {
  const categories: { key: SampleDataset['category']; title: string; blurb: string }[] = [
    { key: 'Design-Report', title: 'Design hand-offs', blurb: 'Open one in Assured QC together with the matching traces.' },
    { key: 'Sanger-AB1', title: 'Real Sanger traces', blurb: 'From the lab runs. The control is the unedited line for that run.' },
    { key: 'GenBank-Ref', title: 'Reference records', blurb: 'The RefSeqGene records the designs were built on.' },
    { key: 'Results-Table', title: 'Result tables', blurb: 'The lab\'s own tables, Assured QC compared with the lab, and the GRCh38 checks.' },
  ];
  const mb = (b: number) => (b >= 1e6 ? `${(b / 1e6).toFixed(1)} MB` : `${Math.max(1, Math.round(b / 1e3))} kB`);

  return (
    <div className="space-y-8 animate-in fade-in duration-300">
      
      {/* Top Banner */}
      <div className="p-6 sm:p-8 rounded-3xl bg-gradient-to-r from-blue-950/60 via-slate-900 to-slate-900 border border-blue-800/60 shadow-2xl space-y-3">
        <div className="flex items-center gap-2">
          <span className="text-xs font-bold uppercase tracking-wider text-blue-400 bg-blue-950 border border-blue-800 px-2.5 py-0.5 rounded-full flex items-center gap-1.5">
            <Sparkles className="w-3.5 h-3.5" />
            <span>Unified Production Suite</span>
          </span>
          <span className="text-xs text-slate-400">STAR Protocols Ecosystem</span>
        </div>
        <h1 className="text-2xl sm:text-3xl font-black text-white tracking-tight">
          ASSURED Ecosystem Hub
        </h1>
        <p className="text-sm text-slate-300 leading-relaxed max-w-3xl">
          Connect directly to your production tools deployed on Vercel or run them locally inside this cloned workspace. Download pre-configured design files and simulated Sanger traces from the fixtures test suite to immediately test deconvolution algorithms.
        </p>
      </div>

      {/* Production Web Tools Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        
        {/* Tool 1: ASSURED CRISPR Designer */}
        <div className="p-6 rounded-3xl bg-slate-900 border border-slate-800 flex flex-col justify-between space-y-6 hover:border-cyan-500/50 transition-all group">
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <div className="w-10 h-10 rounded-2xl bg-cyan-500/20 border border-cyan-500/40 flex items-center justify-center text-cyan-400 font-black">
                AC
              </div>
              <span className="text-[10px] font-mono text-cyan-400 bg-cyan-950 px-2 py-0.5 rounded border border-cyan-800/60 font-semibold">
                Design Engine
              </span>
            </div>

            <div>
              <h3 className="text-xl font-bold text-white group-hover:text-cyan-400 transition-colors">
                ASSURED CRISPR Designer
              </h3>
              <p className="text-xs text-slate-400 mt-1 leading-relaxed">
                Genome editing design, dual-guide selection, asymmetric ssODN donor formulation, silent PAM blocking, splice site screening, and vendor ordering exports in one clean workspace.
              </p>
            </div>

            <div className="p-3.5 rounded-xl bg-slate-950 border border-slate-800/80 space-y-1.5 font-mono text-xs">
              <div className="text-[10px] text-slate-500 uppercase font-bold">Local Terminal Runner</div>
              <div className="text-cyan-300 flex items-center gap-2">
                <Terminal className="w-3.5 h-3.5 text-slate-500" />
                <span>npm run dev:design</span>
              </div>
            </div>
          </div>

          <div className="flex flex-col gap-2">
            <a
              href="/design/"
              target="_blank"
              rel="noreferrer"
              className="w-full py-2.5 px-4 rounded-xl font-bold text-xs bg-cyan-500 hover:bg-cyan-400 text-slate-950 flex items-center justify-center gap-2 shadow-lg shadow-cyan-500/20 transition-all"
            >
              <span>Open Local Design App (/design/)</span>
              <ExternalLink className="w-3.5 h-3.5" />
            </a>
            <a
              href="https://assured-crispr-design.vercel.app"
              target="_blank"
              rel="noreferrer"
              className="w-full py-2 px-4 rounded-xl font-semibold text-[11px] bg-slate-950 hover:bg-slate-800 text-slate-400 hover:text-white border border-slate-800 flex items-center justify-center gap-1.5 transition-all"
            >
              <span>Vercel Cloud Version</span>
              <ExternalLink className="w-3 h-3" />
            </a>
          </div>
        </div>

        {/* Tool 2: Assured QC */}
        <div className="p-6 rounded-3xl bg-slate-900 border border-slate-800 flex flex-col justify-between space-y-6 hover:border-purple-500/50 transition-all group">
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <div className="w-10 h-10 rounded-2xl bg-purple-500/20 border border-purple-500/40 flex items-center justify-center text-purple-400 font-black">
                QC
              </div>
              <span className="text-[10px] font-mono text-purple-400 bg-purple-950 px-2 py-0.5 rounded border border-purple-800/60 font-semibold">
                Trace Deconvolution
              </span>
            </div>

            <div>
              <h3 className="text-xl font-bold text-white group-hover:text-purple-400 transition-colors">
                Assured QC
              </h3>
              <p className="text-xs text-slate-400 mt-1 leading-relaxed">
                Client-side Sanger chromatogram (.ab1) reading, non-negative least squares (NNLS) trace deconvolution, knockout indel calling, and homozygous knock-in clone classification.
              </p>
            </div>

            <div className="p-3.5 rounded-xl bg-slate-950 border border-slate-800/80 space-y-1.5 font-mono text-xs">
              <div className="text-[10px] text-slate-500 uppercase font-bold">Local Terminal Runner</div>
              <div className="text-purple-300 flex items-center gap-2">
                <Terminal className="w-3.5 h-3.5 text-slate-500" />
                <span>npm run dev:qc</span>
              </div>
            </div>
          </div>

          <div className="flex flex-col gap-2">
            <a
              href="/qc/"
              target="_blank"
              rel="noreferrer"
              className="w-full py-2.5 px-4 rounded-xl font-bold text-xs bg-purple-500 hover:bg-purple-400 text-slate-950 flex items-center justify-center gap-2 shadow-lg shadow-purple-500/20 transition-all"
            >
              <span>Open Local QC App (/qc/)</span>
              <ExternalLink className="w-3.5 h-3.5" />
            </a>
            <a
              href="https://assured-qc.vercel.app"
              target="_blank"
              rel="noreferrer"
              className="w-full py-2 px-4 rounded-xl font-semibold text-[11px] bg-slate-950 hover:bg-slate-800 text-slate-400 hover:text-white border border-slate-800 flex items-center justify-center gap-1.5 transition-all"
            >
              <span>Vercel Cloud Version</span>
              <ExternalLink className="w-3 h-3" />
            </a>
          </div>
        </div>

      </div>

      {/* Fixture Test Datasets for Students & Researchers */}
      <div className="p-6 sm:p-8 rounded-3xl bg-slate-900 border border-slate-800 space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <div className="flex items-center gap-2 text-xs font-bold uppercase tracking-wider text-cyan-400">
              <Database className="w-4 h-4" />
              <span>Training datasets</span>
            </div>
            <h3 className="text-lg font-bold text-white mt-1">
              Real traces, designs and reference records
            </h3>
            <p className="text-xs text-slate-400 mt-0.5">
              Every file below is generated from a file in this repository: the lab&apos;s real traces, the verified designs, and the GenBank records. Sizes and sha256 prefixes are shown so you can check what you downloaded.
            </p>
          </div>
        </div>

        {categories.map((cat) => {
          const items = SAMPLE_DATASETS.filter((d) => d.category === cat.key);
          if (items.length === 0) return null;
          return (
            <div key={cat.key} className="space-y-3">
              <div>
                <h4 className="text-xs font-bold uppercase tracking-wider text-slate-300">{cat.title} <span className="text-slate-500 font-mono">({items.length})</span></h4>
                <p className="text-[11px] text-slate-500">{cat.blurb}</p>
              </div>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                {items.map((ds) => (
                  <div key={ds.id} className="p-4 rounded-2xl bg-slate-950 border border-slate-800 flex flex-col justify-between gap-3">
                    <div className="space-y-2">
                      <div className="flex items-center justify-between">
                        <span className="text-[10px] font-mono text-cyan-400 bg-slate-900 px-2 py-0.5 rounded border border-slate-800">{ds.category}</span>
                        <FileCode className="w-4 h-4 text-slate-600" />
                      </div>
                      <h4 className="text-sm font-bold text-white leading-snug">{ds.name}</h4>
                      <p className="text-xs text-slate-400 leading-relaxed">{ds.description}</p>
                      <p className="text-[10px] font-mono text-slate-600 break-all">{mb(ds.bytes)} &bull; sha256 {ds.sha256.slice(0, 12)}&hellip;</p>
                    </div>
                    <a
                      href={ds.url}
                      download={ds.downloadFilename}
                      className="w-full py-2 px-3 rounded-xl text-xs font-bold flex items-center justify-center gap-2 transition-all bg-slate-900 hover:bg-slate-800 border border-slate-800 hover:border-slate-700 text-slate-200"
                    >
                      <Download className="w-3.5 h-3.5" />
                      <span className="truncate">Download {ds.downloadFilename}</span>
                    </a>
                  </div>
                ))}
              </div>
            </div>
          );
        })}

        {/* Quick Instructions */}
        <div className="p-4 rounded-xl bg-slate-950 border border-slate-800/80 text-xs text-slate-400 leading-relaxed flex items-start gap-3">
          <Layers className="w-4 h-4 text-cyan-400 shrink-0 mt-0.5" />
          <div>
            <strong className="text-slate-200">How to practice in Assured QC:</strong> download <code className="text-cyan-300 font-mono">apoe_r176c_run.reconstructed.design.json</code>, <code className="text-cyan-300 font-mono">Ctrl.ab1</code> and the five <code className="text-cyan-300 font-mono">APOE_G1_*.ab1</code> traces, then open <a href="https://assured-qc.vercel.app" target="_blank" rel="noreferrer" className="text-cyan-400 underline">Assured QC</a> and load the design, the control and the clones. In the command-line run of the same engine, A1, A5 and B2 are called homozygous for the intended edit, A3 homozygous for a 13 bp deletion, and A2 mixed (re-sequence). Compare your result with <code className="text-cyan-300 font-mono">comparison.csv</code>.
          </div>
        </div>
      </div>

    </div>
  );
};
