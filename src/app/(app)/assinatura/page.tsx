import { prisma } from "@/lib/prisma";
import { requireTenant } from "@/lib/tenant";
import { BILLING_TYPES, trialDaysLeft, PAYMENT_LABEL, SUBSCRIPTION_LABEL } from "@/lib/billing";
import { PLANS, planLabel } from "@/lib/plans";
import { SubscribeForm } from "@/components/subscribe-form";
import { SubscriptionActions } from "@/components/subscription-actions";
import { brl, fmtDate } from "@/lib/utils";

export const dynamic = "force-dynamic";

export default async function Assinatura() {
  const { clinic } = await requireTenant({ admin: true, billing: true });
  const payments = await prisma.billingPayment.findMany({ where: { clinicId: clinic.id }, orderBy: { dueDate: "desc" } });
  const st = SUBSCRIPTION_LABEL[clinic.subscriptionStatus] ?? SUBSCRIPTION_LABEL.NONE;
  const subscribed = ["PENDING", "ACTIVE", "OVERDUE"].includes(clinic.subscriptionStatus);
  const configured = !!process.env.ASAAS_API_KEY;

  return (
    <div className="mx-auto max-w-3xl space-y-6">
      <div><h1 className="text-2xl font-extrabold">Assinatura</h1><p className="text-sm text-ink-500">Plano e cobranças do FisioNext</p></div>

      {!configured && (
        <p className="rounded-xl bg-brand-50 px-4 py-3 text-sm text-brand-700">A cobrança ainda não está configurada neste ambiente (falta ASAAS_API_KEY). Veja docs/ASAAS.md.</p>
      )}

      <div className="card p-6">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div>
            <span className={`rounded-full px-2.5 py-1 text-xs font-semibold ${st.cls}`}>{st.label}</span>
            {clinic.plan !== "NONE" && <p className="mt-3 text-lg font-extrabold">Plano {planLabel(clinic.plan)}</p>}
            {clinic.billingType && <p className="text-sm text-ink-500">Pagamento: {BILLING_TYPES[clinic.billingType] ?? clinic.billingType}</p>}
            {!clinic.asaasSubscriptionId && clinic.trialEndsAt && clinic.trialEndsAt > new Date() && <p className="mt-3 text-sm text-ink-600">Teste grátis até {fmtDate(clinic.trialEndsAt)} ({trialDaysLeft(clinic.trialEndsAt)} dias restantes). Assine abaixo para continuar depois.</p>}
            {!clinic.asaasSubscriptionId && clinic.trialEndsAt && clinic.trialEndsAt <= new Date() && <p className="mt-3 text-sm font-semibold text-red-700">O teste grátis terminou. Assine para voltar a usar o sistema; os seus dados continuam guardados.</p>}
            {clinic.subscriptionStatus === "ACTIVE" && clinic.currentPeriodEnd && <p className="text-sm text-ink-500">Pago até {fmtDate(clinic.currentPeriodEnd)}</p>}
          </div>
          {clinic.asaasSubscriptionId && <SubscriptionActions canCancel={subscribed} />}
        </div>
      </div>

      {!subscribed && (
        <SubscribeForm
          plans={PLANS}
          initial={{ name: clinic.name === "Minha clínica" ? "" : clinic.name, document: clinic.document ?? "", email: clinic.email ?? "", phone: clinic.phone ?? "" }}
        />
      )}

      {payments.length > 0 && (
        <div className="card overflow-x-auto">
          <table className="w-full text-left text-sm">
            <thead className="border-b border-ink-100 text-xs text-ink-500"><tr><th className="p-4 font-medium">Vencimento</th><th className="p-4 font-medium">Valor</th><th className="p-4 font-medium">Status</th><th className="p-4" /></tr></thead>
            <tbody className="divide-y divide-ink-100">
              {payments.map((p) => {
                const s = PAYMENT_LABEL[p.status] ?? PAYMENT_LABEL.PENDING;
                return (
                  <tr key={p.id}>
                    <td className="p-4 font-semibold">{fmtDate(p.dueDate)}</td>
                    <td className="p-4">{brl(p.value)}</td>
                    <td className="p-4"><span className={`rounded-full px-2.5 py-1 text-xs font-semibold ${s.cls}`}>{s.label}</span></td>
                    <td className="p-4 text-right">{p.invoiceUrl && p.status !== "PAID" && p.status !== "CANCELED" && <a href={p.invoiceUrl} target="_blank" rel="noopener noreferrer" className="text-sm font-semibold text-brand-600">Abrir fatura</a>}</td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
