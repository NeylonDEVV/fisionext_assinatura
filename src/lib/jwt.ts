import { SignJWT, jwtVerify } from "jose";

export const COOKIE = "fn_session";
export type SessionUser = { id: string; name: string; email: string };

function key() {
  const secret = process.env.AUTH_SECRET;
  if (!secret) throw new Error("AUTH_SECRET não definido no .env");
  if (process.env.NODE_ENV === "production" && (secret.length < 32 || secret.startsWith("troque"))) {
    throw new Error("AUTH_SECRET fraco: use pelo menos 32 caracteres aleatórios");
  }
  return new TextEncoder().encode(secret);
}

export async function signToken(u: SessionUser) {
  return new SignJWT({ name: u.name, email: u.email })
    .setProtectedHeader({ alg: "HS256" }).setSubject(u.id).setIssuedAt().setExpirationTime("7d").sign(key());
}

export async function verifyToken(token?: string): Promise<SessionUser | null> {
  if (!token) return null;
  try {
    const { payload } = await jwtVerify(token, key());
    return { id: String(payload.sub), name: String(payload.name), email: String(payload.email) };
  } catch { return null; }
}
