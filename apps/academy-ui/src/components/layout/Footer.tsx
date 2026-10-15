import React from 'react';
import { Heart, BookOpen, ExternalLink, Globe, Cpu } from 'lucide-react';

export const Footer: React.FC = () => {
  return (
    <footer className="bg-slate-950 border-t border-slate-900 mt-20 py-12 text-slate-400 text-sm">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-8 mb-8">
          
          {/* Mission */}
          <div className="md:col-span-2 space-y-3">
            <div className="flex items-center gap-2">
              <span className="font-bold text-white text-base">ASSURED Academy</span>
              <span className="text-[10px] bg-emerald-950 text-emerald-400 border border-emerald-800 px-2 py-0.5 rounded font-mono">
                Open Education
              </span>
            </div>
            <p className="text-xs text-slate-400 leading-relaxed max-w-lg">
              Designed to democratize human pluripotent stem cell (hiPSC) genome engineering and rare disease therapeutic modeling. Empowering students, clinical scientists, and researchers in India, Africa, Latin America, and worldwide with protocol tacit knowledge and frugal bench strategies.
            </p>
            <div className="flex items-center gap-2 text-xs text-slate-500 pt-2">
              <span>Scientific Foundation:</span>
              <span className="text-cyan-400 font-medium">STAR Protocols (Cell Press)</span>
              <span>•</span>
              <span className="text-slate-300">Max Delbrück Center (MDC), Berlin</span>
            </div>
          </div>

          {/* Quick Ecosystem Links */}
          <div>
            <h4 className="text-xs font-semibold text-slate-200 uppercase tracking-wider mb-3">
              ASSURED Tools
            </h4>
            <ul className="space-y-2 text-xs">
              <li>
                <a 
                  href="https://assured-crispr-design.vercel.app" 
                  target="_blank" 
                  rel="noreferrer"
                  className="hover:text-cyan-400 flex items-center gap-1 transition-colors"
                >
                  <span>ASSURED CRISPR Designer</span>
                  <ExternalLink className="w-3 h-3 text-slate-600" />
                </a>
              </li>
              <li>
                <a 
                  href="https://assured-qc.vercel.app" 
                  target="_blank" 
                  rel="noreferrer"
                  className="hover:text-purple-400 flex items-center gap-1 transition-colors"
                >
                  <span>Assured QC Trace Deconvolution</span>
                  <ExternalLink className="w-3 h-3 text-slate-600" />
                </a>
              </li>
              <li>
                <a 
                  href="https://scholar.google.com/citations?user=nN8TOfMAAAAJ&hl=en" 
                  target="_blank" 
                  rel="noreferrer"
                  className="hover:text-emerald-400 flex items-center gap-1 transition-colors"
                >
                  <span>Author Publications (Google Scholar)</span>
                  <ExternalLink className="w-3 h-3 text-slate-600" />
                </a>
              </li>
            </ul>
          </div>

          {/* Educational Goals */}
          <div>
            <h4 className="text-xs font-semibold text-slate-200 uppercase tracking-wider mb-3">
              Inspirations & Core
            </h4>
            <div className="space-y-2 text-xs text-slate-400">
              <div className="flex items-center gap-2">
                <BookOpen className="w-3.5 h-3.5 text-cyan-400" />
                <span>Khan Academy Mastery Pedagogy</span>
              </div>
              <div className="flex items-center gap-2">
                <Globe className="w-3.5 h-3.5 text-emerald-400" />
                <span>Frugal Lab & Global South Protocols</span>
              </div>
              <div className="flex items-center gap-2">
                <Cpu className="w-3.5 h-3.5 text-purple-400" />
                <span>Client-Side In-Browser Simulation</span>
              </div>
            </div>
          </div>
        </div>

        <div className="pt-8 border-t border-slate-900/80 flex flex-col sm:flex-row items-center justify-between text-xs text-slate-500 gap-4">
          <p>© {new Date().getFullYear()} ASSURED Academy. Created by Dr. Narasimha Telugu.</p>
          <p className="flex items-center gap-1">
            Built with <Heart className="w-3.5 h-3.5 text-rose-500 fill-rose-500 inline" /> for rare disease patients & the next generation of genome engineers.
          </p>
        </div>
      </div>
    </footer>
  );
};
