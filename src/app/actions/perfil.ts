"use server";
import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { db } from "@/lib/db";
import { requireUser } from "@/lib/auth";
import { AVATAR_BGS, RING_COLORS, STATUS_EMOJIS, isAvatarStyle } from "@/lib/avatar";

/** Salva o avatar montado pela própria pessoa (perfil ou boas-vindas). */
export async function saveAvatar(form: FormData) {
  const user = await requireUser();
  const style = String(form.get("style") || "");
  const seed = String(form.get("seed") || "").trim().slice(0, 64);
  const bg = String(form.get("bg") || "");
  const ring = String(form.get("ring") || "");
  const emoji = String(form.get("emoji") || "");
  const next = form.get("next") === "inicio" ? "/" : "/perfil?ok=avatar";
  if (!isAvatarStyle(style) || !seed) redirect(`/perfil?erro=${encodeURIComponent("Escolha um personagem.")}`);
  await db.user.update({
    where: { id: user.id },
    data: {
      avatarStyle: style,
      avatarSeed: seed,
      avatarBg: AVATAR_BGS.includes(bg) ? bg : null,
      color: RING_COLORS.includes(ring) ? ring : user.color,
      statusEmoji: STATUS_EMOJIS.includes(emoji) ? emoji : null,
      onboardedAt: user.onboardedAt ?? new Date(),
    },
  });
  revalidatePath("/", "layout");
  redirect(next);
}

/** "Fazer depois" na tela de boas-vindas: não mostra de novo, o avatar fica nas iniciais. */
export async function skipOnboarding() {
  const user = await requireUser();
  await db.user.update({ where: { id: user.id }, data: { onboardedAt: new Date() } });
  redirect("/");
}
