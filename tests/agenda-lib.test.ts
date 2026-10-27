import { describe, expect, it } from "vitest";
import { agendaWhere, groupBySlot } from "@/lib/agenda";

const from = new Date(2026, 9, 12), to = new Date(2026, 9, 19);

describe("agendaWhere", () => {
  it("pilates traz só PILATES", () => expect(agendaWhere("pilates", from, to).therapy).toBe("PILATES"));
  it("consultas exclui PILATES", () => expect(agendaWhere("consultas", from, to).therapy).toEqual({ not: "PILATES" }));
  it("filtra pelo período e, se informado, pelo profissional", () => {
    const w = agendaWhere("consultas", from, to, "u1");
    expect(w.startsAt).toEqual({ gte: from, lt: to });
    expect((w as { professionalId?: string }).professionalId).toBe("u1");
    expect("professionalId" in agendaWhere("consultas", from, to)).toBe(false);
  });
});

describe("groupBySlot", () => {
  const at = (h: number, m = 0) => new Date(2026, 9, 12, h, m);
  it("agrupa quem começa no mesmo horário e ordena", () => {
    const g = groupBySlot([{ n: "c", startsAt: at(16) }, { n: "a", startsAt: at(15) }, { n: "b", startsAt: at(15) }]);
    expect(g.map((s) => s.items.map((i) => i.n))).toEqual([["a", "b"], ["c"]]);
    expect(g[0].time.getTime()).toBe(at(15).getTime());
  });
  it("lista vazia", () => expect(groupBySlot([])).toEqual([]));
});
