import { redirect } from "next/navigation";
import { prisma } from "./prisma";
import { getSession } from "./session";
import { getSpecialty } from "./specialties";
import { hasAccess } from "./billing";
import { forClinic } from "./scope";

export { forClinic };
export type { ClinicDb } from "./scope";

/**
 * Exige login e usuário ativo; devolve a clínica, a especialidade e o cliente do banco filtrado.
 * - billing: a tela de assinatura funciona mesmo com o acesso bloqueado (teste vencido).
 * - admin: só administradores da clínica.
 */
export async function requireTenant(opts: { billing?: boolean; admin?: boolean } = {}) {
  const s = await getSession();
  if (!s) redirect("/login");
  const user = await prisma.user.findUnique({ where: { id: s.id }, include: { clinic: true } });
  if (!user || !user.active) redirect("/api/logout");
  const clinic = user.clinic;
  if (!opts.billing && !hasAccess(clinic)) redirect("/assinatura");
  if (opts.admin && user.role !== "ADMIN") redirect("/dashboard");
  return { user, clinic, specialty: getSpecialty(clinic.specialty), db: forClinic(clinic.id) };
}
export type TenantCtx = Awaited<ReturnType<typeof requireTenant>>;
