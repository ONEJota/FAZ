import Link from "next/link";
import { notFound } from "next/navigation";
import { db } from "@/lib/db";
import { requireUser } from "@/lib/auth";
import { fmtDate, fmtMinutes, fmtMoney, fmtShort, isLate } from "@/lib/format";
import { PageHeader, Stat, StatusChip, Empty } from "@/components/ui";

export default async function Campanha({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  await requireUser();
  const c = await db.campaign.findUnique({
    where: { id: Number(id) },
    include: { client: true, fee: true, jobs: { where: { deletedAt: null }, include: { status: true, service: true, timeEntries: true }, orderBy: { dueDate: "asc" } } },
  });
  if (!c) notFound();
  const min = c.jobs.flatMap((j) => j.timeEntries).reduce((a, e) => a + e.minutes, 0);
  const est = c.jobs.reduce((a, j) => a + j.estimatedMinutes, 0);
  const late = c.jobs.filter((j) => isLate(j.dueDate, j.status.isDone, j.status.isWaiting)).length;
  return (
    <>
      <div className="mb-1 text-sm text-black/50"><Link href="/campanhas" className="hover:text-mona">← Campanhas</Link> / <Link href={`/clientes/${c.clientId}?aba=campanhas`} className="hover:text-mona">{c.client.name}</Link></div>
      <PageHeader title={c.name} subtitle={`${fmtDate(c.startDate)} → ${fmtDate(c.endDate)} · ${c.fee?.name ?? "Avulsa"}`}>
        <Link href="/jobs/novo" className="btn-primary">+ Job</Link>
      </PageHeader>
      <div className="mb-6 grid grid-cols-2 gap-3 md:grid-cols-5">
        <Stat label="Jobs" value={c.jobs.length} />
        <Stat label="Concluídos" value={c.jobs.filter((j) => j.status.isDone).length} tone="good" />
        <Stat label="Atrasados" value={late} tone={late ? "bad" : undefined} />
        <Stat label={`Horas (estimado ${fmtMinutes(est)})`} value={fmtMinutes(min)} tone={est && min > est ? "bad" : undefined} />
        <Stat label="Verba" value={c.budget ? fmtMoney(c.budget) : "—"} />
      </div>
      {c.briefing && <div className="card mb-6 p-4"><p className="label">Briefing da campanha</p><p className="whitespace-pre-wrap text-sm">{c.briefing}</p></div>}
      <div className="card overflow-x-auto">
        {c.jobs.length === 0 ? <Empty>Nenhum job nesta campanha. Ao abrir um job, escolha esta campanha.</Empty> : (
          <table className="w-full min-w-[640px]">
            <thead><tr><th className="th">Prazo</th><th className="th">Job</th><th className="th">Título</th><th className="th">Peça</th><th className="th text-right">Horas</th><th className="th">Situação</th></tr></thead>
            <tbody>
              {c.jobs.map((j) => (
                <tr key={j.id}>
                  <td className="td text-xs">{fmtShort(j.dueDate)}</td>
                  <td className="td"><Link href={`/jobs/${j.id}`} className="font-bold text-mona">#{j.number}</Link></td>
                  <td className="td">{j.title}</td>
                  <td className="td text-xs text-black/60">{j.service.name}</td>
                  <td className="td text-right font-mono text-xs">{fmtMinutes(j.timeEntries.reduce((a, e) => a + e.minutes, 0))}</td>
                  <td className="td"><StatusChip name={j.status.name} color={j.status.color} /></td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>
    </>
  );
}
