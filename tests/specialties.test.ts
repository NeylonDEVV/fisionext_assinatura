import { describe, expect, it } from "vitest";
import { SPECIALTIES, SPECIALTY_KEYS, bmi, canReadRecord, formatMetric, getSpecialty, isSpecialty, serviceColor, serviceLabel } from "@/lib/specialties";

describe("configuração das especialidades", () => {
  it("são três áreas, cada uma com conselho próprio", () => {
    expect(SPECIALTY_KEYS).toEqual(["FISIOTERAPIA", "NUTRICAO", "PSICOLOGIA"]);
    expect(SPECIALTY_KEYS.map((k) => SPECIALTIES[k].council)).toEqual(["CREFITO", "CRN", "CRP"]);
  });
  it.each(SPECIALTY_KEYS)("%s: formulário consistente com as colunas que a avaliação grava", (k) => {
    const s = SPECIALTIES[k];
    const fields = s.steps.flatMap((st) => st.fields);
    const keys = fields.map((f) => f.key);
    expect(new Set(keys).size).toBe(keys.length); // sem chaves repetidas
    for (const key of [s.keys.complaint, s.keys.assessment, s.keys.goals, s.keys.metric, s.keys.therapy]) expect(keys).toContain(key);
    for (const key of s.requiredKeys) expect(fields.find((f) => f.key === key)?.required).toBe(true);
    expect(fields.find((f) => f.key === s.keys.therapy)?.type).toBe("service");
    expect(Object.keys(s.services)).toContain(s.defaultService);
    expect(s.steps.length).toBeGreaterThanOrEqual(3);
  });
  it("só a fisioterapia tem agenda de grupo (Pilates) e ela existe entre os tipos", () => {
    expect(SPECIALTIES.FISIOTERAPIA.groupAgenda?.key).toBe("PILATES");
    expect(SPECIALTIES.FISIOTERAPIA.services.PILATES).toBeDefined();
    expect(SPECIALTIES.NUTRICAO.groupAgenda).toBeNull();
    expect(SPECIALTIES.PSICOLOGIA.groupAgenda).toBeNull();
  });
  it("os tipos de atendimento não se repetem entre áreas", () => {
    const all = SPECIALTY_KEYS.flatMap((k) => Object.keys(SPECIALTIES[k].services));
    expect(new Set(all).size).toBe(all.length);
  });
  it("métrica de cada área: dor, peso e bem-estar", () => {
    expect(SPECIALTIES.FISIOTERAPIA.metric).toMatchObject({ label: "Dor", better: "lower", optional: false });
    expect(SPECIALTIES.NUTRICAO.metric).toMatchObject({ label: "Peso", kind: "number", unit: "kg" });
    expect(SPECIALTIES.PSICOLOGIA.metric).toMatchObject({ label: "Bem-estar", better: "higher", optional: true });
  });
  it("psicologia restringe os registros; as outras áreas não", () => {
    expect(SPECIALTIES.PSICOLOGIA.restrictedRecords).toBe(true);
    expect(SPECIALTIES.FISIOTERAPIA.restrictedRecords).toBe(false);
    expect(canReadRecord(SPECIALTIES.PSICOLOGIA, "u1", "u1")).toBe(true);
    expect(canReadRecord(SPECIALTIES.PSICOLOGIA, "u1", "u2")).toBe(false);
    expect(canReadRecord(SPECIALTIES.PSICOLOGIA, "u1", null)).toBe(false);
    expect(canReadRecord(SPECIALTIES.NUTRICAO, "u1", "u2")).toBe(true);
  });
});

describe("funções de apoio", () => {
  it("getSpecialty cai em fisioterapia quando a chave é desconhecida", () => {
    expect(getSpecialty("NUTRICAO").key).toBe("NUTRICAO");
    expect(getSpecialty("XYZ").key).toBe("FISIOTERAPIA");
    expect(getSpecialty(undefined).key).toBe("FISIOTERAPIA");
    expect(isSpecialty("PSICOLOGIA")).toBe(true);
    expect(isSpecialty("ODONTOLOGIA")).toBe(false);
  });
  it("rótulo e cor de qualquer tipo de atendimento", () => {
    expect(serviceLabel("RETORNO")).toBe("Retorno");
    expect(serviceLabel("PSICOTERAPIA")).toBe("Psicoterapia individual");
    expect(serviceLabel("DESCONHECIDO")).toBe("DESCONHECIDO");
    expect(serviceColor("PILATES")).toBe("#FF8638");
    expect(serviceColor("DESCONHECIDO")).toBe("#8E8A86");
  });
  it("formatMetric", () => {
    expect(formatMetric(8, SPECIALTIES.FISIOTERAPIA.metric)).toBe("8/10");
    expect(formatMetric(72.5, SPECIALTIES.NUTRICAO.metric)).toBe("72,5 kg");
    expect(formatMetric(null, SPECIALTIES.NUTRICAO.metric)).toBe("—");
  });
  it("IMC", () => {
    expect(bmi(82.4, 165)).toBe(30.3);
    expect(bmi(70, 175)).toBe(22.9);
    expect(bmi(0, 170)).toBeNull();
    expect(bmi(70, 0)).toBeNull();
  });
});
