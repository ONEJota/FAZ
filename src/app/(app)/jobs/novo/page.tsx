import { requireUser } from "@/lib/auth";
import { jobFormOptions } from "@/lib/jobFormData";
import { toInputDateTime } from "@/lib/format";
import { JobForm } from "@/components/JobForm";
import { ErrorBanner, PageHeader } from "@/components/ui";

export default async function NovoJob({ searchParams }: { searchParams: Promise<{ erro?: string }> }) {
  const sp = await searchParams;
  const user = await requireUser();
  const opts = await jobFormOptions();
  const due = new Date();
  due.setDate(due.getDate() + 2);
  due.setHours(18, 0, 0, 0);
  return (
    <div className="mx-auto max-w-5xl">
      <PageHeader title="Novo job" subtitle="Campos com * são obrigatórios" />
      <ErrorBanner msg={sp.erro} />
      <JobForm {...opts} defaultDue={toInputDateTime(due)} currentUserId={user.id} />
    </div>
  );
}
