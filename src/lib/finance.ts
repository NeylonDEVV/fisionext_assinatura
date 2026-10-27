export type PaymentRow = {
  amount: number; status: string; dueDate: Date; paidAt: Date | null; method: string | null;
  patient: { payerType: string; insurerName: string | null };
};
export type Bal = { received: number; pending: number };
type Row = Pick<PaymentRow, "amount" | "status" | "method" | "paidAt" | "patient">;

/** Saldo (recebido e a receber) por origem do paciente e, para planos de saúde, por operadora. */
export function balances(rows: Row[]) {
  const byPayer: Record<string, Bal> = {}, byInsurer: Record<string, Bal> = {};
  const add = (m: Record<string, Bal>, k: string, p: Row) => {
    const b = (m[k] ??= { received: 0, pending: 0 });
    if (p.status === "PAGO") b.received += p.amount; else b.pending += p.amount;
  };
  for (const p of rows) {
    add(byPayer, p.patient.payerType, p);
    if (p.patient.payerType === "PLANO_SAUDE") add(byInsurer, p.patient.insurerName ?? "Sem operadora", p);
  }
  return { byPayer, byInsurer };
}

/** Recebido por forma de pagamento desde `since` (pendentes e pagamentos anteriores são ignorados). */
export function receivedByMethod(rows: Row[], since: Date) {
  const out: Record<string, number> = {};
  for (const p of rows) {
    if (p.status !== "PAGO" || !p.paidAt || p.paidAt < since) continue;
    const m = p.method ?? "PIX";
    out[m] = (out[m] ?? 0) + p.amount;
  }
  return out;
}

/** Totais do financeiro: recebido no mês, em atraso, a vencer, saldos e recebido por forma de pagamento. */
export function computeBalances(all: PaymentRow[], now = new Date()) {
  const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());
  const som = new Date(now.getFullYear(), now.getMonth(), 1);
  const byMethod = receivedByMethod(all, som);
  const received = Object.values(byMethod).reduce((s, v) => s + v, 0);
  let overdue = 0, upcoming = 0;
  for (const p of all) {
    if (p.status === "PAGO") continue;
    if (p.dueDate < today) overdue += p.amount; else upcoming += p.amount;
  }
  return { received, overdue, upcoming, byMethod, ...balances(all) };
}
