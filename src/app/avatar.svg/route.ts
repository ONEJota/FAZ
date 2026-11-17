import { createAvatar } from "@dicebear/core";
import { notionists, lorelei, openPeeps, avataaars, thumbs, bottts } from "@dicebear/collection";
import { AVATAR_BGS, isAvatarStyle } from "@/lib/avatar";

const STYLES = { notionists, lorelei, openPeeps, avataaars, thumbs, bottts };

// Gera o SVG do avatar só a partir dos parâmetros (estilo, semente, fundo): não lê o banco.
export function GET(req: Request) {
  const q = new URL(req.url).searchParams;
  const style = q.get("s");
  const seed = (q.get("seed") || "mona").slice(0, 64);
  const bg = q.get("bg");
  if (!isAvatarStyle(style)) return new Response("Estilo inválido", { status: 400 });
  const svg = createAvatar(STYLES[style] as typeof notionists, {
    seed,
    size: 128,
    ...(bg && AVATAR_BGS.includes(bg) ? { backgroundColor: [bg] } : {}),
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
