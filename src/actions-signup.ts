"use server";
import bcrypt from "bcryptjs";
import { headers } from "next/headers";
import { redirect } from "next/navigation";
import { prisma } from "@/lib/prisma";
import { startSession } from "@/lib/session";
import { siteConfig } from "@/lib/site";
import { readSignup } from "@/lib/signup-input";
import { isBlocked, registerFailure } from "@/lib/rate-limit";

type State = { error?: string } | undefined;

/** Cria a clínica, o administrador e o teste grátis, e já entra no sistema. Só funciona com SIGNUP_ENABLED=true. */
export async function signUp(_prev: State, fd: FormData): Promise<State> {
  const cfg = siteConfig();
  if (!cfg.signupEnabled) return { error: "Os cadastros ainda não estão abertos." };
  const ip = headers().get("x-forwarded-for")?.split(",")[0]?.trim() || "local";
  if (isBlocked(`signup|${ip}`, 6)) return { error: "Muitas tentativas. Tente novamente mais tarde." };
  registerFailure(`signup|${ip}`); // cada tentativa conta, para segurar criação em massa de contas

  const { data, error } = readSignup(fd);
  if (error) return { error };
  if (await prisma.user.findUnique({ where: { email: data.email } })) return { error: "Já existe uma conta com este e-mail." };

  let userId: string, userName: string;
  try {
    const clinic = await prisma.clinic.create({
      data: {
        name: data.clinicName, specialty: data.specialty, email: data.email, phone: data.phone,
        subscriptionStatus: "TRIAL", trialEndsAt: new Date(Date.now() + cfg.trialDays * 864e5),
        users: { create: { name: data.name, email: data.email, passwordHash: await bcrypt.hash(data.password, 12), role: "ADMIN", termsAcceptedAt: new Date() } },
      },
      include: { users: true },
    });
    userId = clinic.users[0].id; userName = clinic.users[0].name;
  } catch {
    return { error: "Não foi possível criar a conta. Tente novamente." };
  }
  await startSession({ id: userId, name: userName, email: data.email });
  redirect("/dashboard");
}
