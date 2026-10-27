import { Logo } from "@/components/sidebar";
import { LoginForm } from "./login-form";

export default function Login() {
  return (
    <div className="grid min-h-screen md:grid-cols-[1.1fr_1fr]">
      <section className="relative hidden overflow-hidden bg-gradient-to-br from-brand-500 to-brand-700 p-14 text-white md:flex md:flex-col md:justify-end">
        <div className="absolute -right-24 -top-24 h-96 w-96 rounded-full bg-white/10" />
        <div className="absolute -bottom-32 left-10 h-80 w-80 rounded-full bg-ink-900/15" />
        <h1 className="relative max-w-md text-4xl font-extrabold leading-tight">Agenda, evolução e financeiro da sua clínica num só lugar.</h1>
        <p className="relative mt-4 max-w-sm text-brand-100">Registre cada sessão, acompanhe a dor dos pacientes e saiba o que entrou no mês.</p>
      </section>
      <section className="flex items-center justify-center p-8">
        <div className="w-full max-w-sm">
          <Logo />
          <h2 className="mb-6 mt-10 text-2xl font-bold">Entre na sua clínica</h2>
          <LoginForm />
        </div>
      </section>
    </div>
  );
}
