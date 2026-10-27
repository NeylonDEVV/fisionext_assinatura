"use server";
import { revalidatePath } from "next/cache";
import { requireTenant } from "@/lib/tenant";
import { METHODS } from "@/lib/payer";
import { STATUS } from "@/lib/therapy";

const refresh = () => ["/dashboard", "/agenda", "/pilates", "/pacientes", "/financeiro", "/historico"].forEach((p) => revalidatePath(p));

export async function createAppointment(fd: FormData) {
  const { db, specialty } = await requireTenant();
  const kind = String(fd.get("kind") ?? ""); // "consultas" | "pilates" (agenda de origem)
  const group = specialty.groupAgenda?.key ?? null;
  if (kind === "pilates" && !group) return; // só fisioterapia tem agenda de grupo
  const therapy = kind === "pilates" ? (group as string) : String(fd.get("therapy"));
  if (!(therapy in specialty.services)) return; // tipo de atendimento precisa ser da especialidade da clínica
  if (kind === "consultas" && therapy === group) return; // a aula de grupo tem agenda própria

  const patientId = String(fd.get("patientId"));
  if (!(await db.patient.findUnique({ where: { id: patientId }, select: { id: true } }))) return; // paciente de outra clínica
  const startsAt = new Date(`${fd.get("date")}T${fd.get("time")}`);
  if (isNaN(startsAt.getTime())) return;
  const price = Math.round(Number(fd.get("price") || 0) * 100);
  let professionalId: string | null = String(fd.get("professionalId") ?? "") || null;
  if (professionalId && !(await db.user.findFirst({ where: { id: professionalId, active: true }, select: { id: true } }))) professionalId = null;

  const a = await db.appointment.create({ data: { patientId, startsAt, therapy, durationMin: Number(fd.get("duration") || 50), professionalId } });
  if (price > 0) await db.payment.create({ data: { patientId, appointmentId: a.id, description: specialty.terms.session, amount: price, dueDate: startsAt } });
  refresh();
}

export async function setAppointmentStatus(fd: FormData) {
  const { db } = await requireTenant();
  const status = String(fd.get("status"));
  if (!(status in STATUS)) return;
  await db.appointment.updateMany({ where: { id: String(fd.get("id")) }, data: { status } });
  refresh();
}

export async function addEvolution(fd: FormData) {
  const { db, user, specialty } = await requireTenant();
  const patientId = String(fd.get("patientId"));
  if (!(await db.patient.findUnique({ where: { id: patientId }, select: { id: true } }))) return;
  const content = String(fd.get("content") ?? "").trim();
  if (!content) return;
  const m = specialty.metric;
  const raw = String(fd.get("metric") ?? "").trim();
  let metric: number | null = raw === "" ? null : Number(raw);
  if (metric !== null && !Number.isFinite(metric)) metric = null;
  if (metric !== null) metric = Math.min(m.max, Math.max(m.min, metric));
  if (metric === null && !m.optional) return;
  await db.evolution.create({ data: { patientId, metric, techniques: String(fd.get("techniques") || "").trim() || null, content, authorId: user.id } });
  revalidatePath(`/pacientes/${patientId}`); refresh();
}

export async function markPaid(fd: FormData) {
  const { db } = await requireTenant();
  const method = String(fd.get("method"));
  if (!(method in METHODS)) return;
  await db.payment.updateMany({ where: { id: String(fd.get("id")) }, data: { status: "PAGO", paidAt: new Date(), method } });
  refresh();
}
