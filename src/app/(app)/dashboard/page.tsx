import Link from "next/link";
import { requireTenant } from "@/lib/tenant";
import { Stagger, Item, Bar } from "@/components/motion";
import { brl, fmtTime, fmtDate, startOfDay, addDays } from "@/lib/utils";
import { therapyColor, therapyLabel, STATUS } from "@/lib/therapy";
import { canReadRecord } from "@/lib/specialties";

export const dynamic = "force-dynamic";

export default async function Dashboard() {
  const { db, user, specialty } = await requireTenant();
  const sod = startOfDay(), eod = addDays(sod, 1);
  const som = new Date(sod.getFullYear(), sod.getMonth(), 1);
  const [today, patients, paid, pending, evos, byTherapy] = await Promise.all([
    db.appointment.findMany({ where: { startsAt: { gte: sod, lt: eod } }, include: { patient: true, professional: { select: { name: true } } }, orderBy: { startsAt: "asc" } }),
    db.patient.count({ where: { active: true } }),
    db.payment.aggregate({ _sum: { amount: true }, where: { status: "PAGO", paidAt: { gte: som } } }),
    db.payment.aggregate({ _sum: { amount: true }, where: { status: "PENDENTE", dueDate: { lt: eod } } }),
    db.evolution.findMany({ take: 4, orderBy: { date: "desc" }, include: { patient: true } }),
    db.appointment.groupBy({ by: ["therapy"], _count: { _all: true }, where: { startsAt: { gte: som }, status: { not: "CANCELADA" } } }),
  ]);
  const total = byTherapy.reduce((s, t) => s + t._count._all, 0) || 1;
  const t = specialty.terms;
  const kpis = [
    { label: t.sessionsToday, value: String(today.length) },
    { label: "Pacientes ativos", value: String(patients) },
    { label: "Recebido no mês", value: brl(paid._sum.amount ?? 0) },
    { label: "A receber", value: brl(pending._sum.amount ?? 0) },
  ];

  return (
    <Stagger className="space-y-6">
      <Item><h1 className="text-2xl font-extrabold">Olá, {user.name.split(" ")[0]}</h1><p className="text-sm text-ink-500">Veja como está o dia do consultório.</p></Item>

      <Item className="grid grid-cols-2 gap-4 lg:grid-cols-4">
        {kpis.map((k, i) => (
          <div key={k.label} className={`rounded-2xl p-5 ${i === 2 ? "bg-brand-500 text-white" : "card"}`}>
            <p className={`text-xs ${i === 2 ? "text-brand-100" : "text-ink-500"}`}>{k.label}</p>
            <p className="mt-2 text-2xl font-extrabold">{k.value}</p>
          </div>
        ))}
      </Item>

      <div className="grid gap-6 lg:grid-cols-5">
        <Item className="card p-6 lg:col-span-3">
          <div className="mb-4 flex items-center justify-between"><h2 className="font-bold">Agenda de hoje</h2><Link href="/agenda" className="text-sm font-semibold text-brand-600">Ver agenda</Link></div>
          {today.length === 0 && <p className="py-8 text-center text-sm text-ink-400">Nenhum atendimento hoje. Agende um na aba Agenda.</p>}
          <ul className="divide-y divide-ink-100">
            {today.map((a) => (
              <li key={a.id} className="flex items-center gap-4 py-3.5">
                <span className="w-12 text-sm font-bold text-ink-700">{fmtTime(a.startsAt)}</span>
                <span className="h-9 w-1 rounded-full" style={{ background: therapyColor(a.therapy) }} />
                <div className="flex-1"><p className="text-sm font-semibold">{a.patient.name}</p><p className="text-xs text-ink-500">{therapyLabel(a.therapy)} · {a.durationMin} min{a.professional ? ` · ${a.professional.name.split(" ")[0]}` : ""}</p></div>
                <span className={`rounded-full px-2.5 py-1 text-xs font-semibold ${STATUS[a.status].cls}`}>{STATUS[a.status].label}</span>
              </li>
            ))}
          </ul>
        </Item>

        <Item className="card p-6 lg:col-span-2">
          <h2 className="mb-4 font-bold">{t.serviceTypes}</h2>
          <div className="space-y-4">
            {byTherapy.length === 0 && <p className="text-sm text-ink-400">Sem atendimentos neste mês.</p>}
            {[...byTherapy].sort((a, b) => b._count._all - a._count._all).map((x) => (
              <div key={x.therapy}>
                <div className="mb-1.5 flex justify-between text-sm"><span className="font-medium">{therapyLabel(x.therapy)}</span><span className="text-ink-500">{x._count._all}</span></div>
                <Bar pct={(x._count._all / total) * 100} color={therapyColor(x.therapy)} />
              </div>
            ))}
          </div>
        </Item>
      </div>

      <Item className="card p-6">
        <h2 className="mb-4 font-bold">Últimos registros</h2>
        <div className="grid gap-4 md:grid-cols-2">
          {evos.map((e) => (
            <Link key={e.id} href={`/pacientes/${e.patientId}`} className="rounded-xl bg-ink-50 p-4 transition hover:bg-brand-50">
              <div className="flex justify-between text-sm"><span className="font-semibold">{e.patient.name}</span><span className="text-ink-400">{fmtDate(e.date)}</span></div>
              <p className="mt-1 line-clamp-2 text-sm text-ink-600">{canReadRecord(specialty, user.id, e.authorId) ? e.content : "Registro restrito ao profissional que o escreveu."}</p>
            </Link>
          ))}
          {evos.length === 0 && <p className="text-sm text-ink-400">Nenhum registro ainda.</p>}
        </div>
      </Item>
    </Stagger>
  );
}
