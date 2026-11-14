import { db } from "./db";

export function monthRange(ym?: string) {
  const now = new Date();
  const [y, m] = ym && /^\d{4}-\d{2}$/.test(ym) ? ym.split("-").map(Number) : [now.getFullYear(), now.getMonth() + 1];
  const start = new Date(y, m - 1, 1);
  const end = new Date(y, m, 1);
  return { start, end, ym: `${y}-${String(m).padStart(2, "0")}`, label: cap(start.toLocaleDateString("pt-BR", { month: "long", year: "numeric" })) };
}

export type ClientProfit = {
  clientId: number;
  client: string;
  revenue: number;
  contractedHours: number;
  minutes: number;
  cost: number;
  margin: number;
  marginPct: number | null;
  jobs: number;
  revisions: number;
};

/** Receita = fees vigentes no mês. Custo = horas lançadas × custo/hora do colaborador. */
export async function profitByClient(start: Date, end: Date, clientId?: number): Promise<ClientProfit[]> {
  const [fees, entries, jobs, revisions] = await Promise.all([
    db.fee.findMany({
      where: { active: true, startDate: { lt: end }, OR: [{ endDate: null }, { endDate: { gte: start } }], ...(clientId ? { clientId } : {}) },
    }),
    db.timeEntry.findMany({ where: { startedAt: { gte: start, lt: end }, endedAt: { not: null }, ...(clientId ? { clientId } : {}) } }),
    db.job.findMany({ where: { deletedAt: null, createdAt: { gte: start, lt: end }, ...(clientId ? { clientId } : {}) }, select: { clientId: true } }),
    db.revision.findMany({ where: { createdAt: { gte: start, lt: end }, ...(clientId ? { job: { clientId } } : {}) }, include: { job: { select: { clientId: true } } } }),
  ]);
  const ids = new Set<number>([...fees.map((f) => f.clientId), ...entries.map((e) => e.clientId), ...jobs.map((j) => j.clientId)]);
  const clients = await db.client.findMany({ where: { id: { in: [...ids] } } });
  return clients
    .map((c) => {
      const cf = fees.filter((f) => f.clientId === c.id);
      const ce = entries.filter((e) => e.clientId === c.id);
      const revenue = cf.reduce((a, f) => a + f.monthlyValue, 0);
      const minutes = ce.reduce((a, e) => a + e.minutes, 0);
      const cost = ce.reduce((a, e) => a + (e.minutes / 60) * e.hourlyCost, 0);
      const margin = revenue - cost;
      return {
        clientId: c.id,
        client: c.name,
        revenue,
        contractedHours: cf.reduce((a, f) => a + f.hoursPerMonth, 0),
        minutes,
        cost,
        margin,
        marginPct: revenue ? (margin / revenue) * 100 : null,
        jobs: jobs.filter((j) => j.clientId === c.id).length,
        revisions: revisions.filter((r) => r.job.clientId === c.id).length,
      };
    })
    .sort((a, b) => a.margin - b.margin);
}

function cap(s: string) {
  return s.charAt(0).toUpperCase() + s.slice(1);
}
