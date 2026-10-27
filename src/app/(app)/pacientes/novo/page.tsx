import Link from "next/link";
import { PatientForm } from "@/components/patient-form";
import { createPatient } from "@/actions-patient";
import { requireTenant } from "@/lib/tenant";

export const dynamic = "force-dynamic";

export default async function NovoPaciente() {
  const { specialty } = await requireTenant();
  return (
    <div className="mx-auto max-w-3xl space-y-6">
      <Link href="/pacientes" className="text-sm font-semibold text-ink-500 hover:text-brand-600">← Pacientes</Link>
      <div><h1 className="text-2xl font-extrabold">Novo paciente</h1><p className="text-sm text-ink-500">Depois do cadastro você segue direto para a {specialty.terms.admission.toLowerCase()}.</p></div>
      <PatientForm action={createPatient} submitLabel={`Cadastrar e iniciar ${specialty.terms.admission.toLowerCase()}`} services={specialty.services} serviceLabel="Tipo de atendimento principal" />
    </div>
  );
}
