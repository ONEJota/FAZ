"use client";
import { useState } from "react";
import Link from "next/link";
import { saveJob } from "@/app/actions/jobs";

type Opt = { id: number; name: string };
type Props = {
  job?: {
    id: number; title: string; clientId: number; campaignId: number | null; feeId: number | null; serviceId: number; statusId: number;
    dueDate: string; startDate: string; priority: boolean; estimatedHours: string; rating: number; briefing: string; links: string; responsibles: number[];
  };
  clients: Opt[];
  campaigns: (Opt & { clientId: number; feeId: number | null })[];
  fees: (Opt & { clientId: number })[];
  services: (Opt & { defaultMinutes: number; category: string })[];
  statuses: Opt[];
  users: Opt[];
  defaultDue: string;
  currentUserId?: number; // não é mais usado: quem abre o job não entra como responsável automaticamente
};

export function JobForm({ job, clients, campaigns, fees, services, statuses, users, defaultDue }: Props) {
  const [clientId, setClientId] = useState(job?.clientId ?? 0);
  const [serviceId, setServiceId] = useState(job?.serviceId ?? 0);
  const [est, setEst] = useState(job?.estimatedHours ?? "");
  const [rating, setRating] = useState(job?.rating ?? 0);
  // Quem abre o job fica registrado em "Pedido por"; a equipe é escolhida aqui (começa vazia)
  const [resp, setResp] = useState<number[]>(job?.responsibles ?? []);
  const clientCampaigns = campaigns.filter((c) => c.clientId === clientId);
  const clientFees = fees.filter((f) => f.clientId === clientId);
  const svc = services.find((s) => s.id === serviceId);
  const categories = [...new Set(services.map((s) => s.category))];

  return (
    <form action={saveJob} className="space-y-5">
      {job && <input type="hidden" name="id" value={job.id} />}
      <section className="card grid gap-4 p-5 md:grid-cols-2">
        <div className="md:col-span-2">
          <label className="label">Título *</label>
          <input name="title" required defaultValue={job?.title} className="input text-base" placeholder="Ex.: Carrossel Black Friday" />
        </div>
        <div>
          <label className="label">Cliente *</label>
          <select name="clientId" required value={clientId || ""} onChange={(e) => setClientId(Number(e.target.value))} className="input">
            <option value="">Escolha…</option>
            {clients.map((c) => <option key={c.id} value={c.id}>{c.name}</option>)}
          </select>
        </div>
        <div>
          <label className="label">Peça / serviço *</label>
          <select
            name="serviceId"
            required
            value={serviceId || ""}
            onChange={(e) => {
              const id = Number(e.target.value);
              setServiceId(id);
              const s = services.find((x) => x.id === id);
              if (s && !est) setEst(String(s.defaultMinutes / 60).replace(".", ","));
            }}
            className="input"
          >
            <option value="">Escolha…</option>
            {categories.map((cat) => (
              <optgroup key={cat} label={cat}>
                {services.filter((s) => s.category === cat).map((s) => <option key={s.id} value={s.id}>{s.name}</option>)}
              </optgroup>
            ))}
          </select>
        </div>
        <div>
          <label className="label">Campanha</label>
          <select name="campaignId" defaultValue={job?.campaignId ?? ""} className="input" disabled={!clientId}>
            <option value="">{clientCampaigns.length ? "Sem campanha" : "Cliente sem campanhas"}</option>
            {clientCampaigns.map((c) => <option key={c.id} value={c.id}>{c.name}</option>)}
          </select>
        </div>
        <div>
          <label className="label">Fee (contrato)</label>
          <select name="feeId" defaultValue={job?.feeId ?? ""} className="input" disabled={!clientId}>
            <option value="">{clientFees.length ? "Avulso (fora do fee)" : "Cliente sem fee cadastrado"}</option>
            {clientFees.map((f) => <option key={f.id} value={f.id}>{f.name}</option>)}
          </select>
          <p className="mt-1 text-xs text-black/45">Se escolher uma campanha ligada a um fee, o fee é preenchido sozinho.</p>
        </div>
      </section>

      <section className="card grid gap-4 p-5 md:grid-cols-4">
        <div>
          <label className="label">Início</label>
          <input type="datetime-local" name="startDate" defaultValue={job?.startDate} className="input" />
        </div>
        <div>
          <label className="label">Prazo *</label>
          <input type="datetime-local" name="dueDate" required defaultValue={job?.dueDate ?? defaultDue} className="input" />
        </div>
        <div>
          <label className="label">Tempo estimado (horas)</label>
          <input name="estimatedHours" value={est} onChange={(e) => setEst(e.target.value)} className="input" placeholder={svc ? String(svc.defaultMinutes / 60).replace(".", ",") : "Ex.: 1,5"} inputMode="decimal" />
          <p className="mt-1 text-xs text-black/45">{svc ? `Padrão da peça: ${String(svc.defaultMinutes / 60).replace(".", ",")} h` : "Vem da tabela de peças"}</p>
        </div>
        <div>
          <label className="label">Situação *</label>
          <select name="statusId" required defaultValue={job?.statusId ?? statuses[0]?.id} className="input">
            {statuses.map((s) => <option key={s.id} value={s.id}>{s.name}</option>)}
          </select>
        </div>
        <div className="md:col-span-2">
          <label className="label">Responsáveis * (até 5)</label>
          <div className="flex flex-wrap gap-1.5">
            {users.map((u) => {
              const on = resp.includes(u.id);
              return (
                <label key={u.id} className={`cursor-pointer rounded-full px-3 py-1 text-sm ring-1 ${on ? "bg-mona text-white ring-mona" : "bg-white ring-black/15 hover:bg-black/5"}`}>
                  <input
                    type="checkbox"
                    name="responsibles"
                    value={u.id}
                    checked={on}
                    onChange={() => setResp(on ? resp.filter((x) => x !== u.id) : resp.length < 5 ? [...resp, u.id] : resp)}
                    className="hidden"
                  />
                  {u.name}
                </label>
              );
            })}
          </div>
        </div>
        {resp.length > 0 && (
          <div className="md:col-span-4">
            <label className="label">{job ? "Nova tarefa para cada pessoa (opcional)" : "Tarefa de cada pessoa"}</label>
            <div className="space-y-2">
              {resp.map((uid) => {
                const u = users.find((x) => x.id === uid);
                if (!u) return null;
                return (
                  <div key={uid} className="flex flex-col gap-1 sm:flex-row sm:items-center sm:gap-3">
                    <span className="w-40 shrink-0 truncate text-sm font-semibold">{u.name}</span>
                    <input name={`task_${uid}`} className="input" placeholder="Ex.: Criar a arte do carrossel" maxLength={200} />
                  </div>
                );
              })}
            </div>
            <p className="mt-1 text-xs text-black/45">Cada tarefa começa como Pendente e vai para a área de trabalho da pessoa. Em branco, a pessoa entra no job sem tarefa.</p>
          </div>
        )}
        <div>
          <label className="label">Prioridade</label>
          <label className="flex items-center gap-2 py-2 text-sm">
            <input type="checkbox" name="priority" defaultChecked={job?.priority} /> Urgente
          </label>
        </div>
        <div>
          <label className="label">Complexidade</label>
          <input type="hidden" name="rating" value={rating} />
          <div className="flex gap-0.5 py-1 text-2xl">
            {[1, 2, 3, 4, 5].map((n) => (
              <button type="button" key={n} onClick={() => setRating(rating === n ? 0 : n)} className={n <= rating ? "text-amber-400" : "text-black/15 hover:text-amber-300"}>
                ★
              </button>
            ))}
          </div>
        </div>
      </section>

      <section className="card space-y-4 p-5">
        <div>
          <label className="label">Briefing</label>
          <textarea name="briefing" rows={10} defaultValue={job?.briefing} className="input font-[inherit] leading-relaxed" placeholder={"Objetivo:\nPúblico:\nMensagem principal:\nFormato e medidas:\nReferências:\nObservações:"} />
        </div>
        <div>
          <label className="label">Links e arquivos (um por linha)</label>
          <textarea name="links" rows={3} defaultValue={job?.links} className="input font-mono text-xs" placeholder="https://drive.google.com/…" />
          <p className="mt-1 text-xs text-black/45">Cole aqui os links do Drive, referências do Instagram etc. Eles ficam guardados no job.</p>
        </div>
      </section>

      <div className="flex gap-2">
        <button className="btn-primary">{job ? "Salvar alterações" : "Abrir job"}</button>
        <Link href={job ? `/jobs/${job.id}` : "/pauta"} className="btn-ghost">Cancelar</Link>
      </div>
    </form>
  );
}
