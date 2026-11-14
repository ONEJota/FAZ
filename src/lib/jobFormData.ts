import { db } from "./db";

export async function jobFormOptions() {
  const [clients, campaigns, fees, services, statuses, users] = await Promise.all([
    db.client.findMany({ where: { active: true }, orderBy: { name: "asc" }, select: { id: true, name: true } }),
    db.campaign.findMany({ where: { active: true }, orderBy: { createdAt: "desc" }, select: { id: true, name: true, clientId: true, feeId: true } }),
    db.fee.findMany({ where: { active: true }, select: { id: true, name: true, clientId: true } }),
    db.service.findMany({ where: { active: true }, orderBy: { name: "asc" }, select: { id: true, name: true, defaultMinutes: true, category: true } }),
    db.status.findMany({ orderBy: { order: "asc" }, select: { id: true, name: true } }),
    db.user.findMany({ where: { active: true }, orderBy: { name: "asc" }, select: { id: true, name: true } }),
  ]);
  return { clients, campaigns, fees, services, statuses, users };
}
