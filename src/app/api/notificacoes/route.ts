import { db } from "@/lib/db";
import { currentUser } from "@/lib/auth";
import { notificationFeed } from "@/lib/notifications";

export const dynamic = "force-dynamic";

// Sininho: o navegador consulta a cada ~25 s
export async function GET() {
  const user = await currentUser();
  if (!user) return Response.json({ error: "não autorizado" }, { status: 401 });
  return Response.json(await notificationFeed(user.id), { headers: { "Cache-Control": "no-store" } });
}

// Marcar como lidas: { all: true } ou { ids: [1, 2] }
export async function POST(req: Request) {
  const user = await currentUser();
  if (!user) return Response.json({ error: "não autorizado" }, { status: 401 });
  if (!req.headers.get("content-type")?.includes("application/json")) return Response.json({ error: "formato inválido" }, { status: 415 });
  const body = (await req.json().catch(() => ({}))) as { all?: boolean; ids?: unknown };
  const ids = Array.isArray(body.ids) ? body.ids.map(Number).filter(Number.isInteger).slice(0, 100) : [];
  if (!body.all && !ids.length) return Response.json({ ok: true });
  await db.notification.updateMany({
    where: { userId: user.id, readAt: null, ...(body.all ? {} : { id: { in: ids } }) },
    data: { readAt: new Date() },
  });
  return Response.json(await notificationFeed(user.id), { headers: { "Cache-Control": "no-store" } });
}
