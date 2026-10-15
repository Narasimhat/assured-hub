import React, { useState, useEffect } from 'react';
import { TabType, RareDiseaseMission } from './types';
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
        masteryPoints={masteryPoints}
        totalQuizzesPassed={completedLessons.length}
        onOpenCertificate={() => setShowCertificate(true)}
      />

      {/* Main Content Area */}
      <main className="flex-1 max-w-7xl w-full mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {activeTab === 'workbench' && (
          <UnifiedPipeline />
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
