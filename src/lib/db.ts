import { PrismaClient } from "@prisma/client";

// Horário de Brasília em todo o servidor (datas de prazo, agrupamento por dia, formulários)
process.env.TZ = "America/Sao_Paulo";

const g = globalThis as unknown as { prisma?: PrismaClient };
export const db = g.prisma ?? new PrismaClient();
if (process.env.NODE_ENV !== "production") g.prisma = db;
