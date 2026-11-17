import { createAvatar } from "@dicebear/core";
import { notionists, lorelei, openPeeps, avataaars, thumbs, bottts } from "@dicebear/collection";
import { AVATAR_BGS, isAvatarStyle } from "@/lib/avatar";

const STYLES = { notionists, lorelei, openPeeps, avataaars, thumbs, bottts };

// /avatar/<estilo>/<fundo|x>/<semente>.svg — gera o SVG só a partir do caminho, sem ler o banco.
export async function GET(_req: Request, { params }: { params: Promise<{ style: string; bg: string; seed: string }> }) {
  const { style, bg, seed: raw } = await params;
  if (!isAvatarStyle(style)) return new Response("Estilo inválido", { status: 400 });
  const seed = decodeURIComponent(raw).replace(/\.svg$/, "").slice(0, 64) || "mona";
  const svg = createAvatar(STYLES[style] as typeof notionists, {
    seed,
    size: 128,
    ...(AVATAR_BGS.includes(bg) ? { backgroundColor: [bg] } : {}),
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
