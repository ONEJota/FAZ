import "server-only";
import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import type { Prisma } from "@prisma/client";
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

/**
 * Jobs (PITs) que o usuário pode ver. Admin e Coordenação veem todos;
 * o Colaborador vê só os jobs em que é responsável ou tem tarefa atribuída.
 */
export function jobScope(u: { id: number; role: string }): Prisma.JobWhereInput {
  if (isManager(u)) return {};
  return { OR: [{ responsibles: { some: { userId: u.id } } }, { tasks: { some: { assigneeId: u.id } } }] };
}

/** Tarefas visíveis: o Colaborador vê as atribuídas a ele e as sem dono dos jobs em que é responsável. */
export function canSeeTask(
  u: { id: number; role: string },
  t: { assigneeId: number | null },
  responsibleIds: number[],
) {
  if (isManager(u)) return true;
  return t.assigneeId === u.id || (t.assigneeId === null && responsibleIds.includes(u.id));
}

export async function canAccessJob(u: { id: number; role: string }, jobId: number) {
  if (isManager(u)) return true;
  return (await db.job.count({ where: { id: jobId, ...jobScope(u) } })) > 0;
}

/** Bloqueia o acesso a um job que o usuário não pode ver (páginas e ações). */
export async function requireJobAccess(jobId: number) {
  const u = await requireUser();
  if (!jobId || !(await canAccessJob(u, jobId))) redirect("/?erro=permissao");
  return u;
}

export async function requireAdmin() {
  const u = await requireUser();
  if (u.role !== "ADMIN") redirect("/?erro=permissao");
  return u;
}
