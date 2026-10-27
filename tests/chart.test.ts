import { describe, expect, it } from "vitest";
import { chartPoints } from "@/lib/chart";

describe("chartPoints", () => {
  it("sem valores, sem pontos", () => expect(chartPoints([])).toEqual([]));
  it("escala fixa: valor máximo no topo, mínimo na base, x distribuído", () => {
    const p = chartPoints([10, 0], { min: 0, max: 10, w: 280, h: 90, padX: 10, padY: 10 });
    expect(p).toEqual([{ x: 10, y: 10 }, { x: 290, y: 100 }]);
  });
  it("dor que cai desce no gráfico", () => {
    const p = chartPoints([8, 5, 3], { min: 0, max: 10 });
    expect(p[0].y).toBeLessThan(p[1].y);
    expect(p[1].y).toBeLessThan(p[2].y);
  });
  it("escala ajustada aos dados (peso): mantém a ordem e dentro da área", () => {
    const p = chartPoints([82.4, 81.6, 80.1]);
    expect(p[0].y).toBeLessThan(p[2].y);
    for (const q of p) { expect(q.y).toBeGreaterThanOrEqual(10); expect(q.y).toBeLessThanOrEqual(100); }
  });
  it("valores iguais não dividem por zero", () => {
    const p = chartPoints([70, 70, 70]);
    expect(new Set(p.map((q) => q.y)).size).toBe(1);
    expect(Number.isFinite(p[0].y)).toBe(true);
  });
  it("um único ponto fica no centro", () => expect(chartPoints([5], { min: 0, max: 10 })[0].x).toBe(150));
});
