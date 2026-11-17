"use client";
import { useState } from "react";
import { completeTask, handOffTask, setTaskStatus } from "@/app/actions/jobs";
import { TASK_STATUS, type TaskStatus } from "@/lib/tasks";

type Opt = { id: number; name: string };

/**
 * Andamento da tarefa: Pendente → Em andamento → Concluir. Concluir abre um popup:
 * concluir de vez ou passar o job para outro setor.
 */
export function TaskControls({
  task, sectors, users, back, canEdit,
}: {
  task: { id: number; title: string; status: string };
  sectors: Opt[];
  users: Opt[];
  back: string;
  canEdit: boolean;
}) {
  const [open, setOpen] = useState(false);
  const [mode, setMode] = useState<"escolha" | "repassar">("escolha");
  const status = (task.status in TASK_STATUS ? task.status : "PENDENTE") as TaskStatus;
  const closed = status === "CONCLUIDA" || status === "REPASSADA";

  if (closed || !canEdit) {
    return (
      <span className="flex items-center gap-2">
        <span className={`chip ${TASK_STATUS[status].cls}`}>{TASK_STATUS[status].label}</span>
        {closed && canEdit && (
          <form action={setTaskStatus}>
            <input type="hidden" name="taskId" value={task.id} />
            <input type="hidden" name="status" value="PENDENTE" />
            <button className="text-xs font-semibold text-black/45 hover:text-mona hover:underline">reabrir</button>
          </form>
        )}
      </span>
    );
  }

  const pill = (on: boolean) => `rounded-full px-2.5 py-1 text-xs font-bold transition ${on ? "bg-ink text-white" : "text-black/55 hover:bg-black/5"}`;

  return (
    <>
      <span className="inline-flex items-center gap-0.5 rounded-full bg-black/[.04] p-0.5">
        {(["PENDENTE", "ANDAMENTO"] as const).map((st) => (
          <form key={st} action={setTaskStatus}>
            <input type="hidden" name="taskId" value={task.id} />
            <input type="hidden" name="status" value={st} />
            <button className={pill(status === st)} aria-pressed={status === st}>{TASK_STATUS[st].label}</button>
          </form>
        ))}
        <button type="button" onClick={() => { setMode("escolha"); setOpen(true); }} className="rounded-full px-2.5 py-1 text-xs font-bold text-green-700 hover:bg-green-50">
          Concluir
        </button>
      </span>

      {open && (
        <div className="fixed inset-0 z-[60] flex items-end justify-center bg-ink/50 p-3 backdrop-blur-sm sm:items-center" onClick={() => setOpen(false)} role="dialog" aria-modal aria-label="Concluir tarefa">
          <div className="w-full max-w-md rounded-3xl bg-white p-5 text-ink shadow-2xl" onClick={(e) => e.stopPropagation()}>
            <p className="text-[11px] font-bold uppercase tracking-[.12em] text-black/45">Tarefa</p>
            <h3 className="mb-4 text-lg font-extrabold leading-snug">{task.title}</h3>

            {mode === "escolha" ? (
              <div className="space-y-2.5">
                <form action={completeTask}>
                  <input type="hidden" name="taskId" value={task.id} />
                  <input type="hidden" name="back" value={back} />
                  <button className="flex w-full items-start gap-3 rounded-2xl border-2 border-green-200 bg-green-50 p-4 text-left transition hover:border-green-500">
                    <span className="text-2xl">✅</span>
                    <span>
                      <span className="block font-extrabold text-green-900">Concluir tarefa</span>
                      <span className="block text-xs text-green-900/70">O job sai da área de trabalho de todos, menos de quem ainda tem tarefa aberta nele. Se for a última, o job é entregue.</span>
                    </span>
                  </button>
                </form>
                <button type="button" onClick={() => setMode("repassar")} className="flex w-full items-start gap-3 rounded-2xl border-2 border-sky-200 bg-sky-50 p-4 text-left transition hover:border-sky-500">
                  <span className="text-2xl">➡️</span>
                  <span>
                    <span className="block font-extrabold text-sky-900">Passar para outro setor</span>
                    <span className="block text-xs text-sky-900/70">Some só da sua área de trabalho. O job vai para o setor escolhido.</span>
                  </span>
                </button>
                <button type="button" onClick={() => setOpen(false)} className="w-full pt-1 text-sm font-semibold text-black/45 hover:text-ink">Cancelar</button>
              </div>
            ) : (
              <form action={handOffTask} className="space-y-3">
                <input type="hidden" name="taskId" value={task.id} />
                <input type="hidden" name="back" value={back} />
                <div>
                  <label className="label">Para qual setor? *</label>
                  <select name="statusId" required className="input" defaultValue="">
                    <option value="" disabled>Escolha…</option>
                    {sectors.map((s) => <option key={s.id} value={s.id}>{s.name}</option>)}
                  </select>
                </div>
                <div>
                  <label className="label">Quem recebe? (opcional)</label>
                  <select name="assigneeId" className="input" defaultValue="">
                    <option value="">Ninguém específico</option>
                    {users.map((u) => <option key={u.id} value={u.id}>{u.name}</option>)}
                  </select>
                </div>
                <div>
                  <label className="label">Tarefa de quem recebe (opcional)</label>
                  <input name="nextTitle" className="input" placeholder="Ex.: Revisar o texto e aprovar" />
                </div>
                <div className="flex gap-2 pt-1">
                  <button className="btn-primary flex-1">Passar para o setor</button>
                  <button type="button" onClick={() => setMode("escolha")} className="btn-ghost">Voltar</button>
                </div>
              </form>
            )}
          </div>
        </div>
      )}
    </>
  );
}
