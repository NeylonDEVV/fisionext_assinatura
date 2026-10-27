import { ROLES } from "./roles";

export const MIN_PASSWORD = 10;

export function readUser(fd: FormData) {
  const g = (k: string) => String(fd.get(k) ?? "").trim();
  const name = g("name"), email = g("email").toLowerCase();
  const password = String(fd.get("password") ?? "");
  const role = g("role") || "PROFISSIONAL";
  let error: string | undefined;
  if (name.length < 2) error = "Informe o nome.";
  else if (!/^\S+@\S+\.\S+$/.test(email)) error = "Informe um e-mail válido.";
  else if (password.length < MIN_PASSWORD) error = `A senha precisa ter pelo menos ${MIN_PASSWORD} caracteres.`;
  else if (!Object.keys(ROLES).includes(role)) error = "Perfil inválido.";
  return { data: { name, email, role, registration: g("registration") || null, password }, error };
}
