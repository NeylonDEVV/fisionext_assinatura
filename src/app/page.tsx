import type { Metadata } from "next";
import Link from "next/link";
import { Bricolage_Grotesque } from "next/font/google";
import { Check, ChevronDown } from "lucide-react";
import { Logo } from "@/components/sidebar";
import { Stagger, Item } from "@/components/motion";
import { AgendaDemo } from "@/components/landing/agenda-demo";
import { contactHref, siteConfig } from "@/lib/site";
import { PLANS } from "@/lib/plans";
import { SPECIALTIES } from "@/lib/specialties";
import { brl } from "@/lib/utils";

const display = Bricolage_Grotesque({ subsets: ["latin"], variable: "--font-display", display: "swap" });

export const dynamic = "force-dynamic"; // lê SITE_WHATSAPP / SITE_EMAIL / SITE_SHOW_PRICING a cada pedido
export const metadata: Metadata = {
  title: "FisioNext: agenda, prontuário e financeiro para fisioterapeutas",
  description:
    "Sistema de gestão para fisioterapeutas, nutricionistas e psicólogos: agenda, avaliação e evolução do paciente, histórico de atendimentos e financeiro. Peça um teste gratuito.",
  robots: { index: true, follow: true },
};

const FAQ = [
  ["Preciso instalar alguma coisa?", "Não. O FisioNext funciona no navegador do computador, do tablet ou do celular."],
  ["Serve para consultório individual e para clínica?", "Serve para os dois. Cada profissional entra com o próprio e-mail e senha, e o administrador gerencia a equipe."],
  ["Como funciona o Pilates?", "As aulas têm agenda própria, separada das consultas. Os alunos que começam no mesmo horário aparecem agrupados na turma."],
  ["Já uso planilha ou outro sistema. Consigo trocar?", "Conte como você registra hoje e vemos juntos a melhor forma de trazer seus pacientes para o FisioNext."],
  ["Como é a cobrança?", "É uma assinatura mensal, paga por Pix, boleto ou cartão."],
  ["O teste é gratuito?", "Sim. Combinamos o período de teste na primeira conversa, sem compromisso."],
] as const;

const MORE = [
  ["Equipe com login individual", "Cada profissional entra com o próprio e-mail e senha. O administrador cadastra pessoas, redefine senhas e desativa acessos."],
  ["Agenda de cada profissional", "Filtre a agenda por pessoa da equipe e veja quem atende cada sessão."],
  ["Cadastro completo desde o início", "CPF, data de nascimento, contato e convênio ficam registrados, prontos para quando você precisar de um laudo."],
  ["Funciona no celular", "Consulte a agenda e registre a evolução do paciente no navegador, sem instalar aplicativo."],
] as const;

const STEPS = [
  ["Fale com a gente", "Conte como é a sua rotina e combinamos o teste gratuito."],
  ["Cadastre a clínica e a equipe", "Entre, cadastre os profissionais e traga os primeiros pacientes."],
  ["Atenda e acompanhe", "Use a agenda, registre admissão e evolução e confira o financeiro no fim do mês."],
] as const;

function Cta({ href, label, variant = "primary" }: { href: string; label: string; variant?: "primary" | "ghost" | "light" }) {
  const cls =
    variant === "primary" ? "btn !px-6 !py-3.5 text-base"
    : variant === "light" ? "inline-flex items-center justify-center rounded-xl bg-white px-6 py-3.5 text-base font-semibold text-brand-700 transition hover:bg-brand-50 active:scale-[.98]"
    : "btn-ghost !px-6 !py-3.5 text-base";
  return href.startsWith("/") || href.startsWith("#")
    ? <Link href={href} className={cls}>{label}</Link>
    : <a href={href} className={cls} target={href.startsWith("http") ? "_blank" : undefined} rel="noopener noreferrer">{label}</a>;
}

export default function Landing() {
  const cfg = siteConfig();
  const contact = contactHref(cfg);
  const main = cfg.signupEnabled ? { href: "/cadastro", label: `Começar teste grátis de ${cfg.trialDays} dias` } : contact ? { href: contact, label: "Quero testar gratuitamente" } : { href: "/login", label: "Entrar no sistema" };
  const year = new Date().getFullYear();

  return (
    <div className={`${display.variable} bg-white text-ink-800`}>
      <header className="sticky top-0 z-30 border-b border-ink-100 bg-white/85 backdrop-blur">
        <div className="mx-auto flex h-16 max-w-6xl items-center justify-between gap-4 px-5 md:px-8">
          <Link href="/" aria-label="FisioNext, página inicial"><Logo /></Link>
          <nav aria-label="Seções" className="hidden items-center gap-7 text-sm font-semibold text-ink-600 md:flex">
            <a href="#funcionalidades" className="transition hover:text-brand-600">Funcionalidades</a>
            <a href="#como-comecar" className="transition hover:text-brand-600">Como começar</a>
            <a href="#perguntas" className="transition hover:text-brand-600">Perguntas</a>
          </nav>
          <div className="flex items-center gap-2">
            <Link href="/login" className="rounded-xl px-3 py-2 text-sm font-semibold text-ink-600 transition hover:bg-ink-100">Entrar</Link>
            {(cfg.signupEnabled || contact) && <Cta href={main.href} label={cfg.signupEnabled ? "Teste grátis" : "Quero testar"} />}
          </div>
        </div>
      </header>

      <main>
        {/* Abertura */}
        <section className="relative overflow-hidden bg-ink-50">
          <div aria-hidden className="absolute -right-32 -top-32 h-[28rem] w-[28rem] rounded-full bg-brand-500" />
          <div className="relative mx-auto grid max-w-6xl items-center gap-12 px-5 py-16 md:px-8 lg:grid-cols-[1.05fr_1fr] lg:py-24">
            <Stagger className="max-w-xl">
              <Item><p className="mb-5 inline-block rounded-full bg-brand-100 px-3.5 py-1.5 text-sm font-semibold text-brand-700">Para fisioterapeutas, nutricionistas e psicólogos de Brasília</p></Item>
              <Item>
                <h1 className="font-display text-4xl font-extrabold leading-[1.05] tracking-tight text-ink-900 sm:text-5xl lg:text-[3.5rem]">
                  Agenda, evolução e financeiro do seu consultório, no mesmo lugar
                </h1>
              </Item>
              <Item><p className="mt-6 text-lg leading-relaxed text-ink-600">Consultas e aulas de Pilates em agendas separadas, admissão e evolução de cada paciente e o saldo por origem: particular, plano de saúde e parcerias.</p></Item>
              <Item>
                <div className="mt-8 flex flex-wrap gap-3">
                  <Cta href={main.href} label={main.label} />
                  <Cta href="#funcionalidades" label="Ver como funciona" variant="ghost" />
                </div>
                {contact && <p className="mt-4 text-sm text-ink-500">Sem compromisso. Combinamos o período de teste na primeira conversa.</p>}
              </Item>
            </Stagger>
            <Stagger>
              <Item><AgendaDemo /></Item>
            </Stagger>
          </div>
        </section>

        {/* Funcionalidades */}
        <section id="funcionalidades" className="scroll-mt-20 py-20 md:py-28">
          <div className="mx-auto max-w-6xl space-y-24 px-5 md:px-8">
            <div className="grid items-center gap-10 lg:grid-cols-2">
              <div className="max-w-lg">
                <h2 className="font-display text-3xl font-extrabold tracking-tight text-ink-900 sm:text-4xl">Da primeira avaliação à alta, tudo registrado</h2>
                <p className="mt-5 text-lg leading-relaxed text-ink-600">A admissão guarda a anamnese, a avaliação física e o plano de tratamento em três etapas. Cada sessão entra na linha do tempo do paciente, com a dor num gráfico e o nome de quem registrou.</p>
              </div>
              <div aria-hidden className="card p-6">
                <div className="flex items-baseline justify-between">
                  <p className="text-sm font-bold">Evolução da dor</p>
                  <p className="text-xs text-ink-400">Exemplo com dados fictícios</p>
                </div>
                <svg viewBox="0 0 240 100" className="mt-4 w-full">
                  <polyline points="12,16 58,26 104,40 150,54 196,66 228,76" fill="none" stroke="#F26B1D" strokeWidth="3.5" strokeLinecap="round" strokeLinejoin="round" />
                  {[[12, 16], [58, 26], [104, 40], [150, 54], [196, 66], [228, 76]].map(([x, y]) => <circle key={x} cx={x} cy={y} r="4.5" fill="#fff" stroke="#F26B1D" strokeWidth="2.5" />)}
                </svg>
                <div className="mt-4 flex justify-between text-sm">
                  <p><span className="font-bold">Admissão</span><br /><span className="text-ink-500">dor 8 de 10</span></p>
                  <p className="text-right"><span className="font-bold">Sessão 6</span><br /><span className="text-ink-500">dor 3 de 10</span></p>
                </div>
              </div>
            </div>

            <div className="grid items-center gap-10 lg:grid-cols-2">
              <div aria-hidden className="card order-2 space-y-5 p-6 lg:order-1">
                <div className="flex items-baseline justify-between">
                  <p className="text-sm font-bold">Saldo por origem</p>
                  <p className="text-xs text-ink-400">Exemplo com dados fictícios</p>
                </div>
                {[
                  { name: "Particular", paid: 3400, open: 1200 },
                  { name: "Plano de saúde", paid: 5200, open: 2350 },
                  { name: "Parcerias", paid: 1800, open: 400 },
                ].map((o) => (
                  <div key={o.name}>
                    <div className="mb-1.5 flex justify-between text-sm"><span className="font-semibold">{o.name}</span><span className="text-ink-500">a receber {brl(o.open * 100)}</span></div>
                    <div className="flex h-2.5 overflow-hidden rounded-full bg-brand-100"><span className="bg-brand-500" style={{ width: `${(o.paid / (o.paid + o.open)) * 100}%` }} /></div>
                    <p className="mt-1 text-xs text-ink-400">recebido {brl(o.paid * 100)}</p>
                  </div>
                ))}
              </div>
              <div className="order-1 max-w-lg lg:order-2">
                <h2 className="font-display text-3xl font-extrabold tracking-tight text-ink-900 sm:text-4xl">Saiba quanto cada origem já pagou</h2>
                <p className="mt-5 text-lg leading-relaxed text-ink-600">Cadastre o paciente como particular, plano de saúde ou parceria e acompanhe o saldo de cada um, inclusive por operadora. Receba em Pix, dinheiro, cartão de crédito ou débito, e veja o total de cada forma de pagamento.</p>
              </div>
            </div>

            <div>
              <h2 className="font-display text-3xl font-extrabold tracking-tight text-ink-900 sm:text-4xl">E o resto do dia a dia</h2>
              <dl className="mt-8 grid gap-x-12 md:grid-cols-2">
                {MORE.map(([t, d]) => (
                  <div key={t} className="border-t border-ink-200 py-6">
                    <dt className="font-bold text-ink-900">{t}</dt>
                    <dd className="mt-1.5 leading-relaxed text-ink-600">{d}</dd>
                  </div>
                ))}
              </dl>
            </div>
          </div>
        </section>

        {/* Uma plataforma, três áreas */}
        <section id="areas" className="scroll-mt-20 py-20 md:py-28">
          <div className="mx-auto max-w-6xl px-5 md:px-8">
            <h2 className="font-display text-3xl font-extrabold tracking-tight text-ink-900 sm:text-4xl">O sistema se adapta à sua área</h2>
            <p className="mt-4 max-w-2xl text-lg leading-relaxed text-ink-600">Você escolhe a área no cadastro, e o FisioNext já vem com os tipos de atendimento, o formulário de avaliação e o acompanhamento que ela pede.</p>
            <dl className="mt-10 grid gap-x-12 md:grid-cols-3">
              {Object.values(SPECIALTIES).map((s) => (
                <div key={s.key} className="border-t border-ink-200 py-6">
                  <dt className="font-bold text-ink-900">{s.label}</dt>
                  <dd className="mt-1.5 leading-relaxed text-ink-600">{s.blurb}</dd>
                </div>
              ))}
            </dl>
          </div>
        </section>

        {/* Como começar: sequência real */}
        <section id="como-comecar" className="scroll-mt-20 bg-ink-50 py-20 md:py-28">
          <div className="mx-auto max-w-6xl px-5 md:px-8">
            <h2 className="font-display text-3xl font-extrabold tracking-tight text-ink-900 sm:text-4xl">Como começar</h2>
            <ol className="mt-10 grid gap-8 md:grid-cols-3">
              {STEPS.map(([t, d], i) => (
                <li key={t} className="flex gap-4">
                  <span className="grid h-10 w-10 shrink-0 place-items-center rounded-full bg-brand-500 text-lg font-extrabold text-white">{i + 1}</span>
                  <div><h3 className="font-bold text-ink-900">{t}</h3><p className="mt-1.5 leading-relaxed text-ink-600">{d}</p></div>
                </li>
              ))}
            </ol>
          </div>
        </section>

        {/* Segurança */}
        <section className="py-20 md:py-28">
          <div className="mx-auto grid max-w-6xl gap-10 px-5 md:px-8 lg:grid-cols-[1fr_1.1fr]">
            <div className="max-w-md">
              <h2 className="font-display text-3xl font-extrabold tracking-tight text-ink-900 sm:text-4xl">Dados de saúde pedem cuidado</h2>
              <p className="mt-5 text-lg leading-relaxed text-ink-600">O FisioNext foi pensado para a rotina de quem guarda informações sensíveis de pacientes.</p>
            </div>
            <ul className="divide-y divide-ink-100 border-y border-ink-100">
              {[
                "Cada pessoa entra com o próprio e-mail e senha, e as senhas ficam guardadas de forma protegida.",
                "Acesso por perfil: administradores gerenciam a equipe, profissionais usam a clínica.",
                "Admissões e evoluções mostram quem as registrou.",
                "Bloqueio automático depois de várias tentativas de entrada com senha errada.",
                "Conexão segura (HTTPS) e cópias de segurança diárias.",
              ].map((t) => (
                <li key={t} className="flex gap-3 py-4"><Check size={20} className="mt-0.5 shrink-0 text-brand-600" aria-hidden /><span className="leading-relaxed text-ink-700">{t}</span></li>
              ))}
            </ul>
          </div>
        </section>

        {/* Planos: só aparece quando SITE_SHOW_PRICING=true */}
        {cfg.showPricing && (
          <section id="planos" className="scroll-mt-20 bg-ink-50 py-20 md:py-28">
            <div className="mx-auto max-w-4xl px-5 md:px-8">
              <h2 className="font-display text-3xl font-extrabold tracking-tight text-ink-900 sm:text-4xl">Planos</h2>
              <p className="mt-4 text-lg text-ink-600">Assinatura mensal, paga por Pix, boleto ou cartão.</p>
              <div className="mt-10 grid items-stretch gap-6 md:grid-cols-[1fr_1.15fr]">
                {([["INDIVIDUAL", ["1 profissional", "Agenda, pacientes e financeiro", "Admissão e evolução"], false], ["CLINICA", ["Até 3 profissionais", "Agenda de consultas e de Pilates", "Equipe com login individual", "Saldo por origem e operadora"], true]] as const).map(([k, feats, hi]) => (
                  <div key={k} className={`rounded-2xl p-7 ${hi ? "bg-brand-500 text-white shadow-soft" : "bg-white ring-1 ring-ink-100"}`}>
                    <h3 className="text-lg font-bold">{PLANS[k].label}</h3>
                    <p className={`mt-1 text-sm ${hi ? "text-brand-100" : "text-ink-500"}`}>{PLANS[k].description}</p>
                    <p className="mt-5 font-display text-4xl font-extrabold">{brl(PLANS[k].priceCents)}<span className={`text-base font-medium ${hi ? "text-brand-100" : "text-ink-500"}`}> por mês</span></p>
                    <ul className="mt-6 space-y-2.5 text-sm">
                      {feats.map((f) => <li key={f} className="flex gap-2.5"><Check size={18} className={`mt-0.5 shrink-0 ${hi ? "text-white" : "text-brand-600"}`} aria-hidden />{f}</li>)}
                    </ul>
                  </div>
                ))}
              </div>
            </div>
          </section>
        )}

        {/* Perguntas */}
        <section id="perguntas" className="scroll-mt-20 py-20 md:py-28">
          <div className="mx-auto max-w-3xl px-5 md:px-8">
            <h2 className="font-display text-3xl font-extrabold tracking-tight text-ink-900 sm:text-4xl">Perguntas frequentes</h2>
            <div className="mt-8 divide-y divide-ink-100 border-y border-ink-100">
              {FAQ.map(([q, a]) => (
                <details key={q} className="group py-5">
                  <summary className="flex cursor-pointer list-none items-center justify-between gap-4 font-bold text-ink-900 [&::-webkit-details-marker]:hidden">
                    {q}<ChevronDown size={20} className="shrink-0 text-ink-400 transition group-open:rotate-180" aria-hidden />
                  </summary>
                  <p className="mt-3 max-w-2xl leading-relaxed text-ink-600">{a}</p>
                </details>
              ))}
            </div>
          </div>
        </section>

        {/* Convite final */}
        <section id="contato" className="scroll-mt-20 bg-brand-500">
          <div className="mx-auto flex max-w-6xl flex-col items-start justify-between gap-8 px-5 py-16 md:flex-row md:items-center md:px-8">
            <div className="max-w-xl">
              <h2 className="font-display text-3xl font-extrabold tracking-tight text-white sm:text-4xl">Veja o FisioNext funcionando na sua rotina</h2>
              <p className="mt-3 text-lg text-brand-50">Conte como é a sua clínica e combinamos o teste.</p>
            </div>
            <Cta href={main.href} label={main.label} variant="light" />
          </div>
        </section>
      </main>

      <footer className="border-t border-ink-100 py-10">
        <div className="mx-auto flex max-w-6xl flex-col gap-6 px-5 md:flex-row md:items-center md:justify-between md:px-8">
          <div><Logo /><p className="mt-3 text-sm text-ink-500">Gestão para fisioterapeutas e clínicas.</p></div>
          <nav aria-label="Rodapé" className="flex flex-wrap gap-x-6 gap-y-2 text-sm font-semibold text-ink-600">
            <Link href="/login" className="hover:text-brand-600">Entrar</Link>
            {contact && <a href={contact} target={contact.startsWith("http") ? "_blank" : undefined} rel="noopener noreferrer" className="hover:text-brand-600">Fale com a gente</a>}
          </nav>
        </div>
        <p className="mx-auto mt-8 max-w-6xl px-5 text-xs text-ink-400 md:px-8">© {year} FisioNext</p>
      </footer>
    </div>
  );
}
