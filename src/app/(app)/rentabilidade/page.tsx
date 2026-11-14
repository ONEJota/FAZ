import Link from "next/link";
import { db } from "@/lib/db";
import { requireManager } from "@/lib/auth";
import { fmtMinutes, fmtMoney, REVISION_REASONS } from "@/lib/format";
import { monthRange, profitByClient } from "@/lib/rentabilidade";
import { PageHeader, Stat, Empty } from "@/components/ui";

export default async function Rentabilidade({ searchParams }: { searchParams: Promise<{ mes?: string }> }) {
  const sp = await searchParams;
  await requireManager();
  const { start, end, ym, label } = monthRange(sp.mes);
  const rows = await profitByClient(start, end);
  const [jobsDone, revisions, people, noCost] = await Promise.all([
    db.job.findMany({
      where: { deletedAt: null, completedAt: { gte: start, lt: end } },
      include: { service: true, timeEntries: true },
    }),
    db.revision.groupBy({ by: ["reason"], where: { createdAt: { gte: start, lt: end } }, _count: true }),
    db.timeEntry.groupBy({ by: ["userId"], where: { startedAt: { gte: start, lt: end } }, _sum: { minutes: true } }),
    db.user.count({ where: { active: true, hourlyCost: 0 } }),
  ]);
  const users = await db.user.findMany({ where: { id: { in: people.map((p) => p.userId) } } });

  const revenue = rows.reduce((a, r) => a + r.revenue, 0);
  const cost = rows.reduce((a, r) => a + r.cost, 0);
  const minutes = rows.reduce((a, r) => a + r.minutes, 0);

  // Estimado x realizado por peça (jobs concluídos no mês)
  const bySvc = new Map<string, { est: number; real: number; n: number }>();
  for (const j of jobsDone) {
    const real = j.timeEntries.reduce((a, e) => a + e.minutes, 0);
    const cur = bySvc.get(j.service.name) ?? { est: 0, real: 0, n: 0 };
    bySvc.set(j.service.name, { est: cur.est + j.estimatedMinutes, real: cur.real + real, n: cur.n + 1 });
  }

  return (
    <>
      <PageHeader title="Rentabilidade" subtitle="Receita dos fees × custo das horas lançadas">
        <form className="flex items-end gap-2"><input type="month" name="mes" defaultValue={ym} className="input" /><button className="btn-ghost">Ver</button></form>
      </PageHeader>
      <p className="mb-3 text-sm font-semibold text-black/55">{label}</p>
      {noCost > 0 && (
        <div className="mb-4 rounded-lg bg-amber-50 px-4 py-2.5 text-sm text-amber-800 ring-1 ring-amber-200">
          {noCost} usuário(s) ativo(s) estão sem custo por hora. As horas deles entram com custo zero. Ajuste em <Link href="/config?aba=usuarios" className="font-semibold underline">Configurações › Usuários</Link>.
        </div>
      )}
      <div className="mb-6 grid grid-cols-2 gap-3 md:grid-cols-4">
        <Stat label="Receita de fees" value={fmtMoney(revenue)} />
        <Stat label="Custo de horas" value={fmtMoney(cost)} />
        <Stat label="Margem" value={fmtMoney(revenue - cost)} tone={revenue - cost < 0 ? "bad" : "good"} />
        <Stat label="Horas lançadas" value={fmtMinutes(minutes)} />
      </div>

      <section className="card mb-6 overflow-x-auto">
        <h2 className="border-b border-black/5 px-4 py-3 font-bold">Por cliente <span className="text-xs font-normal text-black/45">(piores margens primeiro)</span></h2>
        {rows.length === 0 ? <Empty>Sem fees ou horas neste mês.</Empty> : (
          <table className="w-full min-w-[820px]">
            <thead><tr><th className="th">Cliente</th><th className="th text-right">Receita</th><th className="th text-right">Horas</th><th className="th text-right">Contratadas</th><th className="th text-right">Custo</th><th className="th text-right">Margem</th><th className="th text-right">Jobs</th><th className="th text-right">Alterações</th></tr></thead>
            <tbody>
              {rows.map((r) => {
                const over = r.contractedHours > 0 && r.minutes / 60 > r.contractedHours;
                return (
                  <tr key={r.clientId}>
                    <td className="td font-medium"><Link href={`/clientes/${r.clientId}`} className="hover:text-mona">{r.client}</Link>{!r.revenue && <span className="chip ml-2 bg-amber-100 text-amber-700">sem fee</span>}</td>
                    <td className="td text-right">{fmtMoney(r.revenue)}</td>
                    <td className={`td text-right font-mono ${over ? "font-bold text-red-600" : ""}`}>{fmtMinutes(r.minutes)}</td>
                    <td className="td text-right font-mono text-black/50">{r.contractedHours ? `${r.contractedHours}:00` : "—"}</td>
                    <td className="td text-right">{fmtMoney(r.cost)}</td>
                    <td className={`td text-right font-bold ${r.margin < 0 ? "text-red-600" : "text-green-700"}`}>
                      {fmtMoney(r.margin)} {r.marginPct !== null && <span className="text-xs font-normal">({Math.round(r.marginPct)}%)</span>}
                    </td>
                    <td className="td text-right">{r.jobs}</td>
                    <td className="td text-right">{r.revisions}</td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        )}
      </section>

      <div className="grid gap-5 lg:grid-cols-3">
        <section className="card overflow-x-auto lg:col-span-2">
          <h2 className="border-b border-black/5 px-4 py-3 font-bold">Estimado × realizado por peça <span className="text-xs font-normal text-black/45">(jobs concluídos no mês)</span></h2>
          {bySvc.size === 0 ? <Empty>Nenhum job concluído no mês.</Empty> : (
            <table className="w-full">
              <thead><tr><th className="th">Peça</th><th className="th text-right">Jobs</th><th className="th text-right">Estimado</th><th className="th text-right">Realizado</th><th className="th text-right">Desvio</th></tr></thead>
              <tbody>
                {[...bySvc.entries()].map(([k, v]) => {
                  const dev = v.est ? Math.round(((v.real - v.est) / v.est) * 100) : null;
                  return (
                    <tr key={k}>
                      <td className="td">{k}</td><td className="td text-right">{v.n}</td>
                      <td className="td text-right font-mono">{fmtMinutes(v.est)}</td><td className="td text-right font-mono">{fmtMinutes(v.real)}</td>
                      <td className={`td text-right font-semibold ${dev !== null && dev > 20 ? "text-red-600" : "text-black/60"}`}>{dev === null ? "—" : `${dev > 0 ? "+" : ""}${dev}%`}</td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          )}
        </section>
        <div className="space-y-5">
          <section className="card p-4">
            <h2 className="mb-3 font-bold">Motivos de alteração</h2>
            {revisions.length === 0 ? <p className="text-sm text-black/45">Nenhuma alteração no mês.</p> : (
              <ul className="space-y-1.5 text-sm">
                {revisions.sort((a, b) => b._count - a._count).map((r) => (
                  <li key={r.reason} className="flex justify-between"><span>{REVISION_REASONS[r.reason] ?? r.reason}</span><b>{r._count}</b></li>
                ))}
              </ul>
            )}
          </section>
          <section className="card p-4">
            <h2 className="mb-3 font-bold">Horas por pessoa</h2>
            <ul className="space-y-1.5 text-sm">
              {people.sort((a, b) => (b._sum.minutes ?? 0) - (a._sum.minutes ?? 0)).map((p) => (
                <li key={p.userId} className="flex justify-between"><span>{users.find((u) => u.id === p.userId)?.name}</span><span className="font-mono">{fmtMinutes(p._sum.minutes ?? 0)}</span></li>
              ))}
            </ul>
          </section>
        </div>
      </div>
    </>
  );
}
