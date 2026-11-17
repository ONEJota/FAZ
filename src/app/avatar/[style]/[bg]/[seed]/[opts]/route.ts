import { avatarResponse } from "@/lib/avatarSvg";

// /avatar/<estilo>/<fundo|x>/<semente>/<peças>.svg — com cabelo, roupa, acessórios e cores escolhidos
export async function GET(_req: Request, { params }: { params: Promise<{ style: string; bg: string; seed: string; opts: string }> }) {
  const { style, bg, seed, opts } = await params;
  return avatarResponse(style, bg, seed, opts);
}
