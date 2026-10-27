import "dotenv/config";
import bcrypt from "bcryptjs";
import { PrismaClient } from "../src/generated/prisma/client";
import { PrismaBetterSqlite3 } from "@prisma/adapter-better-sqlite3";
import { resolveDbUrl } from "../src/lib/db-url";

const prisma = new PrismaClient({ adapter: new PrismaBetterSqlite3({ url: resolveDbUrl() }) });
const day = (offset: number, h = 9, m = 0) => { const d = new Date(); d.setDate(d.getDate() + offset); d.setHours(h, m, 0, 0); return d; };
const base = { birthDate: new Date("1990-05-10T12:00:00"), city: "Brasília", state: "DF" };
const answers = (o: Record<string, string>) => JSON.stringify(o);

async function main() {
  if (process.env.NODE_ENV === "production") throw new Error("O seed de demonstração apaga todos os dados e não roda em produção. Use: npm run admin:create");
  const adminEmail = (process.env.SEED_ADMIN_EMAIL ?? "admin@fisionext.com").toLowerCase();
  const passwordHash = await bcrypt.hash(process.env.SEED_ADMIN_PASSWORD ?? "fisio1234", 10);

  for (const m of [prisma.billingPayment, prisma.billingEvent, prisma.payment, prisma.evolution, prisma.admission, prisma.appointment, prisma.patient, prisma.user, prisma.clinic]) await (m as any).deleteMany();

  // ---------- Clínica 1: fisioterapia (assinatura ativa) ----------
  const fisio = await prisma.clinic.create({ data: { name: "Clínica Demo Fisioterapia", specialty: "FISIOTERAPIA", subscriptionStatus: "ACTIVE", plan: "CLINICA", currentPeriodEnd: day(30) } });
  const mkUser = (clinicId: string, name: string, email: string, role = "PROFISSIONAL") => prisma.user.create({ data: { clinicId, name, email, passwordHash, role } });
  await mkUser(fisio.id, "Administrador", adminEmail, "ADMIN");
  const sinara = await mkUser(fisio.id, "Sinara", "sinara@fisionext.com");
  const antonio = await mkUser(fisio.id, "Antonio", "antonio@fisionext.com");
  const [ana, bruno, carla, diego] = await Promise.all([
    prisma.patient.create({ data: { ...base, clinicId: fisio.id, name: "Ana Beatriz Lima", cpf: "12345678062", phone: "61999991111", sex: "F", payerType: "PARCERIA", complaint: "Dor lombar crônica", diagnosis: "Lombalgia mecânica", therapy: "ORTOPEDICA" } }),
    prisma.patient.create({ data: { ...base, clinicId: fisio.id, name: "Bruno Carvalho", cpf: "98765432029", phone: "61999992222", sex: "M", payerType: "PLANO_SAUDE", insurerName: "Unimed", insuranceCard: "0012345678", complaint: "Pós-op LCA joelho direito", diagnosis: "Reconstrução de LCA", therapy: "ESPORTIVA" } }),
    prisma.patient.create({ data: { ...base, clinicId: fisio.id, name: "Carla Mendes", cpf: "11122233043", phone: "61999993333", sex: "F", payerType: "PLANO_SAUDE", insurerName: "Bradesco Saúde", insuranceCard: "98765432", complaint: "Sequela de AVC", diagnosis: "Hemiparesia esquerda", therapy: "NEUROLOGICA" } }),
    prisma.patient.create({ data: { ...base, clinicId: fisio.id, name: "Diego Souza", cpf: "44455566023", phone: "61999994444", sex: "M", payerType: "PARTICULAR", complaint: "Postura e condicionamento", therapy: "PILATES" } }),
  ]);
  await prisma.admission.create({ data: { clinicId: fisio.id, patientId: ana.id, authorId: sinara.id, answers: answers({ complaint: "Dor lombar há 8 meses", painScale: "8", physioDiagnosis: "Lombalgia mecânica inespecífica", goals: "Reduzir dor e retomar atividade física", therapy: "ORTOPEDICA" }), complaint: "Dor lombar há 8 meses", assessment: "Lombalgia mecânica inespecífica", goals: "Reduzir dor e retomar atividade física", therapy: "ORTOPEDICA", plannedSessions: 12, frequency: "2x por semana", metric: 8, consent: true } });

  // Pilates é com o Antonio; as demais consultas, com a Sinara (apenas na demonstração).
  const mk = async (p: { id: string }, therapy: string, when: Date, status: string, price: number, paid: boolean, method = "PIX") => {
    const a = await prisma.appointment.create({ data: { clinicId: fisio.id, patientId: p.id, therapy, startsAt: when, status, professionalId: therapy === "PILATES" ? antonio.id : sinara.id } });
    await prisma.payment.create({ data: { clinicId: fisio.id, patientId: p.id, appointmentId: a.id, description: "Sessão", amount: price, dueDate: when, status: paid ? "PAGO" : "PENDENTE", method: paid ? method : null, paidAt: paid ? when : null } });
    return a;
  };
  const pains = [8, 7, 6, 5, 4, 3];
  for (let i = 0; i < pains.length; i++) {
    const a = await mk(ana, "ORTOPEDICA", day(-15 + i * 3, 8), "REALIZADA", 15000, true, ["PIX", "CARTAO_DEBITO", "CARTAO_CREDITO"][i % 3]);
    await prisma.evolution.create({ data: { clinicId: fisio.id, patientId: ana.id, appointmentId: a.id, authorId: sinara.id, date: a.startsAt, metric: pains[i], techniques: "Liberação miofascial, estabilização lombar, TENS", content: i < 3 ? "Paciente refere dor persistente ao final do dia. Ganho discreto de amplitude." : "Melhora funcional, mantém exercícios domiciliares. Boa adesão." } });
  }
  await mk(ana, "ORTOPEDICA", day(0, 8), "CONFIRMADA", 15000, false);
  await mk(bruno, "ESPORTIVA", day(0, 9, 30), "AGENDADA", 18000, false);
  await mk(carla, "NEUROLOGICA", day(0, 11), "CONFIRMADA", 20000, false);
  await mk(diego, "PILATES", day(0, 15), "AGENDADA", 12000, false);
  await mk(ana, "PILATES", day(0, 15), "AGENDADA", 12000, false); // mesma turma das 15h
  await mk(diego, "PILATES", day(1, 15), "AGENDADA", 12000, false);
  await mk(bruno, "ESPORTIVA", day(2, 9, 30), "AGENDADA", 18000, false);
  await mk(carla, "NEUROLOGICA", day(3, 11), "AGENDADA", 20000, false);
  const b = await mk(bruno, "ESPORTIVA", day(-3, 9, 30), "REALIZADA", 18000, true, "CARTAO_CREDITO");
  await prisma.evolution.create({ data: { clinicId: fisio.id, patientId: bruno.id, appointmentId: b.id, authorId: sinara.id, date: b.startsAt, metric: 4, techniques: "Cinesioterapia, fortalecimento de quadríceps, crioterapia", content: "Flexão de joelho 110°. Sem edema relevante." } });

  // ---------- Clínica 2: nutrição (teste grátis) ----------
  const nutri = await prisma.clinic.create({ data: { name: "Consultório Demo Nutrição", specialty: "NUTRICAO", subscriptionStatus: "TRIAL", trialEndsAt: day(14) } });
  const nu = await prisma.user.create({ data: { clinicId: nutri.id, name: "Marina Nutri", email: "nutri@fisionext.com", passwordHash, role: "ADMIN", registration: "CRN-1 00000" } });
  const lia = await prisma.patient.create({ data: { ...base, clinicId: nutri.id, name: "Lívia Prado", cpf: "55566677053", phone: "61988880001", sex: "F", payerType: "PARTICULAR", complaint: "Reeducação alimentar e emagrecimento", therapy: "ACOMPANHAMENTO" } });
  await prisma.admission.create({ data: { clinicId: nutri.id, patientId: lia.id, authorId: nu.id, answers: answers({ complaint: "Reeducação alimentar e emagrecimento", weight: "82.4", height: "165", nutritionalDiagnosis: "Sobrepeso", goals: "Perder 6 kg em 4 meses", therapy: "ACOMPANHAMENTO", frequency: "Quinzenal" }), complaint: "Reeducação alimentar e emagrecimento", assessment: "Sobrepeso", goals: "Perder 6 kg em 4 meses", therapy: "ACOMPANHAMENTO", frequency: "Quinzenal", metric: 82.4, consent: true } });
  for (const [i, w] of [82.4, 81.6, 80.9, 80.1].entries()) {
    const a = await prisma.appointment.create({ data: { clinicId: nutri.id, patientId: lia.id, therapy: i === 0 ? "CONSULTA_INICIAL" : "RETORNO", startsAt: day(-42 + i * 14, 10), status: "REALIZADA", professionalId: nu.id } });
    await prisma.evolution.create({ data: { clinicId: nutri.id, patientId: lia.id, appointmentId: a.id, authorId: nu.id, date: a.startsAt, metric: w, techniques: "Plano alimentar ajustado", content: i === 0 ? "Início do acompanhamento." : "Boa adesão ao plano. Ajuste de porções no jantar." } });
  }
  await prisma.appointment.create({ data: { clinicId: nutri.id, patientId: lia.id, therapy: "RETORNO", startsAt: day(1, 10), status: "CONFIRMADA", professionalId: nu.id } });

  // ---------- Clínica 3: psicologia (teste grátis, registros restritos) ----------
  const psi = await prisma.clinic.create({ data: { name: "Consultório Demo Psicologia", specialty: "PSICOLOGIA", subscriptionStatus: "TRIAL", trialEndsAt: day(14) } });
  const ps = await prisma.user.create({ data: { clinicId: psi.id, name: "Paulo Psi", email: "psi@fisionext.com", passwordHash, role: "ADMIN", registration: "CRP 01/00000" } });
  const rafa = await prisma.patient.create({ data: { ...base, clinicId: psi.id, name: "Rafael Moreira", cpf: "66677788083", phone: "61977770001", sex: "M", payerType: "PARTICULAR", therapy: "PSICOTERAPIA" } });
  await prisma.admission.create({ data: { clinicId: psi.id, patientId: rafa.id, authorId: ps.id, answers: answers({ complaint: "Ansiedade no trabalho", mood: "4", formulation: "Sintomas ansiosos relacionados a estresse ocupacional", goals: "Manejo da ansiedade", therapy: "PSICOTERAPIA", frequency: "Semanal" }), complaint: "Ansiedade no trabalho", assessment: "Sintomas ansiosos relacionados a estresse ocupacional", goals: "Manejo da ansiedade", therapy: "PSICOTERAPIA", frequency: "Semanal", metric: 4, consent: true } });
  for (const [i, v] of [4, 5, 6].entries()) {
    const a = await prisma.appointment.create({ data: { clinicId: psi.id, patientId: rafa.id, therapy: "PSICOTERAPIA", startsAt: day(-21 + i * 7, 18), status: "REALIZADA", professionalId: ps.id } });
    await prisma.evolution.create({ data: { clinicId: psi.id, patientId: rafa.id, appointmentId: a.id, authorId: ps.id, date: a.startsAt, metric: v, techniques: "Reestruturação cognitiva", content: "Sessão focada em situações de pressão no trabalho." } });
  }
  await prisma.appointment.create({ data: { clinicId: psi.id, patientId: rafa.id, therapy: "PSICOTERAPIA", startsAt: day(2, 18), status: "AGENDADA", professionalId: ps.id } });
}
main().finally(() => prisma.$disconnect());
