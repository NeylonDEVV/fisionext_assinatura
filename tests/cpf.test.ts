import { describe, it, expect } from "vitest";
import { isValidCpf, maskCpf, maskPhone, maskCep, onlyDigits } from "@/lib/cpf";

describe("isValidCpf", () => {
  it("aceita CPFs válidos, com ou sem máscara", () => {
    expect(isValidCpf("529.982.247-25")).toBe(true);
    expect(isValidCpf("11144477735")).toBe(true);
  });
  it("rejeita dígito verificador errado", () => {
    expect(isValidCpf("529.982.247-24")).toBe(false);
  });
  it("rejeita sequências repetidas, tamanho errado e vazio", () => {
    expect(isValidCpf("111.111.111-11")).toBe(false);
    expect(isValidCpf("123")).toBe(false);
    expect(isValidCpf("")).toBe(false);
  });
});

describe("máscaras", () => {
  it("onlyDigits remove tudo que não é número", () => expect(onlyDigits("(61) 9.9999-1111")).toBe("61999991111"));
  it("maskCpf formata completo e parcial", () => {
    expect(maskCpf("52998224725")).toBe("529.982.247-25");
    expect(maskCpf("5299")).toBe("529.9");
    expect(maskCpf("529982247259999")).toBe("529.982.247-25"); // corta excesso
  });
  it("maskPhone formata fixo e celular", () => {
    expect(maskPhone("61999991111")).toBe("(61) 99999-1111");
    expect(maskPhone("6133334444")).toBe("(61) 3333-4444");
  });
  it("maskCep formata", () => expect(maskCep("70040900")).toBe("70040-900"));
});
