import React, { useState } from 'react';
import { 
  Clock, 
  Lightbulb, 
  FlaskConical, 
  CheckCircle, 
  HelpCircle,
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
              Lesson
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
              <span>Quiz completed</span>
            </div>
          )}

          {lesson.quiz && (
            <button
              onClick={() => setShowQuiz(true)}
              className="flex items-center gap-2 px-4 py-2 rounded-xl bg-cyan-500 hover:bg-cyan-400 text-slate-950 text-sm font-bold shadow-lg shadow-cyan-500/20 transition-all hover:scale-102"
            >
              <HelpCircle className="w-4 h-4" />
              <span>{isCompleted ? 'Retake Quiz' : 'Take Quiz'}</span>
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
          <span>Use the standalone tools below for demonstrations and practice.</span>
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
