"use client";
import { useFormState, useFormStatus } from "react-dom";
import { createUser } from "@/actions-team";
import { ROLES } from "@/lib/roles";

function Submit() {
  const { pending } = useFormStatus();
  return <button className="btn disabled:opacity-60" disabled={pending}>{pending ? "Salvando..." : "Cadastrar profissional"}</button>;
}

export function UserForm({ council }: { council: string }) {
  const [state, action] = useFormState(createUser, undefined);
  return (
    <form action={action} className="card space-y-4 p-6">
      <div className="grid gap-4 sm:grid-cols-2">
        <div className="sm:col-span-2"><label className="label" htmlFor="name">Nome *</label><input id="name" name="name" required className="input" /></div>
        <div><label className="label" htmlFor="email">E-mail (usado para entrar) *</label><input id="email" name="email" type="email" required className="input" /></div>
        <div><label className="label" htmlFor="registration">Registro no {council}</label><input id="registration" name="registration" className="input" placeholder="Número do registro" /></div>
        <div><label className="label" htmlFor="role">Perfil</label>
          <select id="role" name="role" defaultValue="PROFISSIONAL" className="input">{Object.entries(ROLES).map(([k, l]) => <option key={k} value={k}>{l}</option>)}</select></div>
        <div><label className="label" htmlFor="password">Senha inicial (mín. 10 caracteres) *</label><input id="password" name="password" type="password" minLength={10} required autoComplete="new-password" className="input" /></div>
      </div>
      <p className="text-xs text-ink-500">Administradores gerenciam a equipe. Passe a senha inicial por um canal seguro e peça para a pessoa guardá-la.</p>
      {state?.error && <p role="alert" className="rounded-xl bg-red-50 px-4 py-3 text-sm text-red-700">{state.error}</p>}
      <div className="flex justify-end"><Submit /></div>
    </form>
  );
}
