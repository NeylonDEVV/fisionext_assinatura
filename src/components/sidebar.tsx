"use client";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { motion } from "framer-motion";
import { LayoutDashboard, CalendarDays, Dumbbell, Users, History, Wallet, UserCog, CreditCard, LogOut } from "lucide-react";
import { logout } from "@/actions-auth";

export function Logo() {
  return (
    <div className="flex items-center gap-2.5">
      <svg width="34" height="34" viewBox="0 0 34 34" fill="none" aria-hidden>
        <rect width="34" height="34" rx="10" fill="#F26B1D" />
        <path d="M9 24V10l8 8V10M17 24l8-14" stroke="#fff" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round" />
      </svg>
      <span className="text-lg font-extrabold tracking-tight text-ink-800">fisio<span className="text-brand-500">next</span></span>
    </div>
  );
}

export function Sidebar({ user, groupLabel }: { user: { name: string; email: string; role: string }; groupLabel?: string | null }) {
  const path = usePathname();
  const items = [
    { href: "/dashboard", label: "Dashboard", icon: LayoutDashboard },
    { href: "/agenda", label: "Agenda", icon: CalendarDays },
    ...(groupLabel ? [{ href: "/pilates", label: groupLabel, icon: Dumbbell }] : []),
    { href: "/pacientes", label: "Pacientes", icon: Users },
    { href: "/historico", label: "Histórico", icon: History },
    { href: "/financeiro", label: "Financeiro", icon: Wallet },
    ...(user.role === "ADMIN" ? [{ href: "/equipe", label: "Equipe", icon: UserCog }, { href: "/assinatura", label: "Assinatura", icon: CreditCard }] : []),
  ];
  const active = (h: string) => path === h || path.startsWith(h + "/");
  return (
    <>
      <aside className="fixed inset-y-0 left-0 hidden w-64 flex-col border-r border-ink-100 bg-white p-5 md:flex">
        <Link href="/dashboard" className="mb-10 mt-1 px-2"><Logo /></Link>
        <nav className="flex flex-col gap-1">
          {items.map(({ href, label, icon: Icon }) => (
            <Link key={href} href={href} className={`relative flex items-center gap-3 rounded-xl px-3.5 py-3 text-sm font-semibold transition-colors ${active(href) ? "text-brand-700" : "text-ink-500 hover:text-ink-800"}`}>
              {active(href) && <motion.span layoutId="nav-pill" className="absolute inset-0 rounded-xl bg-brand-50 ring-1 ring-brand-100" transition={{ type: "spring", stiffness: 380, damping: 32 }} />}
              <Icon size={18} className="relative" /><span className="relative">{label}</span>
            </Link>
          ))}
        </nav>
        <div className="mt-auto flex items-center gap-3 rounded-xl bg-ink-50 p-3">
          <span className="grid h-9 w-9 shrink-0 place-items-center rounded-full bg-brand-100 text-xs font-bold text-brand-700">{user.name.slice(0, 2).toUpperCase()}</span>
          <div className="min-w-0 flex-1"><p className="truncate text-sm font-semibold">{user.name}</p><p className="truncate text-xs text-ink-500">{user.email}</p></div>
          <form action={logout}><button className="rounded-lg p-2 text-ink-500 transition hover:bg-white hover:text-brand-600" aria-label="Sair" title="Sair"><LogOut size={16} /></button></form>
        </div>
      </aside>
      <nav className="fixed inset-x-0 bottom-0 z-30 flex justify-around overflow-x-auto border-t border-ink-100 bg-white/90 p-2 backdrop-blur md:hidden">
        {items.map(({ href, label, icon: Icon }) => (
          <Link key={href} href={href} className={`flex shrink-0 flex-col items-center gap-0.5 rounded-lg px-2 py-1.5 text-[10px] font-semibold ${active(href) ? "text-brand-600" : "text-ink-400"}`}><Icon size={20} />{label}</Link>
        ))}
        <form action={logout} className="flex"><button className="flex shrink-0 flex-col items-center gap-0.5 rounded-lg px-2 py-1.5 text-[10px] font-semibold text-ink-400"><LogOut size={20} />Sair</button></form>
      </nav>
    </>
  );
}
