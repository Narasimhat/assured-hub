import React, { useState } from 'react';
import { 
  ShoppingCart, 
  Download, 
  Copy, 
  Check, 
  ArrowRight, 
  PackageCheck, 
  FileSpreadsheet,
  CheckCircle2,
  ExternalLink
} from 'lucide-react';
import { AssuredProject } from '../../types/pipeline';

interface Stage2OrderProps {
  project: AssuredProject;
  onProceed: () => void;
}

export const Stage2Order: React.FC<Stage2OrderProps> = ({
  project,
  onProceed
}) => {
  const [copiedKey, setCopiedKey] = useState<string | null>(null);
  const target = project.target;

  const isKnockout = target.targetType === 'KNOCKOUT' || !target.donor?.sequence || target.donor.sequence === 'N/A';

  // Order sheet rows are read from the design. Products and scales follow the paper's key resources table
  // (Alt-R CRISPR-Cas9 gRNA, 2 nmol; Alt-R HDR modified ssODN). Confirm the exact product and scale with the vendor.
  const donors = target.donors && target.donors.length > 0 ? target.donors : [target.donor];
  const idtItems = [
    ...target.guides.map((g, i) => ({
      name: g.name || `${target.gene}_gRNA_${i + 1}`,
      sequence: g.sequence,
      scale: 'Alt-R CRISPR-Cas9 gRNA, 2 nmol',
      purification: 'As supplied',
      type: 'Guide RNA'
    })),
    ...(!isKnockout ? donors.map((d, i) => ({
      name: d.name || `${target.gene}_ssODN_${i + 1}`,
      sequence: d.sequence,
      scale: 'Alt-R HDR modified ssODN (product and scale: confirm with vendor)',
      purification: 'As supplied',
      type: 'HDR Repair Template'
    })) : []),
    ...(target.primers ? [
      { name: target.primers.forwardPrimer.name, sequence: target.primers.forwardPrimer.sequence, scale: 'DNA oligo', purification: 'Standard Desalt', type: 'PCR Primer' },
      { name: target.primers.reversePrimer.name, sequence: target.primers.reversePrimer.sequence, scale: 'DNA oligo', purification: 'Standard Desalt', type: 'PCR Primer' },
      ...(target.primers.sequencingPrimer ? [{ name: target.primers.sequencingPrimer.name, sequence: target.primers.sequencingPrimer.sequence, scale: 'DNA oligo', purification: 'Standard Desalt', type: 'Sanger Primer' }] : [])
    ] : [])
  ];

  const handleCopy = (text: string, key: string) => {
    navigator.clipboard.writeText(text);
    setCopiedKey(key);
    setTimeout(() => setCopiedKey(null), 2000);
  };

  const handleDownloadIdtCsv = () => {
    const headers = 'Sequence Name,Sequence,Product,Purification,Type\n';
    const rows = idtItems.map(item => `"${item.name}","${item.sequence}","${item.scale}","${item.purification}","${item.type}"`).join('\n');
    const blob = new Blob([headers + rows], { type: 'text/csv' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `Order_${target.gene}_ASSURED_CRISPR.csv`;
    a.click();
    URL.revokeObjectURL(url);
  };

  return (
    <div className="space-y-6 animate-in fade-in duration-200">
      
      {/* Stage Header */}
      <div className="p-6 rounded-3xl bg-slate-900 border border-slate-800 space-y-2">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2 text-xs font-bold uppercase tracking-wider text-amber-400">
            <ShoppingCart className="w-4 h-4" />
            <span>Stage 2: Order sheet from the design</span>
          </div>
          <span className="text-xs text-slate-400 font-mono">
            Sequences are copied from the design
          </span>
        </div>
        <h2 className="text-2xl font-black text-white">
          Reagent Procurement Manifest for {target.gene}
        </h2>
        <p className="text-xs text-slate-300 leading-relaxed max-w-3xl">
          Guide, donor and primer sequences are read from the design and listed for ordering. Before you order, the protocol recommends Sanger-sequencing the PCR-amplified target region of your own cell line to rule out SNPs in the guide, primer and homology-arm sites. Confirm every product, scale and format with your vendor.
        </p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
        
        {/* Main Ordering Sheet Table (8 cols) */}
        <div className="lg:col-span-8 space-y-6">
          <div className="p-6 rounded-2xl bg-slate-950 border border-slate-800 space-y-4">
            <div className="flex flex-wrap items-center justify-between gap-3 pb-3 border-b border-slate-800">
              <div className="flex items-center gap-2">
                <FileSpreadsheet className="w-5 h-5 text-amber-400" />
                <h3 className="text-sm font-bold text-white">
                  Order sheet (CSV; check the vendor's upload format)
                </h3>
              </div>

              <div className="flex items-center gap-2">
                <button
                  onClick={handleDownloadIdtCsv}
                  className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-amber-500 hover:bg-amber-400 text-slate-950 text-xs font-bold transition-all shadow-sm shadow-amber-500/20"
                >
                  <Download className="w-3.5 h-3.5" />
                  <span>Download CSV</span>
                </button>
              </div>
            </div>

            {/* Table */}
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs font-mono">
                <thead>
                  <tr className="border-b border-slate-800 text-slate-500 text-[11px] uppercase">
                    <th className="py-2.5 px-3">Item Name</th>
                    <th className="py-2.5 px-3">Sequence (5' &gt; 3')</th>
                    <th className="py-2.5 px-3">Product</th>
                    <th className="py-2.5 px-3 text-right">Action</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-800/60">
                  {idtItems.map((item, idx) => (
                    <tr key={idx} className="hover:bg-slate-900/40">
                      <td className="py-3 px-3 font-bold text-white whitespace-nowrap">
                        {item.name}
                      </td>
                      <td className="py-3 px-3 text-emerald-400 max-w-xs truncate" title={item.sequence}>
                        {item.sequence}
                      </td>
                      <td className="py-3 px-3 text-slate-400 text-[11px] whitespace-nowrap">
                        {item.scale}
                      </td>
                      <td className="py-3 px-3 text-right">
                        <button
                          onClick={() => handleCopy(item.sequence, `item-${idx}`)}
                          className="p-1.5 rounded hover:bg-slate-800 text-slate-400 hover:text-white transition-colors"
                          title="Copy sequence"
                        >
                          {copiedKey === `item-${idx}` ? (
                            <Check className="w-3.5 h-3.5 text-emerald-400" />
                          ) : (
                            <Copy className="w-3.5 h-3.5" />
                          )}
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            {!isKnockout ? (
              <p className="text-[11px] text-slate-500 pt-2">
                * Note: The paper specifies an &quot;Alt-R HDR modified ssODN&quot; but not its chemistry, so the sequences here are plain and no end modifications are drawn. Donors are given as ordered (non-PAM strand).
              </p>
            ) : (
              <p className="text-[11px] text-emerald-400/90 pt-2 bg-emerald-950/20 p-2.5 rounded-lg border border-emerald-900/40">
                ✓ <strong>Knockout mode:</strong> one or two gRNAs generate frameshift indels or a deletion between the cuts, without a donor ssODN.
              </p>
            )}
          </div>
        </div>

        {/* Bench Inventory Checklist & Proceed (4 cols) */}
        <div className="lg:col-span-4 space-y-5">
          <div className="p-5 rounded-2xl bg-slate-900 border border-slate-800 space-y-4">
            <div className="flex items-center gap-2 text-xs font-bold uppercase tracking-wider text-slate-300">
              <PackageCheck className="w-4 h-4 text-emerald-400" />
              <span>Key resources from the paper</span>
            </div>

            <div className="space-y-2.5 text-xs">
              {[
                { name: 'Alt-R S.p. HiFi Cas9 Nuclease V3, 500 \u00b5g', cat: 'IDT 1081061', required: '10 \u00b5g/\u00b5L stock' },
                { name: 'Alt-R CRISPR-Cas9 gRNA, 2 nmol', cat: 'IDT predesigned or custom', required: 'one per guide' },
                { name: 'Neon Transfection System 10 \u00b5L Kit', cat: 'Thermo Fisher MPK1096', required: '10 \u00b5L tip' },
                { name: 'StemFlex medium', cat: 'Life Technologies A3349401', required: 'with CloneR2 after transfection and cloning' },
                { name: 'CloneR2', cat: 'STEMCELL 100-0691', required: 'added to StemFlex (dilution: see the protocol)' },
                { name: 'Geltrex', cat: 'Thermo Fisher A1413302', required: 'plate coating' },
                { name: 'Phire Tissue Direct PCR Master Mix', cat: 'Thermo Fisher F170S', required: 'crude-lysate PCR for screening' },
              ].map((res, i) => (
                <div key={i} className="p-2.5 rounded-lg bg-slate-950 border border-slate-800/80 flex items-start gap-2">
                  <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400 shrink-0 mt-0.5" />
                  <div>
                    <div className="font-semibold text-slate-200">{res.name}</div>
                    <div className="text-[10px] text-slate-500 font-mono">{res.cat} • {res.required}</div>
                  </div>
                </div>
              ))}
            </div>

            {/* Proceed Button */}
            <button
              onClick={onProceed}
              className="w-full py-3.5 px-4 rounded-xl font-bold text-sm bg-gradient-to-r from-amber-500 to-emerald-500 hover:opacity-95 text-slate-950 flex items-center justify-center gap-2 shadow-lg shadow-amber-500/20 transition-all mt-4"
            >
              <span>Confirm Order Placed & Setup Bench (Stage 3)</span>
              <ArrowRight className="w-4 h-4" />
            </button>
          </div>
        </div>

      </div>

    </div>
  );
};
