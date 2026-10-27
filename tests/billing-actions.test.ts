import { beforeEach, describe, expect, it, vi } from "vitest";
import { prisma } from "@/lib/prisma";
import { asaas, AsaasError } from "@/lib/asaas";
import { cancelSubscription, startSubscription, syncSubscription } from "@/actions-billing";
import { clearDb, fd, makeClinic, makeUser } from "./helpers";
import { state } from "./tenant-mock";

vi.mock("next/cache", async () => (await import("./tenant-mock")).cacheMock());
vi.mock("next/navigation", async () => (await import("./tenant-mock")).navigationMock());
vi.mock("@/lib/tenant", async () => (await import("./tenant-mock")).tenantMock());
vi.mock("@/lib/asaas", () => {
  class AsaasError extends Error { constructor(public status: number, message: string) { super(message); } }
  return { AsaasError, asaas: { createCustomer: vi.fn(), createSubscription: vi.fn(), listSubscriptionPayments: vi.fn(), cancelSubscription: vi.fn() } };
});

const m = vi.mocked(asaas);
const form = { plan: "INDIVIDUAL", billingType: "PIX", name: "Clínica Teste", document: "11.222.333/0001-81", email: "Financeiro@Clinica.com", phone: "(61) 99999-1111" };
const asaasPayment = { id: "pay_1", value: 59, status: "PENDING", dueDate: "2026-11-10", billingType: "PIX", invoiceUrl: "https://asaas.test/i/1" };
let clinic: Awaited<ReturnType<typeof makeClinic>>;

beforeEach(async () => {
  await clearDb(); vi.clearAllMocks();
  clinic = await makeClinic({ subscriptionStatus: "TRIAL", trialEndsAt: new Date(Date.now() + 5 * 864e5) });
  state.userId = (await makeUser(clinic.id, { role: "ADMIN" })).id;
  m.createCustomer.mockResolvedValue({ id: "cus_1" }); m.createSubscription.mockResolvedValue({ id: "sub_1" });
  m.listSubscriptionPayments.mockResolvedValue([asaasPayment]); m.cancelSubscription.mockResolvedValue({ deleted: true });
});
const current = () => prisma.clinic.findUniqueOrThrow({ where: { id: clinic.id }, include: { payments: true } });

describe("startSubscription", () => {
  it("valida os dados antes de chamar a Asaas", async () => {
    for (const bad of [{ plan: "X" }, { billingType: "BOLETO2" }, { document: "123" }, { email: "sem-arroba" }, { name: "A" }]) {
      expect((await startSubscription(undefined, fd({ ...form, ...bad })))?.error).toBeTruthy();
    }
    expect(m.createCustomer).not.toHaveBeenCalled();
  });
  it("durante o teste grátis, cria cliente e assinatura e guarda tudo na clínica certa", async () => {
    await expect(startSubscription(undefined, fd(form))).rejects.toThrow("REDIRECT:/assinatura");
    expect(m.createCustomer).toHaveBeenCalledWith(expect.objectContaining({ cpfCnpj: "11222333000181", email: "financeiro@clinica.com", externalReference: clinic.id }));
    expect(m.createSubscription.mock.calls[0][0]).toMatchObject({ customer: "cus_1", billingType: "PIX", value: 59, cycle: "MONTHLY", externalReference: clinic.id });
    expect(await current()).toMatchObject({ plan: "INDIVIDUAL", asaasCustomerId: "cus_1", asaasSubscriptionId: "sub_1", subscriptionStatus: "PENDING", document: "11222333000181" });
    expect((await current()).payments).toHaveLength(1);
  });
  it("não cria uma segunda assinatura", async () => {
    await expect(startSubscription(undefined, fd(form))).rejects.toThrow("REDIRECT");
    vi.clearAllMocks();
    expect((await startSubscription(undefined, fd(form)))?.error).toMatch(/já tem uma assinatura/i);
    expect(m.createSubscription).not.toHaveBeenCalled();
  });
  it("mostra o erro da Asaas e não grava nada", async () => {
    m.createCustomer.mockRejectedValueOnce(new AsaasError(400, "CPF/CNPJ inválido"));
    expect((await startSubscription(undefined, fd(form)))?.error).toBe("CPF/CNPJ inválido");
    expect((await current()).asaasCustomerId).toBeNull();
  });
  it("reaproveita o cliente ao assinar de novo depois de cancelar", async () => {
    await expect(startSubscription(undefined, fd(form))).rejects.toThrow("REDIRECT");
    await cancelSubscription(undefined, fd({}));
    vi.clearAllMocks(); m.createSubscription.mockResolvedValue({ id: "sub_2" }); m.listSubscriptionPayments.mockResolvedValue([]);
    await expect(startSubscription(undefined, fd(form))).rejects.toThrow("REDIRECT");
    expect(m.createCustomer).not.toHaveBeenCalled();
    expect(m.createSubscription.mock.calls[0][0].customer).toBe("cus_1");
    expect((await current()).canceledAt).toBeNull();
  });
  it("só o administrador mexe na assinatura", async () => {
    state.userId = (await makeUser(clinic.id)).id;
    await expect(startSubscription(undefined, fd(form))).rejects.toThrow("REDIRECT:/dashboard");
  });
});

describe("cancelSubscription e syncSubscription", () => {
  beforeEach(async () => { await expect(startSubscription(undefined, fd(form))).rejects.toThrow("REDIRECT"); });
  it("cancela na Asaas e marca a clínica como cancelada", async () => {
    expect(await cancelSubscription(undefined, fd({}))).toEqual({ ok: "Assinatura cancelada." });
    expect(m.cancelSubscription).toHaveBeenCalledWith("sub_1");
    expect((await current()).subscriptionStatus).toBe("CANCELED");
  });
  it("404 na Asaas ainda cancela; outro erro mantém a assinatura", async () => {
    m.cancelSubscription.mockRejectedValueOnce(new AsaasError(404, "não encontrada"));
    expect((await cancelSubscription(undefined, fd({})))?.ok).toBeTruthy();
    await prisma.clinic.update({ where: { id: clinic.id }, data: { canceledAt: null } });
    m.cancelSubscription.mockRejectedValueOnce(new AsaasError(500, "indisponível"));
    expect((await cancelSubscription(undefined, fd({})))?.error).toBe("indisponível");
    expect((await current()).canceledAt).toBeNull();
  });
  it("traz da Asaas uma cobrança paga que o webhook perdeu", async () => {
    m.listSubscriptionPayments.mockResolvedValue([{ ...asaasPayment, status: "RECEIVED", paymentDate: "2026-11-09" }]);
    expect(await syncSubscription(undefined, fd({}))).toEqual({ ok: "Atualizado." });
    expect((await current()).subscriptionStatus).toBe("ACTIVE");
  });
});
