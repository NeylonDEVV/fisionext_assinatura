import { beforeEach, describe, expect, it } from "vitest";
import { WINDOW_MS, clearFailures, isBlocked, registerFailure, resetAllLimits } from "@/lib/rate-limit";

beforeEach(resetAllLimits);

describe("limite de tentativas de login", () => {
  it("bloqueia ao atingir o máximo", () => {
    for (let i = 0; i < 4; i++) registerFailure("k");
    expect(isBlocked("k", 5)).toBe(false);
    registerFailure("k");
    expect(isBlocked("k", 5)).toBe(true);
  });
  it("desbloqueia depois da janela", () => {
    const t0 = 1_000_000;
    for (let i = 0; i < 5; i++) registerFailure("k", t0);
    expect(isBlocked("k", 5, t0 + 1000)).toBe(true);
    expect(isBlocked("k", 5, t0 + WINDOW_MS + 1)).toBe(false);
  });
  it("clearFailures zera o contador", () => {
    for (let i = 0; i < 5; i++) registerFailure("k");
    clearFailures("k");
    expect(isBlocked("k", 5)).toBe(false);
  });
  it("chaves são independentes", () => {
    for (let i = 0; i < 5; i++) registerFailure("a");
    expect(isBlocked("b", 5)).toBe(false);
  });
});
