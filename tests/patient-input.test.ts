import { describe, expect, it } from "vitest";
import { readPatient } from "@/lib/patient-input";

const valid: Record<string, string> = {
  name: "Ana Beatriz Lima", cpf: "529.982.247-25", birthDate: "1990-05-10", phone: "(61) 99999-1111",
  payerType: "PARTICULAR", therapy: "ORTOPEDICA",
};
const form = (over: Record<string, string> = {}) => {
  const fd = new FormData();
  for (const [k, v] of Object.entries({ ...valid, ...over })) fd.set(k, v);
  return fd;
};

describe("readPatient", () => {
  it("aceita um cadastro completo e normaliza CPF e telefone", () => {
    const { data, error } = readPatient(form());
    expect(error).toBeUndefined();
    expect(data.cpf).toBe("52998224725");
    expect(data.phone).toBe("61999991111");
    expect(data.insurerName).toBeNull();
  });
  it("exige nome completo", () => expect(readPatient(form({ name: "Ana" })).error).toBe("Informe o nome completo."));
  it("recusa CPF inválido", () => expect(readPatient(form({ cpf: "111.111.111-11" })).error).toBe("CPF inválido."));
  it("recusa nascimento inválido ou no futuro", () => {
    expect(readPatient(form({ birthDate: "" })).error).toBe("Data de nascimento inválida.");
    expect(readPatient(form({ birthDate: "2999-01-01" })).error).toBe("Data de nascimento inválida.");
  });
  it("exige telefone com DDD", () => expect(readPatient(form({ phone: "9999-1111" })).error).toBe("Informe um telefone com DDD."));
  it("recusa origem desconhecida", () => expect(readPatient(form({ payerType: "OUTRO" })).error).toBe("Selecione a origem do paciente."));
  it("plano de saúde exige operadora e guarda a carteirinha", () => {
    expect(readPatient(form({ payerType: "PLANO_SAUDE" })).error).toBe("Informe a operadora do plano de saúde.");
    const { data, error } = readPatient(form({ payerType: "PLANO_SAUDE", insurerName: "Unimed", insuranceCard: "123" }));
    expect(error).toBeUndefined();
    expect(data.insurerName).toBe("Unimed");
    expect(data.insuranceCard).toBe("123");
  });
  it("descarta operadora quando a origem não é plano de saúde", () => {
    const { data } = readPatient(form({ payerType: "PARCERIA", insurerName: "Unimed", insuranceCard: "123" }));
    expect(data.insurerName).toBeNull();
    expect(data.insuranceCard).toBeNull();
  });
});
