// Assinatura do cookie de sessão (usado também no middleware, por isso sem Prisma aqui)
import { SignJWT, jwtVerify } from "jose";

export const SESSION_COOKIE = "faz_session";
const key = () => new TextEncoder().encode(process.env.AUTH_SECRET || "dev-secret-change-me");

export type SessionData = { uid: number; role: string; name: string };

export async function signSession(data: SessionData) {
  return new SignJWT(data).setProtectedHeader({ alg: "HS256" }).setIssuedAt().setExpirationTime("12h").sign(key());
}

export async function readSession(token?: string): Promise<SessionData | null> {
  if (!token) return null;
  try {
    const { payload } = await jwtVerify(token, key());
    return payload as unknown as SessionData;
  } catch {
    return null;
  }
}
