import { beforeEach, describe, expect, it, vi } from "vitest";
import { prisma } from "@/lib/prisma";
import { clearDb, fd, makeClinic, makeUser, newPatient } from "./helpers";
import { state } from "./tenant-mock";

vi.mock("next/cache", async () => (await import("./tenant-mock")).cacheMock());
vi.mock("next/navigation", async () => (await import("./tenant-mock")).navigationMock());
vi.mock("@/lib/tenant", async () => (await import("./tenant-mock")).tenantMock());

import { createPatient, saveAdmission, updatePatient } from "@/actions-patient";
import { validPatient, validAdmission } from "./helpers";

let clinic: Awaited<ReturnType<typeof makeClinic>>;
const loginAs = async (c: typeof clinic, o: Record<string, unknown> = { role: "ADMIN" }) => { const u = await makeUser(c.id, o); state.userId = u.id; return u; };
beforeEach(async () => { await clearDb(); clinic = await makeClinic(); await loginAs(clinic); });

describe("createPatient", () => {
  it("cadastra na clínica do usuário e segue para a avaliação inicial", async () => {
    await expect(createPatient(undefined, fd(validPatient))).rejects.toThrow(/REDIRECT:\/pacientes\/.+\/admissao/);
    const p = await prisma.patient.findFirstOrThrow();
    expect(p).toMatchObject({ clinicId: clinic.id, cpf: "52998224725", phone: "61999991111", payerType: "PARTICULAR", therapy: "ORTOPEDICA" });
  });
  it("tipo de atendimento de outra área cai no padrão da especialidade da clínica", async () => {
    await createPatient(undefined, fd({ ...validPatient, therapy: "PSICOTERAPIA" })).catch(() => undefined);
    expect((await prisma.patient.findFirstOrThrow()).therapy).toBe("ORTOPEDICA");
  });
  it("usa o tipo padrão da nutrição numa clínica de nutrição", async () => {
    const n = await makeClinic({ specialty: "NUTRICAO" });
    await loginAs(n);
    await createPatient(undefined, fd({ ...validPatient, therapy: "ORTOPEDICA" })).catch(() => undefined);
    expect((await prisma.patient.findFirstOrThrow({ where: { clinicId: n.id } })).therapy).toBe("CONSULTA_INICIAL");
  });
  it("recusa CPF inválido e repetido na mesma clínica, mas aceita o mesmo CPF em outra clínica", async () => {
    expect((await createPatient(undefined, fd({ ...validPatient, cpf: "111.111.111-11" })))?.error).toBe("CPF inválido.");
    await createPatient(undefined, fd(validPatient)).catch(() => undefined);
    expect((await createPatient(undefined, fd(validPatient)))?.error).toMatch(/já existe/i);
    await loginAs(await makeClinic());
    await expect(createPatient(undefined, fd(validPatient))).rejects.toThrow(/REDIRECT/);
    expect(await prisma.patient.count()).toBe(2);
  });
  it("plano de saúde exige operadora", async () => {
    expect((await createPatient(undefined, fd({ ...validPatient, payerType: "PLANO_SAUDE" })))?.error).toMatch(/operadora/i);
  });
});

describe("updatePatient", () => {
  it("atualiza os dados e recusa CPF de outro paciente da clínica", async () => {
    const a = await newPatient(clinic.id, "52998224725"); await newPatient(clinic.id, "11144477735");
    const edit = { ...validPatient, id: a.id, name: "Maria Souza Lima" };
    await expect(updatePatient(undefined, fd(edit))).rejects.toThrow(`REDIRECT:/pacientes/${a.id}`);
    expect((await prisma.patient.findUniqueOrThrow({ where: { id: a.id } })).name).toBe("Maria Souza Lima");
    expect((await updatePatient(undefined, fd({ ...edit, cpf: "111.444.777-35" })))?.error).toMatch(/já existe outro/i);
  });
});

describe("saveAdmission (fisioterapia)", () => {
  let p: Awaited<ReturnType<typeof newPatient>>;
  beforeEach(async () => { p = await newPatient(clinic.id); });

  it("exige os campos obrigatórios e o consentimento", async () => {
    expect((await saveAdmission(undefined, fd({ patientId: p.id, ...validAdmission, goals: "" })))?.error).toMatch(/preencha/i);
    expect((await saveAdmission(undefined, fd({ patientId: p.id, ...validAdmission, consent: "" })))?.error).toMatch(/consentimento/i);
    expect(await prisma.admission.count()).toBe(0);
  });
  it("grava a avaliação, as respostas e cria a evolução inicial uma única vez", async () => {
    await expect(saveAdmission(undefined, fd({ patientId: p.id, ...validAdmission, referralDoctor: "Dr. Alves" }))).rejects.toThrow(`REDIRECT:/pacientes/${p.id}`);
    const adm = await prisma.admission.findUniqueOrThrow({ where: { patientId: p.id } });
    expect(adm).toMatchObject({ clinicId: clinic.id, complaint: "Dor lombar", assessment: "Lombalgia", metric: 5, consent: true });
    expect(JSON.parse(adm.answers).referralDoctor).toBe("Dr. Alves");
    expect((await prisma.patient.findUniqueOrThrow({ where: { id: p.id } })).diagnosis).toBe("Lombalgia");
    await saveAdmission(undefined, fd({ patientId: p.id, ...validAdmission, goals: "Meta nova" })).catch(() => undefined);
    expect(await prisma.evolution.count()).toBe(1);
    expect((await prisma.admission.findUniqueOrThrow({ where: { patientId: p.id } })).goals).toBe("Meta nova");
  });
  it("limita a dor entre 0 e 10", async () => {
    await saveAdmission(undefined, fd({ patientId: p.id, ...validAdmission, painScale: "15" })).catch(() => undefined);
    expect((await prisma.admission.findUniqueOrThrow({ where: { patientId: p.id } })).metric).toBe(10);
  });
});

describe("saveAdmission (nutrição e psicologia)", () => {
  it("nutrição usa o peso como métrica e as chaves próprias da área", async () => {
    const n = await makeClinic({ specialty: "NUTRICAO" }); await loginAs(n);
    const p = await newPatient(n.id);
    const data = { patientId: p.id, complaint: "Emagrecer", nutritionalDiagnosis: "Sobrepeso", goals: "Perder 5 kg", weight: "82.4", height: "165", consent: "on" };
    expect((await saveAdmission(undefined, fd({ ...data, nutritionalDiagnosis: "" })))?.error).toMatch(/diagnóstico nutricional/i);
    await saveAdmission(undefined, fd(data)).catch(() => undefined);
    expect(await prisma.admission.findUniqueOrThrow({ where: { patientId: p.id } })).toMatchObject({ metric: 82.4, assessment: "Sobrepeso", therapy: "CONSULTA_INICIAL" });
  });
  it("psicologia aceita avaliação sem a métrica de bem-estar", async () => {
    const c = await makeClinic({ specialty: "PSICOLOGIA" }); await loginAs(c);
    const p = await newPatient(c.id);
    await saveAdmission(undefined, fd({ patientId: p.id, complaint: "Ansiedade", formulation: "Sintomas ansiosos", goals: "Manejo", consent: "on", mood: "" })).catch(() => undefined);
    expect((await prisma.admission.findUniqueOrThrow({ where: { patientId: p.id } })).metric).toBeNull();
  });
});
