"use client";
import { useState } from "react";
import { useFormState, useFormStatus } from "react-dom";
import { startSubscription } from "@/actions-billing";
import { BILLING_TYPES } from "@/lib/billing";
import { maskCpfCnpj, maskPhone } from "@/lib/cpf";
import { brl } from "@/lib/utils";

type Plan = { label: string; description: string; priceCents: number };

function Submit() {
  const { pending } = useFormStatus();
  return <button className="btn disabled:opacity-60" disabled={pending}>{pending ? "Criando assinatura..." : "Assinar"}</button>;
}

export function SubscribeForm({ plans, initial }: { plans: Record<string, Plan>; initial: { name: string; document: string; email: string; phone: string } }) {
  const [state, action] = useFormState(startSubscription, undefined);
  const [plan, setPlan] = useState(Object.keys(plans)[0]);
  const [doc, setDoc] = useState(maskCpfCnpj(initial.document));
  const [phone, setPhone] = useState(maskPhone(initial.phone));
  return (
    <form action={action} className="space-y-5">
      <div className="grid gap-3 sm:grid-cols-2">
        {Object.entries(plans).map(([k, p]) => (
          <label key={k} className={`cursor-pointer rounded-xl border-2 p-4 transition ${plan === k ? "border-brand-500 bg-brand-50" : "border-ink-100 hover:border-ink-200"}`}>
            <input type="radio" name="plan" value={k} checked={plan === k} onChange={() => setPlan(k)} className="sr-only" />
            <p className="text-sm font-bold">{p.label}</p>
            <p className="text-xs text-ink-500">{p.description}</p>
            <p className="mt-2 text-xl font-extrabold">{brl(p.priceCents)}<span className="text-xs font-medium text-ink-500"> /mês</span></p>
          </label>
        ))}
      </div>
      <div className="card grid gap-4 p-6 sm:grid-cols-2">
        <div className="sm:col-span-2"><label className="label" htmlFor="name">Clínica ou responsável *</label><input id="name" name="name" required defaultValue={initial.name} className="input" /></div>
        <div><label className="label" htmlFor="document">CPF ou CNPJ *</label><input id="document" name="document" required inputMode="numeric" value={doc} onChange={(e) => setDoc(maskCpfCnpj(e.target.value))} className="input" /></div>
        <div><label className="label" htmlFor="email">E-mail das faturas *</label><input id="email" name="email" type="email" required defaultValue={initial.email} className="input" /></div>
        <div><label className="label" htmlFor="phone">Telefone</label><input id="phone" name="phone" inputMode="tel" value={phone} onChange={(e) => setPhone(maskPhone(e.target.value))} className="input" /></div>
        <div><label className="label" htmlFor="billingType">Forma de pagamento</label>
          <select id="billingType" name="billingType" defaultValue="PIX" className="input">{Object.entries(BILLING_TYPES).map(([k, l]) => <option key={k} value={k}>{l}</option>)}</select></div>
      </div>
      <p className="text-xs text-ink-500">A primeira fatura vence em 3 dias. Depois, uma nova fatura é gerada todo mês e enviada por e-mail. O pagamento é feito na página segura da Asaas; o FisioNext não guarda dados de cartão.</p>
      {state?.error && <p role="alert" className="rounded-xl bg-red-50 px-4 py-3 text-sm text-red-700">{state.error}</p>}
      <div className="flex justify-end"><Submit /></div>
    </form>
  );
}
