"use client";
import { useState } from "react";
import { useFormState, useFormStatus } from "react-dom";
import { AnimatePresence, motion } from "framer-motion";
import { PAYERS } from "@/lib/payer";
import { maskCpf, maskPhone, maskCep } from "@/lib/cpf";

type Initial = Record<string, string | null | undefined>;
type Action = (prev: { error?: string } | undefined, fd: FormData) => Promise<{ error?: string } | undefined>;
const UFS = "AC AL AP AM BA CE DF ES GO MA MT MS MG PA PB PR PE PI RJ RN RS RO RR SC SP SE TO".split(" ");

function Submit({ label }: { label: string }) {
  const { pending } = useFormStatus();
  return <button className="btn disabled:opacity-60" disabled={pending}>{pending ? "Salvando..." : label}</button>;
}
function Section({ title, children }: { title: string; children: React.ReactNode }) {
  return <section className="card p-6"><h2 className="mb-4 font-bold">{title}</h2><div className="grid gap-4 sm:grid-cols-2">{children}</div></section>;
}

export function PatientForm({ action, initial = {}, submitLabel, services, serviceLabel }: { action: Action; initial?: Initial; submitLabel: string; services: Record<string, { label: string }>; serviceLabel: string }) {
  const [state, formAction] = useFormState(action, undefined);
  const [payer, setPayer] = useState(initial.payerType ?? "PARTICULAR");
  const [cpf, setCpf] = useState(maskCpf(initial.cpf ?? ""));
  const [phone, setPhone] = useState(maskPhone(initial.phone ?? ""));
  const [emPhone, setEmPhone] = useState(maskPhone(initial.emergencyPhone ?? ""));
  const [cep, setCep] = useState(maskCep(initial.zipCode ?? ""));
  const v = (k: string) => initial[k] ?? "";

  return (
    <form action={formAction} className="space-y-5">
      {initial.id && <input type="hidden" name="id" value={initial.id} />}

      <Section title="Origem do paciente">
        <div className="grid gap-3 sm:col-span-2 sm:grid-cols-3">
          {Object.entries(PAYERS).map(([k, p]) => (
            <label key={k} className={`cursor-pointer rounded-xl border-2 p-4 transition ${payer === k ? "border-brand-500 bg-brand-50" : "border-ink-100 hover:border-ink-200"}`}>
              <input type="radio" name="payerType" value={k} checked={payer === k} onChange={() => setPayer(k)} className="sr-only" />
              <p className="text-sm font-bold">{p.label}</p><p className="mt-0.5 text-xs text-ink-500">{p.hint}</p>
            </label>
          ))}
        </div>
        <AnimatePresence initial={false}>
          {payer === "PLANO_SAUDE" && (
            <motion.div className="grid gap-4 overflow-hidden sm:col-span-2 sm:grid-cols-2" initial={{ opacity: 0, height: 0 }} animate={{ opacity: 1, height: "auto" }} exit={{ opacity: 0, height: 0 }}>
              <div><label className="label" htmlFor="insurerName">Operadora *</label><input id="insurerName" name="insurerName" defaultValue={v("insurerName")} className="input" placeholder="Ex.: Unimed" /></div>
              <div><label className="label" htmlFor="insuranceCard">Nº da carteirinha</label><input id="insuranceCard" name="insuranceCard" defaultValue={v("insuranceCard")} className="input" /></div>
            </motion.div>
          )}
        </AnimatePresence>
      </Section>

      <Section title="Dados pessoais">
        <div className="sm:col-span-2"><label className="label" htmlFor="name">Nome completo *</label><input id="name" name="name" required defaultValue={v("name")} className="input" /></div>
        <div><label className="label" htmlFor="cpf">CPF *</label><input id="cpf" name="cpf" required inputMode="numeric" value={cpf} onChange={(e) => setCpf(maskCpf(e.target.value))} className="input" placeholder="000.000.000-00" /></div>
        <div><label className="label" htmlFor="birthDate">Data de nascimento *</label><input id="birthDate" name="birthDate" type="date" required defaultValue={v("birthDate")} className="input" /></div>
        <div><label className="label" htmlFor="phone">Telefone / WhatsApp *</label><input id="phone" name="phone" required inputMode="tel" value={phone} onChange={(e) => setPhone(maskPhone(e.target.value))} className="input" placeholder="(61) 99999-9999" /></div>
        <div><label className="label" htmlFor="email">E-mail</label><input id="email" name="email" type="email" defaultValue={v("email")} className="input" /></div>
        <div><label className="label" htmlFor="sex">Sexo</label>
          <select id="sex" name="sex" defaultValue={v("sex")} className="input"><option value="">—</option><option value="F">Feminino</option><option value="M">Masculino</option><option value="O">Outro</option></select></div>
        <div><label className="label" htmlFor="therapy">{serviceLabel}</label>
          <select id="therapy" name="therapy" defaultValue={v("therapy") || Object.keys(services)[0]} className="input">{Object.entries(services).map(([k, t]) => <option key={k} value={k}>{t.label}</option>)}</select></div>
      </Section>

      <Section title="Endereço">
        <div><label className="label" htmlFor="zipCode">CEP</label><input id="zipCode" name="zipCode" inputMode="numeric" value={cep} onChange={(e) => setCep(maskCep(e.target.value))} className="input" placeholder="00000-000" /></div>
        <div><label className="label" htmlFor="street">Rua / logradouro</label><input id="street" name="street" defaultValue={v("street")} className="input" /></div>
        <div><label className="label" htmlFor="number">Número</label><input id="number" name="number" defaultValue={v("number")} className="input" /></div>
        <div><label className="label" htmlFor="complement">Complemento</label><input id="complement" name="complement" defaultValue={v("complement")} className="input" /></div>
        <div><label className="label" htmlFor="district">Bairro</label><input id="district" name="district" defaultValue={v("district")} className="input" /></div>
        <div className="grid grid-cols-[1fr_5.5rem] gap-3">
          <div><label className="label" htmlFor="city">Cidade</label><input id="city" name="city" defaultValue={v("city")} className="input" /></div>
          <div><label className="label" htmlFor="state">UF</label><select id="state" name="state" defaultValue={v("state")} className="input"><option value="">—</option>{UFS.map((u) => <option key={u}>{u}</option>)}</select></div>
        </div>
      </Section>

      <Section title="Contato de emergência">
        <div><label className="label" htmlFor="emergencyName">Nome</label><input id="emergencyName" name="emergencyName" defaultValue={v("emergencyName")} className="input" /></div>
        <div><label className="label" htmlFor="emergencyPhone">Telefone</label><input id="emergencyPhone" name="emergencyPhone" inputMode="tel" value={emPhone} onChange={(e) => setEmPhone(maskPhone(e.target.value))} className="input" /></div>
      </Section>

      {state?.error && <motion.p initial={{ opacity: 0, y: -6 }} animate={{ opacity: 1, y: 0 }} role="alert" className="rounded-xl bg-red-50 px-4 py-3 text-sm text-red-700">{state.error}</motion.p>}
      <div className="flex justify-end"><Submit label={submitLabel} /></div>
    </form>
  );
}
