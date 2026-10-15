import React from 'react';
import { 
  Dna, 
  GraduationCap, 
  FlaskConical, 
  Globe2, 
  ShieldAlert, 
  ExternalLink,
  Award,
  Sparkles,
  Workflow
} from 'lucide-react';
import { TabType } from '../../types';

interface NavbarProps {
  activeTab: TabType;
  setActiveTab: (tab: TabType) => void;
  masteryPoints: number;
  totalQuizzesPassed: number;
  onOpenCertificate: () => void;
}

export const Navbar: React.FC<NavbarProps> = ({
  activeTab,
  setActiveTab,
  masteryPoints,
  totalQuizzesPassed,
  onOpenCertificate
}) => {
  return (
    <header className="sticky top-0 z-50 bg-slate-950/90 backdrop-blur-md border-b border-slate-800">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16">
          
          {/* Logo & Branding */}
          <div className="flex items-center gap-3 cursor-pointer" onClick={() => setActiveTab('academy')}>
            <div className="relative flex items-center justify-center w-10 h-10 rounded-xl bg-gradient-to-tr from-cyan-500 to-emerald-500 text-slate-950 shadow-lg shadow-cyan-500/20">
              <Dna className="w-6 h-6 animate-pulse" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <span className="font-extrabold text-lg tracking-tight bg-gradient-to-r from-cyan-400 via-teal-300 to-emerald-400 bg-clip-text text-transparent">
                  ASSURED Academy
                </span>
                <span className="text-[10px] font-semibold px-2 py-0.5 rounded-full bg-cyan-950 text-cyan-400 border border-cyan-800/60">
                  v1.0 hiPSC
                </span>
              </div>
              <p className="text-xs text-slate-400 hidden sm:block">
                Democratizing Pluripotent Stem Cell Gene Editing
              </p>
            </div>
          </div>

          {/* Navigation Tabs */}
          <nav className="hidden md:flex items-center gap-1">
            <button
              onClick={() => setActiveTab('workbench')}
              className={`flex items-center gap-2 px-3 py-2 rounded-lg text-sm font-medium transition-all ${
                activeTab === 'workbench'
                  ? 'bg-gradient-to-r from-cyan-500/20 to-emerald-500/20 text-cyan-300 border border-cyan-500/40 shadow-sm shadow-cyan-500/10'
                  : 'text-slate-300 hover:text-white hover:bg-slate-900'
              }`}
            >
              <Workflow className="w-4 h-4 text-cyan-400" />
              <span className="font-bold">Workbench</span>
              <span className="text-[9px] uppercase tracking-wider font-extrabold px-1.5 py-0.5 rounded bg-cyan-500/20 text-cyan-300 border border-cyan-400/40">
                5-Stage
              </span>
            </button>

            <button
              onClick={() => setActiveTab('academy')}
              className={`flex items-center gap-2 px-3 py-2 rounded-lg text-sm font-medium transition-all ${
                activeTab === 'academy'
                  ? 'bg-cyan-500/10 text-cyan-400 border border-cyan-500/30'
                  : 'text-slate-400 hover:text-slate-200 hover:bg-slate-900'
              }`}
            >
              <GraduationCap className="w-4 h-4" />
              <span>Curriculum</span>
            </button>

            <button
              onClick={() => setActiveTab('simulator')}
              className={`flex items-center gap-2 px-3 py-2 rounded-lg text-sm font-medium transition-all ${
                activeTab === 'simulator'
                  ? 'bg-amber-500/10 text-amber-400 border border-amber-500/30'
                  : 'text-slate-400 hover:text-slate-200 hover:bg-slate-900'
              }`}
            >
              <FlaskConical className="w-4 h-4" />
              <span>Virtual Bench</span>
              <span className="relative flex h-2 w-2">
                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-amber-400 opacity-75"></span>
                <span className="relative inline-flex rounded-full h-2 w-2 bg-amber-500"></span>
              </span>
            </button>

            <button
              onClick={() => setActiveTab('frugal')}
              className={`flex items-center gap-2 px-3 py-2 rounded-lg text-sm font-medium transition-all ${
                activeTab === 'frugal'
                  ? 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/30'
                  : 'text-slate-400 hover:text-slate-200 hover:bg-slate-900'
              }`}
            >
              <Globe2 className="w-4 h-4" />
              <span>Frugal Lab</span>
            </button>

            <button
              onClick={() => setActiveTab('missions')}
              className={`flex items-center gap-2 px-3 py-2 rounded-lg text-sm font-medium transition-all ${
                activeTab === 'missions'
                  ? 'bg-purple-500/10 text-purple-400 border border-purple-500/30'
                  : 'text-slate-400 hover:text-slate-200 hover:bg-slate-900'
              }`}
            >
              <ShieldAlert className="w-4 h-4" />
              <span>Rare Diseases</span>
            </button>

            <button
              onClick={() => setActiveTab('suite')}
              className={`flex items-center gap-2 px-3 py-2 rounded-lg text-sm font-medium transition-all ${
                activeTab === 'suite'
                  ? 'bg-blue-500/10 text-blue-400 border border-blue-500/30'
                  : 'text-slate-400 hover:text-slate-200 hover:bg-slate-900'
              }`}
            >
              <Sparkles className="w-4 h-4" />
              <span>ASSURED Suite</span>
            </button>
          </nav>

          {/* Right Action: Mastery & Live Tools */}
          <div className="flex items-center gap-3">
            {/* Mastery Points */}
            <div 
              onClick={onOpenCertificate}
              title="Click to view course completion certificate"
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-slate-900 border border-slate-800 text-amber-400 cursor-pointer hover:border-amber-500/50 transition-colors"
            >
              <Award className="w-4 h-4 text-amber-400" />
              <span className="text-xs font-bold">{masteryPoints} pts</span>
              {totalQuizzesPassed >= 4 && (
                <span className="text-[10px] bg-amber-500/20 text-amber-300 px-1.5 py-0.5 rounded ml-1 font-semibold">
                  Certified
                </span>
              )}
            </div>

            {/* Quick Link to Vercel Tools */}
            <div className="hidden lg:flex items-center gap-2 pl-2 border-l border-slate-800">
              <a
                href="https://assured-crispr-design.vercel.app"
                target="_blank"
                rel="noreferrer"
                className="flex items-center gap-1 text-xs text-cyan-400 hover:text-cyan-300 font-medium px-2 py-1 rounded bg-cyan-950/60 border border-cyan-800/50 hover:bg-cyan-900/60 transition-colors"
              >
                <span>Designer</span>
                <ExternalLink className="w-3 h-3" />
              </a>
              <a
                href="https://assured-qc.vercel.app"
                target="_blank"
                rel="noreferrer"
                className="flex items-center gap-1 text-xs text-purple-400 hover:text-purple-300 font-medium px-2 py-1 rounded bg-purple-950/60 border border-purple-800/50 hover:bg-purple-900/60 transition-colors"
              >
                <span>QC Tool</span>
                <ExternalLink className="w-3 h-3" />
              </a>
            </div>
          </div>
        </div>

        {/* Mobile Navigation bar */}
        <div className="flex md:hidden items-center justify-around py-2 border-t border-slate-900 overflow-x-auto text-xs">
          <button 
            onClick={() => setActiveTab('workbench')} 
            className={`px-2 py-1 ${activeTab === 'workbench' ? 'text-cyan-400 font-bold' : 'text-slate-400'}`}
          >
            Workbench
          </button>
          <button 
            onClick={() => setActiveTab('academy')} 
            className={`px-2 py-1 ${activeTab === 'academy' ? 'text-cyan-400 font-bold' : 'text-slate-400'}`}
          >
            Curriculum
          </button>
          <button 
            onClick={() => setActiveTab('simulator')} 
            className={`px-2 py-1 ${activeTab === 'simulator' ? 'text-amber-400 font-bold' : 'text-slate-400'}`}
          >
            Virtual Lab
          </button>
          <button 
            onClick={() => setActiveTab('frugal')} 
            className={`px-2 py-1 ${activeTab === 'frugal' ? 'text-emerald-400 font-bold' : 'text-slate-400'}`}
          >
            Frugal
          </button>
          <button 
            onClick={() => setActiveTab('missions')} 
            className={`px-2 py-1 ${activeTab === 'missions' ? 'text-purple-400 font-bold' : 'text-slate-400'}`}
          >
            Diseases
          </button>
          <button 
            onClick={() => setActiveTab('suite')} 
            className={`px-2 py-1 ${activeTab === 'suite' ? 'text-blue-400 font-bold' : 'text-slate-400'}`}
          >
            Suite
          </button>
        </div>
      </div>
    </header>
  );
};
