import { beforeEach, describe, expect, it, vi } from "vitest";
import { prisma } from "@/lib/prisma";
import { clearDb, fd, makeClinic, makeUser, newPatient } from "./helpers";
import { state } from "./tenant-mock";

vi.mock("next/cache", async () => (await import("./tenant-mock")).cacheMock());
vi.mock("next/navigation", async () => (await import("./tenant-mock")).navigationMock());
vi.mock("@/lib/tenant", async () => (await import("./tenant-mock")).tenantMock());

import { createAppointment, markPaid } from "@/actions";

let clinic: Awaited<ReturnType<typeof makeClinic>>, patient: Awaited<ReturnType<typeof newPatient>>;
const appt = { date: "2026-11-10", time: "09:00", duration: "50", kind: "consultas", therapy: "ORTOPEDICA" };
beforeEach(async () => {
  await clearDb(); clinic = await makeClinic(); state.userId = (await makeUser(clinic.id, { role: "ADMIN" })).id; patient = await newPatient(clinic.id);
});

describe("agendamento e cobrança da sessão", () => {
  it("com valor, cria a cobrança pendente na clínica", async () => {
    await createAppointment(fd({ ...appt, patientId: patient.id, price: "150" }));
    expect(await prisma.payment.findFirstOrThrow()).toMatchObject({ clinicId: clinic.id, amount: 15000, status: "PENDENTE", description: "Sessão" });
  });
  it("sem valor, não cria cobrança", async () => {
    await createAppointment(fd({ ...appt, patientId: patient.id }));
    expect(await prisma.payment.count()).toBe(0);
  });
  it("na nutrição a cobrança se chama Consulta", async () => {
    const n = await makeClinic({ specialty: "NUTRICAO" }); state.userId = (await makeUser(n.id)).id; const p = await newPatient(n.id);
    await createAppointment(fd({ ...appt, therapy: "RETORNO", patientId: p.id, price: "200" }));
    expect((await prisma.payment.findFirstOrThrow({ where: { clinicId: n.id } })).description).toBe("Consulta");
  });
});

describe("baixa de pagamento", () => {
  let id: string;
  beforeEach(async () => { id = (await prisma.payment.create({ data: { clinicId: clinic.id, patientId: patient.id, description: "x", amount: 100, dueDate: new Date() } })).id; });
  it.each(["PIX", "DINHEIRO", "CARTAO_CREDITO", "CARTAO_DEBITO"])("aceita %s", async (method) => {
    await markPaid(fd({ id, method }));
    expect(await prisma.payment.findUniqueOrThrow({ where: { id } })).toMatchObject({ status: "PAGO", method });
  });
  it("recusa boleto e formas desconhecidas", async () => {
    await markPaid(fd({ id, method: "BOLETO" }));
    expect((await prisma.payment.findUniqueOrThrow({ where: { id } })).status).toBe("PENDENTE");
  });
});
