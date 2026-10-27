import Link from "next/link";
export default function NotFound() {
  return (
    <div className="grid min-h-screen place-items-center p-6 text-center">
      <div><h1 className="text-2xl font-extrabold">Página não encontrada</h1>
        <Link href="/dashboard" className="btn mt-6">Voltar ao início</Link></div>
    </div>
  );
}
