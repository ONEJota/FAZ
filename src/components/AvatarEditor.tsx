"use client";
import { useMemo, useState } from "react";
import { saveAvatar } from "@/app/actions/perfil";
import { Avatar } from "@/components/Avatar";
import { AVATAR_BGS, AVATAR_STYLES, RING_COLORS, STATUS_EMOJIS, avatarUrl, randomSeed, type AvatarUser } from "@/lib/avatar";

const VARIATIONS = 11;

export function AvatarEditor({ user, mode, dark }: { user: AvatarUser; mode: "perfil" | "inicio"; dark?: boolean }) {
  const [style, setStyle] = useState(user.avatarStyle || "notionists");
  const [seed, setSeed] = useState(user.avatarSeed || user.name);
  const [bg, setBg] = useState(user.avatarBg ?? "fde7ef");
  const [ring, setRing] = useState(RING_COLORS.includes(user.color) ? user.color : RING_COLORS[0]);
  const [emoji, setEmoji] = useState(user.statusEmoji ?? "");
  const [batch, setBatch] = useState(0);
  // Variações do mesmo estilo para escolher; a atual fica sempre na primeira posição
  // (sementes determinísticas: o servidor e o navegador geram a mesma grade)
  const seeds = useMemo(() => [seed, ...Array.from({ length: VARIATIONS }, (_, i) => `${user.name}-${batch}-${i}`)], [batch, style]); // eslint-disable-line react-hooks/exhaustive-deps

  const preview: AvatarUser = { name: user.name, color: ring, avatarStyle: style, avatarSeed: seed, avatarBg: bg || null, statusEmoji: emoji || null };
  const muted = dark ? "text-white/55" : "text-black/50";
  const section = `mb-2 text-[11px] font-bold uppercase tracking-[.1em] ${muted}`;
  const chip = (on: boolean) =>
    `rounded-full px-3.5 py-1.5 text-sm font-bold transition ${on ? "bg-mona text-white" : dark ? "bg-white/10 text-white/75 hover:bg-white/15" : "bg-black/5 text-black/65 hover:bg-black/10"}`;
  const swatchRing = dark ? "ring-white" : "ring-ink";

  return (
    <form action={saveAvatar} className="grid gap-8 md:grid-cols-[220px_1fr]">
      <input type="hidden" name="style" value={style} />
      <input type="hidden" name="seed" value={seed} />
      <input type="hidden" name="bg" value={bg} />
      <input type="hidden" name="ring" value={ring} />
      <input type="hidden" name="emoji" value={emoji} />
      <input type="hidden" name="next" value={mode} />

      <div className="flex flex-col items-center gap-4 md:sticky md:top-24 md:self-start">
        <div className="p-2">
          <Avatar user={preview} size={168} emoji />
        </div>
        <p className="text-center text-lg font-extrabold">{user.name}</p>
        <button type="button" onClick={() => { setSeed(randomSeed()); setBatch((b) => b + 1); }} className={chip(false)}>
          🎲 Sortear
        </button>
      </div>

      <div className="space-y-6">
        <div>
          <p className={section}>Estilo</p>
          <div className="flex flex-wrap gap-2">
            {AVATAR_STYLES.map((s) => (
              <button key={s.key} type="button" onClick={() => { setStyle(s.key); setBatch((b) => b + 1); }} className={`flex items-center gap-2 ${chip(style === s.key)} py-1 pl-1`}>
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img src={avatarUrl(s.key, user.name, "ffffff")} alt="" width={28} height={28} className="h-7 w-7 rounded-full" />
                {s.label}
              </button>
            ))}
          </div>
        </div>

        <div>
          <p className={section}>Escolha o seu</p>
          <div className="grid grid-cols-4 gap-2 sm:grid-cols-6">
            {seeds.map((sd) => (
              <button
                key={sd}
                type="button"
                onClick={() => setSeed(sd)}
                className={`aspect-square overflow-hidden rounded-2xl ring-offset-2 transition hover:scale-105 ${sd === seed ? `ring-4 ring-mona ${dark ? "ring-offset-ink" : ""}` : ""}`}
                aria-label="Escolher este personagem"
              >
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img src={avatarUrl(style, sd, bg || "ffffff")} alt="" className="h-full w-full" loading="lazy" />
              </button>
            ))}
          </div>
          <button type="button" onClick={() => setBatch((b) => b + 1)} className={`mt-2 text-sm font-bold text-mona hover:underline`}>
            Ver outros
          </button>
        </div>

        <div>
          <p className={section}>Fundo</p>
          <div className="flex flex-wrap gap-2">
            {AVATAR_BGS.map((c) => (
              <button key={c} type="button" onClick={() => setBg(c)} aria-label={`Fundo ${c}`}
                className={`h-8 w-8 rounded-full border border-black/10 ${bg === c ? `ring-2 ring-offset-2 ${swatchRing} ${dark ? "ring-offset-ink" : ""}` : ""}`} style={{ background: `#${c}` }} />
            ))}
          </div>
        </div>

        <div>
          <p className={section}>Cor da moldura</p>
          <div className="flex flex-wrap gap-2">
            {RING_COLORS.map((c) => (
              <button key={c} type="button" onClick={() => setRing(c)} aria-label={`Moldura ${c}`}
                className={`h-8 w-8 rounded-full border-4 bg-transparent ${ring === c ? `ring-2 ring-offset-2 ${swatchRing} ${dark ? "ring-offset-ink" : ""}` : ""}`} style={{ borderColor: c }} />
            ))}
          </div>
        </div>

        <div>
          <p className={section}>Emoji de status</p>
          <div className="flex flex-wrap gap-1.5">
            <button type="button" onClick={() => setEmoji("")} className={chip(emoji === "")}>Nenhum</button>
            {STATUS_EMOJIS.map((e) => (
              <button key={e} type="button" onClick={() => setEmoji(e)} className={`h-9 w-9 rounded-full text-lg transition ${emoji === e ? "bg-mona" : dark ? "bg-white/10 hover:bg-white/15" : "bg-black/5 hover:bg-black/10"}`}>
                {e}
              </button>
            ))}
          </div>
          <p className={`mt-2 text-xs ${muted}`}>Aparece no cantinho do seu avatar. Dá para trocar quando quiser em Meu perfil.</p>
        </div>

        <button className="btn-primary px-6 py-2.5">{mode === "inicio" ? "Pronto, entrar no FAZ" : "Salvar avatar"}</button>
      </div>
    </form>
  );
}
