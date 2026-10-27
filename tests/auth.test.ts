import { beforeEach, describe, expect, it, vi } from "vitest";
import bcrypt from "bcryptjs";
import { prisma } from "@/lib/prisma";
import { login } from "@/actions-auth";
import { startSession } from "@/lib/session";
import { resetAllLimits } from "@/lib/rate-limit";
import { clearDb, fd, makeClinic, makeUser } from "./helpers";

vi.mock("next/headers", () => ({ headers: () => new Headers() }));
vi.mock("next/navigation", async () => (await import("./tenant-mock")).navigationMock());
vi.mock("@/lib/session", () => ({ startSession: vi.fn(), endSession: vi.fn() }));

let user: Awaited<ReturnType<typeof makeUser>>;
beforeEach(async () => {
  await clearDb(); vi.clearAllMocks(); resetAllLimits();
  user = await makeUser((await makeClinic()).id, { email: "admin@clinica.com", name: "Admin", passwordHash: await bcrypt.hash("senha-correta", 4), role: "ADMIN" });
});

describe("login", () => {
  it("entra com a senha correta e segue para o dashboard", async () => {
    await expect(login(undefined, fd({ email: " Admin@Clinica.com ", password: "senha-correta" }))).rejects.toThrow("REDIRECT:/dashboard");
    expect(startSession).toHaveBeenCalledWith({ id: user.id, name: "Admin", email: "admin@clinica.com" });
  });
  it("recusa senha errada e e-mail desconhecido com a mesma mensagem", async () => {
    expect(await login(undefined, fd({ email: "admin@clinica.com", password: "errada" }))).toEqual({ error: "E-mail ou senha incorretos." });
    expect(await login(undefined, fd({ email: "ninguem@x.com", password: "qualquer" }))).toEqual({ error: "E-mail ou senha incorretos." });
    expect(startSession).not.toHaveBeenCalled();
  });
  it("usuário desativado não entra, mesmo com a senha certa", async () => {
    await prisma.user.update({ where: { id: user.id }, data: { active: false } });
    expect(await login(undefined, fd({ email: "admin@clinica.com", password: "senha-correta" }))).toEqual({ error: "E-mail ou senha incorretos." });
  });
  it("bloqueia depois de 5 senhas erradas, mesmo com a senha certa", async () => {
    for (let i = 0; i < 5; i++) await login(undefined, fd({ email: "admin@clinica.com", password: "errada" }));
    expect((await login(undefined, fd({ email: "admin@clinica.com", password: "senha-correta" })))?.error).toMatch(/muitas tentativas/i);
    expect(startSession).not.toHaveBeenCalled();
  });
  it("login correto zera o contador de erros", async () => {
    for (let i = 0; i < 4; i++) await login(undefined, fd({ email: "admin@clinica.com", password: "errada" }));
    await expect(login(undefined, fd({ email: "admin@clinica.com", password: "senha-correta" }))).rejects.toThrow("REDIRECT");
    expect((await login(undefined, fd({ email: "admin@clinica.com", password: "errada" })))?.error).toBe("E-mail ou senha incorretos.");
  });
});
