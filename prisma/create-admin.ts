// Cria (ou redefine a senha de) um usuário, e a clínica dele se ainda não existir. Seguro para produção: não apaga nada.
// Variáveis: ADMIN_EMAIL, ADMIN_PASSWORD (obrigatórias); ADMIN_NAME, ADMIN_ROLE (ADMIN | PROFISSIONAL, padrão ADMIN),
// ADMIN_REGISTRATION (registro no conselho), ADMIN_CLINIC (nome da clínica) e ADMIN_SPECIALTY (FISIOTERAPIA | NUTRICAO | PSICOLOGIA).
// Uso: ADMIN_EMAIL=voce@clinica.com ADMIN_PASSWORD='senha-forte' ADMIN_CLINIC='Minha clínica' npm run admin:create
import "dotenv/config";
import bcrypt from "bcryptjs";
import { PrismaClient } from "../src/generated/prisma/client";
import { PrismaBetterSqlite3 } from "@prisma/adapter-better-sqlite3";
import { resolveDbUrl } from "../src/lib/db-url";
import { isSpecialty } from "../src/lib/specialties";

function fail(msg: string): never { console.error("Erro:", msg); process.exit(1); }

const email = (process.env.ADMIN_EMAIL ?? "").trim().toLowerCase();
const password = process.env.ADMIN_PASSWORD ?? "";
const name = process.env.ADMIN_NAME?.trim() || "Administrador";
const role = process.env.ADMIN_ROLE === "PROFISSIONAL" ? "PROFISSIONAL" : "ADMIN";
const registration = process.env.ADMIN_REGISTRATION?.trim() || null;
const clinicName = process.env.ADMIN_CLINIC?.trim() || "Minha clínica";
const specialty = (process.env.ADMIN_SPECIALTY ?? "FISIOTERAPIA").trim().toUpperCase();
if (!/^\S+@\S+\.\S+$/.test(email)) fail("defina ADMIN_EMAIL com um e-mail válido.");
if (password.length < 10) fail("ADMIN_PASSWORD precisa ter pelo menos 10 caracteres.");
if (!isSpecialty(specialty)) fail("ADMIN_SPECIALTY deve ser FISIOTERAPIA, NUTRICAO ou PSICOLOGIA.");

const prisma = new PrismaClient({ adapter: new PrismaBetterSqlite3({ url: resolveDbUrl() }) });
async function main() {
  const passwordHash = await bcrypt.hash(password, 12);
  const existing = await prisma.user.findUnique({ where: { email } });
  if (existing) {
    await prisma.user.update({ where: { email }, data: { name, passwordHash, role, registration, active: true } });
    console.log(`Usuário atualizado: ${email}`);
    return;
  }
  // clínica nova: assinatura ativa (acesso liberado), já que foi criada por você, e não pelo cadastro público
  const clinic = (await prisma.clinic.findFirst({ where: { name: clinicName } })) ??
    (await prisma.clinic.create({ data: { name: clinicName, specialty, subscriptionStatus: "ACTIVE", currentPeriodEnd: new Date(Date.now() + 365 * 864e5) } }));
  await prisma.user.create({ data: { clinicId: clinic.id, name, email, passwordHash, role, registration } });
  console.log(`Usuário criado: ${email} (clínica: ${clinic.name}, área: ${clinic.specialty})`);
}
main().finally(() => prisma.$disconnect());
