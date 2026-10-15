import React, { useState } from 'react';
import { CheckCircle2, XCircle, ArrowRight, RotateCcw, X, Award } from 'lucide-react';
import confetti from 'canvas-confetti';
import { QuizQuestion } from '../../types';

interface QuizModalProps {
  lessonTitle: string;
  questions: QuizQuestion[];
  onClose: () => void;
  onPassQuiz: (lessonId: string, pointsAwarded: number) => void;
  lessonId: string;
}

export const QuizModal: React.FC<QuizModalProps> = ({
  lessonTitle,
  questions,
  onClose,
  onPassQuiz,
  lessonId
}) => {
  const [currentIndex, setCurrentIndex] = useState(0);
  const [selectedOption, setSelectedOption] = useState<number | null>(null);
  const [isAnswerSubmitted, setIsAnswerSubmitted] = useState(false);
  const [score, setScore] = useState(0);
  const [isFinished, setIsFinished] = useState(false);

  const currentQ = questions[currentIndex];

  const handleSelectOption = (idx: number) => {
    if (isAnswerSubmitted) return;
    setSelectedOption(idx);
  };

  const handleSubmitAnswer = () => {
    if (selectedOption === null) return;
    setIsAnswerSubmitted(true);
    if (selectedOption === currentQ.correctIndex) {
      setScore(prev => prev + 1);
    }
  };

  const handleNextQuestion = () => {
    if (currentIndex + 1 < questions.length) {
      setCurrentIndex(prev => prev + 1);
      setSelectedOption(null);
      setIsAnswerSubmitted(false);
    } else {
      setIsFinished(true);
      const passed = (score + (selectedOption === currentQ.correctIndex ? 1 : 0)) >= Math.ceil(questions.length * 0.7);
      if (passed) {
        confetti({
          particleCount: 80,
          spread: 70,
          origin: { y: 0.6 }
        });
        onPassQuiz(lessonId, 50);
      }
    }
  };

  const handleRetry = () => {
    setCurrentIndex(0);
    setSelectedOption(null);
    setIsAnswerSubmitted(false);
    setScore(0);
    setIsFinished(false);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-sm animate-in fade-in duration-200">
      <div className="bg-slate-900 border border-slate-800 rounded-2xl max-w-xl w-full p-6 shadow-2xl relative">
        
        {/* Close Button */}
        <button
          onClick={onClose}
          className="absolute top-4 right-4 text-slate-400 hover:text-white p-1 rounded-lg hover:bg-slate-800 transition-colors"
        >
          <X className="w-5 h-5" />
        </button>

        {!isFinished ? (
          <div>
            {/* Header */}
            <div className="mb-6">
              <span className="text-xs font-semibold uppercase tracking-wider text-cyan-400">
                Knowledge Check • Question {currentIndex + 1} of {questions.length}
              </span>
              <h3 className="text-lg font-bold text-white mt-1">
                {lessonTitle}
              </h3>
            </div>

            {/* Question */}
            <div className="p-4 rounded-xl bg-slate-950 border border-slate-800/80 mb-6">
              <p className="text-base text-slate-100 font-medium leading-relaxed">
                {currentQ.question}
              </p>
            </div>

            {/* Options */}
            <div className="space-y-3 mb-6">
              {currentQ.options.map((opt, idx) => {
                let btnStyle = "bg-slate-800/60 hover:bg-slate-800 border-slate-700/60 text-slate-200";
                
                if (selectedOption === idx) {
                  btnStyle = "bg-cyan-500/10 border-cyan-500 text-cyan-200 ring-1 ring-cyan-500";
                }

                if (isAnswerSubmitted) {
                  if (idx === currentQ.correctIndex) {
                    btnStyle = "bg-emerald-500/20 border-emerald-500 text-emerald-200 ring-1 ring-emerald-500 font-semibold";
                  } else if (selectedOption === idx) {
                    btnStyle = "bg-rose-500/20 border-rose-500 text-rose-200 ring-1 ring-rose-500 line-through";
                  } else {
                    btnStyle = "opacity-50 border-slate-800 text-slate-500";
                  }
                }

                return (
                  <button
                    key={idx}
                    disabled={isAnswerSubmitted}
                    onClick={() => handleSelectOption(idx)}
                    className={`w-full text-left p-3.5 rounded-xl border text-sm transition-all flex items-start gap-3 ${btnStyle}`}
                  >
                    <span className="w-6 h-6 rounded-full flex items-center justify-center text-xs font-bold shrink-0 bg-slate-900 border border-slate-700">
                      {String.fromCharCode(65 + idx)}
                    </span>
                    <span className="pt-0.5 leading-snug">{opt}</span>
                  </button>
                );
              })}
            </div>

            {/* Feedback message */}
            {isAnswerSubmitted && (
              <div className={`p-4 rounded-xl mb-6 text-sm border ${
                selectedOption === currentQ.correctIndex 
                  ? 'bg-emerald-950/40 border-emerald-800 text-emerald-200' 
                  : 'bg-rose-950/40 border-rose-800 text-rose-200'
              }`}>
                <div className="flex items-center gap-2 font-bold mb-1">
                  {selectedOption === currentQ.correctIndex ? (
                    <>
                      <CheckCircle2 className="w-4 h-4 text-emerald-400" />
                      <span>Correct Answer!</span>
                    </>
                  ) : (
                    <>
                      <XCircle className="w-4 h-4 text-rose-400" />
                      <span>Incorrect</span>
                    </>
                  )}
                </div>
                <p className="text-xs text-slate-300 leading-relaxed mt-1">
                  {currentQ.explanation}
                </p>
              </div>
            )}

            {/* Actions */}
            <div className="flex items-center justify-end gap-3 pt-2">
              {!isAnswerSubmitted ? (
                <button
                  disabled={selectedOption === null}
                  onClick={handleSubmitAnswer}
                  className="px-5 py-2.5 rounded-xl bg-cyan-500 hover:bg-cyan-400 disabled:opacity-40 disabled:hover:bg-cyan-500 text-slate-950 font-bold text-sm transition-all shadow-lg shadow-cyan-500/20"
                >
                  Confirm Answer
                </button>
              ) : (
                <button
                  onClick={handleNextQuestion}
                  className="flex items-center gap-2 px-5 py-2.5 rounded-xl bg-gradient-to-r from-cyan-500 to-emerald-500 hover:opacity-95 text-slate-950 font-bold text-sm transition-all shadow-lg shadow-cyan-500/20"
                >
                  <span>{currentIndex + 1 < questions.length ? 'Next Question' : 'Complete Quiz'}</span>
                  <ArrowRight className="w-4 h-4" />
                </button>
              )}
            </div>
          </div>
        ) : (
          /* Finished State */
          <div className="text-center py-6">
            <div className="w-16 h-16 rounded-2xl bg-amber-500/10 border border-amber-500/30 flex items-center justify-center mx-auto mb-4 text-amber-400">
              <Award className="w-8 h-8" />
            </div>
            <h3 className="text-xl font-extrabold text-white mb-2">
              Quiz Completed!
            </h3>
            <p className="text-sm text-slate-400 mb-6">
              You scored <span className="text-white font-bold">{score}</span> out of <span className="text-white font-bold">{questions.length}</span> questions.
            </p>

            <div className="p-4 rounded-xl bg-slate-950 border border-slate-800 mb-6 text-sm">
              {score >= Math.ceil(questions.length * 0.7) ? (
                <p className="text-emerald-400 font-semibold">
                  🎉 Mastery verified! +50 Points awarded to your stem cell engineering profile.
                </p>
              ) : (
                <p className="text-amber-400 font-semibold">
                  Review the lesson material and try again to achieve certification mastery.
                </p>
              )}
            </div>

            <div className="flex items-center justify-center gap-3">
              <button
                onClick={handleRetry}
                className="flex items-center gap-2 px-4 py-2.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-200 text-sm font-semibold transition-colors"
              >
                <RotateCcw className="w-4 h-4" />
                <span>Retry Quiz</span>
              </button>
              <button
                onClick={onClose}
                className="px-5 py-2.5 rounded-xl bg-cyan-500 hover:bg-cyan-400 text-slate-950 text-sm font-bold transition-colors shadow-lg shadow-cyan-500/20"
              >
                Done
              </button>
            </div>
          </div>
        )}

      </div>
    </div>
  );
};
