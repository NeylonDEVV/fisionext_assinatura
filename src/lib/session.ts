import { cookies } from "next/headers";
import { COOKIE, signToken, verifyToken, type SessionUser } from "./jwt";

export const getSession = () => verifyToken(cookies().get(COOKIE)?.value);

export async function startSession(u: SessionUser) {
  cookies().set(COOKIE, await signToken(u), {
    httpOnly: true, sameSite: "lax", secure: process.env.NODE_ENV === "production", path: "/", maxAge: 60 * 60 * 24 * 7,
  });
}

export const endSession = () => cookies().delete(COOKIE);
