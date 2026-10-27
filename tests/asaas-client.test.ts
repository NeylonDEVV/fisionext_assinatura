import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { asaas, AsaasError } from "@/lib/asaas";

const json = (body: unknown, status = 200) => new Response(JSON.stringify(body), { status, headers: { "Content-Type": "application/json" } });
let fetchMock: ReturnType<typeof vi.fn>;

beforeEach(() => {
  fetchMock = vi.fn(async () => json({ id: "cus_1" }));
  vi.stubGlobal("fetch", fetchMock);
  vi.stubEnv("ASAAS_API_KEY", "aact_hmlg_abc123");
  vi.stubEnv("ASAAS_ENV", "sandbox");
});
afterEach(() => { vi.unstubAllGlobals(); vi.unstubAllEnvs(); });

describe("cliente da Asaas", () => {
  it("usa a URL do sandbox, o cabeçalho access_token (com $) e o User-Agent", async () => {
    await asaas.createCustomer({ name: "Clínica", cpfCnpj: "11222333000181" });
    const [url, init] = fetchMock.mock.calls[0];
    expect(url).toBe("https://api-sandbox.asaas.com/v3/customers");
    expect(init.method).toBe("POST");
    expect(init.headers.access_token).toBe("$aact_hmlg_abc123");
    expect(init.headers["User-Agent"]).toMatch(/^FisioNext\/1\.0/);
    expect(JSON.parse(init.body)).toMatchObject({ name: "Clínica", cpfCnpj: "11222333000181" });
  });
  it("aceita a chave já com o $ e usa a URL de produção com chave de produção", async () => {
    vi.stubEnv("ASAAS_ENV", "production");
    vi.stubEnv("ASAAS_API_KEY", "$aact_prod_xyz");
    await asaas.listSubscriptionPayments("sub_1").catch(() => undefined);
    expect(fetchMock.mock.calls[0][0]).toBe("https://api.asaas.com/v3/subscriptions/sub_1/payments?limit=100");
    expect(fetchMock.mock.calls[0][1].headers.access_token).toBe("$aact_prod_xyz");
  });
  it("recusa misturar ambiente e chave, sem chamar a rede", async () => {
    vi.stubEnv("ASAAS_API_KEY", "aact_prod_xyz");
    await expect(asaas.createCustomer({ name: "A", cpfCnpj: "1" })).rejects.toThrow(/sandbox/i);
    vi.stubEnv("ASAAS_ENV", "production");
    vi.stubEnv("ASAAS_API_KEY", "aact_hmlg_abc");
    await expect(asaas.createCustomer({ name: "A", cpfCnpj: "1" })).rejects.toThrow(/produção/i);
    expect(fetchMock).not.toHaveBeenCalled();
  });
  it("sem chave configurada", async () => {
    vi.stubEnv("ASAAS_API_KEY", "");
    await expect(asaas.createCustomer({ name: "A", cpfCnpj: "1" })).rejects.toMatchObject({ status: 0 });
  });
  it("traduz o erro da API para a mensagem da Asaas", async () => {
    fetchMock.mockResolvedValueOnce(json({ errors: [{ code: "invalid_cpfCnpj", description: "CPF/CNPJ inválido" }] }, 400));
    await expect(asaas.createCustomer({ name: "A", cpfCnpj: "1" })).rejects.toMatchObject({ name: "AsaasError", status: 400, message: "CPF/CNPJ inválido" });
  });
  it("falha de rede vira erro genérico", async () => {
    fetchMock.mockRejectedValueOnce(new Error("ECONNRESET"));
    await expect(asaas.createCustomer({ name: "A", cpfCnpj: "1" })).rejects.toBeInstanceOf(AsaasError);
  });
  it("cria assinatura, lista cobranças e cancela com os verbos certos", async () => {
    await asaas.createSubscription({ customer: "cus_1", billingType: "PIX", value: 59, nextDueDate: "2026-11-10", cycle: "MONTHLY" });
    expect(fetchMock.mock.calls[0][0]).toBe("https://api-sandbox.asaas.com/v3/subscriptions");
    fetchMock.mockResolvedValueOnce(json({ data: [{ id: "pay_1" }] }));
    expect(await asaas.listSubscriptionPayments("sub_1")).toEqual([{ id: "pay_1" }]);
    await asaas.cancelSubscription("sub_1");
    expect(fetchMock.mock.calls[2][1].method).toBe("DELETE");
  });
});
