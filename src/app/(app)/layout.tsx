import Link from "next/link";
import { redirect } from "next/navigation";
import { requireUser, isManager, ROLES } from "@/lib/auth";
import { db } from "@/lib/db";
import { logout } from "../actions/auth";
import { Timer } from "@/components/Timer";
import { Avatar } from "@/components/Avatar";
import { NavLinks } from "@/components/NavLinks";

export default async function AppLayout({ children }: { children: React.ReactNode }) {
  const user = await requireUser();
  // Primeiro acesso: montar o avatar antes de entrar
  if (!user.onboardedAt) redirect("/boas-vindas");
  const manager = isManager(user);
  const running = await db.timeEntry.findFirst({
    where: { userId: user.id, endedAt: null },
    include: { job: true, client: true },
  });
  const myJobs = await db.job.findMany({
    where: { deletedAt: null, status: { isDone: false }, responsibles: { some: { userId: user.id } } },
    include: { client: true },
    orderBy: { dueDate: "asc" },
    take: 50,
  });

  const links = [
    { href: "/", label: "Painel" },
    { href: "/pauta", label: "Pauta" },
    { href: "/clientes", label: "Clientes" },
    { href: "/campanhas", label: "Campanhas" },
    { href: "/horas", label: "Horas" },
    ...(manager ? [{ href: "/rentabilidade", label: "Rentabilidade" }] : []),
    ...(manager ? [{ href: "/config", label: "Configurações" }] : []),
  ];

  return (
    <div className="min-h-screen">
      <header className="sticky top-0 z-30 border-b-4 border-mona bg-ink text-white">
        <div className="mx-auto flex max-w-[1400px] flex-wrap items-center gap-x-5 gap-y-2 px-4 py-2.5 lg:h-16 lg:flex-nowrap lg:py-0">
          <Link href="/" className="flex shrink-0 items-center gap-2.5" aria-label="FAZ · Agência Mona">
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img src="/mona-logo-branco.png" alt="Agência Mona" width={81} height={27} className="h-[27px] w-auto" />
            <span className="rounded-full bg-mona px-2 py-0.5 text-[11px] font-extrabold tracking-[.12em] text-white">FAZ</span>
          </Link>
          <div className="order-last -mx-1 w-full min-w-0 lg:order-none lg:mx-0 lg:w-auto">
            <NavLinks links={links} />
          </div>
          <div className="ml-auto flex items-center gap-3">
            <Link href="/jobs/novo" className="btn-primary hidden whitespace-nowrap sm:inline-flex">+ Job</Link>
            <Timer
              running={running ? { startedAt: running.startedAt.toISOString(), label: running.job ? `${running.job.number} · ${running.job.title}` : running.client.name } : null}
              jobs={myJobs.map((j) => ({ id: j.id, label: `${j.number} · ${j.title} — ${j.client.name}` }))}
            />
            <details className="relative">
              <summary className="flex cursor-pointer list-none items-center gap-2">
                <Avatar user={user} size={34} emoji={false} />
              </summary>
              <div className="absolute right-0 mt-2 w-56 rounded-2xl border border-black/5 bg-white p-2 text-ink shadow-lg">
                <div className="px-2 py-1.5">
                  <p className="text-sm font-semibold">{user.name}</p>
                  <p className="text-xs text-black/50">{ROLES[user.role as keyof typeof ROLES]}</p>
                </div>
                <Link href="/perfil" className="block rounded-lg px-2 py-1.5 text-sm hover:bg-black/5">Meu avatar e status</Link>
                <Link href="/perfil" className="block rounded-lg px-2 py-1.5 text-sm hover:bg-black/5">Trocar senha</Link>
                <form action={logout}>
                  <button className="w-full rounded-lg px-2 py-1.5 text-left text-sm text-red-600 hover:bg-red-50">Sair</button>
                </form>
              </div>
            </details>
          </div>
        </div>
      </header>
      <main className="mx-auto max-w-[1400px] px-4 py-7">{children}</main>
    </div>
  );
}
