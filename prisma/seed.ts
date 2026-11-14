import { PrismaClient } from "@prisma/client";
import bcrypt from "bcryptjs";

const prisma = new PrismaClient();

import { STATUSES, SERVICES, CLIENTS, TEAM, COLORS } from "./seed-data";

function slug(s: string) {
  return s.normalize("NFD").replace(/[̀-ͯ]/g, "").toLowerCase().replace(/[^a-z0-9]+/g, ".").replace(/^\.|\.$/g, "");
}

async function main() {
  const pw = process.env.SEED_PASSWORD;
  if (!pw) throw new Error("Defina SEED_PASSWORD no .env");
  const hash = await bcrypt.hash(pw, 10);

  for (const [i, s] of STATUSES.entries()) {
    await prisma.status.upsert({
      where: { name: s.name },
      update: {},
      create: { name: s.name, order: i + 1, color: s.color, isDone: !!s.isDone, isWaiting: !!s.isWaiting },
    });
  }
  for (const [name, category, defaultMinutes] of SERVICES) {
    await prisma.service.upsert({ where: { name }, update: {}, create: { name, category, defaultMinutes } });
  }
  for (const name of CLIENTS) {
    await prisma.client.upsert({ where: { name }, update: {}, create: { name } });
  }
  for (const [i, [name, role]] of TEAM.entries()) {
    const email = `${slug(name)}@mona.local`;
    await prisma.user.upsert({
      where: { email },
      update: {},
      create: { name, email, role, password: hash, color: COLORS[i % COLORS.length] },
    });
  }

  if (process.env.SEED_DEMO === "1") await demo();
  console.log("Seed concluído.");
}

// Dados de demonstração (só para testes: SEED_DEMO=1)
async function demo() {
  const users = await prisma.user.findMany();
  const statuses = await prisma.status.findMany({ orderBy: { order: "asc" } });
  const services = await prisma.service.findMany();
  const clients = await prisma.client.findMany();
  const u = (n: string) => users.find((x) => x.name === n)!;
  const c = (n: string) => clients.find((x) => x.name === n)!;
  for (const x of users) await prisma.user.update({ where: { id: x.id }, data: { hourlyCost: 35 } });

  const peugeot = c("CORDIAL PEUGEOT");
  const fee = await prisma.fee.create({
    data: { clientId: peugeot.id, name: "Fee mensal – Social + Tráfego", monthlyValue: 3500, hoursPerMonth: 40, startDate: new Date("2026-01-01") },
  });
  const camp = await prisma.campaign.create({
    data: { clientId: peugeot.id, feeId: fee.id, name: "Campanha mensal – Novembro/2026", startDate: new Date("2026-11-01"), endDate: new Date("2026-11-30"), budget: 2000 },
  });
  const now = new Date();
  const day = (d: number) => new Date(now.getFullYear(), now.getMonth(), now.getDate() + d, 18, 0);
  const samples = [
    { t: "Vídeos para conjunto de anúncios", cl: peugeot, s: "Reels", st: 3, d: -1, r: ["João", "Fernanda"], camp: true },
    { t: "Black Friday – posts", cl: c("DOLCE AROMA"), s: "Carrossel", st: 5, d: -2, r: ["Luana", "João"] },
    { t: "Campanha de leads – Novembro", cl: c("NUTS TECNOLOGIA"), s: "Tráfego Meta Ads", st: 1, d: 0, r: ["João"] },
    { t: "Integração Meta", cl: c("MANGOLD ASSESSORIA JURÍDICA"), s: "Integração de contas / Pixel", st: 1, d: 2, r: ["Andressa"] },
    { t: "Blindagem de contas", cl: c("AGÊNCIA MONA"), s: "Integração de contas / Pixel", st: 2, d: 2, r: ["Fernanda", "João"] },
    { t: "Promoções Kobacafé", cl: c("KOBACAFÉ"), s: "Post estático", st: 2, d: 4, r: ["Thais", "Ruan"] },
  ];
  let n = 1000;
  for (const x of samples) {
    const svc = services.find((s) => s.name === x.s)!;
    const job = await prisma.job.create({
      data: {
        number: ++n, title: x.t, clientId: x.cl.id, serviceId: svc.id, statusId: statuses[x.st].id,
        dueDate: day(x.d), estimatedMinutes: svc.defaultMinutes, requesterId: u("Ana Laura").id,
        campaignId: x.camp ? camp.id : null, feeId: x.camp ? fee.id : null,
        briefing: "Briefing de demonstração.",
        responsibles: { create: x.r.map((name) => ({ userId: u(name).id })) },
      },
    });
    await prisma.timeEntry.create({
      data: { userId: u(x.r[0]).id, jobId: job.id, clientId: x.cl.id, description: svc.name, startedAt: day(-3), endedAt: day(-3), minutes: 45, hourlyCost: 35 },
    });
  }
}

main().finally(() => prisma.$disconnect());
