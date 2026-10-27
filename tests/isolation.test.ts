import { beforeEach, describe, expect, it, vi } from "vitest";
import { prisma } from "@/lib/prisma";
import { forClinic } from "@/lib/scope";
import { createAppointment, addEvolution, markPaid, setAppointmentStatus } from "@/actions";
import { saveAdmission, updatePatient } from "@/actions-patient";
import { resetUserPassword, setUserActive } from "@/actions-team";
import { clearDb, fd, makeClinic, makeUser, newPatient, validAdmission } from "./helpers";
import { state } from "./tenant-mock";

vi.mock("next/cache", async () => (await import("./tenant-mock")).cacheMock());
vi.mock("next/navigation", async () => (await import("./tenant-mock")).navigationMock());
vi.mock("@/lib/tenant", async () => (await import("./tenant-mock")).tenantMock());

// Duas clínicas, cada uma com dados. Tudo que A faz nunca pode enxergar ou alterar o que é de B.
let A: Awaited<ReturnType<typeof makeClinic>>, B: Awaited<ReturnType<typeof makeClinic>>;
let adminA: Awaited<ReturnType<typeof makeUser>>, adminB: Awaited<ReturnType<typeof makeUser>>;
let patA: Awaited<ReturnType<typeof newPatient>>, patB: Awaited<ReturnType<typeof newPatient>>;

beforeEach(async () => {
  await clearDb();
  [A, B] = [await makeClinic(), await makeClinic()];
  [adminA, adminB] = [await makeUser(A.id, { role: "ADMIN" }), await makeUser(B.id, { role: "ADMIN" })];
  [patA, patB] = [await newPatient(A.id, "52998224725"), await newPatient(B.id, "11144477735")];
  state.userId = adminA.id;
});

describe("cliente filtrado por clínica (forClinic)", () => {
  it("leituras só trazem dados da própria clínica", async () => {
    const db = forClinic(A.id);
    expect((await db.patient.findMany()).map((p) => p.id)).toEqual([patA.id]);
    expect(await db.patient.findUnique({ where: { id: patB.id } })).toBeNull();
    expect(await db.patient.findFirst({ where: { cpf: "11144477735" } })).toBeNull();
    expect(await db.patient.count()).toBe(1);
    expect(await db.user.count()).toBe(1);
  });
  it("alterar ou apagar dado de outra clínica não tem efeito", async () => {
    const db = forClinic(A.id);
    expect((await db.patient.updateMany({ where: { id: patB.id }, data: { name: "Invadido" } })).count).toBe(0);
    expect((await db.patient.deleteMany({ where: { id: patB.id } })).count).toBe(0);
    await expect(db.patient.update({ where: { id: patB.id }, data: { name: "Invadido" } })).rejects.toThrow();
    expect((await prisma.patient.findUniqueOrThrow({ where: { id: patB.id } })).name).toBe("Paciente Teste");
  });
  it("criação grava sempre a clínica de quem cria, mesmo que tentem forçar outra", async () => {
    const db = forClinic(A.id);
    const p = await db.patient.create({ data: { clinicId: B.id, name: "Forçado", cpf: "39053344705", birthDate: new Date(), phone: "61999990000" } as never });
    expect(p.clinicId).toBe(A.id);
    const u = await db.patient.upsert({ where: { id: "nao-existe" }, update: {}, create: { clinicId: B.id, name: "Upsert", cpf: "11111111111", birthDate: new Date(), phone: "61999990000" } as never });
    expect(u.clinicId).toBe(A.id);
  });
  it("agregações e agrupamentos também são filtrados", async () => {
    await prisma.payment.createMany({ data: [
      { clinicId: A.id, patientId: patA.id, description: "x", amount: 100, dueDate: new Date() },
      { clinicId: B.id, patientId: patB.id, description: "x", amount: 999, dueDate: new Date() },
    ] });
    const db = forClinic(A.id);
    expect((await db.payment.aggregate({ _sum: { amount: true } }))._sum.amount).toBe(100);
    expect(await db.payment.groupBy({ by: ["status"], _count: { _all: true } })).toHaveLength(1);
  });
  it("o mesmo CPF pode existir em clínicas diferentes, mas não duas vezes na mesma", async () => {
    await expect(newPatient(B.id, "52998224725")).resolves.toBeTruthy();
    await expect(newPatient(A.id, "52998224725")).rejects.toThrow();
  });
});

describe("ações não alcançam dados de outra clínica", () => {
  const base = { date: "2026-11-10", time: "09:00", duration: "50", kind: "consultas", therapy: "ORTOPEDICA" };

  it("agendar com paciente de outra clínica é recusado", async () => {
    await createAppointment(fd({ ...base, patientId: patB.id }));
    expect(await prisma.appointment.count()).toBe(0);
    await createAppointment(fd({ ...base, patientId: patA.id }));
    expect(await prisma.appointment.count()).toBe(1);
  });
  it("profissional de outra clínica não pode ser atribuído à sessão", async () => {
    const proB = await makeUser(B.id);
    await createAppointment(fd({ ...base, patientId: patA.id, professionalId: proB.id }));
    expect((await prisma.appointment.findFirstOrThrow()).professionalId).toBeNull();
  });
  it("mudar status de sessão de outra clínica não faz nada", async () => {
    const ap = await prisma.appointment.create({ data: { clinicId: B.id, patientId: patB.id, therapy: "ORTOPEDICA", startsAt: new Date() } });
    await setAppointmentStatus(fd({ id: ap.id, status: "FALTOU" }));
    expect((await prisma.appointment.findUniqueOrThrow({ where: { id: ap.id } })).status).toBe("AGENDADA");
  });
  it("evolução e admissão em paciente de outra clínica são recusadas", async () => {
    await addEvolution(fd({ patientId: patB.id, metric: "4", content: "invasão" }));
    expect(await prisma.evolution.count()).toBe(0);
    expect((await saveAdmission(undefined, fd({ patientId: patB.id, ...validAdmission })))?.error).toMatch(/não encontrado/i);
    expect(await prisma.admission.count()).toBe(0);
  });
  it("não edita paciente de outra clínica", async () => {
    const r = await updatePatient(undefined, fd({ id: patB.id, name: "Nome Novo", cpf: "111.444.777-35", birthDate: "1990-01-01", phone: "(61) 99999-0000", payerType: "PARTICULAR" }));
    expect(r?.error).toMatch(/não encontrado/i);
    expect((await prisma.patient.findUniqueOrThrow({ where: { id: patB.id } })).name).toBe("Paciente Teste");
  });
  it("não dá baixa em pagamento de outra clínica", async () => {
    const pay = await prisma.payment.create({ data: { clinicId: B.id, patientId: patB.id, description: "x", amount: 100, dueDate: new Date() } });
    await markPaid(fd({ id: pay.id, method: "PIX" }));
    expect((await prisma.payment.findUniqueOrThrow({ where: { id: pay.id } })).status).toBe("PENDENTE");
  });
  it("administrador não redefine senha nem desativa usuário de outra clínica", async () => {
    const other = await makeUser(B.id);
    await resetUserPassword(fd({ id: other.id, password: "nova-senha-forte-1" }));
    await setUserActive(fd({ id: other.id, active: "false" }));
    const u = await prisma.user.findUniqueOrThrow({ where: { id: other.id } });
    expect(u.passwordHash).toBe("x");
    expect(u.active).toBe(true);
  });
});
