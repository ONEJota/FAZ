import { requireUser, ROLES } from "@/lib/auth";
import { PageHeader } from "@/components/ui";
import { PasswordForm } from "@/components/PasswordForm";

export default async function Perfil() {
  const user = await requireUser();
  return (
    <div className="mx-auto max-w-xl">
      <PageHeader title="Meu perfil" subtitle={`${user.name} · ${ROLES[user.role as keyof typeof ROLES]} · ${user.email}`} />
      <PasswordForm />
    </div>
  );
}
