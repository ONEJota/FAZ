export function fmtMinutes(min: number) {
  const m = Math.round(min);
  const h = Math.floor(Math.abs(m) / 60);
  const r = Math.abs(m) % 60;
  return `${m < 0 ? "-" : ""}${h}:${String(r).padStart(2, "0")}`;
}

export function fmtMoney(v: number) {
  return v.toLocaleString("pt-BR", { style: "currency", currency: "BRL" });
}

export function fmtDate(d?: Date | null) {
  if (!d) return "—";
  return d.toLocaleDateString("pt-BR", { day: "2-digit", month: "2-digit", year: "numeric" });
}

export function fmtDateTime(d?: Date | null) {
  if (!d) return "—";
  return d.toLocaleString("pt-BR", { day: "2-digit", month: "2-digit", year: "numeric", hour: "2-digit", minute: "2-digit" });
}

export function fmtShort(d: Date) {
  return d.toLocaleString("pt-BR", { day: "2-digit", month: "2-digit", hour: "2-digit", minute: "2-digit" });
}

/** valor para <input type="datetime-local"> no fuso local */
export function toInputDateTime(d?: Date | null) {
  if (!d) return "";
  const z = new Date(d.getTime() - d.getTimezoneOffset() * 60000);
  return z.toISOString().slice(0, 16);
}

export function toInputDate(d?: Date | null) {
  return toInputDateTime(d).slice(0, 10);
}

export const REVISION_REASONS: Record<string, string> = {
  CLIENTE_MUDOU: "Cliente mudou o pedido",
  BRIEFING_INCOMPLETO: "Briefing incompleto",
  ERRO_INTERNO: "Erro interno",
  AJUSTE_FINO: "Ajuste fino / gosto",
  OUTRO: "Outro",
};

export function isLate(due: Date, statusDone: boolean, statusWaiting = false) {
  return !statusDone && !statusWaiting && due.getTime() < Date.now();
}

export function initials(name: string) {
  return name.split(/\s+/).map((p) => p[0]).slice(0, 2).join("").toUpperCase();
}
