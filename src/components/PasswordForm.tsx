"use client";
import { useActionState } from "react";
import { changePassword } from "@/app/actions/auth";

export function PasswordForm() {
  const [state, action, pending] = useActionState(changePassword, null);
  return (
    <form action={action} className="card space-y-3 p-5">
      <h2 className="font-bold">Trocar senha</h2>
      <div><label className="label">Senha atual</label><input name="current" type="password" required className="input" autoComplete="current-password" /></div>
      <div><label className="label">Nova senha (mín. 8 caracteres)</label><input name="next" type="password" required minLength={8} className="input" autoComplete="new-password" /></div>
      {state?.error && <p className="text-sm text-red-600">{state.error}</p>}
      {state?.ok && <p className="text-sm text-green-700">{state.ok}</p>}
      <button className="btn-primary" disabled={pending}>Salvar nova senha</button>
    </form>
  );
}
