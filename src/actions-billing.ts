"use server";
import { redirect } from "next/navigation";
import { revalidatePath } from "next/cache";
import { prisma } from "@/lib/prisma";
import { requireTenant } from "@/lib/tenant";
import { asaas, AsaasError } from "@/lib/asaas";
import { PLANS } from "@/lib/plans";
import { BILLING_TYPES } from "@/lib/billing";
import { recomputeClinic, syncPayments } from "@/lib/billing-db";
import { isValidCpfOrCnpj, onlyDigits } from "@/lib/cpf";

type State = { error?: string; ok?: string } | undefined;
const FIRST_DUE_DAYS = 3;
const g = (fd: FormData, k: string) => String(fd.get(k) ?? "").trim();
const friendly = (e: unknown) => (e instanceof AsaasError ? e.message : "Algo deu errado. Tente novamente.");
const isoDay = (d: Date) => `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`;

export async function startSubscription(_prev: State, fd: FormData): Promise<State> {
  const { clinic } = await requireTenant({ admin: true, billing: true });
  const plan = g(fd, "plan"), billingType = g(fd, "billingType");
  const name = g(fd, "name"), document = onlyDigits(g(fd, "document")), email = g(fd, "email").toLowerCase(), phone = onlyDigits(g(fd, "phone"));
  if (!PLANS[plan]) return { error: "Escolha um plano." };
  if (!(billingType in BILLING_TYPES)) return { error: "Escolha a forma de pagamento." };
  if (name.length < 2) return { error: "Informe o nome da clínica ou do responsável." };
  if (!isValidCpfOrCnpj(document)) return { error: "CPF ou CNPJ inválido." };
  if (!/^\S+@\S+\.\S+$/.test(email)) return { error: "Informe um e-mail válido (as faturas são enviadas para ele)." };

  if (["PENDING", "ACTIVE", "OVERDUE"].includes(clinic.subscriptionStatus)) return { error: "Esta clínica já tem uma assinatura." };

  try {
    const customerId = clinic.asaasCustomerId ??
      (await asaas.createCustomer({ name, cpfCnpj: document, email, mobilePhone: phone || undefined, externalReference: clinic.id })).id;
    const due = new Date(); due.setDate(due.getDate() + FIRST_DUE_DAYS);
    const sub = await asaas.createSubscription({
      customer: customerId, billingType: billingType as "PIX" | "BOLETO" | "UNDEFINED", value: PLANS[plan].priceCents / 100,
      nextDueDate: isoDay(due), cycle: "MONTHLY", description: `FisioNext - plano ${PLANS[plan].label}`, externalReference: clinic.id,
    });
    await prisma.clinic.update({
      where: { id: clinic.id },
      data: { name, document, email, phone: phone || null, plan, billingType, asaasCustomerId: customerId, asaasSubscriptionId: sub.id, canceledAt: null },
    });
    try { await syncPayments(clinic.id, sub.id, await asaas.listSubscriptionPayments(sub.id)); } catch { /* o webhook completa depois */ }
    await recomputeClinic(clinic.id);
  } catch (e) {
    return { error: friendly(e) };
  }
  revalidatePath("/assinatura");
  redirect("/assinatura");
}

/** Rede de segurança: busca as cobranças direto na Asaas caso um webhook tenha se perdido. */
export async function syncSubscription(_prev: State, _fd: FormData): Promise<State> {
  const { clinic } = await requireTenant({ admin: true, billing: true });
  if (!clinic.asaasSubscriptionId) return { error: "Não há assinatura para atualizar." };
  try {
    await syncPayments(clinic.id, clinic.asaasSubscriptionId, await asaas.listSubscriptionPayments(clinic.asaasSubscriptionId));
  } catch (e) { return { error: friendly(e) }; }
  revalidatePath("/assinatura");
  return { ok: "Atualizado." };
}

export async function cancelSubscription(_prev: State, _fd: FormData): Promise<State> {
  const { clinic } = await requireTenant({ admin: true, billing: true });
  if (!clinic.asaasSubscriptionId || clinic.canceledAt) return { error: "Não há assinatura ativa." };
  try {
    await asaas.cancelSubscription(clinic.asaasSubscriptionId);
  } catch (e) {
    if (!(e instanceof AsaasError && e.status === 404)) return { error: friendly(e) }; // 404: já removida na Asaas
  }
  await prisma.clinic.update({ where: { id: clinic.id }, data: { canceledAt: new Date() } });
  await recomputeClinic(clinic.id);
  revalidatePath("/assinatura");
  return { ok: "Assinatura cancelada." };
}
