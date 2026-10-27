import { describe, it, expect } from "vitest";
import { METHODS, PAYERS, methodLabel, payerLabel } from "@/lib/payer";

describe("formas de pagamento", () => {
  it("separa crédito e débito e não oferece boleto", () => {
    expect(Object.keys(METHODS).sort()).toEqual(["CARTAO_CREDITO", "CARTAO_DEBITO", "DINHEIRO", "PIX"]);
    expect(Object.keys(METHODS)).not.toContain("BOLETO");
  });
  it("methodLabel traduz e trata valores antigos ou vazios", () => {
    expect(methodLabel("CARTAO_DEBITO")).toBe("Cartão de débito");
    expect(methodLabel("CARTAO_CREDITO")).toBe("Cartão de crédito");
    expect(methodLabel("CARTAO")).toBe("Cartão"); // registros antigos
    expect(methodLabel(null)).toBe("—");
  });
});

describe("origem do paciente", () => {
  it("tem as três origens", () => expect(Object.keys(PAYERS)).toEqual(["PARTICULAR", "PLANO_SAUDE", "PARCERIA"]));
  it("payerLabel", () => {
    expect(payerLabel("PARCERIA")).toBe("Parceria");
    expect(payerLabel("PLANO_SAUDE")).toBe("Plano de saúde");
  });
});
