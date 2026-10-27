import { requireTenant } from "@/lib/tenant";
import { markPaid } from "@/actions";
import { brl, fmtDate } from "@/lib/utils";
import { computeBalances } from "@/lib/finance";
import { PAYERS, METHODS, payerCls, payerLabel, methodLabel } from "@/lib/payer";

export const dynamic = "force-dynamic";

export default async function Financeiro() {
  const { db } = await requireTenant();
  const all = await db.payment.findMany({
    include: { patient: { select: { name: true, payerType: true, insurerName: true } } }, orderBy: { dueDate: "desc" },
  });
  const payments = all.slice(0, 60);
  const { received, overdue, upcoming, byPayer, byInsurer, byMethod } = computeBalances(all);

  return (
    <div className="space-y-6">
      <div><h1 className="text-2xl font-extrabold">Financeiro</h1><p className="text-sm text-ink-500">Recebimentos dos atendimentos</p></div>

      <div className="grid gap-4 sm:grid-cols-3">
        <div className="rounded-2xl bg-brand-500 p-5 text-white"><p className="text-xs text-brand-100">Recebido no mês</p><p className="mt-2 text-2xl font-extrabold">{brl(received)}</p></div>
        <div className="card p-5"><p className="text-xs text-ink-500">Em atraso</p><p className="mt-2 text-2xl font-extrabold text-red-600">{brl(overdue)}</p></div>
        <div className="card p-5"><p className="text-xs text-ink-500">A vencer</p><p className="mt-2 text-2xl font-extrabold">{brl(upcoming)}</p></div>
      </div>

      <section>
        <h2 className="mb-3 font-bold">Saldo por origem do paciente</h2>
        <div className="grid gap-4 sm:grid-cols-3">
          {Object.entries(PAYERS).map(([k, p]) => {
            const b = byPayer[k] ?? { received: 0, pending: 0 };
            return (
              <div key={k} className="card p-5">
                <span className={`rounded-full px-2.5 py-1 text-xs font-semibold ${p.cls}`}>{p.label}</span>
                <p className="mt-4 text-xs text-ink-500">Saldo a receber</p>
                <p className="text-2xl font-extrabold">{brl(b.pending)}</p>
                <p className="mt-2 text-xs text-ink-500">Já recebido: <b className="text-ink-700">{brl(b.received)}</b> · Total: <b className="text-ink-700">{brl(b.received + b.pending)}</b></p>
              </div>
            );
          })}
        </div>
        {Object.keys(byInsurer).length > 0 && (
          <div className="card mt-4 overflow-x-auto">
            <table className="w-full text-left text-sm">
              <thead className="border-b border-ink-100 text-xs text-ink-500"><tr><th className="p-4 font-medium">Operadora</th><th className="p-4 font-medium">A receber</th><th className="p-4 font-medium">Recebido</th><th className="p-4 font-medium">Total</th></tr></thead>
              <tbody className="divide-y divide-ink-100">
                {Object.entries(byInsurer).sort((a, b) => b[1].pending - a[1].pending).map(([name, b]) => (
                  <tr key={name}><td className="p-4 font-semibold">{name}</td><td className="p-4 font-semibold text-brand-600">{brl(b.pending)}</td><td className="p-4">{brl(b.received)}</td><td className="p-4">{brl(b.received + b.pending)}</td></tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </section>

      <section>
        <h2 className="mb-3 font-bold">Recebido no mês por forma de pagamento</h2>
        <div className="grid grid-cols-2 gap-4 lg:grid-cols-4">
          {Object.entries(METHODS).map(([k, label]) => (
            <div key={k} className="card p-4"><p className="text-xs text-ink-500">{label}</p><p className="mt-1 text-lg font-extrabold">{brl(byMethod[k] ?? 0)}</p></div>
          ))}
        </div>
      </section>

      <div className="card overflow-x-auto">
        <table className="w-full text-left text-sm">
          <thead className="border-b border-ink-100 text-xs text-ink-500"><tr><th className="p-4 font-medium">Paciente</th><th className="p-4 font-medium">Origem</th><th className="p-4 font-medium">Vencimento</th><th className="p-4 font-medium">Valor</th><th className="p-4 font-medium">Status</th><th className="p-4" /></tr></thead>
          <tbody className="divide-y divide-ink-100">
            {payments.map((p) => (
              <tr key={p.id} className="transition hover:bg-ink-50">
                <td className="p-4 font-semibold">{p.patient.name}</td>
                <td className="p-4"><span className={`rounded-full px-2.5 py-1 text-xs font-semibold ${payerCls(p.patient.payerType)}`}>{payerLabel(p.patient.payerType)}</span></td>
                <td className="p-4 text-ink-600">{fmtDate(p.dueDate)}</td>
                <td className="p-4 font-semibold">{brl(p.amount)}</td>
                <td className="p-4"><span className={`rounded-full px-2.5 py-1 text-xs font-semibold ${p.status === "PAGO" ? "bg-emerald-100 text-emerald-700" : "bg-brand-100 text-brand-700"}`}>{p.status === "PAGO" ? `Pago · ${methodLabel(p.method)}` : "Pendente"}</span></td>
                <td className="p-4 text-right">{p.status === "PENDENTE" && (
                  <form action={markPaid} className="flex justify-end gap-2"><input type="hidden" name="id" value={p.id} />
                    <select name="method" className="rounded-lg border border-ink-200 px-2 py-1 text-xs">{Object.entries(METHODS).map(([k, l]) => <option key={k} value={k}>{l}</option>)}</select>
                    <button className="btn-ghost !px-3 !py-1.5 text-xs">Dar baixa</button></form>)}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
