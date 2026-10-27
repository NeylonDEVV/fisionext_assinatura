import { addDays, startOfDay } from "./utils";
import { STATUS } from "./therapy";

export type HistoryFilters = { from: Date; to: Date; prof?: string; patientId?: string; status?: string; page: number };
export const PAGE_SIZE = 25;

const parseDay = (s?: string) => {
  if (!s || !/^\d{4}-\d{2}-\d{2}$/.test(s)) return undefined;
  const d = new Date(`${s}T00:00:00`);
  return isNaN(d.getTime()) ? undefined : d;
};

/** Lê os filtros da URL. Quem não pode ver os outros profissionais fica sempre no próprio histórico. */
export function parseHistoryParams(sp: Record<string, string | undefined>, ctx: { meId: string; canSeeOthers: boolean }, now = new Date()): HistoryFilters {
  const from = parseDay(sp.de) ?? addDays(startOfDay(now), -90);
  const to = parseDay(sp.ate) ?? startOfDay(now);
  const prof = ctx.canSeeOthers ? (sp.prof === "todos" ? undefined : sp.prof || ctx.meId) : ctx.meId;
  return {
    from, to, prof,
    patientId: sp.paciente || undefined,
    status: sp.status && sp.status in STATUS ? sp.status : undefined,
    page: Math.max(1, Math.floor(Number(sp.p)) || 1),
  };
}

/** `ate` é inclusivo: vai até o fim do dia. */
export function historyWhere(f: HistoryFilters) {
  return {
    startsAt: { gte: f.from, lt: addDays(f.to, 1) },
    ...(f.prof ? { professionalId: f.prof } : {}),
    ...(f.patientId ? { patientId: f.patientId } : {}),
    ...(f.status ? { status: f.status } : {}),
  };
}

const esc = (v: string) => (/[",\n;]/.test(v) ? `"${v.replace(/"/g, '""')}"` : v);
/** CSV com separador ";" (abre direto no Excel em português). */
export function toCsv(rows: string[][]) {
  return rows.map((r) => r.map(esc).join(";")).join("\r\n");
}
