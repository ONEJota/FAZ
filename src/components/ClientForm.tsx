import { saveClient } from "@/app/actions/cadastros";
import type { Client } from "@prisma/client";

export function ClientForm({ c }: { c?: Client }) {
  return (
    <form action={saveClient} className="card grid gap-4 p-5 md:grid-cols-2">
      {c && <input type="hidden" name="id" value={c.id} />}
      <div><label className="label">Nome fantasia *</label><input name="name" required defaultValue={c?.name} className="input uppercase" /></div>
      <div><label className="label">Razão social</label><input name="legalName" defaultValue={c?.legalName ?? ""} className="input" /></div>
      <div><label className="label">CNPJ / CPF</label><input name="document" defaultValue={c?.document ?? ""} className="input" /></div>
      <div><label className="label">Segmento</label><input name="segment" defaultValue={c?.segment ?? ""} className="input" placeholder="Ex.: Concessionária, Saúde…" /></div>
      <div><label className="label">Contato principal</label><input name="contactName" defaultValue={c?.contactName ?? ""} className="input" /></div>
      <div><label className="label">E-mail do contato</label><input name="contactEmail" type="email" defaultValue={c?.contactEmail ?? ""} className="input" /></div>
      <div><label className="label">Telefone / WhatsApp</label><input name="contactPhone" defaultValue={c?.contactPhone ?? ""} className="input" /></div>
      <div>
        <label className="label">Situação</label>
        <select name="active" defaultValue={c?.active === false ? "off" : "on"} className="input"><option value="on">Ativo</option><option value="off">Inativo</option></select>
      </div>
      <div className="md:col-span-2"><label className="label">Observações</label><textarea name="notes" rows={3} defaultValue={c?.notes ?? ""} className="input" /></div>
      <div><button className="btn-primary">Salvar cliente</button></div>
    </form>
  );
}
