import { beforeEach, describe, expect, it, vi } from "vitest";
import bcrypt from "bcryptjs";
import { prisma } from "@/lib/prisma";
import { signUp } from "@/actions-signup";
import { startSession } from "@/lib/session";
import { resetAllLimits } from "@/lib/rate-limit";
import { hasAccess } from "@/lib/billing";
import { clearDb, fd, makeClinic, makeUser } from "./helpers";

vi.mock("next/headers", () => ({ headers: () => new Headers() }));
vi.mock("next/navigation", async () => (await import("./tenant-mock")).navigationMock());
vi.mock("@/lib/session", () => ({ startSession: vi.fn(), endSession: vi.fn() }));

const valid = { specialty: "NUTRICAO", name: "Marina Souza", email: "Marina@Consultorio.com", password: "senha-bem-forte", clinicName: "Consultório Marina", phone: "(61) 99999-1111", terms: "on" };
beforeEach(async () => {
  await clearDb(); vi.clearAllMocks(); resetAllLimits();
  vi.stubEnv("SIGNUP_ENABLED", "true"); vi.stubEnv("TRIAL_DAYS", "14");
});

describe("cadastro em etapas", () => {
  it("cria a clínica da área escolhida, o administrador e o teste grátis, e entra no sistema", async () => {
    await expect(signUp(undefined, fd(valid))).rejects.toThrow("REDIRECT:/dashboard");
    const clinic = await prisma.clinic.findFirstOrThrow({ include: { users: true } });
    expect(clinic).toMatchObject({ name: "Consultório Marina", specialty: "NUTRICAO", subscriptionStatus: "TRIAL", phone: "61999991111" });
    const days = (clinic.trialEndsAt!.getTime() - Date.now()) / 864e5;
    expect(days).toBeGreaterThan(13.9); expect(days).toBeLessThan(14.1);
    expect(hasAccess(clinic)).toBe(true);
    const u = clinic.users[0];
    expect(u).toMatchObject({ email: "marina@consultorio.com", role: "ADMIN", name: "Marina Souza" });
    expect(u.termsAcceptedAt).not.toBeNull();
    expect(await bcrypt.compare("senha-bem-forte", u.passwordHash)).toBe(true);
    expect(startSession).toHaveBeenCalledWith({ id: u.id, name: "Marina Souza", email: "marina@consultorio.com" });
  });
  it("respeita a duração do teste configurada", async () => {
    vi.stubEnv("TRIAL_DAYS", "7");
    await signUp(undefined, fd(valid)).catch(() => undefined);
    const days = ((await prisma.clinic.findFirstOrThrow()).trialEndsAt!.getTime() - Date.now()) / 864e5;
    expect(days).toBeGreaterThan(6.9); expect(days).toBeLessThan(7.1);
  });
  it("fica fechado enquanto SIGNUP_ENABLED não for true", async () => {
    vi.stubEnv("SIGNUP_ENABLED", "false");
    expect((await signUp(undefined, fd(valid)))?.error).toMatch(/ainda não estão abertos/i);
    expect(await prisma.clinic.count()).toBe(0);
  });
  it("valida área, e-mail, senha, nome do consultório e aceite dos termos", async () => {
    for (const bad of [{ specialty: "ODONTOLOGIA" }, { email: "sem-arroba" }, { password: "curta" }, { clinicName: "" }, { terms: "" }]) {
      expect((await signUp(undefined, fd({ ...valid, ...bad })))?.error).toBeTruthy();
    }
    expect(await prisma.clinic.count()).toBe(0);
  });
  it("não cria conta com e-mail que já existe em qualquer clínica", async () => {
    await makeUser((await makeClinic()).id, { email: "marina@consultorio.com" });
    expect((await signUp(undefined, fd(valid)))?.error).toMatch(/já existe uma conta/i);
  });
  it("segura criação em massa: poucas tentativas por origem", async () => {
    for (let i = 0; i < 6; i++) await signUp(undefined, fd({ ...valid, email: `x${i}@teste.com`, terms: "" }));
    expect((await signUp(undefined, fd(valid)))?.error).toMatch(/muitas tentativas/i);
  });
});
