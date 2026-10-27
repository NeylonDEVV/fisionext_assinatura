// Tudo que muda de uma área para outra fica aqui: vocabulário, tipos de atendimento, formulário da
// avaliação inicial, métrica de evolução e privacidade dos registros. Telas e ações só leem esta configuração.
export type SpecialtyKey = "FISIOTERAPIA" | "NUTRICAO" | "PSICOLOGIA";
export type FieldType = "text" | "textarea" | "number" | "scale" | "select" | "service";
export type FieldDef = {
  key: string; label: string; type: FieldType; required?: boolean; placeholder?: string;
  options?: string[]; min?: number; max?: number; step?: number; unit?: string; rows?: number;
};
export type StepDef = { title: string; fields: FieldDef[] };
export type ServiceDef = { label: string; color: string };
export type MetricDef = {
  label: string; unit: string; kind: "scale" | "number"; min: number; max: number; step: number;
  better: "lower" | "higher" | "none"; optional: boolean; chartTitle: string;
};
export type SpecialtyConfig = {
  key: SpecialtyKey; label: string; professional: string; council: string; blurb: string;
  terms: {
    session: string; newSession: string; sessionsToday: string; admission: string; evolution: string;
    newEvolution: string; serviceTypes: string; techniques: string; evolutionContent: string;
  };
  services: Record<string, ServiceDef>;
  defaultService: string;
  groupAgenda: { key: string; label: string; newLabel: string; subtitle: string } | null;
  steps: StepDef[];
  keys: { complaint: string; assessment: string; goals: string; metric: string; therapy: string; plannedSessions?: string; frequency?: string };
  requiredKeys: string[];
  bmi?: { weight: string; height: string };
  consentText: string;
  metric: MetricDef;
  restrictedRecords: boolean;
};

const T = (key: string, label: string, o: Partial<FieldDef> = {}): FieldDef => ({ key, label, type: "text", ...o });
const A = (key: string, label: string, o: Partial<FieldDef> = {}): FieldDef => ({ key, label, type: "textarea", rows: 3, ...o });
const N = (key: string, label: string, o: Partial<FieldDef> = {}): FieldDef => ({ key, label, type: "number", ...o });
const S = (key: string, label: string, o: Partial<FieldDef> = {}): FieldDef => ({ key, label, type: "scale", min: 0, max: 10, step: 1, ...o });
const SEL = (key: string, label: string, options: string[], o: Partial<FieldDef> = {}): FieldDef => ({ key, label, type: "select", options, ...o });
const SVC = (key: string, label: string): FieldDef => ({ key, label, type: "service" });

const FISIO: SpecialtyConfig = {
  key: "FISIOTERAPIA", label: "Fisioterapia", professional: "fisioterapeuta", council: "CREFITO",
  blurb: "Admissão em 3 etapas, evolução com gráfico da dor e agenda de Pilates separada.",
  terms: {
    session: "Sessão", newSession: "Nova sessão", sessionsToday: "Sessões hoje", admission: "Admissão", evolution: "Evolução",
    newEvolution: "Nova evolução", serviceTypes: "Tipos de fisioterapia no mês", techniques: "Condutas e técnicas", evolutionContent: "Evolução clínica",
  },
  services: {
    ORTOPEDICA: { label: "Ortopédica", color: "#F26B1D" }, ESPORTIVA: { label: "Esportiva", color: "#D85510" },
    NEUROLOGICA: { label: "Neurológica", color: "#6B6762" }, RESPIRATORIA: { label: "Respiratória", color: "#8E8A86" },
    PILATES: { label: "Pilates clínico", color: "#FF8638" }, RPG: { label: "RPG", color: "#B3420E" },
    PELVICA: { label: "Pélvica", color: "#FFA66B" }, GERIATRICA: { label: "Geriátrica", color: "#4A4743" },
  },
  defaultService: "ORTOPEDICA",
  groupAgenda: { key: "PILATES", label: "Pilates", newLabel: "Nova aula", subtitle: "Aulas e sessões de pilates" },
  steps: [
    { title: "Anamnese", fields: [
      T("referralDoctor", "Médico solicitante"), T("cid", "CID", { placeholder: "Ex.: M54.5" }), T("medicalDiagnosis", "Diagnóstico clínico"),
      A("complaint", "Queixa principal", { required: true }), A("history", "História da doença atual", { rows: 4 }),
      A("comorbidities", "Comorbidades", { rows: 2 }), A("medications", "Medicamentos em uso", { rows: 2 }),
      A("surgeries", "Cirurgias prévias", { rows: 2 }), A("allergies", "Alergias", { rows: 2 }),
      A("habits", "Hábitos e estilo de vida", { rows: 2, placeholder: "Atividade física, tabagismo, sono, profissão..." }),
    ] },
    { title: "Avaliação física", fields: [
      S("painScale", "Dor na escala EVA", { unit: "/10" }), T("painLocation", "Localização da dor"), T("vitalSigns", "Sinais vitais", { placeholder: "PA, FC, SpO₂" }),
      A("posture", "Postura e inspeção"), A("rom", "Amplitude de movimento (ADM)"), A("strength", "Força muscular"), A("specialTests", "Testes especiais"),
    ] },
    { title: "Diagnóstico e plano", fields: [
      A("physioDiagnosis", "Diagnóstico fisioterapêutico", { required: true }), A("goals", "Objetivos do tratamento", { required: true }),
      SVC("therapy", "Tipo de fisioterapia"), N("plannedSessions", "Nº de sessões previstas", { min: 1 }),
      SEL("frequency", "Frequência", ["1x por semana", "2x por semana", "3x por semana", "Diária"]), A("conduct", "Condutas e técnicas planejadas"),
    ] },
  ],
  keys: { complaint: "complaint", assessment: "physioDiagnosis", goals: "goals", metric: "painScale", therapy: "therapy", plannedSessions: "plannedSessions", frequency: "frequency" },
  requiredKeys: ["complaint", "physioDiagnosis", "goals"],
  consentText: "O paciente foi informado sobre a avaliação e o plano de tratamento e consentiu com o atendimento e o uso dos seus dados para o prontuário e laudos.",
  metric: { label: "Dor", unit: "/10", kind: "scale", min: 0, max: 10, step: 1, better: "lower", optional: false, chartTitle: "Evolução da dor" },
  restrictedRecords: false,
};

const NUTRI: SpecialtyConfig = {
  key: "NUTRICAO", label: "Nutrição", professional: "nutricionista", council: "CRN",
  blurb: "Avaliação nutricional com IMC, evolução do peso e consultas de retorno.",
  terms: {
    session: "Consulta", newSession: "Nova consulta", sessionsToday: "Consultas hoje", admission: "Avaliação nutricional", evolution: "Evolução",
    newEvolution: "Nova evolução", serviceTypes: "Tipos de consulta no mês", techniques: "Conduta e orientações", evolutionContent: "Evolução do acompanhamento",
  },
  services: {
    CONSULTA_INICIAL: { label: "Primeira consulta", color: "#F26B1D" }, RETORNO: { label: "Retorno", color: "#D85510" },
    ACOMPANHAMENTO: { label: "Acompanhamento", color: "#6B6762" }, AVALIACAO_CORPORAL: { label: "Avaliação corporal", color: "#FF8638" },
  },
  defaultService: "CONSULTA_INICIAL",
  groupAgenda: null,
  steps: [
    { title: "Anamnese", fields: [
      A("complaint", "Motivo da consulta e objetivo", { required: true }), A("clinicalHistory", "Histórico clínico e familiar", { rows: 3 }),
      A("medications", "Medicamentos e suplementos", { rows: 2 }), A("allergies", "Alergias e intolerâncias", { rows: 2 }),
      A("lifestyle", "Rotina, sono e atividade física", { rows: 3 }),
    ] },
    { title: "Avaliação alimentar e corporal", fields: [
      A("recall24h", "Recordatório alimentar de 24 horas", { rows: 4 }), A("eatingHabits", "Hábitos e preferências alimentares", { rows: 3 }),
      N("weight", "Peso (kg)", { step: 0.1, min: 20, max: 400, unit: "kg" }), N("height", "Altura (cm)", { step: 1, min: 50, max: 250, unit: "cm" }),
      N("waist", "Circunferência da cintura (cm)", { step: 0.1 }), N("bodyFat", "Gordura corporal (%)", { step: 0.1 }),
    ] },
    { title: "Diagnóstico e plano", fields: [
      A("nutritionalDiagnosis", "Diagnóstico nutricional", { required: true }), A("goals", "Metas e objetivos", { required: true }),
      SVC("therapy", "Tipo de atendimento"), SEL("frequency", "Retorno", ["Semanal", "Quinzenal", "Mensal", "A combinar"]),
      A("conduct", "Conduta e orientações"),
    ] },
  ],
  keys: { complaint: "complaint", assessment: "nutritionalDiagnosis", goals: "goals", metric: "weight", therapy: "therapy", frequency: "frequency" },
  requiredKeys: ["complaint", "nutritionalDiagnosis", "goals"],
  bmi: { weight: "weight", height: "height" },
  consentText: "O paciente foi informado sobre o acompanhamento nutricional e consentiu com o atendimento e o uso dos seus dados para o prontuário.",
  metric: { label: "Peso", unit: "kg", kind: "number", min: 20, max: 400, step: 0.1, better: "none", optional: false, chartTitle: "Evolução do peso" },
  restrictedRecords: false,
};

const PSI: SpecialtyConfig = {
  key: "PSICOLOGIA", label: "Psicologia", professional: "psicólogo", council: "CRP",
  blurb: "Acolhimento, registro de sessão e acompanhamento do bem-estar, com registros restritos a quem os escreveu.",
  terms: {
    session: "Sessão", newSession: "Nova sessão", sessionsToday: "Sessões hoje", admission: "Avaliação inicial", evolution: "Registro de sessão",
    newEvolution: "Novo registro", serviceTypes: "Modalidades no mês", techniques: "Tema e intervenções", evolutionContent: "Registro da sessão",
  },
  services: {
    PSICOTERAPIA: { label: "Psicoterapia individual", color: "#F26B1D" }, CASAL: { label: "Terapia de casal", color: "#D85510" },
    FAMILIA: { label: "Terapia familiar", color: "#6B6762" }, AVALIACAO: { label: "Avaliação psicológica", color: "#FF8638" },
    ORIENTACAO: { label: "Orientação de pais", color: "#8E8A86" },
  },
  defaultService: "PSICOTERAPIA",
  groupAgenda: null,
  steps: [
    { title: "Acolhimento", fields: [
      A("complaint", "Demanda e queixa principal", { required: true }), A("history", "Histórico da queixa", { rows: 3 }),
      T("referral", "Encaminhamento (quem indicou)"), A("previousCare", "Acompanhamentos anteriores", { rows: 2, placeholder: "Psicológico ou psiquiátrico" }),
      A("medications", "Medicamentos em uso", { rows: 2 }),
    ] },
    { title: "Avaliação inicial", fields: [
      S("mood", "Bem-estar atual", { unit: "/10" }), T("sleep", "Sono"),
      A("mentalState", "Observações do estado mental", { rows: 3, placeholder: "Humor, afeto, pensamento" }),
      A("support", "Rede de apoio e contexto de vida", { rows: 3 }),
      SEL("risk", "Triagem de risco", ["Sem indicativos", "Atenção", "Risco: requer conduta imediata"]), A("riskNotes", "Observações sobre risco", { rows: 2 }),
    ] },
    { title: "Hipótese e plano", fields: [
      A("formulation", "Hipótese diagnóstica ou formulação inicial", { required: true }), A("goals", "Objetivos terapêuticos", { required: true }),
      SVC("therapy", "Modalidade"), T("approach", "Abordagem teórica"), SEL("frequency", "Frequência", ["Semanal", "Quinzenal", "Mensal"]),
      A("conduct", "Combinados e encaminhamentos"),
    ] },
  ],
  keys: { complaint: "complaint", assessment: "formulation", goals: "goals", metric: "mood", therapy: "therapy", frequency: "frequency" },
  requiredKeys: ["complaint", "formulation", "goals"],
  consentText: "O paciente foi informado sobre o processo psicoterapêutico, o sigilo profissional e seus limites, e consentiu com o atendimento e o registro das informações.",
  metric: { label: "Bem-estar", unit: "/10", kind: "scale", min: 0, max: 10, step: 1, better: "higher", optional: true, chartTitle: "Evolução do bem-estar" },
  restrictedRecords: true,
};

export const SPECIALTIES: Record<SpecialtyKey, SpecialtyConfig> = { FISIOTERAPIA: FISIO, NUTRICAO: NUTRI, PSICOLOGIA: PSI };
export const SPECIALTY_KEYS = Object.keys(SPECIALTIES) as SpecialtyKey[];
export const isSpecialty = (k: string): k is SpecialtyKey => k in SPECIALTIES;
export const getSpecialty = (k?: string | null): SpecialtyConfig => (k && isSpecialty(k) ? SPECIALTIES[k] : FISIO);

const ALL_SERVICES: Record<string, ServiceDef> = Object.assign({}, ...SPECIALTY_KEYS.map((k) => SPECIALTIES[k].services));
export const serviceLabel = (k: string) => ALL_SERVICES[k]?.label ?? (k || "—");
export const serviceColor = (k: string) => ALL_SERVICES[k]?.color ?? "#8E8A86";

/** Valor formatado da métrica (ex.: "8/10" ou "72,5 kg"). */
export function formatMetric(v: number | null | undefined, m: MetricDef) {
  if (v === null || v === undefined) return "—";
  return m.kind === "scale" ? `${v}${m.unit}` : `${String(v).replace(".", ",")} ${m.unit}`;
}

/** IMC a partir de peso (kg) e altura (cm); null se faltar dado. */
export function bmi(weightKg: number, heightCm: number) {
  if (!(weightKg > 0) || !(heightCm > 0)) return null;
  const m = heightCm / 100;
  return Math.round((weightKg / (m * m)) * 10) / 10;
}

/** Registros clínicos restritos (ex.: psicologia): só o autor lê o conteúdo. */
export const canReadRecord = (s: SpecialtyConfig, userId: string, authorId: string | null) => !s.restrictedRecords || authorId === userId;
