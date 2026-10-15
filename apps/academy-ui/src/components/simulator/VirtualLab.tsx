import React, { useState } from 'react';
import { Microscope, Zap, Grid, Binary, RotateCcw } from 'lucide-react';
import { VirtualLabState } from '../../types';
import { ConfluencyStage } from './ConfluencyStage';
import { NucleofectionStage } from './NucleofectionStage';
import { Plate96Screen } from './Plate96Screen';
import { GenotypingStage } from './GenotypingStage';

interface VirtualLabProps {
  onAwardMastery: (points: number) => void;
}

const initialLabState: VirtualLabState = {
  stage: 1,
  confluency: 50,
  morphologyGood: true,
  usedCloneR2: false,
  electroporationProgram: 'other',
  cloningMethod: 'limiting-dilution',
  selectedWells: ['B3', 'C7', 'D2', 'F9'],
  homozygousCloneFound: false,
  feedback: [],
  hasRunElectroporation: false,
};

export const VirtualLab: React.FC<VirtualLabProps> = ({ onAwardMastery }) => {
  const [labState, setLabState] = useState<VirtualLabState>(initialLabState);

  const updateLabState = (updates: Partial<VirtualLabState>) => {
    setLabState(prev => ({ ...prev, ...updates }));
  };

  const handleRestart = () => {
    setLabState(initialLabState);
  };

  const steps = [
    { num: 1, title: '1. Confluency QC', icon: Microscope },
    { num: 2, title: '2. Nucleofection', icon: Zap },
    { num: 3, title: '3. 96-Well Cloning', icon: Grid },
    { num: 4, title: '4. Sanger QC', icon: Binary },
  ];

  return (
    <div className="space-y-8 animate-in fade-in duration-300">
      
      {/* Honest framing: this tab is a decision game, not a measurement */}
      <div className="p-4 rounded-2xl bg-amber-950/20 border border-amber-800/40 text-xs text-amber-200/90 leading-relaxed">
        <strong>Decision game, not a measurement.</strong> The picture, the colony counts and the example traces in this tab are illustrative. They are not from experiments, and the game does not predict viability or editing efficiency. Where a choice is checked, it is checked against the published protocol (Ludwik et al., 2023).
      </div>

      {/* Stepper Navigation */}
      <div className="bg-slate-900 border border-slate-800 rounded-2xl p-4 shadow-xl">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div className="flex items-center gap-2 overflow-x-auto pb-2 sm:pb-0">
            {steps.map(s => {
              const Icon = s.icon;
              const isActive = labState.stage === s.num;
              const isDone = labState.stage > s.num;

              return (
                <button
                  key={s.num}
                  onClick={() => updateLabState({ stage: s.num as 1 | 2 | 3 | 4 })}
                  className={`flex items-center gap-2 px-3.5 py-2 rounded-xl text-xs font-bold transition-all whitespace-nowrap ${
                    isActive
                      ? 'bg-cyan-500 text-slate-950 shadow-md shadow-cyan-500/20'
                      : isDone
                      ? 'bg-slate-800 text-emerald-400 hover:bg-slate-700'
                      : 'bg-slate-950 text-slate-500 hover:text-slate-300'
                  }`}
                >
                  <Icon className="w-3.5 h-3.5" />
                  <span>{s.title}</span>
                </button>
              );
            })}
          </div>

          <button
            onClick={handleRestart}
            className="flex items-center gap-1.5 text-xs text-slate-400 hover:text-white px-3 py-1.5 rounded-lg bg-slate-800/80 hover:bg-slate-700 transition-colors self-end sm:self-auto"
          >
            <RotateCcw className="w-3.5 h-3.5" />
            <span>Reset Bench</span>
          </button>
        </div>
      </div>

      {/* Active Stage View */}
      {labState.stage === 1 && (
        <ConfluencyStage
          confluency={labState.confluency}
          setConfluency={(val) => updateLabState({ confluency: val })}
          onProceed={() => updateLabState({ stage: 2 })}
        />
      )}

      {labState.stage === 2 && (
        <NucleofectionStage
          labState={labState}
          updateLabState={updateLabState}
          onProceed={() => updateLabState({ stage: 3 })}
        />
      )}

      {labState.stage === 3 && (
        <Plate96Screen
          labState={labState}
          updateLabState={updateLabState}
          onProceed={() => updateLabState({ stage: 4 })}
        />
      )}

      {labState.stage === 4 && (
        <GenotypingStage
          labState={labState}
          onRestart={handleRestart}
          onAwardMastery={onAwardMastery}
        />
      )}

    </div>
  );
};
