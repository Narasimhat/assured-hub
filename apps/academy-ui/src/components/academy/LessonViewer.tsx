import React, { useState } from 'react';
import { 
  Clock, 
  Lightbulb, 
  FlaskConical, 
  CheckCircle, 
  HelpCircle,
  Dna,
  ArrowRight,
  ShieldCheck
} from 'lucide-react';
import { Lesson } from '../../types';
import { QuizModal } from './QuizModal';

interface LessonViewerProps {
  lesson: Lesson;
  trackColor: string;
  isCompleted: boolean;
  onPassQuiz: (lessonId: string, points: number) => void;
  onNextLesson?: () => void;
}

export const LessonViewer: React.FC<LessonViewerProps> = ({
  lesson,
  isCompleted,
  onPassQuiz,
  onNextLesson
}) => {
  const [showQuiz, setShowQuiz] = useState(false);

  return (
    <div className="bg-slate-900/90 border border-slate-800 rounded-2xl p-6 sm:p-8 shadow-xl">
      {/* Lesson Header */}
      <div className="flex flex-wrap items-center justify-between gap-4 pb-6 border-b border-slate-800/80 mb-6">
        <div>
          <div className="flex items-center gap-2 mb-2">
            <span className="text-xs font-semibold px-2.5 py-1 rounded-full bg-cyan-950 text-cyan-400 border border-cyan-800/60">
              Interactive Masterclass
            </span>
            <div className="flex items-center gap-1 text-xs text-slate-400">
              <Clock className="w-3.5 h-3.5" />
              <span>{lesson.duration}</span>
            </div>
          </div>
          <h2 className="text-2xl font-extrabold text-white tracking-tight">
            {lesson.title}
          </h2>
        </div>

        {/* Status / Quiz Trigger */}
        <div className="flex items-center gap-3">
          {isCompleted && (
            <div className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-emerald-950/60 border border-emerald-800/70 text-emerald-300 text-xs font-semibold">
              <CheckCircle className="w-4 h-4 text-emerald-400" />
              <span>Mastery Verified</span>
            </div>
          )}

          {lesson.quiz && (
            <button
              onClick={() => setShowQuiz(true)}
              className="flex items-center gap-2 px-4 py-2 rounded-xl bg-cyan-500 hover:bg-cyan-400 text-slate-950 text-sm font-bold shadow-lg shadow-cyan-500/20 transition-all hover:scale-102"
            >
              <HelpCircle className="w-4 h-4" />
              <span>{isCompleted ? 'Retake Quiz' : 'Take Quiz (+50 pts)'}</span>
            </button>
          )}
        </div>
      </div>

      {/* Summary Box */}
      <div className="p-4 rounded-xl bg-slate-950 border border-slate-800/80 mb-6">
        <p className="text-sm text-cyan-200/90 font-medium leading-relaxed">
          {lesson.summary}
        </p>
      </div>

      {/* Main Educational Paragraphs */}
      <div className="space-y-4 mb-8 text-sm leading-relaxed text-slate-300">
        {lesson.content.map((para, idx) => (
          <p key={idx} className="tracking-wide">
            {para}
          </p>
        ))}
      </div>

      {/* Interactive Visual Element: Asymmetric ssODN / Silent PAM Diagram */}
      <div className="mb-8 p-5 rounded-xl bg-slate-950 border border-slate-800">
        <div className="flex items-center justify-between mb-3 text-xs text-slate-400 font-semibold uppercase tracking-wider">
          <span className="flex items-center gap-1.5 text-cyan-400">
            <Dna className="w-4 h-4" />
            <span>Molecular Architecture Blueprint</span>
          </span>
          <span>Non-target strand complementary</span>
        </div>

        {/* Visual ssODN schematic */}
        <div className="bg-slate-900 p-4 rounded-lg border border-slate-800/90 font-mono text-xs overflow-x-auto space-y-2">
          <div className="flex items-center gap-2 text-slate-400">
            <span className="w-20 shrink-0 font-bold text-slate-500">Target DNA:</span>
            <span className="text-slate-300">5'-...ACCGT<span className="bg-rose-500/20 text-rose-300 px-1 font-bold rounded">C</span>TGGACTCCT<span className="bg-amber-500/20 text-amber-300 px-1 font-bold rounded">AGG</span>CGGA...-3'</span>
          </div>

          <div className="flex items-center gap-2 text-slate-400">
            <span className="w-20 shrink-0 font-bold text-slate-500">Cas9 Cleave:</span>
            <span className="text-rose-400 font-bold">                 ✂️ (3 bp upstream of PAM)</span>
          </div>

          <div className="flex items-center gap-2 text-slate-400">
            <span className="w-20 shrink-0 font-bold text-cyan-400">ssODN Donor:</span>
            <span className="text-emerald-400 font-bold">5\'-[36 nt Distal Arm]----<span className="bg-emerald-500/20 text-emerald-300 px-1 rounded underline">T (Corrected)</span>----<span className="bg-amber-500/20 text-amber-300 px-1 rounded">AGA (Silent Block)</span>----[91 nt Proximal Arm]-3\'</span>
          </div>
        </div>

        <p className="text-[11px] text-slate-500 mt-2">
          * Notice how the silent mutation alters the <span className="text-amber-400 font-semibold">AGG</span> PAM to <span className="text-amber-400 font-semibold">AGA</span>, rendering the repaired allele refractory to Cas9 re-cutting while preserving the native amino acid sequence.
        </p>
      </div>

      {/* Key Takeaway & Bench Secret */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-8">
        <div className="p-4 rounded-xl bg-emerald-950/20 border border-emerald-800/40">
          <div className="flex items-center gap-2 text-emerald-400 font-bold text-xs uppercase tracking-wider mb-2">
            <ShieldCheck className="w-4 h-4" />
            <span>Key Pedagogical Rule</span>
          </div>
          <p className="text-xs text-emerald-200 leading-relaxed font-medium">
            {lesson.keyTakeaway}
          </p>
        </div>

        <div className="p-4 rounded-xl bg-amber-950/20 border border-amber-800/40">
          <div className="flex items-center gap-2 text-amber-400 font-bold text-xs uppercase tracking-wider mb-2">
            <Lightbulb className="w-4 h-4" />
            <span>Bench tip</span>
          </div>
          <p className="text-xs text-amber-200 leading-relaxed font-medium">
            {lesson.benchTip}
          </p>
        </div>
      </div>

      {/* Footer Navigation */}
      <div className="flex items-center justify-between pt-6 border-t border-slate-800/80">
        <div className="flex items-center gap-2 text-xs text-slate-400">
          <FlaskConical className="w-4 h-4 text-cyan-400" />
          <span>Ready to practice on the virtual bench? Head to the Virtual Lab simulator.</span>
        </div>

        {onNextLesson && (
          <button
            onClick={onNextLesson}
            className="flex items-center gap-2 text-xs font-bold text-slate-300 hover:text-white px-3 py-2 rounded-lg bg-slate-800 hover:bg-slate-700 transition-colors"
          >
            <span>Next Lesson</span>
            <ArrowRight className="w-3.5 h-3.5" />
          </button>
        )}
      </div>

      {/* Quiz Modal */}
      {showQuiz && lesson.quiz && (
        <QuizModal
          lessonTitle={lesson.title}
          questions={lesson.quiz}
          onClose={() => setShowQuiz(false)}
          onPassQuiz={onPassQuiz}
          lessonId={lesson.id}
        />
      )}
    </div>
  );
};
