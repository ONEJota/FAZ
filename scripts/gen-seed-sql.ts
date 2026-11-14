// Gera a migração SQL com os dados iniciais (situações, peças, clientes, equipe)
import bcrypt from "bcryptjs";
import { writeFileSync } from "node:fs";

import { STATUSES, SERVICES, CLIENTS, TEAM, COLORS } from "../prisma/seed-data";
const q = (s: string) => `'${s.replace(/'/g, "''")}'`;
const slug = (s: string) => s.normalize("NFD").replace(/[̀-ͯ]/g, "").toLowerCase().replace(/[^a-z0-9]+/g, ".").replace(/^\.|\.$/g, "");

const pw = process.env.SEED_PASSWORD!;
const hash = bcrypt.hashSync(pw, 10);
const lines = ["-- Dados iniciais do FAZ"];
STATUSES.forEach((s, i) => lines.push(`INSERT INTO "Status" ("name","order","color","isDone","isWaiting") VALUES (${q(s.name)},${i + 1},${q(s.color)},${!!s.isDone},${!!s.isWaiting}) ON CONFLICT ("name") DO NOTHING;`));
SERVICES.forEach(([n, c, m]) => lines.push(`INSERT INTO "Service" ("name","category","defaultMinutes") VALUES (${q(n)},${q(c)},${m}) ON CONFLICT ("name") DO NOTHING;`));
CLIENTS.forEach((n) => lines.push(`INSERT INTO "Client" ("name") VALUES (${q(n)}) ON CONFLICT ("name") DO NOTHING;`));
TEAM.forEach(([n, r], i) => lines.push(`INSERT INTO "User" ("name","email","password","role","color") VALUES (${q(n)},${q(slug(n) + "@mona.local")},${q(hash)},${q(r)},${q(COLORS[i % COLORS.length])}) ON CONFLICT ("email") DO NOTHING;`));
const dir = "netlify/database/migrations/0002_seed";
import("node:fs").then((fs) => {
  fs.mkdirSync(dir, { recursive: true });
  writeFileSync(`${dir}/migration.sql`, lines.join("\n") + "\n");
  console.log(`${lines.length - 1} linhas em ${dir}/migration.sql`);
});
