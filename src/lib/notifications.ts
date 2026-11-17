import "server-only";
import { db } from "./db";
import { ensureDeadlineNotifications } from "./notify";

export type NotificationItem = { id: number; type: string; title: string; body: string; link: string; read: boolean; createdAt: string };
export type NotificationFeed = { unread: number; maxId: number; items: NotificationItem[] };

/** O que o sininho mostra: as 20 mais recentes e quantas ainda não foram lidas. */
export async function notificationFeed(userId: number): Promise<NotificationFeed> {
  await ensureDeadlineNotifications(userId);
  const [items, unread] = await Promise.all([
    db.notification.findMany({ where: { userId }, orderBy: { id: "desc" }, take: 20 }),
    db.notification.count({ where: { userId, readAt: null } }),
  ]);
  return {
    unread,
    maxId: items[0]?.id ?? 0,
    items: items.map((n) => ({ id: n.id, type: n.type, title: n.title, body: n.body, link: n.link, read: !!n.readAt, createdAt: n.createdAt.toISOString() })),
  };
}
