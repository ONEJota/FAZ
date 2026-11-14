"use server";
import bcrypt from "bcryptjs";
import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { db } from "@/lib/db";
import { requireAdmin, requireManager } from "@/lib/auth";

const s = (f: FormData, k: string) => String(f.get(k) ?? "").trim();
const opt = (f: FormData, k: string) => s(f, k) || null;
const num = (f: FormData, k: string) => {
  const v = s(f, k).replace(/\./g, "").replace(",", ".");
  return v ? Number(v) : 0;
};
const date = (f: FormData, k: string) => (s(f, k) ? new Date(s(f, k) + "T00:00:00") : null);

// ---------- Clientes ----------
export async function saveClient(form: FormData) {
  await requireManager();
  const id = Number(form.get("id") || 0);
  const name = s(form, "name").toUpperCase().replace(/\s+/g, " ");
  if (!name) return;
  const data = {
    name,
    legalName: opt(form, "legalName"),
    document: opt(form, "document"),
    segment: opt(form, "segment"),
    contactName: opt(form, "contactName"),
    contactEmail: opt(form, "contactEmail"),
    contactPhone: opt(form, "contactPhone"),
    notes: opt(form, "notes"),
    active: form.get("active") !== "off",
  };
  const dup = await db.client.findFirst({ where: { name, NOT: id ? { id } : undefined } });
  if (dup) redirect(`/clientes?erro=${encodeURIComponent("Já existe um cliente com esse nome.")}`);
  const c = id ? await db.client.update({ where: { id }, data }) : await db.client.create({ data });
  revalidatePath("/clientes");
  redirect(`/clientes/${c.id}`);
}

// ---------- Fees ----------
export async function saveFee(form: FormData) {
  await requireManager();
  const id = Number(form.get("id") || 0);
  const clientId = Number(form.get("clientId"));
  const data = {
    clientId,
    name: s(form, "name") || "Fee mensal",
    monthlyValue: num(form, "monthlyValue"),
    hoursPerMonth: num(form, "hoursPerMonth"),
    startDate: date(form, "startDate") ?? new Date(),
    endDate: date(form, "endDate"),
    notes: opt(form, "notes"),
    active: form.get("active") !== "off",
  };
  if (id) await db.fee.update({ where: { id }, data });
  else await db.fee.create({ data });
  revalidatePath(`/clientes/${clientId}`);
  redirect(`/clientes/${clientId}?aba=fees`);
}

// ---------- Campanhas ----------
export async function saveCampaign(form: FormData) {
  await requireManager();
  const id = Number(form.get("id") || 0);
  const clientId = Number(form.get("clientId"));
  const data = {
    clientId,
    feeId: Number(form.get("feeId")) || null,
    name: s(form, "name"),
    startDate: date(form, "startDate"),
    endDate: date(form, "endDate"),
    budget: num(form, "budget"),
    briefing: opt(form, "briefing"),
    active: form.get("active") !== "off",
  };
  if (!data.name) return;
  if (id) await db.campaign.update({ where: { id }, data });
  else await db.campaign.create({ data });
  revalidatePath("/campanhas");
  redirect(form.get("back") === "campanhas" ? "/campanhas" : `/clientes/${clientId}?aba=campanhas`);
}

// ---------- Serviços (peças) ----------
export async function saveService(form: FormData) {
  await requireManager();
  const id = Number(form.get("id") || 0);
  const name = s(form, "name").replace(/\s+/g, " ");
  if (!name) return;
  const dup = await db.service.findMany();
  const norm = (x: string) => x.normalize("NFD").replace(/[̀-ͯ\s]/g, "").toLowerCase();
  if (dup.some((d) => d.id !== id && norm(d.name) === norm(name))) {
    redirect(`/config?aba=servicos&erro=${encodeURIComponent(`Já existe a peça "${name}" (ou muito parecida).`)}`);
  }
  const data = {
    name,
    category: s(form, "category") || "Geral",
    defaultMinutes: Math.round(num(form, "defaultHours") * 60),
    active: form.get("active") !== "off",
  };
  if (id) await db.service.update({ where: { id }, data });
  else await db.service.create({ data });
  revalidatePath("/config");
  redirect("/config?aba=servicos");
}

// ---------- Situações ----------
export async function saveStatus(form: FormData) {
  await requireAdmin();
  const id = Number(form.get("id") || 0);
  const data = {
    name: s(form, "name"),
    order: Number(form.get("order") || 99),
    color: s(form, "color") || "#94a3b8",
    isDone: form.get("isDone") === "on",
    isWaiting: form.get("isWaiting") === "on",
  };
  if (!data.name) return;
  if (id) await db.status.update({ where: { id }, data });
  else await db.status.create({ data });
  revalidatePath("/config");
  redirect("/config?aba=situacoes");
}

// ---------- Usuários ----------
export async function saveUser(form: FormData) {
  await requireAdmin();
  const id = Number(form.get("id") || 0);
  const email = s(form, "email").toLowerCase();
  const data = {
    name: s(form, "name"),
    email,
    role: s(form, "role") || "COLABORADOR",
    hourlyCost: num(form, "hourlyCost"),
    color: s(form, "color") || "#E6007E",
    active: form.get("active") !== "off",
  };
  const pw = s(form, "password");
  if (!data.name || !email) return;
  const dup = await db.user.findFirst({ where: { email, NOT: id ? { id } : undefined } });
  if (dup) redirect(`/config?aba=usuarios&erro=${encodeURIComponent("E-mail já usado por outro usuário.")}`);
  if (id) {
    await db.user.update({ where: { id }, data: { ...data, ...(pw ? { password: await bcrypt.hash(pw, 10) } : {}) } });
  } else {
    if (pw.length < 8) redirect(`/config?aba=usuarios&erro=${encodeURIComponent("Defina uma senha inicial com 8+ caracteres.")}`);
    await db.user.create({ data: { ...data, password: await bcrypt.hash(pw, 10) } });
  }
  revalidatePath("/config");
  redirect("/config?aba=usuarios");
}
