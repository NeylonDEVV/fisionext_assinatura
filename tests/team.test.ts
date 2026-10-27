import { beforeEach, describe, expect, it, vi } from "vitest";
import bcrypt from "bcryptjs";
import { prisma } from "@/lib/prisma";
import { createUser, resetUserPassword, setUserActive } from "@/actions-team";
import { clearDb, fd, makeClinic, makeUser } from "./helpers";
import { state } from "./tenant-mock";

vi.mock("next/cache", async () => (await import("./tenant-mock")).cacheMock());
vi.mock("next/navigation", async () => (await import("./tenant-mock")).navigationMock());
vi.mock("@/lib/tenant", async () => (await import("./tenant-mock")).tenantMock());

const valid = { name: "Antonio Souza", email: "antonio@clinica.com", password: "uma-senha-forte-123", role: "PROFISSIONAL", registration: "11-123456-F" };
let clinic: Awaited<ReturnType<typeof makeClinic>>, admin: Awaited<ReturnType<typeof makeUser>>;
beforeEach(async () => { await clearDb(); clinic = await makeClinic(); admin = await makeUser(clinic.id, { role: "ADMIN" }); state.userId = admin.id; });

describe("createUser", () => {
  it("cadastra o profissional na clínica do administrador, com senha criptografada", async () => {
    await expect(createUser(undefined, fd(valid))).rejects.toThrow("REDIRECT:/equipe");
    const u = await prisma.user.findUniqueOrThrow({ where: { email: "antonio@clinica.com" } });
    expect(u).toMatchObject({ clinicId: clinic.id, name: "Antonio Souza", role: "PROFISSIONAL", registration: "11-123456-F", active: true });
    expect(await bcrypt.compare("uma-senha-forte-123", u.passwordHash)).toBe(true);
  });
  it("o e-mail é único na plataforma inteira, mesmo entre clínicas", async () => {
    await makeUser((await makeClinic()).id, { email: "antonio@clinica.com" });
    expect((await createUser(undefined, fd(valid)))?.error).toMatch(/já existe/i);
  });
  it("recusa senha curta", async () => {
    expect((await createUser(undefined, fd({ ...valid, password: "curta" })))?.error).toMatch(/pelo menos 10/);
  });
  it("profissional comum não cadastra ninguém", async () => {
    state.userId = (await makeUser(clinic.id)).id;
    await expect(createUser(undefined, fd(valid))).rejects.toThrow("REDIRECT:/dashboard");
  });
});

describe("setUserActive", () => {
  it("desativa e reativa um profissional", async () => {
    const p = await makeUser(clinic.id);
    await setUserActive(fd({ id: p.id, active: "false" }));
    expect((await prisma.user.findUniqueOrThrow({ where: { id: p.id } })).active).toBe(false);
    await setUserActive(fd({ id: p.id, active: "true" }));
    expect((await prisma.user.findUniqueOrThrow({ where: { id: p.id } })).active).toBe(true);
  });
  it("ninguém desativa a si mesmo e sempre sobra um administrador ativo na clínica", async () => {
    await setUserActive(fd({ id: admin.id, active: "false" }));
    expect((await prisma.user.findUniqueOrThrow({ where: { id: admin.id } })).active).toBe(true);
    const other = await makeUser(clinic.id, { role: "ADMIN" });
    state.userId = other.id;
    await setUserActive(fd({ id: admin.id, active: "false" })); // ainda há outro admin: permite
    expect((await prisma.user.findUniqueOrThrow({ where: { id: admin.id } })).active).toBe(false);
    state.userId = admin.id;
    await setUserActive(fd({ id: other.id, active: "false" })); // último admin ativo: recusa
    expect((await prisma.user.findUniqueOrThrow({ where: { id: other.id } })).active).toBe(true);
  });
  it("um administrador de outra clínica não conta como administrador desta", async () => {
    const lone = await makeClinic(); const loneAdmin = await makeUser(lone.id, { role: "ADMIN" });
    await makeUser(clinic.id, { role: "ADMIN" }); // segundo admin nesta clínica
    state.userId = loneAdmin.id;
    await setUserActive(fd({ id: admin.id, active: "false" })); // loneAdmin não é desta clínica: nada acontece
    expect((await prisma.user.findUniqueOrThrow({ where: { id: admin.id } })).active).toBe(true);
  });
});

describe("resetUserPassword", () => {
  it("troca a senha e ignora senha curta", async () => {
    const p = await makeUser(clinic.id);
    await resetUserPassword(fd({ id: p.id, password: "curta" }));
    expect((await prisma.user.findUniqueOrThrow({ where: { id: p.id } })).passwordHash).toBe("x");
    await resetUserPassword(fd({ id: p.id, password: "nova-senha-forte-1" }));
    expect(await bcrypt.compare("nova-senha-forte-1", (await prisma.user.findUniqueOrThrow({ where: { id: p.id } })).passwordHash)).toBe(true);
  });
});
