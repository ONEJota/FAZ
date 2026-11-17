"use client";
import { useState } from "react";
import { concludeJob } from "@/app/actions/jobs";

/** Botão "Concluir job" com confirmação (avisa se ainda há tarefas abertas). */
export function ConcludeJobButton({ jobId, number, openTasks }: { jobId: number; number: number; openTasks: { title: string; who: string }[] }) {
  const [open, setOpen] = useState(false);
  return (
    <>
      <button type="button" onClick={() => setOpen(true)} className="btn border border-green-600 bg-green-600 text-white hover:bg-green-700">
        ✓ Concluir job
      </button>
      {open && (
        <div className="fixed inset-0 z-[60] flex items-end justify-center bg-ink/50 p-3 backdrop-blur-sm sm:items-center" onClick={() => setOpen(false)} role="dialog" aria-modal aria-label="Concluir job">
          <form action={concludeJob} className="w-full max-w-md rounded-3xl bg-white p-5 text-ink shadow-2xl" onClick={(e) => e.stopPropagation()}>
            <input type="hidden" name="jobId" value={jobId} />
            <p className="text-[11px] font-bold uppercase tracking-[.12em] text-black/45">Concluir job</p>
            <h3 className="mb-2 text-lg font-extrabold">Entregar o job #{number}?</h3>
            <p className="text-sm text-black/60">O job vai para a situação final, sai da área de trabalho de todos e quem acompanha recebe o aviso de entrega 🎉.</p>
            {openTasks.length > 0 && (
              <div className="mt-3 rounded-2xl bg-amber-50 p-3 text-sm text-amber-900 ring-1 ring-amber-200">
                <p className="font-bold">{openTasks.length === 1 ? "1 tarefa ainda está aberta" : `${openTasks.length} tarefas ainda estão abertas`} e {openTasks.length === 1 ? "será fechada" : "serão fechadas"}:</p>
                <ul className="mt-1 list-disc pl-5 text-xs">
                  {openTasks.slice(0, 6).map((t, i) => <li key={i}>{t.title} <span className="text-amber-900/60">({t.who})</span></li>)}
                  {openTasks.length > 6 && <li>e mais {openTasks.length - 6}</li>}
                </ul>
              </div>
            )}
            <div className="mt-4 flex gap-2">
              <button className="btn flex-1 bg-green-600 text-white hover:bg-green-700">Concluir e entregar</button>
              <button type="button" onClick={() => setOpen(false)} className="btn-ghost">Cancelar</button>
            </div>
            <p className="mt-2 text-center text-xs text-black/40">Dá para reabrir depois, se precisar.</p>
          </form>
        </div>
      )}
    </>
  );
}
