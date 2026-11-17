import { avatarResponse } from "@/lib/avatarSvg";

// /avatar/<estilo>/<fundo|x>/<semente>.svg — avatar sem peças escolhidas
export async function GET(_req: Request, { params }: { params: Promise<{ style: string; bg: string; seed: string }> }) {
  const { style, bg, seed } = await params;
  return avatarResponse(style, bg, seed);
}
