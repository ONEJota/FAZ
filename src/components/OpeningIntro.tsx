"use client";
import { useEffect, useLayoutEffect, useState } from "react";
import { Avatar } from "@/components/Avatar";
import type { AvatarUser } from "@/lib/avatar";

export const INTRO_COOKIE = "faz_intro";

/**
 * Abertura depois do login: primeiro a marca (FAZ), depois a pessoa (avatar + saudação),
 * e a cortina sobe revelando o sistema. Clique, Esc ou qualquer tecla pula.
 */
export function OpeningIntro({ user, greeting, line, show: serverShow }: { user: AvatarUser; greeting: string; line: string; show: boolean }) {
  const [show, setShow] = useState(serverShow);
  const [leaving, setLeaving] = useState(false);
  const [gone, setGone] = useState(false);

  // Logo depois do login o servidor ainda não enxerga o cookie: o navegador confere antes de pintar a tela
  useLayoutEffect(() => {
    if (!show && document.cookie.split("; ").includes(`${INTRO_COOKIE}=1`)) setShow(true);
  }, [show]);

  useEffect(() => {
    if (!show) return;
    // Só aparece uma vez por login
    document.cookie = `${INTRO_COOKIE}=; Max-Age=0; path=/`;
    const reduce = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    const t = setTimeout(() => setLeaving(true), reduce ? 1400 : 3300);
    const skip = () => setLeaving(true);
    window.addEventListener("keydown", skip);
    return () => {
      clearTimeout(t);
      window.removeEventListener("keydown", skip);
    };
  }, [show]);

  if (!show || gone) return null;
  const first = user.name.split(" ")[0];

  return (
    <div
      className={`intro ${leaving ? "intro-leave" : ""}`}
      onClick={() => setLeaving(true)}
      onAnimationEnd={(e) => {
        if (e.target === e.currentTarget && leaving) setGone(true);
      }}
      role="presentation"
      aria-hidden
    >
      <div className="intro-curtain-pink" />
      <div className="intro-stage">
        {/* Ato 1: a marca */}
        <div className="intro-brand">
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img src="/mona-logo-branco.png" alt="" width={120} height={39} className="intro-logo h-8 w-auto" />
          <div className="intro-word display">
            {["F", "A", "Z"].map((l, i) => (
              <span key={l} className="intro-mask">
                <span className="intro-letter" style={{ animationDelay: `${0.25 + i * 0.09}s` }}>{l}</span>
              </span>
            ))}
            <span className="intro-dot">.</span>
          </div>
          <div className="intro-bar" />
        </div>

        {/* Ato 2: a pessoa */}
        <div className="intro-person">
          <div className="intro-avatar">
            <Avatar user={user} size={132} emoji />
          </div>
          <p className="intro-hello display">
            <span className="intro-mask"><span className="intro-rise" style={{ animationDelay: "1.95s" }}>{greeting},</span></span>{" "}
            <span className="intro-mask"><span className="intro-rise text-mona" style={{ animationDelay: "2.05s" }}>{first}.</span></span>
          </p>
          <p className="intro-line">{line}</p>
        </div>
      </div>
      <p className="intro-skip">clique para pular</p>
    </div>
  );
}
