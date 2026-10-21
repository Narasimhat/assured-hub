import { NUCLEASES } from "./nucleases.js";
import { MAX_GUIDES, MAX_DONOR_NT, redistributeGuides, redistributeDonors } from "./manualInput.js";

// gRNA and donor sequences typed by the user when there is no design file. State lives in QuickStart; the checks are in manualInput.js.
const ROLE = { intended: "intended edit", blocking: "blocking change", unclassified: "not classified" };

function Feedback({ id, entries }) {
  return (
    <div id={id} aria-live="polite" style={{ minHeight: 18 }}>
      {entries.map((entry, i) => (
        <div key={i}>
          {entry.sequence ? <span className="muted">{entry.length} nt. </span> : null}
          {entry.notes.map((note) => <span key={note} className="note">{note} </span>)}
          {entry.errors.map((error) => <span key={error} className="error">{error} </span>)}
        </div>
      ))}
    </div>
  );
}

function Preview({ preview }) {
  if (!preview.ok) return <p className="error" role="status">{preview.error}</p>;
  return (
    <div role="status">
      <p><b>Checked against {preview.control}.</b> {preview.summary}. Positions are counted along the control read as in the report (the first base is 0), and a change is written like G533T.</p>
      {preview.warnings.map((w) => <p key={w} className="warn">{w}</p>)}
      {preview.guides.length > 0 && (
        <table>
          <thead><tr><th>gRNA</th><th>Sequence</th><th>Strand</th><th>PAM in the read</th><th>Cut between</th></tr></thead>
          <tbody>
            {preview.guides.map((g, i) => (
              <tr key={g.name + i}><td>{i + 1}</td><td><code>{g.spacer}</code></td><td>{g.strand}</td><td className={g.pamOk ? "" : "warn"}>{g.pam || "none in the read"}{g.pamOk ? "" : " (not a PAM)"}</td><td>{g.cut - 1} and {g.cut}</td></tr>
            ))}
          </tbody>
        </table>
      )}
      {preview.donors.length > 0 && (
        <table>
          <thead><tr><th>Donor</th><th>Length</th><th>Orientation on the read</th><th>Changes it carries</th></tr></thead>
          <tbody>
            {preview.donors.map((d, i) => (
              <tr key={d.name + i}>
                <td>{d.name}</td><td>{d.length} nt</td><td>{d.orientation}</td>
                <td>{[d.insertBp || d.replacedBp ? `${d.insertBp} bp inserted for ${d.replacedBp} bp` : "", ...preview.markers.filter((m) => d.carries.includes(m.pos)).map((m) => `${m.label} (${ROLE[m.role] || m.role})`)].filter(Boolean).join(", ") || "none"}</td>
              </tr>
            ))}
          </tbody>
        </table>
      )}
      {preview.markers.length > 0 && !preview.classified && (
        <p className="note">None of these changes is marked as the intended edit, so a partial conversion is not annotated as having the intended edit present or absent. For a two-gRNA design enter both ssODNs: the change they share is taken as the intended edit and each one's own changes as blocking changes. A design file gives the same.</p>
      )}
    </div>
  );
}

export default function ManualSequences({ guideRows, donorRows, setGuideRows, setDonorRows, manual, nuclease, setNuclease, disabled, canCheck, onCheck, checking, preview }) {
  const forRow = (list, row) => list.filter((entry) => entry.row === row);
  const total = manual.guides.length + manual.donors.length;
  return (
    <section aria-labelledby="manual-h" style={{ borderTop: "1px solid #eaecf0", marginTop: 12, paddingTop: 8 }}>
      <h2 id="manual-h">No design file? Enter your gRNA and donor sequences</h2>
      <p className="muted">Paste each gRNA as its 20-nt spacer (a PAM after it is removed) and each donor as the ssODN you ordered, in either orientation. Both are placed on the control trace automatically. A sample sheet with guide or donor columns overrides these for its samples. Leave everything empty to infer the cut from where the edited traces depart from the control.</p>

      <label className="field" htmlFor="q-nuc-manual">Nuclease</label>
      <select id="q-nuc-manual" value={nuclease} disabled={disabled} onChange={(e) => setNuclease(e.target.value)}>{Object.entries(NUCLEASES).map(([k, v]) => <option key={k} value={k}>{v.label}</option>)}</select>

      {guideRows.map((row, i) => (
        <div key={i}>
          <label className="field" htmlFor={`q-guide-${i}`}>gRNA {i + 1}</label>
          <div style={{ display: "flex", gap: 8 }}>
            <input id={`q-guide-${i}`} type="text" spellCheck="false" autoComplete="off" disabled={disabled} value={row.text} aria-describedby={`q-guide-${i}-fb`} aria-invalid={forRow(manual.guides, i).some((g) => g.errors.length) || undefined}
              placeholder="20-nt spacer, 5' to 3'" onChange={(e) => setGuideRows(redistributeGuides(guideRows, i, e.target.value))} />
            {guideRows.length > 1 && <button type="button" className="link" disabled={disabled} aria-label={`Remove gRNA ${i + 1}`} onClick={() => setGuideRows(guideRows.filter((_, j) => j !== i))}>Remove</button>}
          </div>
          <Feedback id={`q-guide-${i}-fb`} entries={forRow(manual.guides, i)} />
        </div>
      ))}
      {guideRows.length < MAX_GUIDES && <p><button type="button" className="link" disabled={disabled} onClick={() => setGuideRows([...guideRows, { text: "" }])}>Add gRNA</button></p>}

      {donorRows.map((row, i) => (
        <div key={i}>
          <label className="field" htmlFor={`q-donor-${i}`}>Donor {i + 1} (ssODN, up to {MAX_DONOR_NT} nt)</label>
          <input type="text" aria-label={`Name of donor ${i + 1} (optional)`} disabled={disabled} value={row.name} placeholder="Name (optional)" style={{ marginBottom: 4 }} onChange={(e) => setDonorRows(donorRows.map((r, j) => (j === i ? { ...r, name: e.target.value } : r)))} />
          <div style={{ display: "flex", gap: 8 }}>
            <textarea id={`q-donor-${i}`} spellCheck="false" disabled={disabled} value={row.text} aria-describedby={`q-donor-${i}-fb`} aria-invalid={forRow(manual.donors, i).some((d) => d.errors.length) || undefined}
              placeholder="Paste the sequence; FASTA with several records fills one box per donor" onChange={(e) => setDonorRows(redistributeDonors(donorRows, i, e.target.value))} />
            {donorRows.length > 1 && <button type="button" className="link" disabled={disabled} aria-label={`Remove donor ${i + 1}`} onClick={() => setDonorRows(donorRows.filter((_, j) => j !== i))}>Remove</button>}
          </div>
          <Feedback id={`q-donor-${i}-fb`} entries={forRow(manual.donors, i)} />
        </div>
      ))}
      <p><button type="button" className="link" disabled={disabled} onClick={() => setDonorRows([...donorRows, { name: "", text: "" }])}>Add another donor</button> <span className="muted">For a two-gRNA SNP or tag, add one ssODN per gRNA.</span></p>

      {manual.problems.map((p) => <p key={p} className="error">{p}</p>)}
      {manual.entered && <p role="status" className={manual.ready ? "muted" : "error"}>{manual.ready ? `${manual.guides.length} gRNA${manual.guides.length === 1 ? "" : "s"} and ${manual.donors.length} donor${manual.donors.length === 1 ? "" : "s"} ready.` : "Fix the entries marked above before analysing."}</p>}
      {manual.entered && manual.ready && (canCheck
        ? <p><button type="button" className="link" disabled={disabled || checking || !total} onClick={onCheck}>{checking ? "Checking..." : "Check against the control trace"}</button> <span className="muted">Shows where each gRNA lands and what each donor changes, before you analyse.</span></p>
        : <p className="muted">Add your control and sample traces below to check where these sequences land.</p>)}
      {preview && <Preview preview={preview} />}
    </section>
  );
}
