import type { Prisma, User } from "@prisma/client";
import { db } from "./db";
import { isManager } from "./auth";
import { monthRange } from "./rentabilidade";

export type HorasSP = { mes?: string; pessoa?: string; cliente?: string };

export async function queryHoras(user: User, sp: HorasSP) {
  const { start, end, ym, label } = monthRange(sp.mes);
  const manager = isManager(user);
  const where: Prisma.TimeEntryWhereInput = { startedAt: { gte: start, lt: end } };
  // Colaborador vê só as próprias horas
  if (!manager) where.userId = user.id;
  else if (sp.pessoa) where.userId = Number(sp.pessoa);
  if (sp.cliente) where.clientId = Number(sp.cliente);
  const entries = await db.timeEntry.findMany({
    where,
    include: { user: true, client: true, job: true },
    orderBy: { startedAt: "desc" },
  });
  return { entries, ym, label, manager };
}
