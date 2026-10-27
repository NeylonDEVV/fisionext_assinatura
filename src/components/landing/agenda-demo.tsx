"use client";
import { useState } from "react";
import { AnimatePresence, motion, useReducedMotion } from "framer-motion";

type Item = { name: string; detail: string; status: "Confirmada" | "Agendada"; color: string };
type Slot = { time: string; items: Item[] };

const DEMO: Record<"consultas" | "pilates", Slot[]> = {
  consultas: [
    { time: "08:00", items: [{ name: "Maria S.", detail: "Ortopédica, 50 min", status: "Confirmada", color: "#F26B1D" }] },
    { time: "09:30", items: [{ name: "Carlos P.", detail: "Esportiva, 50 min", status: "Agendada", color: "#D85510" }] },
    { time: "11:00", items: [{ name: "Lúcia M.", detail: "Neurológica, 50 min", status: "Confirmada", color: "#6B6762" }] },
  ],
  pilates: [
    { time: "15:00", items: [
      { name: "Ana R.", detail: "Pilates, 50 min", status: "Confirmada", color: "#FF8638" },
      { name: "Diego S.", detail: "Pilates, 50 min", status: "Agendada", color: "#FF8638" },
    ] },
    { time: "16:00", items: [{ name: "Paula T.", detail: "Pilates, 50 min", status: "Agendada", color: "#FF8638" }] },
  ],
};

const TABS = [
  { key: "consultas", label: "Consultas" },
  { key: "pilates", label: "Pilates" },
] as const;

export function AgendaDemo() {
  const [tab, setTab] = useState<"consultas" | "pilates">("consultas");
  const reduce = useReducedMotion();
  const slots = DEMO[tab];

  return (
    <div className="card overflow-hidden">
      <div className="flex items-center justify-between gap-3 border-b border-ink-100 px-5 py-4">
        <p className="text-sm font-bold">Agenda de hoje</p>
        <div role="tablist" aria-label="Escolha a agenda" className="relative flex rounded-xl bg-ink-100 p-1">
          {TABS.map((t) => (
            <button
              key={t.key} role="tab" aria-selected={tab === t.key} onClick={() => setTab(t.key)}
              className={`relative rounded-lg px-4 py-1.5 text-sm font-semibold transition-colors ${tab === t.key ? "text-ink-900" : "text-ink-500 hover:text-ink-700"}`}
            >
              {tab === t.key && <motion.span layoutId="demo-tab" className="absolute inset-0 rounded-lg bg-white shadow-sm" transition={{ type: "spring", stiffness: 420, damping: 34 }} />}
              <span className="relative">{t.label}</span>
            </button>
          ))}
        </div>
      </div>

      <div aria-live="polite" className="min-h-[19rem] px-5 py-2">
        <AnimatePresence mode="wait" initial={false}>
          <motion.ul
            key={tab}
            initial={reduce ? false : { opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} exit={reduce ? { opacity: 0 } : { opacity: 0, y: -10 }}
            transition={{ duration: 0.22, ease: "easeOut" }} className="divide-y divide-ink-100"
          >
            {slots.map((s) => (
              <li key={s.time} className="py-3.5">
                <div className="mb-1 flex items-center gap-3">
                  <span className="w-12 text-sm font-bold">{s.time}</span>
                  {tab === "pilates" && (
                    <span className="rounded-full bg-brand-50 px-2.5 py-0.5 text-xs font-semibold text-brand-700">{s.items.length} {s.items.length === 1 ? "aluno" : "alunos"}</span>
                  )}
                </div>
                {s.items.map((it) => (
                  <div key={it.name} className="flex items-center gap-3 py-1.5">
                    <span className="h-8 w-1 shrink-0 rounded-full" style={{ background: it.color }} />
                    <div className="min-w-0 flex-1">
                      <p className="truncate text-sm font-semibold">{it.name}</p>
                      <p className="text-xs text-ink-500">{it.detail}</p>
                    </div>
                    <span className={`rounded-full px-2.5 py-1 text-xs font-semibold ${it.status === "Confirmada" ? "bg-brand-100 text-brand-700" : "bg-ink-100 text-ink-600"}`}>{it.status}</span>
                  </div>
                ))}
              </li>
            ))}
          </motion.ul>
        </AnimatePresence>
      </div>
      <p className="border-t border-ink-100 px-5 py-3 text-xs text-ink-400">Demonstração com dados fictícios. Toque nas abas para ver as duas agendas.</p>
    </div>
  );
}
