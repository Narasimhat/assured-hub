import React, { useState, useMemo } from 'react';
import { Download, Sliders, Eye, RefreshCw, Info } from 'lucide-react';
import { AssuredProject } from '../../types/pipeline';

interface GelSimulatorProps {
  project: AssuredProject;
}

interface LadderBand {
  bp: number;
  intensity: number;
  isRef?: boolean;
}

interface SimulatedBand {
  bp: number;
  y: number;
  intensity: number;
  isRef?: boolean;
  label: string;
}

interface SimulatedLane {
  id: string;
  title: string;
  bands: SimulatedBand[];
}

const LADDERS: Record<string, { name: string; bands: LadderBand[]; minBp: number; maxBp: number }> = {
  ladder100bp: {
    name: '100 bp DNA Ladder (100 - 1,500 bp)',
    bands: [
      { bp: 1500, intensity: 0.6 },
      { bp: 1200, intensity: 0.6 },
      { bp: 1000, intensity: 1.0, isRef: true },
      { bp: 900, intensity: 0.5 },
      { bp: 800, intensity: 0.5 },
      { bp: 700, intensity: 0.5 },
      { bp: 600, intensity: 0.5 },
      { bp: 500, intensity: 1.0, isRef: true },
      { bp: 400, intensity: 0.5 },
      { bp: 300, intensity: 0.5 },
      { bp: 200, intensity: 0.5 },
      { bp: 100, intensity: 0.4 }
    ],
    minBp: 80,
    maxBp: 1800
  },
  ladder1kb: {
    name: '1 kb Plus DNA Ladder (250 - 10,000 bp)',
    bands: [
      { bp: 10000, intensity: 0.6 },
      { bp: 8000, intensity: 0.6 },
      { bp: 6000, intensity: 0.6 },
      { bp: 5000, intensity: 0.6 },
      { bp: 4000, intensity: 0.6 },
      { bp: 3000, intensity: 1.0, isRef: true },
      { bp: 2000, intensity: 0.6 },
      { bp: 1500, intensity: 0.6 },
      { bp: 1000, intensity: 1.0, isRef: true },
      { bp: 750, intensity: 0.5 },
      { bp: 500, intensity: 0.8 },
      { bp: 250, intensity: 0.5 }
    ],
    minBp: 200,
    maxBp: 12000
  }
};

export const GelSimulator: React.FC<GelSimulatorProps> = ({ project }) => {
  const [agarosePct, setAgarosePct] = useState(2.0);
  const [ladderKey, setLadderKey] = useState('ladder100bp');
  const [runTime, setRunTime] = useState(1.0);
  const [dyeColor, setDyeColor] = useState<'cyan' | 'green' | 'amber'>('cyan');

  const target = project.target;
  const isKnockout = target.targetType === 'KNOCKOUT' || !target.donor?.sequence;

  const ampliconInfo = useMemo(() => {
    let wtBp = target.primers?.ampliconSizeBp || 480;
    let editedBp = 400;
    let deletionBp = 80;

    if (isKnockout) {
      if (target.guides.length >= 2) {
        const g0 = target.guides[0] as { cutPosition?: number; cutDistanceToEdit?: number };
        const g1 = target.guides[1] as { cutPosition?: number; cutDistanceToEdit?: number };
        deletionBp = Math.abs((g0.cutPosition ?? g0.cutDistanceToEdit ?? 100) - (g1.cutPosition ?? g1.cutDistanceToEdit ?? 180)) || 80;
      }
      editedBp = Math.max(80, wtBp - deletionBp);
    } else {
      // SNP or small tag
      editedBp = wtBp;
    }

    return { wtBp, editedBp, deletionBp, isKnockout };
  }, [target, isKnockout]);

  const ladder = LADDERS[ladderKey] || LADDERS.ladder100bp;
  const wellY = 40;
  const bottomY = 320;

  const getYForBp = (bp: number): number => {
    if (bp <= 0) return bottomY;
    const minLog = Math.log10(ladder.minBp);
    const maxLog = Math.log10(ladder.maxBp);
    const bpLog = Math.log10(bp);

    const norm = (maxLog - bpLog) / (maxLog - minLog);
    const agaroseFactor = Math.pow(norm, 1.0 + (agarosePct - 1.5) * 0.35);
    const runScaled = agaroseFactor * runTime;

    const y = wellY + runScaled * (bottomY - wellY);
    return Math.min(bottomY + 10, Math.max(wellY + 5, y));
  };

  const colors = {
    cyan: { band: '#38bdf8', glow: 'rgba(56, 189, 248, 0.45)', ref: '#7dd3fc' },
    green: { band: '#4ade80', glow: 'rgba(74, 222, 128, 0.45)', ref: '#86efac' },
    amber: { band: '#fbbf24', glow: 'rgba(251, 191, 36, 0.45)', ref: '#fde68a' }
  }[dyeColor];

  const lanes: SimulatedLane[] = [
    {
      id: 'lane-ladder',
      title: 'Ladder',
      bands: ladder.bands.map(b => ({
        bp: b.bp,
        y: getYForBp(b.bp),
        intensity: b.intensity,
        isRef: b.isRef,
        label: `${b.bp} bp`
      }))
    },
    {
      id: 'lane-wt',
      title: 'Wild-Type',
      bands: [
        {
          bp: ampliconInfo.wtBp,
          y: getYForBp(ampliconInfo.wtBp),
          intensity: 1.0,
          label: `${ampliconInfo.wtBp} bp (WT)`
        }
      ]
    },
    {
      id: 'lane-het',
      title: 'Het Clone',
      bands: [
        {
          bp: ampliconInfo.wtBp,
          y: getYForBp(ampliconInfo.wtBp),
          intensity: 0.65,
          label: `${ampliconInfo.wtBp} bp`
        },
        {
          bp: ampliconInfo.editedBp,
          y: getYForBp(ampliconInfo.editedBp),
          intensity: 0.65,
          label: `${ampliconInfo.editedBp} bp`
        }
      ]
    },
    {
      id: 'lane-hom',
      title: 'Hom Clone',
      bands: [
        {
          bp: ampliconInfo.editedBp,
          y: getYForBp(ampliconInfo.editedBp),
          intensity: 1.0,
          label: `${ampliconInfo.editedBp} bp (Edit)`
        }
      ]
    },
    {
      id: 'lane-ctrl',
      title: 'NTC',
      bands: []
    }
  ];

  const handleDownloadSvg = () => {
    const svgEl = document.getElementById('academy-gel-simulator-svg');
    if (!svgEl) return;
    const svgData = new XMLSerializer().serializeToString(svgEl);
    const blob = new Blob([svgData], { type: 'image/svg+xml;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `${project.target.gene.toLowerCase()}_gel_simulation.svg`;
    a.click();
    URL.revokeObjectURL(url);
  };

  const laneWidth = 75;
  const startX = 45;
  const svgWidth = startX + lanes.length * laneWidth + 40;

  return (
    <div className="p-6 rounded-3xl bg-slate-900 border border-slate-800 space-y-4">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div className="flex items-center gap-2">
          <Eye className="w-4 h-4 text-cyan-400" />
          <span className="text-xs font-bold uppercase tracking-wider text-cyan-400">
            In-Silico PCR Agarose Gel Simulator
          </span>
          <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-slate-800 text-cyan-400 border border-slate-700">
            Colony Screening Guide
          </span>
        </div>

        <button
          onClick={handleDownloadSvg}
          className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-bold transition-colors"
        >
          <Download className="w-3.5 h-3.5" />
          <span>Download SVG Gel</span>
        </button>
      </div>

      <p className="text-xs text-slate-400 leading-relaxed max-w-3xl">
        Predict electrophoretic migration for {project.target.gene} screening PCR amplicons. Verify band shifts between WT ({ampliconInfo.wtBp} bp) and Edited ({ampliconInfo.editedBp} bp) alleles before Sanger sequencing.
      </p>

      {/* Gel Controls */}
      <div className="flex flex-wrap items-center gap-4 p-4 rounded-2xl bg-slate-950 border border-slate-800 text-xs">
        <div>
          <label className="text-slate-400 block mb-1">
            Agarose Gel %: <strong className="text-white">{agarosePct.toFixed(1)}%</strong>
          </label>
          <input
            type="range"
            min="1.0"
            max="3.0"
            step="0.5"
            value={agarosePct}
            onChange={(e) => setAgarosePct(parseFloat(e.target.value))}
            className="w-28 accent-cyan-400"
          />
        </div>

        <div>
          <label className="text-slate-400 block mb-1">
            Run Distance: <strong className="text-white">{Math.round(runTime * 100)}%</strong>
          </label>
          <input
            type="range"
            min="0.7"
            max="1.3"
            step="0.1"
            value={runTime}
            onChange={(e) => setRunTime(parseFloat(e.target.value))}
            className="w-28 accent-cyan-400"
          />
        </div>

        <div>
          <label className="text-slate-400 block mb-1">DNA Ladder</label>
          <select
            value={ladderKey}
            onChange={(e) => setLadderKey(e.target.value)}
            className="p-1.5 rounded-lg bg-slate-900 border border-slate-700 text-slate-200"
          >
            <option value="ladder100bp">100 bp Ladder</option>
            <option value="ladder1kb">1 kb Plus Ladder</option>
          </select>
        </div>

        <div>
          <label className="text-slate-400 block mb-1">Fluorophore Stain</label>
          <div className="flex gap-1.5 mt-1">
            {(['cyan', 'green', 'amber'] as const).map(c => (
              <button
                key={c}
                onClick={() => setDyeColor(c)}
                className={`w-6 h-6 rounded-full border ${dyeColor === c ? 'ring-2 ring-white scale-110' : 'opacity-60'}`}
                style={{ background: c === 'cyan' ? '#38bdf8' : c === 'green' ? '#4ade80' : '#fbbf24' }}
                title={c}
              />
            ))}
          </div>
        </div>
      </div>

      {/* SVG Agarose Gel Graphic */}
      <div className="overflow-x-auto bg-slate-950 p-4 rounded-2xl border border-slate-800 flex justify-center">
        <svg
          id="academy-gel-simulator-svg"
          width={svgWidth}
          height={380}
          viewBox={`0 0 ${svgWidth} 380`}
          className="rounded-lg shadow-inner"
          style={{ background: '#020617', border: '1px solid #1e293b' }}
        >
          {/* UV Transilluminator Gel Basin */}
          <rect x={15} y={15} width={svgWidth - 30} height={350} rx={8} fill="#030712" stroke="#1e293b" strokeWidth={1.5} />

          {/* Cathode (-) and Anode (+) Polarity Markers */}
          <text x={25} y={35} fill="#64748b" fontSize={11} fontFamily="monospace" fontWeight="bold">- (Cathode)</text>
          <text x={25} y={350} fill="#64748b" fontSize={11} fontFamily="monospace" fontWeight="bold">+ (Anode)</text>

          {/* Render Lanes & Wells */}
          {lanes.map((lane, lIdx) => {
            const laneX = startX + lIdx * laneWidth;
            const wellWidth = 44;

            return (
              <g key={lane.id}>
                {/* Lane Header */}
                <text x={laneX + wellWidth / 2} y={28} fill="#94a3b8" fontSize={10} fontFamily="sans-serif" fontWeight="bold" textAnchor="middle">
                  {lane.title}
                </text>

                {/* Submerged Sample Well */}
                <rect x={laneX} y={wellY - 4} width={wellWidth} height={8} rx={2} fill="#0f172a" stroke="#334155" strokeWidth={1} />

                {/* Migrating DNA Bands */}
                {lane.bands.map((band, bIdx) => (
                  <g key={bIdx}>
                    {/* Fluorescence Glow Filter Simulation */}
                    <ellipse
                      cx={laneX + wellWidth / 2}
                      cy={band.y}
                      rx={wellWidth / 2 - 2}
                      ry={4.5}
                      fill={colors.glow}
                      opacity={band.intensity * 0.9}
                    />
                    {/* Core DNA Band */}
                    <rect
                      x={laneX + 2}
                      y={band.y - 1.5}
                      width={wellWidth - 4}
                      height={3}
                      rx={1}
                      fill={band.isRef ? colors.ref : colors.band}
                      opacity={band.intensity}
                    />
                    {/* Size Label */}
                    <text
                      x={laneX + wellWidth + 4}
                      y={band.y + 3}
                      fill="#64748b"
                      fontSize={8}
                      fontFamily="monospace"
                    >
                      {band.label}
                    </text>
                  </g>
                ))}
              </g>
            );
          })}
        </svg>
      </div>
    </div>
  );
};
