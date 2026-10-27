import { beforeEach, describe, expect, it, vi } from "vitest";
import { prisma } from "@/lib/prisma";
import { POST } from "@/app/api/webhooks/asaas/route";
import { clearDb } from "./helpers";

const TOKEN = "t".repeat(40);
const call = (body: unknown, token: string | null = TOKEN) =>
  POST(new Request("http://localhost/api/webhooks/asaas", {
    method: "POST", headers: token ? { "asaas-access-token": token } : {}, body: typeof body === "string" ? body : JSON.stringify(body),
  }));
const pay = (over: Record<string, unknown> = {}) => ({
  id: "pay_1", customer: "cus_1", subscription: "sub_1", value: 59, status: "PENDING", dueDate: "2026-11-10", billingType: "PIX", invoiceUrl: "https://asaas.test/i/1", ...over,
});
const ev = (id: string, event: string, payment?: unknown) => ({ id, event, payment });
const clinic = () => prisma.clinic.findFirstOrThrow({ include: { payments: true } });

beforeEach(async () => {
  await clearDb();
  vi.stubEnv("ASAAS_WEBHOOK_TOKEN", TOKEN);
  await prisma.clinic.create({ data: { name: "Clínica", asaasCustomerId: "cus_1", asaasSubscriptionId: "sub_1", plan: "INDIVIDUAL" } });
});

describe("autenticação do webhook", () => {
  it("503 se o token não estiver configurado", async () => {
    vi.stubEnv("ASAAS_WEBHOOK_TOKEN", "");
    expect((await call(ev("e1", "PAYMENT_CREATED", pay()))).status).toBe(503);
  });
  it("401 sem token ou com token errado", async () => {
    expect((await call(ev("e1", "PAYMENT_CREATED", pay()), null)).status).toBe(401);
    expect((await call(ev("e1", "PAYMENT_CREATED", pay()), "x".repeat(40))).status).toBe(401);
    expect((await clinic()).payments).toHaveLength(0);
  });
  it("400 para corpo inválido", async () => {
    expect((await call("não é json")).status).toBe(400);
    expect((await call({ event: "PAYMENT_CREATED" })).status).toBe(400);
  });
});

describe("eventos de pagamento", () => {
  it("cobrança criada deixa a assinatura aguardando o 1º pagamento", async () => {
    expect((await call(ev("e1", "PAYMENT_CREATED", pay()))).status).toBe(200);
    const c = await clinic();
    expect(c.subscriptionStatus).toBe("PENDING");
    expect(c.payments[0]).toMatchObject({ asaasId: "pay_1", value: 5900, status: "PENDING", invoiceUrl: "https://asaas.test/i/1" });
  });
  it("pagamento recebido ativa a assinatura e define 'pago até'", async () => {
    await call(ev("e1", "PAYMENT_CREATED", pay()));
    await call(ev("e2", "PAYMENT_RECEIVED", pay({ status: "RECEIVED", paymentDate: "2026-11-09" })));
    const c = await clinic();
    expect(c.subscriptionStatus).toBe("ACTIVE");
    expect(c.payments[0].status).toBe("PAID");
    expect([c.currentPeriodEnd!.getMonth(), c.currentPeriodEnd!.getDate()]).toEqual([11, 10]);
  });
  it("evento repetido é ignorado", async () => {
    await call(ev("e1", "PAYMENT_RECEIVED", pay({ status: "RECEIVED" })));
    const r = await call(ev("e1", "PAYMENT_RECEIVED", pay({ status: "RECEIVED" })));
    expect(await r.json()).toEqual({ result: "duplicate" });
    expect((await clinic()).payments).toHaveLength(1);
  });
  it("'vencida' que chega depois do pagamento não desfaz o pagamento", async () => {
    await call(ev("e1", "PAYMENT_RECEIVED", pay({ status: "RECEIVED" })));
    await call(ev("e2", "PAYMENT_OVERDUE", pay({ status: "OVERDUE" })));
    const c = await clinic();
    expect(c.payments[0].status).toBe("PAID");
    expect(c.subscriptionStatus).toBe("ACTIVE");
  });
  it("vencida marca a assinatura e o pagamento seguinte regulariza", async () => {
    await call(ev("e1", "PAYMENT_OVERDUE", pay({ status: "OVERDUE" })));
    expect((await clinic()).subscriptionStatus).toBe("OVERDUE");
    await call(ev("e2", "PAYMENT_RECEIVED", pay({ status: "RECEIVED" })));
    expect((await clinic()).subscriptionStatus).toBe("ACTIVE");
  });
  it("cobrança excluída fica cancelada", async () => {
    await call(ev("e1", "PAYMENT_CREATED", pay()));
    await call(ev("e2", "PAYMENT_DELETED", pay()));
    expect((await clinic()).payments[0].status).toBe("CANCELED");
  });
  it("cobrança de outro cliente da conta Asaas é ignorada", async () => {
    const r = await call(ev("e1", "PAYMENT_RECEIVED", pay({ customer: "cus_outro", subscription: "sub_outra", status: "RECEIVED" })));
    expect(await r.json()).toEqual({ result: "ignored" });
    expect((await clinic()).payments).toHaveLength(0);
  });
  it("localiza a clínica pelo cliente quando a cobrança não vem de assinatura", async () => {
    await call(ev("e1", "PAYMENT_CREATED", pay({ subscription: null })));
    expect((await clinic()).payments).toHaveLength(1);
  });
});

describe("eventos de assinatura", () => {
  it("assinatura removida cancela a clínica", async () => {
    await call(ev("e1", "PAYMENT_RECEIVED", pay({ status: "RECEIVED" })));
    await call({ id: "e2", event: "SUBSCRIPTION_DELETED", subscription: { id: "sub_1" } });
    const c = await clinic();
    expect(c.subscriptionStatus).toBe("CANCELED");
    expect(c.canceledAt).not.toBeNull();
  });
});
