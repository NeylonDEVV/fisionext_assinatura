import { isValidCpf, onlyDigits } from "./cpf";
import { PAYERS } from "./payer";

export const g = (fd: FormData, k: string) => String(fd.get(k) ?? "").trim();
export const opt = (fd: FormData, k: string) => g(fd, k) || null;

export function readPatient(fd: FormData, services: string[] = [], defaultService = "") {
  const payerType = g(fd, "payerType");
  const birthDate = new Date(`${g(fd, "birthDate")}T12:00:00`);
  const cpf = onlyDigits(g(fd, "cpf"));
  const phone = onlyDigits(g(fd, "phone"));
  const plan = payerType === "PLANO_SAUDE";
  let error: string | undefined;
  if (g(fd, "name").split(/\s+/).length < 2) error = "Informe o nome completo.";
  else if (!isValidCpf(cpf)) error = "CPF inválido.";
  else if (isNaN(birthDate.getTime()) || birthDate > new Date()) error = "Data de nascimento inválida.";
  else if (phone.length < 10) error = "Informe um telefone com DDD.";
  else if (!(payerType in PAYERS)) error = "Selecione a origem do paciente.";
  else if (plan && !g(fd, "insurerName")) error = "Informe a operadora do plano de saúde.";
  const data = {
    name: g(fd, "name"), cpf, birthDate, sex: opt(fd, "sex"), phone, email: opt(fd, "email"),
    zipCode: onlyDigits(g(fd, "zipCode")) || null, street: opt(fd, "street"), number: opt(fd, "number"),
    complement: opt(fd, "complement"), district: opt(fd, "district"), city: opt(fd, "city"), state: opt(fd, "state"),
    emergencyName: opt(fd, "emergencyName"), emergencyPhone: onlyDigits(g(fd, "emergencyPhone")) || null,
    payerType, insurerName: plan ? g(fd, "insurerName") : null, insuranceCard: plan ? opt(fd, "insuranceCard") : null,
    therapy: services.includes(g(fd, "therapy")) ? g(fd, "therapy") : defaultService,
  };
  return { data, error };
}
