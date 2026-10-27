import { beforeEach, describe, expect, it, vi } from "vitest";
import { prisma } from "@/lib/prisma";
import { clearDb, fd, makeClinic, makeUser, newPatient } from "./helpers";
import { state } from "./tenant-mock";

vi.mock("next/cache", async () => (await import("./tenant-mock")).cacheMock());
vi.mock("next/navigation", async () => (await import("./tenant-mock")).navigationMock());
vi.mock("@/lib/tenant", async () => (await import("./tenant-mock")).tenantMock());

import { addEvolution } from "@/actions";
import { saveAdmission } from "@/actions-patient";
import { validAdmission } from "./helpers";

beforeEach(clearDb);

describe("autoria e métrica das evoluções", () => {
  it("a evolução guarda quem registrou e a métrica da área", async () => {
    const c = await makeClinic(); const u = await makeUser(c.id); state.userId = u.id; const p = await newPatient(c.id);
    await addEvolution(fd({ patientId: p.id, metric: "4", content: "Boa evolução", techniques: "TENS" }));
    expect(await prisma.evolution.findFirstOrThrow()).toMatchObject({ authorId: u.id, clinicId: c.id, metric: 4, techniques: "TENS" });
  });
  it("limita a métrica à escala e exige o texto", async () => {
    const c = await makeClinic(); state.userId = (await makeUser(c.id)).id; const p = await newPatient(c.id);
    await addEvolution(fd({ patientId: p.id, metric: "99", content: "x" }));
    await addEvolution(fd({ patientId: p.id, metric: "5", content: "  " }));
    const all = await prisma.evolution.findMany();
    expect(all).toHaveLength(1);
    expect(all[0].metric).toBe(10);
  });
  it("nutrição guarda o peso com decimais e exige o peso", async () => {
    const c = await makeClinic({ specialty: "NUTRICAO" }); state.userId = (await makeUser(c.id)).id; const p = await newPatient(c.id);
    await addEvolution(fd({ patientId: p.id, metric: "", content: "sem peso" }));
    await addEvolution(fd({ patientId: p.id, metric: "81.6", content: "ok" }));
    const all = await prisma.evolution.findMany();
    expect(all).toHaveLength(1);
    expect(all[0].metric).toBe(81.6);
  });
  it("psicologia aceita registro sem a métrica", async () => {
    const c = await makeClinic({ specialty: "PSICOLOGIA" }); state.userId = (await makeUser(c.id)).id; const p = await newPatient(c.id);
    await addEvolution(fd({ patientId: p.id, content: "Sessão produtiva" }));
    expect((await prisma.evolution.findFirstOrThrow()).metric).toBeNull();
  });
  it("a avaliação guarda o autor e não muda quando outro profissional edita", async () => {
    const c = await makeClinic(); const [u1, u2] = [await makeUser(c.id), await makeUser(c.id)]; const p = await newPatient(c.id);
    state.userId = u1.id; await saveAdmission(undefined, fd({ patientId: p.id, ...validAdmission })).catch(() => undefined);
    state.userId = u2.id; await saveAdmission(undefined, fd({ patientId: p.id, ...validAdmission, goals: "Meta nova" })).catch(() => undefined);
    expect(await prisma.admission.findUniqueOrThrow({ where: { patientId: p.id } })).toMatchObject({ authorId: u1.id, goals: "Meta nova" });
  });
});
