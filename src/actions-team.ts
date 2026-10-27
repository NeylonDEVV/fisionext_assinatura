"use server";
import bcrypt from "bcryptjs";
import { redirect } from "next/navigation";
import { revalidatePath } from "next/cache";
import { prisma } from "@/lib/prisma";
import { requireTenant } from "@/lib/tenant";
import { MIN_PASSWORD, readUser } from "@/lib/user-input";

type State = { error?: string } | undefined;

export async function createUser(_prev: State, fd: FormData): Promise<State> {
  const { db } = await requireTenant({ admin: true });
  const { data, error } = readUser(fd);
  if (error) return { error };
  // o e-mail é o login e vale para a plataforma inteira: a checagem é global, de propósito
  if (await prisma.user.findUnique({ where: { email: data.email } })) return { error: "Já existe um usuário com esse e-mail." };
  const { password, ...rest } = data;
  await db.user.create({ data: { ...rest, passwordHash: await bcrypt.hash(password, 12) } });
  revalidatePath("/equipe");
  redirect("/equipe");
}

export async function resetUserPassword(fd: FormData) {
  const { db } = await requireTenant({ admin: true });
  const password = String(fd.get("password") ?? "");
  if (password.length < MIN_PASSWORD) return;
  await db.user.updateMany({ where: { id: String(fd.get("id")) }, data: { passwordHash: await bcrypt.hash(password, 12) } });
  revalidatePath("/equipe");
}

export async function setUserActive(fd: FormData) {
  const { db, user: me } = await requireTenant({ admin: true });
  const id = String(fd.get("id"));
  const active = fd.get("active") === "true";
  if (!active) {
    if (id === me.id) return; // ninguém desativa a si mesmo
    const target = await db.user.findFirst({ where: { id } });
    if (target?.role === "ADMIN" && target.active) {
      const others = await db.user.count({ where: { role: "ADMIN", active: true, NOT: { id } } });
      if (others === 0) return; // sempre sobra um administrador ativo na clínica
    }
  }
  await db.user.updateMany({ where: { id }, data: { active } });
  revalidatePath("/equipe");
}
