import Link from "next/link";
import { notFound } from "next/navigation";
import { ClipboardList, Pencil } from "lucide-react";
import { Drawer } from "@/components/motion";
import { addEvolution } from "@/actions";
import { requireTenant } from "@/lib/tenant";
import { therapyLabel, STATUS } from "@/lib/therapy";
import { canReadRecord, formatMetric } from "@/lib/specialties";
import { chartPoints } from "@/lib/chart";
import { payerCls, payerLabel } from "@/lib/payer";
import { maskCpf, maskPhone } from "@/lib/cpf";
import { fmtDate, fmtTime, initials } from "@/lib/utils";

export const dynamic = "force-dynamic";

const Info = ({ l, v }: { l: string; v?: string | null }) => (
  <div><dt className="text-xs text-ink-500">{l}</dt><dd className="mt-0.5 text-sm font-semibold">{v || "—"}</dd></div>
);
const RESTRICTED = "Registro restrito ao profissional que o escreveu.";

export default async function Paciente({ params }: { params: { id: string } }) {
  const { db, user, specialty } = await requireTenant();
  const p = await db.patient.findUnique({
    where: { id: params.id },
    include: { admission: { include: { author: { select: { name: true } } } }, evolutions: { orderBy: { date: "asc" }, include: { author: { select: { name: true } } } } },
  });
  if (!p) notFound();
  const [appts, stats] = await Promise.all([
    db.appointment.findMany({ where: { patientId: p.id }, orderBy: { startsAt: "desc" }, take: 8, include: { professional: { select: { name: true } } } }),
    db.appointment.groupBy({ by: ["status"], where: { patientId: p.id }, _count: { _all: true } }),
  ]);
  const count = (s: string) => stats.find((x) => x.status === s)?._count._all ?? 0;
  const m = specialty.metric, t = specialty.terms;
  const adm = p.admission, evs = p.evolutions;
  const withMetric = evs.filter((e) => e.metric !== null) as (typeof evs[number] & { metric: number })[];
  const pts = chartPoints(withMetric.map((e) => e.metric), m.kind === "scale" ? { min: m.min, max: m.max, w: 280, h: 90 } : { w: 280, h: 90 });
  const age = Math.floor((Date.now() - p.birthDate.getTime()) / (365.25 * 864e5));
  const address = [p.street && `${p.street}${p.number ? `, ${p.number}` : ""}`, p.complement, p.district, p.city && `${p.city}${p.state ? `/${p.state}` : ""}`].filter(Boolean).join(" · ");
  const canSeeAdm = !adm || canReadRecord(specialty, user.id, adm.authorId);
  const lastMetric = withMetric.at(-1)?.metric ?? (m.kind === "scale" ? Math.round((m.min + m.max) / 2) : undefined);

  return (
    <div className="space-y-6">
      <Link href="/pacientes" className="text-sm font-semibold text-ink-500 hover:text-brand-600">← Pacientes</Link>

      <div className="card flex flex-wrap items-center gap-5 p-6">
        <span className="grid h-16 w-16 place-items-center rounded-full bg-brand-100 text-lg font-bold text-brand-700">{initials(p.name)}</span>
        <div className="min-w-0 flex-1">
          <h1 className="text-2xl font-extrabold">{p.name}</h1>
          <p className="text-sm text-ink-500">{age} anos{p.therapy ? ` · ${therapyLabel(p.therapy)}` : ""}</p>
          <div className="mt-2 flex flex-wrap gap-2">
            <span className={`rounded-full px-2.5 py-1 text-xs font-semibold ${payerCls(p.payerType)}`}>{payerLabel(p.payerType)}{p.insurerName ? ` · ${p.insurerName}` : ""}</span>
          </div>
        </div>
        <div className="flex flex-wrap gap-2">
          <Link href={`/pacientes/${p.id}/editar`} className="btn-ghost"><Pencil size={15} />Editar</Link>
          <Drawer label={t.newEvolution} title={t.newEvolution}>
            <form action={addEvolution} className="space-y-4">
              <input type="hidden" name="patientId" value={p.id} />
              <div><label className="label">{m.label}{m.unit === "kg" ? " (kg)" : ` (${m.min} a ${m.max})`}{m.optional && " (opcional)"}</label>
                {m.kind === "scale"
                  ? <input name="metric" type="range" min={m.min} max={m.max} step={m.step} defaultValue={lastMetric} className="w-full accent-brand-500" />
                  : <input name="metric" type="number" min={m.min} max={m.max} step={m.step} required={!m.optional} defaultValue={lastMetric} className="input" />}</div>
              <div><label className="label">{t.techniques}</label><input name="techniques" className="input" /></div>
              <div><label className="label">{t.evolutionContent}</label><textarea name="content" required rows={5} className="input" /></div>
              <button className="btn w-full">Salvar</button>
            </form>
          </Drawer>
        </div>
      </div>

      <div className="card p-6">
        <h2 className="mb-4 font-bold">Dados cadastrais</h2>
        <dl className="grid gap-x-6 gap-y-4 sm:grid-cols-2 lg:grid-cols-4">
          <Info l="CPF" v={maskCpf(p.cpf)} />
          <Info l="Nascimento" v={p.birthDate.toLocaleDateString("pt-BR")} />
          <Info l="Telefone" v={maskPhone(p.phone)} />
          <Info l="E-mail" v={p.email} />
          <Info l="Carteirinha" v={p.insuranceCard} />
          <div className="sm:col-span-2"><Info l="Endereço" v={address} /></div>
          <Info l="Emergência" v={p.emergencyName ? `${p.emergencyName} ${p.emergencyPhone ? `· ${maskPhone(p.emergencyPhone)}` : ""}` : null} />
        </dl>
      </div>

      {adm ? (
        <div className="card p-6">
          <div className="mb-4 flex items-center justify-between">
            <h2 className="font-bold">{t.admission} <span className="font-normal text-ink-400">· {fmtDate(adm.date)}{adm.author ? ` · ${adm.author.name}` : ""}</span></h2>
            {canSeeAdm && <Link href={`/pacientes/${p.id}/admissao`} className="text-sm font-semibold text-brand-600">Ver / editar</Link>}
          </div>
          {canSeeAdm ? (
            <dl className="grid gap-4 sm:grid-cols-2">
              <Info l="Queixa ou demanda" v={adm.complaint} />
              <Info l="Avaliação" v={adm.assessment} />
              <Info l="Objetivos" v={adm.goals} />
              <Info l="Plano" v={[adm.plannedSessions && `${adm.plannedSessions} sessões`, adm.frequency].filter(Boolean).join(" · ")} />
            </dl>
          ) : <p className="text-sm text-ink-500">{RESTRICTED}</p>}
        </div>
      ) : (
        <Link href={`/pacientes/${p.id}/admissao`} className="flex items-center gap-4 rounded-2xl bg-brand-50 p-5 ring-1 ring-brand-200 transition hover:bg-brand-100">
          <span className="grid h-11 w-11 place-items-center rounded-xl bg-brand-500 text-white"><ClipboardList size={20} /></span>
          <div><p className="font-bold text-brand-700">{t.admission} pendente</p><p className="text-sm text-ink-600">Faça a primeira avaliação para registrar o plano de acompanhamento.</p></div>
        </Link>
      )}

      <div className="card p-6">
        <div className="mb-4 flex flex-wrap items-center justify-between gap-3">
          <h2 className="font-bold">Histórico de consultas</h2>
          <Link href={`/historico?paciente=${p.id}&prof=todos`} className="text-sm font-semibold text-brand-600">Ver histórico completo</Link>
        </div>
        <div className="mb-4 flex flex-wrap gap-2 text-xs font-semibold">
          <span className="rounded-full bg-emerald-100 px-3 py-1 text-emerald-700">{count("REALIZADA")} realizadas</span>
          <span className="rounded-full bg-red-100 px-3 py-1 text-red-700">{count("FALTOU")} faltas</span>
          <span className="rounded-full bg-ink-100 px-3 py-1 text-ink-600">{count("CANCELADA")} canceladas</span>
          <span className="rounded-full bg-brand-100 px-3 py-1 text-brand-700">{count("AGENDADA") + count("CONFIRMADA")} agendadas</span>
        </div>
        {appts.length === 0 ? <p className="text-sm text-ink-400">Nenhum atendimento agendado ainda.</p> : (
          <ul className="divide-y divide-ink-100">
            {appts.map((a) => (
              <li key={a.id} className="flex flex-wrap items-center gap-3 py-2.5 text-sm">
                <span className="w-28 font-semibold">{fmtDate(a.startsAt)} · {fmtTime(a.startsAt)}</span>
                <span className="flex-1 text-ink-600">{therapyLabel(a.therapy)}{a.professional ? ` · ${a.professional.name.split(" ")[0]}` : ""}</span>
                <span className={`rounded-full px-2.5 py-1 text-xs font-semibold ${STATUS[a.status].cls}`}>{STATUS[a.status].label}</span>
              </li>
            ))}
          </ul>
        )}
      </div>

      <div className="grid gap-6 lg:grid-cols-3">
        <div className="card p-6">
          <h2 className="font-bold">{m.chartTitle}</h2>
          {pts.length < 2 ? <p className="mt-6 text-sm text-ink-400">Registre ao menos 2 medidas para ver o gráfico.</p> : (
            <>
              <svg viewBox="0 0 300 110" className="mt-4 w-full">
                <polyline points={pts.map((q) => `${q.x},${q.y}`).join(" ")} fill="none" stroke="#F26B1D" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round" pathLength={1} strokeDasharray={1} style={{ animation: "draw 1.2s ease forwards" }} />
                {pts.map((q, i) => <circle key={i} cx={q.x} cy={q.y} r="4" fill="#fff" stroke="#F26B1D" strokeWidth="2" />)}
              </svg>
              <style>{`@keyframes draw{from{stroke-dashoffset:1}to{stroke-dashoffset:0}}`}</style>
              <p className="mt-2 text-sm text-ink-600">De <b>{formatMetric(withMetric[0].metric, m)}</b> para <b>{formatMetric(withMetric.at(-1)!.metric, m)}</b>.</p>
            </>
          )}
        </div>
        <div className="card p-6 lg:col-span-2">
          <h2 className="mb-4 font-bold">{t.evolution}</h2>
          {evs.length === 0 && <p className="text-sm text-ink-400">Nenhum registro ainda.</p>}
          <ol className="space-y-5 border-l-2 border-ink-100 pl-5">
            {[...evs].reverse().map((e) => {
              const can = canReadRecord(specialty, user.id, e.authorId);
              return (
                <li key={e.id} className="relative">
                  <span className="absolute -left-[27px] top-1 h-3 w-3 rounded-full bg-brand-500 ring-4 ring-white" />
                  <div className="flex justify-between text-sm"><span className="font-semibold">{fmtDate(e.date)}{e.author && <span className="font-normal text-ink-400"> · {e.author.name}</span>}</span>{can && e.metric !== null && <span className="font-semibold text-brand-600">{m.label} {formatMetric(e.metric, m)}</span>}</div>
                  <p className="mt-1 text-sm text-ink-700">{can ? e.content : RESTRICTED}</p>
                  {can && e.techniques && <p className="mt-1 text-xs text-ink-500">{t.techniques}: {e.techniques}</p>}
                </li>
              );
            })}
          </ol>
        </div>
      </div>
    </div>
  );
}
