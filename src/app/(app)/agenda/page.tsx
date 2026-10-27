import { AgendaView } from "@/components/agenda-view";
import { requireTenant } from "@/lib/tenant";

export const dynamic = "force-dynamic";

export default async function Agenda({ searchParams }: { searchParams: { prof?: string } }) {
  const { db, user, specialty } = await requireTenant();
  return <AgendaView db={db} specialty={specialty} kind="consultas" basePath="/agenda" prof={searchParams.prof} meId={user.id} />;
}
