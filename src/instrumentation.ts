// Garante horário de Brasília no servidor (Netlify roda em UTC).
export function register() {
  process.env.TZ = "America/Sao_Paulo";
}
