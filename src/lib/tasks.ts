import type { Prisma } from "@prisma/client";

export const TASK_STATUS = {
  PENDENTE: { label: "Pendente", cls: "bg-black/5 text-black/60" },
  ANDAMENTO: { label: "Em andamento", cls: "bg-amber-100 text-amber-800" },
  CONCLUIDA: { label: "Concluída", cls: "bg-green-100 text-green-800" },
  REPASSADA: { label: "Repassada", cls: "bg-sky-100 text-sky-800" },
} as const;
export type TaskStatus = keyof typeof TASK_STATUS;
export const OPEN_TASK: TaskStatus[] = ["PENDENTE", "ANDAMENTO"];

/**
 * Área de trabalho da pessoa: os jobs em que ela tem tarefa aberta. Quem é responsável
 * e nunca teve tarefa no job (jobs antigos) continua vendo o job até a entrega.
 */
export function myWorkScope(userId: number): Prisma.JobWhereInput {
  return {
    OR: [
      { tasks: { some: { assigneeId: userId, status: { in: OPEN_TASK } } } },
      { AND: [{ responsibles: { some: { userId } } }, { tasks: { none: { assigneeId: userId } } }] },
    ],
  };
}
