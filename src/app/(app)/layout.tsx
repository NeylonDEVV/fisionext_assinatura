import Link from "next/link";
import { headers } from "next/headers";
import { Sidebar } from "@/components/sidebar";
import { requireTenant } from "@/lib/tenant";
import { trialDaysLeft } from "@/lib/billing";

export default async function AppLayout({ children }: { children: React.ReactNode }) {
  const path = headers().get("x-pathname") ?? "";
  // com o teste vencido, só a tela de assinatura continua acessível
  const { user, clinic, specialty } = await requireTenant({ billing: path.startsWith("/assinatura") });
  const admin = user.role === "ADMIN";
  const overdue = admin && clinic.subscriptionStatus === "OVERDUE";
  const inTrial = admin && !clinic.asaasSubscriptionId && !!clinic.trialEndsAt && clinic.trialEndsAt > new Date();
  return (
    <div className="min-h-screen">
      <Sidebar user={{ name: user.name, email: user.email, role: user.role }} groupLabel={specialty.groupAgenda?.label ?? null} />
      <main className="px-5 pb-28 pt-8 md:ml-64 md:px-10 md:pb-12">
        <div className="mx-auto max-w-6xl">
          {overdue && (
            <Link href="/assinatura" className="mb-6 block rounded-xl bg-red-50 px-4 py-3 text-sm font-medium text-red-700 ring-1 ring-red-100">
              Há uma fatura da assinatura vencida. Toque para ver e regularizar.
            </Link>
          )}
          {inTrial && (
            <Link href="/assinatura" className="mb-6 block rounded-xl bg-brand-50 px-4 py-3 text-sm font-medium text-brand-700 ring-1 ring-brand-100">
              Teste grátis: {trialDaysLeft(clinic.trialEndsAt!)} {trialDaysLeft(clinic.trialEndsAt!) === 1 ? "dia restante" : "dias restantes"}. Toque para ver os planos.
            </Link>
          )}
          {children}
        </div>
      </main>
    </div>
  );
}
