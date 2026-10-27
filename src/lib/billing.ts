// Regras puras da assinatura (sem banco, sem rede): fáceis de testar.
export type PaymentStatus = "PENDING" | "PAID" | "OVERDUE" | "REFUNDED" | "CANCELED";
export type SubscriptionStatus = "NONE" | "TRIAL" | "TRIAL_ENDED" | "PENDING" | "ACTIVE" | "OVERDUE" | "CANCELED";

/** Converte o status da Asaas (e o evento) para o nosso. O evento tem prioridade em exclusão e estorno. */
export function normalizePaymentStatus(asaasStatus: string | undefined, event?: string): PaymentStatus {
  if (event === "PAYMENT_DELETED") return "CANCELED";
  if (event === "PAYMENT_REFUNDED") return "REFUNDED";
  switch (asaasStatus) {
    case "RECEIVED": case "CONFIRMED": case "RECEIVED_IN_CASH": return "PAID";
    case "OVERDUE": return "OVERDUE";
    case "REFUNDED": case "REFUND_REQUESTED": case "REFUND_IN_PROGRESS":
    case "CHARGEBACK_REQUESTED": case "CHARGEBACK_DISPUTE": case "AWAITING_CHARGEBACK_REVERSAL": return "REFUNDED";
    default: return "PENDING";
  }
}

/** Os eventos da Asaas podem chegar fora de ordem: um 'vencida' atrasado nunca desfaz um 'paga'. */
export function mergePaymentStatus(current: PaymentStatus | undefined, incoming: PaymentStatus): PaymentStatus {
  if (!current) return incoming;
  if (current === "PAID" && (incoming === "PENDING" || incoming === "OVERDUE")) return "PAID";
  if ((current === "REFUNDED" || current === "CANCELED") && incoming !== "PAID") return current;
  return incoming;
}

export function addMonths(date: Date, n: number) {
  const d = new Date(date.getFullYear(), date.getMonth() + n, 1, 12);
  const last = new Date(d.getFullYear(), d.getMonth() + 1, 0).getDate();
  d.setDate(Math.min(date.getDate(), last));
  return d;
}

/** Estado da assinatura, sempre recalculado a partir das cobranças (por isso é à prova de reentrega e de ordem). */
export function deriveClinicState(
  payments: { status: string; dueDate: Date }[],
  opts: { hasSubscription: boolean; canceledAt: Date | null; trialEndsAt?: Date | null; now?: Date },
): { status: SubscriptionStatus; currentPeriodEnd: Date | null } {
  const now = opts.now ?? new Date();
  const paid = payments.filter((p) => p.status === "PAID");
  const latest = paid.reduce<Date | null>((m, p) => (!m || p.dueDate > m ? p.dueDate : m), null);
  const currentPeriodEnd = latest ? addMonths(latest, 1) : null;
  let status: SubscriptionStatus;
  if (opts.canceledAt) status = "CANCELED";
  else if (!opts.hasSubscription) status = opts.trialEndsAt ? (opts.trialEndsAt > now ? "TRIAL" : "TRIAL_ENDED") : "NONE";
  else if (payments.some((p) => p.status === "OVERDUE")) status = "OVERDUE";
  else if (paid.length > 0) status = "ACTIVE";
  else status = "PENDING";
  return { status, currentPeriodEnd };
}

/** A clínica pode usar o sistema? Assinatura em dia (ou aguardando o 1º pagamento) e teste grátis valem; vencida tem tolerância. */
export function hasAccess(c: { subscriptionStatus: string; trialEndsAt: Date | null; currentPeriodEnd: Date | null }, now = new Date()) {
  switch (c.subscriptionStatus) {
    case "ACTIVE": case "PENDING": case "OVERDUE": return true;
    case "CANCELED": return !!c.currentPeriodEnd && c.currentPeriodEnd > now;
    default: return !!c.trialEndsAt && c.trialEndsAt > now; // NONE, TRIAL, TRIAL_ENDED
  }
}
export const trialDaysLeft = (trialEndsAt: Date, now = new Date()) => Math.max(0, Math.ceil((trialEndsAt.getTime() - now.getTime()) / 864e5));

export const SUBSCRIPTION_LABEL: Record<string, { label: string; cls: string }> = {
  NONE: { label: "Sem assinatura", cls: "bg-ink-100 text-ink-600" },
  TRIAL: { label: "Teste grátis", cls: "bg-brand-100 text-brand-700" },
  TRIAL_ENDED: { label: "Teste encerrado", cls: "bg-red-100 text-red-700" },
  PENDING: { label: "Aguardando 1º pagamento", cls: "bg-brand-100 text-brand-700" },
  ACTIVE: { label: "Em dia", cls: "bg-emerald-100 text-emerald-700" },
  OVERDUE: { label: "Pagamento vencido", cls: "bg-red-100 text-red-700" },
  CANCELED: { label: "Cancelada", cls: "bg-ink-200 text-ink-500" },
};
export const PAYMENT_LABEL: Record<string, { label: string; cls: string }> = {
  PENDING: { label: "Aberta", cls: "bg-brand-100 text-brand-700" },
  PAID: { label: "Paga", cls: "bg-emerald-100 text-emerald-700" },
  OVERDUE: { label: "Vencida", cls: "bg-red-100 text-red-700" },
  REFUNDED: { label: "Estornada", cls: "bg-ink-200 text-ink-600" },
  CANCELED: { label: "Cancelada", cls: "bg-ink-200 text-ink-500" },
};
export const BILLING_TYPES: Record<string, string> = {
  PIX: "Pix",
  BOLETO: "Boleto",
  UNDEFINED: "Pix, boleto ou cartão (escolho na fatura)",
};
