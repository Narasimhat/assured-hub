import React, { useState, useEffect } from 'react';
import { ExternalLink } from 'lucide-react';
import { TabType, RareDiseaseMission, WorkspaceMode } from './types';
import { Navbar } from './components/layout/Navbar';
import { Footer } from './components/layout/Footer';
import { AcademyHub } from './components/academy/AcademyHub';
import { VirtualLab } from './components/simulator/VirtualLab';
import { FrugalLabConfig } from './components/frugal/FrugalLabConfig';
import { RareDiseaseHub } from './components/missions/RareDiseaseHub';
import { ToolLaunchpad } from './components/tools/ToolLaunchpad';
import { CertificateModal } from './components/certificate/CertificateModal';
import { UnifiedPipeline } from './components/pipeline/UnifiedPipeline';

export const App: React.FC = () => {
  const [activeTab, setActiveTab] = useState<TabType>('workbench');
  const [workspaceMode, setWorkspaceMode] = useState<WorkspaceMode>(() => {
    const saved = localStorage.getItem('assured_workspace_mode');
    return (saved === 'pro' || saved === 'guided') ? (saved as WorkspaceMode) : 'guided';
  });

  // Persisted state in localStorage
  const [masteryPoints, setMasteryPoints] = useState<number>(() => {
    const saved = localStorage.getItem('assured_mastery_pts');
    return saved ? Number(saved) : 150; // Starter points for onboarding
  });

  const [completedLessons, setCompletedLessons] = useState<string[]>(() => {
    const saved = localStorage.getItem('assured_completed_lessons');
    return saved ? JSON.parse(saved) : ['lesson-1-1'];
  });

  const [showCertificate, setShowCertificate] = useState(false);

  useEffect(() => {
    localStorage.setItem('assured_workspace_mode', workspaceMode);
  }, [workspaceMode]);

  useEffect(() => {
    localStorage.setItem('assured_mastery_pts', String(masteryPoints));
  }, [masteryPoints]);

  useEffect(() => {
    localStorage.setItem('assured_completed_lessons', JSON.stringify(completedLessons));
  }, [completedLessons]);

  const handlePassQuiz = (lessonId: string, pointsAwarded: number) => {
    if (!completedLessons.includes(lessonId)) {
      setCompletedLessons(prev => [...prev, lessonId]);
      setMasteryPoints(prev => prev + pointsAwarded);
    }
  };

  const handleAwardMastery = (points: number) => {
    setMasteryPoints(prev => prev + points);
  };

  const handleSelectMissionForLab = (_mission: RareDiseaseMission) => {
    setActiveTab('simulator');
  };

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 flex flex-col font-sans selection:bg-cyan-500 selection:text-slate-950">
      
      {/* Navigation */}
      <Navbar
        activeTab={activeTab}
        setActiveTab={setActiveTab}
        workspaceMode={workspaceMode}
        setWorkspaceMode={setWorkspaceMode}
        masteryPoints={masteryPoints}
        totalQuizzesPassed={completedLessons.length}
        onOpenCertificate={() => setShowCertificate(true)}
      />

      {/* Main Content Area */}
      <main className="flex-1 max-w-7xl w-full mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {activeTab === 'workbench' && (
          <UnifiedPipeline workspaceMode={workspaceMode} />
        )}

        {activeTab === 'academy' && (
          <AcademyHub
            completedLessons={completedLessons}
            onPassQuiz={handlePassQuiz}
            onNavigateToSimulator={() => setActiveTab('simulator')}
          />
        )}

        {activeTab === 'simulator' && (
          <VirtualLab
            onAwardMastery={handleAwardMastery}
          />
        )}

        {activeTab === 'frugal' && (
          <FrugalLabConfig />
        )}

        {activeTab === 'missions' && (
          <RareDiseaseHub
            onSelectMissionForLab={handleSelectMissionForLab}
          />
        )}

        {activeTab === 'suite' && (
          <ToolLaunchpad />
        )}

        {activeTab === 'studio' && (
          <div className="space-y-4 animate-in fade-in duration-300">
            <div className="p-6 rounded-3xl bg-gradient-to-r from-purple-950/60 via-slate-900 to-slate-900 border border-purple-800/60 shadow-xl flex flex-wrap items-center justify-between gap-4">
              <div className="space-y-1">
                <div className="flex items-center gap-2">
                  <span className="px-2.5 py-0.5 rounded-full text-[10px] font-black uppercase tracking-wider bg-purple-500/20 text-purple-300 border border-purple-500/30">
                    Standalone Production Studio
                  </span>
                  <span className="text-xs text-slate-400 font-mono">End-to-End CRISPR Genome Engineering</span>
                </div>
                <h1 className="text-2xl sm:text-3xl font-black text-white tracking-tight">
                  Assured Studio
                </h1>
                <p className="text-xs text-slate-300 max-w-2xl">
                  Unified CRISPR workspace: in-silico SpCas9 design, vendor order sheets, in-silico gel electrophoresis, Star Protocols wet-lab execution, and 96-well Sanger QC deconvolution.
                </p>
              </div>
              <div className="flex items-center gap-2">
                <a
                  href="./studio/"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="flex items-center gap-1.5 px-4 py-2.5 rounded-xl bg-gradient-to-r from-purple-500 to-indigo-500 hover:from-purple-400 hover:to-indigo-400 text-white font-bold text-xs shadow-md shadow-purple-500/25 transition-all"
                >
                  <span>Open in Full Window</span>
                  <ExternalLink className="w-3.5 h-3.5" />
                </a>
              </div>
            </div>

            <div className="w-full h-[750px] rounded-3xl overflow-hidden border border-slate-800 shadow-2xl bg-slate-950">
              <iframe
                src="./studio/"
                title="Assured Studio"
                className="w-full h-full border-0"
              />
            </div>
          </div>
        )}
      </main>

      {/* Footer */}
      <Footer />

      {/* Certificate Modal */}
      {showCertificate && (
        <CertificateModal
          onClose={() => setShowCertificate(false)}
          masteryPoints={masteryPoints}
          totalQuizzesPassed={completedLessons.length}
        />
      )}

    </div>
  );
};

export default App;
