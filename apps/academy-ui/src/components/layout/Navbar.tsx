import React, { useState, useRef, useEffect } from 'react';
import { 
  Dna, 
  GraduationCap, 
  FlaskConical, 
  Globe2, 
  ShieldAlert, 
  Award, 
  Sparkles, 
  Workflow, 
  Zap,
  ChevronDown,
  ExternalLink
} from 'lucide-react';
import { TabType, WorkspaceMode } from '../../types';

interface NavbarProps {
  activeTab: TabType;
  setActiveTab: (tab: TabType) => void;
  workspaceMode?: WorkspaceMode;
  setWorkspaceMode?: (mode: WorkspaceMode) => void;
  masteryPoints: number;
  totalQuizzesPassed: number;
  onOpenCertificate: () => void;
}

export const Navbar: React.FC<NavbarProps> = ({
  activeTab,
  setActiveTab,
  workspaceMode = 'guided',
  setWorkspaceMode,
  masteryPoints,
  totalQuizzesPassed,
  onOpenCertificate
}) => {
  const [showMoreMenu, setShowMoreMenu] = useState(false);
  const menuRef = useRef<HTMLDivElement>(null);

  // Close dropdown on outside click
  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (menuRef.current && !menuRef.current.contains(e.target as Node)) {
        setShowMoreMenu(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const isSecondaryActive = ['simulator', 'frugal', 'missions', 'suite'].includes(activeTab);

  const handleModeSwitch = (mode: WorkspaceMode) => {
    if (setWorkspaceMode) setWorkspaceMode(mode);
    if (mode === 'pro' && activeTab === 'academy') {
      setActiveTab('workbench');
    }
  };

  return (
    <header className="sticky top-0 z-50 bg-slate-950/90 backdrop-blur-md border-b border-slate-800">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16">
          
          {/* Unified Brand: ASSURED Studio */}
          <div className="flex items-center gap-3 cursor-pointer" onClick={() => setActiveTab('workbench')}>
            <div className="relative flex items-center justify-center w-10 h-10 rounded-xl bg-gradient-to-tr from-cyan-500 to-purple-500 text-slate-950 shadow-lg shadow-cyan-500/20">
              <Dna className="w-6 h-6 animate-pulse" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <span className="font-extrabold text-lg tracking-tight bg-gradient-to-r from-cyan-400 via-teal-300 to-purple-300 bg-clip-text text-transparent">
                  ASSURED Studio
                </span>
                <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full border ${
                  workspaceMode === 'guided'
                    ? 'bg-cyan-950 text-cyan-400 border-cyan-800/60'
                    : 'bg-purple-950 text-purple-300 border-purple-800/60'
                }`}>
                  {workspaceMode === 'guided' ? 'Guided Academy' : 'Pro Lab'}
                </span>
              </div>
              <p className="text-xs text-slate-400 hidden sm:block">
                Precision CRISPR Genome Engineering for Human Pluripotent Stem Cells
              </p>
            </div>
          </div>

          {/* Navigation & Mode Toggle */}
          <div className="hidden md:flex items-center gap-3">
            
            {/* Mode Switcher Toggle */}
            <div className="flex items-center p-1 rounded-2xl bg-slate-900 border border-slate-800 text-xs font-semibold">
              <button
                onClick={() => handleModeSwitch('guided')}
                className={`flex items-center gap-1.5 px-3 py-1.5 rounded-xl transition-all ${
                  workspaceMode === 'guided'
                    ? 'bg-cyan-500/20 text-cyan-300 border border-cyan-400/30 shadow-sm shadow-cyan-500/10'
                    : 'text-slate-400 hover:text-white border border-transparent'
                }`}
                title="Guided Academy Mode: step-by-step explanations, gel simulations, and quizzes"
              >
                <GraduationCap className="w-3.5 h-3.5 text-cyan-400" />
                <span>Guided Mode</span>
              </button>

              <button
                onClick={() => handleModeSwitch('pro')}
                className={`flex items-center gap-1.5 px-3 py-1.5 rounded-xl transition-all ${
                  workspaceMode === 'pro'
                    ? 'bg-purple-500/20 text-purple-300 border border-purple-400/30 shadow-sm shadow-purple-500/10'
                    : 'text-slate-400 hover:text-white border border-transparent'
                }`}
                title="Pro Wet-Lab Mode: high-throughput workstation for live design and deconvolution"
              >
                <Zap className="w-3.5 h-3.5 text-purple-400" />
                <span>Pro Mode</span>
              </button>
            </div>

            {/* Navigation Tabs based on Mode */}
            <nav className="flex items-center gap-1.5 pl-2 border-l border-slate-800">
              <button
                onClick={() => setActiveTab('workbench')}
                className={`flex items-center gap-2 px-3 py-1.5 rounded-xl text-xs font-semibold transition-all ${
                  activeTab === 'workbench'
                    ? 'bg-slate-850 text-white border border-slate-700 shadow-sm'
                    : 'text-slate-400 hover:text-white hover:bg-slate-900 border border-transparent'
                }`}
              >
                <Workflow className="w-3.5 h-3.5 text-cyan-400" />
                <span>Workbench</span>
                <span className="text-[9px] uppercase tracking-wider font-extrabold px-1.5 py-0.2 rounded bg-cyan-500/20 text-cyan-300">
                  5 Stages
                </span>
              </button>

              {workspaceMode === 'guided' ? (
                <button
                  onClick={() => setActiveTab('academy')}
                  className={`flex items-center gap-2 px-3 py-1.5 rounded-xl text-xs font-semibold transition-all ${
                    activeTab === 'academy'
                      ? 'bg-emerald-500/15 text-emerald-300 border border-emerald-500/40 shadow-sm shadow-emerald-500/10'
                      : 'text-slate-400 hover:text-white hover:bg-slate-900 border border-transparent'
                  }`}
                >
                  <GraduationCap className="w-3.5 h-3.5 text-emerald-400" />
                  <span>Curriculum</span>
                </button>
              ) : (
                <button
                  onClick={() => setActiveTab('studio')}
                  className={`flex items-center gap-2 px-3 py-1.5 rounded-xl text-xs font-semibold transition-all ${
                    activeTab === 'studio'
                      ? 'bg-purple-500/20 text-purple-300 border border-purple-500/40 shadow-sm shadow-purple-500/10'
                      : 'text-slate-400 hover:text-white hover:bg-slate-900 border border-transparent'
                  }`}
                >
                  <Sparkles className="w-3.5 h-3.5 text-purple-400" />
                  <span>Full-Screen Studio</span>
                </button>
              )}

              {/* More Labs & Modules Dropdown */}
              <div className="relative" ref={menuRef}>
                <button
                  onClick={() => setShowMoreMenu(prev => !prev)}
                  className={`flex items-center gap-1 px-2.5 py-1.5 rounded-xl text-xs font-medium transition-all ${
                    isSecondaryActive
                      ? 'bg-slate-800 text-white border border-slate-700'
                      : 'text-slate-400 hover:text-slate-200 hover:bg-slate-900 border border-transparent'
                  }`}
                >
                  <span>Modules</span>
                  <ChevronDown className={`w-3 h-3 transition-transform ${showMoreMenu ? 'rotate-180' : ''}`} />
                </button>

                {showMoreMenu && (
                  <div className="absolute right-0 mt-2 w-56 rounded-2xl bg-slate-900/95 backdrop-blur-md border border-slate-800 shadow-2xl p-1.5 z-50 space-y-1 animate-in fade-in zoom-in-95 duration-150">
                    <button
                      onClick={() => { setActiveTab('simulator'); setShowMoreMenu(false); }}
                      className={`w-full flex items-center gap-2.5 px-3 py-2 rounded-xl text-xs font-medium text-left transition-colors ${
                        activeTab === 'simulator' ? 'bg-amber-500/20 text-amber-300' : 'text-slate-300 hover:bg-slate-800'
                      }`}
                    >
                      <FlaskConical className="w-4 h-4 text-amber-400" />
                      <div>
                        <div className="font-semibold text-white">Virtual Bench</div>
                        <div className="text-[10px] text-slate-400">Pipetting & Neon Electroporation</div>
                      </div>
                    </button>

                    <button
                      onClick={() => { setActiveTab('frugal'); setShowMoreMenu(false); }}
                      className={`w-full flex items-center gap-2.5 px-3 py-2 rounded-xl text-xs font-medium text-left transition-colors ${
                        activeTab === 'frugal' ? 'bg-emerald-500/20 text-emerald-300' : 'text-slate-300 hover:bg-slate-800'
                      }`}
                    >
                      <Globe2 className="w-4 h-4 text-emerald-400" />
                      <div>
                        <div className="font-semibold text-white">Frugal Lab</div>
                        <div className="text-[10px] text-slate-400">Cost Breakdown & Reagent Swaps</div>
                      </div>
                    </button>

                    <button
                      onClick={() => { setActiveTab('missions'); setShowMoreMenu(false); }}
                      className={`w-full flex items-center gap-2.5 px-3 py-2 rounded-xl text-xs font-medium text-left transition-colors ${
                        activeTab === 'missions' ? 'bg-purple-500/20 text-purple-300' : 'text-slate-300 hover:bg-slate-800'
                      }`}
                    >
                      <ShieldAlert className="w-4 h-4 text-purple-400" />
                      <div>
                        <div className="font-semibold text-white">Rare Disease Cases</div>
                        <div className="text-[10px] text-slate-400">HBB, APOE & MYD88</div>
                      </div>
                    </button>

                    <button
                      onClick={() => { setActiveTab('suite'); setShowMoreMenu(false); }}
                      className={`w-full flex items-center gap-2.5 px-3 py-2 rounded-xl text-xs font-medium text-left transition-colors ${
                        activeTab === 'suite' ? 'bg-blue-500/20 text-blue-300' : 'text-slate-300 hover:bg-slate-800'
                      }`}
                    >
                      <Sparkles className="w-4 h-4 text-blue-400" />
                      <div>
                        <div className="font-semibold text-white">Tool Launchpad</div>
                        <div className="text-[10px] text-slate-400">External Web Apps & Links</div>
                      </div>
                    </button>
                  </div>
                )}
              </div>
            </nav>
          </div>

          {/* Right Action: Mode-aware Badge & Standalone Studio */}
          <div className="flex items-center gap-2.5">
            {/* Mastery Points Badge (Shown in Guided mode or when certified) */}
            {(workspaceMode === 'guided' || totalQuizzesPassed >= 4) && (
              <div 
                onClick={onOpenCertificate}
                title="Click to view course completion certificate"
                className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-slate-900 border border-slate-800 text-amber-400 cursor-pointer hover:border-amber-500/50 transition-colors"
              >
                <Award className="w-4 h-4 text-amber-400" />
                <span className="text-xs font-bold">{masteryPoints} pts</span>
                {totalQuizzesPassed >= 4 && (
                  <span className="text-[10px] bg-amber-500/20 text-amber-300 px-1.5 py-0.5 rounded ml-0.5 font-semibold">
                    Certified
                  </span>
                )}
              </div>
            )}

            {/* Standalone Production Studio Button */}
            <a
              href="./studio/"
              target="_blank"
              rel="noopener noreferrer"
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-gradient-to-r from-purple-600 to-indigo-600 hover:from-purple-500 hover:to-indigo-500 text-white font-bold text-xs shadow-md shadow-purple-500/20 border border-purple-400/30 transition-all group"
              title="Open full standalone Assured Studio in new tab"
            >
              <Zap className="w-3.5 h-3.5 text-purple-300 group-hover:scale-110 transition-transform" />
              <span className="hidden sm:inline">Open Studio</span>
              <ExternalLink className="w-3 h-3 text-purple-300 opacity-80" />
            </a>
          </div>
        </div>

        {/* Mobile Navigation bar */}
        <div className="flex md:hidden items-center justify-around py-2 border-t border-slate-900 text-xs">
          <button 
            onClick={() => setActiveTab('workbench')} 
            className={`px-3 py-1.5 rounded-lg font-semibold ${activeTab === 'workbench' ? 'text-cyan-400 bg-cyan-950/40' : 'text-slate-400'}`}
          >
            🧪 Sandbox
          </button>
          <button 
            onClick={() => setActiveTab('academy')} 
            className={`px-3 py-1.5 rounded-lg font-semibold ${activeTab === 'academy' ? 'text-emerald-400 bg-emerald-950/40' : 'text-slate-400'}`}
          >
            📚 Curriculum
          </button>
          <button 
            onClick={() => setActiveTab('simulator')} 
            className={`px-3 py-1.5 rounded-lg font-semibold ${activeTab === 'simulator' ? 'text-amber-400 bg-amber-950/40' : 'text-slate-400'}`}
          >
            🧫 Lab
          </button>
          <a
            href="./studio/"
            target="_blank"
            rel="noopener noreferrer"
            className="px-3 py-1.5 rounded-lg font-semibold text-purple-300 bg-purple-950/40"
          >
            ⚡ Studio ↗
          </a>
        </div>
      </div>
    </header>
  );
};
