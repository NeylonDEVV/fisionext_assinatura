// VALORES DE EXEMPLO: defina os preços reais depois da validação com os fisioterapeutas.
export const PLANS: Record<string, { label: string; description: string; priceCents: number }> = {
  INDIVIDUAL: { label: "Individual", description: "1 profissional", priceCents: 5900 },
  CLINICA: { label: "Clínica", description: "Até 3 profissionais", priceCents: 14900 },
};
export const planLabel = (k: string) => PLANS[k]?.label ?? "—";
