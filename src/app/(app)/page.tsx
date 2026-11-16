import Link from "next/link";
import { db } from "@/lib/db";
import { jobScope, requireUser } from "@/lib/auth";
import { fmtMinutes, fmtShort, isLate } from "@/lib/format";
import { ErrorBanner, PageHeader, Stat, StatusChip, Empty } from "@/components/ui";
import { Avatar } from "@/components/Avatar";

export default async function Painel({ searchParams }: { searchParams: Promise<{ erro?: string }> }) {
  const sp = await searchParams;
  const user = await requireUser();
  const now = new Date();
  const weekStart = new Date(now);
  weekStart.setDate(now.getDate() - now.getDay());
  weekStart.setHours(0, 0, 0, 0);

  const jobs = await db.job.findMany({
    where: { deletedAt: null, status: { isDone: false }, responsibles: { some: { userId: user.id } } },
    include: { client: true, status: true },
    orderBy: { dueDate: "asc" },
  });
  const tasks = await db.task.findMany({
    where: { assigneeId: user.id, done: false, job: { deletedAt: null } },
    include: { job: true },
    orderBy: { dueDate: "asc" },
  });
  const week = await db.timeEntry.findMany({ where: { userId: user.id, startedAt: { gte: weekStart }, endedAt: { not: null } } });
  const comments = await db.comment.findMany({
    where: { job: { deletedAt: null, responsibles: { some: { userId: user.id } }, ...jobScope(user) } },
    include: { user: true, job: true },
    orderBy: { createdAt: "desc" },
    take: 8,
  });

  const late = jobs.filter((j) => isLate(j.dueDate, j.status.isDone, j.status.isWaiting));
  const todayEnd = new Date(now);
  todayEnd.setHours(23, 59, 59);
  const dueToday = jobs.filter((j) => j.dueDate >= now && j.dueDate <= todayEnd);
  const weekMin = week.reduce((a, e) => a + e.minutes, 0);

  // horas por dia da semana
  const days = ["Dom", "Seg", "Ter", "Qua", "Qui", "Sex", "Sáb"].map((d, i) => ({
    d,
    min: week.filter((e) => e.startedAt.getDay() === i).reduce((a, e) => a + e.minutes, 0),
  }));
  const maxDay = Math.max(60, ...days.map((x) => x.min));

  return (
    <>
      <ErrorBanner msg={sp.erro === "permissao" ? "Você não tem permissão para acessar aquela área." : sp.erro} />
      <PageHeader title={`Olá, ${user.name.split(" ")[0]}`} subtitle="Seu dia na Mona">
        <Link href="/pauta?meus=1" className="btn-ghost">Meus trabalhos</Link>
      </PageHeader>

      <div className="mb-6 grid grid-cols-2 gap-3 md:grid-cols-5">
        <Stat label="Jobs ativos" value={jobs.length} />
        <Stat label="Jobs atrasados" value={late.length} tone={late.length ? "bad" : "good"} />
        <Stat label="Prazo hoje" value={dueToday.length} tone={dueToday.length ? "warn" : undefined} />
        <Stat label="Tarefas abertas" value={tasks.length} />
        <Stat label="Horas na semana" value={fmtMinutes(weekMin)} />
      </div>

      <div className="grid gap-6 lg:grid-cols-3">
        <section className="card lg:col-span-2">
          <h2 className="border-b border-black/5 px-4 py-3 font-bold">Meus jobs por prazo</h2>
          {jobs.length === 0 ? (
            <Empty>Nenhum job ativo com você. 🎉</Empty>
          ) : (
            <ul>
              {jobs.slice(0, 12).map((j) => {
                const atrasado = isLate(j.dueDate, j.status.isDone, j.status.isWaiting);
                return (
                  <li key={j.id} className="border-t border-black/5 first:border-0">
                    <Link href={`/jobs/${j.id}`} className={`flex items-center gap-3 px-4 py-2.5 hover:bg-black/[.02] ${atrasado ? "bg-red-50/60" : ""}`}>
                      <span className={`w-20 shrink-0 text-xs font-semibold sm:w-24 ${atrasado ? "text-red-600" : "text-black/60"}`}>{fmtShort(j.dueDate)}</span>
                      <span className="w-14 shrink-0 text-xs font-bold text-mona">#{j.number}</span>
                      <span className="min-w-0 flex-1 truncate text-sm font-medium">
                        {j.priority && <span className="mr-1 text-red-600">●</span>}
                        {j.title}
                        <span className="ml-2 hidden text-xs font-normal text-black/45 sm:inline">{j.client.name}</span>
                      </span>
                      <span className="hidden sm:inline"><StatusChip name={j.status.name} color={j.status.color} /></span>
                    </Link>
                  </li>
                );
              })}
            </ul>
          )}
        </section>

        <section className="space-y-6">
          <div className="card p-4">
            <h2 className="mb-3 font-bold">Horas nesta semana</h2>
            <div className="flex h-32 items-end gap-2">
              {days.map((x) => (
                <div key={x.d} className="flex flex-1 flex-col items-center gap-1">
                  <span className="text-[10px] text-black/45">{x.min ? fmtMinutes(x.min) : ""}</span>
                  <div className="w-full rounded-t bg-mona/80" style={{ height: `${(x.min / maxDay) * 90}px` }} />
                  <span className="text-xs text-black/50">{x.d}</span>
                </div>
              ))}
            </div>
          </div>

          <div className="card">
            <h2 className="border-b border-black/5 px-4 py-3 font-bold">Minhas tarefas</h2>
            {tasks.length === 0 ? (
              <Empty>Sem tarefas abertas.</Empty>
            ) : (
              <ul>
                {tasks.slice(0, 8).map((t) => (
                  <li key={t.id} className="border-t border-black/5 px-4 py-2 text-sm first:border-0">
                    <Link href={`/jobs/${t.jobId}?aba=tarefas`} className="hover:text-mona">
                      {t.title} <span className="text-xs text-black/45">· job {t.job.number}</span>
                    </Link>
                    {t.dueDate && <p className={`text-xs ${t.dueDate < now ? "text-red-600" : "text-black/45"}`}>{fmtShort(t.dueDate)}</p>}
                  </li>
                ))}
              </ul>
            )}
          </div>
        </section>
      </div>

      <section className="card mt-6">
        <h2 className="border-b border-black/5 px-4 py-3 font-bold">Últimos comentários nos meus jobs</h2>
        {comments.length === 0 ? (
          <Empty>Nenhum comentário ainda.</Empty>
        ) : (
          <ul className="grid md:grid-cols-2">
            {comments.map((c) => (
              <li key={c.id} className="flex gap-3 border-t border-black/5 px-4 py-3">
                <Avatar name={c.user.name} color={c.user.color} />
                <div className="min-w-0">
                  <p className="text-sm">
                    <b>{c.user.name}</b>{" "}
                    <Link href={`/jobs/${c.jobId}?aba=comentarios`} className="chip bg-mona-soft text-mona">Job {c.job.number}</Link>{" "}
                    <span className="text-xs text-black/45">{fmtShort(c.createdAt)}</span>
                  </p>
                  <p className="line-clamp-2 text-sm text-black/70">{c.body}</p>
                </div>
              </li>
            ))}
          </ul>
        )}
      </section>
    </>
  );
}
