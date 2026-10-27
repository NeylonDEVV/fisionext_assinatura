import { describe, expect, it } from "vitest";
import { computeBalances, type PaymentRow } from "@/lib/finance";

const now = new Date(2026, 9, 15, 12); // 15/out/2026
const row = (o: Partial<PaymentRow> & { payerType: string; insurerName?: string | null }): PaymentRow => ({
  amount: 10000, status: "PENDENTE", dueDate: new Date(2026, 9, 20), paidAt: null, method: null,
  patient: { payerType: o.payerType, insurerName: o.insurerName ?? null }, ...o,
} as PaymentRow);

const data: PaymentRow[] = [
  row({ payerType: "AMOR_SAUDE", amount: 15000, status: "PAGO", paidAt: new Date(2026, 9, 2), method: "PIX" }),
  row({ payerType: "PLANO_SAUDE", insurerName: "Unimed", amount: 18000, status: "PAGO", paidAt: new Date(2026, 8, 20), method: "CARTAO_CREDITO" }),
  row({ payerType: "PLANO_SAUDE", insurerName: "Unimed", amount: 20000, dueDate: new Date(2026, 9, 10) }),
  row({ payerType: "PARTICULAR", amount: 12000, dueDate: new Date(2026, 9, 20) }),
];

describe("computeBalances", () => {
  const r = computeBalances(data, now);
  it("totais gerais", () => {
    expect(r.received).toBe(15000); // só o que foi pago neste mês
    expect(r.overdue).toBe(20000);
    expect(r.upcoming).toBe(12000);
  });
  it("saldo por origem inclui todo o histórico", () => {
    expect(r.byPayer.AMOR_SAUDE).toEqual({ received: 15000, pending: 0 });
    expect(r.byPayer.PLANO_SAUDE).toEqual({ received: 18000, pending: 20000 });
    expect(r.byPayer.PARTICULAR).toEqual({ received: 0, pending: 12000 });
  });
  it("saldo por operadora só para plano de saúde", () => {
    expect(Object.keys(r.byInsurer)).toEqual(["Unimed"]);
    expect(r.byInsurer.Unimed).toEqual({ received: 18000, pending: 20000 });
  });
  it("recebido no mês por forma de pagamento", () => expect(r.byMethod).toEqual({ PIX: 15000 }));
  it("plano sem operadora cai em 'Sem operadora'", () => {
    const x = computeBalances([row({ payerType: "PLANO_SAUDE" })], now);
    expect(x.byInsurer["Sem operadora"].pending).toBe(10000);
  });
});
