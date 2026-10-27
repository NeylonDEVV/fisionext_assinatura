"use client";
import { motion, AnimatePresence } from "framer-motion";
import { Plus, X } from "lucide-react";
import { useState } from "react";

export function Stagger({ children, className }: { children: React.ReactNode; className?: string }) {
  return <motion.div className={className} initial="hidden" animate="show" variants={{ show: { transition: { staggerChildren: 0.07 } } }}>{children}</motion.div>;
}
export function Item({ children, className }: { children: React.ReactNode; className?: string }) {
  return <motion.div className={className} variants={{ hidden: { opacity: 0, y: 14 }, show: { opacity: 1, y: 0, transition: { type: "spring", stiffness: 260, damping: 26 } } }}>{children}</motion.div>;
}

export function Bar({ pct, color }: { pct: number; color: string }) {
  return <div className="h-2 overflow-hidden rounded-full bg-ink-100"><motion.div className="h-full rounded-full" style={{ background: color }} initial={{ width: 0 }} animate={{ width: `${pct}%` }} transition={{ duration: 0.9, ease: [0.22, 1, 0.36, 1], delay: 0.3 }} /></div>;
}

export function Drawer({ label, title, children }: { label: string; title: string; children: React.ReactNode }) {
  const [open, setOpen] = useState(false);
  return (
    <>
      <button className="btn" onClick={() => setOpen(true)}><Plus size={16} />{label}</button>
      <AnimatePresence>
        {open && (
          <>
            <motion.div className="fixed inset-0 z-40 bg-ink-900/30 backdrop-blur-[2px]" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} onClick={() => setOpen(false)} />
            <motion.aside className="fixed right-0 top-0 z-50 h-full w-full max-w-md overflow-y-auto bg-white p-6 shadow-2xl"
              initial={{ x: "100%" }} animate={{ x: 0 }} exit={{ x: "100%" }} transition={{ type: "spring", stiffness: 300, damping: 34 }}>
              <div className="mb-6 flex items-center justify-between">
                <h2 className="text-lg font-bold">{title}</h2>
                <button className="btn-ghost !p-2" onClick={() => setOpen(false)} aria-label="Fechar"><X size={16} /></button>
              </div>
              <div onSubmit={() => setTimeout(() => setOpen(false), 150)}>{children}</div>
            </motion.aside>
          </>
        )}
      </AnimatePresence>
    </>
  );
}
