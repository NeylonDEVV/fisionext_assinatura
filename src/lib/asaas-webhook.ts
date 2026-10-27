import { prisma } from "./prisma";
import type { AsaasPaymentDto } from "./asaas";
import { applyPayment, recomputeClinic } from "./billing-db";

export type AsaasEventBody = { id: string; event: string; payment?: AsaasPaymentDto; subscription?: { id: string } };

async function clinicFor(subscription?: string | null, customer?: string | null) {
  if (subscription) {
    const bySub = await prisma.clinic.findUnique({ where: { asaasSubscriptionId: subscription } });
    if (bySub) return bySub;
  }
  return customer ? prisma.clinic.findUnique({ where: { asaasCustomerId: customer } }) : null;
}

/**
 * Aplica um evento da Asaas. A entrega é "pelo menos uma vez", então tudo aqui é idempotente:
 * o estado é recalculado a partir das cobranças e o evento só é registrado no fim (se falhar, a Asaas reenvia).
 */
export async function handleAsaasEvent(body: AsaasEventBody): Promise<"processed" | "duplicate" | "ignored"> {
  if (await prisma.billingEvent.findUnique({ where: { asaasEventId: body.id } })) return "duplicate";
  let result: "processed" | "ignored" = "ignored";

  if (body.event.startsWith("PAYMENT_") && body.payment) {
    const clinic = await clinicFor(body.payment.subscription, body.payment.customer);
    if (clinic) {
      await applyPayment(clinic.id, body.payment, body.event);
      await recomputeClinic(clinic.id);
      result = "processed";
    }
  } else if (body.event === "SUBSCRIPTION_DELETED" || body.event === "SUBSCRIPTION_INACTIVATED") {
    const clinic = body.subscription?.id ? await prisma.clinic.findUnique({ where: { asaasSubscriptionId: body.subscription.id } }) : null;
    if (clinic) {
      if (!clinic.canceledAt) await prisma.clinic.update({ where: { id: clinic.id }, data: { canceledAt: new Date() } });
      await recomputeClinic(clinic.id);
      result = "processed";
    }
  }

  try { await prisma.billingEvent.create({ data: { asaasEventId: body.id, event: body.event } }); } catch { /* reentrega simultânea */ }
  return result;
}
