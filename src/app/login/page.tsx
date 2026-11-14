"use client";
import { useActionState } from "react";
import { login } from "../actions/auth";

export default function LoginPage() {
  const [state, action, pending] = useActionState(login, null);
  return (
    <main className="grid min-h-screen md:grid-cols-2">
      <section className="hidden flex-col justify-between bg-mona p-12 text-white md:flex">
        <Logo light />
        <div>
          <h1 className="text-4xl font-extrabold leading-tight">
            Do briefing à entrega,
            <br />a Mona faz acontecer.
          </h1>
          <p className="mt-4 max-w-sm text-white/80">Jobs, pauta, clientes, fees e horas da agência em um só lugar.</p>
        </div>
        <p className="text-sm text-white/60">Uso exclusivo da Agência Mona</p>
      </section>
      <section className="flex items-center justify-center p-6">
        <form action={action} className="w-full max-w-sm space-y-4">
          <div className="md:hidden">
            <Logo />
          </div>
          <h2 className="text-2xl font-bold">Entrar no FAZ</h2>
          <div>
            <label className="label" htmlFor="email">E-mail</label>
            <input id="email" name="email" type="email" required className="input" autoComplete="username" />
          </div>
          <div>
            <label className="label" htmlFor="password">Senha</label>
            <input id="password" name="password" type="password" required className="input" autoComplete="current-password" />
          </div>
          {state?.error && <p className="rounded-lg bg-red-50 px-3 py-2 text-sm text-red-700">{state.error}</p>}
          <button className="btn-primary w-full" disabled={pending}>{pending ? "Entrando…" : "Entrar"}</button>
        </form>
      </section>
    </main>
  );
}

function Logo({ light }: { light?: boolean }) {
  return (
    <div className={`text-3xl font-black tracking-tight ${light ? "text-white" : "text-mona"}`}>
      FAZ<span className={light ? "text-white/60" : "text-ink/40"}>.</span>
    </div>
  );
}
