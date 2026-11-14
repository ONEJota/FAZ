import "server-only";
import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import { db } from "./db";
import { readSession, SESSION_COOKIE } from "./session";

export const ROLES = { ADMIN: "Administrador", COORDENACAO: "Coordenação", COLABORADOR: "Colaborador" } as const;

export async function currentUser() {
  const s = await readSession((await cookies()).get(SESSION_COOKIE)?.value);
  if (!s) return null;
  const user = await db.user.findUnique({ where: { id: s.uid } });
  if (!user || !user.active) return null;
  return user;
}

export async function requireUser() {
  const u = await currentUser();
  if (!u) redirect("/login");
  return u;
}

/** Admin e Coordenação gerenciam cadastros, fees, campanhas e lixeira. */
export function isManager(u: { role: string }) {
  return u.role === "ADMIN" || u.role === "COORDENACAO";
}

export async function requireManager() {
  const u = await requireUser();
  if (!isManager(u)) redirect("/?erro=permissao");
  return u;
}

export async function requireAdmin() {
  const u = await requireUser();
  if (u.role !== "ADMIN") redirect("/?erro=permissao");
  return u;
}
