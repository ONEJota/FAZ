import { requireUser } from "@/lib/auth";
import { skipOnboarding } from "@/app/actions/perfil";
import { AvatarEditor } from "@/components/AvatarEditor";

// Primeiro acesso: antes de entrar no FAZ, cada pessoa monta o próprio avatar.
export default async function BoasVindas() {
  const user = await requireUser();
  return (
    <main className="min-h-screen bg-ink text-white">
      <div className="mx-auto max-w-5xl px-4 py-8 md:py-12">
        <div className="mb-10 flex items-center justify-between gap-4">
          <div className="flex items-center gap-2.5">
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img src="/mona-logo-branco.png" alt="Agência Mona" width={81} height={27} className="h-[27px] w-auto" />
            <span className="rounded-full bg-mona px-2 py-0.5 text-[11px] font-extrabold tracking-[.12em] text-white">FAZ</span>
          </div>
          <form action={skipOnboarding}>
            <button className="text-sm font-semibold text-white/55 hover:text-white">Fazer depois →</button>
          </form>
        </div>
        <p className="mb-4 text-[11px] font-bold uppercase tracking-[.2em] text-mona">Boas-vindas</p>
        <h1 className="display mb-3 text-4xl md:text-6xl">
          Oi, {user.name.split(" ")[0]}.
          <br />
          <span className="text-mona">Monte o seu avatar.</span>
        </h1>
        <p className="mb-10 max-w-lg text-white/65">É ele que aparece na pauta, no Kanban e nos comentários. Escolha o estilo, o personagem, as cores e um emoji para dizer como você está.</p>
        <AvatarEditor user={user} mode="inicio" dark />
      </div>
    </main>
  );
}
