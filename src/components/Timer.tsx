"use client";
import { useEffect, useState } from "react";
import { startTimer, stopTimer } from "@/app/actions/horas";

type Props = {
  running: { startedAt: string; label: string } | null;
  jobs: { id: number; label: string }[];
};

export function Timer({ running, jobs }: Props) {
  const [now, setNow] = useState(() => Date.now());
  const [open, setOpen] = useState(false);
  useEffect(() => {
    if (!running) return;
    const t = setInterval(() => setNow(Date.now()), 1000);
    return () => clearInterval(t);
  }, [running]);

  if (running) {
    const secs = Math.max(0, Math.floor((now - new Date(running.startedAt).getTime()) / 1000));
    const hh = String(Math.floor(secs / 3600)).padStart(2, "0");
    const mm = String(Math.floor((secs % 3600) / 60)).padStart(2, "0");
    const ss = String(secs % 60).padStart(2, "0");
    return (
      <form action={stopTimer} className="flex items-center gap-2 rounded-lg bg-green-50 py-1 pl-3 pr-1 ring-1 ring-green-200">
        <span className="h-2 w-2 animate-pulse rounded-full bg-green-500" />
        <span className="hidden max-w-40 truncate text-xs text-green-900 sm:inline" title={running.label}>{running.label}</span>
        <span className="font-mono text-sm font-bold text-green-800">{hh}:{mm}:{ss}</span>
        <button className="rounded-md bg-green-600 px-2 py-1 text-xs font-semibold text-white hover:bg-green-700">Parar</button>
      </form>
    );
  }

  return (
    <div className="relative">
      <button onClick={() => setOpen(!open)} className="btn-ghost whitespace-nowrap" type="button">⏱<span className="hidden sm:inline"> Iniciar horas</span></button>
      {open && (
        <form
          action={async (f) => {
            await startTimer(f);
            setOpen(false);
          }}
          className="absolute right-0 z-40 mt-2 w-[min(24rem,calc(100vw-2rem))] space-y-3 rounded-xl border border-black/5 bg-white p-4 shadow-lg"
        >
          <div>
            <label className="label">Job</label>
            <select name="jobId" required className="input">
              <option value="">Escolha um dos seus jobs…</option>
              {jobs.map((j) => (
                <option key={j.id} value={j.id}>{j.label}</option>
              ))}
            </select>
          </div>
          <div>
            <label className="label">O que você vai fazer?</label>
            <input name="description" className="input" placeholder="Ex.: arte do carrossel" required />
          </div>
          <button className="btn-primary w-full">Iniciar cronômetro</button>
          <p className="text-xs text-black/50">Para lançar horas de outro job ou horas passadas, use a tela Horas.</p>
        </form>
      )}
    </div>
  );
}
