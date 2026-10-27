import { afterEach, describe, expect, it, vi } from "vitest";
import { signToken } from "@/lib/jwt";

const original = process.env.AUTH_SECRET;
afterEach(() => { vi.unstubAllEnvs(); process.env.AUTH_SECRET = original; });

describe("AUTH_SECRET em produção", () => {
  it("recusa segredo curto ou de exemplo", async () => {
    vi.stubEnv("NODE_ENV", "production");
    process.env.AUTH_SECRET = "curto";
    await expect(signToken({ id: "u", name: "A", email: "a@a.com" })).rejects.toThrow(/AUTH_SECRET/);
    process.env.AUTH_SECRET = "troque-por-uma-chave-longa-e-aleatoria-123";
    await expect(signToken({ id: "u", name: "A", email: "a@a.com" })).rejects.toThrow(/AUTH_SECRET/);
  });
});
