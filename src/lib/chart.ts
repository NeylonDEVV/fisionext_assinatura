/** Pontos (x, y) de uma linha de evolução dentro de uma área w×h. Escala fixa (min/max) ou ajustada aos dados. */
export function chartPoints(values: number[], opts: { min?: number; max?: number; w?: number; h?: number; padX?: number; padY?: number } = {}) {
  const { w = 280, h = 90, padX = 10, padY = 10 } = opts;
  if (values.length === 0) return [];
  let lo = opts.min ?? Math.min(...values), hi = opts.max ?? Math.max(...values);
  if (opts.min === undefined || opts.max === undefined) { const pad = (hi - lo) * 0.15 || 1; lo -= pad; hi += pad; }
  if (hi === lo) hi = lo + 1;
  const n = values.length;
  return values.map((v, i) => ({
    x: n > 1 ? padX + (i * w) / (n - 1) : padX + w / 2,
    y: padY + (1 - (v - lo) / (hi - lo)) * h,
  }));
}
