import type { Metadata } from "next";
import Link from "next/link";
import { Logo } from "@/components/sidebar";

export const metadata: Metadata = { title: "Política de privacidade | FisioNext", robots: { index: false, follow: false } };

export default function Page() {
  return (
    <main className="mx-auto max-w-2xl px-6 py-12">
      <Link href="/"><Logo /></Link>
      <h1 className="mt-10 text-3xl font-extrabold">Política de privacidade</h1>
      <p className="mt-6 rounded-xl bg-brand-50 px-4 py-3 text-sm text-brand-700">
        Versão provisória. Substitua este texto pelo documento revisado por um advogado (em src/app/privacidade/page.tsx) antes de abrir os cadastros.
        Dados de saúde são sensíveis: o documento final precisa tratar de LGPD, papéis (clínica como controladora e FisioNext como operador), segurança, retenção e exclusão de dados.
      </p>
    </main>
  );
}
