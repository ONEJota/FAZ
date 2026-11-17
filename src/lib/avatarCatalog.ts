// Catálogo das peças de cada estilo, lido do schema do DiceBear (só no servidor).
import { notionists, lorelei, openPeeps, avataaars, thumbs, bottts } from "@dicebear/collection";
import { AVATAR_STYLES, type AvatarStyle } from "./avatar";

export const DICEBEAR = { notionists, lorelei, openPeeps, avataaars, thumbs, bottts };

export type AvatarPart = {
  key: string;
  label: string;
  kind: "enum" | "color";
  values: string[];
  optional: boolean; // tem a opção "Nenhum"
};
export type AvatarCatalog = Record<AvatarStyle, AvatarPart[]>;

const LABELS: Record<string, string> = {
  hair: "Cabelo", top: "Cabelo e chapéu", head: "Cabeça e cabelo", hairColor: "Cor do cabelo", hatColor: "Cor do chapéu",
  clothing: "Roupa", body: "Roupa", clothesColor: "Cor da roupa", clothingColor: "Cor da roupa", clothingGraphic: "Estampa",
  accessories: "Acessórios", accessoriesColor: "Cor do acessório", glasses: "Óculos", glassesColor: "Cor dos óculos",
  facialHair: "Barba", beard: "Barba", facialHairColor: "Cor da barba", skinColor: "Pele",
  eyes: "Olhos", eyesColor: "Cor dos olhos", eyebrows: "Sobrancelhas", eyebrowsColor: "Cor das sobrancelhas", brows: "Sobrancelhas",
  mouth: "Boca", mouthColor: "Cor da boca", lips: "Boca", face: "Rosto", nose: "Nariz", noseColor: "Cor do nariz",
  earrings: "Brincos", earringsColor: "Cor dos brincos", hairAccessories: "Enfeite de cabelo", hairAccessoriesColor: "Cor do enfeite",
  freckles: "Sardas", frecklesColor: "Cor das sardas", gesture: "Gesto", bodyIcon: "Ícone na roupa", headContrastColor: "Cor do cabelo",
  mask: "Máscara", shapeColor: "Cor", baseColor: "Cor", sides: "Laterais", texture: "Textura",
};

// Ordem em que as abas aparecem
const ORDER = ["hair", "top", "head", "hairColor", "headContrastColor", "hatColor", "clothing", "body", "clothesColor", "clothingColor", "clothingGraphic", "bodyIcon",
  "glasses", "glassesColor", "accessories", "accessoriesColor", "earrings", "earringsColor", "hairAccessories", "hairAccessoriesColor", "facialHair", "beard", "facialHairColor",
  "skinColor", "eyes", "eyesColor", "eyebrows", "brows", "eyebrowsColor", "mouth", "lips", "mouthColor", "face", "nose", "noseColor", "freckles", "frecklesColor", "gesture", "mask",
  "shapeColor", "baseColor", "sides", "texture"];

const SKIN = ["ffdbb4", "f2d3b1", "edb98a", "ecad80", "d08b5b", "ae5d29", "8d5524", "614335"];
const HAIR = ["2c1b18", "4a312c", "724133", "a55728", "b58143", "d6b370", "ecdcbf", "e8e1e1", "c93305", "f10a64", "6a4c93", "2563eb"];
const COLORS = ["08090d", "ffffff", "f10a64", "fde7ef", "ef4444", "f97316", "facc15", "22c55e", "14b8a6", "3b82f6", "6366f1", "a855f7", "65c9ff", "929598"];

// Ajustes de nome por estilo
const STYLE_LABELS: Partial<Record<AvatarStyle, Record<string, string>>> = {
  lorelei: { head: "Formato do rosto" },
  bottts: { top: "Antena", face: "Cabeça" },
  thumbs: { face: "Rosto" },
};

const SKIP = new Set(["noseColor", "frecklesColor", "seed", "flip", "rotate", "scale", "radius", "size", "backgroundColor", "backgroundType", "backgroundRotation", "translateX", "translateY", "clip", "randomizeIds", "base", "style"]);

function paletteFor(key: string, defaults: string[]) {
  const base = key === "skinColor" ? SKIN : /hair|beard|facialHair|eyebrows|brows|headContrast/i.test(key) ? HAIR : COLORS;
  return [...new Set([...base, ...defaults.map((d) => d.toLowerCase())])].slice(0, 18);
}

function build(style: AvatarStyle): AvatarPart[] {
  const props = DICEBEAR[style].schema.properties as Record<string, { items?: { enum?: string[]; pattern?: string }; default?: string[] }>;
  const parts: AvatarPart[] = [];
  for (const [key, def] of Object.entries(props)) {
    if (SKIP.has(key) || key.endsWith("Probability") || /Offset|Rotation/.test(key)) continue;
    const optional = `${key}Probability` in props;
    if (def.items?.enum) {
      // Uma opção só: vira liga/desliga se for opcional, senão não há o que escolher
      if (def.items.enum.length < 2 && !optional) continue;
      parts.push({ key, label: STYLE_LABELS[style]?.[key] ?? LABELS[key] ?? key, kind: "enum", values: def.items.enum, optional });
    } else if (def.items?.pattern) {
      parts.push({ key, label: STYLE_LABELS[style]?.[key] ?? LABELS[key] ?? key, kind: "color", values: paletteFor(key, def.default ?? []), optional: false });
    }
  }
  const rank = (k: string) => (ORDER.indexOf(k) === -1 ? 999 : ORDER.indexOf(k));
  return parts.sort((a, b) => rank(a.key) - rank(b.key));
}

export const AVATAR_CATALOG: AvatarCatalog = Object.fromEntries(AVATAR_STYLES.map((s) => [s.key, build(s.key)])) as AvatarCatalog;

/** Mantém só peças e valores que existem no estilo (e "none" para as opcionais). */
export function sanitizeOptions(style: AvatarStyle, opts: Record<string, string>): Record<string, string> {
  const out: Record<string, string> = {};
  for (const part of AVATAR_CATALOG[style]) {
    const v = opts[part.key];
    if (!v) continue;
    if (part.optional && v === "none") out[part.key] = v;
    else if (part.kind === "enum" ? part.values.includes(v) : /^[0-9a-f]{6}$/.test(v)) out[part.key] = v;
  }
  return out;
}

/** Converte as escolhas para as opções do DiceBear. */
export function toDicebearOptions(style: AvatarStyle, opts: Record<string, string>) {
  const o: Record<string, unknown> = {};
  for (const part of AVATAR_CATALOG[style]) {
    const v = opts[part.key];
    if (!v) continue;
    if (v === "none") o[`${part.key}Probability`] = 0;
    else {
      o[part.key] = [v];
      if (part.optional) o[`${part.key}Probability`] = 100;
    }
  }
  return o;
}
