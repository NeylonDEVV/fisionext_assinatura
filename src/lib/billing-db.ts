import { prisma } from "./prisma";
import type { AsaasPaymentDto } from "./asaas";
import { deriveClinicState, mergePaymentStatus, normalizePaymentStatus, type PaymentStatus } from "./billing";

const day = (s: string) => new Date(`${s}T12:00:00`);

export async function applyPayment(clinicId: string, p: AsaasPaymentDto, event?: string) {
  const existing = await prisma.billingPayment.findUnique({ where: { asaasId: p.id } });
  const status = mergePaymentStatus(existing?.status as PaymentStatus | undefined, normalizePaymentStatus(p.status, event));
  const data = {
    value: Math.round(p.value * 100),
    status,
    billingType: p.billingType ?? existing?.billingType ?? null,
    dueDate: day(p.dueDate),
    paidAt: status === "PAID" ? existing?.paidAt ?? (p.paymentDate ? day(p.paymentDate) : new Date()) : existing?.paidAt ?? null,
    invoiceUrl: p.invoiceUrl ?? existing?.invoiceUrl ?? null,
  };
  await prisma.billingPayment.upsert({ where: { asaasId: p.id }, update: data, create: { asaasId: p.id, clinicId, ...data } });
}

export async function recomputeClinic(clinicId: string) {
  const c = await prisma.clinic.findUniqueOrThrow({ where: { id: clinicId }, include: { payments: true } });
  const { status, currentPeriodEnd } = deriveClinicState(c.payments, { hasSubscription: !!c.asaasSubscriptionId, canceledAt: c.canceledAt, trialEndsAt: c.trialEndsAt });
  await prisma.clinic.update({ where: { id: clinicId }, data: { subscriptionStatus: status, currentPeriodEnd } });
  return status;
}

export async function syncPayments(clinicId: string, subscriptionId: string, list: AsaasPaymentDto[]) {
  for (const p of list) await applyPayment(clinicId, { ...p, subscription: p.subscription ?? subscriptionId });
  return recomputeClinic(clinicId);
}
