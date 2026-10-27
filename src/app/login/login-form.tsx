"use client";
import { useState } from "react";
import { useFormState, useFormStatus } from "react-dom";
import { motion } from "framer-motion";
import { Eye, EyeOff } from "lucide-react";
import { login } from "@/actions-auth";

function Submit() {
  const { pending } = useFormStatus();
  return <button className="btn w-full disabled:opacity-60" disabled={pending}>{pending ? "Entrando..." : "Entrar"}</button>;
}

export function LoginForm() {
  const [state, action] = useFormState(login, undefined);
  const [show, setShow] = useState(false);
  return (
    <form action={action} className="space-y-4">
      <div><label className="label" htmlFor="email">E-mail</label>
        <input id="email" name="email" type="email" required autoComplete="email" className="input" placeholder="voce@clinica.com" /></div>
      <div><label className="label" htmlFor="password">Senha</label>
        <div className="relative">
          <input id="password" name="password" type={show ? "text" : "password"} required autoComplete="current-password" className="input pr-11" />
          <button type="button" onClick={() => setShow(!show)} className="absolute right-3 top-1/2 -translate-y-1/2 text-ink-400 hover:text-ink-700" aria-label={show ? "Ocultar senha" : "Mostrar senha"}>
            {show ? <EyeOff size={18} /> : <Eye size={18} />}
          </button>
        </div></div>
      {state?.error && <motion.p initial={{ opacity: 0, y: -6 }} animate={{ opacity: 1, y: 0 }} role="alert" className="rounded-xl bg-red-50 px-3.5 py-2.5 text-sm text-red-700">{state.error}</motion.p>}
      <Submit />
    </form>
  );
}
