import Link from "next/link";
import { db } from "@/lib/db";
import { requireUser } from "@/lib/auth";
import { fmtMinutes, fmtMoney, fmtShort, toInputDateTime } from "@/lib/format";
import { queryHoras, type HorasSP } from "@/lib/horasQuery";
import { addTimeEntry, deleteTimeEntry } from "@/app/actions/horas";
import { ErrorBanner, PageHeader, Stat, Empty } from "@/components/ui";

export default async function Horas({ searchParams }: { searchParams: Promise<HorasSP & { erro?: string }> }) {
  const sp = await searchParams;
  const user = await requireUser();
  const { entries, ym, label, manager } = await queryHoras(user, sp);
  const [users, clients, jobs] = await Promise.all([
    db.user.findMany({ where: { active: true }, orderBy: { name: "asc" } }),
    db.client.findMany({ where: { active: true }, orderBy: { name: "asc" } }),
    db.job.findMany({ where: { deletedAt: null, status: { isDone: false } }, include: { client: true }, orderBy: { number: "desc" }, take: 300 }),
  ]);

  const total = entries.reduce((a, e) => a + e.minutes, 0);
  const cost = entries.reduce((a, e) => a + (e.minutes / 60) * e.hourlyCost, 0);
  const noJob = entries.filter((e) => !e.jobId).reduce((a, e) => a + e.minutes, 0);
  const byPerson = groupBy(entries, (e) => e.user.name);
  const byClient = groupBy(entries, (e) => e.client.name);
  const qsExport = new URLSearchParams({ mes: ym, ...(sp.pessoa ? { pessoa: sp.pessoa } : {}), ...(sp.cliente ? { cliente: sp.cliente } : {}) });
  const [y, m] = ym.split("-").map(Number);
  const prev = `${m === 1 ? y - 1 : y}-${String(m === 1 ? 12 : m - 1).padStart(2, "0")}`;
  const next = `${m === 12 ? y + 1 : y}-${String(m === 12 ? 1 : m + 1).padStart(2, "0")}`;
  const keep = (mes: string) => `/horas?${new URLSearchParams({ mes, ...(sp.pessoa ? { pessoa: sp.pessoa } : {}), ...(sp.cliente ? { cliente: sp.cliente } : {}) })}`;

  return (
    <>
      <ErrorBanner msg={sp.erro} />
      <PageHeader title="Horas" subtitle={manager ? "Timesheet da equipe" : "Suas horas lançadas"}>
        <a href={`/horas/exportar?${qsExport}`} className="btn-ghost">⬇ Exportar CSV</a>
      </PageHeader>

      <form className="card mb-4 flex flex-wrap items-end gap-3 p-3">
        <div className="flex items-center gap-1">
          <Link href={keep(prev)} className="btn-ghost px-2">‹</Link>
          <div><label className="label">Mês</label><input type="month" name="mes" defaultValue={ym} className="input" /></div>
          <Link href={keep(next)} className="btn-ghost px-2">›</Link>
        </div>
        {manager && (
          <div className="w-48"><label className="label">Pessoa</label>
            <select name="pessoa" defaultValue={sp.pessoa} className="input"><option value="">Todas</option>{users.map((u) => <option key={u.id} value={u.id}>{u.name}</option>)}</select>
          </div>
        )}
        <div className="w-64"><label className="label">Cliente</label>
          <select name="cliente" defaultValue={sp.cliente} className="input"><option value="">Todos</option>{clients.map((c) => <option key={c.id} value={c.id}>{c.name}</option>)}</select>
        </div>
        <button className="btn-ghost">Filtrar</button>
        <span className="ml-auto text-sm font-semibold text-black/55">{label}</span>
      </form>

      <div className="mb-6 grid grid-cols-2 gap-3 md:grid-cols-4">
        <Stat label="Horas no período" value={fmtMinutes(total)} />
        <Stat label="Lançamentos" value={entries.length} />
        <Stat label="Horas sem job" value={fmtMinutes(noJob)} tone={noJob ? "warn" : undefined} />
        {manager && <Stat label="Custo de mão de obra" value={fmtMoney(cost)} />}
      </div>

      <div className="grid gap-5 lg:grid-cols-3">
        <div className="space-y-5">
          <form action={addTimeEntry} className="card space-y-3 p-5">
            <input type="hidden" name="back" value={keep(ym)} />
            <h2 className="font-bold">Lançar horas</h2>
            <div><label className="label">Job</label>
              <select name="jobId" className="input"><option value="">Sem job (horas avulsas do cliente)</option>{jobs.map((j) => <option key={j.id} value={j.id}>#{j.number} · {j.title} — {j.client.name}</option>)}</select>
            </div>
            <div><label className="label">Cliente (se sem job)</label>
              <select name="clientId" className="input"><option value="">—</option>{clients.map((c) => <option key={c.id} value={c.id}>{c.name}</option>)}</select>
            </div>
            <div className="grid grid-cols-2 gap-2">
              <div><label className="label">Início</label><input type="datetime-local" name="startedAt" required defaultValue={toInputDateTime(new Date(Date.now() - 3600000))} className="input" /></div>
              <div><label className="label">Fim</label><input type="datetime-local" name="endedAt" required defaultValue={toInputDateTime(new Date())} className="input" /></div>
            </div>
            <div><label className="label">Descrição</label><input name="description" required className="input" placeholder="Ex.: Reunião de pauta" /></div>
            <button className="btn-primary w-full">Lançar</button>
          </form>
          <Summary title="Por pessoa" rows={byPerson} />
          <Summary title="Por cliente" rows={byClient} />
        </div>

        <section className="card overflow-x-auto lg:col-span-2">
          {entries.length === 0 ? <Empty>Nenhuma hora lançada neste período.</Empty> : (
            <table className="w-full min-w-[640px]">
              <thead><tr><th className="th">Início</th>{manager && <th className="th">Pessoa</th>}<th className="th">Cliente / Job</th><th className="th">Descrição</th><th className="th text-right">Horas</th><th className="th" /></tr></thead>
              <tbody>
                {entries.map((e) => (
                  <tr key={e.id}>
                    <td className="td text-xs">{fmtShort(e.startedAt)}</td>
                    {manager && <td className="td">{e.user.name}</td>}
                    <td className="td text-xs">
                      <p className="font-medium">{e.client.name}</p>
                      {e.job ? <Link href={`/jobs/${e.job.id}`} className="text-mona hover:underline">#{e.job.number} {e.job.title}</Link> : <span className="text-amber-600">sem job</span>}
                    </td>
                    <td className="td text-black/60">{e.description}</td>
                    <td className="td text-right font-mono">{e.endedAt ? fmtMinutes(e.minutes) : <span className="text-green-600">rodando</span>}</td>
                    <td className="td text-right">
                      {(e.userId === user.id || manager) && e.endedAt && (
                        <form action={deleteTimeEntry}><input type="hidden" name="id" value={e.id} /><button className="text-xs text-red-500 hover:underline">excluir</button></form>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </section>
      </div>
    </>
  );
}

function groupBy<T extends { minutes: number }>(items: T[], key: (x: T) => string) {
  const m = new Map<string, number>();
  for (const i of items) m.set(key(i), (m.get(key(i)) ?? 0) + i.minutes);
  return [...m.entries()].sort((a, b) => b[1] - a[1]);
}

function Summary({ title, rows }: { title: string; rows: [string, number][] }) {
  if (!rows.length) return null;
  const max = rows[0][1] || 1;
  return (
    <section className="card p-4">
      <h2 className="mb-3 font-bold">{title}</h2>
      <ul className="space-y-2">
        {rows.slice(0, 12).map(([k, v]) => (
          <li key={k} className="text-sm">
            <div className="flex justify-between gap-2"><span className="truncate">{k}</span><span className="font-mono">{fmtMinutes(v)}</span></div>
            <div className="mt-1 h-1.5 rounded-full bg-black/5"><div className="h-full rounded-full bg-mona/70" style={{ width: `${(v / max) * 100}%` }} /></div>
          </li>
        ))}
      </ul>
    </section>
  );
}
