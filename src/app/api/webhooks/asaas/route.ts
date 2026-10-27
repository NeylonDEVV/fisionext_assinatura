import { timingSafeEqual } from "node:crypto";
import { handleAsaasEvent, type AsaasEventBody } from "@/lib/asaas-webhook";

export const dynamic = "force-dynamic";

function tokenOk(received: string | null) {
  const expected = process.env.ASAAS_WEBHOOK_TOKEN;
  if (!received || !expected) return false;
  const a = Buffer.from(received), b = Buffer.from(expected);
  return a.length === b.length && timingSafeEqual(a, b);
}

export async function POST(req: Request) {
  const expected = process.env.ASAAS_WEBHOOK_TOKEN;
  if (!expected || expected.length < 32) return Response.json({ error: "webhook não configurado" }, { status: 503 });
  if (!tokenOk(req.headers.get("asaas-access-token"))) return Response.json({ error: "não autorizado" }, { status: 401 });

  let body: AsaasEventBody;
  try { body = JSON.parse(await req.text()); } catch { return Response.json({ error: "JSON inválido" }, { status: 400 }); }
  if (!body?.id || typeof body.event !== "string") return Response.json({ error: "evento inválido" }, { status: 400 });

  try {
    return Response.json({ result: await handleAsaasEvent(body) });
  } catch {
    return Response.json({ error: "falha ao processar" }, { status: 500 }); // a Asaas reenvia
  }
}
