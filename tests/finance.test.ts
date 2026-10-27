import { describe, it, expect } from "vitest";
import { balances, receivedByMethod } from "@/lib/finance";

const pay = (amount: number, status: string, payerType: string, insurerName: string | null = null, method: string | null = null, paidAt: Date | null = null) =>
  ({ amount, status, method, paidAt, patient: { payerType, insurerName } });

describe("balances", () => {
  const rows = [
    pay(10000, "PAGO", "PARTICULAR"),
    pay(5000, "PENDENTE", "PARTICULAR"),
    pay(20000, "PENDENTE", "PLANO_SAUDE", "Unimed"),
    pay(3000, "PAGO", "PLANO_SAUDE", "Unimed"),
    pay(7000, "PENDENTE", "PLANO_SAUDE", "Bradesco Saúde"),
    pay(4000, "PENDENTE", "PLANO_SAUDE", null),
    pay(9000, "PENDENTE", "AMOR_SAUDE"),
  ];
  const { byPayer, byInsurer } = balances(rows);

  it("soma recebido e a receber por origem", () => {
    expect(byPayer.PARTICULAR).toEqual({ received: 10000, pending: 5000 });
    expect(byPayer.AMOR_SAUDE).toEqual({ received: 0, pending: 9000 });
    expect(byPayer.PLANO_SAUDE).toEqual({ received: 3000, pending: 31000 });
  });
  it("detalha apenas planos de saúde por operadora", () => {
    expect(byInsurer.Unimed).toEqual({ received: 3000, pending: 20000 });
    expect(byInsurer["Bradesco Saúde"]).toEqual({ received: 0, pending: 7000 });
    expect(byInsurer["Sem operadora"]).toEqual({ received: 0, pending: 4000 });
    expect(Object.keys(byInsurer)).not.toContain("PARTICULAR");
  });
});

describe("receivedByMethod", () => {
  const since = new Date("2026-10-01T00:00:00");
  it("agrupa por forma, ignora pendentes e pagamentos antes do período", () => {
    const rows = [
      pay(100, "PAGO", "PARTICULAR", null, "CARTAO_CREDITO", new Date("2026-10-05")),
      pay(200, "PAGO", "PARTICULAR", null, "CARTAO_DEBITO", new Date("2026-10-06")),
      pay(300, "PAGO", "PARTICULAR", null, "CARTAO_CREDITO", new Date("2026-10-07")),
      pay(400, "PAGO", "PARTICULAR", null, "PIX", new Date("2026-09-30")),
      pay(500, "PENDENTE", "PARTICULAR", null, null, null),
      pay(600, "PAGO", "PARTICULAR", null, null, new Date("2026-10-08")),
    ];
    expect(receivedByMethod(rows, since)).toEqual({ CARTAO_CREDITO: 400, CARTAO_DEBITO: 200, PIX: 600 });
  });
});
