import { describe, expect, it } from "vitest";
import { addMonths, deriveClinicState, mergePaymentStatus, normalizePaymentStatus } from "@/lib/billing";

const d = (y: number, m: number, day: number) => new Date(y, m - 1, day, 12);

describe("normalizePaymentStatus", () => {
  it("pagamento recebido ou confirmado vira PAID", () => {
    for (const s of ["RECEIVED", "CONFIRMED", "RECEIVED_IN_CASH"]) expect(normalizePaymentStatus(s)).toBe("PAID");
  });
  it("vencida, estorno e exclusão", () => {
    expect(normalizePaymentStatus("OVERDUE")).toBe("OVERDUE");
    expect(normalizePaymentStatus("REFUNDED")).toBe("REFUNDED");
    expect(normalizePaymentStatus("CHARGEBACK_REQUESTED")).toBe("REFUNDED");
    expect(normalizePaymentStatus("PENDING", "PAYMENT_DELETED")).toBe("CANCELED");
    expect(normalizePaymentStatus("RECEIVED", "PAYMENT_REFUNDED")).toBe("REFUNDED");
  });
  it("status desconhecido ou aguardando análise fica PENDING", () => {
    expect(normalizePaymentStatus("PENDING")).toBe("PENDING");
    expect(normalizePaymentStatus("AWAITING_RISK_ANALYSIS")).toBe("PENDING");
    expect(normalizePaymentStatus(undefined)).toBe("PENDING");
  });
});

describe("mergePaymentStatus (eventos fora de ordem)", () => {
  it("'vencida' ou 'aberta' atrasado não desfaz um pagamento", () => {
    expect(mergePaymentStatus("PAID", "OVERDUE")).toBe("PAID");
    expect(mergePaymentStatus("PAID", "PENDING")).toBe("PAID");
  });
  it("estorno e cancelamento são mantidos, mas um pagamento novo vence", () => {
    expect(mergePaymentStatus("REFUNDED", "PENDING")).toBe("REFUNDED");
    expect(mergePaymentStatus("CANCELED", "OVERDUE")).toBe("CANCELED");
    expect(mergePaymentStatus("CANCELED", "PAID")).toBe("PAID");
  });
  it("transições normais", () => {
    expect(mergePaymentStatus(undefined, "PENDING")).toBe("PENDING");
    expect(mergePaymentStatus("PENDING", "OVERDUE")).toBe("OVERDUE");
    expect(mergePaymentStatus("OVERDUE", "PAID")).toBe("PAID");
    expect(mergePaymentStatus("PAID", "REFUNDED")).toBe("REFUNDED");
  });
});

describe("addMonths", () => {
  it("soma meses e respeita o fim do mês", () => {
    expect(addMonths(d(2026, 10, 10), 1).getMonth()).toBe(10);
    const feb = addMonths(d(2026, 1, 31), 1);
    expect([feb.getMonth(), feb.getDate()]).toEqual([1, 28]);
    expect(addMonths(d(2026, 12, 15), 1).getFullYear()).toBe(2027);
  });
});

describe("deriveClinicState", () => {
  const sub = { hasSubscription: true, canceledAt: null };
  it("sem assinatura", () => expect(deriveClinicState([], { hasSubscription: false, canceledAt: null }).status).toBe("NONE"));
  it("assinatura criada, ainda sem pagamento", () =>
    expect(deriveClinicState([{ status: "PENDING", dueDate: d(2026, 11, 10) }], sub).status).toBe("PENDING"));
  it("em dia depois do primeiro pagamento, com 'pago até' um mês após o vencimento", () => {
    const r = deriveClinicState([{ status: "PAID", dueDate: d(2026, 11, 10) }, { status: "PENDING", dueDate: d(2026, 12, 10) }], sub);
    expect(r.status).toBe("ACTIVE");
    expect([r.currentPeriodEnd!.getMonth(), r.currentPeriodEnd!.getDate()]).toEqual([11, 10]);
  });
  it("fatura vencida deixa a assinatura vencida, mesmo com pagamentos antigos", () =>
    expect(deriveClinicState([{ status: "PAID", dueDate: d(2026, 11, 10) }, { status: "OVERDUE", dueDate: d(2026, 12, 10) }], sub).status).toBe("OVERDUE"));
  it("cancelamento vence tudo", () =>
    expect(deriveClinicState([{ status: "PAID", dueDate: d(2026, 11, 10) }], { hasSubscription: true, canceledAt: new Date() }).status).toBe("CANCELED"));
});

import { hasAccess, trialDaysLeft } from "@/lib/billing";

describe("teste grátis", () => {
  const future = new Date(Date.now() + 5 * 864e5), past = new Date(Date.now() - 864e5);
  it("sem assinatura: em teste enquanto o prazo não vence, depois teste encerrado", () => {
    expect(deriveClinicState([], { hasSubscription: false, canceledAt: null, trialEndsAt: future }).status).toBe("TRIAL");
    expect(deriveClinicState([], { hasSubscription: false, canceledAt: null, trialEndsAt: past }).status).toBe("TRIAL_ENDED");
    expect(deriveClinicState([], { hasSubscription: false, canceledAt: null }).status).toBe("NONE");
  });
  it("assinar durante o teste leva ao fluxo normal da assinatura", () => {
    expect(deriveClinicState([{ status: "PENDING", dueDate: new Date() }], { hasSubscription: true, canceledAt: null, trialEndsAt: future }).status).toBe("PENDING");
  });
});

describe("hasAccess", () => {
  const c = (subscriptionStatus: string, trialEndsAt: Date | null = null, currentPeriodEnd: Date | null = null) => ({ subscriptionStatus, trialEndsAt, currentPeriodEnd });
  const future = new Date(Date.now() + 864e5), past = new Date(Date.now() - 864e5);
  it("assinatura ativa, aguardando o 1º pagamento ou vencida (tolerância) liberam o acesso", () => {
    for (const s of ["ACTIVE", "PENDING", "OVERDUE"]) expect(hasAccess(c(s))).toBe(true);
  });
  it("teste grátis libera até o prazo e bloqueia depois", () => {
    expect(hasAccess(c("TRIAL", future))).toBe(true);
    expect(hasAccess(c("TRIAL", past))).toBe(false);
    expect(hasAccess(c("TRIAL_ENDED", past))).toBe(false);
    expect(hasAccess(c("NONE", null))).toBe(false);
  });
  it("cancelada ainda usa até o fim do período pago", () => {
    expect(hasAccess(c("CANCELED", null, future))).toBe(true);
    expect(hasAccess(c("CANCELED", null, past))).toBe(false);
    expect(hasAccess(c("CANCELED"))).toBe(false);
  });
  it("trialDaysLeft arredonda para cima e nunca é negativo", () => {
    expect(trialDaysLeft(new Date(Date.now() + 2.2 * 864e5))).toBe(3);
    expect(trialDaysLeft(new Date(Date.now() - 864e5))).toBe(0);
  });
});
