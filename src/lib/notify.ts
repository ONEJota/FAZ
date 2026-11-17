import "server-only";
import { db } from "./db";

export type NotificationType = "JOB" | "TAREFA" | "COMENTARIO" | "SITUACAO" | "ENTREGA" | "ALTERACAO" | "PRAZO";

/**
 * Cria a mesma notificação para várias pessoas. Quem fez a ação não recebe aviso
 * do que ela mesma fez, e usuários inativos ou excluídos ficam de fora.
 */
export async function notify(
  userIds: (number | null | undefined)[],
  actorId: number | null,
  n: { type: NotificationType; title: string; body?: string; jobId?: number | null; link: string },
) {
  const ids = [...new Set(userIds.filter((x): x is number => !!x && x !== actorId))];
  if (!ids.length) return;
  const active = await db.user.findMany({ where: { id: { in: ids }, active: true, deletedAt: null }, select: { id: true } });
  if (!active.length) return;
  await db.notification.createMany({
    data: active.map((u) => ({ userId: u.id, type: n.type, title: n.title.slice(0, 200), body: (n.body ?? "").slice(0, 300), jobId: n.jobId ?? null, link: n.link })),
  });
}

/** Responsáveis do job + quem tem tarefa aberta nele (as pessoas que acompanham o job). */
export async function jobFollowers(jobId: number) {
  const job = await db.job.findUnique({
    where: { id: jobId },
    select: { responsibles: { select: { userId: true } }, tasks: { where: { done: false }, select: { assigneeId: true } } },
  });
  if (!job) return [];
  return [...job.responsibles.map((r) => r.userId), ...job.tasks.map((t) => t.assigneeId)];
}

/**
 * Avisos de prazo (hoje e atrasado), gerados na hora em que a pessoa abre o sistema,
 * no máximo um por job por dia. Assim não precisa de agendador.
 */
export async function ensureDeadlineNotifications(userId: number) {
  const now = new Date();
  const start = new Date(now);
  start.setHours(0, 0, 0, 0);
  const end = new Date(now);
  end.setHours(23, 59, 59, 999);
  const jobs = await db.job.findMany({
    where: { deletedAt: null, status: { isDone: false, isWaiting: false }, dueDate: { lte: end }, responsibles: { some: { userId } } },
    select: { id: true, number: true, title: true, dueDate: true },
    take: 30,
  });
  if (!jobs.length) return;
  const already = await db.notification.findMany({
    where: { userId, type: "PRAZO", createdAt: { gte: start }, jobId: { in: jobs.map((j) => j.id) } },
    select: { jobId: true },
  });
  const done = new Set(already.map((a) => a.jobId));
  const fresh = jobs.filter((j) => !done.has(j.id));
  if (!fresh.length) return;
  await db.notification.createMany({
    data: fresh.map((j) => {
      const late = j.dueDate < now;
      const hh = j.dueDate.toLocaleTimeString("pt-BR", { hour: "2-digit", minute: "2-digit" });
      return {
        userId,
        jobId: j.id,
        type: "PRAZO",
        title: late ? `Job #${j.number} está atrasado` : `Job #${j.number} vence hoje às ${hh}`,
        body: j.title,
        link: `/jobs/${j.id}`,
      };
    }),
  });
}
