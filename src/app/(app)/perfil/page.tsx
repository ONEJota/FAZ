import { requireUser, ROLES } from "@/lib/auth";
import { ErrorBanner, PageHeader } from "@/components/ui";
import { PasswordForm } from "@/components/PasswordForm";
import { AvatarEditor } from "@/components/AvatarEditor";

export default async function Perfil({ searchParams }: { searchParams: Promise<{ ok?: string; erro?: string }> }) {
  const sp = await searchParams;
  const user = await requireUser();
  return (
    <div className="mx-auto max-w-5xl">
      <PageHeader title="Meu perfil" subtitle={`${user.name} · ${ROLES[user.role as keyof typeof ROLES]} · ${user.email}`} />
      <ErrorBanner msg={sp.erro} />
      {sp.ok === "avatar" && <div className="mb-4 rounded-xl border border-green-200 bg-green-50 px-4 py-2.5 text-sm text-green-800">Avatar salvo. 🎉</div>}
      <section className="card mb-6 p-5 md:p-7">
        <h2 className="mb-5 font-bold">Meu avatar</h2>
        <AvatarEditor user={user} mode="perfil" />
      </section>
      <div className="max-w-xl">
        <PasswordForm />
      </div>
    </div>
  );
}
