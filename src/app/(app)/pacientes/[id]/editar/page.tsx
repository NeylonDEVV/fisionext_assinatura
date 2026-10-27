import Link from "next/link";
import { notFound } from "next/navigation";
import { PatientForm } from "@/components/patient-form";
import { updatePatient } from "@/actions-patient";
import { requireTenant } from "@/lib/tenant";

export const dynamic = "force-dynamic";

export default async function Editar({ params }: { params: { id: string } }) {
  const { db, specialty } = await requireTenant();
  const p = await db.patient.findUnique({ where: { id: params.id } });
  if (!p) notFound();
  const initial = { ...Object.fromEntries(Object.entries(p).map(([k, v]) => [k, v instanceof Date ? "" : (v as string | null)])), birthDate: p.birthDate.toISOString().slice(0, 10) } as Record<string, string | null>;
  return (
    <div className="mx-auto max-w-3xl space-y-6">
      <Link href={`/pacientes/${p.id}`} className="text-sm font-semibold text-ink-500 hover:text-brand-600">← {p.name}</Link>
      <h1 className="text-2xl font-extrabold">Editar dados</h1>
      <PatientForm action={updatePatient} initial={initial} submitLabel="Salvar alterações" services={specialty.services} serviceLabel="Tipo de atendimento principal" />
    </div>
  );
}
