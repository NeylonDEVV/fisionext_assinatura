export type AgendaKind = "consultas" | "pilates";

/** Filtro das agendas: Pilates tem agenda própria; "consultas" traz todo o resto. */
export function agendaWhere(kind: AgendaKind, from: Date, to: Date, professionalId?: string) {
  return {
    startsAt: { gte: from, lt: to },
    therapy: kind === "pilates" ? "PILATES" : { not: "PILATES" },
    ...(professionalId ? { professionalId } : {}),
  };
}

/** Agrupa itens que começam no mesmo horário (aulas em turma). */
export function groupBySlot<T extends { startsAt: Date }>(items: T[]) {
  const map = new Map<number, T[]>();
  for (const it of items) {
    const k = it.startsAt.getTime();
    map.set(k, [...(map.get(k) ?? []), it]);
  }
  return [...map.entries()].sort((a, b) => a[0] - b[0]).map(([t, list]) => ({ time: new Date(t), items: list }));
}
