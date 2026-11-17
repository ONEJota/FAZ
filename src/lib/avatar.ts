// Opções do avatar personalizado. Usado no servidor e no navegador (sem dependências).

// Estilos do DiceBear com licença livre para uso comercial (CC0 ou "free for commercial use")
export const AVATAR_STYLES = [
  { key: "notionists", label: "Traço" },
  { key: "lorelei", label: "Delicado" },
  { key: "openPeeps", label: "Rabisco" },
  { key: "avataaars", label: "Cartoon" },
  { key: "thumbs", label: "Divertido" },
  { key: "bottts", label: "Robô" },
] as const;
export type AvatarStyle = (typeof AVATAR_STYLES)[number]["key"];

// Fundos (sem o "#", como o DiceBear espera)
export const AVATAR_BGS = ["fde7ef", "f10a64", "08090d", "ffd6a5", "fdffb6", "caffbf", "9bf6ff", "a0c4ff", "bdb2ff", "ffc6ff", "e9e4dc", "ffffff"];

// Cores do anel em volta do avatar
export const RING_COLORS = ["#f10a64", "#08090d", "#7c3aed", "#2563eb", "#0891b2", "#16a34a", "#ca8a04", "#ea580c", "#dc2626", "#db2777", "#64748b", "#ffffff"];

// Emoji de status (aparece no cantinho do avatar)
export const STATUS_EMOJIS = ["☕", "🎧", "🔥", "🚀", "🎨", "✍️", "📸", "🎬", "💡", "🧠", "🌴", "🤒", "🏖️", "🎉", "😴", "💪"];

export type AvatarUser = {
  name: string;
  color: string;
  avatarStyle?: string | null;
  avatarSeed?: string | null;
  avatarBg?: string | null;
  statusEmoji?: string | null;
};

export const isAvatarStyle = (s: unknown): s is AvatarStyle => AVATAR_STYLES.some((x) => x.key === s);

/** Endereço da imagem do avatar (gerada em /avatar.svg, sem dados pessoais na URL). */
export function avatarUrl(style: string, seed: string, bg?: string | null) {
  const p = new URLSearchParams({ s: style, seed });
  if (bg) p.set("bg", bg);
  return `/avatar.svg?${p.toString()}`;
}

export function randomSeed() {
  return Math.random().toString(36).slice(2, 10);
}
