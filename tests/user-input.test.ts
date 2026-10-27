import { describe, expect, it } from "vitest";
import { readUser } from "@/lib/user-input";

const form = (o: Record<string, string> = {}) => {
  const fd = new FormData();
  for (const [k, v] of Object.entries({ name: "Sinara Lima", email: "Sinara@Clinica.com ", password: "senha-bem-forte", role: "PROFISSIONAL", registration: "", ...o })) fd.set(k, v);
  return fd;
};

describe("readUser", () => {
  it("aceita e normaliza o e-mail", () => {
    const { data, error } = readUser(form());
    expect(error).toBeUndefined();
    expect(data.email).toBe("sinara@clinica.com");
    expect(data.registration).toBeNull();
  });
  it("exige nome, e-mail válido e senha de 10+ caracteres", () => {
    expect(readUser(form({ name: "A" })).error).toBe("Informe o nome.");
    expect(readUser(form({ email: "sem-arroba" })).error).toBe("Informe um e-mail válido.");
    expect(readUser(form({ password: "curta" })).error).toMatch(/pelo menos 10/);
  });
  it("recusa perfil desconhecido e usa PROFISSIONAL por padrão", () => {
    expect(readUser(form({ role: "DONO" })).error).toBe("Perfil inválido.");
    expect(readUser(form({ role: "" })).data.role).toBe("PROFISSIONAL");
  });
});
