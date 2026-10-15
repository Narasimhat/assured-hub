// Seeded, platform-independent random numbers (mulberry32). Same seed => same plate on every machine.
export function makeRng(seed) {
  let a = (seed >>> 0) || 1;
  const next = () => { a = (a + 0x6D2B79F5) >>> 0; let t = a; t = Math.imul(t ^ (t >>> 15), t | 1); t ^= t + Math.imul(t ^ (t >>> 7), t | 61); return ((t ^ (t >>> 14)) >>> 0) / 4294967296; };
  next.normal = () => { let u = 0; while (u === 0) u = next(); return Math.sqrt(-2 * Math.log(u)) * Math.cos(2 * Math.PI * next()); };
  next.int = (n) => Math.floor(next() * n);
  next.weighted = (pairs) => { const total = pairs.reduce((s, [, w]) => s + w, 0); let r = next() * total; for (const [v, w] of pairs) { r -= w; if (r <= 0) return v; } return pairs[pairs.length - 1][0]; };
  return next;
}
