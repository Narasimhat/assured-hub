import React, { useMemo, useState } from 'react';
import { Wallet, ShieldCheck, AlertTriangle, Copy, Check, ClipboardList } from 'lucide-react';
import { FrugalConfig } from '../../types';

// This tab used to price and "optimise" a bench SOP from unsourced numbers. It now separates what the paper validated from
// what a lab has to validate itself, and it totals only prices the learner types in. It contains no prices, savings or settings
// of its own. Source of the validated column: the key resources table and Table 7 of Ludwik et al., STAR Protocols 2023.

type Choice = { id: string; name: string; status: 'paper' | 'named' | 'untested'; note: string };

const ELECTROPORATION: Choice[] = [
  { id: 'neon-10ul', name: 'Neon system, 10 \u00b5L kit', status: 'paper', note: 'Validated in the paper: 1200 V, 30 ms, 1 pulse.' },
  { id: 'other-electroporator', name: 'Another electroporator or nucleofector', status: 'named', note: 'The paper says other systems can be used with appropriate optimisation. It gives no settings for them.' },
];
const CLONING: Choice[] = [
  { id: 'isocell', name: 'isoCell platform', status: 'paper', note: 'Described in the paper: 256 wells per plate, about 40% outgrowth, about 100 clones.' },
  { id: 'limiting-dilution', name: 'Limiting dilution', status: 'named', note: 'Named in the paper as an alternative. It gives no seeding density or expected yield.' },
  { id: 'clone-picking', name: 'Clone picking', status: 'named', note: 'Named in the paper as an alternative. It gives no yield.' },
];
const GRNA: Choice[] = [
  { id: 'alt-r', name: 'Alt-R CRISPR-Cas9 gRNA (IDT), 2 nmol', status: 'paper', note: 'Used in the paper with Alt-R S.p. HiFi Cas9 Nuclease V3 and Table 7 volumes.' },
  { id: 'other-synthetic', name: 'Another synthetic gRNA', status: 'untested', note: 'Not covered by the paper. Confirm cutting in bulk before you commit to cloning.' },
  { id: 'in-vitro-transcribed', name: 'In-vitro transcribed gRNA', status: 'untested', note: 'Not covered by the paper. Confirm cutting in bulk before you commit to cloning.' },
];
const SCREENING: Choice[] = [
  { id: 'sanger-all', name: 'PCR and Sanger sequencing of every clone', status: 'paper', note: 'Described in the paper, using crude lysates for the PCR.' },
  { id: 'prescreen', name: 'A cheaper pre-screen, then Sanger on the positives', status: 'untested', note: 'Not in the paper. A restriction-site pre-screen only works if the edit or a blocking change creates or destroys a site, and every accepted clone still needs sequencing.' },
];

const BADGE: Record<Choice['status'], { label: string; cls: string }> = {
  paper: { label: 'validated in the paper', cls: 'text-emerald-300 bg-emerald-950 border-emerald-800' },
  named: { label: 'named by the paper, no settings', cls: 'text-amber-300 bg-amber-950 border-amber-800' },
  untested: { label: 'not covered: validate it yourself', cls: 'text-rose-300 bg-rose-950 border-rose-800' },
};

const Group: React.FC<{ title: string; choices: Choice[]; value: string; onChange: (v: string) => void }> = ({ title, choices, value, onChange }) => (
  <div className="space-y-2">
    <h4 className="text-xs font-bold uppercase tracking-wider text-slate-400">{title}</h4>
    <div className="grid grid-cols-1 gap-2">
      {choices.map((c) => (
        <button key={c.id} onClick={() => onChange(c.id)} className={`p-3 rounded-xl border text-left transition-all ${value === c.id ? 'bg-slate-900 border-cyan-500 ring-1 ring-cyan-500' : 'bg-slate-950/60 border-slate-800 hover:border-slate-700'}`}>
          <div className="flex items-center justify-between gap-2">
            <span className="text-xs font-bold text-white">{c.name}</span>
            <span className={`text-[10px] font-mono px-2 py-0.5 rounded border ${BADGE[c.status].cls}`}>{BADGE[c.status].label}</span>
          </div>
          <p className="text-[11px] text-slate-400 mt-1 leading-relaxed">{c.note}</p>
        </button>
      ))}
    </div>
  </div>
);

const money = (v: number) => (Number.isFinite(v) ? v.toLocaleString(undefined, { maximumFractionDigits: 2 }) : '0');

export const FrugalLabConfig: React.FC = () => {
  const [config, setConfig] = useState<FrugalConfig>({ electroporator: 'neon-10ul', cloningTech: 'isocell', gRNASource: 'alt-r', screeningStrategy: 'sanger-all' });
  const [reactions, setReactions] = useState(2);
  const [efficiency, setEfficiency] = useState(50);
  const [wanted, setWanted] = useState(15);
  const [prices, setPrices] = useState({ electroporation: 0, gRNA: 0, ssodn: 0, cloningPlate: 0, plates: 1, perCloneScreen: 0 });
  const [copied, setCopied] = useState(false);

  const toScreen = Math.ceil(wanted / (efficiency / 100));
  const total = useMemo(() => reactions * prices.electroporation + reactions * (prices.gRNA + prices.ssodn) + prices.plates * prices.cloningPlate + toScreen * prices.perCloneScreen, [reactions, prices, toScreen]);
  const pick = (list: Choice[], id: string) => list.find((c) => c.id === id) as Choice;
  const setNum = (k: keyof typeof prices) => (e: React.ChangeEvent<HTMLInputElement>) => setPrices((p) => ({ ...p, [k]: Math.max(0, Number(e.target.value) || 0) }));

  const unvalidated = [pick(ELECTROPORATION, config.electroporator), pick(CLONING, config.cloningTech), pick(GRNA, config.gRNASource), pick(SCREENING, config.screeningStrategy)].filter((c) => c.status !== 'paper');

  const plan = [
    'Protocol adaptation plan (generated from your choices; edit it before use)',
    `Reference: Ludwik KA, Telugu N, Schommer S, Stachelscheid H, Diecke S. STAR Protocols 2023. doi:10.1016/j.xpro.2023.102406`,
    '',
    `Electroporation: ${pick(ELECTROPORATION, config.electroporator).name} (${BADGE[pick(ELECTROPORATION, config.electroporator).status].label})`,
    `Cloning: ${pick(CLONING, config.cloningTech).name} (${BADGE[pick(CLONING, config.cloningTech).status].label})`,
    `gRNA: ${pick(GRNA, config.gRNASource).name} (${BADGE[pick(GRNA, config.gRNASource).status].label})`,
    `Screening: ${pick(SCREENING, config.screeningStrategy).name} (${BADGE[pick(SCREENING, config.screeningStrategy).status].label})`,
    '',
    unvalidated.length ? `To validate yourself before committing clones: ${unvalidated.map((c) => c.name).join('; ')}.` : 'Every choice follows the paper.',
    `Reactions: ${reactions}. If bulk editing is ${efficiency}%, screen about ${toScreen} clones to expect ${wanted} edited clones.`,
    `Your budget total, from the prices you entered: ${money(total)}.`,
  ].join('\n');

  return (
    <div className="space-y-8 animate-in fade-in duration-300">
      <div className="p-6 sm:p-8 rounded-3xl bg-gradient-to-r from-emerald-950/50 via-slate-900 to-slate-900 border border-emerald-800/50 space-y-3">
        <div className="flex items-center gap-2 text-xs font-bold uppercase tracking-wider text-emerald-400">
          <Wallet className="w-4 h-4" />
          <span>Adapting the protocol to your lab</span>
        </div>
        <h1 className="text-2xl sm:text-3xl font-black text-white tracking-tight">What the paper validated, and what you must validate</h1>
        <p className="text-sm text-slate-300 leading-relaxed max-w-3xl">
          The ASSURED protocol was validated with one set of reagents and instruments. Where you substitute something, the paper does not tell you what will happen. This page labels each choice, counts the clones you need to screen, and totals a budget from <strong>prices you enter</strong>. It contains no prices or savings of its own.
        </p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
        <div className="lg:col-span-7 space-y-6">
          <Group title="Electroporation" choices={ELECTROPORATION} value={config.electroporator} onChange={(v) => setConfig({ ...config, electroporator: v as FrugalConfig['electroporator'] })} />
          <Group title="Single-cell cloning" choices={CLONING} value={config.cloningTech} onChange={(v) => setConfig({ ...config, cloningTech: v as FrugalConfig['cloningTech'] })} />
          <Group title="Guide RNA" choices={GRNA} value={config.gRNASource} onChange={(v) => setConfig({ ...config, gRNASource: v as FrugalConfig['gRNASource'] })} />
          <Group title="Screening" choices={SCREENING} value={config.screeningStrategy} onChange={(v) => setConfig({ ...config, screeningStrategy: v as FrugalConfig['screeningStrategy'] })} />
        </div>

        <div className="lg:col-span-5 space-y-5">
          <div className={`p-4 rounded-2xl border text-xs leading-relaxed space-y-1 ${unvalidated.length ? 'bg-amber-950/20 border-amber-800/40 text-amber-200/90' : 'bg-emerald-950/20 border-emerald-800/40 text-emerald-200/90'}`}>
            <div className="flex items-center gap-2 font-bold">
              {unvalidated.length ? <AlertTriangle className="w-4 h-4" /> : <ShieldCheck className="w-4 h-4" />}
              <span>{unvalidated.length ? `${unvalidated.length} choice${unvalidated.length > 1 ? 's' : ''} outside what the paper validated` : 'Every choice follows the paper'}</span>
            </div>
            {unvalidated.length > 0 && <p>Test each with an untransfected control and a bulk editing readout before you spend effort on cloning.</p>}
          </div>

          <div className="p-5 rounded-2xl bg-slate-900 border border-slate-800 space-y-3 text-xs">
            <h4 className="text-xs font-bold uppercase tracking-wider text-slate-400">How many clones to screen</h4>
            <div className="grid grid-cols-3 gap-3">
              <label className="text-slate-300">Reactions<input type="number" min={1} max={12} value={reactions} onChange={(e) => setReactions(Math.min(12, Math.max(1, Number(e.target.value) || 1)))} className="w-full mt-1 p-2 bg-slate-950 border border-slate-800 rounded-lg text-slate-200" /></label>
              <label className="text-slate-300">Bulk editing %<input type="number" min={1} max={100} value={efficiency} onChange={(e) => setEfficiency(Math.min(100, Math.max(1, Number(e.target.value) || 1)))} className="w-full mt-1 p-2 bg-slate-950 border border-slate-800 rounded-lg text-slate-200" /></label>
              <label className="text-slate-300">Edited clones<input type="number" min={1} max={200} value={wanted} onChange={(e) => setWanted(Math.min(200, Math.max(1, Number(e.target.value) || 1)))} className="w-full mt-1 p-2 bg-slate-950 border border-slate-800 rounded-lg text-slate-200" /></label>
            </div>
            <p className="text-slate-300">Screen about <strong className="text-emerald-400 font-mono">{toScreen}</strong> clones (the paper&apos;s examples: 50% needs 30 for 15 edited clones; 5% needs 300).</p>
          </div>

          <div className="p-5 rounded-2xl bg-slate-900 border border-slate-800 space-y-3 text-xs">
            <h4 className="text-xs font-bold uppercase tracking-wider text-slate-400">Your budget (enter your own prices)</h4>
            {([['electroporation', 'Electroporation, per reaction'], ['gRNA', 'gRNA, per reaction'], ['ssodn', 'ssODN, per reaction'], ['cloningPlate', 'Cloning, per plate'], ['plates', 'Cloning plates'], ['perCloneScreen', 'PCR + Sanger, per clone']] as [keyof typeof prices, string][]).map(([k, label]) => (
              <label key={k} className="flex items-center justify-between gap-3 text-slate-300">
                <span>{label}</span>
                <input type="number" min={0} value={prices[k]} onChange={setNum(k)} className="w-28 p-1.5 bg-slate-950 border border-slate-800 rounded-lg text-slate-200 text-right font-mono" />
              </label>
            ))}
            <div className="flex items-center justify-between pt-2 border-t border-slate-800 text-sm">
              <span className="text-slate-300 font-bold">Total</span>
              <span className="font-mono font-bold text-cyan-300">{money(total)}</span>
            </div>
          </div>

          <div className="p-5 rounded-2xl bg-slate-900 border border-slate-800 space-y-3">
            <div className="flex items-center justify-between">
              <span className="text-xs font-bold uppercase tracking-wider text-slate-300 flex items-center gap-2"><ClipboardList className="w-4 h-4 text-cyan-400" />Plan</span>
              <button onClick={() => { navigator.clipboard.writeText(plan); setCopied(true); setTimeout(() => setCopied(false), 2000); }} className="text-xs text-cyan-400 hover:text-cyan-300 flex items-center gap-1 font-semibold">
                {copied ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5" />}<span>{copied ? 'Copied' : 'Copy'}</span>
              </button>
            </div>
            <div className="p-3 rounded-xl bg-slate-950 border border-slate-800 text-[11px] text-slate-300 font-mono leading-relaxed whitespace-pre-wrap">{plan}</div>
          </div>
        </div>
      </div>
    </div>
  );
};
