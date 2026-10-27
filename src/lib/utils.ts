export const brl = (cents: number) => (cents / 100).toLocaleString("pt-BR", { style: "currency", currency: "BRL" });
export const fmtTime = (d: Date) => d.toLocaleTimeString("pt-BR", { hour: "2-digit", minute: "2-digit" });
export const fmtDate = (d: Date) => d.toLocaleDateString("pt-BR", { day: "2-digit", month: "short" });
export const fmtWeekday = (d: Date) => d.toLocaleDateString("pt-BR", { weekday: "long", day: "2-digit", month: "long" });
export const startOfDay = (d = new Date()) => new Date(d.getFullYear(), d.getMonth(), d.getDate());
export const addDays = (d: Date, n: number) => new Date(d.getTime() + n * 864e5);
export const initials = (n: string) => n.split(" ").filter(Boolean).slice(0, 2).map((s) => s[0]).join("").toUpperCase();
