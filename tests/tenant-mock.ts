import { prisma } from "@/lib/prisma";
import { forClinic } from "@/lib/scope";
import { getSpecialty } from "@/lib/specialties";

/** Usuário "logado" nos testes das ações. Troque state.userId para simular outro usuário. */
export const state = { userId: "" };

export function tenantMock() {
  const requireTenant = async (opts: { admin?: boolean; billing?: boolean } = {}) => {
    const user = await prisma.user.findUniqueOrThrow({ where: { id: state.userId }, include: { clinic: true } });
    if (opts.admin && user.role !== "ADMIN") throw new Error("REDIRECT:/dashboard");
    return { user, clinic: user.clinic, specialty: getSpecialty(user.clinic.specialty), db: forClinic(user.clinicId) };
  };
  return { requireTenant, forClinic };
}

export const cacheMock = () => ({ revalidatePath: () => undefined });
export const navigationMock = () => ({
  redirect: (url: string) => { throw new Error(`REDIRECT:${url}`); },
  notFound: () => { throw new Error("NOT_FOUND"); },
});
