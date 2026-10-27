"use server";
import bcrypt from "bcryptjs";
import { headers } from "next/headers";
import { redirect } from "next/navigation";
import { prisma } from "@/lib/prisma";
import { startSession, endSession } from "@/lib/session";
import { isBlocked, registerFailure, clearFailures } from "@/lib/rate-limit";

const DUMMY_HASH = bcrypt.hashSync("senha-inexistente", 10); // evita revelar se o e-mail existe pelo tempo de resposta
const MAX_PER_ACCOUNT = 5, MAX_PER_IP = 20;

export async function login(_prev: { error?: string } | undefined, fd: FormData) {
  const email = String(fd.get("email") ?? "").trim().toLowerCase();
  const password = String(fd.get("password") ?? "");
  const ip = headers().get("x-forwarded-for")?.split(",")[0]?.trim() || "local";
  const accountKey = `${ip}|${email}`;
  if (isBlocked(accountKey, MAX_PER_ACCOUNT) || isBlocked(ip, MAX_PER_IP)) {
    return { error: "Muitas tentativas. Aguarde alguns minutos e tente novamente." };
  }
  const user = email ? await prisma.user.findUnique({ where: { email } }) : null;
  const ok = await bcrypt.compare(password, user?.passwordHash ?? DUMMY_HASH);
  if (!user || !user.active || !ok) {
    registerFailure(accountKey); registerFailure(ip);
    return { error: "E-mail ou senha incorretos." };
  }
  clearFailures(accountKey);
  await startSession({ id: user.id, name: user.name, email: user.email });
  redirect("/dashboard");
}

export async function logout() {
  endSession();
  redirect("/login");
}
