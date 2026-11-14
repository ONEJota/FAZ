import Link from "next/link";
import { db } from "@/lib/db";
import { requireManager, ROLES } from "@/lib/auth";
import { fmtDateTime, fmtMinutes, fmtMoney } from "@/lib/format";
import { saveService, saveStatus, saveUser } from "@/app/actions/cadastros";
import { restoreJob } from "@/app/actions/jobs";
import { ErrorBanner, PageHeader, StatusChip, Tabs, Empty } from "@/components/ui";

export default async function Config({ searchParams }: { searchParams: Promise<{ aba?: string; erro?: string; edit?: string }> }) {
  const sp = await searchParams;
  const user = await requireManager();
  const admin = user.role === "ADMIN";
  const aba = sp.aba || "servicos";
  const editId = Number(sp.edit) || 0;

  const items = [
    { key: "servicos", label: "Tabela de peças" },
    ...(admin ? [{ key: "situacoes", label: "Situações" }, { key: "usuarios", label: "Usuários" }] : []),
    { key: "lixeira", label: "Lixeira" },
  ];

  return (
    <>
      <PageHeader title="Configurações" />
      <ErrorBanner msg={sp.erro} />
      <Tabs base="/config" current={aba} items={items} />
      {aba === "servicos" && <Servicos editId={editId} />}
      {aba === "situacoes" && admin && <Situacoes editId={editId} />}
      {aba === "usuarios" && admin && <Usuarios editId={editId} />}
      {aba === "lixeira" && <Lixeira />}
    </>
  );
}

async function Servicos({ editId }: { editId: number }) {
  const services = await db.service.findMany({ orderBy: [{ category: "asc" }, { name: "asc" }], include: { _count: { select: { jobs: true } } } });
  const e = services.find((s) => s.id === editId);
  return (
    <div className="grid gap-5 lg:grid-cols-3">
      <form action={saveService} className="card h-fit space-y-3 p-5" key={e?.id ?? "new"}>
        {e && <input type="hidden" name="id" value={e.id} />}
        <h2 className="font-bold">{e ? "Editar peça" : "Nova peça"}</h2>
        <div><label className="label">Nome *</label><input name="name" required defaultValue={e?.name} className="input" /></div>
        <div><label className="label">Categoria</label><input name="category" defaultValue={e?.category ?? "Social"} className="input" list="cats" />
          <datalist id="cats">{[...new Set(services.map((s) => s.category))].map((c) => <option key={c} value={c} />)}</datalist>
        </div>
        <div><label className="label">Tempo padrão (horas)</label><input name="defaultHours" inputMode="decimal" defaultValue={e ? String(e.defaultMinutes / 60).replace(".", ",") : "1"} className="input" /></div>
        {e && <div><label className="label">Situação</label><select name="active" defaultValue={e.active ? "on" : "off"} className="input"><option value="on">Ativa</option><option value="off">Inativa</option></select></div>}
        <div className="flex gap-2"><button className="btn-primary">Salvar</button>{e && <Link href="/config?aba=servicos" className="btn-ghost">Cancelar</Link>}</div>
        <p className="text-xs text-black/45">O sistema bloqueia nomes repetidos ou quase iguais (ex.: “Spot 01” e “Spot01”).</p>
      </form>
      <section className="card overflow-x-auto lg:col-span-2">
        <table className="w-full">
          <thead><tr><th className="th">Peça</th><th className="th">Categoria</th><th className="th text-right">Tempo padrão</th><th className="th text-right">Jobs</th><th className="th" /></tr></thead>
          <tbody>
            {services.map((s) => (
              <tr key={s.id} className={s.active ? "" : "opacity-50"}>
                <td className="td font-medium">{s.name}</td><td className="td text-black/60">{s.category}</td>
                <td className="td text-right font-mono">{fmtMinutes(s.defaultMinutes)}</td><td className="td text-right">{s._count.jobs}</td>
                <td className="td text-right"><Link href={`/config?aba=servicos&edit=${s.id}`} className="text-xs text-mona hover:underline">editar</Link></td>
              </tr>
            ))}
          </tbody>
        </table>
      </section>
    </div>
  );
}

async function Situacoes({ editId }: { editId: number }) {
  const statuses = await db.status.findMany({ orderBy: { order: "asc" }, include: { _count: { select: { jobs: true } } } });
  const e = statuses.find((s) => s.id === editId);
  return (
    <div className="grid gap-5 lg:grid-cols-3">
      <form action={saveStatus} className="card h-fit space-y-3 p-5" key={e?.id ?? "new"}>
        {e && <input type="hidden" name="id" value={e.id} />}
        <h2 className="font-bold">{e ? "Editar situação" : "Nova situação"}</h2>
        <div><label className="label">Nome *</label><input name="name" required defaultValue={e?.name} className="input" /></div>
        <div className="grid grid-cols-2 gap-3">
          <div><label className="label">Ordem</label><input name="order" type="number" defaultValue={e?.order ?? statuses.length + 1} className="input" /></div>
          <div><label className="label">Cor</label><input name="color" type="color" defaultValue={e?.color ?? "#94a3b8"} className="input h-10 p-1" /></div>
        </div>
        <label className="flex items-center gap-2 text-sm"><input type="checkbox" name="isDone" defaultChecked={e?.isDone} /> É a situação final (concluído)</label>
        <label className="flex items-center gap-2 text-sm"><input type="checkbox" name="isWaiting" defaultChecked={e?.isWaiting} /> Em espera (não conta atraso)</label>
        <div className="flex gap-2"><button className="btn-primary">Salvar</button>{e && <Link href="/config?aba=situacoes" className="btn-ghost">Cancelar</Link>}</div>
      </form>
      <section className="card lg:col-span-2">
        <ul>
          {statuses.map((s) => (
            <li key={s.id} className="flex items-center gap-3 border-t border-black/5 px-4 py-2.5 first:border-0">
              <span className="w-6 text-sm text-black/40">{s.order}</span>
              <StatusChip name={s.name} color={s.color} />
              {s.isDone && <span className="text-xs text-green-700">final</span>}
              {s.isWaiting && <span className="text-xs text-black/50">espera</span>}
              <span className="ml-auto text-xs text-black/45">{s._count.jobs} jobs</span>
              <Link href={`/config?aba=situacoes&edit=${s.id}`} className="text-xs text-mona hover:underline">editar</Link>
            </li>
          ))}
        </ul>
      </section>
    </div>
  );
}

async function Usuarios({ editId }: { editId: number }) {
  const users = await db.user.findMany({ orderBy: [{ active: "desc" }, { name: "asc" }] });
  const e = users.find((u) => u.id === editId);
  return (
    <div className="grid gap-5 lg:grid-cols-3">
      <form action={saveUser} className="card h-fit space-y-3 p-5" key={e?.id ?? "new"}>
        {e && <input type="hidden" name="id" value={e.id} />}
        <h2 className="font-bold">{e ? `Editar ${e.name}` : "Novo usuário"}</h2>
        <div><label className="label">Nome *</label><input name="name" required defaultValue={e?.name} className="input" /></div>
        <div><label className="label">E-mail (login) *</label><input name="email" type="email" required defaultValue={e?.email} className="input" /></div>
        <div className="grid grid-cols-2 gap-3">
          <div><label className="label">Perfil</label>
            <select name="role" defaultValue={e?.role ?? "COLABORADOR"} className="input">{Object.entries(ROLES).map(([k, v]) => <option key={k} value={k}>{v}</option>)}</select>
          </div>
          <div><label className="label">Custo/hora (R$)</label><input name="hourlyCost" inputMode="decimal" defaultValue={e ? String(e.hourlyCost).replace(".", ",") : ""} className="input" placeholder="35,00" /></div>
          <div><label className="label">Cor</label><input name="color" type="color" defaultValue={e?.color ?? "#E6007E"} className="input h-10 p-1" /></div>
          {e && <div><label className="label">Situação</label><select name="active" defaultValue={e.active ? "on" : "off"} className="input"><option value="on">Ativo</option><option value="off">Inativo</option></select></div>}
        </div>
        <div><label className="label">{e ? "Nova senha (deixe vazio para manter)" : "Senha inicial *"}</label><input name="password" type="password" autoComplete="new-password" className="input" /></div>
        <div className="flex gap-2"><button className="btn-primary">Salvar</button>{e && <Link href="/config?aba=usuarios" className="btn-ghost">Cancelar</Link>}</div>
        <p className="text-xs text-black/45">Custo/hora = salário + encargos ÷ horas trabalhadas no mês. É usado na rentabilidade.</p>
      </form>
      <section className="card overflow-x-auto lg:col-span-2">
        <table className="w-full">
          <thead><tr><th className="th">Nome</th><th className="th">E-mail</th><th className="th">Perfil</th><th className="th text-right">Custo/h</th><th className="th" /></tr></thead>
          <tbody>
            {users.map((u) => (
              <tr key={u.id} className={u.active ? "" : "opacity-50"}>
                <td className="td font-medium"><span className="mr-2 inline-block h-2.5 w-2.5 rounded-full" style={{ background: u.color }} />{u.name}</td>
                <td className="td text-black/60">{u.email}</td>
                <td className="td">{ROLES[u.role as keyof typeof ROLES]}</td>
                <td className={`td text-right ${u.hourlyCost ? "" : "text-amber-600"}`}>{u.hourlyCost ? fmtMoney(u.hourlyCost) : "não definido"}</td>
                <td className="td text-right"><Link href={`/config?aba=usuarios&edit=${u.id}`} className="text-xs text-mona hover:underline">editar</Link></td>
              </tr>
            ))}
          </tbody>
        </table>
      </section>
    </div>
  );
}

async function Lixeira() {
  const jobs = await db.job.findMany({ where: { deletedAt: { not: null } }, include: { client: true }, orderBy: { deletedAt: "desc" } });
  return (
    <section className="card overflow-x-auto">
      {jobs.length === 0 ? <Empty>A lixeira está vazia.</Empty> : (
        <table className="w-full">
          <thead><tr><th className="th">Job</th><th className="th">Cliente</th><th className="th">Na lixeira desde</th><th className="th" /></tr></thead>
          <tbody>
            {jobs.map((j) => (
              <tr key={j.id}>
                <td className="td"><Link href={`/jobs/${j.id}`} className="font-bold text-mona">#{j.number}</Link> {j.title}</td>
                <td className="td text-black/60">{j.client.name}</td>
                <td className="td text-xs">{fmtDateTime(j.deletedAt)}</td>
                <td className="td text-right"><form action={restoreJob}><input type="hidden" name="jobId" value={j.id} /><button className="btn-ghost">Restaurar</button></form></td>
              </tr>
            ))}
          </tbody>
        </table>
      )}
    </section>
  );
}
