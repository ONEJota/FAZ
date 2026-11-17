import Link from "next/link";
import type { Prisma } from "@prisma/client";
import { db } from "@/lib/db";
import { jobScope, requireUser } from "@/lib/auth";
import { fmtShort, isLate } from "@/lib/format";
import { PageHeader, StatusChip, Stat, Stars, Empty } from "@/components/ui";
import { AvatarStack } from "@/components/Avatar";
import { KanbanBoard, type Card, type Column } from "@/components/KanbanBoard";

type SP = { view?: string; grupo?: string; cliente?: string; resp?: string; meus?: string; q?: string; concluidos?: string; de?: string; ate?: string };

const isDay = (v?: string) => !!v && v.length === 10 && !Number.isNaN(Date.parse(v));
const ymd = (d: Date) => `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`;

export default async function Pauta({ searchParams }: { searchParams: Promise<SP> }) {
  const sp = await searchParams;
  const user = await requireUser();
  const view = sp.view === "kanban" ? "kanban" : "lista";
  const grupo = sp.grupo === "situacao" ? "situacao" : sp.grupo === "responsavel" ? "responsavel" : "prazo";
  const respId = sp.meus ? user.id : Number(sp.resp) || null;

  // Colaborador só enxerga os jobs abertos para ele
  const where: Prisma.JobWhereInput = { deletedAt: null, AND: [jobScope(user)] };
  const de = isDay(sp.de) ? sp.de : undefined;
  const ate = isDay(sp.ate) ? sp.ate : undefined;
  if (de || ate) where.dueDate = { ...(de ? { gte: new Date(`${de}T00:00:00`) } : {}), ...(ate ? { lte: new Date(`${ate}T23:59:59.999`) } : {}) };
  if (!sp.concluidos) where.status = { isDone: false };
  if (sp.cliente) where.clientId = Number(sp.cliente);
  if (respId) where.responsibles = { some: { userId: respId } };
  if (sp.q) where.OR = [{ title: { contains: sp.q, mode: "insensitive" } }, ...(Number(sp.q) ? [{ number: Number(sp.q) }] : [])];

  const [jobs, statuses, clients, users] = await Promise.all([
    db.job.findMany({
      where,
      include: { client: true, status: true, service: true, responsibles: { include: { user: true } }, tasks: { where: { done: false } } },
      orderBy: [{ dueDate: "asc" }],
    }),
    db.status.findMany({ orderBy: { order: "asc" } }),
    db.client.findMany({ where: { active: true }, orderBy: { name: "asc" } }),
    db.user.findMany({ where: { active: true }, orderBy: { name: "asc" } }),
  ]);

  const cards: Card[] = jobs.map((j) => ({
    id: j.id,
    number: j.number,
    title: j.title,
    client: j.client.name,
    due: j.dueDate.toISOString(),
    late: isLate(j.dueDate, j.status.isDone, j.status.isWaiting),
    priority: j.priority,
    statusId: j.statusId,
    statusName: j.status.name,
    statusColor: j.status.color,
    service: j.service.name,
    people: j.responsibles.map(({ user: u }) => ({ name: u.name, color: u.color, avatarStyle: u.avatarStyle, avatarSeed: u.avatarSeed, avatarBg: u.avatarBg, statusEmoji: u.statusEmoji })),
    openTasks: j.tasks.length,
  }));

  // Agrupamentos
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  const dayKey = (d: Date) => {
    const x = new Date(d);
    x.setHours(0, 0, 0, 0);
    return x.getTime();
  };
  let columns: Column[];
  if (grupo === "situacao") {
    columns = statuses
      .filter((s) => sp.concluidos || !s.isDone)
      .map((s) => ({ id: `s${s.id}`, title: s.name, color: s.color, statusId: s.id, cards: cards.filter((c) => c.statusId === s.id) }));
  } else if (grupo === "responsavel") {
    const people = users.filter((u) => cards.some((c) => c.people.some((p) => p.name === u.name)));
    columns = people.map((u) => ({ id: `u${u.id}`, title: u.name, color: u.color, cards: cards.filter((c) => c.people.some((p) => p.name === u.name)) }));
  } else {
    const late = cards.filter((c) => c.late);
    const rest = cards.filter((c) => !c.late);
    const map = new Map<number, Card[]>();
    for (const c of rest) {
      const k = dayKey(new Date(c.due));
      map.set(k, [...(map.get(k) ?? []), c]);
    }
    const label = (k: number) => {
      const diff = Math.round((k - today.getTime()) / 86400000);
      const d = new Date(k);
      const wd = d.toLocaleDateString("pt-BR", { weekday: "short" }).replace(".", "");
      if (diff <= 0) return `Prazo hoje · ${wd}`;
      if (diff === 1) return `Amanhã · ${wd}`;
      return `${d.toLocaleDateString("pt-BR", { day: "2-digit", month: "2-digit" })} · ${wd}`;
    };
    columns = [
      ...(late.length ? [{ id: "late", title: "Atrasados", color: "#ef4444", cards: late }] : []),
      ...[...map.entries()].sort((a, b) => a[0] - b[0]).map(([k, cs]) => ({ id: `d${k}`, title: label(k), cards: cs })),
    ];
  }

  const qs = (patch: Partial<SP>) => {
    const p = new URLSearchParams();
    const merged = { ...sp, ...patch };
    for (const [k, v] of Object.entries(merged)) if (v) p.set(k, String(v));
    return `/pauta?${p.toString()}`;
  };
  const lateCount = cards.filter((c) => c.late).length;
  const hoje = ymd(today);
  const em7 = ymd(new Date(today.getTime() + 6 * 86400000));
  const fimMes = ymd(new Date(today.getFullYear(), today.getMonth() + 1, 0));
  const presets = [
    { label: "Hoje", de: hoje, ate: hoje },
    { label: "Próximos 7 dias", de: hoje, ate: em7 },
    { label: "Até o fim do mês", de: hoje, ate: fimMes },
  ];

  return (
    <>
      <PageHeader title={sp.meus ? "Meus trabalhos" : "Pauta"} subtitle={`${cards.length} jobs ${sp.concluidos ? "" : "em andamento"}`}>
        <Link href="/jobs/novo" className="btn-primary">+ Novo job</Link>
      </PageHeader>

      <div className="mb-4 grid grid-cols-2 gap-3 md:grid-cols-4">
        <Stat label="Jobs na pauta" value={cards.length} />
        <Stat label="Atrasados" value={lateCount} tone={lateCount ? "bad" : "good"} />
        <Stat label="Prioridade" value={cards.filter((c) => c.priority).length} tone="warn" />
        <Stat label="Tarefas abertas" value={cards.reduce((a, c) => a + c.openTasks, 0)} />
      </div>

      <form className="card mb-4 flex flex-wrap items-end gap-3 p-3" action="/pauta">
        <input type="hidden" name="view" value={view} />
        <input type="hidden" name="grupo" value={grupo} />
        <div className="min-w-48 flex-1">
          <label className="label">Buscar</label>
          <input name="q" defaultValue={sp.q} placeholder="Título ou nº do job" className="input" />
        </div>
        <div className="w-56">
          <label className="label">Cliente</label>
          <select name="cliente" defaultValue={sp.cliente} className="input">
            <option value="">Todos</option>
            {clients.map((c) => <option key={c.id} value={c.id}>{c.name}</option>)}
          </select>
        </div>
        <div className="w-44">
          <label className="label">Responsável</label>
          <select name="resp" defaultValue={sp.meus ? String(user.id) : sp.resp} className="input">
            <option value="">Todos</option>
            {users.map((u) => <option key={u.id} value={u.id}>{u.name}</option>)}
          </select>
        </div>
        <div className="w-40">
          <label className="label">Prazo de</label>
          <input type="date" name="de" defaultValue={de} className="input" />
        </div>
        <div className="w-40">
          <label className="label">Prazo até</label>
          <input type="date" name="ate" defaultValue={ate} className="input" />
        </div>
        <label className="flex items-center gap-2 pb-2 text-sm">
          <input type="checkbox" name="concluidos" value="1" defaultChecked={!!sp.concluidos} /> Incluir concluídos
        </label>
        <button className="btn-primary">Filtrar</button>
        <div className="flex w-full flex-wrap items-center gap-1.5">
          <span className="mr-1 text-xs font-semibold uppercase text-black/45">Prazo</span>
          {presets.map((p) => {
            const on = de === p.de && ate === p.ate;
            return (
              <Link key={p.label} href={qs({ de: p.de, ate: p.ate })} className={`rounded-full px-3 py-1 text-xs font-semibold ${on ? "bg-ink text-white" : "bg-black/5 text-black/60 hover:bg-black/10"}`}>
                {p.label}
              </Link>
            );
          })}
          {(de || ate) && <Link href={qs({ de: "", ate: "" })} className="text-xs text-mona hover:underline">limpar datas</Link>}
        </div>
      </form>

      <div className="mb-4 flex flex-wrap items-center gap-2">
        <div className="flex rounded-lg bg-white p-1 ring-1 ring-black/10">
          {(["lista", "kanban"] as const).map((v) => (
            <Link key={v} href={qs({ view: v })} className={`rounded-md px-3 py-1 text-sm font-medium ${view === v ? "bg-mona text-white" : "text-black/60"}`}>
              {v === "lista" ? "Lista" : "Kanban"}
            </Link>
          ))}
        </div>
        <span className="ml-2 text-xs font-semibold uppercase text-black/45">Agrupar por</span>
        {(["prazo", "situacao", "responsavel"] as const).map((g) => (
          <Link key={g} href={qs({ grupo: g })} className={`rounded-full px-3 py-1 text-sm ${grupo === g ? "bg-mona-soft font-semibold text-mona" : "text-black/60 hover:bg-black/5"}`}>
            {g === "prazo" ? "Prazo" : g === "situacao" ? "Situação" : "Responsável"}
          </Link>
        ))}
        {view === "kanban" && grupo === "situacao" && <span className="ml-auto text-xs text-black/45">Arraste os cards para mudar a situação</span>}
      </div>

      {cards.length === 0 ? (
        <div className="card"><Empty>Nenhum job encontrado com esses filtros.</Empty></div>
      ) : view === "kanban" ? (
        <KanbanBoard columns={columns} draggable={grupo === "situacao"} />
      ) : (
        <div className="space-y-5">
          {columns.filter((c) => c.cards.length).map((col) => (
            <section key={col.id}>
              <h2 className="mb-2 flex items-center gap-2 text-sm font-bold" style={{ color: col.id === "late" ? "#dc2626" : undefined }}>
                {col.color && col.id !== "late" && <span className="h-2.5 w-2.5 rounded-full" style={{ background: col.color }} />}
                {col.title} <span className="font-normal text-black/40">({col.cards.length})</span>
              </h2>
              <div className="card overflow-x-auto">
                <table className="w-full min-w-[800px]">
                  <thead>
                    <tr><th className="th w-32">Prazo</th><th className="th w-20">Job</th><th className="th">Título</th><th className="th">Cliente</th><th className="th">Peça</th><th className="th">Equipe</th><th className="th">Situação</th></tr>
                  </thead>
                  <tbody>
                    {col.cards.map((c) => {
                      const j = jobs.find((x) => x.id === c.id)!;
                      return (
                        <tr key={c.id} className={c.late ? "bg-red-50/50" : "hover:bg-black/[.015]"}>
                          <td className={`td text-xs font-semibold ${c.late ? "text-red-600" : "text-black/60"}`}>{fmtShort(new Date(c.due))}</td>
                          <td className="td"><Link href={`/jobs/${c.id}`} className="font-bold text-mona hover:underline">#{c.number}</Link></td>
                          <td className="td font-medium">
                            <Link href={`/jobs/${c.id}`} className="hover:text-mona">{c.priority && <span className="mr-1 text-red-600">●</span>}{c.title}</Link>
                            {j.rating > 0 && <span className="ml-2 text-xs"><Stars n={j.rating} /></span>}
                            {c.openTasks > 0 && <span className="ml-2 text-xs text-black/45">☑ {c.openTasks}</span>}
                          </td>
                          <td className="td text-xs text-black/60">{c.client}</td>
                          <td className="td text-xs text-black/60">{c.service}</td>
                          <td className="td"><AvatarStack users={c.people} /></td>
                          <td className="td"><StatusChip name={c.statusName} color={c.statusColor} /></td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            </section>
          ))}
        </div>
      )}
    </>
  );
}
