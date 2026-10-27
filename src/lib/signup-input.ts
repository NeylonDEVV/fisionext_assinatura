import { isSpecialty, type SpecialtyKey } from "./specialties";
import { onlyDigits } from "./cpf";
import { MIN_PASSWORD } from "./user-input";

/** Valida o cadastro em etapas (área, conta, clínica e aceite dos termos). */
export function readSignup(fd: FormData) {
  const g = (k: string) => String(fd.get(k) ?? "").trim();
  const specialty = g("specialty"), name = g("name"), email = g("email").toLowerCase(), clinicName = g("clinicName");
  const password = String(fd.get("password") ?? "");
  let error: string | undefined;
  if (!isSpecialty(specialty)) error = "Escolha a sua área de atuação.";
  else if (name.length < 2) error = "Informe o seu nome.";
  else if (!/^\S+@\S+\.\S+$/.test(email)) error = "Informe um e-mail válido.";
  else if (password.length < MIN_PASSWORD) error = `A senha precisa ter pelo menos ${MIN_PASSWORD} caracteres.`;
  else if (clinicName.length < 2) error = "Informe o nome do consultório ou da clínica.";
  else if (fd.get("terms") !== "on") error = "Para continuar, aceite os termos de uso e a política de privacidade.";
  return {
    data: { specialty: specialty as SpecialtyKey, name, email, password, clinicName, phone: onlyDigits(g("phone")) || null },
    error,
  };
}
