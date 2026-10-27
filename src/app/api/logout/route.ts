import { NextResponse } from "next/server";
import { COOKIE } from "@/lib/jwt";

export const dynamic = "force-dynamic";

// Usado quando a sessão é válida mas o usuário foi desativado: limpa o cookie e volta ao login.
export async function GET() {
  const res = new NextResponse(null, { status: 302, headers: { Location: "/login" } });
  res.cookies.delete(COOKIE);
  return res;
}
