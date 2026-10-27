import { prisma } from "@/lib/prisma";
export const dynamic = "force-dynamic";

export async function GET() {
  try { await prisma.user.count(); return Response.json({ status: "ok" }); }
  catch { return Response.json({ status: "error" }, { status: 503 }); }
}
