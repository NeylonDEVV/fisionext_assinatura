export const ROLES: Record<string, string> = { ADMIN: "Administrador", PROFISSIONAL: "Profissional" };
export const roleLabel = (r: string) => ROLES[r] ?? r;
