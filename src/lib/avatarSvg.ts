import "server-only";
import { createAvatar } from "@dicebear/core";
import { AVATAR_BGS, decodeOptions, isAvatarStyle } from "./avatar";
import { DICEBEAR, sanitizeOptions, toDicebearOptions } from "./avatarCatalog";

/** Resposta SVG do avatar a partir dos pedaços do caminho (sem ler o banco). */
export function avatarResponse(style: string, bg: string, rawSeed: string, rawOpts?: string) {
  if (!isAvatarStyle(style)) return new Response("Estilo inválido", { status: 400 });
  const seed = decodeURIComponent(rawSeed).replace(/\.svg$/, "").slice(0, 64) || "mona";
  const opts = sanitizeOptions(style, decodeOptions(rawOpts?.replace(/\.svg$/, "")));
  const svg = createAvatar(DICEBEAR[style] as typeof DICEBEAR.notionists, {
    seed,
    size: 128,
    ...(AVATAR_BGS.includes(bg) ? { backgroundColor: [bg] } : {}),
    ...toDicebearOptions(style, opts),
  }).toString();
  return new Response(svg, {
    headers: {
      "Content-Type": "image/svg+xml",
      "Cache-Control": "public, max-age=31536000, immutable",
      "X-Content-Type-Options": "nosniff",
      "Content-Security-Policy": "default-src 'none'; style-src 'unsafe-inline'",
    },
  });
}
