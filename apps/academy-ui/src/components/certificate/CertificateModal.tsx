import React, { useState } from 'react';
import { Award, X, Printer, CheckCircle, ShieldCheck, Dna } from 'lucide-react';

interface CertificateModalProps {
  onClose: () => void;
  masteryPoints: number;
  totalQuizzesPassed: number;
}

export const CertificateModal: React.FC<CertificateModalProps> = ({
  onClose,
  masteryPoints,
  totalQuizzesPassed
}) => {
  const [studentName, setStudentName] = useState('Genome Engineering Scholar');

  const handlePrint = () => {
    window.print();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/85 backdrop-blur-md animate-in fade-in">
      <div className="bg-slate-900 border border-slate-800 rounded-3xl max-w-2xl w-full p-6 sm:p-8 shadow-2xl relative">
        
        {/* Close Button */}
        <button
          onClick={onClose}
          className="absolute top-5 right-5 text-slate-400 hover:text-white p-1 rounded-lg hover:bg-slate-800 transition-colors"
        >
          <X className="w-5 h-5" />
        </button>

        {/* Certificate Border Frame */}
        <div className="border-4 border-double border-amber-500/40 rounded-2xl p-6 sm:p-8 bg-gradient-to-b from-slate-950 to-slate-900 text-center relative overflow-hidden">
          
          {/* Header Seal */}
          <div className="w-16 h-16 rounded-full bg-gradient-to-tr from-amber-500 to-amber-300 mx-auto flex items-center justify-center shadow-lg shadow-amber-500/30 text-slate-950 mb-4">
            <Award className="w-9 h-9" />
          </div>

          <span className="text-[10px] font-mono font-bold tracking-widest uppercase text-amber-400 block mb-1">
            ASSURED Academy &bull; self-study record
          </span>
          
          <h2 className="text-xl sm:text-2xl font-black text-white uppercase tracking-tight">
            Certificate of Completion
          </h2>
          <p className="text-xs text-slate-400 mt-1 italic">
            This certifies that
          </p>

          {/* Editable Name Field */}
          <div className="my-3">
            <input
              type="text"
              value={studentName}
              onChange={(e) => setStudentName(e.target.value)}
              className="text-center font-serif text-lg sm:text-xl font-bold text-amber-200 bg-transparent border-b border-amber-500/50 focus:outline-none focus:border-amber-400 px-4 py-1 max-w-md w-full"
              placeholder="Enter your name"
            />
          </div>

          <p className="text-xs text-slate-300 max-w-lg mx-auto leading-relaxed">
            has completed the self-study lessons and quizzes of the ASSURED Academy on genome engineering in human induced pluripotent stem cells. This is a record of completed course material. It is not an accredited qualification and does not certify competence at the bench.
          </p>

          {/* Score & Badges */}
          <div className="flex items-center justify-center gap-6 my-6 pt-4 border-t border-slate-800/80 text-xs text-slate-400">
            <div>
              <span className="block text-[10px] uppercase font-bold text-slate-500">Points</span>
              <span className="font-mono font-bold text-white text-base">{masteryPoints} pts</span>
            </div>
            <div>
              <span className="block text-[10px] uppercase font-bold text-slate-500">Quizzes Cleared</span>
              <span className="font-mono font-bold text-emerald-400 text-base">{totalQuizzesPassed} / 4</span>
            </div>
            <div>
              <span className="block text-[10px] uppercase font-bold text-slate-500">Status</span>
              <span className="font-mono font-bold text-cyan-400 text-base">Verified</span>
            </div>
          </div>

          {/* Signatures */}
          <div className="flex items-center justify-between pt-4 border-t border-slate-800 text-[11px] text-slate-400">
            <div className="text-left">
              <span className="font-serif font-bold text-slate-200 block">Dr. Narasimha Telugu</span>
              ASSURED Academy
            </div>
            <div className="text-right">
              <span className="font-mono text-slate-300 block">{new Date().toLocaleDateString()}</span>
              <span className="text-[10px] text-slate-500">Date of Verification</span>
            </div>
          </div>

        </div>

        {/* Modal Bottom Actions */}
        <div className="flex items-center justify-end gap-3 mt-6">
          <button
            onClick={handlePrint}
            className="flex items-center gap-2 px-4 py-2.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-semibold transition-colors"
          >
            <Printer className="w-4 h-4" />
            <span>Print / Save PDF</span>
          </button>
          <button
            onClick={onClose}
            className="px-5 py-2.5 rounded-xl bg-cyan-500 hover:bg-cyan-400 text-slate-950 text-xs font-bold transition-all shadow-md shadow-cyan-500/20"
          >
            Close
          </button>
        </div>

      </div>
    </div>
  );
};
