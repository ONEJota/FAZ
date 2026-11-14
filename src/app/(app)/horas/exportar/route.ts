import { NextResponse, type NextRequest } from "next/server";
import { currentUser } from "@/lib/auth";
import { queryHoras } from "@/lib/horasQuery";

export async function GET(req: NextRequest) {
  const user = await currentUser();
  if (!user) return NextResponse.redirect(new URL("/login", req.url));
  const p = req.nextUrl.searchParams;
  const { entries, ym, manager } = await queryHoras(user, {
    mes: p.get("mes") ?? undefined,
    pessoa: p.get("pessoa") ?? undefined,
    cliente: p.get("cliente") ?? undefined,
  });
  const esc = (v: unknown) => `"${String(v ?? "").replace(/"/g, '""')}"`;
  const head = ["Início", "Fim", "Pessoa", "Cliente", "Job", "Título do job", "Descrição", "Minutos", "Horas", ...(manager ? ["Custo (R$)"] : [])];
  const rows = entries.map((e) => [
    e.startedAt.toLocaleString("pt-BR"),
    e.endedAt?.toLocaleString("pt-BR") ?? "rodando",
    e.user.name,
    e.client.name,
    e.job?.number ?? "",
    e.job?.title ?? "",
    e.description,
    e.minutes,
    (e.minutes / 60).toFixed(2).replace(".", ","),
    ...(manager ? [((e.minutes / 60) * e.hourlyCost).toFixed(2).replace(".", ",")] : []),
  ]);
  const csv = "﻿" + [head, ...rows].map((r) => r.map(esc).join(";")).join("\r\n");
  return new NextResponse(csv, {
    headers: { "Content-Type": "text/csv; charset=utf-8", "Content-Disposition": `attachment; filename="horas-${ym}.csv"` },
  });
}
