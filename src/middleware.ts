import { NextResponse, type NextRequest } from "next/server";
import { COOKIE, verifyToken } from "@/lib/jwt";

const PUBLIC = new Set(["/", "/login", "/cadastro", "/termos", "/privacidade"]);
const GUEST_ONLY = new Set(["/", "/login", "/cadastro"]);

export async function middleware(req: NextRequest) {
  const { pathname } = req.nextUrl;
  if (pathname === "/api/health" || pathname.startsWith("/api/webhooks/")) return NextResponse.next();
  const user = await verifyToken(req.cookies.get(COOKIE)?.value);
  if (!user && !PUBLIC.has(pathname)) return NextResponse.redirect(new URL("/login", req.url));
  if (user && GUEST_ONLY.has(pathname)) return NextResponse.redirect(new URL("/dashboard", req.url));
  const headers = new Headers(req.headers);
  headers.set("x-pathname", pathname); // o layout usa para liberar a tela de assinatura mesmo com o acesso bloqueado
  return NextResponse.next({ request: { headers } });
}

export const config = { matcher: ["/((?!_next/static|_next/image|favicon.ico).*)"] };
