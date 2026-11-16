"use client";
import { useActionState } from "react";
import { login } from "../actions/auth";

export default function LoginPage() {
  const [state, action, pending] = useActionState(login, null);
  return (
    <main className="grid min-h-screen md:grid-cols-[1.1fr_1fr]">
      <section className="relative hidden flex-col justify-between overflow-hidden bg-ink p-12 text-white md:flex">
        <Logo />
        <div>
          <p className="mb-5 text-[11px] font-bold uppercase tracking-[.2em] text-mona">Sistema de gestão</p>
          <h1 className="display text-6xl">
            Do briefing
            <br />à entrega.
            <br />
            <span className="text-mona">A Mona faz.</span>
          </h1>
          <p className="mt-6 max-w-sm text-white/65">Jobs, pauta, clientes, fees e horas da agência em um só lugar.</p>
        </div>
        <p className="text-sm text-white/40">Uso exclusivo da Agência Mona</p>
      </section>
      <section className="flex items-center justify-center p-6">
        <form action={action} className="w-full max-w-sm space-y-4">
          <div className="-mx-6 -mt-6 mb-8 bg-ink px-6 py-5 md:hidden">
            <Logo />
          </div>
          <h2 className="display text-3xl">Entrar no FAZ<span className="text-mona">.</span></h2>
          <div>
            <label className="label" htmlFor="email">E-mail</label>
            <input id="email" name="email" type="email" required className="input" autoComplete="username" />
          </div>
          <div>
            <label className="label" htmlFor="password">Senha</label>
            <input id="password" name="password" type="password" required className="input" autoComplete="current-password" />
          </div>
          {state?.error && <p className="rounded-xl bg-red-50 px-3 py-2 text-sm text-red-700">{state.error}</p>}
          <button className="btn-primary w-full py-2.5" disabled={pending}>{pending ? "Entrando…" : "Entrar"}</button>
        </form>
      </section>
    </main>
  );
}

function Logo() {
  return (
    <div className="flex items-center gap-3">
      {/* eslint-disable-next-line @next/next/no-img-element */}
      <img src="/mona-logo-branco.png" alt="Agência Mona" width={120} height={39} className="h-9 w-auto" />
      <span className="rounded-full bg-mona px-2.5 py-0.5 text-xs font-extrabold tracking-[.12em] text-white">FAZ</span>
    </div>
  );
}
