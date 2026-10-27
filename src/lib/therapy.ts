import { serviceColor, serviceLabel } from "./specialties";

// Tipos de atendimento vivem em specialties.ts; estas funções servem para exibir qualquer um deles.
export const therapyLabel = serviceLabel;
export const therapyColor = serviceColor;

export const STATUS: Record<string, { label: string; cls: string }> = {
  AGENDADA: { label: "Agendada", cls: "bg-ink-100 text-ink-600" },
  CONFIRMADA: { label: "Confirmada", cls: "bg-brand-100 text-brand-700" },
  REALIZADA: { label: "Realizada", cls: "bg-emerald-100 text-emerald-700" },
  FALTOU: { label: "Faltou", cls: "bg-red-100 text-red-700" },
  CANCELADA: { label: "Cancelada", cls: "bg-ink-200 text-ink-500" },
};
