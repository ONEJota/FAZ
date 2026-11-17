"use client";
import { useState } from "react";
import { saveAvatar } from "@/app/actions/perfil";
import { Avatar } from "@/components/Avatar";
import {
  AVATAR_BGS, AVATAR_STYLES, RING_COLORS, STATUS_EMOJIS, avatarUrl, decodeOptions, encodeOptions, randomSeed,
  type AvatarStyle, type AvatarUser,
} from "@/lib/avatar";
import type { AvatarCatalog } from "@/lib/avatarCatalog";

export function AvatarEditor({ user, catalog, mode, dark }: { user: AvatarUser; catalog: AvatarCatalog; mode: "perfil" | "inicio"; dark?: boolean }) {
  const initialStyle = (AVATAR_STYLES.some((s) => s.key === user.avatarStyle) ? user.avatarStyle : "avataaars") as AvatarStyle;
  const [style, setStyle] = useState<AvatarStyle>(initialStyle);
  const [seed, setSeed] = useState(user.avatarSeed || user.name);
  // Peças escolhidas, guardadas por estilo (trocar de estilo e voltar não perde o que foi montado)
  const [optsByStyle, setOptsByStyle] = useState<Partial<Record<AvatarStyle, Record<string, string>>>>({ [initialStyle]: decodeOptions(user.avatarOptions) });
  const [part, setPart] = useState(catalog[initialStyle][0]?.key ?? "");
  const [bg, setBg] = useState(user.avatarBg ?? "fde7ef");
  const [ring, setRing] = useState(RING_COLORS.includes(user.color) ? user.color : RING_COLORS[0]);
  const [emoji, setEmoji] = useState(user.statusEmoji ?? "");

  const parts = catalog[style];
  const opts = optsByStyle[style] ?? {};
  const current = parts.find((p) => p.key === part) ?? parts[0];
  const encoded = encodeOptions(opts);
  const setOpt = (key: string, value: string) => setOptsByStyle((m) => ({ ...m, [style]: { ...(m[style] ?? {}), [key]: value } }));
  const pickStyle = (s: AvatarStyle) => {
    setStyle(s);
    setPart(catalog[s][0]?.key ?? "");
  };
  const sortear = () => {
    setSeed(randomSeed());
    setOptsByStyle((m) => ({ ...m, [style]: {} }));
  };

  const preview: AvatarUser = { name: user.name, color: ring, avatarStyle: style, avatarSeed: seed, avatarBg: bg || null, avatarOptions: encoded || null, statusEmoji: emoji || null };
  const muted = dark ? "text-white/55" : "text-black/50";
  const section = `mb-2 text-[11px] font-bold uppercase tracking-[.1em] ${muted}`;
  const chip = (on: boolean) =>
    `whitespace-nowrap rounded-full px-3.5 py-1.5 text-sm font-bold transition ${on ? "bg-mona text-white" : dark ? "bg-white/10 text-white/75 hover:bg-white/15" : "bg-black/5 text-black/65 hover:bg-black/10"}`;
  const offset = dark ? "ring-offset-ink" : "ring-offset-white";
  const selRing = `ring-2 ring-offset-2 ${dark ? "ring-white" : "ring-ink"} ${offset}`;
  const tile = dark ? "bg-white/[.06]" : "bg-black/[.04]";

  return (
    <form action={saveAvatar} className="grid gap-8 md:grid-cols-[220px_1fr]">
      <input type="hidden" name="style" value={style} />
      <input type="hidden" name="seed" value={seed} />
      <input type="hidden" name="opts" value={encoded} />
      <input type="hidden" name="bg" value={bg} />
      <input type="hidden" name="ring" value={ring} />
      <input type="hidden" name="emoji" value={emoji} />
      <input type="hidden" name="next" value={mode} />

      <div className="flex flex-col items-center gap-4 md:sticky md:top-24 md:self-start">
        <div className="p-2">
          <Avatar user={preview} size={168} emoji />
        </div>
        <p className="text-center text-lg font-extrabold">{user.name}</p>
        <button type="button" onClick={sortear} className={chip(false)}>🎲 Sortear</button>
      </div>

      <div className="min-w-0 space-y-6">
        <div>
          <p className={section}>Estilo</p>
          <div className="flex flex-wrap gap-2">
            {AVATAR_STYLES.map((s) => (
              <button key={s.key} type="button" onClick={() => pickStyle(s.key)} className={`flex items-center gap-2 ${chip(style === s.key)} py-1 pl-1`}>
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img src={avatarUrl(s.key, user.name, "ffffff")} alt="" width={28} height={28} className="h-7 w-7 rounded-full" />
                {s.label}
              </button>
            ))}
          </div>
        </div>

        <div>
          <p className={section}>Monte o seu</p>
          {/* Abas das peças: cabelo, roupa, acessórios, cores... */}
          <div className="-mx-1 mb-3 flex gap-1.5 overflow-x-auto px-1 pb-1 [scrollbar-width:thin]">
            {parts.map((p) => (
              <button key={p.key} type="button" onClick={() => setPart(p.key)} className={chip(current?.key === p.key)}>
                {p.label}
              </button>
            ))}
          </div>

          {current?.kind === "enum" && (
            <div className="grid max-h-[340px] grid-cols-4 gap-2 overflow-y-auto pr-1 sm:grid-cols-6 lg:grid-cols-8">
              {[...(current.optional ? ["none"] : []), ...current.values].map((v) => {
                const on = (opts[current.key] ?? "") === v;
                return (
                  <button
                    key={v}
                    type="button"
                    onClick={() => setOpt(current.key, v)}
                    className={`relative aspect-square overflow-hidden rounded-2xl transition hover:scale-105 ${tile} ${on ? `ring-4 ring-mona ring-offset-2 ${offset}` : ""}`}
                    aria-label={`${current.label}: ${v === "none" ? "nenhum" : v}`}
                  >
                    {/* eslint-disable-next-line @next/next/no-img-element */}
                    <img src={avatarUrl(style, seed, bg || "ffffff", encodeOptions({ ...opts, [current.key]: v }))} alt="" className="h-full w-full" loading="lazy" />
                    {v === "none" && <span className="absolute inset-x-0 bottom-0 bg-ink/70 py-0.5 text-center text-[10px] font-bold text-white">Nenhum</span>}
                  </button>
                );
              })}
            </div>
          )}

          {current?.kind === "color" && (
            <div className="flex flex-wrap gap-2">
              {current.values.map((c) => (
                <button key={c} type="button" onClick={() => setOpt(current.key, c)} aria-label={`${current.label} #${c}`}
                  className={`h-10 w-10 rounded-full border border-black/10 transition hover:scale-110 ${opts[current.key] === c ? selRing : ""}`} style={{ background: `#${c}` }} />
              ))}
            </div>
          )}
        </div>

        <div>
          <p className={section}>Fundo</p>
          <div className="flex flex-wrap gap-2">
            {AVATAR_BGS.map((c) => (
              <button key={c} type="button" onClick={() => setBg(c)} aria-label={`Fundo #${c}`}
                className={`h-8 w-8 rounded-full border border-black/10 ${bg === c ? selRing : ""}`} style={{ background: `#${c}` }} />
            ))}
          </div>
        </div>

        <div>
          <p className={section}>Cor da moldura</p>
          <div className="flex flex-wrap gap-2">
            {RING_COLORS.map((c) => (
              <button key={c} type="button" onClick={() => setRing(c)} aria-label={`Moldura ${c}`}
                className={`h-8 w-8 rounded-full border-4 bg-transparent ${ring === c ? selRing : ""}`} style={{ borderColor: c }} />
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
