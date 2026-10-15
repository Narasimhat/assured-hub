// ABIF (.ab1) binary trace reader for Sanger Sequencing chromatograms
// Implemented in pure TypeScript for zero-dependency browser execution.

export interface AbifTrace {
  name: string;
  order: string; // e.g. "GATC"
  channels: {
    A: Int16Array;
    C: Int16Array;
    G: Int16Array;
    T: Int16Array;
  };
  samples: number;
  calls: string;
  peakLocations: number[];
  quality: Uint8Array;
  hasQuality: boolean;
}

const CHANNEL_TAGS = [9, 10, 11, 12];

interface DirectoryEntry {
  name: string;
  number: number;
  type: number;
  elementSize: number;
  elements: number;
  dataSize: number;
  dataOffset: number;
}

function getDataView(input: ArrayBuffer | Uint8Array): DataView {
  if (input instanceof ArrayBuffer) return new DataView(input);
  return new DataView(input.buffer, input.byteOffset, input.byteLength);
}

function readEntries(dv: DataView): Map<string, DirectoryEntry> {
  if (dv.byteLength < 128) throw new Error("File too small to be a valid .ab1 Sanger trace.");
  
  const magic = String.fromCharCode(dv.getUint8(0), dv.getUint8(1), dv.getUint8(2), dv.getUint8(3));
  if (magic !== "ABIF") throw new Error("Invalid format: Header is not ABIF (.ab1).");
  
  const count = dv.getInt32(18, false);
  const offset = dv.getInt32(26, false);
  if (count <= 0 || count > 10000 || offset <= 0 || offset + 28 * count > dv.byteLength) {
    throw new Error("Damaged ABIF directory index.");
  }

  const entries = new Map<string, DirectoryEntry>();
  for (let i = 0; i < count; i += 1) {
    const at = offset + 28 * i;
    const name = String.fromCharCode(
      dv.getUint8(at),
      dv.getUint8(at + 1),
      dv.getUint8(at + 2),
      dv.getUint8(at + 3)
    );
    const number = dv.getInt32(at + 4, false);
    const type = dv.getUint16(at + 8, false);
    const elementSize = dv.getUint16(at + 10, false);
    const elements = dv.getInt32(at + 12, false);
    const dataSize = dv.getInt32(at + 16, false);
    const dataOffset = dataSize <= 4 ? at + 20 : dv.getInt32(at + 20, false);

    if (dataOffset < 0 || dataOffset + dataSize > dv.byteLength) {
      continue;
    }
    entries.set(`${name}${number}`, { name, number, type, elementSize, elements, dataSize, dataOffset });
  }
  return entries;
}

function readShorts(dv: DataView, entry: DirectoryEntry): Int16Array {
  const out = new Int16Array(entry.elements);
  for (let i = 0; i < entry.elements; i += 1) {
    out[i] = dv.getInt16(entry.dataOffset + 2 * i, false);
  }
  return out;
}

function readText(dv: DataView, entry: DirectoryEntry): string {
  let text = "";
  for (let i = 0; i < entry.dataSize; i += 1) {
    text += String.fromCharCode(dv.getUint8(entry.dataOffset + i));
  }
  return text;
}

function readBytes(dv: DataView, entry: DirectoryEntry): Uint8Array {
  const out = new Uint8Array(entry.dataSize);
  for (let i = 0; i < entry.dataSize; i += 1) {
    out[i] = dv.getUint8(entry.dataOffset + i);
  }
  return out;
}

export function parseAbif(input: ArrayBuffer | Uint8Array, fileName: string = ""): AbifTrace {
  const dv = getDataView(input);
  const entries = readEntries(dv);

  const fwo = entries.get("FWO_1");
  const order = (fwo ? readText(dv, fwo) : "GATC").toUpperCase();
  const channels: { [base: string]: Int16Array } = {};

  CHANNEL_TAGS.forEach((tag, idx) => {
    const baseChar = order[idx] || ['G', 'A', 'T', 'C'][idx];
    const dataEntry = entries.get(`DATA${tag}`);
    if (dataEntry) {
      channels[baseChar] = readShorts(dv, dataEntry);
    } else {
      channels[baseChar] = new Int16Array(100);
    }
  });

  const samples = channels.A ? channels.A.length : 100;

  const callsEntry = entries.get("PBAS2") || entries.get("PBAS1");
  const locEntry = entries.get("PLOC2") || entries.get("PLOC1");
  const qualEntry = entries.get("PCON2") || entries.get("PCON1");

  const rawCalls = callsEntry ? readText(dv, callsEntry).toUpperCase().replace(/[^ACGTN]/g, "N") : "";
  const peakLocs = locEntry ? Array.from(readShorts(dv, locEntry)) : [];

  for (let i = 0; i < peakLocs.length; i += 1) {
    if (peakLocs[i] < 0) peakLocs[i] += 65536;
  }

  const n = Math.min(rawCalls.length, peakLocs.length);
  const quality = qualEntry ? readBytes(dv, qualEntry).slice(0, n) : new Uint8Array(n);

  return {
    name: fileName,
    order,
    channels: {
      A: channels.A || new Int16Array(samples),
      C: channels.C || new Int16Array(samples),
      G: channels.G || new Int16Array(samples),
      T: channels.T || new Int16Array(samples),
    },
    samples,
    calls: rawCalls.slice(0, n),
    peakLocations: peakLocs.slice(0, n),
    quality,
    hasQuality: quality.some(q => q > 0)
  };
}
