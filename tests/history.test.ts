import { describe, expect, it } from "vitest";
import { PAGE_SIZE, historyWhere, parseHistoryParams, toCsv } from "@/lib/history";

const now = new Date(2026, 9, 27, 15);
const me = { meId: "u1", canSeeOthers: true };

describe("parseHistoryParams", () => {
  it("padrão: últimos 90 dias, só o próprio histórico", () => {
    const f = parseHistoryParams({}, me, now);
    expect(f.prof).toBe("u1");
    expect(f.to.getTime()).toBe(new Date(2026, 9, 27).getTime());
    expect(Math.round((f.to.getTime() - f.from.getTime()) / 864e5)).toBe(90);
    expect(f.page).toBe(1);
  });
  it("quem pode ver os outros escolhe um profissional ou 'todos'", () => {
    expect(parseHistoryParams({ prof: "u2" }, me, now).prof).toBe("u2");
    expect(parseHistoryParams({ prof: "todos" }, me, now).prof).toBeUndefined();
  });
  it("quem não pode ver os outros fica sempre no próprio histórico", () => {
    const only = { meId: "u1", canSeeOthers: false };
    expect(parseHistoryParams({ prof: "u2" }, only, now).prof).toBe("u1");
    expect(parseHistoryParams({ prof: "todos" }, only, now).prof).toBe("u1");
  });
  it("ignora datas, situação e página inválidas", () => {
    const f = parseHistoryParams({ de: "ontem", ate: "2026-13-45", status: "XYZ", p: "-3" }, me, now);
    expect(f.status).toBeUndefined();
    expect(f.page).toBe(1);
    expect(Math.round((f.to.getTime() - f.from.getTime()) / 864e5)).toBe(90);
  });
  it("lê datas, paciente, situação e página válidos", () => {
    const f = parseHistoryParams({ de: "2026-01-01", ate: "2026-01-31", paciente: "p1", status: "FALTOU", p: "3" }, me, now);
    expect(f).toMatchObject({ patientId: "p1", status: "FALTOU", page: 3 });
    expect(f.from.getTime()).toBe(new Date(2026, 0, 1).getTime());
  });
});

describe("historyWhere", () => {
  it("a data final é inclusiva (vai até o fim do dia)", () => {
    const w = historyWhere(parseHistoryParams({ de: "2026-01-01", ate: "2026-01-31" }, me, now));
    expect(w.startsAt.lt.getTime()).toBe(new Date(2026, 1, 1).getTime());
  });
  it("só inclui os filtros informados", () => {
    expect(Object.keys(historyWhere(parseHistoryParams({ prof: "todos" }, me, now)))).toEqual(["startsAt"]);
    const w = historyWhere(parseHistoryParams({ prof: "u2", paciente: "p1", status: "REALIZADA" }, me, now)) as Record<string, unknown>;
    expect(w).toMatchObject({ professionalId: "u2", patientId: "p1", status: "REALIZADA" });
  });
  it("tamanho da página", () => expect(PAGE_SIZE).toBe(25));
});

describe("toCsv", () => {
  it("separa por ponto e vírgula e protege aspas, separadores e quebras de linha", () => {
    expect(toCsv([["a", "b;c"], ['d"e', "f\ng"]])).toBe('a;"b;c"\r\n"d""e";"f\ng"');
  });
});
