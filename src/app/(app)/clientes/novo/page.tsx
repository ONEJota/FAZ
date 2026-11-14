import { requireManager } from "@/lib/auth";
import { ClientForm } from "@/components/ClientForm";
import { PageHeader } from "@/components/ui";

export default async function NovoCliente() {
  await requireManager();
  return (
    <div className="mx-auto max-w-4xl">
      <PageHeader title="Novo cliente" subtitle="O nome é salvo em maiúsculas para evitar duplicados" />
      <ClientForm />
    </div>
  );
}
