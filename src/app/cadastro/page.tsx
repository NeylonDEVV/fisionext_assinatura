import type { Metadata } from "next";
import Link from "next/link";
import { Logo } from "@/components/sidebar";
import { SignupWizard } from "@/components/signup-wizard";
import { SPECIALTIES } from "@/lib/specialties";
import { siteConfig } from "@/lib/site";

export const dynamic = "force-dynamic";
export const metadata: Metadata = { title: "Criar conta | FisioNext", robots: { index: false, follow: false } };

export default function Cadastro() {
  const cfg = siteConfig();
  const areas = Object.values(SPECIALTIES).map((s) => ({ key: s.key, label: s.label, council: s.council, blurb: s.blurb }));
  return (
    <div className="grid min-h-screen md:grid-cols-[1fr_1.1fr]">
      <section className="relative hidden overflow-hidden bg-brand-500 p-14 text-white md:flex md:flex-col md:justify-end">
        <div className="absolute -right-24 -top-24 h-96 w-96 rounded-full bg-white/10" />
        <h1 className="relative max-w-md text-4xl font-extrabold leading-tight">Seu consultório organizado, do primeiro atendimento ao financeiro.</h1>
        <p className="relative mt-4 max-w-sm text-brand-100">Fisioterapia, nutrição e psicologia, cada uma com o formulário e o acompanhamento que a sua área pede.</p>
      </section>
      <section className="flex flex-col items-center justify-center p-8">
        <div className="mb-8 w-full max-w-lg"><Link href="/"><Logo /></Link></div>
        {cfg.signupEnabled
          ? <SignupWizard areas={areas} trialDays={cfg.trialDays} />
          : <div className="w-full max-w-lg"><h2 className="text-2xl font-bold">Cadastros em breve</h2><p className="mt-2 text-ink-600">Ainda não abrimos os cadastros. Já tem conta? <Link href="/login" className="font-semibold text-brand-600 underline">Entrar</Link>.</p></div>}
        <p className="mt-6 w-full max-w-lg text-sm text-ink-500">Já tem conta? <Link href="/login" className="font-semibold text-brand-600 underline">Entrar</Link></p>
      </section>
    </div>
  );
}
