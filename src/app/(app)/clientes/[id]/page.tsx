import Link from "next/link";
import { notFound } from "next/navigation";
import { db } from "@/lib/db";
import { isManager, jobScope, requireUser } from "@/lib/auth";
import { fmtDate, fmtMinutes, fmtMoney, fmtShort, isLate, toInputDate } from "@/lib/format";
import { monthRange, profitByClient } from "@/lib/rentabilidade";
import { saveCampaign, saveFee } from "@/app/actions/cadastros";
import { ClientForm } from "@/components/ClientForm";
import { ErrorBanner, PageHeader, Stat, StatusChip, Tabs, Empty } from "@/components/ui";

export default async function ClientePage({ params, searchParams }: { params: Promise<{ id: string }>; searchParams: Promise<{ aba?: string; erro?: string; editar?: string }> }) {
  const { id } = await params;
  const sp = await searchParams;
  const user = await requireUser();
  const manager = isManager(user);
  const client = await db.client.findUnique({
    where: { id: Number(id) },
    include: {
      fees: { orderBy: { startDate: "desc" } },
      campaigns: { include: { fee: true, _count: { select: { jobs: true } } }, orderBy: { createdAt: "desc" } },
      jobs: { where: { deletedAt: null, ...jobScope(user) }, include: { status: true, service: true }, orderBy: { dueDate: "desc" }, take: 100 },
    },
  });
  if (!client) notFound();
  const aba = sp.aba || "resumo";
  const base = `/clientes/${client.id}`;
  const { start, end, label } = monthRange();
  const [profit] = await profitByClient(start, end, client.id);
  const activeJobs = client.jobs.filter((j) => !j.status.isDone);
  const lateJobs = activeJobs.filter((j) => isLate(j.dueDate, j.status.isDone, j.status.isWaiting));
  const usedH = (profit?.minutes ?? 0) / 60;

  return (
    <div>
      <ErrorBanner msg={sp.erro} />
      <div className="mb-1 text-sm text-black/50"><Link href="/clientes" className="hover:text-mona">← Clientes</Link></div>
      <PageHeader title={client.name} subtitle={[client.segment, client.contactName, client.contactPhone].filter(Boolean).join(" · ") || undefined}>
        <Link href={`/jobs/novo`} className="btn-ghost">+ Job</Link>
        {manager && <Link href={`${base}?aba=dados`} className="btn-ghost">Editar dados</Link>}
      </PageHeader>

      <Tabs
        base={base}
        current={aba}
        items={[
          { key: "resumo", label: "Resumo" },
          { key: "jobs", label: "Jobs", count: client.jobs.length },
          { key: "fees", label: "Fees", count: client.fees.length },
          { key: "campanhas", label: "Campanhas", count: client.campaigns.length },
          ...(manager ? [{ key: "dados", label: "Dados cadastrais" }] : []),
        ]}
      />

      {aba === "resumo" && (
        <>
          <p className="mb-3 text-sm font-semibold text-black/55">{label}</p>
          <div className="mb-6 grid grid-cols-2 gap-3 md:grid-cols-6">
            <Stat label="Jobs ativos" value={activeJobs.length} />
            <Stat label="Atrasados" value={lateJobs.length} tone={lateJobs.length ? "bad" : "good"} />
            <Stat label="Horas no mês" value={fmtMinutes(profit?.minutes ?? 0)} />
            <Stat
              label={profit?.contractedHours ? `de ${profit.contractedHours} h contratadas` : "sem horas contratadas"}
              value={profit?.contractedHours ? `${Math.round((usedH / profit.contractedHours) * 100)}%` : "—"}
              tone={profit?.contractedHours && usedH > profit.contractedHours ? "bad" : undefined}
            />
            {manager && <Stat label="Receita (fee)" value={fmtMoney(profit?.revenue ?? 0)} />}
            {manager && <Stat label="Margem no mês" value={fmtMoney(profit?.margin ?? 0)} tone={(profit?.margin ?? 0) < 0 ? "bad" : "good"} />}
          </div>
          {client.notes && <div className="card mb-6 p-4 text-sm"><p className="label">Observações</p><p className="whitespace-pre-wrap">{client.notes}</p></div>}
          <JobsTable jobs={activeJobs} />
        </>
      )}

      {aba === "jobs" && <JobsTable jobs={client.jobs} />}

      {aba === "fees" && (
        <div className="grid gap-5 lg:grid-cols-3">
          {manager && (
            <form action={saveFee} className="card space-y-3 p-5">
              <input type="hidden" name="clientId" value={client.id} />
              <h2 className="font-bold">Novo fee</h2>
              <div><label className="label">Nome</label><input name="name" className="input" defaultValue="Fee mensal" /></div>
              <div className="grid grid-cols-2 gap-3">
                <div><label className="label">Valor mensal (R$)</label><input name="monthlyValue" required inputMode="decimal" className="input" placeholder="3.500,00" /></div>
                <div><label className="label">Horas/mês</label><input name="hoursPerMonth" inputMode="decimal" className="input" placeholder="40" /></div>
                <div><label className="label">Início</label><input type="date" name="startDate" required defaultValue={toInputDate(new Date())} className="input" /></div>
                <div><label className="label">Fim</label><input type="date" name="endDate" className="input" /></div>
              </div>
              <div><label className="label">O que inclui</label><textarea name="notes" rows={3} className="input" placeholder="Ex.: 12 posts, 8 stories, gestão de tráfego" /></div>
              <button className="btn-primary w-full">Salvar fee</button>
            </form>
          )}
          <section className={`card overflow-x-auto ${manager ? "lg:col-span-2" : "lg:col-span-3"}`}>
            {client.fees.length === 0 ? <Empty>Nenhum fee cadastrado. Clientes mensais devem ter fee para medir rentabilidade.</Empty> : (
              <table className="w-full">
                <thead><tr><th className="th">Fee</th><th className="th">Valor</th><th className="th">Horas/mês</th><th className="th">Vigência</th><th className="th">Situação</th></tr></thead>
                <tbody>
                  {client.fees.map((f) => (
                    <tr key={f.id}>
                      <td className="td font-medium">{f.name}{f.notes && <p className="text-xs font-normal text-black/50">{f.notes}</p>}</td>
                      <td className="td">{manager ? fmtMoney(f.monthlyValue) : "•••"}</td>
                      <td className="td">{f.hoursPerMonth || "—"}</td>
                      <td className="td text-xs">{fmtDate(f.startDate)} → {f.endDate ? fmtDate(f.endDate) : "sem fim"}</td>
                      <td className="td">{f.active ? <span className="chip bg-green-100 text-green-700">ativo</span> : <span className="chip bg-black/5">encerrado</span>}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            )}
          </section>
        </div>
      )}

      {aba === "campanhas" && (
        <div className="grid gap-5 lg:grid-cols-3">
          {manager && (
            <form action={saveCampaign} className="card space-y-3 p-5">
              <input type="hidden" name="clientId" value={client.id} />
              <h2 className="font-bold">Nova campanha</h2>
              <div><label className="label">Nome *</label><input name="name" required className="input" placeholder="Campanha mensal – Dezembro/2026" /></div>
              <div><label className="label">Fee</label>
                <select name="feeId" className="input"><option value="">Avulsa</option>{client.fees.filter((f) => f.active).map((f) => <option key={f.id} value={f.id}>{f.name}</option>)}</select>
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div><label className="label">Início</label><input type="date" name="startDate" className="input" /></div>
                <div><label className="label">Fim</label><input type="date" name="endDate" className="input" /></div>
              </div>
              <div><label className="label">Verba (R$)</label><input name="budget" inputMode="decimal" className="input" /></div>
              <div><label className="label">Briefing da campanha</label><textarea name="briefing" rows={4} className="input" /></div>
              <button className="btn-primary w-full">Salvar campanha</button>
            </form>
          )}
          <section className={`card overflow-x-auto ${manager ? "lg:col-span-2" : "lg:col-span-3"}`}>
            {client.campaigns.length === 0 ? <Empty>Nenhuma campanha.</Empty> : (
              <table className="w-full">
                <thead><tr><th className="th">Campanha</th><th className="th">Período</th><th className="th">Fee</th><th className="th">Verba</th><th className="th text-center">Jobs</th></tr></thead>
                <tbody>
                  {client.campaigns.map((c) => (
                    <tr key={c.id}>
                      <td className="td font-medium"><Link href={`/campanhas/${c.id}`} className="hover:text-mona">{c.name}</Link></td>
                      <td className="td text-xs">{fmtDate(c.startDate)} → {fmtDate(c.endDate)}</td>
                      <td className="td text-xs">{c.fee?.name ?? "Avulsa"}</td>
                      <td className="td">{c.budget ? fmtMoney(c.budget) : "—"}</td>
                      <td className="td text-center">{c._count.jobs}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            )}
          </section>
        </div>
      )}

      {aba === "dados" && manager && <ClientForm c={client} />}
    </div>
  );
}

function JobsTable({ jobs }: { jobs: { id: number; number: number; title: string; dueDate: Date; status: { name: string; color: string; isDone: boolean; isWaiting: boolean }; service: { name: string } }[] }) {
  if (!jobs.length) return <div className="card"><Empty>Nenhum job.</Empty></div>;
  return (
    <div className="card overflow-x-auto">
      <table className="w-full min-w-[640px]">
        <thead><tr><th className="th">Prazo</th><th className="th">Job</th><th className="th">Título</th><th className="th">Peça</th><th className="th">Situação</th></tr></thead>
        <tbody>
          {jobs.map((j) => {
            const late = isLate(j.dueDate, j.status.isDone, j.status.isWaiting);
            return (
              <tr key={j.id} className={late ? "bg-red-50/50" : ""}>
                <td className={`td text-xs ${late ? "font-semibold text-red-600" : ""}`}>{fmtShort(j.dueDate)}</td>
                <td className="td"><Link href={`/jobs/${j.id}`} className="font-bold text-mona">#{j.number}</Link></td>
                <td className="td"><Link href={`/jobs/${j.id}`} className="hover:text-mona">{j.title}</Link></td>
                <td className="td text-xs text-black/60">{j.service.name}</td>
                <td className="td"><StatusChip name={j.status.name} color={j.status.color} /></td>
              </tr>
            );
          })}
        </tbody>
      </table>
    </div>
  );
}
