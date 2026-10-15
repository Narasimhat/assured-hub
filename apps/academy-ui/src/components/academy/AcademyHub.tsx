import React, { useState } from 'react';
import { 
  CheckCircle, 
  ChevronRight, 
  Award,
  Sparkles,
  BookOpen,
  Microscope,
  Dna,
  FlaskConical,
  Binary
} from 'lucide-react';
import { CURRICULUM_TRACKS } from '../../data/curriculum';
import { LessonViewer } from './LessonViewer';

interface AcademyHubProps {
  completedLessons: string[];
  onPassQuiz: (lessonId: string, points: number) => void;
  onNavigateToSimulator: () => void;
}

export const AcademyHub: React.FC<AcademyHubProps> = ({
  completedLessons,
  onPassQuiz,
  onNavigateToSimulator
}) => {
  const [activeTrackId, setActiveTrackId] = useState(CURRICULUM_TRACKS[0].id);
  const [activeLessonId, setActiveLessonId] = useState(CURRICULUM_TRACKS[0].lessons[0].id);

  const activeTrack = CURRICULUM_TRACKS.find(t => t.id === activeTrackId) || CURRICULUM_TRACKS[0];
  const activeLesson = activeTrack.lessons.find(l => l.id === activeLessonId) || activeTrack.lessons[0];

  const totalLessons = CURRICULUM_TRACKS.reduce((acc, t) => acc + t.lessons.length, 0);
  const progressPercent = Math.round((completedLessons.length / totalLessons) * 100);

  const getIcon = (iconName: string) => {
    switch(iconName) {
      case 'Microscope': return <Microscope className="w-5 h-5" />;
      case 'Dna': return <Dna className="w-5 h-5" />;
      case 'FlaskConical': return <FlaskConical className="w-5 h-5" />;
      case 'Binary': return <Binary className="w-5 h-5" />;
      default: return <BookOpen className="w-5 h-5" />;
    }
  };

  const handleNextLesson = () => {
    const currentLessonIdx = activeTrack.lessons.findIndex(l => l.id === activeLessonId);
    if (currentLessonIdx < activeTrack.lessons.length - 1) {
      setActiveLessonId(activeTrack.lessons[currentLessonIdx + 1].id);
    } else {
      const currentTrackIdx = CURRICULUM_TRACKS.findIndex(t => t.id === activeTrackId);
      if (currentTrackIdx < CURRICULUM_TRACKS.length - 1) {
        const nextTrack = CURRICULUM_TRACKS[currentTrackIdx + 1];
        setActiveTrackId(nextTrack.id);
        setActiveLessonId(nextTrack.lessons[0].id);
      }
    }
  };

  return (
    <div className="space-y-8 animate-in fade-in duration-300">
      
      {/* Top Banner: Khan Academy Style Progress & Motivation */}
      <div className="relative overflow-hidden rounded-3xl bg-gradient-to-r from-slate-900 via-slate-900 to-cyan-950/60 border border-slate-800 p-6 sm:p-8 shadow-2xl">
        <div className="relative z-10 flex flex-col md:flex-row md:items-center justify-between gap-6">
          <div className="space-y-2 max-w-2xl">
            <div className="flex items-center gap-2">
              <span className="text-xs font-bold uppercase tracking-wider text-cyan-400 bg-cyan-950/80 border border-cyan-800/80 px-2.5 py-0.5 rounded-full">
                Curriculum Hub
              </span>
              <span className="text-xs text-slate-400">STAR Protocols Workflow</span>
            </div>
            <h1 className="text-2xl sm:text-3xl font-black text-white tracking-tight">
              Mastering Pluripotent Stem Cell Genome Engineering
            </h1>
            <p className="text-sm text-slate-300 leading-relaxed">
              Step through the biological, computational and wet-lab principles behind the ASSURED protocol (Ludwik et al., STAR Protocols 2023) to generate isogenic disease models in hiPSCs.
            </p>
            <p className="text-xs text-amber-200/90 leading-relaxed bg-amber-950/20 border border-amber-800/40 rounded-xl p-3">
              <strong>Course text under review.</strong> Specific statements about confluence, RNP mixes, electroporation, recovery, donor design, cloning and primer placement were corrected against the paper. The rest of the course text has not been checked line by line, so where any lesson and the paper disagree, follow the paper.
            </p>
          </div>

          {/* Progress Card */}
          <div className="shrink-0 bg-slate-950/80 border border-slate-800/90 rounded-2xl p-5 w-full md:w-64 space-y-3">
            <div className="flex items-center justify-between text-xs">
              <span className="text-slate-400 font-medium">Curriculum Progress</span>
              <span className="text-cyan-400 font-bold">{progressPercent}%</span>
            </div>
            <div className="w-full bg-slate-800 h-2 rounded-full overflow-hidden">
              <div 
                className="bg-gradient-to-r from-cyan-500 to-emerald-500 h-full rounded-full transition-all duration-500"
                style={{ width: `${progressPercent}%` }}
              />
            </div>
            <div className="flex items-center justify-between text-[11px] text-slate-400">
              <span>{completedLessons.length} of {totalLessons} mastered</span>
              <span className="flex items-center gap-1 text-amber-400 font-semibold">
                <Award className="w-3.5 h-3.5" />
                <span>4 Badges</span>
              </span>
            </div>
          </div>
        </div>

        {/* Decorative background glow */}
        <div className="absolute top-0 right-0 -mr-20 -mt-20 w-80 h-80 bg-cyan-500/10 rounded-full blur-3xl pointer-events-none" />
      </div>

      {/* Main Grid: Track Navigator (Left) + Lesson Viewer (Right) */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
        
        {/* Track & Lesson Sidebar (4 Cols) */}
        <div className="lg:col-span-4 space-y-6">
          <div className="space-y-4">
            <h3 className="text-xs font-bold text-slate-400 uppercase tracking-wider px-1">
              Learning Tracks
            </h3>

            {CURRICULUM_TRACKS.map(track => {
              const isTrackSelected = track.id === activeTrackId;
              const trackLessonsMastered = track.lessons.filter(l => completedLessons.includes(l.id)).length;
              const isTrackComplete = trackLessonsMastered === track.lessons.length;

              return (
                <div
                  key={track.id}
                  className={`rounded-2xl border transition-all duration-200 overflow-hidden ${
                    isTrackSelected 
                      ? 'bg-slate-900 border-cyan-500/50 shadow-lg shadow-cyan-950/30' 
                      : 'bg-slate-900/40 border-slate-800/80 hover:border-slate-700'
                  }`}
                >
                  {/* Track Header Card */}
                  <div
                    onClick={() => {
                      setActiveTrackId(track.id);
                      setActiveLessonId(track.lessons[0].id);
                    }}
                    className="p-4 cursor-pointer flex items-center justify-between gap-3"
                  >
                    <div className="flex items-center gap-3">
                      <div className={`w-9 h-9 rounded-xl flex items-center justify-center shrink-0 bg-gradient-to-tr ${track.color} text-slate-950 font-bold shadow-md`}>
                        {getIcon(track.icon)}
                      </div>
                      <div>
                        <div className="flex items-center gap-2">
                          <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">
                            Track {track.trackNumber}
                          </span>
                          {isTrackComplete && (
                            <CheckCircle className="w-3.5 h-3.5 text-emerald-400" />
                          )}
                        </div>
                        <h4 className="text-sm font-bold text-white leading-snug">
                          {track.title}
                        </h4>
                      </div>
                    </div>
                    <ChevronRight className={`w-4 h-4 text-slate-500 transition-transform ${isTrackSelected ? 'rotate-90 text-cyan-400' : ''}`} />
                  </div>

                  {/* Nested Lesson List (Visible when selected) */}
                  {isTrackSelected && (
                    <div className="px-3 pb-3 pt-1 space-y-1.5 border-t border-slate-800/60 bg-slate-950/40">
                      {track.lessons.map((lesson, idx) => {
                        const isLessonSelected = lesson.id === activeLessonId;
                        const isMastered = completedLessons.includes(lesson.id);

                        return (
                          <button
                            key={lesson.id}
                            onClick={() => setActiveLessonId(lesson.id)}
                            className={`w-full text-left px-3 py-2.5 rounded-xl text-xs font-medium transition-all flex items-center justify-between gap-2 ${
                              isLessonSelected
                                ? 'bg-cyan-500/10 text-cyan-300 border border-cyan-500/30 font-semibold'
                                : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800/60 border border-transparent'
                            }`}
                          >
                            <div className="flex items-center gap-2 overflow-hidden">
                              <span className="text-[10px] text-slate-500 font-mono">
                                {track.trackNumber}.{idx + 1}
                              </span>
                              <span className="truncate">{lesson.title}</span>
                            </div>

                            {isMastered ? (
                              <CheckCircle className="w-3.5 h-3.5 text-emerald-400 shrink-0" />
                            ) : (
                              <span className="text-[10px] text-slate-600 shrink-0">
                                {lesson.duration}
                              </span>
                            )}
                          </button>
                        );
                      })}
                    </div>
                  )}
                </div>
              );
            })}
          </div>

          {/* Practice Wet Lab Callout */}
          <div className="p-5 rounded-2xl bg-gradient-to-br from-amber-950/30 via-slate-900 to-slate-900 border border-amber-800/40 space-y-3">
            <div className="flex items-center gap-2 text-amber-400 text-xs font-bold uppercase tracking-wider">
              <Sparkles className="w-4 h-4" />
              <span>Interactive Bench Training</span>
            </div>
            <p className="text-xs text-slate-300 leading-relaxed">
              Test your protocol tacit knowledge in the Virtual Wet Lab: perform confluency checks, RNP nucleofection, and 96-well limiting dilution cloning!
            </p>
            <button
              onClick={onNavigateToSimulator}
              className="w-full py-2 px-3 rounded-xl bg-amber-500 hover:bg-amber-400 text-slate-950 text-xs font-bold transition-all shadow-md shadow-amber-500/20"
            >
              Launch Virtual Lab Bench →
            </button>
          </div>
        </div>

        {/* Active Lesson Content (8 Cols) */}
        <div className="lg:col-span-8">
          <LessonViewer
            lesson={activeLesson}
            trackColor={activeTrack.color}
            isCompleted={completedLessons.includes(activeLesson.id)}
            onPassQuiz={onPassQuiz}
            onNextLesson={handleNextLesson}
          />
        </div>

      </div>

    </div>
  );
};
