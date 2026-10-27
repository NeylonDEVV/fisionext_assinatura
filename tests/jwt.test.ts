import { describe, it, expect, afterEach } from "vitest";
import { signToken, verifyToken } from "@/lib/jwt";

const user = { id: "u1", name: "Dra. Ana", email: "ana@clinica.com" };
const original = process.env.AUTH_SECRET;
afterEach(() => { process.env.AUTH_SECRET = original; });

describe("sessão JWT", () => {
  it("assina e verifica", async () => {
    expect(await verifyToken(await signToken(user))).toEqual(user);
  });
  it("rejeita token adulterado", async () => {
    const t = await signToken(user);
    const bad = t.slice(0, -2) + (t.endsWith("AA") ? "BB" : "AA");
    expect(await verifyToken(bad)).toBeNull();
  });
  it("rejeita token assinado com outra chave", async () => {
    const t = await signToken(user);
    process.env.AUTH_SECRET = "outra-chave-completamente-diferente-123456";
    expect(await verifyToken(t)).toBeNull();
  });
  it("rejeita vazio e lixo", async () => {
    expect(await verifyToken(undefined)).toBeNull();
    expect(await verifyToken("lixo")).toBeNull();
  });
  it("falha com erro claro se AUTH_SECRET não existir", async () => {
    delete process.env.AUTH_SECRET;
    await expect(signToken(user)).rejects.toThrow(/AUTH_SECRET/);
  });
});
