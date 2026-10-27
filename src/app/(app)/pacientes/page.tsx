import Link from "next/link";
import { Plus } from "lucide-react";
import { requireTenant } from "@/lib/tenant";
import { PAYERS, payerCls, payerLabel } from "@/lib/payer";
import { therapyLabel, therapyColor } from "@/lib/therapy";
import { initials } from "@/lib/utils";

export const dynamic = "force-dynamic";

export default async function Pacientes({ searchParams }: { searchParams: { q?: string; tipo?: string } }) {
  const { db, specialty } = await requireTenant();
  const q = searchParams.q?.trim();
  const tipo = searchParams.tipo && searchParams.tipo in PAYERS ? searchParams.tipo : undefined;
  const patients = await db.patient.findMany({
    where: { ...(q ? { name: { contains: q } } : {}), ...(tipo ? { payerType: tipo } : {}) },
    include: { admission: { select: { id: true } } }, orderBy: { name: "asc" },
  });
  const chip = (active: boolean) => `rounded-full px-3.5 py-1.5 text-sm font-semibold transition ${active ? "bg-brand-500 text-white" : "bg-white text-ink-600 ring-1 ring-ink-200 hover:bg-ink-100"}`;
  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-end justify-between gap-3">
        <div><h1 className="text-2xl font-extrabold">Pacientes</h1><p className="text-sm text-ink-500">{patients.length} cadastrados</p></div>
        <div className="flex gap-3">
          <form>{tipo && <input type="hidden" name="tipo" value={tipo} />}<input name="q" defaultValue={q} placeholder="Buscar paciente" className="input !w-52" /></form>
          <Link href="/pacientes/novo" className="btn"><Plus size={16} />Novo paciente</Link>
        </div>
      </div>
      <div className="flex flex-wrap gap-2">
        <Link href="/pacientes" className={chip(!tipo)}>Todos</Link>
        {Object.entries(PAYERS).map(([k, p]) => <Link key={k} href={`/pacientes?tipo=${k}`} className={chip(tipo === k)}>{p.label}</Link>)}
      </div>
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {patients.map((p) => (
          <Link key={p.id} href={`/pacientes/${p.id}`} className="card p-5 transition hover:-translate-y-0.5 hover:ring-brand-200">
            <div className="flex items-center gap-3">
              <span className="grid h-11 w-11 place-items-center rounded-full bg-brand-100 text-sm font-bold text-brand-700">{initials(p.name)}</span>
              <div className="min-w-0"><p className="truncate font-semibold">{p.name}</p><p className="truncate text-xs text-ink-500">{specialty.restrictedRecords ? (p.admission ? "Avaliação registrada" : "Avaliação pendente") : p.complaint ?? "Avaliação pendente"}</p></div>
            </div>
            <div className="mt-4 flex flex-wrap gap-2">
              <span className={`rounded-full px-2.5 py-1 text-xs font-semibold ${payerCls(p.payerType)}`}>{payerLabel(p.payerType)}{p.insurerName ? ` · ${p.insurerName}` : ""}</span>
              {p.therapy && <span className="inline-flex items-center gap-1.5 rounded-full bg-ink-50 px-2.5 py-1 text-xs font-semibold text-ink-600"><i className="h-2 w-2 rounded-full" style={{ background: therapyColor(p.therapy) }} />{therapyLabel(p.therapy)}</span>}
              {!p.admission && <span className="rounded-full bg-red-50 px-2.5 py-1 text-xs font-semibold text-red-700">Sem {specialty.terms.admission.toLowerCase()}</span>}
            </div>
          </Link>
        ))}
        {patients.length === 0 && <p className="text-sm text-ink-400">Nenhum paciente encontrado.</p>}
      </div>
    </div>
  );
}
