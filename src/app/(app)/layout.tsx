import Link from "next/link";
import { requireUser, isManager, ROLES } from "@/lib/auth";
import { db } from "@/lib/db";
import { logout } from "../actions/auth";
import { Timer } from "@/components/Timer";
import { Avatar } from "@/components/Avatar";
import { NavLinks } from "@/components/NavLinks";

export default async function AppLayout({ children }: { children: React.ReactNode }) {
  const user = await requireUser();
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
      <header className="sticky top-0 z-30 border-b border-black/5 bg-white/90 backdrop-blur">
        <div className="mx-auto flex max-w-[1400px] flex-wrap items-center gap-x-4 gap-y-1 px-4 py-2 md:h-14 md:flex-nowrap md:py-0">
          <Link href="/" className="text-2xl font-black tracking-tight text-mona">
            FAZ<span className="text-ink/30">.</span>
          </Link>
          <div className="order-last w-full min-w-0 md:order-none md:w-auto">
            <NavLinks links={links} />
          </div>
          <div className="ml-auto flex items-center gap-3">
            <Link href="/jobs/novo" className="btn-primary hidden sm:inline-flex">+ Job</Link>
            <Timer
              running={running ? { startedAt: running.startedAt.toISOString(), label: running.job ? `${running.job.number} · ${running.job.title}` : running.client.name } : null}
              jobs={myJobs.map((j) => ({ id: j.id, label: `${j.number} · ${j.title} — ${j.client.name}` }))}
            />
            <details className="relative">
              <summary className="flex cursor-pointer list-none items-center gap-2">
                <Avatar name={user.name} color={user.color} />
              </summary>
              <div className="absolute right-0 mt-2 w-56 rounded-xl border border-black/5 bg-white p-2 shadow-lg">
                <div className="px-2 py-1.5">
                  <p className="text-sm font-semibold">{user.name}</p>
                  <p className="text-xs text-black/50">{ROLES[user.role as keyof typeof ROLES]}</p>
                </div>
                <Link href="/perfil" className="block rounded-lg px-2 py-1.5 text-sm hover:bg-black/5">Meu perfil e senha</Link>
                <form action={logout}>
                  <button className="w-full rounded-lg px-2 py-1.5 text-left text-sm text-red-600 hover:bg-red-50">Sair</button>
                </form>
              </div>
            </details>
          </div>
        </div>
      </header>
      <main className="mx-auto max-w-[1400px] px-4 py-6">{children}</main>
    </div>
  );
}
