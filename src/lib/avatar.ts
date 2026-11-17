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
  avatarOptions?: string | null; // peças escolhidas, no formato "cabelo.valor~cor.valor"
  statusEmoji?: string | null;
};

export const isAvatarStyle = (s: unknown): s is AvatarStyle => AVATAR_STYLES.some((x) => x.key === s);

/**
 * Endereço da imagem do avatar. Tudo vai no caminho (e não em ?parâmetros) porque o cache
 * da Netlify ignora a query string: com ?s=…&seed=… todos recebiam o mesmo avatar.
 */
export function avatarUrl(style: string, seed: string, bg?: string | null, opts?: string | null) {
  const base = `/avatar/${style}/${bg || "x"}/${encodeURIComponent(seed)}`;
  return opts ? `${base}/${opts}.svg` : `${base}.svg`;
}

/** Peças escolhidas <-> texto curto que vai na URL e no banco ("hair.long01~hairColor.2c1b18"). */
export function encodeOptions(o: Record<string, string>) {
  return Object.entries(o)
    .filter(([, v]) => v)
    .sort(([a], [b]) => a.localeCompare(b))
    .map(([k, v]) => `${k}.${v}`)
    .join("~");
}
export function decodeOptions(s?: string | null): Record<string, string> {
  const o: Record<string, string> = {};
  for (const pair of (s || "").split("~")) {
    const [k, v] = pair.split(".");
    if (k && v && /^[A-Za-z0-9]{1,40}$/.test(k) && /^[A-Za-z0-9]{1,40}$/.test(v)) o[k] = v;
  }
  return o;
}

export function randomSeed() {
  return Math.random().toString(36).slice(2, 10);
}
