"use server";
import bcrypt from "bcryptjs";
import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import { db } from "@/lib/db";
import { requireUser } from "@/lib/auth";
import { signSession, SESSION_COOKIE } from "@/lib/session";

export async function login(_: unknown, form: FormData) {
  const email = String(form.get("email") || "").trim().toLowerCase();
  const password = String(form.get("password") || "");
  const user = await db.user.findUnique({ where: { email } });
  if (!user || !user.active || !(await bcrypt.compare(password, user.password))) {
    return { error: "E-mail ou senha inválidos." };
  }
  const token = await signSession({ uid: user.id, role: user.role, name: user.name });
  const jar = await cookies();
  jar.set(SESSION_COOKIE, token, { httpOnly: true, sameSite: "lax", path: "/", maxAge: 60 * 60 * 12, secure: process.env.NODE_ENV === "production" });
  // Pede a animação de abertura na primeira tela depois do login (o próprio componente apaga)
  jar.set("faz_intro", "1", { sameSite: "lax", path: "/", maxAge: 60 * 10, secure: process.env.NODE_ENV === "production" });
  redirect("/");
}

export async function logout() {
  (await cookies()).delete(SESSION_COOKIE);
  redirect("/login");
}

export async function changePassword(_: unknown, form: FormData) {
  const user = await requireUser();
  const current = String(form.get("current") || "");
  const next = String(form.get("next") || "");
  if (next.length < 8) return { error: "A nova senha precisa ter pelo menos 8 caracteres." };
  if (!(await bcrypt.compare(current, user.password))) return { error: "Senha atual incorreta." };
  await db.user.update({ where: { id: user.id }, data: { password: await bcrypt.hash(next, 10) } });
  return { ok: "Senha alterada." };
}
