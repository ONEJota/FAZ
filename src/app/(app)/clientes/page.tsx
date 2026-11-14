import Link from "next/link";
import { db } from "@/lib/db";
import { isManager, requireUser } from "@/lib/auth";
import { fmtMoney } from "@/lib/format";
import { ErrorBanner, PageHeader, Empty } from "@/components/ui";

export default async function Clientes({ searchParams }: { searchParams: Promise<{ q?: string; erro?: string; inativos?: string }> }) {
  const sp = await searchParams;
  const user = await requireUser();
  const clients = await db.client.findMany({
    where: { ...(sp.inativos ? {} : { active: true }), ...(sp.q ? { name: { contains: sp.q, mode: "insensitive" } } : {}) },
    include: {
      fees: { where: { active: true } },
      _count: { select: { jobs: { where: { deletedAt: null, status: { isDone: false } } }, campaigns: { where: { active: true } } } },
    },
    orderBy: { name: "asc" },
  });
  return (
    <>
      <PageHeader title="Clientes" subtitle={`${clients.length} clientes`}>
        {isManager(user) && <Link href="/clientes/novo" className="btn-primary">+ Novo cliente</Link>}
      </PageHeader>
      <ErrorBanner msg={sp.erro} />
      <form className="mb-4 flex gap-2">
        <input name="q" defaultValue={sp.q} placeholder="Buscar cliente…" className="input max-w-sm" />
        <label className="flex items-center gap-2 text-sm"><input type="checkbox" name="inativos" value="1" defaultChecked={!!sp.inativos} /> Mostrar inativos</label>
        <button className="btn-ghost">Buscar</button>
      </form>
      <div className="card overflow-x-auto">
        {clients.length === 0 ? <Empty>Nenhum cliente encontrado.</Empty> : (
          <table className="w-full min-w-[700px]">
            <thead><tr><th className="th">Cliente</th><th className="th">Segmento</th><th className="th">Fee mensal</th><th className="th text-center">Jobs ativos</th><th className="th text-center">Campanhas</th></tr></thead>
            <tbody>
              {clients.map((c) => {
                const fee = c.fees.reduce((a, f) => a + f.monthlyValue, 0);
                return (
                  <tr key={c.id} className="hover:bg-black/[.015]">
                    <td className="td font-semibold"><Link href={`/clientes/${c.id}`} className="hover:text-mona">{c.name}</Link>{!c.active && <span className="chip ml-2 bg-black/5 text-black/50">inativo</span>}</td>
                    <td className="td text-black/60">{c.segment ?? "—"}</td>
                    <td className="td">{fee ? fmtMoney(fee) : <span className="text-xs text-amber-600">sem fee</span>}</td>
                    <td className="td text-center">{c._count.jobs}</td>
                    <td className="td text-center">{c._count.campaigns}</td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        )}
      </div>
    </>
  );
}
