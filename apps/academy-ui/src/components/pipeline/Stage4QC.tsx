import React, { useState, useEffect, useRef } from 'react';
import { 
  Activity, 
  CheckCircle2, 
  AlertTriangle, 
  XCircle, 
  Upload, 
  ZoomIn, 
  ZoomOut, 
  FileSpreadsheet, 
  ShieldCheck, 
  Sparkles, 
  ArrowRight,
  ExternalLink,
  Layers,
  FileCheck2,
  FolderOpen,
  Eye,
  SlidersHorizontal,
  ChevronLeft,
  ChevronRight
} from 'lucide-react';
import { AssuredProject, CloneStatus, QCCloneResult } from '../../types/pipeline';
import { parseAbif, AbifTrace } from '../../utils/abifParser';
import { QC_ENGINE_VERSION } from '../../data/generated/presets.generated';

// One entry per status. Record<CloneStatus, ...> makes the compiler reject a status that has no styling.
const STATUS_STYLE: Record<CloneStatus, { label: string; chip: string; badge: string; plate: string; Icon: 'ok' | 'warn' | 'bad' | 'neutral' }> = {
  HOMOZYGOUS_KI: { label: 'Homozygous for the intended edit', chip: 'border-emerald-500 text-emerald-300 bg-emerald-950/40', badge: 'bg-emerald-500/20 text-emerald-400 border-emerald-500/40', plate: 'bg-emerald-500', Icon: 'ok' },
  HETEROZYGOUS_KI: { label: 'Intended edit on one allele, wild type on the other', chip: 'border-amber-500 text-amber-300 bg-amber-950/40', badge: 'bg-amber-500/20 text-amber-400 border-amber-500/40', plate: 'bg-amber-500', Icon: 'warn' },
  INDEL_KO: { label: 'Homozygous indel', chip: 'border-rose-500 text-rose-300 bg-rose-950/40', badge: 'bg-rose-500/20 text-rose-400 border-rose-500/40', plate: 'bg-rose-500', Icon: 'bad' },
  WT_ESCAPEE: { label: 'Wild type', chip: 'border-slate-600 text-slate-300 bg-slate-900', badge: 'bg-slate-500/20 text-slate-300 border-slate-500/40', plate: 'bg-slate-400', Icon: 'neutral' },
  PARTIAL_CONVERSION: { label: 'Blocking changes without the intended edit', chip: 'border-orange-500 text-orange-300 bg-orange-950/40', badge: 'bg-orange-500/20 text-orange-300 border-orange-500/40', plate: 'bg-orange-500', Icon: 'bad' },
  EDIT_PLUS_OTHER: { label: 'Intended edit on one allele plus another change', chip: 'border-cyan-500 text-cyan-300 bg-cyan-950/40', badge: 'bg-cyan-500/20 text-cyan-300 border-cyan-500/40', plate: 'bg-cyan-500', Icon: 'warn' },
  HETEROZYGOUS_INDEL: { label: 'Indel on one allele, wild type on the other', chip: 'border-pink-500 text-pink-300 bg-pink-950/40', badge: 'bg-pink-500/20 text-pink-300 border-pink-500/40', plate: 'bg-pink-500', Icon: 'warn' },
  COMPOUND_HET: { label: 'Two different indels', chip: 'border-purple-500 text-purple-300 bg-purple-950/40', badge: 'bg-purple-500/20 text-purple-300 border-purple-500/40', plate: 'bg-purple-500', Icon: 'warn' },
  MIXED: { label: 'Mixed or unclear', chip: 'border-slate-500 text-slate-200 bg-slate-800', badge: 'bg-slate-500/20 text-slate-200 border-slate-500/40', plate: 'bg-slate-500', Icon: 'neutral' },
};

// Quote-aware CSV parser; strips a UTF-8 byte-order mark (the lab's CSVs carry one, which would otherwise hide the first header).
const parseCsv = (text: string): string[][] => {
  const src = text.replace(/^\uFEFF/, '');
  const rows: string[][] = [];
  let row: string[] = [];
  let cur = '';
  let quoted = false;
  for (let i = 0; i < src.length; i += 1) {
    const c = src[i];
    if (quoted) {
      if (c === '"') { if (src[i + 1] === '"') { cur += '"'; i += 1; } else quoted = false; } else cur += c;
    } else if (c === '"') quoted = true;
    else if (c === ',') { row.push(cur); cur = ''; }
    else if (c === '\n' || c === '\r') {
      if (c === '\r' && src[i + 1] === '\n') i += 1;
      row.push(cur); cur = '';
      if (row.length > 1 || row[0] !== '') rows.push(row);
      row = [];
    } else cur += c;
  }
  if (cur !== '' || row.length) { row.push(cur); rows.push(row); }
  return rows;
};

interface Stage4QCProps {
  project: AssuredProject;
  onUpdateProject: (updated: AssuredProject) => void;
  onProceed: () => void;
}

const CSV_RULE_NOTE =
  'Your file\'s own call is shown as written. The colour class comes from a simple rule on its percentages: 80% or more intended edit looks homozygous, 35% to 80% looks heterozygous, 70% or more indel looks like an indel, and under 35% of both looks wild type; anything else is mixed. That rule is this app\'s, not an analysis. Wells follow the clone number unless the sample name contains a well.';

export const Stage4QC: React.FC<Stage4QCProps> = ({
  project,
  onUpdateProject,
  onProceed
}) => {
  const clones = project.clones || [];
  const [selectedCloneId, setSelectedCloneId] = useState<string>(clones[0]?.cloneId || '');
  const [traceMessage, setTraceMessage] = useState<string | null>(null);
  const [activeTrace, setActiveTrace] = useState<AbifTrace | null>(null);
  const [controlTrace, setControlTrace] = useState<AbifTrace | null>(null);
  const [showControlOverlay, setShowControlOverlay] = useState(false);
  const [zoomLevel, setZoomLevel] = useState<number>(1.2);
  const [viewWindowOffset, setViewWindowOffset] = useState<number>(0); // base call offset
  const [visibleChannels, setVisibleChannels] = useState({ A: true, C: true, G: true, T: true });
  const [uploadError, setUploadError] = useState<string | null>(null);
  const [selectedWellHover, setSelectedWellHover] = useState<string | null>(null);
  const [isLoadingTrace, setIsLoadingTrace] = useState(false);

  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const selectedClone = clones.find(c => c.cloneId === selectedCloneId) || clones[0];

  // Fetch the clone's real trace. If there is none, or it cannot be loaded, say so: no trace is ever synthesised.
  useEffect(() => {
    setActiveTrace(null);
    if (!selectedClone) { setTraceMessage(null); return; }
    if (!selectedClone.ab1TraceUrl) {
      setTraceMessage('No trace file is attached to this clone. Use "View your own .ab1" to look at one.');
      setIsLoadingTrace(false);
      return;
    }
    setTraceMessage(null);
    setIsLoadingTrace(true);
    let cancelled = false;
    fetch(selectedClone.ab1TraceUrl)
      .then(res => {
        if (!res.ok) throw new Error(`HTTP ${res.status}`);
        return res.arrayBuffer();
      })
      .then(buffer => {
        if (cancelled) return;
        const parsed = parseAbif(buffer, selectedClone.cloneId);
        setActiveTrace(parsed);
        setUploadError(null);
        setIsLoadingTrace(false);
        // Centre on the edited base (knock-in) or the inferred cut (knockout) when the project records it.
        const centre = project.target.traceViewCentre;
        setViewWindowOffset(centre !== undefined ? Math.max(0, centre - 15) : Math.max(0, Math.min(100, parsed.peakLocations.length - 40)));
      })
      .catch(err => {
        if (cancelled) return;
        setTraceMessage(`The trace file could not be loaded (${err instanceof Error ? err.message : 'unknown error'}).`);
        setIsLoadingTrace(false);
      });
    return () => { cancelled = true; };
  }, [selectedCloneId, project.id]);

  // Load Control trace if available
  useEffect(() => {
    if (project.target.controlAb1Url) {
      fetch(project.target.controlAb1Url)
        .then(res => res.arrayBuffer())
        .then(buffer => {
          const parsed = parseAbif(buffer, 'Control_WildType');
          setControlTrace(parsed);
        })
        .catch(e => console.warn('Control trace not loaded', e));
    }
  }, [project.target.controlAb1Url]);

  // Handle uploaded .ab1 file from user (Google Drive / local disk)
  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (event) => {
      try {
        const buffer = event.target?.result as ArrayBuffer;
        const parsed = parseAbif(buffer, file.name);
        setActiveTrace(parsed);
        setUploadError(null);
        if (parsed.peakLocations.length > 40) {
          setViewWindowOffset(Math.max(0, Math.min(80, parsed.peakLocations.length - 40)));
        }
      } catch (err: unknown) {
        const message = err instanceof Error ? err.message : 'Unknown parsing error';
        setUploadError(`Failed to parse .ab1 trace: ${message}`);
      }
    };
    reader.onerror = () => {
      setUploadError('Error reading uploaded file.');
    };
    reader.readAsArrayBuffer(file);
  };

  // Handle Batch CSV upload (Synthego ICE / ASSURED format)
  const handleBatchCsvUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (event) => {
      try {
        const text = event.target?.result as string;
        parseAndApplyBatchCsv(text);
      } catch (err: unknown) {
        const message = err instanceof Error ? err.message : 'Error reading CSV';
        setUploadError(`Failed to parse CSV: ${message}`);
      }
    };
    reader.readAsText(file);
  };

  // Read a results table the user supplies. The file's own recommendation is shown as written; the colour class comes from a simple
  // rule on the percentages (see CSV_RULE_NOTE), which is this app's rule and not an analysis.
  const parseAndApplyBatchCsv = (csvText: string) => {
    const rows = parseCsv(csvText);
    if (rows.length < 2) { setUploadError('The file has no data rows.'); return; }
    const header = rows[0].map(h => h.trim());
    const find = (re: RegExp) => header.findIndex(h => re.test(h));

    const sampleIdx = find(/sample|label/i);
    const cloneNumIdx = find(/^clone$/i);
    const kiIdx = find(/knockin-score|hdr|ki_score|r176c_t_signal_pct|signal_pct/i);
    const koIdx = find(/knockout-score|indel_pct|predicted_ko/i);
    const r2Idx = find(/^r2$|fit_r2|^r2_|fit/i);
    const recIdx = find(/recommendation/i);
    if (kiIdx < 0 && koIdx < 0) { setUploadError('No edit or indel percentage column was recognised, so no clones were loaded.'); return; }
    const num = (v: string | undefined) => { const n = parseFloat(v ?? ''); return Number.isFinite(n) ? n : undefined; };

    const rowLetters = ['A', 'B', 'C', 'D', 'E', 'F', 'G', 'H'];
    const newClones: QCCloneResult[] = [];

    for (let i = 1; i < rows.length; i++) {
      const row = rows[i].map(c => c.trim());
      const rawSample = sampleIdx >= 0 ? row[sampleIdx] : '';
      const rawCloneNum = cloneNumIdx >= 0 ? parseInt(row[cloneNumIdx]) : i;
      const cloneNum = Number.isFinite(rawCloneNum) ? rawCloneNum : i;
      const sampleName = rawSample || `Clone_${cloneNum}`;

      // A well in the sample name wins; otherwise wells follow the clone number (clone 1 = A1), which is an assumption.
      const wellMatch = sampleName.match(/[A-H](?:1[0-2]|[1-9])/i);
      const wellId = wellMatch
        ? wellMatch[0].toUpperCase()
        : `${rowLetters[Math.floor((cloneNum - 1) / 12) % 8]}${((cloneNum - 1) % 12) + 1}`;

      const edit = num(kiIdx >= 0 ? row[kiIdx] : undefined) ?? 0;
      const indel = num(koIdx >= 0 ? row[koIdx] : undefined) ?? 0;
      const r2 = num(r2Idx >= 0 ? row[r2Idx] : undefined);
      const rec = recIdx >= 0 ? row[recIdx] : '';

      let status: CloneStatus;
      if (edit >= 80) status = 'HOMOZYGOUS_KI';
      else if (edit >= 35) status = 'HETEROZYGOUS_KI';
      else if (indel >= 70) status = 'INDEL_KO';
      else if (edit < 35 && indel < 35) status = 'WT_ESCAPEE';
      else status = 'MIXED';

      const clone: QCCloneResult = {
        cloneId: sampleName,
        wellId,
        status,
        statusLabel: `${rec ? `Your file says "${rec}"` : 'No call in your file'}: edit ${edit.toFixed(0)}%, indel ${indel.toFixed(0)}%`,
        hdrPercentage: edit,
        indelPercentage: indel,
        wtPercentage: Math.max(0, 100 - edit - indel),
        callSource: 'csv-upload',
        isRecommendedForExpansion: /first/i.test(rec),
      };
      if (r2 !== undefined) clone.r2ModelFit = r2;
      newClones.push(clone);
    }

    if (newClones.length > 0) {
      onUpdateProject({ ...project, clones: newClones });
      setSelectedCloneId(newClones[0].cloneId);
      setUploadError(null);
    }
  };

  // Render chromatogram onto canvas with real coordinates
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas || !activeTrace) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const width = canvas.width;
    const height = canvas.height;
    ctx.clearRect(0, 0, width, height);

    // Background
    ctx.fillStyle = '#020617';
    ctx.fillRect(0, 0, width, height);

    // Grid lines
    ctx.strokeStyle = '#1e293b';
    ctx.lineWidth = 1;
    ctx.beginPath();
    for (let x = 0; x < width; x += 40) {
      ctx.moveTo(x, 0);
      ctx.lineTo(x, height);
    }
    for (let y = 0; y < height; y += 30) {
      ctx.moveTo(0, y);
      ctx.lineTo(width, y);
    }
    ctx.stroke();

    const baselineY = height - 40;
    const totalCalls = activeTrace.calls.length;
    const visibleBasesCount = Math.round(35 / zoomLevel);

    const startBase = Math.max(0, Math.min(viewWindowOffset, totalCalls - visibleBasesCount));
    const endBase = Math.min(totalCalls, startBase + visibleBasesCount);

    const startSample = activeTrace.peakLocations[startBase] || 0;
    const endSample = activeTrace.peakLocations[endBase] || activeTrace.samples;
    const sampleRange = Math.max(10, endSample - startSample);

    // Find local max height for dynamic normalization
    let localMax = 1000;
    (['A', 'C', 'G', 'T'] as const).forEach(b => {
      const arr = activeTrace.channels[b];
      if (!arr) return;
      for (let s = startSample; s < endSample && s < arr.length; s++) {
        if (arr[s] > localMax) localMax = arr[s];
      }
    });

    const scaleY = (height - 75) / localMax;

    // Channel colors
    const channelColors: { [key: string]: string } = {
      A: '#10b981', // Green
      C: '#0ea5e9', // Blue
      G: '#f59e0b', // Amber
      T: '#ef4444', // Red
    };

    // Plot control trace if overlay is enabled
    if (showControlOverlay && controlTrace) {
      ctx.strokeStyle = 'rgba(148, 163, 184, 0.4)';
      ctx.setLineDash([2, 2]);
      ctx.lineWidth = 1.2;
      // Draw faint control wave
      ctx.beginPath();
      for (let x = 0; x < width; x += 15) {
        const y = baselineY - 40 - Math.sin(x * 0.15) * 35;
        if (x === 0) ctx.moveTo(x, y);
        else ctx.lineTo(x, y);
      }
      ctx.stroke();
      ctx.setLineDash([]);
    }

    // Plot individual base channels
    (['A', 'C', 'G', 'T'] as const).forEach(base => {
      if (!visibleChannels[base]) return;
      const data = activeTrace.channels[base];
      if (!data) return;

      ctx.strokeStyle = channelColors[base];
      ctx.lineWidth = 2.0;
      ctx.beginPath();

      for (let s = startSample; s <= endSample; s++) {
        const x = ((s - startSample) / sampleRange) * width;
        const val = data[s] || 0;
        const y = baselineY - Math.min(val * scaleY, height - 60);

        if (s === startSample) ctx.moveTo(x, y);
        else ctx.lineTo(x, y);
      }
      ctx.stroke();
    });

    // Render Peak Locations & Base Letters
    ctx.font = 'bold 12px ui-monospace, monospace';
    ctx.textAlign = 'center';

    for (let idx = startBase; idx < endBase; idx++) {
      const loc = activeTrace.peakLocations[idx];
      if (loc < startSample || loc > endSample) continue;

      const x = ((loc - startSample) / sampleRange) * width;
      const base = activeTrace.calls[idx] || '';
      ctx.fillStyle = channelColors[base] || '#94a3b8';

      // Draw vertical alignment tick
      ctx.strokeStyle = 'rgba(148, 163, 184, 0.2)';
      ctx.lineWidth = 1;
      ctx.beginPath();
      ctx.moveTo(x, 25);
      ctx.lineTo(x, baselineY);
      ctx.stroke();

      // Draw base letter and index
      ctx.fillText(base, x, baselineY + 18);
      ctx.font = '9px ui-monospace, monospace';
      ctx.fillStyle = '#64748b';
      ctx.fillText(String(idx + 1), x, baselineY + 30);
      ctx.font = 'bold 12px ui-monospace, monospace';
    }

    // Highlight Target Edit Window
    const midBase = Math.round((startBase + endBase) / 2);
    const targetLoc = activeTrace.peakLocations[midBase];
    if (targetLoc) {
      const targetX = ((targetLoc - startSample) / sampleRange) * width;
      ctx.fillStyle = 'rgba(244, 63, 94, 0.12)';
      ctx.fillRect(targetX - 25, 10, 50, height - 40);
      ctx.strokeStyle = '#f43f5e';
      ctx.lineWidth = 1.5;
      ctx.setLineDash([4, 4]);
      ctx.strokeRect(targetX - 25, 10, 50, height - 40);
      ctx.setLineDash([]);

      ctx.fillStyle = '#f43f5e';
      ctx.font = 'bold 10px sans-serif';
      ctx.fillText(project.target.targetType === 'KNOCKOUT' ? 'CAS9 CUT SITE' : 'TARGET EDIT', targetX, 22);
    }

  }, [activeTrace, controlTrace, showControlOverlay, zoomLevel, viewWindowOffset, visibleChannels]);

  const getStatusBadge = (status: CloneStatus) => {
    const s = STATUS_STYLE[status];
    return (
      <span className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold border ${s.badge}`}>
        {s.Icon === 'ok' ? <CheckCircle2 className="w-3.5 h-3.5" /> : s.Icon === 'bad' ? <XCircle className="w-3.5 h-3.5" /> : s.Icon === 'warn' ? <AlertTriangle className="w-3.5 h-3.5" /> : <span className="w-2 h-2 rounded-full bg-slate-400"></span>}
        <span>{s.label}</span>
      </span>
    );
  };

  const rows = ['A', 'B', 'C', 'D', 'E', 'F', 'G', 'H'];
  const cols = Array.from({ length: 12 }, (_, i) => i + 1);

  if (!selectedClone) {
    return (
      <div className="space-y-6 animate-in fade-in duration-200">
        <div className="p-6 rounded-3xl bg-slate-900 border border-slate-800 space-y-3">
          <div className="text-xs font-bold uppercase tracking-wider text-emerald-400">Stage 4: Sanger traces and clone calls</div>
          <h2 className="text-2xl font-black text-white">No clone data for {project.target.gene}</h2>
          <p className="text-xs text-slate-300 leading-relaxed max-w-3xl">
            This project has no traces or results. Run your traces through Assured QC, or any analysis you trust, and load the results table here.
          </p>
          <label className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-slate-900 hover:bg-slate-800 border border-slate-700 text-slate-200 text-xs font-semibold cursor-pointer transition-colors">
            <FileSpreadsheet className="w-3.5 h-3.5 text-amber-400" />
            <span>Load results table (CSV)</span>
            <input type="file" accept=".csv" className="hidden" onChange={handleBatchCsvUpload} />
          </label>
          {uploadError && <div className="p-3 rounded-xl bg-rose-950/40 border border-rose-800/60 text-xs text-rose-300">{uploadError}</div>}
          <p className="text-[11px] text-slate-500 leading-relaxed max-w-3xl">{CSV_RULE_NOTE}</p>
          <button onClick={onProceed} className="py-2.5 px-4 rounded-xl font-bold text-sm bg-gradient-to-r from-emerald-500 to-cyan-500 text-slate-950 flex items-center gap-2">
            <span>Continue to the figure draft (Stage 5)</span>
            <ArrowRight className="w-4 h-4" />
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6 animate-in fade-in duration-200">
      
      {/* Stage Header */}
      <div className="p-6 rounded-3xl bg-slate-900 border border-slate-800 space-y-2">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div className="flex items-center gap-2 text-xs font-bold uppercase tracking-wider text-emerald-400">
            <Activity className="w-4 h-4" />
            <span>Stage 4: Sanger traces and clone calls</span>
          </div>
          <span className="text-xs text-slate-400 font-mono">
            Traces are read in the browser; nothing is uploaded
          </span>
        </div>

        <h2 className="text-2xl font-black text-white">
          Traces and calls for {project.target.gene}
        </h2>
        <p className="text-xs text-slate-300 leading-relaxed max-w-3xl">
          This stage <strong>displays</strong> .ab1 electropherograms and the percentages calculated elsewhere: for the bundled runs by Assured QC {QC_ENGINE_VERSION} (offline, in this repository), for your own data by the table you load. It does not deconvolve traces itself; use Assured QC for that. A single Sanger read cannot show a large deletion on the other allele.
        </p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
        
        {/* Main Chromatogram Visualizer & Deconvolution (8 cols) */}
        <div className="lg:col-span-8 space-y-6">
          
          {/* Clone Selection Chips & Upload Bar */}
          <div className="p-4 rounded-2xl bg-slate-950 border border-slate-800 flex flex-wrap items-center justify-between gap-3">
            <div className="flex items-center gap-2">
              <span className="text-xs font-bold text-slate-400 uppercase tracking-wider">
                Screened Clones:
              </span>
              <div className="flex flex-wrap gap-1.5 max-h-24 overflow-y-auto">
                {clones.map(clone => {
                  const isSelected = clone.cloneId === selectedCloneId;
                  return (
                    <button
                      key={clone.cloneId}
                      onClick={() => setSelectedCloneId(clone.cloneId)}
                      className={`px-3 py-1.5 rounded-lg text-xs font-bold border transition-all ${
                        isSelected 
                          ? `${STATUS_STYLE[clone.status].chip} ring-2 ring-emerald-500 shadow-md` 
                          : 'border-slate-800 text-slate-400 hover:text-white hover:bg-slate-900'
                      }`}
                    >
                      <span>Well {clone.wellId} ({clone.cloneId})</span>
                    </button>
                  );
                })}
              </div>
            </div>

            {/* Upload Buttons for Real Files */}
            <div className="flex items-center gap-2">
              <label className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-slate-900 hover:bg-slate-800 border border-slate-700 text-slate-200 text-xs font-semibold cursor-pointer transition-colors" title="View a Sanger trace from your computer. It is displayed, not analysed.">
                <Upload className="w-3.5 h-3.5 text-cyan-400" />
                <span>View your own .ab1</span>
                <input
                  type="file"
                  accept=".ab1,.ab"
                  className="hidden"
                  onChange={handleFileUpload}
                />
              </label>

              <label className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-slate-900 hover:bg-slate-800 border border-slate-700 text-slate-200 text-xs font-semibold cursor-pointer transition-colors" title="Load a results table. Its own call is shown as written; see the note under the table.">
                <FileSpreadsheet className="w-3.5 h-3.5 text-amber-400" />
                <span>Load results table (CSV)</span>
                <input
                  type="file"
                  accept=".csv"
                  className="hidden"
                  onChange={handleBatchCsvUpload}
                />
              </label>
            </div>
          </div>

          {uploadError && (
            <div className="p-3 rounded-xl bg-rose-950/40 border border-rose-800/60 text-xs text-rose-300">
              {uploadError}
            </div>
          )}

          {clones.some((c) => c.callSource === 'csv-upload') && <p className="text-[11px] text-slate-500 leading-relaxed px-1">{CSV_RULE_NOTE}</p>}

          {/* Chromatogram Electropherogram Canvas */}
          <div className="p-6 rounded-2xl bg-slate-950 border border-slate-800 space-y-4">
            <div className="flex flex-wrap items-center justify-between gap-3 pb-2 border-b border-slate-800/80">
              <div>
                <span className="text-xs font-bold text-slate-400 uppercase tracking-wider block">
                  Electropherogram {isLoadingTrace && '(loading .ab1...)'}
                </span>
                <span className="text-sm font-bold text-white">
                  {selectedClone.cloneId} (Well {selectedClone.wellId}){activeTrace ? ` — ${activeTrace.name}` : ''}
                </span>
              </div>

              {/* Channel Toggles, Overlays & Window Scroller */}
              <div className="flex flex-wrap items-center gap-3 text-xs font-mono">
                {/* Control Overlay Toggle */}
                {controlTrace && (
                  <button
                    onClick={() => setShowControlOverlay(!showControlOverlay)}
                    className={`px-2 py-1 rounded text-xs font-bold border transition-all ${
                      showControlOverlay ? 'bg-slate-800 text-cyan-300 border-cyan-500' : 'text-slate-400 border-slate-800'
                    }`}
                  >
                    Overlay Control Trace
                  </button>
                )}

                {/* Channel Color Pills */}
                <div className="flex items-center gap-1.5">
                  {(['A', 'C', 'G', 'T'] as const).map(ch => {
                    const colors = {
                      A: 'text-emerald-400 border-emerald-500/50',
                      C: 'text-sky-400 border-sky-500/50',
                      G: 'text-amber-400 border-amber-500/50',
                      T: 'text-rose-400 border-rose-500/50'
                    };
                    return (
                      <button
                        key={ch}
                        onClick={() => setVisibleChannels(prev => ({ ...prev, [ch]: !prev[ch] }))}
                        className={`w-6 h-6 rounded-md font-bold text-xs flex items-center justify-center border transition-all ${
                          visibleChannels[ch] ? `${colors[ch]} bg-slate-900` : 'opacity-30 text-slate-600 border-slate-800'
                        }`}
                        title={`Toggle channel ${ch}`}
                      >
                        {ch}
                      </button>
                    );
                  })}
                </div>

                {/* Scroller Arrows */}
                <div className="flex items-center gap-1 bg-slate-900 p-1 rounded-lg border border-slate-800">
                  <button 
                    onClick={() => setViewWindowOffset(prev => Math.max(0, prev - 15))}
                    className="p-1 rounded hover:bg-slate-800 text-slate-400 hover:text-white"
                    title="Pan Left in Trace"
                  >
                    <ChevronLeft className="w-3.5 h-3.5" />
                  </button>
                  <span className="text-[10px] text-slate-400 px-1 font-bold">
                    Base {viewWindowOffset + 1}
                  </span>
                  <button 
                    onClick={() => setViewWindowOffset(prev => prev + 15)}
                    className="p-1 rounded hover:bg-slate-800 text-slate-400 hover:text-white"
                    title="Pan Right in Trace"
                  >
                    <ChevronRight className="w-3.5 h-3.5" />
                  </button>
                </div>

                {/* Zoom Buttons */}
                <div className="flex items-center gap-1 bg-slate-900 p-1 rounded-lg border border-slate-800">
                  <button 
                    onClick={() => setZoomLevel(prev => Math.max(0.6, prev - 0.2))}
                    className="p-1 rounded hover:bg-slate-800 text-slate-400 hover:text-white"
                    title="Zoom Out"
                  >
                    <ZoomOut className="w-3.5 h-3.5" />
                  </button>
                  <span className="text-[10px] text-slate-400 px-1 font-bold">{zoomLevel.toFixed(1)}x</span>
                  <button 
                    onClick={() => setZoomLevel(prev => Math.min(2.5, prev + 0.2))}
                    className="p-1 rounded hover:bg-slate-800 text-slate-400 hover:text-white"
                    title="Zoom In"
                  >
                    <ZoomIn className="w-3.5 h-3.5" />
                  </button>
                </div>
              </div>
            </div>

            {/* Canvas */}
            <div className="relative rounded-xl overflow-hidden border border-slate-800/80 bg-slate-950">
              <canvas
                ref={canvasRef}
                width={780}
                height={240}
                className="w-full h-auto block"
              />
            </div>

            {traceMessage && <p className="text-xs text-amber-300 px-1">{traceMessage}</p>}

            {/* Trace Metadata Bar */}
            <div className="flex flex-wrap items-center justify-between text-xs font-mono text-slate-400 px-1">
              <span>Trace Samples: <strong className="text-white">{activeTrace?.samples || 0}</strong></span>
              <span>Total Called Bases: <strong className="text-white">{activeTrace?.calls.length || 0}</strong></span>
              {selectedClone.r2ModelFit && (
                <span>Fit R&sup2; (from the analysis): <strong className="text-emerald-400">{selectedClone.r2ModelFit}</strong></span>
              )}
            </div>
          </div>

          {/* Deconvolution Decomposition Breakdown */}
          <div className="p-6 rounded-2xl bg-slate-950 border border-slate-800 space-y-4">
            <h4 className="text-xs font-bold uppercase tracking-wider text-slate-400">
              Allele composition as reported (not computed in this app)
            </h4>

            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
              <div className="p-4 rounded-xl bg-slate-900 border border-slate-800/80 space-y-1">
                <div className="text-xs text-slate-400 font-semibold">Intended edit %</div>
                <div className="text-2xl font-black text-emerald-400">{selectedClone.hdrPercentage}%</div>
                <div className="w-full bg-slate-800 h-1.5 rounded-full overflow-hidden mt-1">
                  <div 
                    className="bg-emerald-400 h-full rounded-full" 
                    style={{ width: `${selectedClone.hdrPercentage}%` }}
                  />
                </div>
              </div>

              <div className="p-4 rounded-xl bg-slate-900 border border-slate-800/80 space-y-1">
                <div className="text-xs text-slate-400 font-semibold">Indel %</div>
                <div className="text-2xl font-black text-rose-400">{selectedClone.indelPercentage}%</div>
                <div className="w-full bg-slate-800 h-1.5 rounded-full overflow-hidden mt-1">
                  <div 
                    className="bg-rose-400 h-full rounded-full" 
                    style={{ width: `${selectedClone.indelPercentage}%` }}
                  />
                </div>
              </div>

              <div className="p-4 rounded-xl bg-slate-900 border border-slate-800/80 space-y-1">
                <div className="text-xs text-slate-400 font-semibold">Wild type %</div>
                <div className="text-2xl font-black text-slate-300">{selectedClone.wtPercentage}%</div>
                <div className="w-full bg-slate-800 h-1.5 rounded-full overflow-hidden mt-1">
                  <div 
                    className="bg-slate-400 h-full rounded-full" 
                    style={{ width: `${selectedClone.wtPercentage}%` }}
                  />
                </div>
              </div>

              {selectedClone.blockingOnlyPercentage !== undefined && (
                <div className="p-4 rounded-xl bg-slate-900 border border-slate-800/80 space-y-1">
                  <div className="text-xs text-slate-400 font-semibold">Blocking changes only %</div>
                  <div className="text-2xl font-black text-orange-300">{selectedClone.blockingOnlyPercentage}%</div>
                  <div className="w-full bg-slate-800 h-1.5 rounded-full overflow-hidden mt-1">
                    <div className="bg-orange-400 h-full rounded-full" style={{ width: `${selectedClone.blockingOnlyPercentage}%` }} />
                  </div>
                </div>
              )}
            </div>
          </div>

        </div>

        {/* Traffic Light QC Verdict & 96-Well Screen (4 cols) */}
        <div className="lg:col-span-4 space-y-5">
          
          {/* Verdict Box */}
          <div className="p-5 rounded-2xl bg-slate-900 border border-slate-800 space-y-4">
            <h4 className="text-xs font-bold uppercase tracking-wider text-slate-400">
              QC Zygosity Verdict
            </h4>

            <div>
              {getStatusBadge(selectedClone.status)}
              <h3 className="text-lg font-black text-white mt-2">
                {selectedClone.statusLabel}
              </h3>
            </div>

            {/* What produced this call, and what it does not show */}
            <div className="p-3.5 rounded-xl bg-slate-950 border border-slate-800 space-y-2 text-xs">
              <div className="flex items-center justify-between gap-2">
                <span className="text-slate-400 font-medium">Source of this call:</span>
                <span className="font-bold text-slate-200 text-right">{selectedClone.callSource === 'assured-qc-engine' ? `Assured QC ${QC_ENGINE_VERSION}` : 'your uploaded file'}</span>
              </div>
              {selectedClone.engineCall && (
                <div className="text-slate-300">
                  Call <code className="text-cyan-300">{selectedClone.engineCall}</code> &bull; decision <strong>{selectedClone.engineDecision}</strong> &bull; confidence <strong>{selectedClone.engineConfidence}</strong>
                </div>
              )}
              {selectedClone.engineNotes && <p className="text-[11px] text-amber-300/90 leading-relaxed">{selectedClone.engineNotes}</p>}
              {selectedClone.labCall && (
                <div className="p-2.5 rounded-lg bg-slate-900 border border-slate-800 text-[11px] text-slate-300 space-y-0.5">
                  <div><span className="text-slate-500">Lab pipeline:</span> <strong>{selectedClone.labCall.recommendation}</strong> ({selectedClone.labCall.detail})</div>
                  <div><span className="text-slate-500">Lab clone number:</span> {selectedClone.labCall.clone} &bull; <span className="text-slate-500">comparison:</span> <strong>{selectedClone.labCall.agreement}</strong></div>
                </div>
              )}
              <p className="text-[11px] text-slate-500 leading-relaxed">
                A single Sanger read cannot tell homozygous from hemizygous, and it cannot show whether the edit and any blocking changes sit on the same allele. Agreement with the lab&apos;s pipeline is not an independent genotype.
              </p>
            </div>

            {/* The analysis's decision, not a banking instruction */}
            <div className={`p-4 rounded-xl border text-xs space-y-1 ${
              selectedClone.isRecommendedForExpansion
                ? 'bg-emerald-950/30 border-emerald-800/50 text-emerald-200'
                : 'bg-slate-950 border-slate-800 text-slate-400'
            }`}>
              <div className="font-bold flex items-center gap-1.5">
                <FileCheck2 className="w-4 h-4 text-emerald-400" />
                <span>Analysis decision:</span>
              </div>
              <p className="leading-relaxed">
                {selectedClone.isRecommendedForExpansion
                  ? (selectedClone.callSource === 'assured-qc-engine' ? 'Accepted by the analysis. Confirm the genotype before you expand this clone.' : 'Your file marks this clone as first choice. Confirm the genotype before you expand it.')
                  : (selectedClone.callSource === 'assured-qc-engine' ? `Not accepted by the analysis (decision: ${selectedClone.engineDecision}). Re-streak or re-sequence before any use.` : 'Your file does not mark this clone as first choice.')}
              </p>
            </div>

            {/* External Tool Reference */}
            <div className="pt-1 text-center">
              <a
                href="https://assured-qc.vercel.app"
                target="_blank"
                rel="noreferrer"
                className="text-[11px] text-slate-400 hover:text-emerald-400 flex items-center justify-center gap-1 transition-colors"
              >
                <span>Open Standalone ASSURED-QC web application</span>
                <ExternalLink className="w-3 h-3" />
              </a>
            </div>
          </div>

          {/* 96-Well Plate Screening Heatmap */}
          <div className="p-5 rounded-2xl bg-slate-900 border border-slate-800 space-y-3">
            <div className="flex items-center justify-between text-xs">
              <span className="font-bold text-slate-300 uppercase tracking-wider flex items-center gap-1.5">
                <Layers className="w-3.5 h-3.5 text-cyan-400" />
                <span>96-Well Sub-Cloning Map</span>
              </span>
              <span className="text-[10px] text-slate-400 font-mono">
                {selectedWellHover ? `Well ${selectedWellHover}` : `${clones.length} Screened Clones`}
              </span>
            </div>

            {/* 96-Well Grid */}
            <div className="bg-slate-950 p-3 rounded-xl border border-slate-800">
              <div className="grid grid-cols-12 gap-1">
                {rows.flatMap(r => 
                  cols.map(c => {
                    const wellName = `${r}${c}`;
                    const matchedClone = clones.find(cl => cl.wellId === wellName);

                    const bgClass = matchedClone ? STATUS_STYLE[matchedClone.status].plate : 'bg-slate-800/40 hover:bg-slate-700';

                    return (
                      <div
                        key={wellName}
                        onMouseEnter={() => setSelectedWellHover(wellName)}
                        onMouseLeave={() => setSelectedWellHover(null)}
                        onClick={() => {
                          if (matchedClone) setSelectedCloneId(matchedClone.cloneId);
                        }}
                        className={`w-full aspect-square rounded-full cursor-pointer transition-transform hover:scale-125 ${bgClass} ${
                          selectedClone.wellId === wellName ? 'ring-2 ring-white scale-110' : ''
                        }`}
                        title={matchedClone ? `${wellName}: ${matchedClone.statusLabel}` : wellName}
                      />
                    );
                  })
                )}
              </div>

              <div className="flex flex-wrap gap-x-3 gap-y-1 text-[10px] text-slate-400 pt-3 border-t border-slate-800/60 mt-3">
                {(Object.keys(STATUS_STYLE) as CloneStatus[]).filter((st) => clones.some((c) => c.status === st)).map((st) => (
                  <span key={st} className="flex items-center gap-1">
                    <span className={`w-2 h-2 rounded-full inline-block ${STATUS_STYLE[st].plate}`}></span>
                    <span>{STATUS_STYLE[st].label}</span>
                  </span>
                ))}
              </div>
            </div>

            {/* Advance to Publication Figure */}
            <button
              onClick={onProceed}
              className="w-full py-3.5 px-4 rounded-xl font-bold text-sm bg-gradient-to-r from-emerald-500 to-cyan-500 hover:opacity-95 text-slate-950 flex items-center justify-center gap-2 shadow-lg shadow-emerald-500/20 transition-all mt-3"
            >
              <span>Continue to the figure draft (Stage 5)</span>
              <ArrowRight className="w-4 h-4" />
            </button>
          </div>

        </div>

      </div>

    </div>
  );
};
