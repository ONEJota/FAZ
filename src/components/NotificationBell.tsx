"use client";
import { useCallback, useEffect, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import type { NotificationFeed, NotificationItem } from "@/lib/notifications";
import { playDelivery, playPing, unlockAudio } from "@/lib/sounds";

const POLL_MS = 25_000;
const SOUND_KEY = "faz_som";

const ICONS: Record<string, string> = { JOB: "📌", TAREFA: "☑️", COMENTARIO: "💬", SITUACAO: "🔄", ENTREGA: "🎉", ALTERACAO: "✏️", PRAZO: "⏰" };

function ago(iso: string) {
  const s = Math.max(0, (Date.now() - new Date(iso).getTime()) / 1000);
  if (s < 60) return "agora";
  if (s < 3600) return `${Math.floor(s / 60)} min`;
  if (s < 86400) return `${Math.floor(s / 3600)} h`;
  return new Date(iso).toLocaleDateString("pt-BR", { day: "2-digit", month: "2-digit" });
}

function readSoundPref() {
  try {
    return localStorage.getItem(SOUND_KEY) !== "off";
  } catch {
    return true;
  }
}

export function NotificationBell({ initial }: { initial: NotificationFeed }) {
  const router = useRouter();
  const [feed, setFeed] = useState(initial);
  const [open, setOpen] = useState(false);
  const [sound, setSound] = useState(true);
  const [ring, setRing] = useState(false);
  const seenMax = useRef(initial.maxId);
  const box = useRef<HTMLDivElement>(null);

  useEffect(() => setSound(readSoundPref()), []);

  // Chegou coisa nova desde a última consulta: toca o som (o de entrega tem prioridade) e balança o sino
  const apply = useCallback((next: NotificationFeed) => {
    const fresh = next.items.filter((n) => n.id > seenMax.current && !n.read);
    seenMax.current = Math.max(seenMax.current, next.maxId);
    setFeed(next);
    if (!fresh.length) return;
    setRing(true);
    setTimeout(() => setRing(false), 1200);
    if (readSoundPref()) (fresh.some((n) => n.type === "ENTREGA") ? playDelivery : playPing)();
    // Atualiza a tela em que a pessoa está (pauta, job) para refletir a mudança
    router.refresh();
  }, [router]);

  useEffect(() => {
    let stop = false;
    const poll = async () => {
      if (document.hidden) return;
      try {
        const r = await fetch("/api/notificacoes", { cache: "no-store" });
        if (r.ok && !stop) apply(await r.json());
      } catch {
        /* sem conexão: tenta de novo na próxima */
      }
    };
    const t = setInterval(poll, POLL_MS);
    const onVisible = () => !document.hidden && poll();
    document.addEventListener("visibilitychange", onVisible);
    // Libera o áudio no primeiro clique ou tecla
    const unlock = () => unlockAudio();
    window.addEventListener("pointerdown", unlock, { once: true });
    window.addEventListener("keydown", unlock, { once: true });
    return () => {
      stop = true;
      clearInterval(t);
      document.removeEventListener("visibilitychange", onVisible);
    };
  }, [apply]);

  // Número no título da aba (reaplicado de tempos em tempos: o Next troca o título ao navegar)
  useEffect(() => {
    const sync = () => {
      const base = document.title.replace(/^\(\d+\)\s*/, "");
      const want = feed.unread ? `(${feed.unread}) ${base}` : base;
      if (document.title !== want) document.title = want;
    };
    sync();
    const t = setInterval(sync, 1500);
    return () => clearInterval(t);
  }, [feed.unread]);

  // Fecha ao clicar fora
  useEffect(() => {
    if (!open) return;
    const close = (e: MouseEvent) => !box.current?.contains(e.target as Node) && setOpen(false);
    document.addEventListener("mousedown", close);
    return () => document.removeEventListener("mousedown", close);
  }, [open]);

  async function markRead(body: { all?: boolean; ids?: number[] }) {
    const r = await fetch("/api/notificacoes", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify(body) });
    if (r.ok) setFeed(await r.json());
  }

  function go(n: NotificationItem) {
    setOpen(false);
    if (!n.read) void markRead({ ids: [n.id] });
    router.push(n.link);
  }

  function toggleSound() {
    const next = !sound;
    setSound(next);
    try {
      localStorage.setItem(SOUND_KEY, next ? "on" : "off");
    } catch {
      /* navegador sem armazenamento: vale só nesta aba */
    }
    if (next) playPing();
  }

  return (
    <div className="relative" ref={box}>
      <button
        type="button"
        onClick={() => setOpen(!open)}
        className={`relative flex h-9 w-9 items-center justify-center rounded-full text-white/80 transition hover:bg-white/10 hover:text-white ${ring ? "bell-ring" : ""}`}
        aria-label={feed.unread ? `Notificações: ${feed.unread} não lidas` : "Notificações"}
      >
        <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden>
          <path d="M6 8a6 6 0 0 1 12 0c0 7 3 9 3 9H3s3-2 3-9" />
          <path d="M10.3 21a1.94 1.94 0 0 0 3.4 0" />
        </svg>
        {feed.unread > 0 && (
          <span className="absolute -right-0.5 -top-0.5 flex h-[18px] min-w-[18px] items-center justify-center rounded-full bg-mona px-1 text-[10px] font-extrabold text-white ring-2 ring-ink">
            {feed.unread > 99 ? "99+" : feed.unread}
          </span>
        )}
      </button>

      {open && (
        <div className="absolute right-0 z-50 mt-2 w-[min(24rem,calc(100vw-1.5rem))] overflow-hidden rounded-2xl border border-black/5 bg-white text-ink shadow-xl">
          <div className="flex items-center justify-between gap-2 border-b border-black/5 px-4 py-3">
            <p className="font-extrabold">Notificações</p>
            <div className="flex items-center gap-3 text-xs font-bold">
              <button type="button" onClick={toggleSound} className="text-black/55 hover:text-ink" title={sound ? "Desligar som" : "Ligar som"}>
                {sound ? "🔊 Som ligado" : "🔇 Som desligado"}
              </button>
              {feed.unread > 0 && (
                <button type="button" onClick={() => markRead({ all: true })} className="text-mona hover:underline">Marcar todas</button>
              )}
            </div>
          </div>
          {feed.items.length === 0 ? (
            <p className="px-4 py-10 text-center text-sm text-black/45">Nada por aqui ainda. Quando alguém te colocar num job, comentar ou entregar, aparece aqui.</p>
          ) : (
            <ul className="max-h-[60vh] overflow-y-auto">
              {feed.items.map((n) => (
                <li key={n.id}>
                  <button
                    type="button"
                    onClick={() => go(n)}
                    className={`flex w-full gap-3 border-t border-black/5 px-4 py-3 text-left first:border-0 hover:bg-black/[.03] ${n.read ? "" : "bg-mona-soft/50"}`}
                  >
                    <span className={`mt-0.5 flex h-8 w-8 shrink-0 items-center justify-center rounded-full text-base ${n.type === "ENTREGA" ? "bg-mona" : "bg-black/5"}`}>{ICONS[n.type] ?? "🔔"}</span>
                    <span className="min-w-0 flex-1">
                      <span className={`block text-sm leading-snug ${n.read ? "text-black/70" : "font-bold"}`}>{n.title}</span>
                      {n.body && <span className="mt-0.5 block truncate text-xs text-black/50">{n.body}</span>}
                    </span>
                    <span className="flex shrink-0 flex-col items-end gap-1.5">
                      <span className="text-[11px] text-black/40">{ago(n.createdAt)}</span>
                      {!n.read && <span className="h-2 w-2 rounded-full bg-mona" />}
                    </span>
                  </button>
                </li>
              ))}
            </ul>
          )}
        </div>
      )}
    </div>
  );
}
