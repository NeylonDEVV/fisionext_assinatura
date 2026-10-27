import { prisma } from "@/lib/prisma";

export const fd = (o: Record<string, string>) => {
  const f = new FormData();
  for (const [k, v] of Object.entries(o)) f.set(k, v);
  return f;
};

export async function clearDb() {
  for (const m of [prisma.billingPayment, prisma.billingEvent, prisma.payment, prisma.evolution, prisma.admission, prisma.appointment, prisma.patient, prisma.user, prisma.clinic]) {
    await (m as unknown as { deleteMany: () => Promise<unknown> }).deleteMany();
  }
}

let n = 0;
export const makeClinic = (o: Record<string, unknown> = {}) =>
  prisma.clinic.create({ data: { name: `Clínica ${++n}`, subscriptionStatus: "ACTIVE", ...o } });
export const makeUser = (clinicId: string, o: Record<string, unknown> = {}) =>
  prisma.user.create({ data: { clinicId, name: `Usuário ${++n}`, email: `u${n}-${Math.random().toString(36).slice(2, 7)}@teste.com`, passwordHash: "x", ...o } });
export const newPatient = (clinicId: string, cpf = "52998224725", over: Record<string, unknown> = {}) =>
  prisma.patient.create({ data: { clinicId, name: "Paciente Teste", cpf, birthDate: new Date("1990-01-01T12:00:00"), phone: "61999990000", therapy: "ORTOPEDICA", ...over } });

export const validPatient = {
  name: "Maria da Silva", cpf: "529.982.247-25", birthDate: "1985-03-20", phone: "(61) 99999-1111", payerType: "PARTICULAR", therapy: "ORTOPEDICA",
};
export const validAdmission = { complaint: "Dor lombar", physioDiagnosis: "Lombalgia", goals: "Reduzir a dor", consent: "on", painScale: "5" };
