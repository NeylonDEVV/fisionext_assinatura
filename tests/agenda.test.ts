import { beforeEach, describe, expect, it, vi } from "vitest";
import { prisma } from "@/lib/prisma";
import { clearDb, fd, makeClinic, makeUser, newPatient } from "./helpers";
import { state } from "./tenant-mock";

vi.mock("next/cache", async () => (await import("./tenant-mock")).cacheMock());
vi.mock("next/navigation", async () => (await import("./tenant-mock")).navigationMock());
vi.mock("@/lib/tenant", async () => (await import("./tenant-mock")).tenantMock());

import { createAppointment } from "@/actions";

const base = { date: "2026-11-10", time: "09:00", duration: "50" };
beforeEach(clearDb);
const setup = async (specialty = "FISIOTERAPIA") => { const c = await makeClinic({ specialty }); const u = await makeUser(c.id, { role: "ADMIN" }); state.userId = u.id; return { c, u, p: await newPatient(c.id) }; };

describe("agendas separadas (fisioterapia)", () => {
  it("a agenda de pilates sempre grava PILATES, com o profissional escolhido", async () => {
    const { u, p } = await setup();
    await createAppointment(fd({ ...base, kind: "pilates", patientId: p.id, therapy: "ORTOPEDICA", professionalId: u.id }));
    expect(await prisma.appointment.findFirstOrThrow()).toMatchObject({ therapy: "PILATES", professionalId: u.id });
  });
  it("a agenda de consultas não aceita pilates", async () => {
    const { p } = await setup();
    await createAppointment(fd({ ...base, kind: "consultas", patientId: p.id, therapy: "PILATES" }));
    expect(await prisma.appointment.count()).toBe(0);
    await createAppointment(fd({ ...base, kind: "consultas", patientId: p.id, therapy: "ORTOPEDICA" }));
    expect(await prisma.appointment.count()).toBe(1);
  });
  it("ignora profissional desativado ou inexistente", async () => {
    const { c, p } = await setup(); const off = await makeUser(c.id, { active: false });
    await createAppointment(fd({ ...base, kind: "consultas", patientId: p.id, therapy: "ORTOPEDICA", professionalId: off.id }));
    await createAppointment(fd({ ...base, kind: "consultas", patientId: p.id, therapy: "ORTOPEDICA", professionalId: "naoexiste" }));
    expect((await prisma.appointment.findMany()).every((a) => a.professionalId === null)).toBe(true);
  });
});

describe("tipos de atendimento por área", () => {
  it("nutrição não tem agenda de grupo e só aceita os próprios tipos", async () => {
    const { p } = await setup("NUTRICAO");
    await createAppointment(fd({ ...base, kind: "pilates", patientId: p.id, therapy: "PILATES" }));
    await createAppointment(fd({ ...base, kind: "consultas", patientId: p.id, therapy: "ORTOPEDICA" }));
    expect(await prisma.appointment.count()).toBe(0);
    await createAppointment(fd({ ...base, kind: "consultas", patientId: p.id, therapy: "RETORNO" }));
    expect(await prisma.appointment.count()).toBe(1);
  });
  it("psicologia aceita psicoterapia e recusa tipo de fisioterapia", async () => {
    const { p } = await setup("PSICOLOGIA");
    await createAppointment(fd({ ...base, kind: "consultas", patientId: p.id, therapy: "ESPORTIVA" }));
    await createAppointment(fd({ ...base, kind: "consultas", patientId: p.id, therapy: "PSICOTERAPIA" }));
    expect((await prisma.appointment.findFirstOrThrow()).therapy).toBe("PSICOTERAPIA");
  });
});
