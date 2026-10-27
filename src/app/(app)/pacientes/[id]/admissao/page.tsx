import Link from "next/link";
import { notFound } from "next/navigation";
import { AdmissionWizard } from "@/components/admission-wizard";
import { payerCls, payerLabel } from "@/lib/payer";
import { maskCpf } from "@/lib/cpf";
import { requireTenant } from "@/lib/tenant";
import { canReadRecord } from "@/lib/specialties";

export const dynamic = "force-dynamic";

export default async function Admissao({ params }: { params: { id: string } }) {
  const { db, user, specialty } = await requireTenant();
  const p = await db.patient.findUnique({ where: { id: params.id }, include: { admission: true } });
  if (!p) notFound();
  const locked = !!p.admission && !canReadRecord(specialty, user.id, p.admission.authorId);
  let initial: Record<string, string> = { complaint: p.complaint ?? "", therapy: p.therapy };
  if (p.admission) { try { initial = JSON.parse(p.admission.answers); } catch { /* resposta antiga ou inválida */ } }
  return (
    <div className="mx-auto max-w-3xl space-y-6">
      <Link href={`/pacientes/${p.id}`} className="text-sm font-semibold text-ink-500 hover:text-brand-600">← {p.name}</Link>
      <div>
        <h1 className="text-2xl font-extrabold">{specialty.terms.admission}</h1>
        <p className="mt-1 flex flex-wrap items-center gap-2 text-sm text-ink-500">{p.name} · CPF {maskCpf(p.cpf)}
          <span className={`rounded-full px-2.5 py-0.5 text-xs font-semibold ${payerCls(p.payerType)}`}>{payerLabel(p.payerType)}</span></p>
      </div>
      {locked
        ? <p className="rounded-xl bg-ink-50 px-4 py-4 text-sm text-ink-600">Esta avaliação é restrita ao profissional que a registrou.</p>
        : <AdmissionWizard patientId={p.id} steps={specialty.steps} services={specialty.services} initial={initial} consentText={specialty.consentText}
            consentChecked={!!p.admission?.consent} submitLabel={`Concluir ${specialty.terms.admission.toLowerCase()}`} bmi={specialty.bmi} />}
    </div>
  );
}
