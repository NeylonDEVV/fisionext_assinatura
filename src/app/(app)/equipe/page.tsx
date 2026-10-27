import Link from "next/link";
import { Plus } from "lucide-react";
import { requireTenant } from "@/lib/tenant";
import { resetUserPassword, setUserActive } from "@/actions-team";
import { roleLabel } from "@/lib/roles";
import { initials } from "@/lib/utils";

export const dynamic = "force-dynamic";

export default async function Equipe() {
  const { db, user: me, specialty } = await requireTenant({ admin: true });
  const users = await db.user.findMany({ orderBy: [{ active: "desc" }, { name: "asc" }] });
  const activeAdmins = users.filter((u) => u.role === "ADMIN" && u.active).length;

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-end justify-between gap-3">
        <div><h1 className="text-2xl font-extrabold">Equipe</h1><p className="text-sm text-ink-500">Quem tem acesso ao sistema</p></div>
        <Link href="/equipe/novo" className="btn"><Plus size={16} />Novo profissional</Link>
      </div>
      <div className="card divide-y divide-ink-100">
        {users.map((u) => {
          const canDeactivate = u.active && u.id !== me.id && !(u.role === "ADMIN" && activeAdmins <= 1);
          return (
            <div key={u.id} className={`flex flex-wrap items-center gap-4 p-5 ${u.active ? "" : "opacity-60"}`}>
              <span className="grid h-11 w-11 place-items-center rounded-full bg-brand-100 text-sm font-bold text-brand-700">{initials(u.name)}</span>
              <div className="min-w-48 flex-1">
                <p className="font-semibold">{u.name}{u.id === me.id && <span className="ml-2 text-xs font-normal text-ink-400">(você)</span>}</p>
                <p className="text-xs text-ink-500">{u.email}{u.registration ? ` · ${specialty.council} ${u.registration}` : ""}</p>
              </div>
              <span className={`rounded-full px-2.5 py-1 text-xs font-semibold ${u.role === "ADMIN" ? "bg-ink-700 text-white" : "bg-ink-100 text-ink-700"}`}>{roleLabel(u.role)}</span>
              {!u.active && <span className="rounded-full bg-red-50 px-2.5 py-1 text-xs font-semibold text-red-700">Desativado</span>}
              <form action={resetUserPassword} className="flex items-center gap-2">
                <input type="hidden" name="id" value={u.id} />
                <input name="password" type="password" minLength={10} required placeholder="Nova senha (10+)" autoComplete="new-password" className="input !w-44 !py-1.5 text-xs" />
                <button className="btn-ghost !px-3 !py-1.5 text-xs">Redefinir</button>
              </form>
              {(canDeactivate || !u.active) && (
                <form action={setUserActive}>
                  <input type="hidden" name="id" value={u.id} />
                  <input type="hidden" name="active" value={String(!u.active)} />
                  <button className="btn-ghost !px-3 !py-1.5 text-xs">{u.active ? "Desativar" : "Reativar"}</button>
                </form>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
}
