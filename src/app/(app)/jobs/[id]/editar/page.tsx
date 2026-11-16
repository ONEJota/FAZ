import { notFound } from "next/navigation";
import { db } from "@/lib/db";
import { requireJobAccess } from "@/lib/auth";
import { jobFormOptions } from "@/lib/jobFormData";
import { toInputDateTime } from "@/lib/format";
import { JobForm } from "@/components/JobForm";
import { ErrorBanner, PageHeader } from "@/components/ui";

export default async function EditarJob({ params, searchParams }: { params: Promise<{ id: string }>; searchParams: Promise<{ erro?: string }> }) {
  const { id } = await params;
  const sp = await searchParams;
  const user = await requireJobAccess(Number(id));
  const job = await db.job.findUnique({ where: { id: Number(id) }, include: { responsibles: true } });
  if (!job) notFound();
  const opts = await jobFormOptions();
  return (
    <div className="mx-auto max-w-5xl">
      <PageHeader title={`Editar job #${job.number}`} subtitle={job.title} />
      <ErrorBanner msg={sp.erro} />
      <JobForm
        {...opts}
        currentUserId={user.id}
        defaultDue=""
        job={{
          id: job.id,
          title: job.title,
          clientId: job.clientId,
          campaignId: job.campaignId,
          feeId: job.feeId,
          serviceId: job.serviceId,
          statusId: job.statusId,
          dueDate: toInputDateTime(job.dueDate),
          startDate: toInputDateTime(job.startDate),
          priority: job.priority,
          estimatedHours: String(job.estimatedMinutes / 60).replace(".", ","),
          rating: job.rating,
          briefing: job.briefing,
          links: job.links,
          responsibles: job.responsibles.map((r) => r.userId),
        }}
      />
    </div>
  );
}
