import React, { useState, useEffect } from 'react';
import { 
  Dna, 
  ShoppingCart, 
  FlaskConical, 
  Activity, 
  BookOpen, 
  ChevronRight, 
  RotateCcw, 
  FolderGit2, 
  Sparkles,
  Check
} from 'lucide-react';
import { AssuredProject, PipelineStage } from '../../types/pipeline';
import { PRESET_PROJECTS, getStoredProjects, saveProjectsToStorage } from '../../services/pipelineStore';
import { Stage1Design } from './Stage1Design';
import { Stage2Order } from './Stage2Order';
import { Stage3Bench } from './Stage3Bench';
import { Stage4QC } from './Stage4QC';
import { Stage5Publish } from './Stage5Publish';

export const UnifiedPipeline: React.FC = () => {
  const [projects, setProjects] = useState<AssuredProject[]>(() => getStoredProjects());
  const [activeProjectId, setActiveProjectId] = useState<string>(projects[0]?.id || 'proj-hbb');
  const [currentStage, setCurrentStage] = useState<PipelineStage>(1);

  const activeProject = projects.find(p => p.id === activeProjectId) || projects[0];

  useEffect(() => {
    saveProjectsToStorage(projects);
  }, [projects]);

  const handleUpdateProject = (updated: AssuredProject) => {
    setProjects(prev => prev.map(p => p.id === updated.id ? updated : p));
  };

  const handleResetPresets = () => {
    if (window.confirm('Reset the workbench to the bundled presets? Projects you created or changed here will be lost.')) {
      setProjects(PRESET_PROJECTS);
      setActiveProjectId(PRESET_PROJECTS[0].id);
      setCurrentStage(1);
    }
  };

  const stages: { number: PipelineStage; label: string; icon: React.ElementType; desc: string }[] = [
    { number: 1, label: 'Design', icon: Dna, desc: 'Guides & asymmetric ssODN' },
    { number: 2, label: 'Order', icon: ShoppingCart, desc: 'Order sheet from the design' },
    { number: 3, label: 'Bench', icon: FlaskConical, desc: 'Table 7 mix & Neon settings' },
    { number: 4, label: 'Analyse / QC', icon: Activity, desc: 'Sanger traces & clone calls' },
    { number: 5, label: 'Draft', icon: BookOpen, desc: 'Figure & methods draft' }
  ];

  return (
    <div className="space-y-8 animate-in fade-in duration-300">
      
      {/* Top Banner & Project Selector */}
      <div className="p-6 rounded-3xl bg-gradient-to-r from-slate-900 via-slate-900 to-cyan-950/40 border border-slate-800 shadow-xl flex flex-wrap items-center justify-between gap-4">
        <div className="space-y-1">
          <div className="flex items-center gap-2">
            <span className="px-2.5 py-0.5 rounded-full text-[10px] font-black uppercase tracking-wider bg-cyan-500/20 text-cyan-300 border border-cyan-500/30">
              End-to-End Pipeline
            </span>
            <span className="text-xs text-slate-400 font-mono">Ludwik et al., STAR Protocols 2023</span>
          </div>
          <h1 className="text-2xl sm:text-3xl font-black text-white tracking-tight">
            ASSURED CRISPR Workbench
          </h1>
          <p className="text-xs text-slate-300 max-w-2xl">
            From single-nucleotide variant design to 1-click order manifest, bench execution, chromatogram deconvolution, and Cell Press-ready multi-panel figures.
          </p>
        </div>

        {/* Project Selector Dropdown & Reset */}
        <div className="flex items-center gap-3">
          <div className="flex items-center gap-2 bg-slate-950 p-1.5 rounded-2xl border border-slate-800">
            <FolderGit2 className="w-4 h-4 text-cyan-400 ml-2" />
            <select
              value={activeProjectId}
              onChange={(e) => setActiveProjectId(e.target.value)}
              className="bg-transparent text-xs font-bold text-white pr-3 py-1.5 focus:outline-none cursor-pointer"
            >
              {projects.map(p => (
                <option key={p.id} value={p.id} className="bg-slate-900 text-white">
                  {p.target.gene}: {p.target.diseaseName}
                </option>
              ))}
            </select>
          </div>

          <button
            onClick={handleResetPresets}
            className="p-2.5 rounded-xl bg-slate-950 hover:bg-slate-900 border border-slate-800 text-slate-400 hover:text-white transition-colors"
            title="Reset preset targets"
          >
            <RotateCcw className="w-4 h-4" />
          </button>

          <a
            href="./studio/"
            target="_blank"
            rel="noopener noreferrer"
            className="flex items-center gap-1.5 px-3 py-2 rounded-xl bg-gradient-to-r from-purple-500 to-indigo-500 hover:from-purple-400 hover:to-indigo-400 text-white font-bold text-xs shadow-md shadow-purple-500/20 transition-all"
            title="Open Assured Studio standalone app"
          >
            <Sparkles className="w-3.5 h-3.5" />
            <span>Assured Studio</span>
          </a>
        </div>
      </div>

      {/* 5-Stage Stepper Navigation */}
      <div className="grid grid-cols-2 sm:grid-cols-5 gap-2 sm:gap-3">
        {stages.map((stage) => {
          const Icon = stage.icon;
          const isActive = currentStage === stage.number;
          const isPassed = currentStage > stage.number;

          return (
            <button
              key={stage.number}
              onClick={() => setCurrentStage(stage.number)}
              className={`p-3.5 rounded-2xl border text-left transition-all relative overflow-hidden group ${
                isActive
                  ? 'bg-slate-900 border-cyan-500 ring-2 ring-cyan-500/40 shadow-lg shadow-cyan-950/50'
                  : isPassed
                  ? 'bg-slate-950/80 border-slate-800 hover:border-slate-700 hover:bg-slate-900/60'
                  : 'bg-slate-950/40 border-slate-850 hover:border-slate-800 opacity-75'
              }`}
            >
              <div className="flex items-center justify-between mb-1.5">
                <span className={`text-[10px] font-bold uppercase tracking-wider ${
                  isActive ? 'text-cyan-400' : isPassed ? 'text-emerald-400' : 'text-slate-500'
                }`}>
                  Stage {stage.number}
                </span>

                <div className={`w-5 h-5 rounded-full flex items-center justify-center text-[10px] font-bold ${
                  isPassed 
                    ? 'bg-emerald-500 text-slate-950' 
                    : isActive 
                    ? 'bg-cyan-500 text-slate-950' 
                    : 'bg-slate-800 text-slate-400'
                }`}>
                  {isPassed ? <Check className="w-3 h-3 stroke-[3]" /> : stage.number}
                </div>
              </div>

              <div className="flex items-center gap-1.5 font-bold text-xs text-white">
                <Icon className={`w-3.5 h-3.5 ${isActive ? 'text-cyan-400' : 'text-slate-400'}`} />
                <span>{stage.label}</span>
              </div>
              <p className="text-[10px] text-slate-400 truncate mt-0.5">
                {stage.desc}
              </p>
            </button>
          );
        })}
      </div>

      {/* Stage Content */}
      <div className="min-h-[500px]">
        {currentStage === 1 && (
          <Stage1Design
            project={activeProject}
            onUpdateProject={handleUpdateProject}
            onProceed={() => setCurrentStage(2)}
          />
        )}

        {currentStage === 2 && (
          <Stage2Order
            project={activeProject}
            onProceed={() => setCurrentStage(3)}
          />
        )}

        {currentStage === 3 && (
          <Stage3Bench
            project={activeProject}
            onUpdateProject={handleUpdateProject}
            onProceed={() => setCurrentStage(4)}
          />
        )}

        {currentStage === 4 && (
          <Stage4QC
            project={activeProject}
            onUpdateProject={handleUpdateProject}
            onProceed={() => setCurrentStage(5)}
          />
        )}

        {currentStage === 5 && (
          <Stage5Publish
            project={activeProject}
            onUpdateProject={handleUpdateProject}
          />
        )}
      </div>

    </div>
  );
};
