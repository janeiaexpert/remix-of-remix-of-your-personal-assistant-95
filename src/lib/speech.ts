import { useEffect, useRef, useState } from "react";
import { mixedContentBlocked } from "./bridge";

type SpeechRecognitionCtor = new () => SpeechRecognitionInstance;
interface SpeechRecognitionInstance extends EventTarget {
  lang: string;
  continuous: boolean;
  interimResults: boolean;
  start: () => void;
  stop: () => void;
  onresult: ((e: SpeechRecognitionEvent) => void) | null;
  onerror: ((e: SpeechRecognitionErrorEvent) => void) | null;
  onend: (() => void) | null;
}
interface SpeechRecognitionEvent extends Event {
  results: {
    length: number;
    [index: number]: { 0: { transcript: string }; isFinal: boolean };
  };
}
interface SpeechRecognitionErrorEvent extends Event {
  error: string;
}

export function useSpeech(onFinal: (text: string) => void) {
  const recRef = useRef<SpeechRecognitionInstance | null>(null);
  const [listening, setListening] = useState(false);
  const [interim, setInterim] = useState("");
  const [supported, setSupported] = useState(false);

  useEffect(() => {
    if (typeof window === "undefined") return;
    const Ctor = (window as unknown as {
      SpeechRecognition?: SpeechRecognitionCtor;
      webkitSpeechRecognition?: SpeechRecognitionCtor;
    }).SpeechRecognition ?? (window as unknown as {
      webkitSpeechRecognition?: SpeechRecognitionCtor;
    }).webkitSpeechRecognition;
    if (!Ctor) return;
    setSupported(true);
    const rec = new Ctor();
    rec.lang = "pt-BR";
    rec.continuous = false;
    rec.interimResults = true;
    rec.onresult = (e) => {
      let finalText = "";
      let interimText = "";
      for (let i = 0; i < e.results.length; i++) {
        const r = e.results[i];
        if (r.isFinal) finalText += r[0].transcript;
        else interimText += r[0].transcript;
      }
      setInterim(interimText);
      if (finalText.trim()) {
        setInterim("");
        onFinal(finalText.trim());
      }
    };
    rec.onerror = () => setListening(false);
    rec.onend = () => {
      setListening(false);
      setInterim("");
    };
    recRef.current = rec;
    return () => {
      try { rec.stop(); } catch { /* noop */ }
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const start = () => {
    if (!recRef.current || listening) return;
    try {
      recRef.current.start();
      setListening(true);
    } catch { /* noop */ }
  };
  const stop = () => {
    if (!recRef.current) return;
    try { recRef.current.stop(); } catch { /* noop */ }
  };

  return { listening, interim, supported, start, stop };
}

// ------- TTS via Google (voz natural, sem robótica) -------

let currentAudio: HTMLAudioElement | null = null;
let sharedCtx: AudioContext | null = null;

// Desbloqueia áudio no iOS (Safari barra play() sem gesto recente).
// Chame em todo gesto do usuário (enviar, tocar botão).
export async function primeAudio() {
  try {
    if (typeof window === "undefined") return;
    const Ctor =
      window.AudioContext ??
      (window as unknown as { webkitAudioContext?: typeof AudioContext }).webkitAudioContext;
    if (!Ctor) return;
    if (!sharedCtx) sharedCtx = new Ctor();
    if (sharedCtx.state === "suspended") await sharedCtx.resume().catch(() => {});
    const buf = sharedCtx.createBuffer(1, 1, 22050);
    const src = sharedCtx.createBufferSource();
    src.buffer = buf;
    src.connect(sharedCtx.destination);
    src.start(0);
  } catch {
    /* sem áudio */
  }
}

export function cancelSpeech() {
  if (currentAudio) {
    currentAudio.pause();
    currentAudio = null;
  }
  if (typeof window !== "undefined") window.speechSynthesis?.cancel();
}

// ------- TTS: voz masculina do aparelho (estilo Jarvis) -------

function pickMaleVoice(): SpeechSynthesisVoice | null {
  if (typeof window === "undefined" || !window.speechSynthesis) return null;
  const all = window.speechSynthesis.getVoices();
  const pt = all.filter((v) => (v.lang || "").toLowerCase().replace("_", "-").startsWith("pt"));
  const pool = pt.length ? pt : all;
  if (!pool.length) return null;
  const male = pool.find((v) =>
    /antonio|daniel|felipe|thiago|rafael|diego|paulo|carlos|joao|pedro|lucas|gabriel|male|masculin|homem/i.test(v.name),
  );
  if (male) return male;
  const notFemale = pool.find(
    (v) => !/maria|luciana|helena|ana|fernanda|camila|beatriz|female|femin/i.test(v.name),
  );
  return notFemale ?? pool[0] ?? null;
}

function splitSentences(text: string): string[] {
  const parts = text.match(/[^.!?…\n]+[.!?…\n]+|[^.!?…\n]+$/g);
  const clean = (parts ?? [text]).map((s) => s.trim()).filter(Boolean);
  return clean.length ? clean : [text];
}

// Remove markdown/codigo para a VOZ nao ler "asterisco, barra, etc".
// O chat continua exibindo formatado; so a fala e limpa.
export function cleanForSpeech(text: string): string {
  let s = text;
  s = s.replace(/```[\s\S]*?```/g, " codigo no chat. ");
  s = s.replace(/`([^`]+)`/g, "$1");
  s = s.replace(/!\[([^\]]*)\]\([^)]+\)/g, "$1");
  s = s.replace(/\[([^\]]+)\]\([^)]+\)/g, "$1");
  s = s.replace(/(\*\*|__)(.*?)\1/g, "$2");
  s = s.replace(/(^|[\s(])[*_~]([^*_~\n]+)[*_~]/g, "$1$2");
  s = s.replace(/^#{1,6}\s+/gm, "");
  s = s.replace(/^\s*[-*+]\s+/gm, "");
  s = s.replace(/^\s*\d+[.)]\s+/gm, "");
  s = s.replace(/^\s*>\s?/gm, "");
  s = s.replace(/\s+/g, " ").trim();
  return s;
}

export function pauseSpeech(): boolean {
  if (currentAudio && !currentAudio.paused) {
    currentAudio.pause();
    return true;
  }
  if (typeof window !== "undefined" && window.speechSynthesis?.speaking && !window.speechSynthesis.paused) {
    window.speechSynthesis.pause();
    return true;
  }
  return false;
}

export function resumeSpeech(): boolean {
  if (currentAudio && currentAudio.paused) {
    void currentAudio.play().catch(() => {});
    return true;
  }
  if (typeof window !== "undefined" && window.speechSynthesis?.paused) {
    window.speechSynthesis.resume();
    return true;
  }
  return false;
}

export async function speak(
  text: string,
  opts: { onStart?: () => void; onEnd?: () => void; bridge?: { url: string; token: string } | null } = {},
) {
  if (typeof window === "undefined" || !text.trim()) {
    opts.onEnd?.();
    return;
  }
  const clean = cleanForSpeech(text);
  if (!clean) {
    opts.onEnd?.();
    return;
  }

  const playBlob = (blob: Blob): Promise<void> => {
    const url = URL.createObjectURL(blob);
    const audio = new Audio(url);
    currentAudio = audio;
    audio.onplay = () => opts.onStart?.();
    audio.onended = () => {
      currentAudio = null;
      URL.revokeObjectURL(url);
      opts.onEnd?.();
    };
    audio.onerror = () => {
      currentAudio = null;
      URL.revokeObjectURL(url);
      opts.onEnd?.();
    };
    return audio.play();
  };

  // 1) Bridge direta (voz "Antônio" do PC) — cliente → bridge, sem depender
  //    da Vercel. Funciona no PC e no celular quando a URL é o túnel HTTPS.
  if (opts.bridge?.url && opts.bridge?.token && !mixedContentBlocked(opts.bridge.url)) {
    for (let attempt = 0; attempt < 4; attempt++) {
      if (attempt > 0) await new Promise((r) => setTimeout(r, 1500));
      const ctrl = new AbortController();
      const timer = setTimeout(() => ctrl.abort(), 60000);
      try {
        const res = await fetch(`${opts.bridge.url.replace(/\/$/, "")}/speak`, {
          method: "POST",
          headers: { "Content-Type": "application/json", Authorization: `Bearer ${opts.bridge.token}` },
          body: JSON.stringify({ text: clean.slice(0, 800) }),
          signal: ctrl.signal,
        });
        clearTimeout(timer);
        if (res.ok) {
          const blob = await res.blob();
          if (blob.size > 0) {
            await playBlob(blob);
            return;
          }
        }
      } catch {
        clearTimeout(timer);
        /* tenta de novo */
      }
    }
  }

  // 2) /api/tts (Vercel → bridge, ou Gemini "Charon"/Google como fallback)
  try {
    const res = await fetch(
      `${window.location.origin}/api/tts`,
      {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ text: clean.slice(0, 800) }),
      },
    );
    if (res.ok) {
      const blob = await res.blob();
      if (blob.size > 0) {
        await playBlob(blob);
        return;
      }
    }
  } catch {
    /* cai para a voz do aparelho */
  }

  // 3) Fallback: voz do aparelho
  if (!window.speechSynthesis) {
    opts.onEnd?.();
    return;
  }
  try {
    window.speechSynthesis.cancel();
    if (currentAudio) {
      currentAudio.pause();
      currentAudio = null;
    }
    const voice = pickMaleVoice();
    const chunks = splitSentences(clean);
    let started = false;
    chunks.forEach((part, i) => {
      const utterance = new SpeechSynthesisUtterance(part);
      utterance.lang = "pt-BR";
      utterance.rate = 1.05;
      utterance.pitch = 1.0;
      utterance.volume = 1.0;
      if (voice) utterance.voice = voice;
      utterance.onstart = () => {
        if (!started) {
          started = true;
          opts.onStart?.();
        }
      };
      if (i === chunks.length - 1) {
        utterance.onend = () => opts.onEnd?.();
        utterance.onerror = () => opts.onEnd?.();
      }
      window.speechSynthesis.speak(utterance);
    });
    setTimeout(() => {
      if (!started) opts.onEnd?.();
    }, 500);
  } catch {
    opts.onEnd?.();
  }
}
