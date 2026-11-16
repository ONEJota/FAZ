import { db } from "@/lib/db";
import { canAccessJob, currentUser } from "@/lib/auth";

// Serve a imagem do job só para quem pode ver o job.
export async function GET(_req: Request, { params }: { params: Promise<{ id: string; imageId: string }> }) {
  const { id, imageId } = await params;
  const user = await currentUser();
  if (!user) return new Response("Não autorizado", { status: 401 });
  const jobId = Number(id);
  if (!(await canAccessJob(user, jobId))) return new Response("Sem acesso", { status: 403 });
  const img = await db.jobImage.findFirst({ where: { id: Number(imageId), jobId } });
  if (!img) return new Response("Não encontrada", { status: 404 });
  return new Response(new Uint8Array(img.data), {
    headers: {
      "Content-Type": img.mimeType,
      "Content-Length": String(img.size),
      "Content-Disposition": `inline; filename*=UTF-8''${encodeURIComponent(img.name)}`,
      "Cache-Control": "private, max-age=86400",
      "X-Content-Type-Options": "nosniff",
    },
  });
}
