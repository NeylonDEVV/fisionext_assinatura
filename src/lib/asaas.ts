// Cliente mínimo da API da Asaas v3. A chave fica só no servidor (variável de ambiente).
const BASES = { sandbox: "https://api-sandbox.asaas.com/v3", production: "https://api.asaas.com/v3" } as const;

export class AsaasError extends Error {
  constructor(public status: number, message: string) { super(message); this.name = "AsaasError"; }
}

export type AsaasPaymentDto = {
  id: string; value: number; status: string; dueDate: string; billingType?: string;
  invoiceUrl?: string; paymentDate?: string | null; customer?: string; subscription?: string | null;
};

function config() {
  const raw = process.env.ASAAS_API_KEY?.trim();
  if (!raw) throw new AsaasError(0, "A integração com a Asaas não está configurada (ASAAS_API_KEY).");
  // A chave começa com "$"; no .env isso é expandido como variável, então aceitamos sem o "$" inicial.
  const key = raw.startsWith("$") ? raw : `$${raw}`;
  const env = process.env.ASAAS_ENV === "production" ? "production" : "sandbox";
  const prodKey = key.startsWith("$aact_prod_");
  if (env === "production" && !prodKey) throw new AsaasError(0, "ASAAS_ENV=production exige uma chave de produção.");
  if (env === "sandbox" && prodKey) throw new AsaasError(0, "Chave de produção em ambiente sandbox. Ajuste ASAAS_ENV.");
  return { key, env, base: BASES[env] };
}

async function request<T>(method: string, path: string, body?: unknown): Promise<T> {
  const { key, env, base } = config();
  const ctrl = new AbortController();
  const timer = setTimeout(() => ctrl.abort(), 15_000);
  try {
    const res = await fetch(`${base}${path}`, {
      method,
      headers: { "Content-Type": "application/json", access_token: key, "User-Agent": `FisioNext/1.0 (Next.js; ${env})` },
      body: body === undefined ? undefined : JSON.stringify(body),
      signal: ctrl.signal,
      cache: "no-store",
    });
    const text = await res.text();
    let json: any = null;
    try { json = text ? JSON.parse(text) : null; } catch { /* corpo não-JSON */ }
    if (!res.ok) throw new AsaasError(res.status, json?.errors?.[0]?.description ?? `Erro ${res.status} da Asaas.`);
    return json as T;
  } catch (e) {
    if (e instanceof AsaasError) throw e;
    throw new AsaasError(0, "Não foi possível falar com a Asaas. Tente novamente.");
  } finally {
    clearTimeout(timer);
  }
}

export const asaas = {
  createCustomer: (b: { name: string; cpfCnpj: string; email?: string; mobilePhone?: string; externalReference?: string }) =>
    request<{ id: string }>("POST", "/customers", b),

  createSubscription: (b: {
    customer: string; billingType: "PIX" | "BOLETO" | "UNDEFINED"; value: number; nextDueDate: string;
    cycle: "MONTHLY"; description?: string; externalReference?: string;
  }) => request<{ id: string }>("POST", "/subscriptions", b),

  listSubscriptionPayments: async (subscriptionId: string) =>
    (await request<{ data: AsaasPaymentDto[] }>("GET", `/subscriptions/${encodeURIComponent(subscriptionId)}/payments?limit=100`)).data ?? [],

  cancelSubscription: (subscriptionId: string) =>
    request<{ deleted: boolean }>("DELETE", `/subscriptions/${encodeURIComponent(subscriptionId)}`),
};
