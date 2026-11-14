"use server";
import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { db } from "@/lib/db";
import { isManager, requireUser } from "@/lib/auth";

function refresh() {
  revalidatePath("/", "layout");
}

/** Inicia o cronômetro. Para qualquer outro que esteja rodando para o usuário. */
export async function startTimer(form: FormData) {
  const user = await requireUser();
  const jobId = Number(form.get("jobId")) || null;
  let clientId = Number(form.get("clientId")) || 0;
  if (jobId) clientId = (await db.job.findUniqueOrThrow({ where: { id: jobId } })).clientId;
  if (!clientId) return;
  await stopRunning(user.id);
  await db.timeEntry.create({
    data: {
      userId: user.id,
      jobId,
      clientId,
      description: String(form.get("description") || "").trim(),
      startedAt: new Date(),
      hourlyCost: user.hourlyCost,
    },
  });
  refresh();
}

async function stopRunning(userId: number) {
  const running = await db.timeEntry.findMany({ where: { userId, endedAt: null } });
  for (const r of running) {
    const end = new Date();
    await db.timeEntry.update({
      where: { id: r.id },
      data: { endedAt: end, minutes: Math.max(1, Math.round((end.getTime() - r.startedAt.getTime()) / 60000)) },
    });
  }
}

export async function stopTimer() {
  const user = await requireUser();
  await stopRunning(user.id);
  refresh();
}

export async function addTimeEntry(form: FormData) {
  const user = await requireUser();
  const jobId = Number(form.get("jobId")) || null;
  let clientId = Number(form.get("clientId")) || 0;
  if (jobId) clientId = (await db.job.findUniqueOrThrow({ where: { id: jobId } })).clientId;
  const start = new Date(String(form.get("startedAt")));
  const end = new Date(String(form.get("endedAt")));
  const back = String(form.get("back") || "/horas");
  const bad = (m: string) => redirect(`${back}${back.includes("?") ? "&" : "?"}erro=${encodeURIComponent(m)}`);
  if (!clientId) bad("Escolha o job ou o cliente.");
  if (isNaN(+start) || isNaN(+end) || end <= start) bad("Início e fim inválidos.");
  const minutes = Math.round((end.getTime() - start.getTime()) / 60000);
  if (minutes > 12 * 60) bad("Lançamento acima de 12 horas. Confira as datas.");
  await db.timeEntry.create({
    data: { userId: user.id, jobId, clientId, description: String(form.get("description") || "").trim(), startedAt: start, endedAt: end, minutes, hourlyCost: user.hourlyCost },
  });
  refresh();
  redirect(back);
}

export async function deleteTimeEntry(form: FormData) {
  const user = await requireUser();
  const id = Number(form.get("id"));
  const e = await db.timeEntry.findUniqueOrThrow({ where: { id } });
  if (e.userId !== user.id && !isManager(user)) return;
  await db.timeEntry.delete({ where: { id } });
  refresh();
}
