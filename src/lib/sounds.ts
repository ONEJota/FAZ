// Sons do sininho, sintetizados no navegador (sem arquivos de áudio).
let ctx: AudioContext | null = null;

function audio() {
  if (typeof window === "undefined") return null;
  ctx ??= new (window.AudioContext || (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext)();
  if (ctx.state === "suspended") void ctx.resume();
  return ctx;
}

/** O navegador só libera som depois de um clique ou tecla: chamamos isso no primeiro gesto. */
export function unlockAudio() {
  audio();
}

function note(c: AudioContext, freq: number, start: number, dur: number, type: OscillatorType, peak: number) {
  const o = c.createOscillator();
  const g = c.createGain();
  o.type = type;
  o.frequency.setValueAtTime(freq, start);
  g.gain.setValueAtTime(0.0001, start);
  g.gain.exponentialRampToValueAtTime(peak, start + 0.015);
  g.gain.exponentialRampToValueAtTime(0.0001, start + dur);
  o.connect(g).connect(c.destination);
  o.start(start);
  o.stop(start + dur + 0.05);
}

/** Notificação comum: um "plim" curto de duas notas. */
export function playPing() {
  const c = audio();
  if (!c) return;
  const t = c.currentTime + 0.02;
  note(c, 880, t, 0.35, "sine", 0.18);
  note(c, 1318.5, t + 0.11, 0.5, "sine", 0.14);
}

/** Entrega (job concluído): arpejo de comemoração. */
export function playDelivery() {
  const c = audio();
  if (!c) return;
  const t = c.currentTime + 0.02;
  [523.25, 659.25, 783.99, 1046.5].forEach((f, i) => note(c, f, t + i * 0.09, 0.42, "triangle", 0.16));
  note(c, 1567.98, t + 0.4, 0.9, "sine", 0.1);
}
