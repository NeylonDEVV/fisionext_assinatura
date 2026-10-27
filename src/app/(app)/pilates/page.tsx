import { notFound } from "next/navigation";
import { AgendaView } from "@/components/agenda-view";
import { requireTenant } from "@/lib/tenant";

export const dynamic = "force-dynamic";

export default async function Pilates({ searchParams }: { searchParams: { prof?: string } }) {
  const { db, user, specialty } = await requireTenant();
  if (!specialty.groupAgenda) notFound();
  return <AgendaView db={db} specialty={specialty} kind="pilates" basePath="/pilates" prof={searchParams.prof} meId={user.id} />;
}
