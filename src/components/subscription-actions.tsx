"use client";
import { useFormState, useFormStatus } from "react-dom";
import { cancelSubscription, syncSubscription } from "@/actions-billing";

function Btn({ children, danger }: { children: React.ReactNode; danger?: boolean }) {
  const { pending } = useFormStatus();
  return <button disabled={pending} className={`${danger ? "rounded-xl bg-red-50 px-3 py-2 text-sm font-medium text-red-700 transition hover:bg-red-100" : "btn-ghost"} disabled:opacity-60`}>{pending ? "..." : children}</button>;
}

export function SubscriptionActions({ canCancel }: { canCancel: boolean }) {
  const [syncState, sync] = useFormState(syncSubscription, undefined);
  const [cancelState, cancel] = useFormState(cancelSubscription, undefined);
  const msg = syncState ?? cancelState;
  return (
    <div className="flex flex-wrap items-center gap-2">
      <form action={sync}><Btn>Atualizar</Btn></form>
      {canCancel && (
        <form action={cancel} onSubmit={(e) => { if (!window.confirm("Cancelar a assinatura? As próximas faturas deixam de ser geradas.")) e.preventDefault(); }}>
          <Btn danger>Cancelar assinatura</Btn>
        </form>
      )}
      {msg?.error && <span role="alert" className="text-sm text-red-700">{msg.error}</span>}
      {msg?.ok && <span className="text-sm text-emerald-700">{msg.ok}</span>}
    </div>
  );
}
