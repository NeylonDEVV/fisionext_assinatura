import { describe, expect, it } from "vitest";
import { isValidCnpj, isValidCpfOrCnpj, maskCpfCnpj } from "@/lib/cpf";

describe("CNPJ", () => {
  it("valida CNPJs, com ou sem máscara", () => {
    expect(isValidCnpj("11222333000181")).toBe(true);
    expect(isValidCnpj("11.222.333/0001-81")).toBe(true);
  });
  it("recusa dígito errado, tamanho errado e repetidos", () => {
    expect(isValidCnpj("11222333000182")).toBe(false);
    expect(isValidCnpj("1122233300018")).toBe(false);
    expect(isValidCnpj("00000000000000")).toBe(false);
  });
  it("isValidCpfOrCnpj aceita os dois", () => {
    expect(isValidCpfOrCnpj("529.982.247-25")).toBe(true);
    expect(isValidCpfOrCnpj("11.222.333/0001-81")).toBe(true);
    expect(isValidCpfOrCnpj("123")).toBe(false);
  });
  it("maskCpfCnpj muda de CPF para CNPJ conforme o tamanho", () => {
    expect(maskCpfCnpj("52998224725")).toBe("529.982.247-25");
    expect(maskCpfCnpj("11222333000181")).toBe("11.222.333/0001-81");
    expect(maskCpfCnpj("112223")).toBe("112.223"); // até 11 dígitos ainda é formato de CPF
    expect(maskCpfCnpj("112223330001")).toBe("11.222.333/0001");
  });
});
