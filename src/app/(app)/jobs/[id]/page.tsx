import Link from "next/link";
import { notFound } from "next/navigation";
import { db } from "@/lib/db";
import { isManager, requireUser } from "@/lib/auth";
import { fmtDateTime, fmtMinutes, fmtShort, isLate, REVISION_REASONS, toInputDateTime } from "@/lib/format";
import { ErrorBanner, Stars, StatusChip, Tabs, Empty } from "@/components/ui";
import { Avatar } from "@/components/Avatar";
import { addComment, addRevision, addTask, duplicateJob, restoreJob, setJobStatusForm, toggleTask, trashJob } from "@/app/actions/jobs";
import { addTimeEntry, deleteTimeEntry, startTimer } from "@/app/actions/horas";

export default async function JobPage({ params, searchParams }: { params: Promise<{ id: string }>; searchParams: Promise<{ aba?: string; erro?: string }> }) {
  const { id } = await params;
  const sp = await searchParams;
  const user = await requireUser();
  const manager = isManager(user);
  const job = await db.job.findUnique({
    where: { id: Number(id) },
    include: {
      client: true, campaign: true, fee: true, service: true, status: true, requester: true,
      responsibles: { include: { user: true } },
      tasks: { include: { assignee: true }, orderBy: [{ done: "asc" }, { dueDate: "asc" }] },
      revisions: { include: { createdBy: true }, orderBy: { createdAt: "asc" } },
      comments: { include: { user: true }, orderBy: { createdAt: "asc" } },
      timeEntries: { include: { user: true }, orderBy: { startedAt: "desc" } },
      activities: { include: { user: true }, orderBy: { createdAt: "desc" }, take: 50 },
    },
  });
  if (!job) notFound();
  const [statuses, users] = await Promise.all([
    db.status.findMany({ orderBy: { order: "asc" } }),
    db.user.findMany({ where: { active: true }, orderBy: { name: "asc" } }),
  ]);

  const aba = sp.aba || "resumo";
  const spent = job.timeEntries.reduce((a, e) => a + e.minutes, 0);
  const late = isLate(job.dueDate, job.status.isDone, job.status.isWaiting);
  const pct = job.estimatedMinutes ? Math.round((spent / job.estimatedMinutes) * 100) : 0;
  const base = `/jobs/${job.id}`;
  const links = job.links.split(/\n+/).map((l) => l.trim()).filter(Boolean);
  const nowInput = toInputDateTime(new Date());
  const hourAgo = toInputDateTime(new Date(Date.now() - 3600000));

  return (
    <div className="mx-auto max-w-6xl">
      <ErrorBanner msg={sp.erro} />
      {job.deletedAt && (
        <div className="mb-4 flex items-center justify-between rounded-lg bg-amber-50 px-4 py-2.5 text-sm text-amber-800 ring-1 ring-amber-200">
          Este job está na lixeira.
          {manager && (
            <form action={restoreJob}><input type="hidden" name="jobId" value={job.id} /><button className="btn-ghost">Restaurar</button></form>
          )}
        </div>
      )}

      <div className="mb-1 text-sm text-black/50">
        <Link href="/pauta" className="hover:text-mona">← Pauta</Link> / <Link href={`/clientes/${job.clientId}`} className="hover:text-mona">{job.client.name}</Link>
        {job.campaign && <> / {job.campaign.name}</>}
      </div>
      <div className="mb-4 flex flex-wrap items-start justify-between gap-3">
        <div>
          <h1 className="text-2xl font-extrabold tracking-tight">
            <span className="text-mona">#{job.number}</span> {job.title}
            {job.revisions.length > 0 && <span className="ml-2 align-middle text-base font-bold text-black/40">{job.revisions.at(-1)!.letter}</span>}
          </h1>
          <div className="mt-1 flex flex-wrap items-center gap-2 text-sm">
            <StatusChip name={job.status.name} color={job.status.color} />
            {job.priority && <span className="chip bg-red-100 text-red-700">Urgente</span>}
            {late && <span className="chip bg-red-600 text-white">Atrasado</span>}
            <span className="text-black/50">{job.service.name}</span>
            {job.rating > 0 && <Stars n={job.rating} />}
          </div>
        </div>
        <div className="flex flex-wrap gap-2">
          <form action={setJobStatusForm} className="flex gap-1">
            <input type="hidden" name="jobId" value={job.id} />
            <select name="statusId" defaultValue={job.statusId} className="input w-48">
              {statuses.map((s) => <option key={s.id} value={s.id}>{s.name}</option>)}
            </select>
            <button className="btn-ghost">Mudar</button>
          </form>
          <form action={startTimer}><input type="hidden" name="jobId" value={job.id} /><input type="hidden" name="description" value={job.service.name} /><button className="btn-ghost">⏱ Iniciar horas</button></form>
          <Link href={`${base}/editar`} className="btn-primary">Editar</Link>
        </div>
      </div>

      <Tabs
        base={base}
        current={aba}
        items={[
          { key: "resumo", label: "Resumo" },
          { key: "tarefas", label: "Tarefas", count: job.tasks.filter((t) => !t.done).length },
          { key: "alteracoes", label: "Alterações", count: job.revisions.length },
          { key: "comentarios", label: "Comentários", count: job.comments.length },
          { key: "horas", label: "Horas", count: undefined },
          { key: "historico", label: "Histórico" },
        ]}
      />

      {aba === "resumo" && (
        <div className="grid gap-5 lg:grid-cols-3">
          <div className="space-y-5 lg:col-span-2">
            <section className="card p-5">
              <h2 className="mb-2 font-bold">Briefing</h2>
              {job.briefing ? <p className="whitespace-pre-wrap text-sm leading-relaxed">{job.briefing}</p> : <p className="text-sm text-black/45">Sem briefing.</p>}
            </section>
            {job.campaign?.briefing && (
              <section className="card p-5">
                <h2 className="mb-2 font-bold">Briefing da campanha</h2>
                <p className="whitespace-pre-wrap text-sm leading-relaxed">{job.campaign.briefing}</p>
              </section>
            )}
            <section className="card p-5">
              <h2 className="mb-2 font-bold">Links e arquivos</h2>
              {links.length ? (
                <ul className="space-y-1">
                  {links.map((l) => (
                    <li key={l} className="truncate text-sm">
                      {/^https?:\/\//.test(l) ? <a href={l} target="_blank" rel="noreferrer" className="text-mona hover:underline">{l}</a> : l}
                    </li>
                  ))}
                </ul>
              ) : (
                <p className="text-sm text-black/45">Nenhum link. Edite o job para adicionar.</p>
              )}
            </section>
          </div>
          <aside className="space-y-5">
            <section className="card divide-y divide-black/5 text-sm">
              <Info k="Prazo" v={<span className={late ? "font-semibold text-red-600" : ""}>{fmtDateTime(job.dueDate)}</span>} />
              <Info k="Início" v={fmtDateTime(job.startDate)} />
              <Info k="Aberto em" v={fmtDateTime(job.createdAt)} />
              <Info k="Pedido por" v={job.requester?.name ?? "—"} />
              {job.completedAt && <Info k="Concluído em" v={fmtDateTime(job.completedAt)} />}
              <Info k="Fee" v={job.fee?.name ?? "Avulso"} />
            </section>
            <section className="card p-4">
              <p className="label">Estimado × realizado</p>
              <p className="text-lg font-bold">{fmtMinutes(spent)} <span className="text-sm font-normal text-black/45">de {fmtMinutes(job.estimatedMinutes)}</span></p>
              <div className="mt-2 h-2 overflow-hidden rounded-full bg-black/5">
                <div className={`h-full ${pct > 100 ? "bg-red-500" : "bg-mona"}`} style={{ width: `${Math.min(pct, 100)}%` }} />
              </div>
              <p className={`mt-1 text-xs ${pct > 100 ? "text-red-600" : "text-black/45"}`}>{pct}% do tempo estimado</p>
            </section>
            <section className="card p-4">
              <p className="label">Responsáveis</p>
              <ul className="space-y-2">
                {job.responsibles.map((r) => (
                  <li key={r.userId} className="flex items-center gap-2 text-sm"><Avatar name={r.user.name} color={r.user.color} size={26} /> {r.user.name}</li>
                ))}
              </ul>
            </section>
            <section className="flex flex-wrap gap-2">
              <form action={duplicateJob}><input type="hidden" name="jobId" value={job.id} /><button className="btn-ghost">Duplicar</button></form>
              {manager && !job.deletedAt && (
                <form action={trashJob}><input type="hidden" name="jobId" value={job.id} /><button className="btn-danger">Mover para lixeira</button></form>
              )}
            </section>
          </aside>
        </div>
      )}

      {aba === "tarefas" && (
        <section className="card">
          <form action={addTask} className="flex flex-wrap items-end gap-2 border-b border-black/5 p-4">
            <input type="hidden" name="jobId" value={job.id} />
            <div className="min-w-60 flex-1"><label className="label">Nova tarefa</label><input name="title" required className="input" placeholder="Ex.: Arte do card 2" /></div>
            <div className="w-44"><label className="label">Responsável</label>
              <select name="assigneeId" className="input"><option value="">—</option>{users.map((u) => <option key={u.id} value={u.id}>{u.name}</option>)}</select>
            </div>
            <div className="w-52"><label className="label">Prazo</label><input type="datetime-local" name="dueDate" className="input" /></div>
            <button className="btn-primary">Adicionar</button>
          </form>
          {job.tasks.length === 0 ? <Empty>Nenhuma tarefa. Divida o job em etapas para acompanhar melhor.</Empty> : (
            <ul>
              {job.tasks.map((t) => (
                <li key={t.id} className="flex items-center gap-3 border-t border-black/5 px-4 py-2.5 first:border-0">
                  <form action={toggleTask}>
                    <input type="hidden" name="taskId" value={t.id} />
                    <button className={`flex h-5 w-5 items-center justify-center rounded border text-xs ${t.done ? "border-green-600 bg-green-600 text-white" : "border-black/30 hover:border-mona"}`} title={t.done ? "Reabrir" : "Concluir"}>
                      {t.done ? "✓" : ""}
                    </button>
                  </form>
                  <span className={`flex-1 text-sm ${t.done ? "text-black/40 line-through" : ""}`}>{t.title}</span>
                  {t.assignee && <span className="text-xs text-black/55">{t.assignee.name}</span>}
                  {t.dueDate && <span className={`text-xs ${!t.done && t.dueDate < new Date() ? "font-semibold text-red-600" : "text-black/45"}`}>{fmtShort(t.dueDate)}</span>}
                </li>
              ))}
            </ul>
          )}
        </section>
      )}

      {aba === "alteracoes" && (
        <div className="grid gap-5 lg:grid-cols-3">
          <form action={addRevision} className="card space-y-3 p-5">
            <input type="hidden" name="jobId" value={job.id} />
            <h2 className="font-bold">Registrar alteração {String.fromCharCode(65 + job.revisions.length)}</h2>
            <div>
              <label className="label">Motivo *</label>
              <select name="reason" required className="input">
                <option value="">Escolha…</option>
                {Object.entries(REVISION_REASONS).map(([k, v]) => <option key={k} value={k}>{v}</option>)}
              </select>
            </div>
            <div><label className="label">O que mudar? *</label><textarea name="details" required rows={4} className="input" /></div>
            <button className="btn-primary w-full">Registrar e mover para Ajustes</button>
            <p className="text-xs text-black/45">O motivo alimenta o relatório de refações por cliente.</p>
          </form>
          <section className="card lg:col-span-2">
            {job.revisions.length === 0 ? <Empty>Nenhuma alteração. 👏</Empty> : (
              <ul>
                {[...job.revisions].reverse().map((r) => (
                  <li key={r.id} className="border-t border-black/5 p-4 first:border-0">
                    <p className="text-sm"><b className="text-mona">Alteração {r.letter}</b> · <span className="chip bg-black/5">{REVISION_REASONS[r.reason]}</span> <span className="text-xs text-black/45">{fmtDateTime(r.createdAt)} por {r.createdBy.name}</span></p>
                    <p className="mt-1 whitespace-pre-wrap text-sm">{r.details}</p>
                  </li>
                ))}
              </ul>
            )}
          </section>
        </div>
      )}

      {aba === "comentarios" && (
        <section className="card">
          {job.comments.length === 0 ? <Empty>Nenhum comentário ainda.</Empty> : (
            <ul>
              {job.comments.map((c) => (
                <li key={c.id} className="flex gap-3 border-t border-black/5 p-4 first:border-0">
                  <Avatar name={c.user.name} color={c.user.color} />
                  <div><p className="text-sm"><b>{c.user.name}</b> <span className="text-xs text-black/45">{fmtDateTime(c.createdAt)}</span></p><p className="whitespace-pre-wrap text-sm">{c.body}</p></div>
                </li>
              ))}
            </ul>
          )}
          <form action={addComment} className="flex gap-2 border-t border-black/5 p-4">
            <input type="hidden" name="jobId" value={job.id} />
            <textarea name="body" required rows={2} className="input" placeholder="Escreva um comentário…" />
            <button className="btn-primary self-end">Enviar</button>
          </form>
        </section>
      )}

      {aba === "horas" && (
        <div className="grid gap-5 lg:grid-cols-3">
          <form action={addTimeEntry} className="card space-y-3 p-5">
            <input type="hidden" name="jobId" value={job.id} />
            <input type="hidden" name="back" value={`${base}?aba=horas`} />
            <h2 className="font-bold">Lançar horas manualmente</h2>
            <div><label className="label">Início</label><input type="datetime-local" name="startedAt" required defaultValue={hourAgo} className="input" /></div>
            <div><label className="label">Fim</label><input type="datetime-local" name="endedAt" required defaultValue={nowInput} className="input" /></div>
            <div><label className="label">Descrição</label><input name="description" required defaultValue={job.service.name} className="input" /></div>
            <button className="btn-primary w-full">Lançar</button>
          </form>
          <section className="card overflow-x-auto lg:col-span-2">
            <table className="w-full">
              <thead><tr><th className="th">Início</th><th className="th">Pessoa</th><th className="th">Descrição</th><th className="th text-right">Horas</th><th className="th"></th></tr></thead>
              <tbody>
                {job.timeEntries.map((e) => (
                  <tr key={e.id}>
                    <td className="td text-xs">{fmtShort(e.startedAt)}</td>
                    <td className="td">{e.user.name}</td>
                    <td className="td text-black/60">{e.description}</td>
                    <td className="td text-right font-mono">{e.endedAt ? fmtMinutes(e.minutes) : <span className="text-green-600">rodando</span>}</td>
                    <td className="td text-right">
                      {(e.userId === user.id || manager) && (
                        <form action={deleteTimeEntry}><input type="hidden" name="id" value={e.id} /><button className="text-xs text-red-500 hover:underline">excluir</button></form>
                      )}
                    </td>
                  </tr>
                ))}
                <tr><td className="td font-bold" colSpan={3}>Total</td><td className="td text-right font-mono font-bold">{fmtMinutes(spent)}</td><td className="td" /></tr>
              </tbody>
            </table>
          </section>
        </div>
      )}

      {aba === "historico" && (
        <section className="card">
          {job.activities.length === 0 ? <Empty>Sem histórico.</Empty> : (
            <ul>
              {job.activities.map((a) => (
                <li key={a.id} className="border-t border-black/5 px-4 py-2 text-sm first:border-0">
                  <span className="text-xs text-black/45">{fmtDateTime(a.createdAt)}</span> · <b>{a.user.name}</b> {a.action}
                </li>
              ))}
            </ul>
          )}
        </section>
      )}
    </div>
  );
}

function Info({ k, v }: { k: string; v: React.ReactNode }) {
  return (
    <div className="flex justify-between gap-3 px-4 py-2.5">
      <span className="text-black/50">{k}</span>
      <span className="text-right font-medium">{v}</span>
    </div>
  );
}
