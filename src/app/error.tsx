"use client";
export default function Error({ reset }: { error: Error; reset: () => void }) {
  return (
    <div className="grid min-h-screen place-items-center p-6 text-center">
      <div><h1 className="text-2xl font-extrabold">Algo deu errado</h1>
        <p className="mt-2 text-sm text-ink-500">Tente novamente. Se o problema continuar, avise o suporte.</p>
        <button onClick={reset} className="btn mt-6">Tentar de novo</button></div>
    </div>
  );
}
