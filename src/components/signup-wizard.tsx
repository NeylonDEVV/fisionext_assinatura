"use client";
import Link from "next/link";
import { useRef, useState } from "react";
import { useFormState, useFormStatus } from "react-dom";
import { motion } from "framer-motion";
import { signUp } from "@/actions-signup";
import { maskPhone } from "@/lib/cpf";

type Area = { key: string; label: string; council: string; blurb: string };
const STEPS = ["Sua área", "Sua conta", "Seu consultório"];

function Submit({ days }: { days: number }) {
  const { pending } = useFormStatus();
  return <button className="btn disabled:opacity-60" disabled={pending}>{pending ? "Criando sua conta..." : `Começar teste grátis de ${days} dias`}</button>;
}

export function SignupWizard({ areas, trialDays }: { areas: Area[]; trialDays: number }) {
  const [state, action] = useFormState(signUp, undefined);
  const [step, setStep] = useState(0);
  const [area, setArea] = useState("");
  const [phone, setPhone] = useState("");
  const ref = useRef<HTMLFormElement>(null);

  function go(to: number) {
    if (to > step) {
      if (step === 0 && !area) return;
      const panel = ref.current?.querySelector(`[data-step="${step}"]`);
      for (const el of Array.from(panel?.querySelectorAll<HTMLInputElement>("input, select") ?? [])) if (!el.checkValidity()) { el.reportValidity(); return; }
    }
    setStep(to);
  }

  return (
    <form ref={ref} action={action} onKeyDown={(e) => { if (e.key === "Enter" && (e.target as HTMLElement).tagName === "INPUT" && (e.target as HTMLInputElement).type !== "checkbox") e.preventDefault(); }} className="w-full max-w-lg">
      <div className="mb-6">
        <div className="mb-2 flex justify-between text-xs font-semibold">
          {STEPS.map((s, i) => <span key={s} className={i <= step ? "text-brand-700" : "text-ink-400"}>{i + 1}. {s}</span>)}
        </div>
        <div className="h-1.5 overflow-hidden rounded-full bg-ink-100">
          <motion.div className="h-full rounded-full bg-brand-500" animate={{ width: `${((step + 1) / STEPS.length) * 100}%` }} transition={{ type: "spring", stiffness: 200, damping: 28 }} />
        </div>
      </div>

      <div data-step={0} hidden={step !== 0} className="step-in">
        <h2 className="text-2xl font-bold">Qual é a sua área?</h2>
        <p className="mt-1 text-sm text-ink-500">O sistema se adapta: tipos de atendimento, formulário de avaliação e acompanhamento.</p>
        <div className="mt-5 space-y-3">
          {areas.map((a) => (
            <label key={a.key} className={`block cursor-pointer rounded-xl border-2 p-4 transition ${area === a.key ? "border-brand-500 bg-brand-50" : "border-ink-100 hover:border-ink-200"}`}>
              <input type="radio" name="specialty" value={a.key} checked={area === a.key} onChange={() => setArea(a.key)} className="sr-only" />
              <p className="font-bold">{a.label}</p><p className="mt-0.5 text-sm text-ink-500">{a.blurb}</p>
            </label>
          ))}
        </div>
      </div>

      <div data-step={1} hidden={step !== 1} className="step-in space-y-4">
        <h2 className="text-2xl font-bold">Crie a sua conta</h2>
        <div><label className="label" htmlFor="name">Seu nome *</label><input id="name" name="name" required autoComplete="name" className="input" /></div>
        <div><label className="label" htmlFor="email">E-mail *</label><input id="email" name="email" type="email" required autoComplete="email" className="input" /></div>
        <div><label className="label" htmlFor="password">Senha (mínimo 10 caracteres) *</label><input id="password" name="password" type="password" minLength={10} required autoComplete="new-password" className="input" /></div>
      </div>

      <div data-step={2} hidden={step !== 2} className="step-in space-y-4">
        <h2 className="text-2xl font-bold">Seu consultório</h2>
        <div><label className="label" htmlFor="clinicName">Nome do consultório ou da clínica *</label><input id="clinicName" name="clinicName" required className="input" /></div>
        <div><label className="label" htmlFor="phone">Telefone</label><input id="phone" name="phone" inputMode="tel" value={phone} onChange={(e) => setPhone(maskPhone(e.target.value))} className="input" /></div>
        <label className="flex items-start gap-3 rounded-xl bg-ink-50 p-4 text-sm">
          <input type="checkbox" name="terms" required className="mt-0.5 h-4 w-4 accent-brand-500" />
          <span>Li e aceito os <Link href="/termos" target="_blank" className="font-semibold text-brand-600 underline">termos de uso</Link> e a <Link href="/privacidade" target="_blank" className="font-semibold text-brand-600 underline">política de privacidade</Link>. *</span>
        </label>
        <p className="text-sm text-ink-500">Teste grátis de {trialDays} dias, sem cartão. Depois, você escolhe se quer assinar.</p>
      </div>

      {state?.error && <p role="alert" className="mt-4 rounded-xl bg-red-50 px-4 py-3 text-sm text-red-700">{state.error}</p>}
      <div className="mt-6 flex justify-between">
        <button type="button" onClick={() => go(step - 1)} className={`btn-ghost ${step === 0 ? "invisible" : ""}`}>Voltar</button>
        {step < STEPS.length - 1 ? <button type="button" onClick={() => go(step + 1)} className="btn disabled:opacity-50" disabled={step === 0 && !area}>Continuar</button> : <Submit days={trialDays} />}
      </div>
    </form>
  );
}
