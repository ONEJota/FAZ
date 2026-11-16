import Link from "next/link";
import { db } from "@/lib/db";
import { isManager, jobScope, requireUser } from "@/lib/auth";
import { fmtDate, fmtMinutes, fmtMoney } from "@/lib/format";
import { saveCampaign } from "@/app/actions/cadastros";
import { PageHeader, Empty } from "@/components/ui";

export default async function Campanhas({ searchParams }: { searchParams: Promise<{ todas?: string }> }) {
  const sp = await searchParams;
  const user = await requireUser();
  const manager = isManager(user);
  const [campaigns, clients] = await Promise.all([
    db.campaign.findMany({
      where: sp.todas ? {} : { active: true },
      include: { client: true, fee: true, jobs: { where: { deletedAt: null, ...jobScope(user) }, include: { status: true, timeEntries: true } } },
      orderBy: [{ startDate: "desc" }, { createdAt: "desc" }],
    }),
    db.client.findMany({ where: { active: true }, orderBy: { name: "asc" }, include: { fees: { where: { active: true } } } }),
  ]);

  return (
    <>
      <PageHeader title="Campanhas" subtitle="Agrupe os jobs do mês ou de uma ação e veja horas e andamento juntos">
        <Link href={sp.todas ? "/campanhas" : "/campanhas?todas=1"} className="btn-ghost">{sp.todas ? "Só ativas" : "Ver todas"}</Link>
      </PageHeader>
      <div className="grid gap-5 lg:grid-cols-3">
        {manager && (
          <form action={saveCampaign} className="card h-fit space-y-3 p-5">
            <input type="hidden" name="back" value="campanhas" />
            <h2 className="font-bold">Nova campanha</h2>
            <div><label className="label">Cliente *</label>
              <select name="clientId" required className="input"><option value="">Escolha…</option>{clients.map((c) => <option key={c.id} value={c.id}>{c.name}</option>)}</select>
            </div>
            <div><label className="label">Nome *</label><input name="name" required className="input" placeholder="Campanha mensal – Dezembro/2026" /></div>
            <div><label className="label">Fee (opcional)</label>
              <select name="feeId" className="input">
                <option value="">Avulsa</option>
                {clients.flatMap((c) => c.fees.map((f) => <option key={f.id} value={f.id}>{c.name} — {f.name}</option>))}
              </select>
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div><label className="label">Início</label><input type="date" name="startDate" className="input" /></div>
              <div><label className="label">Fim</label><input type="date" name="endDate" className="input" /></div>
            </div>
            <div><label className="label">Verba (R$)</label><input name="budget" inputMode="decimal" className="input" /></div>
            <button className="btn-primary w-full">Criar campanha</button>
          </form>
        )}
        <section className={`space-y-3 ${manager ? "lg:col-span-2" : "lg:col-span-3"}`}>
          {campaigns.length === 0 && <div className="card"><Empty>Nenhuma campanha ativa.</Empty></div>}
          {campaigns.map((c) => {
            const done = c.jobs.filter((j) => j.status.isDone).length;
            const min = c.jobs.flatMap((j) => j.timeEntries).reduce((a, e) => a + e.minutes, 0);
            const pct = c.jobs.length ? Math.round((done / c.jobs.length) * 100) : 0;
            return (
              <Link key={c.id} href={`/campanhas/${c.id}`} className="card block p-4 hover:ring-2 hover:ring-mona/30">
                <div className="flex flex-wrap items-baseline justify-between gap-2">
                  <p className="font-bold">{c.name}</p>
                  <p className="text-xs text-black/50">{fmtDate(c.startDate)} → {fmtDate(c.endDate)}</p>
                </div>
                <p className="text-sm text-black/55">{c.client.name} · {c.fee?.name ?? "Avulsa"}{c.budget ? ` · verba ${fmtMoney(c.budget)}` : ""}</p>
                <div className="mt-3 flex items-center gap-3 text-xs text-black/55">
                  <div className="h-2 flex-1 overflow-hidden rounded-full bg-black/5"><div className="h-full bg-mona" style={{ width: `${pct}%` }} /></div>
                  <span>{done}/{c.jobs.length} jobs concluídos</span>
                  <span>⏱ {fmtMinutes(min)}</span>
                </div>
              </Link>
            );
          })}
        </section>
      </div>
    </>
  );
}
