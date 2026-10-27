import Link from "next/link";
import { Download } from "lucide-react";
import { requireTenant } from "@/lib/tenant";
import { PAGE_SIZE, historyWhere, parseHistoryParams } from "@/lib/history";
import { STATUS, therapyColor, therapyLabel } from "@/lib/therapy";
import { fmtTime } from "@/lib/utils";

export const dynamic = "force-dynamic";
type SP = Record<string, string | undefined>;
const day = (d: Date) => `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`;

export default async function Historico({ searchParams }: { searchParams: SP }) {
  const { db, user, specialty } = await requireTenant();
  const canSeeOthers = user.role === "ADMIN" || !specialty.restrictedRecords;
  const f = parseHistoryParams(searchParams, { meId: user.id, canSeeOthers });
  const where = historyWhere(f);
  const [rows, total, byStatus, byPatient, pros, patients] = await Promise.all([
    db.appointment.findMany({ where, include: { patient: { select: { id: true, name: true } }, professional: { select: { name: true } } }, orderBy: { startsAt: "desc" }, take: PAGE_SIZE, skip: (f.page - 1) * PAGE_SIZE }),
    db.appointment.count({ where }),
    db.appointment.groupBy({ by: ["status"], where, _count: { _all: true } }),
    db.appointment.groupBy({ by: ["patientId"], where }),
    canSeeOthers ? db.user.findMany({ orderBy: { name: "asc" }, select: { id: true, name: true } }) : Promise.resolve([]),
    db.patient.findMany({ orderBy: { name: "asc" }, select: { id: true, name: true } }),
  ]);
  const n = (s: string) => byStatus.find((x) => x.status === s)?._count._all ?? 0;
  const pages = Math.max(1, Math.ceil(total / PAGE_SIZE));
  const qs = (over: SP) => {
    const p = new URLSearchParams();
    const cur: SP = { de: day(f.from), ate: day(f.to), prof: f.prof ?? "todos", paciente: f.patientId, status: f.status, ...over };
    for (const [k, v] of Object.entries(cur)) if (v) p.set(k, v);
    return p.toString();
  };
  const stats = [
    { l: "Realizados", v: n("REALIZADA"), cls: "text-emerald-700" }, { l: "Faltas", v: n("FALTOU"), cls: "text-red-700" },
    { l: "Cancelados", v: n("CANCELADA"), cls: "text-ink-600" }, { l: "Pacientes atendidos", v: byPatient.length, cls: "text-brand-700" },
  ];

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-end justify-between gap-3">
        <div><h1 className="text-2xl font-extrabold">Histórico de atendimentos</h1><p className="text-sm text-ink-500">{total} no período{f.prof === user.id ? ", os seus" : ""}</p></div>
        <Link href={`/historico/export?${qs({})}`} className="btn-ghost"><Download size={16} />Exportar CSV</Link>
      </div>

      <form className="card grid gap-3 p-5 sm:grid-cols-2 lg:grid-cols-5">
        <div><label className="label" htmlFor="de">De</label><input id="de" name="de" type="date" defaultValue={day(f.from)} className="input" /></div>
        <div><label className="label" htmlFor="ate">Até</label><input id="ate" name="ate" type="date" defaultValue={day(f.to)} className="input" /></div>
        {canSeeOthers && (
          <div><label className="label" htmlFor="prof">Profissional</label>
            <select id="prof" name="prof" defaultValue={f.prof ?? "todos"} className="input"><option value="todos">Todos</option>{pros.map((p) => <option key={p.id} value={p.id}>{p.name}</option>)}</select></div>
        )}
        <div><label className="label" htmlFor="paciente">Paciente</label>
          <select id="paciente" name="paciente" defaultValue={f.patientId ?? ""} className="input"><option value="">Todos</option>{patients.map((p) => <option key={p.id} value={p.id}>{p.name}</option>)}</select></div>
        <div><label className="label" htmlFor="status">Situação</label>
          <select id="status" name="status" defaultValue={f.status ?? ""} className="input"><option value="">Todas</option>{Object.entries(STATUS).map(([k, v]) => <option key={k} value={k}>{v.label}</option>)}</select></div>
        <div className="flex items-end sm:col-span-2 lg:col-span-5"><button className="btn">Filtrar</button></div>
      </form>

      <div className="grid grid-cols-2 gap-4 lg:grid-cols-4">
        {stats.map((s) => <div key={s.l} className="card p-5"><p className="text-xs text-ink-500">{s.l}</p><p className={`mt-2 text-3xl font-extrabold ${s.cls}`}>{s.v}</p></div>)}
      </div>

      <div className="card overflow-x-auto">
        <table className="w-full text-left text-sm">
          <thead className="border-b border-ink-100 text-xs text-ink-500"><tr><th className="p-4 font-medium">Data</th><th className="p-4 font-medium">Paciente</th><th className="p-4 font-medium">Atendimento</th><th className="p-4 font-medium">Profissional</th><th className="p-4 font-medium">Situação</th></tr></thead>
          <tbody className="divide-y divide-ink-100">
            {rows.map((a) => (
              <tr key={a.id} className="transition hover:bg-ink-50">
                <td className="p-4 font-semibold">{a.startsAt.toLocaleDateString("pt-BR")} <span className="font-normal text-ink-500">{fmtTime(a.startsAt)}</span></td>
                <td className="p-4"><Link href={`/pacientes/${a.patient.id}`} className="font-semibold hover:text-brand-600">{a.patient.name}</Link></td>
                <td className="p-4"><span className="inline-flex items-center gap-2"><i className="h-2 w-2 rounded-full" style={{ background: therapyColor(a.therapy) }} />{therapyLabel(a.therapy)}</span></td>
                <td className="p-4 text-ink-600">{a.professional?.name ?? "—"}</td>
                <td className="p-4"><span className={`rounded-full px-2.5 py-1 text-xs font-semibold ${STATUS[a.status].cls}`}>{STATUS[a.status].label}</span></td>
              </tr>
            ))}
            {rows.length === 0 && <tr><td colSpan={5} className="p-8 text-center text-ink-400">Nenhum atendimento neste período.</td></tr>}
          </tbody>
        </table>
      </div>

      {pages > 1 && (
        <div className="flex items-center justify-between text-sm">
          {f.page > 1 ? <Link href={`/historico?${qs({ p: String(f.page - 1) })}`} className="btn-ghost">Anterior</Link> : <span />}
          <span className="text-ink-500">Página {f.page} de {pages}</span>
          {f.page < pages ? <Link href={`/historico?${qs({ p: String(f.page + 1) })}`} className="btn-ghost">Próxima</Link> : <span />}
        </div>
      )}
    </div>
  );
}
