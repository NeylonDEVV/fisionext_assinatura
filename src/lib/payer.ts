export const PAYERS = {
  PARTICULAR: { label: "Particular", cls: "bg-ink-100 text-ink-700", hint: "Paga a sessão diretamente" },
  PLANO_SAUDE: { label: "Plano de saúde", cls: "bg-ink-700 text-white", hint: "Convênio com operadora" },
  PARCERIA: { label: "Parceria", cls: "bg-brand-100 text-brand-700", hint: "Pacientes vindos de parceiros" },
} as const;
export type PayerKey = keyof typeof PAYERS;
export const payerLabel = (k: string) => PAYERS[k as PayerKey]?.label ?? k;
export const payerCls = (k: string) => PAYERS[k as PayerKey]?.cls ?? "bg-ink-100 text-ink-700";

export const METHODS: Record<string, string> = {
  PIX: "PIX",
  DINHEIRO: "Dinheiro",
  CARTAO_CREDITO: "Cartão de crédito",
  CARTAO_DEBITO: "Cartão de débito",
};
export const methodLabel = (k?: string | null) => (k ? METHODS[k] ?? (k === "CARTAO" ? "Cartão" : k) : "—");
