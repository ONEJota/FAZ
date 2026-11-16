"use server";
import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { db } from "@/lib/db";
import { canSeeTask, isManager, requireJobAccess, requireManager, requireUser } from "@/lib/auth";
import { REVISION_REASONS } from "@/lib/format";

const s = (f: FormData, k: string) => String(f.get(k) ?? "").trim();
const dt = (v: string) => (v ? new Date(v) : null);

async function log(jobId: number, userId: number, action: string) {
  await db.activity.create({ data: { jobId, userId, action } });
}

function fail(path: string, msg: string): never {
  redirect(`${path}${path.includes("?") ? "&" : "?"}erro=${encodeURIComponent(msg)}`);
}

export async function saveJob(form: FormData) {
  const id = Number(form.get("id") || 0);
  const user = id ? await requireJobAccess(id) : await requireUser();
  const back = id ? `/jobs/${id}/editar` : "/jobs/novo";
  const title = s(form, "title");
  const clientId = Number(form.get("clientId"));
  const serviceId = Number(form.get("serviceId"));
  const statusId = Number(form.get("statusId"));
  const due = dt(s(form, "dueDate"));
  const responsibles = form.getAll("responsibles").map(Number).filter(Boolean);
  // Campos obrigatórios (lição da auditoria: peça e prazo nunca vazios)
  if (!title || !clientId || !serviceId || !statusId || !due) fail(back, "Preencha título, cliente, peça, situação e prazo.");
  if (responsibles.length === 0) fail(back, "Escolha pelo menos um responsável.");
  if (responsibles.length > 5) fail(back, "No máximo 5 responsáveis.");

  const service = await db.service.findUnique({ where: { id: serviceId } });
  const est = s(form, "estimatedHours");
  const estimatedMinutes = est ? Math.round(Number(est.replace(",", ".")) * 60) : service?.defaultMinutes ?? 0;
  const status = await db.status.findUnique({ where: { id: statusId } });
  const campaignId = Number(form.get("campaignId")) || null;
  let feeId = Number(form.get("feeId")) || null;
  if (campaignId && !feeId) feeId = (await db.campaign.findUnique({ where: { id: campaignId } }))?.feeId ?? null;

  const data = {
    title,
    clientId,
    serviceId,
    statusId,
    campaignId,
    feeId,
    dueDate: due!,
    startDate: dt(s(form, "startDate")),
    priority: form.get("priority") === "on",
    estimatedMinutes,
    rating: Number(form.get("rating") || 0),
    briefing: s(form, "briefing"),
    links: s(form, "links"),
  };

  let jobId = id;
  if (id) {
    const before = await db.job.findUniqueOrThrow({ where: { id } });
    await db.job.update({
      where: { id },
      data: {
        ...data,
        completedAt: status?.isDone ? before.completedAt ?? new Date() : null,
        responsibles: { deleteMany: {}, create: responsibles.map((userId) => ({ userId })) },
      },
    });
    await log(id, user.id, "editou o job");
  } else {
    const last = await db.job.aggregate({ _max: { number: true } });
    const job = await db.job.create({
      data: {
        ...data,
        number: (last._max.number ?? 1000) + 1,
        requesterId: user.id,
        completedAt: status?.isDone ? new Date() : null,
        responsibles: { create: responsibles.map((userId) => ({ userId })) },
      },
    });
    jobId = job.id;
    await log(jobId, user.id, "abriu o job");
  }
  revalidatePath("/pauta");
  redirect(`/jobs/${jobId}`);
}

/** Usado pelo Kanban (arrastar) e pelo seletor de situação */
export async function setJobStatus(jobId: number, statusId: number) {
  const user = await requireJobAccess(jobId);
  const status = await db.status.findUniqueOrThrow({ where: { id: statusId } });
  await db.job.update({ where: { id: jobId }, data: { statusId, completedAt: status.isDone ? new Date() : null } });
  await log(jobId, user.id, `mudou a situação para “${status.name}”`);
  revalidatePath("/pauta");
  revalidatePath(`/jobs/${jobId}`);
}

export async function setJobStatusForm(form: FormData) {
  await setJobStatus(Number(form.get("jobId")), Number(form.get("statusId")));
}

export async function addRevision(form: FormData) {
  const jobId = Number(form.get("jobId"));
  const user = await requireJobAccess(jobId);
  const reason = s(form, "reason");
  const details = s(form, "details");
  if (!REVISION_REASONS[reason]) fail(`/jobs/${jobId}?aba=alteracoes`, "Escolha o motivo da alteração.");
  if (!details) fail(`/jobs/${jobId}?aba=alteracoes`, "Descreva o que precisa ser alterado.");
  const count = await db.revision.count({ where: { jobId } });
  const letter = String.fromCharCode(65 + count); // A, B, C...
  await db.revision.create({ data: { jobId, reason, details, letter, createdById: user.id } });
  // Volta o job para "Ajustes" se existir essa situação
  const ajustes = await db.status.findFirst({ where: { name: "Ajustes" } });
  if (ajustes) await db.job.update({ where: { id: jobId }, data: { statusId: ajustes.id, completedAt: null } });
  await log(jobId, user.id, `registrou a alteração ${letter} (${REVISION_REASONS[reason]})`);
  revalidatePath(`/jobs/${jobId}`);
  redirect(`/jobs/${jobId}?aba=alteracoes`);
}

export async function addTask(form: FormData) {
  const jobId = Number(form.get("jobId"));
  const user = await requireJobAccess(jobId);
  const title = s(form, "title");
  if (!title) return;
  await db.task.create({
    data: { jobId, title, assigneeId: Number(form.get("assigneeId")) || null, dueDate: dt(s(form, "dueDate")) },
  });
  await log(jobId, user.id, `criou a tarefa “${title}”`);
  revalidatePath(`/jobs/${jobId}`);
}

export async function toggleTask(form: FormData) {
  const id = Number(form.get("taskId"));
  const t = await db.task.findUniqueOrThrow({ where: { id }, include: { job: { include: { responsibles: true } } } });
  const user = await requireJobAccess(t.jobId);
  if (!canSeeTask(user, t, t.job.responsibles.map((r) => r.userId))) return;
  await db.task.update({ where: { id }, data: { done: !t.done, doneAt: t.done ? null : new Date() } });
  await log(t.jobId, user.id, `${t.done ? "reabriu" : "concluiu"} a tarefa “${t.title}”`);
  revalidatePath(`/jobs/${t.jobId}`);
  revalidatePath("/pauta");
}

export async function addComment(form: FormData) {
  const jobId = Number(form.get("jobId"));
  const user = await requireJobAccess(jobId);
  const body = s(form, "body");
  if (!body) return;
  await db.comment.create({ data: { jobId, body, userId: user.id } });
  revalidatePath(`/jobs/${jobId}`);
  revalidatePath("/");
}

/** Lixeira: só Admin e Coordenação (correção de permissão vista na auditoria) */
export async function trashJob(form: FormData) {
  const user = await requireManager();
  const jobId = Number(form.get("jobId"));
  await db.job.update({ where: { id: jobId }, data: { deletedAt: new Date() } });
  await log(jobId, user.id, "moveu o job para a lixeira");
  revalidatePath("/pauta");
  redirect("/pauta");
}

export async function restoreJob(form: FormData) {
  const user = await requireManager();
  const jobId = Number(form.get("jobId"));
  await db.job.update({ where: { id: jobId }, data: { deletedAt: null } });
  await log(jobId, user.id, "restaurou o job da lixeira");
  revalidatePath("/pauta");
  redirect(`/jobs/${jobId}`);
}

export async function duplicateJob(form: FormData) {
  const user = await requireJobAccess(Number(form.get("jobId")));
  const src = await db.job.findUniqueOrThrow({ where: { id: Number(form.get("jobId")) }, include: { responsibles: true } });
  const first = await db.status.findFirst({ orderBy: { order: "asc" } });
  const last = await db.job.aggregate({ _max: { number: true } });
  const job = await db.job.create({
    data: {
      number: (last._max.number ?? 1000) + 1,
      title: `${src.title} (cópia)`,
      clientId: src.clientId,
      campaignId: src.campaignId,
      feeId: src.feeId,
      serviceId: src.serviceId,
      statusId: first!.id,
      requesterId: user.id,
      briefing: src.briefing,
      links: src.links,
      dueDate: src.dueDate,
      estimatedMinutes: src.estimatedMinutes,
      responsibles: { create: src.responsibles.map((r) => ({ userId: r.userId })) },
    },
  });
  await log(job.id, user.id, `duplicou a partir do job ${src.number}`);
  redirect(`/jobs/${job.id}/editar`);
}

// ---------- Imagens do job (PIT) ----------
const MAX_IMAGE_BYTES = 4 * 1024 * 1024; // limite das funções da Netlify (~6 MB por envio)
const IMAGE_TYPES = ["image/jpeg", "image/png", "image/webp", "image/gif"];

export async function uploadJobImages(form: FormData) {
  const jobId = Number(form.get("jobId"));
  const user = await requireJobAccess(jobId);
  const back = `/jobs/${jobId}?aba=imagens`;
  const files = form.getAll("images").filter((f): f is File => f instanceof File && f.size > 0);
  if (files.length === 0) fail(back, "Escolha pelo menos uma imagem.");
  for (const f of files) {
    if (!IMAGE_TYPES.includes(f.type)) fail(back, `“${f.name}” não é uma imagem JPG, PNG, WEBP ou GIF.`);
  }
  if (files.reduce((a, f) => a + f.size, 0) > MAX_IMAGE_BYTES) fail(back, "As imagens passam de 4 MB. Envie menos de cada vez ou reduza o tamanho.");
  for (const f of files) {
    await db.jobImage.create({
      data: { jobId, name: f.name.slice(0, 200), mimeType: f.type, size: f.size, data: Buffer.from(await f.arrayBuffer()), uploadedById: user.id },
    });
  }
  await log(jobId, user.id, files.length === 1 ? `anexou a imagem “${files[0].name}”` : `anexou ${files.length} imagens`);
  revalidatePath(`/jobs/${jobId}`);
  redirect(back);
}

export async function deleteJobImage(form: FormData) {
  const id = Number(form.get("imageId"));
  const img = await db.jobImage.findUniqueOrThrow({ where: { id }, select: { jobId: true, name: true, uploadedById: true } });
  const user = await requireJobAccess(img.jobId);
  if (img.uploadedById !== user.id && !isManager(user)) fail(`/jobs/${img.jobId}?aba=imagens`, "Só quem enviou a imagem ou a coordenação pode excluí-la.");
  await db.jobImage.delete({ where: { id } });
  await log(img.jobId, user.id, `excluiu a imagem “${img.name}”`);
  revalidatePath(`/jobs/${img.jobId}`);
  redirect(`/jobs/${img.jobId}?aba=imagens`);
}

export async function canManage() {
  const u = await requireUser();
  return isManager(u);
}
