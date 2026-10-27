"use server";
import { redirect } from "next/navigation";
import { revalidatePath } from "next/cache";
import { requireTenant } from "@/lib/tenant";
import { readPatient } from "@/lib/patient-input";

type State = { error?: string } | undefined;

export async function createPatient(_prev: State, fd: FormData): Promise<State> {
  const { db, specialty } = await requireTenant();
  const { data, error } = readPatient(fd, Object.keys(specialty.services), specialty.defaultService);
  if (error) return { error };
  if (await db.patient.findFirst({ where: { cpf: data.cpf } })) return { error: "Já existe um paciente com esse CPF." };
  const p = await db.patient.create({ data });
  revalidatePath("/pacientes");
  redirect(`/pacientes/${p.id}/admissao`);
}

export async function updatePatient(_prev: State, fd: FormData): Promise<State> {
  const { db, specialty } = await requireTenant();
  const id = String(fd.get("id") ?? "").trim();
  if (!(await db.patient.findUnique({ where: { id }, select: { id: true } }))) return { error: "Paciente não encontrado." };
  const { data, error } = readPatient(fd, Object.keys(specialty.services), specialty.defaultService);
  if (error) return { error };
  if (await db.patient.findFirst({ where: { cpf: data.cpf, NOT: { id } } })) return { error: "Já existe outro paciente com esse CPF." };
  await db.patient.update({ where: { id }, data });
  revalidatePath("/pacientes"); revalidatePath(`/pacientes/${id}`);
  redirect(`/pacientes/${id}`);
}

/** Avaliação inicial: o formulário (campos obrigatórios, métrica, termos) vem da especialidade da clínica. */
export async function saveAdmission(_prev: State, fd: FormData): Promise<State> {
  const { db, user, specialty } = await requireTenant();
  const patientId = String(fd.get("patientId") ?? "").trim();
  if (!(await db.patient.findUnique({ where: { id: patientId }, select: { id: true } }))) return { error: "Paciente não encontrado." };

  const answers: Record<string, string> = {};
  for (const step of specialty.steps) for (const f of step.fields) answers[f.key] = String(fd.get(f.key) ?? "").trim();
  const labels = specialty.steps.flatMap((s) => s.fields).filter((f) => specialty.requiredKeys.includes(f.key)).map((f) => f.label.toLowerCase());
  if (specialty.requiredKeys.some((k) => !answers[k])) return { error: `Preencha ${labels.join(", ")}.` };
  if (fd.get("consent") !== "on") return { error: "Registre o consentimento do paciente para concluir." };

  const k = specialty.keys, m = specialty.metric;
  const raw = answers[k.metric];
  let metric: number | null = raw === "" ? null : Number(raw);
  metric = metric !== null && Number.isFinite(metric) ? Math.min(m.max, Math.max(m.min, metric)) : null;
  const sessions = k.plannedSessions ? Number(answers[k.plannedSessions]) : 0;
  const therapy = answers[k.therapy] in specialty.services ? answers[k.therapy] : specialty.defaultService;
  const data = {
    answers: JSON.stringify(answers), complaint: answers[k.complaint], assessment: answers[k.assessment], goals: answers[k.goals],
    therapy, plannedSessions: sessions > 0 ? Math.round(sessions) : null, frequency: k.frequency ? answers[k.frequency] || null : null,
    metric, consent: true,
  };
  const existing = await db.admission.findUnique({ where: { patientId } });
  await db.admission.upsert({ where: { patientId }, update: data, create: { patientId, ...data, authorId: user.id } });
  await db.patient.update({ where: { id: patientId }, data: { complaint: data.complaint, diagnosis: data.assessment, therapy } });
  if (!existing) {
    await db.evolution.create({ data: { patientId, metric, techniques: answers.conduct || null, content: `${specialty.terms.admission} registrada. Queixa: ${data.complaint}`, authorId: user.id } });
  }
  revalidatePath("/pacientes"); revalidatePath(`/pacientes/${patientId}`);
  redirect(`/pacientes/${patientId}`);
}
