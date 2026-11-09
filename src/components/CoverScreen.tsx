import { useEffect, useState } from "react";
import { ArrowLeft } from "lucide-react";

export type SystemTheme = "blue" | "red" | "purple" | "yellow" | "bw" | "brown" | "flame";

export const THEMES: { id: SystemTheme; label: string; dot: string }[] = [
  { id: "blue", label: "Azul", dot: "#38d6ff" },
  { id: "red", label: "Vermelho", dot: "#ff5252" },
  { id: "purple", label: "Roxo", dot: "#b366ff" },
  { id: "yellow", label: "Amarelo", dot: "#ffe14d" },
  { id: "bw", label: "P&B", dot: "#e8e8e8" },
  { id: "brown", label: "Marrom", dot: "#c08a4d" },
  { id: "flame", label: "Chama", dot: "#ffb14d" },
];

const COVER: Record<SystemTheme, { filter?: string; status: string }> = {
  blue: { filter: "hue-rotate(165deg) saturate(1.05)", status: "arc reactor" },
  red: { filter: undefined, status: "mark protocol" },
  purple: { filter: "hue-rotate(280deg) saturate(1.1)", status: "phantom protocol" },
  yellow: { filter: "hue-rotate(75deg) saturate(1.1)", status: "solar protocol" },
  bw: { filter: "grayscale(1) brightness(1.05)", status: "stealth protocol" },
  brown: { filter: "hue-rotate(45deg) saturate(0.9)", status: "desert protocol" },
  flame: { filter: "hue-rotate(30deg) saturate(1.15)", status: "inferno protocol" },
};

type Props = { onExit: () => void; system?: SystemTheme };

/**
 * Capa cinematografica do J.A.R.V.I.S. - segue o sistema de cor ativo
 * (reator azul, protocolo Mark e variantes da armadura).
 */
export function CoverScreen({ onExit, system = "blue" }: Props) {
  const [ready, setReady] = useState(false);

  useEffect(() => {
    const t = window.setTimeout(() => setReady(true), 80);
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") onExit();
    };
    window.addEventListener("keydown", onKey);
    return () => {
      window.clearTimeout(t);
      window.removeEventListener("keydown", onKey);
    };
  }, [onExit]);

  return (
    <div className="fixed inset-0 z-50 overflow-hidden bg-background">
      {/* Fundo: imagem com parallax lento e brilho pulsante */}
      <div
        className="absolute inset-0 bg-cover bg-center cover-drift"
        style={{
          backgroundImage: `url(/jarvis-cover.png)`,
          filter: COVER[system].filter,
        }}
        aria-hidden
      />
      <div
        className="absolute inset-0 cover-breathe"
        style={{
          backgroundImage:
            "radial-gradient(circle at 50% 48%, color-mix(in oklab, var(--hud) 45%, transparent), transparent 58%)",
        }}
      />
      <div
        className="absolute inset-0"
        style={{
          backgroundImage:
            "radial-gradient(circle at 50% 48%, transparent 35%, color-mix(in oklab, var(--background) 88%, transparent) 100%)",
        }}
      />

      {/* Aneis holograficos em movimento */}
      <div className="pointer-events-none absolute left-1/2 top-1/2 aspect-square w-[78vmin] -translate-x-1/2 -translate-y-1/2">
        <div className="absolute inset-0 rounded-full border border-hud/55 cover-spin" />
        <div className="absolute inset-[9%] rounded-full border border-dashed border-gold/50 cover-spin-rev" />
        <div className="absolute inset-[20%] rounded-full border border-foreground/25 cover-spin" />
        <div className="absolute inset-[32%] rounded-full border-2 border-hud/45 cover-breathe" />
      </div>

      {/* Linha de varredura do holograma (acompanha a cor do tema) */}
      <div className="pointer-events-none absolute inset-0 overflow-hidden">
        <div className="absolute inset-x-0 top-0 h-24 bg-gradient-to-b from-hud/20 to-transparent cover-scan" />
      </div>
      {/* Scanlines finas */}
      <div className="pointer-events-none absolute inset-0 cover-scanlines opacity-40" />

      {/* Conteudo */}
      <div
        className={`relative flex h-full flex-col items-center justify-center px-6 text-center transition-all duration-1000 ${
          ready ? "opacity-100 blur-0" : "opacity-0 blur-md"
        }`}
      >
        <p className="font-mono text-[10px] uppercase tracking-[0.55em] text-muted-foreground cover-flicker">
          system status: operational — {COVER[system].status}
        </p>
        <h1 className="mt-4 text-4xl font-bold tracking-[0.3em] text-hud cover-title sm:text-6xl">
          J.A.R.V.I.S.
        </h1>
        <div className="mt-4 h-px w-56 max-w-[70vw] bg-gradient-to-r from-transparent via-gold to-transparent" />
        <p className="mt-4 max-w-md font-mono text-[11px] uppercase tracking-[0.3em] text-gold/85">
          armor integrity 98% — power levels stable
        </p>

        <button
          type="button"
          onClick={onExit}
          className="mt-10 inline-flex items-center gap-2 rounded-full border border-hud/70 bg-card/60 px-6 py-3 font-mono text-xs uppercase tracking-[0.3em] text-foreground backdrop-blur-sm transition-all hover:border-gold hover:shadow-hud-strong"
        >
          <ArrowLeft size={14} />
          Voltar a interface
        </button>
      </div>
    </div>
  );
}
