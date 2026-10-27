import { requireTenant } from "@/lib/tenant";
import { historyWhere, parseHistoryParams, toCsv } from "@/lib/history";
import { STATUS, therapyLabel } from "@/lib/therapy";

export const dynamic = "force-dynamic";

export async function GET(req: Request) {
  const { db, user, specialty } = await requireTenant();
  const sp = Object.fromEntries(new URL(req.url).searchParams) as Record<string, string>;
  const f = parseHistoryParams(sp, { meId: user.id, canSeeOthers: user.role === "ADMIN" || !specialty.restrictedRecords });
  const rows = await db.appointment.findMany({
    where: historyWhere(f), orderBy: { startsAt: "desc" }, take: 5000,
    include: { patient: { select: { name: true } }, professional: { select: { name: true } } },
  });
  const csv = toCsv([
    ["Data", "Hora", "Paciente", "Atendimento", "Profissional", "Situação"],
    ...rows.map((a) => [
      a.startsAt.toLocaleDateString("pt-BR"), a.startsAt.toLocaleTimeString("pt-BR", { hour: "2-digit", minute: "2-digit" }),
      a.patient.name, therapyLabel(a.therapy), a.professional?.name ?? "", STATUS[a.status]?.label ?? a.status,
    ]),
  ]);
  return new Response("\uFEFF" + csv, {
    headers: { "Content-Type": "text/csv; charset=utf-8", "Content-Disposition": 'attachment; filename="historico-de-atendimentos.csv"' },
  });
}
