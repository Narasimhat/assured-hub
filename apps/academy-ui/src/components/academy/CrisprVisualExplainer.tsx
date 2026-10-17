import React, { useState } from 'react';
import { Sparkles, Microscope, ChevronLeft, ChevronRight, Layers, Dna } from 'lucide-react';
import { GlossaryText } from './GlossaryText';

interface VisualStep {
  id: string;
  stepNumber: number;
  shortLabel: string;
  title: string;
  subtitle: string;
  simpleNarrative: string;
  scientificNarrative: string;
  stemCellInsight: string;
  keyNumbers: { label: string; value: string }[];
}

const VISUAL_STEPS: VisualStep[] = [
  {
    id: 'step-1-rnp',
    stepNumber: 1,
    shortLabel: '1. Assemble RNP',
    title: 'The Programmable Search Engine: Guide RNA + HiFi Cas9',
    subtitle: 'How bacterial immune defense becomes a precision molecular scalpel',
    simpleNarrative:
      'In nature, bacteria use CRISPR as an archive of "mugshots" to recognize invading viruses. In the lab, we program a 20-letter guide RNA address and load it into the Cas9 protein before touching the cells. Together they form a ready-to-work RNP complex that enters the cell, performs its job within hours, and then breaks down naturally without leaving foreign DNA behind.',
    scientificNarrative:
      'Purified recombinant Alt-R S.p. HiFi Cas9 V3 protein is complexed in vitro with synthetic sgRNA at a 3:1 molar ratio (e.g., 60 pmol sgRNA : 20 pmol Cas9) for 10–20 minutes at room temperature. Delivering pre-assembled RNP via Neon electroporation bypasses transcription/translation lag, eliminates plasmid integration risk, and restricts nuclease exposure to a transient 24-hour window.',
    stemCellInsight:
      'Why RNP is mandatory in hiPSCs: Plasmid or viral Cas9 expression causes persistent double-strand breaks and cytosolic DNA sensing, triggering massive p53-mediated apoptosis.',
    keyNumbers: [
      { label: 'Guide Spacer Length', value: '20 nt' },
      { label: 'sgRNA : Cas9 Molar Ratio', value: '3 : 1' },
      { label: 'RNP Incubation', value: '10–20 min RT' },
    ],
  },
  {
    id: 'step-2-pam',
    stepNumber: 2,
    shortLabel: '2. Find PAM & Unzip',
    title: 'Finding the Exact Address: The PAM Handshake & Seed Region',
    subtitle: 'How Cas9 scans 3 billion DNA letters in minutes without unzipping the whole genome',
    simpleNarrative:
      'Imagine searching a library of 3 billion letters for one typo. Instead of reading every page, Cas9 only stops at a 3-letter permission tag called a PAM (spelled N-G-G). When it spots NGG, it unzips the DNA spiral right next door and checks if the 20 letters of the guide RNA match. The 8 to 10 letters closest to the PAM—the seed region—must match like a security PIN.',
    scientificNarrative:
      'Cas9 diffuses via 3D collisions and 1D sliding, probing the major groove for the 5\'-NGG-3\' PAM dinucleotide on the non-target strand. PAM recognition triggers local phosphate-lock kinking, melting the adjacent duplex so the guide RNA spacer invades to form an RNA:DNA heteroduplex R-loop starting from the 8–10 nt PAM-proximal seed sequence.',
    stemCellInsight:
      'Design rule: Because Cas9 cannot initiate strand invasion without an intact PAM or seed region, mutating either element on a repair donor renders the edited chromosome immune to re-cutting.',
    keyNumbers: [
      { label: 'SpCas9 PAM Motif', value: "5'-NGG-3'" },
      { label: 'Seed Region', value: '8–10 nt' },
      { label: 'Off-Target Reduction (HiFi)', value: '>99%' },
    ],
  },
  {
    id: 'step-3-cleavage',
    stepNumber: 3,
    shortLabel: '3. Precision Cut',
    title: 'The Molecular Snip: Double-Strand Cleavage & p53 Surveillance',
    subtitle: 'Two catalytic blades snip both strands of the DNA double helix 3 letters from the PAM',
    simpleNarrative:
      'Once the 20-letter guide RNA locks onto its matching DNA sequence, Cas9 changes shape like a spring-loaded trap. Two tiny molecular blades inside Cas9—called HNH and RuvC—each cut one strand of the DNA ladder exactly 3 letters upstream of the PAM tag. In stem cells, this cut rings an internal alarm called p53, so the cell must repair the break quickly.',
    scientificNarrative:
      'Complete R-loop zipping allosterically activates the HNH domain (which cleaves the target DNA strand complementary to the sgRNA) and the RuvC domain (which cleaves the displaced non-target strand) between nucleotides -3 and -4 upstream of the PAM. In human iPSCs, even a single double-strand break activates ATM/ATR and p53, inducing p21 and PUMA.',
    stemCellInsight:
      'Surviving the cut: Culturing hiPSCs under physiological hypoxia (5% O2) and recovering in StemFlex supplemented with CloneR2 dampens oxidative stress and anoikis while repair completes.',
    keyNumbers: [
      { label: 'Cut Position', value: '3 bp upstream of PAM' },
      { label: 'Catalytic Domains', value: 'HNH + RuvC' },
      { label: 'Physiological Oxygen', value: '5% O2 Hypoxia' },
    ],
  },
  {
    id: 'step-4-repair',
    stepNumber: 4,
    shortLabel: '4. Repair Fork: KO vs KI',
    title: 'The Cellular Repair Fork: Gene Knockout vs. Scarless Knock-In',
    subtitle: 'Cas9 makes the cut—but the cell’s own DNA repair machinery writes the final edit',
    simpleNarrative:
      'After Cas9 cuts, the cell chooses between two repair crews. Path A (NHEJ) quickly glues the broken ends together but usually drops or adds a few letters, scrambling the gene to create a Knockout. Path B (HDR) uses a 127-letter single-stranded DNA patch (ssODN) that we supply to copy-and-paste a precise letter change—plus a silent "shield" letter so Cas9 never cuts it again.',
    scientificNarrative:
      'For Knockouts, dual guides or frameshift indels in an early constitutive exon (e.g., SorCS1 Exon 4) achieve a mean KO score of 79.5 ± 23%. For Knock-Ins, a 127-nt asymmetric ssODN (36-nt PAM-distal arm, 91-nt PAM-proximal arm on the non-PAM strand) carrying the intended variant within <10 bp of the cut plus a CFD-guided synonymous PAM/seed block yields a mean KI score of 57.5 ± 27%.',
    stemCellInsight:
      'For refractory loci where single-donor HDR stalls, the CRISPR-MiX strategy pools sense and antisense ssODNs (60:20:120 pmol stoichiometry) to rescue scarless editing.',
    keyNumbers: [
      { label: 'Mean ASSURED KO Score', value: '79.5 ± 23%' },
      { label: 'Mean ASSURED KI Score', value: '57.5 ± 27%' },
      { label: 'Asymmetric ssODN', value: '127 nt (36 / 91 nt)' },
    ],
  },
  {
    id: 'step-5-cloning',
    stepNumber: 5,
    shortLabel: '5. Clone & Deconvolute',
    title: 'From Edited Pool to Pure Isogenic Line: Cloning & Trace Deconvolution',
    subtitle: 'Isolating single stem cells and mathematically unscrambling Sanger chromatograms',
    simpleNarrative:
      'A dish of edited stem cells is a mix of unedited cells, one-copy edits, and two-copy edits. To build a clean disease model, we gently place individual cells into tiny microfluidic chambers so each grows into a pure twin colony. Finally, we read each colony’s DNA by Sanger sequencing and use deconvolution software to confirm both chromosome copies are cleanly edited.',
    scientificNarrative:
      'Bulk pools are first gated by PCR and Sanger deconvolution (ICE / Assured QC). Validated pools are seeded into 256-chamber IsoCell microfluidic grids under FC40 fluorocarbon in StemFlex + CloneR2 (~65% single-cell survival), banked in 96-well Bambanker plates, and genotyped by non-negative least squares trace alignment to distinguish true homozygotes from compound heterozygotes.',
    stemCellInsight:
      'Why isogenic clones matter: Across 51 human donors, genetic background drives 43.2% median transcriptomic variance—so comparing an edited clone against its own parental line is the gold standard.',
    keyNumbers: [
      { label: 'IsoCell Clonal Survival', value: '65% (~46 clones)' },
      { label: 'PCR Amplicon Window', value: '400–450 bp' },
      { label: 'Median Donor Background ICC', value: '43.2%' },
    ],
  },
];

export const CrisprVisualExplainer: React.FC = () => {
  const [activeIdx, setActiveIdx] = useState<number>(0);
  const [explanationLevel, setExplanationLevel] = useState<'both' | 'simple' | 'scientific'>('both');

  const currentStep = VISUAL_STEPS[activeIdx];

  const renderStepSvg = (stepIdx: number) => {
    switch (stepIdx) {
      case 0:
        return (
          <svg viewBox="0 0 760 230" className="w-full h-auto" role="img" aria-label="Diagram of Guide RNA and HiFi Cas9 RNP Assembly">
            <rect width="760" height="230" rx="16" fill="#020617" />
            {/* Guide RNA Box */}
            <g transform="translate(30, 35)">
              <rect width="190" height="160" rx="14" fill="#083344" fillOpacity="0.45" stroke="#06b6d4" strokeWidth="1.5" />
              <text x="95" y="28" textAnchor="middle" fill="#67e8f9" fontSize="13" fontWeight="bold">1. Synthetic sgRNA</text>
              {/* 20-nt spacer + hairpin */}
              <path d="M 30 85 L 110 85" stroke="#22d3ee" strokeWidth="6" strokeLinecap="round" />
              <path d="M 110 85 C 145 85, 145 50, 125 50 C 105 50, 105 120, 140 120 L 165 120" stroke="#94a3b8" strokeWidth="4" fill="none" strokeLinecap="round" />
              <text x="70" y="72" textAnchor="middle" fill="#a5f3fc" fontSize="10" fontFamily="monospace">20-nt Target Spacer</text>
              <text x="135" y="140" textAnchor="middle" fill="#94a3b8" fontSize="10">tracrRNA Scaffold</text>
            </g>

            {/* Plus Sign */}
            <text x="248" y="122" textAnchor="middle" fill="#64748b" fontSize="26" fontWeight="bold">+</text>

            {/* HiFi Cas9 Protein */}
            <g transform="translate(275, 35)">
              <rect width="190" height="160" rx="14" fill="#1e1b4b" fillOpacity="0.5" stroke="#818cf8" strokeWidth="1.5" />
              <text x="95" y="28" textAnchor="middle" fill="#c7d2fe" fontSize="13" fontWeight="bold">2. Alt-R HiFi Cas9 V3</text>
              <ellipse cx="95" cy="82" rx="58" ry="32" fill="#4f46e5" fillOpacity="0.45" stroke="#818cf8" strokeWidth="2" />
              <ellipse cx="95" cy="112" rx="52" ry="26" fill="#6366f1" fillOpacity="0.45" stroke="#a5b4fc" strokeWidth="2" />
              <text x="95" y="80" textAnchor="middle" fill="#e0e7ff" fontSize="10" fontWeight="bold">REC Lobe</text>
              <text x="95" y="116" textAnchor="middle" fill="#e0e7ff" fontSize="10" fontWeight="bold">NUC Lobe (HNH/RuvC)</text>
              <text x="95" y="150" textAnchor="middle" fill="#94a3b8" fontSize="10">3 : 1 Molar Stoichiometry</text>
            </g>

            {/* Arrow */}
            <path d="M 480 115 L 515 115" stroke="#10b981" strokeWidth="3" strokeLinecap="round" />
            <polygon points="515,109 527,115 515,121" fill="#10b981" />

            {/* Active RNP Complex */}
            <g transform="translate(540, 35)">
              <rect width="190" height="160" rx="14" fill="#064e3b" fillOpacity="0.4" stroke="#10b981" strokeWidth="1.5" />
              <text x="95" y="28" textAnchor="middle" fill="#6ee7b7" fontSize="13" fontWeight="bold">3. Active RNP Complex</text>
              <ellipse cx="95" cy="95" rx="64" ry="42" fill="#059669" fillOpacity="0.35" stroke="#34d399" strokeWidth="2" />
              <path d="M 45 95 L 120 95" stroke="#22d3ee" strokeWidth="5" strokeLinecap="round" />
              <path d="M 120 95 C 145 95, 145 68, 128 68 C 112 68, 112 118, 142 118" stroke="#cbd5e1" strokeWidth="3.5" fill="none" />
              <text x="95" y="90" textAnchor="middle" fill="#ecfdf5" fontSize="10" fontWeight="bold">Ready to Scan DNA</text>
              <text x="95" y="150" textAnchor="middle" fill="#a7f3d0" fontSize="10">Zero Viral / Plasmid DNA</text>
            </g>
          </svg>
        );

      case 1:
        return (
          <svg viewBox="0 0 760 230" className="w-full h-auto" role="img" aria-label="Diagram of PAM recognition and R-loop formation">
            <rect width="760" height="230" rx="16" fill="#020617" />
            {/* Cas9 Halo */}
            <ellipse cx="380" cy="115" rx="235" ry="88" fill="#1e293b" fillOpacity="0.7" stroke="#475569" strokeWidth="2" strokeDasharray="6 4" />
            <text x="380" y="42" textAnchor="middle" fill="#94a3b8" fontSize="12" fontWeight="bold">Cas9 Scans Duplex DNA Until It Locks Onto 5&apos;-NGG-3&apos; PAM</text>

            {/* Non-target DNA strand (top) */}
            <path d="M 70 95 L 200 95 C 240 60, 420 60, 460 95 L 690 95" stroke="#64748b" strokeWidth="5" fill="none" />
            <text x="125" y="84" fill="#94a3b8" fontSize="11" fontFamily="monospace">5&apos; Non-Target Strand</text>

            {/* Target DNA strand (bottom) */}
            <path d="M 70 135 L 200 135 C 240 165, 420 165, 460 135 L 690 135" stroke="#94a3b8" strokeWidth="5" fill="none" />
            <text x="125" y="158" fill="#94a3b8" fontSize="11" fontFamily="monospace">3&apos; Target Strand</text>

            {/* Guide RNA paired inside R-loop */}
            <path d="M 225 132 L 445 132" stroke="#22d3ee" strokeWidth="6" strokeLinecap="round" />
            <text x="335" y="122" textAnchor="middle" fill="#67e8f9" fontSize="11" fontFamily="monospace" fontWeight="bold">20-nt Guide RNA Spacer</text>

            {/* Seed Region Highlight */}
            <rect x="355" y="126" width="90" height="32" rx="6" fill="#06b6d4" fillOpacity="0.2" stroke="#22d3ee" strokeWidth="1.5" />
            <text x="400" y="175" textAnchor="middle" fill="#22d3ee" fontSize="11" fontWeight="bold">8–10 nt Seed Region</text>

            {/* PAM Box */}
            <rect x="468" y="76" width="76" height="36" rx="8" fill="#78350f" stroke="#f59e0b" strokeWidth="2" />
            <text x="506" y="99" textAnchor="middle" fill="#fde68a" fontSize="14" fontFamily="monospace" fontWeight="bold">5&apos;-NGG-3&apos;</text>
            <text x="506" y="66" textAnchor="middle" fill="#fbbf24" fontSize="11" fontWeight="bold">PAM Permission Tag</text>
          </svg>
        );

      case 2:
        return (
          <svg viewBox="0 0 760 230" className="w-full h-auto" role="img" aria-label="Diagram of Double-Strand Break 3 bp upstream of PAM">
            <rect width="760" height="230" rx="16" fill="#020617" />
            {/* Left DNA Duplex */}
            <line x1="60" y1="90" x2="365" y2="90" stroke="#38bdf8" strokeWidth="6" strokeLinecap="round" />
            <line x1="60" y1="140" x2="365" y2="140" stroke="#38bdf8" strokeWidth="6" strokeLinecap="round" />

            {/* Cut Gap at -3 bp from PAM */}
            <line x1="382" y1="45" x2="382" y2="185" stroke="#f43f5e" strokeWidth="3" strokeDasharray="5 4" />
            <polygon points="375,45 389,45 382,58" fill="#f43f5e" />
            <polygon points="375,185 389,185 382,172" fill="#f43f5e" />
            <text x="382" y="34" textAnchor="middle" fill="#fda4af" fontSize="12" fontWeight="bold">Double-Strand Break (-3 bp from PAM)</text>

            {/* Right DNA Duplex + PAM */}
            <line x1="400" y1="90" x2="690" y2="90" stroke="#38bdf8" strokeWidth="6" strokeLinecap="round" />
            <line x1="400" y1="140" x2="690" y2="140" stroke="#38bdf8" strokeWidth="6" strokeLinecap="round" />

            {/* Nuclease Domain Badges */}
            <rect x="250" y="52" width="110" height="26" rx="6" fill="#881337" stroke="#fb7185" strokeWidth="1.5" />
            <text x="305" y="69" textAnchor="middle" fill="#ffe4e6" fontSize="11" fontWeight="bold">RuvC Cuts Top</text>

            <rect x="250" y="152" width="110" height="26" rx="6" fill="#881337" stroke="#fb7185" strokeWidth="1.5" />
            <text x="305" y="169" textAnchor="middle" fill="#ffe4e6" fontSize="11" fontWeight="bold">HNH Cuts Bottom</text>

            {/* PAM Box */}
            <rect x="445" y="73" width="74" height="34" rx="8" fill="#78350f" stroke="#f59e0b" strokeWidth="2" />
            <text x="482" y="95" textAnchor="middle" fill="#fde68a" fontSize="13" fontFamily="monospace" fontWeight="bold">NGG PAM</text>

            {/* Stem cell hypoxia shield */}
            <rect x="545" y="68" width="175" height="90" rx="12" fill="#064e3b" fillOpacity="0.45" stroke="#10b981" strokeWidth="1.5" />
            <text x="632" y="92" textAnchor="middle" fill="#6ee7b7" fontSize="11" fontWeight="bold">hiPSC Survival Shield</text>
            <text x="632" y="112" textAnchor="middle" fill="#d1fae5" fontSize="10">• 5% O2 Hypoxia</text>
            <text x="632" y="128" textAnchor="middle" fill="#d1fae5" fontSize="10">• StemFlex + CloneR2</text>
            <text x="632" y="144" textAnchor="middle" fill="#d1fae5" fontSize="10">• Transient RNP Clearance</text>
          </svg>
        );

      case 3:
        return (
          <svg viewBox="0 0 760 230" className="w-full h-auto" role="img" aria-label="Diagram comparing NHEJ Knockout vs Asymmetric ssODN HDR Knock-In">
            <rect width="760" height="230" rx="16" fill="#020617" />
            {/* Left Card: Path A - Knockout */}
            <g transform="translate(25, 22)">
              <rect width="340" height="186" rx="14" fill="#0f172a" stroke="#f59e0b" strokeWidth="1.5" />
              <text x="20" y="30" fill="#fbbf24" fontSize="13" fontWeight="bold">Path A: Gene Knockout (NHEJ / Dual-Guide)</text>
              <text x="20" y="50" fill="#94a3b8" fontSize="11">Targets early constitutive exon (e.g. SorCS1 Exon 4)</text>
              <line x1="25" y1="88" x2="135" y2="88" stroke="#64748b" strokeWidth="8" strokeLinecap="round" />
              <rect x="142" y="76" width="56" height="24" rx="5" fill="#991b1b" stroke="#f87171" strokeWidth="1.5" />
              <text x="170" y="92" textAnchor="middle" fill="#fecaca" fontSize="10" fontFamily="monospace" fontWeight="bold">-5 bp</text>
              <line x1="205" y1="88" x2="315" y2="88" stroke="#64748b" strokeWidth="8" strokeLinecap="round" />
              <text x="20" y="130" fill="#e2e8f0" fontSize="11" fontWeight="bold">Outcome: Reading Frame Shifted → Premature Stop</text>
              <text x="20" y="152" fill="#fde68a" fontSize="11" fontWeight="bold">Empirical Benchmark: 79.5 ± 23% Mean KO Score</text>
            </g>

            {/* Right Card: Path B - Scarless Knock-In */}
            <g transform="translate(395, 22)">
              <rect width="340" height="186" rx="14" fill="#0f172a" stroke="#10b981" strokeWidth="1.5" />
              <text x="20" y="30" fill="#34d399" fontSize="13" fontWeight="bold">Path B: Precision Knock-In (HDR + Asymmetric ssODN)</text>
              <text x="20" y="50" fill="#94a3b8" fontSize="11">127-nt Donor Template (Non-PAM Strand):</text>
              {/* 36 nt distal arm */}
              <rect x="20" y="72" width="75" height="26" rx="5" fill="#1e3a8a" stroke="#60a5fa" strokeWidth="1.5" />
              <text x="57" y="89" textAnchor="middle" fill="#bfdbfe" fontSize="10" fontWeight="bold">36 nt Distal</text>
              {/* Intended Edit */}
              <rect x="100" y="72" width="54" height="26" rx="5" fill="#581c87" stroke="#c084fc" strokeWidth="1.5" />
              <text x="127" y="89" textAnchor="middle" fill="#f3e8ff" fontSize="10" fontWeight="bold">Edit</text>
              {/* Silent PAM Block */}
              <rect x="159" y="72" width="62" height="26" rx="5" fill="#7c2d12" stroke="#fb923c" strokeWidth="1.5" />
              <text x="190" y="89" textAnchor="middle" fill="#ffedd5" fontSize="10" fontWeight="bold">Block</text>
              {/* 91 nt proximal arm */}
              <rect x="226" y="72" width="94" height="26" rx="5" fill="#064e3b" stroke="#34d399" strokeWidth="1.5" />
              <text x="273" y="89" textAnchor="middle" fill="#a7f3d0" fontSize="10" fontWeight="bold">91 nt Proximal</text>

              <text x="20" y="128" fill="#e2e8f0" fontSize="11" fontWeight="bold">Silent PAM/Seed Block Stops Cas9 Re-Cutting</text>
              <text x="20" y="152" fill="#6ee7b7" fontSize="11" fontWeight="bold">Empirical Benchmark: 57.5 ± 27% Mean KI Score</text>
            </g>
          </svg>
        );

      default:
        return (
          <svg viewBox="0 0 760 230" className="w-full h-auto" role="img" aria-label="Diagram of IsoCell single-cell microfluidic cloning and Sanger chromatogram deconvolution">
            <rect width="760" height="230" rx="16" fill="#020617" />
            {/* Left: IsoCell 256-Chamber Grid */}
            <g transform="translate(30, 25)">
              <rect width="290" height="180" rx="14" fill="#0f172a" stroke="#38bdf8" strokeWidth="1.5" />
              <text x="20" y="28" fill="#7dd3fc" fontSize="13" fontWeight="bold">1. IsoCell 256-Chamber Cloning</text>
              <text x="20" y="46" fill="#94a3b8" fontSize="10">Single-cell isolation under FC40 fluorocarbon</text>
              {[0, 1, 2, 3, 4, 5].map(col =>
                [0, 1, 2].map(row => {
                  const hasCell = (col + row) % 2 === 0;
                  return (
                    <g key={`${col}-${row}`} transform={`translate(${24 + col * 42}, ${62 + row * 34})`}>
                      <rect width="34" height="26" rx="6" fill="#1e293b" stroke={hasCell ? '#10b981' : '#334155'} strokeWidth="1.5" />
                      {hasCell && <circle cx="17" cy="13" r="5" fill="#34d399" />}
                    </g>
                  );
                })
              )}
            </g>

            {/* Right: Sanger Chromatogram Deconvolution */}
            <g transform="translate(350, 25)">
              <rect width="380" height="180" rx="14" fill="#0f172a" stroke="#a855f7" strokeWidth="1.5" />
              <text x="20" y="28" fill="#d8b4fe" fontSize="13" fontWeight="bold">2. Sanger .ab1 Trace Deconvolution (Assured QC)</text>
              <text x="20" y="46" fill="#94a3b8" fontSize="10">Non-Negative Least Squares resolves Homozygous KI vs Indel</text>
              {/* Simulated Clean Homozygous Chromatogram Peaks */}
              <path
                d="M 25 140 Q 45 65 65 140 Q 85 70 105 140 Q 125 60 145 140 Q 165 55 185 140 Q 205 68 225 140 Q 245 58 265 140 Q 285 65 305 140 Q 325 70 345 140"
                fill="none"
                stroke="#34d399"
                strokeWidth="3"
              />
              {/* Base Calls */}
              <text x="45" y="160" textAnchor="middle" fill="#4ade80" fontSize="12" fontFamily="monospace" fontWeight="bold">A</text>
              <text x="85" y="160" textAnchor="middle" fill="#60a5fa" fontSize="12" fontFamily="monospace" fontWeight="bold">C</text>
              <text x="125" y="160" textAnchor="middle" fill="#f87171" fontSize="12" fontFamily="monospace" fontWeight="bold">T</text>
              <text x="165" y="160" textAnchor="middle" fill="#c084fc" fontSize="12" fontFamily="monospace" fontWeight="bold">T*</text>
              <text x="205" y="160" textAnchor="middle" fill="#fbbf24" fontSize="12" fontFamily="monospace" fontWeight="bold">G</text>
              <text x="245" y="160" textAnchor="middle" fill="#60a5fa" fontSize="12" fontFamily="monospace" fontWeight="bold">C</text>
              <text x="285" y="160" textAnchor="middle" fill="#fb923c" fontSize="12" fontFamily="monospace" fontWeight="bold">A*</text>
              <text x="325" y="160" textAnchor="middle" fill="#fbbf24" fontSize="12" fontFamily="monospace" fontWeight="bold">G</text>
            </g>
          </svg>
        );
    }
  };

  return (
    <section id="visual-explainer" aria-labelledby="visual-explainer-heading" className="mt-12 scroll-mt-6">
      <div className="rounded-3xl border border-slate-800 bg-gradient-to-b from-slate-900 to-slate-950 p-6 sm:p-8 shadow-2xl">
        {/* Top Bar */}
        <div className="flex flex-wrap items-start justify-between gap-4 border-b border-slate-800 pb-5">
          <div>
            <span className="inline-flex items-center gap-1.5 text-xs font-bold uppercase tracking-widest text-cyan-400">
              <Dna className="w-4 h-4" />
              Visual Guide · Science × Art
            </span>
            <h2 id="visual-explainer-heading" className="mt-1 text-2xl sm:text-3xl font-bold text-white">
              How Precision CRISPR Works in Human Stem Cells
            </h2>
            <p className="mt-1 text-sm text-slate-400 max-w-2xl">
              Step through the five stages of genome editing—from assembling molecular scissors to isolating pure isogenic stem cell clones. Click any <span className="border-b-2 border-dashed border-emerald-400 text-emerald-200 px-1">underlined term</span> to inspect its definition.
            </p>
          </div>

          {/* Explanation Level Switcher */}
          <div className="flex items-center gap-1.5 bg-slate-950 p-1.5 rounded-xl border border-slate-800">
            <button
              type="button"
              onClick={() => setExplanationLevel('simple')}
              className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-colors ${
                explanationLevel === 'simple'
                  ? 'bg-emerald-950 text-emerald-300 border border-emerald-800'
                  : 'text-slate-400 hover:text-slate-200'
              }`}
            >
              Everyday Analogy
            </button>
            <button
              type="button"
              onClick={() => setExplanationLevel('scientific')}
              className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-colors ${
                explanationLevel === 'scientific'
                  ? 'bg-cyan-950 text-cyan-300 border border-cyan-800'
                  : 'text-slate-400 hover:text-slate-200'
              }`}
            >
              Molecular Mechanism
            </button>
            <button
              type="button"
              onClick={() => setExplanationLevel('both')}
              className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-colors ${
                explanationLevel === 'both'
                  ? 'bg-slate-800 text-white'
                  : 'text-slate-400 hover:text-slate-200'
              }`}
            >
              Both Levels
            </button>
          </div>
        </div>

        {/* 5-Stage Progress Stepper */}
        <div className="mt-5 grid grid-cols-2 sm:grid-cols-5 gap-2">
          {VISUAL_STEPS.map((step, idx) => {
            const isActive = idx === activeIdx;
            return (
              <button
                key={step.id}
                type="button"
                onClick={() => setActiveIdx(idx)}
                className={`p-3 rounded-xl border text-left transition-all ${
                  isActive
                    ? 'border-cyan-400 bg-cyan-950/50 text-white ring-1 ring-cyan-400'
                    : 'border-slate-800 bg-slate-950/70 text-slate-400 hover:border-slate-700 hover:text-slate-200'
                }`}
              >
                <span className="block text-[10px] uppercase tracking-wider font-bold text-cyan-400">
                  Stage {step.stepNumber} of 5
                </span>
                <span className="mt-0.5 block text-xs font-bold truncate">{step.shortLabel.replace(/^\d+\.\s*/, '')}</span>
              </button>
            );
          })}
        </div>

        {/* SVG Illustration Canvas */}
        <div className="mt-6 rounded-2xl border border-slate-800 bg-slate-950 p-3 sm:p-5 overflow-hidden">
          {renderStepSvg(activeIdx)}
        </div>

        {/* Active Step Title & Dual-Level Narrative */}
        <div className="mt-6">
          <div className="flex flex-wrap items-center justify-between gap-4">
            <div>
              <span className="text-xs font-bold uppercase tracking-wider text-emerald-400">
                Stage {currentStep.stepNumber} · {currentStep.subtitle}
              </span>
              <h3 className="mt-1 text-xl sm:text-2xl font-bold text-white">{currentStep.title}</h3>
            </div>

            <div className="flex items-center gap-2">
              <button
                type="button"
                disabled={activeIdx === 0}
                onClick={() => setActiveIdx(i => Math.max(0, i - 1))}
                className="inline-flex items-center gap-1 px-3 py-1.5 rounded-xl border border-slate-700 text-xs font-semibold text-slate-200 hover:bg-slate-800 disabled:opacity-40"
              >
                <ChevronLeft className="w-4 h-4" /> Previous
              </button>
              <button
                type="button"
                disabled={activeIdx === VISUAL_STEPS.length - 1}
                onClick={() => setActiveIdx(i => Math.min(VISUAL_STEPS.length - 1, i + 1))}
                className="inline-flex items-center gap-1 px-3 py-1.5 rounded-xl bg-cyan-500 text-slate-950 text-xs font-bold hover:bg-cyan-400 disabled:opacity-40"
              >
                Next Stage <ChevronRight className="w-4 h-4" />
              </button>
            </div>
          </div>

          {/* Narrative Cards */}
          <div className={`mt-5 grid gap-4 ${explanationLevel === 'both' ? 'md:grid-cols-2' : 'grid-cols-1'}`}>
            {(explanationLevel === 'both' || explanationLevel === 'simple') && (
              <div className="p-5 rounded-2xl border border-emerald-900/50 bg-emerald-950/20">
                <div className="flex items-center gap-2 text-xs font-bold uppercase tracking-wider text-emerald-300 mb-2">
                  <Sparkles className="w-4 h-4" />
                  <span>CRISPR Made Simple (Everyday Analogy)</span>
                </div>
                <p className="text-sm leading-relaxed text-slate-200">
                  <GlossaryText text={currentStep.simpleNarrative} />
                </p>
              </div>
            )}

            {(explanationLevel === 'both' || explanationLevel === 'scientific') && (
              <div className="p-5 rounded-2xl border border-cyan-900/50 bg-cyan-950/20">
                <div className="flex items-center gap-2 text-xs font-bold uppercase tracking-wider text-cyan-300 mb-2">
                  <Microscope className="w-4 h-4" />
                  <span>CRISPRpedia Mechanism (At the Bench)</span>
                </div>
                <p className="text-sm leading-relaxed text-slate-200">
                  <GlossaryText text={currentStep.scientificNarrative} />
                </p>
              </div>
            )}
          </div>

          {/* Stem Cell Insight & Key Numbers */}
          <div className="mt-4 grid grid-cols-1 lg:grid-cols-3 gap-4 items-center">
            <div className="lg:col-span-2 p-4 rounded-xl border border-slate-800 bg-slate-950 text-xs leading-relaxed text-slate-300">
              <strong className="text-amber-300">Stem Cell Specifics: </strong>
              <GlossaryText text={currentStep.stemCellInsight} />
            </div>

            <div className="grid grid-cols-3 gap-2">
              {currentStep.keyNumbers.map(kn => (
                <div key={kn.label} className="p-3 rounded-xl border border-slate-800 bg-slate-950 text-center">
                  <span className="block text-xs font-bold text-cyan-300">{kn.value}</span>
                  <span className="mt-0.5 block text-[10px] text-slate-400 leading-tight">{kn.label}</span>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </section>
  );
};
