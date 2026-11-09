import { jsxs, jsx, Fragment } from "react/jsx-runtime";
import * as React from "react";
import { useState, useRef, useEffect, useCallback, useMemo } from "react";
import { useRouter, isRedirect } from "@tanstack/react-router";
import ReactMarkdown from "react-markdown";
import { ArrowLeft, Sparkles, Palette, Brain, Puzzle, MessageCircle, Radio, Volume2, VolumeX, Play, Pause, PlugZap, Plug, MonitorOff, Monitor, History, Trash2, X, QrCode, Paperclip, ImagePlus, Camera, MicOff, Mic, Square, Send, Plus } from "lucide-react";
import { c as createSsrRpc, l as listSkillsFn, a as askJarvis, e as extractMemories, b as createSkillFn } from "./router-BJYzSWkm.js";
import { c as createServerFn } from "./server-CJhJqHaa.js";
import { z } from "zod";
import QRCode from "qrcode";
import { clsx } from "clsx";
import { twMerge } from "tailwind-merge";
import "@tanstack/react-query";
import "./video.server-C5PlGzKx.js";
import "@ai-sdk/openai-compatible";
import "@ai-sdk/google";
import "node:fs";
import "node:path";
import "node:os";
import "ai";
import "./integrations.server-faX8O44t.js";
import "node:async_hooks";
import "h3-v2";
import "@tanstack/router-core";
import "@tanstack/router-core/ssr/client";
import "@tanstack/router-core/ssr/server";
import "seroval";
import "@tanstack/history";
import "@tanstack/react-router/ssr/server";
function useServerFn(serverFn) {
  const router = useRouter();
  return React.useCallback(async (...args) => {
    try {
      const res = await serverFn(...args);
      if (isRedirect(res)) throw res;
      return res;
    } catch (err) {
      if (isRedirect(err)) {
        err.options._fromLocation = router.stores.location.get();
        return router.navigate(router.resolveRedirect(err).options);
      }
      throw err;
    }
  }, [router, serverFn]);
}
const listIntegrationsFn = createServerFn({
  method: "GET"
}).handler(createSsrRpc("c6cada82908ce8a23ff590500d7d8f26833424c38dd24f91a26896f208953f98"));
const SaveSchema = z.object({
  id: z.string().optional(),
  name: z.string().min(1),
  kind: z.enum(["mcp", "n8n", "webhook"]),
  url: z.string().min(1),
  token: z.string().optional(),
  enabled: z.boolean().optional()
});
const saveIntegrationFn = createServerFn({
  method: "POST"
}).inputValidator((d) => SaveSchema.parse(d)).handler(createSsrRpc("78071c329b114cb049c72d2e72db756c61b3f0f40763f3006707080bb892bbd7"));
const deleteIntegrationFn = createServerFn({
  method: "POST"
}).inputValidator((d) => z.object({
  id: z.string().min(1)
}).parse(d)).handler(createSsrRpc("5b11627af9337e4f569c5c4f07cfcb7f53292616776d17e9523dc6249e89cbe5"));
const toggleIntegrationFn = createServerFn({
  method: "POST"
}).inputValidator((d) => z.object({
  id: z.string(),
  enabled: z.boolean()
}).parse(d)).handler(createSsrRpc("26d3e00349fb0d4a90d8c9f5b5252d241237d07350c365b36fd5a7ad3a2168a6"));
const testIntegrationFn = createServerFn({
  method: "POST"
}).inputValidator((d) => z.object({
  id: z.string()
}).parse(d)).handler(createSsrRpc("56c9bdbbe2f46b42e9d7ca7a6862de63407751d84fda22195172f98e3fc329ce"));
const TranscribeInput = z.object({
  dataUrl: z.string().min(32),
  filename: z.string().default("recording.webm")
});
const transcribeAudio = createServerFn({
  method: "POST"
}).inputValidator((data) => TranscribeInput.parse(data)).handler(createSsrRpc("b7af3bb58bcfc3bd7fbc06940306a92b7d030d22c0f1eda5c0a3220fb15667c6"));
function newId() {
  return Math.random().toString(36).slice(2, 10);
}
const MAX_BYTES = {
  image: 12 * 1024 * 1024,
  video: 60 * 1024 * 1024,
  audio: 20 * 1024 * 1024,
  pdf: 18 * 1024 * 1024,
  file: 8 * 1024 * 1024
};
const ACCEPT_ATTR = "image/*,video/*,audio/*,application/pdf,text/plain,text/markdown,text/csv,application/json";
const IMAGE_OK = ["image/png", "image/jpeg", "image/webp", "image/gif", "image/heic", "image/heif"];
const TEXTY_OK = ["text/plain", "text/markdown", "text/csv", "application/json", "text/x-markdown"];
function formatBytes(n) {
  if (!n && n !== 0) return "";
  if (n < 1024) return `${n} B`;
  if (n < 1024 * 1024) return `${(n / 1024).toFixed(0)} KB`;
  return `${(n / (1024 * 1024)).toFixed(1)} MB`;
}
function kindFromMime(mime, url = "") {
  const m = (mime || "").toLowerCase();
  if (m === "application/pdf") return "pdf";
  if (m.startsWith("image/")) return "image";
  if (m.startsWith("video/")) return "video";
  if (m.startsWith("audio/")) return "audio";
  if (/\.(png|jpe?g|gif|webp|bmp|svg|heic|heif)(\?|$)/i.test(url)) return "image";
  if (/\.(mp4|webm|mov|m4v|avi|mkv)(\?|$)/i.test(url)) return "video";
  if (/\.(mp3|wav|m4a|ogg|opus|flac|aac|webm)(\?|$)/i.test(url)) return "audio";
  if (/\.pdf(\?|$)/i.test(url)) return "pdf";
  return "file";
}
function guessMimeFromUrl(url) {
  const m = url.toLowerCase().match(
    /\.(png|jpe?g|gif|webp|bmp|svg|heic|heif|mp4|webm|mov|m4v|mp3|wav|m4a|ogg|opus|flac|aac|pdf|txt|md|csv|json)(\?|$)/
  );
  if (!m) return "application/octet-stream";
  const ext = m[1];
  const map = {
    png: "image/png",
    jpg: "image/jpeg",
    jpeg: "image/jpeg",
    gif: "image/gif",
    webp: "image/webp",
    bmp: "image/bmp",
    svg: "image/svg+xml",
    heic: "image/heic",
    heif: "image/heif",
    mp4: "video/mp4",
    webm: "video/webm",
    mov: "video/quicktime",
    m4v: "video/x-m4v",
    mp3: "audio/mpeg",
    wav: "audio/wav",
    m4a: "audio/mp4",
    ogg: "audio/ogg",
    opus: "audio/ogg",
    flac: "audio/flac",
    aac: "audio/aac",
    pdf: "application/pdf",
    txt: "text/plain",
    md: "text/markdown",
    csv: "text/csv",
    json: "application/json"
  };
  return map[ext] ?? "application/octet-stream";
}
function validateFile(file) {
  const mediaType = (file.type || guessMimeFromUrl(file.name)).toLowerCase();
  const kind = kindFromMime(mediaType, file.name);
  if (kind === "file" && !TEXTY_OK.includes(mediaType)) {
    return `${file.name}: formato não suportado (${mediaType || "desconhecido"}). Aceito: imagem, vídeo, áudio, PDF ou texto.`;
  }
  if (kind === "image" && !IMAGE_OK.includes(mediaType)) {
    return `${file.name}: imagem em formato não suportado (${mediaType}). Use PNG, JPEG, WEBP, GIF ou HEIC.`;
  }
  const max = MAX_BYTES[kind];
  if (file.size > max) {
    return `${file.name}: ${formatBytes(file.size)} excede o limite de ${formatBytes(max)} para ${kind}.`;
  }
  if (file.size === 0) return `${file.name}: arquivo vazio.`;
  return null;
}
function fileToDataUrl(file) {
  return new Promise((resolve, reject) => {
    const fr = new FileReader();
    fr.onload = () => resolve(String(fr.result));
    fr.onerror = () => reject(new Error("Falha ao ler arquivo"));
    fr.readAsDataURL(file);
  });
}
function fileToText(file) {
  return new Promise((resolve, reject) => {
    const fr = new FileReader();
    fr.onload = () => resolve(String(fr.result));
    fr.onerror = () => reject(new Error("Falha ao ler texto"));
    fr.readAsText(file);
  });
}
function inIframe() {
  try {
    return typeof window !== "undefined" && window.self !== window.top;
  } catch {
    return true;
  }
}
function canScreenShare() {
  if (typeof navigator === "undefined") return false;
  return typeof navigator.mediaDevices?.getDisplayMedia === "function";
}
async function startScreenShare() {
  const md = navigator.mediaDevices;
  if (!md?.getDisplayMedia) {
    throw new Error(
      "Este navegador/dispositivo não suporta captura de tela (iOS e Android não permitem)."
    );
  }
  try {
    return await md.getDisplayMedia({ video: true, audio: false });
  } catch (e) {
    const name = e?.name ?? "";
    if (name === "NotAllowedError" && inIframe()) {
      throw new Error(
        "A captura de tela está bloqueada dentro da pré-visualização. Abra o app em uma aba própria e tente novamente."
      );
    }
    if (name === "NotAllowedError") throw new Error("Permissão de captura de tela negada/cancelada.");
    throw new Error(e instanceof Error ? e.message : "Falha ao iniciar captura de tela.");
  }
}
async function startVisionStream(preferCameraFacing = "environment") {
  if (canScreenShare()) {
    try {
      return { stream: await startScreenShare(), source: "screen" };
    } catch (e) {
      const msg = e instanceof Error ? e.message : "";
      if (/negada|cancelada/i.test(msg)) throw e;
      try {
        return {
          stream: await startCamera(preferCameraFacing),
          source: "camera",
          note: "Tela indisponível aqui — usando a câmera como visão."
        };
      } catch {
        throw e;
      }
    }
  }
  return {
    stream: await startCamera(preferCameraFacing),
    source: "camera",
    note: "Captura de tela não é suportada neste dispositivo — usando a câmera como visão."
  };
}
async function startCamera(facing = "user") {
  if (!navigator.mediaDevices?.getUserMedia) throw new Error("Câmera indisponível neste navegador.");
  try {
    return await navigator.mediaDevices.getUserMedia({
      video: { facingMode: facing, width: { ideal: 1280 } },
      audio: false
    });
  } catch (e) {
    const name = e?.name ?? "";
    if (name === "NotAllowedError") throw new Error("Permissão de câmera negada.");
    if (name === "NotFoundError") throw new Error("Nenhuma câmera encontrada.");
    throw new Error(e instanceof Error ? e.message : "Falha ao abrir a câmera.");
  }
}
async function captureFrame(stream, maxWidth = 1280) {
  const video = document.createElement("video");
  video.muted = true;
  video.playsInline = true;
  video.setAttribute("playsinline", "true");
  video.style.cssText = "position:fixed;left:-9999px;top:0;width:2px;height:2px;opacity:0";
  document.body.appendChild(video);
  video.srcObject = stream;
  try {
    try {
      await video.play();
    } catch {
    }
    for (let i = 0; i < 60 && !video.videoWidth; i++) {
      await new Promise((r) => setTimeout(r, 50));
    }
    if (!video.videoWidth) throw new Error("Não foi possível ler o quadro do vídeo.");
    const w = video.videoWidth;
    const h = video.videoHeight || 720;
    const scale = Math.min(1, maxWidth / w);
    const canvas = document.createElement("canvas");
    canvas.width = Math.round(w * scale);
    canvas.height = Math.round(h * scale);
    const ctx = canvas.getContext("2d");
    if (!ctx) throw new Error("Canvas indisponível");
    ctx.drawImage(video, 0, 0, canvas.width, canvas.height);
    return canvas.toDataURL("image/jpeg", 0.7);
  } finally {
    video.pause();
    video.srcObject = null;
    video.remove();
  }
}
async function extractVideoFrames(source, count = 4, maxWidth = 900) {
  const url = typeof source === "string" ? source : URL.createObjectURL(source);
  const video = document.createElement("video");
  video.muted = true;
  video.crossOrigin = "anonymous";
  video.preload = "auto";
  video.src = url;
  const frames = [];
  try {
    await new Promise((resolve, reject) => {
      const to = setTimeout(() => reject(new Error("Tempo esgotado ao ler o vídeo.")), 2e4);
      video.onloadedmetadata = () => {
        clearTimeout(to);
        resolve();
      };
      video.onerror = () => {
        clearTimeout(to);
        reject(new Error("Não foi possível decodificar o vídeo."));
      };
    });
    const duration = Number.isFinite(video.duration) && video.duration > 0 ? video.duration : 0;
    const w = video.videoWidth || 640;
    const h = video.videoHeight || 360;
    const scale = Math.min(1, maxWidth / w);
    const canvas = document.createElement("canvas");
    canvas.width = Math.round(w * scale);
    canvas.height = Math.round(h * scale);
    const ctx = canvas.getContext("2d");
    if (!ctx) throw new Error("Canvas indisponível");
    const times = duration ? Array.from({ length: count }, (_, i) => duration * (i + 0.5) / count) : [0];
    for (const t of times) {
      await new Promise((resolve, reject) => {
        const to = setTimeout(() => reject(new Error("Tempo esgotado ao extrair quadro.")), 15e3);
        video.onseeked = () => {
          clearTimeout(to);
          resolve();
        };
        video.onerror = () => {
          clearTimeout(to);
          reject(new Error("Falha ao extrair quadro."));
        };
        video.currentTime = Math.min(t, Math.max(0, duration - 0.05));
      });
      ctx.drawImage(video, 0, 0, canvas.width, canvas.height);
      frames.push(canvas.toDataURL("image/jpeg", 0.7));
    }
  } finally {
    video.src = "";
    if (typeof source !== "string") URL.revokeObjectURL(url);
  }
  return frames;
}
function getRecCtor() {
  if (typeof window === "undefined") return null;
  const w = window;
  return w.SpeechRecognition ?? w.webkitSpeechRecognition ?? null;
}
const WAKE_RE = /\b(jarvis|jarves|jarvys|jarvi[sz]|j[áa]rvis|charves|jarbas)\b/i;
function speechRecognitionSupported() {
  if (typeof window === "undefined") return false;
  const w = window;
  return !!(w.SpeechRecognition ?? w.webkitSpeechRecognition);
}
function useWake({
  mode,
  onWake,
  paused,
  hold
}) {
  const [error, setError] = useState(null);
  const [armed, setArmed] = useState(false);
  const [claps, setClaps] = useState(0);
  const onWakeRef = useRef(onWake);
  const pausedRef = useRef(!!paused);
  useEffect(() => {
    onWakeRef.current = onWake;
  }, [onWake]);
  useEffect(() => {
    pausedRef.current = !!paused;
  }, [paused]);
  const wantWord = (mode === "word" || mode === "both") && !hold;
  const wantClap = mode === "clap" || mode === "both";
  const active = mode !== "off";
  const fire = () => {
    if (pausedRef.current) return;
    onWakeRef.current();
  };
  useEffect(() => {
    if (!active || !wantWord) return;
    const Ctor = getRecCtor();
    if (!Ctor) {
      setError("Reconhecimento de voz não suportado neste navegador.");
      return;
    }
    let stopped = false;
    let rec = null;
    let restartTimer;
    let backoff = 400;
    const schedule = (ms) => {
      if (stopped) return;
      if (restartTimer) window.clearTimeout(restartTimer);
      restartTimer = window.setTimeout(spin, ms);
    };
    function spin() {
      if (stopped) return;
      try {
        rec = new Ctor();
      } catch {
        schedule(1500);
        return;
      }
      rec.lang = "pt-BR";
      rec.continuous = true;
      rec.interimResults = true;
      rec.onresult = (e) => {
        for (let i = 0; i < e.results.length; i++) {
          const t = e.results[i][0].transcript;
          if (WAKE_RE.test(t)) {
            fire();
            try {
              rec?.abort ? rec.abort() : rec?.stop();
            } catch {
            }
            return;
          }
        }
      };
      rec.onerror = (e) => {
        const err = e.error;
        if (err === "not-allowed" || err === "service-not-allowed") {
          setError("Permissão de microfone negada.");
          setArmed(false);
          stopped = true;
          return;
        }
        backoff = Math.min(backoff * 2, 4e3);
        schedule(backoff);
      };
      rec.onend = () => {
        if (stopped) return;
        schedule(backoff);
      };
      try {
        rec.start();
        backoff = 400;
        setArmed(true);
        setError(null);
      } catch {
        schedule(800);
      }
    }
    const startDelay = wantClap ? 700 : 0;
    const boot = window.setTimeout(spin, startDelay);
    return () => {
      stopped = true;
      window.clearTimeout(boot);
      if (restartTimer) window.clearTimeout(restartTimer);
      try {
        rec?.abort ? rec.abort() : rec?.stop();
      } catch {
      }
      if (!wantClap) setArmed(false);
    };
  }, [active, wantWord, wantClap]);
  useEffect(() => {
    if (!active || !wantClap) return;
    let stopped = false;
    let stream = null;
    let ctx = null;
    let raf = 0;
    void (async () => {
      try {
        stream = await navigator.mediaDevices.getUserMedia({
          audio: { echoCancellation: false, noiseSuppression: false, autoGainControl: false }
        });
      } catch {
        setError("Permissão de microfone negada para detectar palmas.");
        return;
      }
      if (stopped) {
        stream.getTracks().forEach((t) => t.stop());
        return;
      }
      const Ctor = window.AudioContext ?? window.webkitAudioContext;
      if (!Ctor) return;
      ctx = new Ctor();
      if (ctx.state === "suspended") await ctx.resume().catch(() => {
      });
      const src = ctx.createMediaStreamSource(stream);
      const analyser = ctx.createAnalyser();
      analyser.fftSize = 1024;
      src.connect(analyser);
      const buf = new Float32Array(analyser.fftSize);
      let lastClap = 0;
      let firstClap = 0;
      let cooldownUntil = 0;
      const tick = () => {
        if (stopped || !ctx) return;
        analyser.getFloatTimeDomainData(buf);
        let peak = 0;
        for (let i = 0; i < buf.length; i++) {
          const v = Math.abs(buf[i]);
          if (v > peak) peak = v;
        }
        const now = performance.now();
        if (peak > 0.35 && now - lastClap > 120 && now > cooldownUntil) {
          lastClap = now;
          if (firstClap && now - firstClap < 1e3) {
            firstClap = 0;
            setClaps(0);
            cooldownUntil = now + 1500;
            fire();
          } else {
            firstClap = now;
            setClaps(1);
            window.setTimeout(() => setClaps(0), 1100);
          }
        }
        raf = requestAnimationFrame(tick);
      };
      raf = requestAnimationFrame(tick);
      setArmed(true);
    })();
    return () => {
      stopped = true;
      setArmed(false);
      cancelAnimationFrame(raf);
      stream?.getTracks().forEach((t) => t.stop());
      void ctx?.close().catch(() => {
      });
    };
  }, [active, wantClap]);
  return { armed, error, claps };
}
const STORAGE_KEY$1 = "jarvis:bridge:v1";
function loadBridge() {
  if (typeof window === "undefined") return null;
  try {
    const raw = window.localStorage.getItem(STORAGE_KEY$1);
    if (!raw) return null;
    const p = JSON.parse(raw);
    if (p && typeof p.url === "string" && typeof p.token === "string") {
      return { url: p.url.replace(/\/$/, ""), token: p.token };
    }
    return null;
  } catch {
    return null;
  }
}
function saveBridge(cfg) {
  if (typeof window === "undefined") return;
  if (!cfg) {
    window.localStorage.removeItem(STORAGE_KEY$1);
    return;
  }
  window.localStorage.setItem(
    STORAGE_KEY$1,
    JSON.stringify({ url: cfg.url.replace(/\/$/, ""), token: cfg.token })
  );
}
function mixedContentBlocked(url) {
  if (typeof window === "undefined") return false;
  if (window.location.protocol !== "https:") return false;
  if (!/^http:\/\//i.test(url)) return false;
  const host = url.replace(/^http:\/\//i, "").split(/[:/]/)[0] ?? "";
  return !(host === "localhost" || host === "127.0.0.1" || host === "[::1]" || host.endsWith(".localhost"));
}
async function call(cfg, path, body, timeoutMs = 8e3) {
  if (mixedContentBlocked(cfg.url)) {
    throw new Error(
      "Bloqueado pelo navegador (conteúdo misto): esta página é HTTPS e o endereço da bridge é HTTP em rede local. Use um túnel HTTPS (ex: ngrok/cloudflared) apontando para o agente, ou abra o app em HTTP."
    );
  }
  let res = null;
  for (let attempt = 0; attempt < 3; attempt++) {
    const ctrl = new AbortController();
    const timer = setTimeout(() => ctrl.abort(), timeoutMs);
    try {
      res = await fetch(`${cfg.url}${path}`, {
        method: body === void 0 ? "GET" : "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${cfg.token}`
        },
        body: body === void 0 ? void 0 : JSON.stringify(body),
        signal: ctrl.signal
      });
      clearTimeout(timer);
      break;
    } catch (e) {
      clearTimeout(timer);
      if (e instanceof DOMException && e.name === "AbortError") {
        throw new Error(
          `Sem resposta em ${timeoutMs / 1e3}s de ${cfg.url}. Verifique se o agente está rodando e se o endereço/porta estão corretos (mesma rede).`
        );
      }
      if (attempt >= 2) {
        throw new Error(
          `Não foi possível alcançar ${cfg.url}. Agente rodando? Se estiver em outro dispositivo, use JARVIS_HOST=0.0.0.0 e o IP local. (${e instanceof Error ? e.message : String(e)})`
        );
      }
      await new Promise((r) => setTimeout(r, 1200));
    }
  }
  if (!res) throw new Error(`Não foi possível alcançar ${cfg.url}.`);
  const text = await res.text();
  let data;
  try {
    data = text ? JSON.parse(text) : {};
  } catch {
    data = { error: `Invalid response: ${text.slice(0, 200)}` };
  }
  if (!res.ok) {
    const errMsg = res.status === 401 ? "Token inválido — copie exatamente o token impresso no terminal do agente." : data?.error ?? `HTTP ${res.status}`;
    throw new Error(errMsg);
  }
  return data;
}
async function health(cfg) {
  return await call(cfg, "/health");
}
async function runTool(cfg, name, input) {
  switch (name) {
    case "shell_exec":
      return call(cfg, "/shell", {
        cmd: input.cmd,
        cwd: input.cwd,
        timeout: input.timeout
      }, 3e4);
    case "fs_read":
      return call(cfg, "/read", { path: input.path }, 2e4);
    case "image_view":
      return call(cfg, "/image", { path: input.path }, 2e4);
    case "fs_write":
      return call(cfg, "/write", {
        path: input.path,
        content: input.content ?? "",
        append: input.append ?? false
      }, 2e4);
    case "fs_list":
      return call(cfg, "/list", { path: input.path ?? "." }, 2e4);
    case "open_app":
      return call(cfg, "/open", { target: input.target, args: input.args }, 2e4);
    case "type_text":
      return call(cfg, "/type", { text: input.text, window: input.window }, 3e4);
    case "speak_text":
      return call(cfg, "/speak", { text: input.text }, 9e4);
    case "take_screenshot":
      return call(cfg, "/screenshot", {}, 3e4);
    default:
      throw new Error(`Unknown local tool: ${name}`);
  }
}
const DRAFT_KEY = "jarvis:bridge:draft:v1";
function loadBridgeDraft() {
  if (typeof window === "undefined") return null;
  try {
    const raw = window.localStorage.getItem(DRAFT_KEY);
    if (!raw) return null;
    const p = JSON.parse(raw);
    if (p && typeof p.url === "string" && typeof p.token === "string") {
      return { url: p.url, token: p.token };
    }
    return null;
  } catch {
    return null;
  }
}
function saveBridgeDraft(draft) {
  if (typeof window === "undefined") return;
  try {
    window.localStorage.setItem(DRAFT_KEY, JSON.stringify(draft));
  } catch {
  }
}
const PAIR_HASH_KEY = "jarvis-bridge";
function toBase64Url(s) {
  const b64 = btoa(unescape(encodeURIComponent(s)));
  return b64.replace(/\+/g, "-").replace(/\//g, "_").replace(/=+$/, "");
}
function fromBase64Url(s) {
  const b64 = s.replace(/-/g, "+").replace(/_/g, "/");
  const padded = b64 + "=".repeat((4 - b64.length % 4) % 4);
  return decodeURIComponent(escape(atob(padded)));
}
function pairingUrl(cfg) {
  const payload = toBase64Url(JSON.stringify({ u: cfg.url.replace(/\/$/, ""), t: cfg.token }));
  const { origin, pathname } = window.location;
  return `${origin}${pathname}#${PAIR_HASH_KEY}=${payload}`;
}
function readPairingFromHash() {
  if (typeof window === "undefined") return null;
  const hash = window.location.hash.replace(/^#/, "");
  if (!hash.startsWith(`${PAIR_HASH_KEY}=`)) return null;
  try {
    const parsed = JSON.parse(fromBase64Url(hash.slice(PAIR_HASH_KEY.length + 1)));
    if (typeof parsed.u !== "string" || typeof parsed.t !== "string") return null;
    return { url: parsed.u.replace(/\/$/, ""), token: parsed.t };
  } catch {
    return null;
  } finally {
    try {
      window.history.replaceState(null, "", window.location.pathname + window.location.search);
    } catch {
    }
  }
}
function useSpeech(onFinal) {
  const recRef = useRef(null);
  const [listening, setListening] = useState(false);
  const [interim, setInterim] = useState("");
  const [supported, setSupported] = useState(false);
  useEffect(() => {
    if (typeof window === "undefined") return;
    const Ctor = window.SpeechRecognition ?? window.webkitSpeechRecognition;
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
      try {
        rec.stop();
      } catch {
      }
    };
  }, []);
  const start = () => {
    if (!recRef.current || listening) return;
    try {
      recRef.current.start();
      setListening(true);
    } catch {
    }
  };
  const stop = () => {
    if (!recRef.current) return;
    try {
      recRef.current.stop();
    } catch {
    }
  };
  return { listening, interim, supported, start, stop };
}
let currentAudio = null;
let sharedCtx = null;
async function primeAudio() {
  try {
    if (typeof window === "undefined") return;
    const Ctor = window.AudioContext ?? window.webkitAudioContext;
    if (!Ctor) return;
    if (!sharedCtx) sharedCtx = new Ctor();
    if (sharedCtx.state === "suspended") await sharedCtx.resume().catch(() => {
    });
    const buf = sharedCtx.createBuffer(1, 1, 22050);
    const src = sharedCtx.createBufferSource();
    src.buffer = buf;
    src.connect(sharedCtx.destination);
    src.start(0);
  } catch {
  }
}
function cancelSpeech() {
  if (currentAudio) {
    currentAudio.pause();
    currentAudio = null;
  }
  if (typeof window !== "undefined") window.speechSynthesis?.cancel();
}
function pickMaleVoice() {
  if (typeof window === "undefined" || !window.speechSynthesis) return null;
  const all = window.speechSynthesis.getVoices();
  const pt = all.filter((v) => (v.lang || "").toLowerCase().replace("_", "-").startsWith("pt"));
  const pool = pt.length ? pt : all;
  if (!pool.length) return null;
  const male = pool.find(
    (v) => /antonio|daniel|felipe|thiago|rafael|diego|paulo|carlos|joao|pedro|lucas|gabriel|male|masculin|homem/i.test(v.name)
  );
  if (male) return male;
  const notFemale = pool.find(
    (v) => !/maria|luciana|helena|ana|fernanda|camila|beatriz|female|femin/i.test(v.name)
  );
  return notFemale ?? pool[0] ?? null;
}
function splitSentences(text) {
  const parts = text.match(/[^.!?…\n]+[.!?…\n]+|[^.!?…\n]+$/g);
  const clean = (parts ?? [text]).map((s) => s.trim()).filter(Boolean);
  return clean.length ? clean : [text];
}
function cleanForSpeech(text) {
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
function pauseSpeech() {
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
function resumeSpeech() {
  if (currentAudio && currentAudio.paused) {
    void currentAudio.play().catch(() => {
    });
    return true;
  }
  if (typeof window !== "undefined" && window.speechSynthesis?.paused) {
    window.speechSynthesis.resume();
    return true;
  }
  return false;
}
async function speak(text, opts = {}) {
  if (typeof window === "undefined" || !text.trim()) {
    opts.onEnd?.();
    return;
  }
  const clean = cleanForSpeech(text);
  if (!clean) {
    opts.onEnd?.();
    return;
  }
  const playBlob = (blob) => {
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
  if (opts.bridge?.url && opts.bridge?.token && !mixedContentBlocked(opts.bridge.url)) {
    for (let attempt = 0; attempt < 4; attempt++) {
      if (attempt > 0) await new Promise((r) => setTimeout(r, 1500));
      const ctrl = new AbortController();
      const timer = setTimeout(() => ctrl.abort(), 6e4);
      try {
        const res = await fetch(`${opts.bridge.url.replace(/\/$/, "")}/speak`, {
          method: "POST",
          headers: { "Content-Type": "application/json", Authorization: `Bearer ${opts.bridge.token}` },
          body: JSON.stringify({ text: clean.slice(0, 800) }),
          signal: ctrl.signal
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
      }
    }
  }
  try {
    const res = await fetch(
      `${window.location.origin}/api/tts`,
      {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ text: clean.slice(0, 800) })
      }
    );
    if (res.ok) {
      const blob = await res.blob();
      if (blob.size > 0) {
        await playBlob(blob);
        return;
      }
    }
  } catch {
  }
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
      utterance.pitch = 1;
      utterance.volume = 1;
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
const THEMES = [
  { id: "blue", label: "Azul", dot: "#38d6ff" },
  { id: "red", label: "Vermelho", dot: "#ff5252" },
  { id: "purple", label: "Roxo", dot: "#b366ff" },
  { id: "yellow", label: "Amarelo", dot: "#ffe14d" },
  { id: "bw", label: "P&B", dot: "#e8e8e8" },
  { id: "brown", label: "Marrom", dot: "#c08a4d" },
  { id: "flame", label: "Chama", dot: "#ffb14d" }
];
const COVER = {
  blue: { filter: "hue-rotate(165deg) saturate(1.05)", status: "arc reactor" },
  red: { filter: void 0, status: "mark protocol" },
  purple: { filter: "hue-rotate(280deg) saturate(1.1)", status: "phantom protocol" },
  yellow: { filter: "hue-rotate(75deg) saturate(1.1)", status: "solar protocol" },
  bw: { filter: "grayscale(1) brightness(1.05)", status: "stealth protocol" },
  brown: { filter: "hue-rotate(45deg) saturate(0.9)", status: "desert protocol" },
  flame: { filter: "hue-rotate(30deg) saturate(1.15)", status: "inferno protocol" }
};
function CoverScreen({ onExit, system = "blue" }) {
  const [ready, setReady] = useState(false);
  useEffect(() => {
    const t = window.setTimeout(() => setReady(true), 80);
    const onKey = (e) => {
      if (e.key === "Escape") onExit();
    };
    window.addEventListener("keydown", onKey);
    return () => {
      window.clearTimeout(t);
      window.removeEventListener("keydown", onKey);
    };
  }, [onExit]);
  return /* @__PURE__ */ jsxs("div", { className: "fixed inset-0 z-50 overflow-hidden bg-background", children: [
    /* @__PURE__ */ jsx(
      "div",
      {
        className: "absolute inset-0 bg-cover bg-center cover-drift",
        style: {
          backgroundImage: `url(/jarvis-cover.png)`,
          filter: COVER[system].filter
        },
        "aria-hidden": true
      }
    ),
    /* @__PURE__ */ jsx(
      "div",
      {
        className: "absolute inset-0 cover-breathe",
        style: {
          backgroundImage: "radial-gradient(circle at 50% 48%, color-mix(in oklab, var(--hud) 45%, transparent), transparent 58%)"
        }
      }
    ),
    /* @__PURE__ */ jsx(
      "div",
      {
        className: "absolute inset-0",
        style: {
          backgroundImage: "radial-gradient(circle at 50% 48%, transparent 35%, color-mix(in oklab, var(--background) 88%, transparent) 100%)"
        }
      }
    ),
    /* @__PURE__ */ jsxs("div", { className: "pointer-events-none absolute left-1/2 top-1/2 aspect-square w-[78vmin] -translate-x-1/2 -translate-y-1/2", children: [
      /* @__PURE__ */ jsx("div", { className: "absolute inset-0 rounded-full border border-hud/55 cover-spin" }),
      /* @__PURE__ */ jsx("div", { className: "absolute inset-[9%] rounded-full border border-dashed border-gold/50 cover-spin-rev" }),
      /* @__PURE__ */ jsx("div", { className: "absolute inset-[20%] rounded-full border border-foreground/25 cover-spin" }),
      /* @__PURE__ */ jsx("div", { className: "absolute inset-[32%] rounded-full border-2 border-hud/45 cover-breathe" })
    ] }),
    /* @__PURE__ */ jsx("div", { className: "pointer-events-none absolute inset-0 overflow-hidden", children: /* @__PURE__ */ jsx("div", { className: "absolute inset-x-0 top-0 h-24 bg-gradient-to-b from-hud/20 to-transparent cover-scan" }) }),
    /* @__PURE__ */ jsx("div", { className: "pointer-events-none absolute inset-0 cover-scanlines opacity-40" }),
    /* @__PURE__ */ jsxs(
      "div",
      {
        className: `relative flex h-full flex-col items-center justify-center px-6 text-center transition-all duration-1000 ${ready ? "opacity-100 blur-0" : "opacity-0 blur-md"}`,
        children: [
          /* @__PURE__ */ jsxs("p", { className: "font-mono text-[10px] uppercase tracking-[0.55em] text-muted-foreground cover-flicker", children: [
            "system status: operational — ",
            COVER[system].status
          ] }),
          /* @__PURE__ */ jsx("h1", { className: "mt-4 text-4xl font-bold tracking-[0.3em] text-hud cover-title sm:text-6xl", children: "J.A.R.V.I.S." }),
          /* @__PURE__ */ jsx("div", { className: "mt-4 h-px w-56 max-w-[70vw] bg-gradient-to-r from-transparent via-gold to-transparent" }),
          /* @__PURE__ */ jsx("p", { className: "mt-4 max-w-md font-mono text-[11px] uppercase tracking-[0.3em] text-gold/85", children: "armor integrity 98% — power levels stable" }),
          /* @__PURE__ */ jsxs(
            "button",
            {
              type: "button",
              onClick: onExit,
              className: "mt-10 inline-flex items-center gap-2 rounded-full border border-hud/70 bg-card/60 px-6 py-3 font-mono text-xs uppercase tracking-[0.3em] text-foreground backdrop-blur-sm transition-all hover:border-gold hover:shadow-hud-strong",
              children: [
                /* @__PURE__ */ jsx(ArrowLeft, { size: 14 }),
                "Voltar a interface"
              ]
            }
          )
        ]
      }
    )
  ] });
}
function cn(...inputs) {
  return twMerge(clsx(inputs));
}
const STORAGE_KEY = "jarvis:conversation:v1";
const MEMORY_KEY = "jarvis:memories:v1";
const WAKE_KEY = "jarvis:wake:v1";
const IMG_RATIOS = [{
  id: "3:4",
  label: "3:4",
  hint: "1080×1440"
}, {
  id: "4:5",
  label: "4:5",
  hint: "1080×1350"
}, {
  id: "9:16",
  label: "9:16",
  hint: "1080×1920"
}, {
  id: "quadrado",
  label: "Quadrado",
  hint: "1024×1024"
}, {
  id: "paisagem",
  label: "Paisagem",
  hint: "1280×720"
}, {
  id: "retrato",
  label: "Retrato",
  hint: "1024×1280"
}];
const GREETING = {
  role: "assistant",
  content: "Sistemas online. Ao seu dispor, senhor. Em que posso ajudá-lo?"
};
function loadMemories() {
  if (typeof window === "undefined") return [];
  try {
    const raw = window.localStorage.getItem(MEMORY_KEY);
    if (!raw) return [];
    const parsed = JSON.parse(raw);
    return Array.isArray(parsed) ? parsed.filter((m) => typeof m === "string") : [];
  } catch {
    return [];
  }
}
function normalize(s) {
  return s.toLowerCase().replace(/\s+/g, " ").trim();
}
function isMobileDevice() {
  if (typeof navigator === "undefined") return false;
  return /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(navigator.userAgent);
}
function isLoopback(url) {
  return /^(https?:\/\/)?(127\.0\.0\.1|localhost)(:\d+)?\/?$/i.test(url.trim());
}
function mergeMemories(existing, incoming) {
  const seen = new Set(existing.map(normalize));
  const merged = [...existing];
  for (const m of incoming) {
    const n = normalize(m);
    if (n && !seen.has(n)) {
      seen.add(n);
      merged.push(m);
    }
  }
  return merged.slice(-500);
}
function loadMessages() {
  if (typeof window === "undefined") return [GREETING];
  try {
    const raw = window.localStorage.getItem(STORAGE_KEY);
    if (!raw) return [GREETING];
    const parsed = JSON.parse(raw);
    return Array.isArray(parsed) && parsed.length ? parsed : [GREETING];
  } catch {
    return [GREETING];
  }
}
function Jarvis() {
  const ask = useServerFn(askJarvis);
  const extract = useServerFn(extractMemories);
  const transcribe = useServerFn(transcribeAudio);
  const skillsList = useServerFn(listSkillsFn);
  const createSkillCall = useServerFn(createSkillFn);
  const intList = useServerFn(listIntegrationsFn);
  const intSave = useServerFn(saveIntegrationFn);
  const intDelete = useServerFn(deleteIntegrationFn);
  const intToggle = useServerFn(toggleIntegrationFn);
  const intTest = useServerFn(testIntegrationFn);
  const submitSkill = async () => {
    const name = newSkillName.trim();
    const instructions = newSkillInstr.trim();
    if (!name || !instructions) {
      setNewSkillMsg("Preencha o nome e as instruções da skill, senhor.");
      return;
    }
    setNewSkillMsg(null);
    try {
      const res = await createSkillCall({
        data: {
          id: name,
          name,
          instructions
        }
      });
      if (res?.ok) {
        setNewSkillMsg(`Skill "${name}" criada. Já está na lista e ativada.`);
        setNewSkillName("");
        setNewSkillInstr("");
        const list = await skillsList({});
        setSkillsData(list ?? []);
        if (res.id) {
          setActiveSkills((prev) => prev.includes(res.id) ? prev : [...prev, res.id]);
        }
      } else {
        setNewSkillMsg(res?.error ?? "Falha ao criar a skill, senhor.");
      }
    } catch {
      setNewSkillMsg("Falha ao criar a skill, senhor.");
    }
  };
  const refreshIntegracoes = async () => {
    try {
      const r = await intList({});
      setIntegracoes(r ?? []);
    } catch {
    }
  };
  const submitIntegracao = async () => {
    if (!intForm.name.trim() || !intForm.url.trim()) {
      setIntMsg("Nome e URL são obrigatórios, senhor.");
      return;
    }
    try {
      await intSave({
        data: {
          ...intForm,
          token: intForm.token || void 0
        }
      });
      setIntForm({
        name: "",
        kind: "n8n",
        url: "http://127.0.0.1:5678",
        token: ""
      });
      setIntMsg("Integração salva, senhor.");
      await refreshIntegracoes();
    } catch (e) {
      setIntMsg(`Falha ao salvar: ${e instanceof Error ? e.message.slice(0, 160) : e}`);
    }
  };
  const testarIntegracao = async (id) => {
    setIntMsg(`Testando ${id}…`);
    try {
      const r = await intTest({
        data: {
          id
        }
      });
      setIntMsg(r.ok ? `${id}: ${r.count} ferramenta(s) online — ${r.tools?.join(", ")}` : `${id}: ${r.error}`);
    } catch (e) {
      setIntMsg(`Falha no teste: ${e instanceof Error ? e.message.slice(0, 160) : e}`);
    }
  };
  const [messages, setMessages] = useState([GREETING]);
  const [memories, setMemories] = useState([]);
  const [hydrated, setHydrated] = useState(false);
  const [input, setInput] = useState("");
  const [attachments, setAttachments] = useState([]);
  const [attachError, setAttachError] = useState(null);
  const [cameraOpen, setCameraOpen] = useState(false);
  const [imgOpen, setImgOpen] = useState(false);
  const [imgPrompt, setImgPrompt] = useState("");
  const [imgRatio, setImgRatio] = useState("3:4");
  const [loading, setLoading] = useState(false);
  const [speaking, setSpeaking] = useState(false);
  const [voicePaused, setVoicePaused] = useState(false);
  const [voiceOn, setVoiceOn] = useState(true);
  const [wakeMode, setWakeMode] = useState("off");
  const [wakeOpen, setWakeOpen] = useState(false);
  const [srSupported, setSrSupported] = useState(true);
  const [clearFlash, setClearFlash] = useState(false);
  useEffect(() => {
    setSrSupported(speechRecognitionSupported());
  }, []);
  const [screenOn, setScreenOn] = useState(false);
  const [skillsOpen, setSkillsOpen] = useState(false);
  const [activeSkills, setActiveSkills] = useState([]);
  const [skillsData, setSkillsData] = useState([]);
  const [integracoesOpen, setIntegracoesOpen] = useState(false);
  const [integracoes, setIntegracoes] = useState([]);
  const [intForm, setIntForm] = useState({
    name: "",
    kind: "n8n",
    url: "http://127.0.0.1:5678",
    token: ""
  });
  const [intMsg, setIntMsg] = useState("");
  const [newSkillName, setNewSkillName] = useState("");
  const [newSkillInstr, setNewSkillInstr] = useState("");
  const [newSkillMsg, setNewSkillMsg] = useState(null);
  const [coverOpen, setCoverOpen] = useState(false);
  const [system, setSystem] = useState("blue");
  const [themeOpen, setThemeOpen] = useState(false);
  const [memoryOpen, setMemoryOpen] = useState(false);
  const [newMemory, setNewMemory] = useState("");
  const [bridge, setBridge] = useState(null);
  const [bridgeStatus, setBridgeStatus] = useState("offline");
  const [bridgeOpen, setBridgeOpen] = useState(false);
  const [bridgeUrl, setBridgeUrl] = useState("http://127.0.0.1:7843");
  const [bridgeToken, setBridgeToken] = useState("");
  const [bridgeError, setBridgeError] = useState(null);
  const [bridgeTesting, setBridgeTesting] = useState(false);
  const [isMobile, setIsMobile] = useState(false);
  const [toolLog, setToolLog] = useState([]);
  const [qrImage, setQrImage] = useState(null);
  const [qrOpen, setQrOpen] = useState(false);
  const bridgeRef = useRef(null);
  const memoriesRef = useRef([]);
  const inputRef = useRef(null);
  const fileInputRef = useRef(null);
  const cameraVideoRef = useRef(null);
  const cameraStreamRef = useRef(null);
  const screenStreamRef = useRef(null);
  const mirrorStreamRef = useRef(null);
  const scrollRef = useRef(null);
  useEffect(() => {
    memoriesRef.current = memories;
  }, [memories]);
  useEffect(() => {
    try {
      for (const t of THEMES) {
        const on = t.id === system;
        document.documentElement.classList.toggle(`theme-${t.id}`, on);
        document.body.classList.toggle(`theme-${t.id}`, on);
      }
      window.localStorage.setItem("jarvis:system:v1", system);
    } catch {
    }
  }, [system]);
  useEffect(() => {
    setIsMobile(isMobileDevice());
    try {
      const w = window.localStorage.getItem(WAKE_KEY);
      if (w === "word" || w === "clap" || w === "both") setWakeMode(w);
    } catch {
    }
    try {
      const s = window.localStorage.getItem("jarvis:system:v1");
      if (THEMES.some((t) => t.id === s)) setSystem(s);
    } catch {
    }
    setMessages(loadMessages());
    setMemories(loadMemories());
    const paired = readPairingFromHash();
    const b = paired ?? loadBridge();
    const draft = loadBridgeDraft();
    const migrateBridge = (config) => {
      if (!config) return null;
      if (config.url.replace(/\/$/, "").endsWith(":7842")) {
        return {
          ...config,
          url: config.url.replace(/:7842\/?$/, ":7843"),
          token: "jarvis-local-7843-2026"
        };
      }
      return config;
    };
    const migratedBridge = migrateBridge(b);
    const migratedDraft = migrateBridge(draft);
    if (migratedDraft && !paired) {
      setBridgeUrl(migratedDraft.url);
      setBridgeToken(migratedDraft.token);
      saveBridgeDraft(migratedDraft);
    }
    if (migratedBridge) {
      setBridgeUrl(migratedBridge.url);
      setBridgeToken(migratedBridge.token);
      if (paired) {
        setBridgeOpen(true);
        setBridgeError(null);
      } else {
        setBridge(migratedBridge);
        bridgeRef.current = migratedBridge;
      }
      saveBridge(migratedBridge);
      void health(migratedBridge).then(() => {
        setBridge(migratedBridge);
        bridgeRef.current = migratedBridge;
        saveBridge(migratedBridge);
        setBridgeStatus("online");
      }).catch((e) => {
        setBridgeStatus("error");
        if (paired) setBridgeError(e instanceof Error ? e.message : "Falha ao conectar");
      });
    }
    setHydrated(true);
  }, []);
  useEffect(() => {
    bridgeRef.current = bridge;
  }, [bridge]);
  useEffect(() => {
    if (!hydrated) return;
    saveBridgeDraft({
      url: bridgeUrl,
      token: bridgeToken
    });
  }, [bridgeUrl, bridgeToken, hydrated]);
  useEffect(() => {
    if (!hydrated) return;
    const slim = messages.map((m) => ({
      ...m,
      attachments: m.attachments?.map((a) => ({
        ...a,
        url: a.url.startsWith("data:") ? "" : a.url,
        frames: void 0,
        transcript: a.transcript ? a.transcript.slice(0, 2e3) : void 0
      }))
    }));
    try {
      window.localStorage.setItem(STORAGE_KEY, JSON.stringify(slim));
    } catch {
    }
  }, [messages, hydrated]);
  useEffect(() => {
    if (!hydrated) return;
    try {
      window.localStorage.setItem(WAKE_KEY, wakeMode);
    } catch {
    }
  }, [wakeMode, hydrated]);
  useEffect(() => {
    if (!hydrated) return;
    try {
      const s = window.localStorage.getItem("jarvis:skills:v1");
      if (s) setActiveSkills(JSON.parse(s));
    } catch {
    }
  }, [hydrated]);
  useEffect(() => {
    skillsList({}).then((r) => setSkillsData(r ?? [])).catch(() => {
    });
  }, [skillsList]);
  useEffect(() => {
    try {
      window.localStorage.setItem("jarvis:skills:v1", JSON.stringify(activeSkills));
    } catch {
    }
  }, [activeSkills]);
  useEffect(() => {
    if (!hydrated) return;
    try {
      window.localStorage.setItem(MEMORY_KEY, JSON.stringify(memories));
    } catch {
    }
  }, [memories, hydrated]);
  useEffect(() => {
    scrollRef.current?.scrollTo({
      top: scrollRef.current.scrollHeight,
      behavior: "smooth"
    });
  }, [messages, loading]);
  useEffect(() => {
    inputRef.current?.focus();
  }, []);
  const testBridge = useCallback(async () => {
    const cfg = {
      url: bridgeUrl.trim().replace(/\/$/, ""),
      token: bridgeToken.trim()
    };
    if (!cfg.url || !cfg.token) {
      setBridgeError("URL e token obrigatórios");
      return;
    }
    setBridgeError(null);
    setBridgeTesting(true);
    try {
      await health(cfg);
      setBridge(cfg);
      bridgeRef.current = cfg;
      saveBridge(cfg);
      setBridgeStatus("online");
    } catch (e) {
      setBridgeStatus("error");
      setBridgeError(e instanceof Error ? e.message : "Falha ao conectar");
    } finally {
      setBridgeTesting(false);
    }
  }, [bridgeUrl, bridgeToken]);
  const disconnectBridge = useCallback(() => {
    setBridge(null);
    bridgeRef.current = null;
    saveBridge(null);
    setBridgeStatus("offline");
  }, []);
  useEffect(() => {
    if (!qrOpen) {
      setQrImage(null);
      return;
    }
    const url = bridgeUrl.trim();
    const token = bridgeToken.trim();
    if (!url || !token) {
      setQrImage(null);
      return;
    }
    let alive = true;
    void QRCode.toDataURL(pairingUrl({
      url,
      token
    }), {
      width: 320,
      margin: 1,
      errorCorrectionLevel: "M",
      color: {
        dark: "#0b1622",
        light: "#ffffff"
      }
    }).then((data) => {
      if (alive) setQrImage(data);
    }).catch(() => {
      if (alive) setQrImage(null);
    });
    return () => {
      alive = false;
    };
  }, [qrOpen, bridgeUrl, bridgeToken]);
  const cancelledRef = useRef(false);
  const stopGeneration = useCallback(() => {
    cancelledRef.current = true;
    cancelSpeech();
    setSpeaking(false);
    setVoicePaused(false);
    setLoading(false);
  }, []);
  const send = useCallback(async (text) => {
    const clean = text.trim();
    const shot = screenOn ? await grabShot() : null;
    const outgoing = shot ? [...attachments, shot] : attachments;
    if (!clean && !outgoing.length || loading) return;
    cancelledRef.current = false;
    void primeAudio();
    cancelSpeech();
    setSpeaking(false);
    setVoicePaused(false);
    const names = outgoing.map((a) => a.name).join(", ");
    const displayContent = outgoing.length ? `${clean || "Analise os anexos"}
[Anexos: ${names}]` : clean;
    const userMsg = {
      role: "user",
      content: displayContent,
      ...outgoing.length ? {
        attachments: outgoing
      } : {}
    };
    const displayNext = [...messages, userMsg];
    setMessages(displayNext);
    setInput("");
    setAttachments([]);
    setAttachError(null);
    setLoading(true);
    setToolLog([]);
    try {
      const currentMemories = memoriesRef.current;
      let lastWithAtt = -1;
      for (let i = displayNext.length - 1; i >= 0; i--) {
        if (displayNext[i].role === "user" && displayNext[i].attachments?.length) {
          lastWithAtt = i;
          break;
        }
      }
      let modelMessages = displayNext.map((m, idx) => {
        const atts = idx === lastWithAtt ? m.attachments ?? [] : [];
        if (m.role !== "user" || !atts.length) return {
          role: m.role,
          content: m.content
        };
        const parts = [{
          type: "text",
          text: m.content
        }];
        for (const a of atts) {
          if (a.kind === "image" && a.url) {
            parts.push({
              type: "image",
              image: a.url
            });
          } else if (a.kind === "video") {
            for (const f of a.frames ?? []) parts.push({
              type: "image",
              image: f
            });
            parts.push({
              type: "text",
              text: a.frames?.length ? `[Video "${a.name}": ${a.frames.length} quadros acima, em ordem.]` : `[Video "${a.name}": sem quadros extraidos.]`
            });
            if (a.videoUrl) {
              parts.push({
                type: "text",
                text: `[o arquivo de video esta disponivel em: ${a.videoUrl}]`
              });
            }
          } else if (a.kind === "pdf" && a.url) {
            parts.push({
              type: "file",
              data: a.url,
              mediaType: "application/pdf",
              filename: a.name
            });
          } else if (a.kind === "audio") {
            parts.push({
              type: "text",
              text: a.transcript ? `[Audio "${a.name}" - transcricao]
${a.transcript}` : `[Audio "${a.name}" sem transcricao.]`
            });
          } else if (a.transcript) {
            parts.push({
              type: "text",
              text: `[Arquivo "${a.name}"]
${a.transcript}`
            });
          } else if (a.url && !a.url.startsWith("data:")) {
            parts.push({
              type: "text",
              text: `[Link para analise: ${a.url}] Use fetch_url para ler.`
            });
          }
        }
        return {
          role: "user",
          content: parts
        };
      });
      let finalText = "";
      const MAX_ROUNDS = 3;
      const completedToolCalls = /* @__PURE__ */ new Set();
      for (let round = 0; round < MAX_ROUNDS; round++) {
        const cfg = bridgeRef.current;
        const res = await ask({
          data: {
            messages: modelMessages,
            memories: currentMemories,
            hasBridge: !!cfg && bridgeStatus === "online",
            activeSkills
          }
        });
        finalText = res.text || finalText;
        if (cancelledRef.current) {
          setLoading(false);
          return;
        }
        const responseMsgs = JSON.parse(res.responseMessagesJson);
        modelMessages = [...modelMessages, ...responseMsgs];
        if (!res.pending.length) break;
        if (!cfg) {
          finalText = "A bridge local está offline, senhor — não posso tocar na sua máquina agora. Rode `python3 agent/jarvis_agent.py` e cole a URL + token no painel do plug.";
          break;
        }
        const pendingSignature = res.pending.map((call2) => `${call2.name}:${call2.inputJson}`).sort().join("|");
        if (completedToolCalls.has(pendingSignature)) {
          finalText = finalText || "A mesma ação foi solicitada novamente, senhor. Interrompi para evitar um ciclo.";
          break;
        }
        completedToolCalls.add(pendingSignature);
        const toolResults = await Promise.all(res.pending.map(async (call2) => {
          let input2 = {};
          try {
            input2 = JSON.parse(call2.inputJson);
          } catch {
          }
          setToolLog((l) => [...l, `▶ ${call2.name} ${JSON.stringify(input2).slice(0, 120)}`]);
          try {
            const output = await runTool(cfg, call2.name, input2);
            return {
              toolCallId: call2.id,
              toolName: call2.name,
              output
            };
          } catch (e) {
            return {
              toolCallId: call2.id,
              toolName: call2.name,
              output: {
                error: e instanceof Error ? e.message : String(e)
              }
            };
          }
        }));
        if (cancelledRef.current) {
          setLoading(false);
          return;
        }
        modelMessages.push({
          role: "tool",
          content: toolResults.map((r) => ({
            type: "tool-result",
            toolCallId: r.toolCallId,
            toolName: r.toolName,
            output: r.toolName === "image_view" && typeof r.output === "object" && r.output !== null && "data" in r.output ? [{
              type: "media",
              data: r.output.data,
              mediaType: r.output.mediaType
            }] : {
              type: "json",
              value: r.output
            }
          }))
        });
      }
      if (cancelledRef.current) {
        setLoading(false);
        return;
      }
      const reply = finalText || "…";
      setMessages((m) => [...m, {
        role: "assistant",
        content: reply
      }]);
      if (voiceOn) {
        void speak(reply, {
          onStart: () => setSpeaking(true),
          onEnd: () => {
            setSpeaking(false);
            setVoicePaused(false);
          },
          bridge: bridgeRef.current
        });
      }
      void extract({
        data: {
          userMessage: clean,
          assistantMessage: reply,
          existingMemories: currentMemories
        }
      }).then(({
        memories: found
      }) => {
        if (found.length) setMemories((prev) => mergeMemories(prev, found));
      }).catch(() => {
      });
    } catch (err) {
      if (cancelledRef.current) {
        setLoading(false);
        return;
      }
      console.error(err);
      setMessages((m) => [...m, {
        role: "assistant",
        content: "Falha de comunicação, senhor. Tente novamente."
      }]);
    } finally {
      setLoading(false);
      setTimeout(() => inputRef.current?.focus(), 0);
    }
  }, [ask, extract, transcribe, attachments, loading, messages, voiceOn, bridgeStatus, screenOn, grabShot]);
  const submitImage = () => {
    const prompt = imgPrompt.trim();
    if (!prompt || loading) return;
    setImgOpen(false);
    setImgPrompt("");
    void send(`cria uma imagem ${imgRatio} de: ${prompt}`);
  };
  const speech = useSpeech((finalText) => {
    void send(finalText);
  });
  const wake = useWake({
    mode: wakeMode,
    paused: speech.listening || loading || speaking,
    hold: speech.listening,
    onWake: () => {
      void primeAudio();
      if (!speech.listening) speech.start();
    }
  });
  const handleSubmit = (e) => {
    e.preventDefault();
    void send(input);
  };
  const downscaleImage = (dataUrl, maxDim = 768) => new Promise((resolve) => {
    const img = new Image();
    img.onload = () => {
      const scale = Math.min(1, maxDim / Math.max(img.width, img.height));
      if (scale >= 1) {
        resolve(dataUrl);
        return;
      }
      const canvas = document.createElement("canvas");
      canvas.width = Math.round(img.width * scale);
      canvas.height = Math.round(img.height * scale);
      canvas.getContext("2d")?.drawImage(img, 0, 0, canvas.width, canvas.height);
      resolve(canvas.toDataURL("image/jpeg", 0.85));
    };
    img.onerror = () => resolve(dataUrl);
    img.src = dataUrl;
  });
  const pushImageAttachment = (dataUrl, name) => {
    const id = newId();
    setAttachments((a) => [...a, {
      id,
      kind: "image",
      name,
      mediaType: "image/jpeg",
      url: dataUrl,
      size: dataUrl.length
    }]);
  };
  const removeAttachment = (id) => setAttachments((a) => a.filter((x) => x.id !== id));
  const handleFiles = async (files) => {
    if (!files) return;
    const list = Array.from(files);
    const errors = [];
    for (const file of list) {
      const invalid = validateFile(file);
      if (invalid) {
        errors.push(invalid);
        continue;
      }
      const mediaType = (file.type || guessMimeFromUrl(file.name)).toLowerCase();
      const kind = kindFromMime(mediaType, file.name);
      const id = newId();
      const base = {
        id,
        kind,
        name: file.name,
        mediaType,
        url: "",
        size: file.size
      };
      try {
        if (kind === "file") {
          const text = await fileToText(file);
          setAttachments((a) => [...a, {
            ...base,
            transcript: text.slice(0, 4e4),
            note: "texto extraido"
          }]);
          continue;
        }
        const url = await fileToDataUrl(file);
        if (kind === "audio") {
          setAttachments((a) => [...a, {
            ...base,
            url,
            note: "transcrevendo..."
          }]);
          const res = await transcribe({
            data: {
              dataUrl: url,
              filename: file.name
            }
          });
          if (res.error || !res.text) {
            setAttachments((a) => a.filter((x) => x.id !== id));
            errors.push(`${file.name}: ${res.error ?? "nao foi possivel transcrever."}`);
            continue;
          }
          setAttachments((a) => a.map((x) => x.id === id ? {
            ...x,
            transcript: res.text,
            note: "transcrito"
          } : x));
          continue;
        }
        if (kind === "video") {
          setAttachments((a) => [...a, {
            ...base,
            url,
            note: "extraindo quadros..."
          }]);
          try {
            const frames = await extractVideoFrames(file, 3, 640);
            setAttachments((a) => a.map((x) => x.id === id ? {
              ...x,
              frames,
              note: `${frames.length} quadros`
            } : x));
          } catch {
            setAttachments((a) => a.map((x) => x.id === id ? {
              ...x,
              note: "quadros indisponiveis"
            } : x));
            errors.push(`${file.name}: sem quadros - mande um print.`);
          }
          if (file.size <= 4e6) {
            try {
              const res = await fetch("/api/upload", {
                method: "POST",
                body: file,
                headers: {
                  "Content-Type": file.type || "video/mp4"
                }
              });
              const j = await res.json();
              if (j.url) {
                setAttachments((a) => a.map((x) => x.id === id ? {
                  ...x,
                  videoUrl: j.url,
                  note: `${x.note ?? ""} · pronto para editar`.trim()
                } : x));
              }
            } catch {
            }
          } else {
            setAttachments((a) => a.map((x) => x.id === id && !x.videoUrl ? {
              ...x,
              note: `${x.note ?? ""} · grande p/ editar; informe o caminho no PC`.trim()
            } : x));
          }
          continue;
        }
        if (kind === "image") {
          const small = await downscaleImage(url);
          setAttachments((a) => [...a, {
            ...base,
            url: small
          }]);
          continue;
        }
        setAttachments((a) => [...a, {
          ...base,
          url
        }]);
      } catch (e) {
        errors.push(`${file.name}: ${e instanceof Error ? e.message : "falha ao processar."}`);
      }
    }
    if (errors.length) setAttachError(errors.join(" "));
  };
  const openCamera = async () => {
    if (!navigator.mediaDevices?.getUserMedia) return;
    try {
      cameraStreamRef.current = await navigator.mediaDevices.getUserMedia({
        video: true
      });
      setCameraOpen(true);
      requestAnimationFrame(() => {
        if (cameraVideoRef.current && cameraStreamRef.current) cameraVideoRef.current.srcObject = cameraStreamRef.current;
      });
    } catch {
      fileInputRef.current?.click();
    }
  };
  const closeCamera = () => {
    cameraStreamRef.current?.getTracks().forEach((track) => track.stop());
    cameraStreamRef.current = null;
    setCameraOpen(false);
  };
  const captureCamera = async () => {
    const video = cameraVideoRef.current;
    if (!video) return;
    const canvas = document.createElement("canvas");
    canvas.width = video.videoWidth;
    canvas.height = video.videoHeight;
    canvas.getContext("2d")?.drawImage(video, 0, 0);
    pushImageAttachment(await downscaleImage(canvas.toDataURL("image/jpeg", 0.9)), "captura-da-camera.jpg");
    closeCamera();
  };
  const captureScreen = async () => {
    if (!navigator.mediaDevices?.getDisplayMedia) return;
    try {
      const stream = await navigator.mediaDevices.getDisplayMedia({
        video: true,
        audio: false
      });
      screenStreamRef.current = stream;
      const video = document.createElement("video");
      video.srcObject = stream;
      await video.play();
      await new Promise((resolve) => {
        video.onloadedmetadata = resolve;
      });
      const canvas = document.createElement("canvas");
      canvas.width = video.videoWidth;
      canvas.height = video.videoHeight;
      canvas.getContext("2d")?.drawImage(video, 0, 0);
      stream.getTracks().forEach((track) => track.stop());
      screenStreamRef.current = null;
      pushImageAttachment(await downscaleImage(canvas.toDataURL("image/jpeg", 0.85)), "captura-da-tela.jpg");
    } catch {
      screenStreamRef.current?.getTracks().forEach((track) => track.stop());
      screenStreamRef.current = null;
    }
  };
  const stopMirror = useCallback(() => {
    mirrorStreamRef.current?.getTracks().forEach((track) => track.stop());
    mirrorStreamRef.current = null;
    setScreenOn(false);
  }, []);
  const toggleMirror = useCallback(async () => {
    if (screenOn) {
      stopMirror();
      setAttachError(null);
      return;
    }
    setAttachError(null);
    try {
      const {
        stream,
        note
      } = await startVisionStream("environment");
      stream.getVideoTracks()[0]?.addEventListener("ended", () => {
        mirrorStreamRef.current = null;
        setScreenOn(false);
      });
      mirrorStreamRef.current = stream;
      setScreenOn(true);
      if (note) setAttachError(note);
    } catch (e) {
      setAttachError(e instanceof Error ? e.message : "Não foi possível ativar a câmera.");
      setScreenOn(false);
    }
  }, [screenOn, stopMirror]);
  async function grabShot() {
    const stream = mirrorStreamRef.current;
    if (!stream) return null;
    try {
      const url = await captureFrame(stream, 768);
      return {
        id: newId(),
        kind: "image",
        name: "camera-ao-vivo.jpg",
        mediaType: "image/jpeg",
        url,
        size: url.length,
        note: "ao vivo"
      };
    } catch {
      return null;
    }
  }
  const handleKeyDown = (e) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      void send(input);
    }
  };
  const clearConversation = () => {
    cancelSpeech();
    setSpeaking(false);
    setVoicePaused(false);
    setMessages([GREETING]);
  };
  const status = useMemo(() => {
    if (speech.listening) return {
      label: "OUVINDO",
      color: "text-gold text-glow-gold"
    };
    if (loading) return {
      label: "PROCESSANDO",
      color: "text-hud text-glow"
    };
    if (speaking) return {
      label: "RESPONDENDO",
      color: "text-hud text-glow"
    };
    if (wakeMode !== "off" && wake.armed) return {
      label: 'AGUARDANDO "JARVIS"',
      color: "text-hud/80 text-glow"
    };
    return {
      label: "ONLINE",
      color: "text-hud/80 text-glow"
    };
  }, [speech.listening, loading, speaking, wakeMode, wake.armed]);
  const reactorActive = speech.listening || loading || speaking;
  return /* @__PURE__ */ jsxs("div", { className: "relative min-h-screen overflow-hidden", children: [
    /* @__PURE__ */ jsx("div", { className: "pointer-events-none absolute inset-0 hud-grid opacity-40" }),
    /* @__PURE__ */ jsx("div", { className: "pointer-events-none absolute inset-x-0 top-0 h-px bg-gradient-to-r from-transparent via-hud to-transparent opacity-70" }),
    /* @__PURE__ */ jsx("div", { className: "pointer-events-none absolute inset-x-0 bottom-0 h-px bg-gradient-to-r from-transparent via-hud to-transparent opacity-70" }),
    /* @__PURE__ */ jsx("div", { className: "pointer-events-none absolute inset-0 overflow-hidden", children: /* @__PURE__ */ jsx("div", { className: "absolute inset-x-0 top-0 h-24 bg-gradient-to-b from-hud/10 to-transparent jarvis-scan" }) }),
    /* @__PURE__ */ jsxs("div", { className: "relative mx-auto flex min-h-screen max-w-5xl flex-col px-4 pb-8 pt-6 sm:px-6 sm:pb-10 sm:pt-8", children: [
      /* @__PURE__ */ jsxs("header", { className: "border-b border-hud/20 pb-4", children: [
        /* @__PURE__ */ jsxs("div", { className: "flex items-center justify-between gap-3", children: [
          /* @__PURE__ */ jsxs("div", { className: "flex min-w-0 items-center gap-3", children: [
            /* @__PURE__ */ jsx(ReactorBadge, { active: reactorActive }),
            /* @__PURE__ */ jsxs("div", { className: "min-w-0", children: [
              /* @__PURE__ */ jsx("h1", { className: "truncate text-lg font-bold tracking-[0.2em] text-hud text-glow sm:text-xl sm:tracking-[0.35em]", children: "J.A.R.V.I.S." }),
              /* @__PURE__ */ jsx("p", { className: "truncate font-mono text-[9px] uppercase tracking-widest text-muted-foreground sm:text-[10px]", children: "Just A Rather Very Intelligent System" })
            ] })
          ] }),
          /* @__PURE__ */ jsxs("div", { className: cn("hidden font-mono text-xs tracking-widest sm:block", status.color), children: [
            "● ",
            status.label
          ] })
        ] }),
        /* @__PURE__ */ jsxs("div", { className: "mt-3 flex flex-wrap items-center gap-1.5", children: [
          /* @__PURE__ */ jsx(IconButton, { title: "Abrir capa holografica", onClick: () => setCoverOpen(true), children: /* @__PURE__ */ jsx(Sparkles, { size: 16 }) }),
          /* @__PURE__ */ jsx(IconButton, { title: `Tema: ${THEMES.find((t) => t.id === system)?.label ?? system} (trocar)`, onClick: () => setThemeOpen((o) => !o), active: themeOpen, children: /* @__PURE__ */ jsx(Palette, { size: 16 }) }),
          /* @__PURE__ */ jsx(IconButton, { title: skillsOpen ? "Fechar skills" : `Skills (${activeSkills.length} ativas)`, onClick: () => setSkillsOpen((o) => !o), active: skillsOpen, children: /* @__PURE__ */ jsx(Brain, { size: 16 }) }),
          /* @__PURE__ */ jsx(IconButton, { title: integracoesOpen ? "Fechar integrações" : `Integrações (${integracoes.length})`, onClick: () => {
            const next = !integracoesOpen;
            setIntegracoesOpen(next);
            if (next) void refreshIntegracoes();
          }, active: integracoesOpen, children: /* @__PURE__ */ jsx(Puzzle, { size: 16 }) }),
          /* @__PURE__ */ jsx(IconButton, { title: "Abrir JARVIS no Telegram (@jarvisj06_bot)", onClick: () => window.open("https://t.me/jarvisj06_bot", "_blank", "noopener"), children: /* @__PURE__ */ jsx(MessageCircle, { size: 16 }) }),
          /* @__PURE__ */ jsx(IconButton, { title: wakeMode === "off" ? "Ativacao por voz/palmas (desligada)" : `Ativacao: ${wakeMode}`, onClick: () => setWakeOpen((o) => !o), active: wakeMode !== "off", children: /* @__PURE__ */ jsx(Radio, { size: 16 }) }),
          /* @__PURE__ */ jsx(IconButton, { title: voiceOn ? "Desligar voz" : "Ligar voz", onClick: () => {
            const next = !voiceOn;
            setVoiceOn(next);
            setSpeaking(false);
            setVoicePaused(false);
            if (!next) cancelSpeech();
            if (next) void speak("Jarvis online, senhor.", {
              bridge: bridgeRef.current
            });
          }, active: voiceOn, children: voiceOn ? /* @__PURE__ */ jsx(Volume2, { size: 16 }) : /* @__PURE__ */ jsx(VolumeX, { size: 16 }) }),
          speaking && /* @__PURE__ */ jsx(IconButton, { title: voicePaused ? "Continuar voz" : "Pausar voz", onClick: () => {
            if (voicePaused) {
              resumeSpeech();
              setVoicePaused(false);
            } else if (pauseSpeech()) {
              setVoicePaused(true);
            }
          }, active: voicePaused, children: voicePaused ? /* @__PURE__ */ jsx(Play, { size: 16 }) : /* @__PURE__ */ jsx(Pause, { size: 16 }) }),
          /* @__PURE__ */ jsx(IconButton, { title: `Bridge local (${bridgeStatus})`, onClick: () => setBridgeOpen((o) => !o), active: bridgeStatus === "online", children: bridgeStatus === "online" ? /* @__PURE__ */ jsx(PlugZap, { size: 16 }) : /* @__PURE__ */ jsx(Plug, { size: 16 }) }),
          /* @__PURE__ */ jsx(IconButton, { title: screenOn ? "Parar câmera ao vivo" : "Câmera ao vivo (ele vê pela câmera)", onClick: () => void toggleMirror(), active: screenOn, children: screenOn ? /* @__PURE__ */ jsx(MonitorOff, { size: 16 }) : /* @__PURE__ */ jsx(Monitor, { size: 16 }) }),
          /* @__PURE__ */ jsx(IconButton, { title: `Memoria (${memories.length})`, onClick: () => setMemoryOpen((o) => !o), active: memoryOpen, children: /* @__PURE__ */ jsx(History, { size: 16 }) }),
          /* @__PURE__ */ jsx(IconButton, { title: "Limpar conversa", active: clearFlash, onClick: () => {
            clearConversation();
            setClearFlash(true);
            window.setTimeout(() => setClearFlash(false), 900);
          }, children: /* @__PURE__ */ jsx(Trash2, { size: 16 }) }),
          /* @__PURE__ */ jsxs("div", { className: cn("ml-auto font-mono text-xs tracking-widest sm:hidden", status.color), children: [
            "● ",
            status.label
          ] })
        ] })
      ] }),
      themeOpen && /* @__PURE__ */ jsxs("div", { className: "mt-4 rounded-lg border border-hud/30 bg-card/60 p-4 shadow-hud backdrop-blur-sm", children: [
        /* @__PURE__ */ jsxs("div", { className: "mb-3 flex items-center justify-between", children: [
          /* @__PURE__ */ jsx("h2", { className: "font-mono text-xs uppercase tracking-[0.3em] text-hud text-glow", children: "Tema da armadura" }),
          /* @__PURE__ */ jsx("button", { type: "button", onClick: () => setThemeOpen(false), className: "text-hud/60 hover:text-hud", children: /* @__PURE__ */ jsx(X, { size: 14 }) })
        ] }),
        /* @__PURE__ */ jsx("div", { className: "grid grid-cols-2 gap-2 sm:grid-cols-4", children: THEMES.map((t) => /* @__PURE__ */ jsxs("button", { type: "button", onClick: () => {
          setSystem(t.id);
          setThemeOpen(false);
        }, className: cn("flex items-center gap-2 rounded border px-2 py-2 font-mono text-[10px] transition", system === t.id ? "border-hud bg-hud/15 text-hud shadow-hud" : "border-hud/25 text-muted-foreground hover:text-hud"), children: [
          /* @__PURE__ */ jsx("span", { "aria-hidden": true, className: "inline-block h-3 w-3 shrink-0 rounded-full border border-foreground/30", style: {
            backgroundColor: t.dot
          } }),
          t.label
        ] }, t.id)) })
      ] }),
      wakeOpen && /* @__PURE__ */ jsxs("div", { className: "mt-4 rounded-lg border border-hud/30 bg-card/60 p-4 shadow-hud backdrop-blur-sm", children: [
        /* @__PURE__ */ jsxs("div", { className: "mb-3 flex items-center justify-between", children: [
          /* @__PURE__ */ jsx("h2", { className: "font-mono text-xs uppercase tracking-[0.3em] text-hud text-glow", children: "Ativacao sem as maos" }),
          /* @__PURE__ */ jsx("button", { type: "button", onClick: () => setWakeOpen(false), className: "text-hud/60 hover:text-hud", children: /* @__PURE__ */ jsx(X, { size: 14 }) })
        ] }),
        /* @__PURE__ */ jsxs("p", { className: "mb-3 font-mono text-[10px] leading-relaxed text-muted-foreground", children: [
          "Escolha como me chamar: dizendo ",
          /* @__PURE__ */ jsx("span", { className: "text-hud", children: '"JARVIS"' }),
          ", batendo",
          " ",
          /* @__PURE__ */ jsx("span", { className: "text-hud", children: "duas palmas" }),
          ", ou os dois. O microfone fica escutando e abre a voz sozinho.",
          !srSupported && /* @__PURE__ */ jsxs(Fragment, { children: [
            " ",
            "Neste aparelho a palavra não funciona (o iPhone/Safari bloqueia) — use",
            " ",
            /* @__PURE__ */ jsx("span", { className: "text-hud", children: "Duas palmas" }),
            "."
          ] })
        ] }),
        /* @__PURE__ */ jsx("div", { className: "grid grid-cols-2 gap-2 sm:grid-cols-4", children: [{
          v: "off",
          label: "Desligado"
        }, {
          v: "word",
          label: 'Palavra "Jarvis"'
        }, {
          v: "clap",
          label: "Duas palmas"
        }, {
          v: "both",
          label: "Ambos"
        }].map((o) => /* @__PURE__ */ jsx("button", { type: "button", disabled: o.v === "word" && !srSupported, title: o.v === "word" && !srSupported ? "Palavra indisponível neste navegador" : o.label, onClick: () => {
          void primeAudio();
          setWakeMode(o.v);
        }, className: cn("rounded border px-2 py-2 font-mono text-[10px] transition", wakeMode === o.v ? "border-hud bg-hud/15 text-hud shadow-hud" : "border-hud/25 text-muted-foreground hover:text-hud", o.v === "word" && !srSupported && "cursor-not-allowed opacity-40"), children: o.label }, o.v)) }),
        /* @__PURE__ */ jsxs("p", { className: "mt-3 font-mono text-[10px] text-muted-foreground", children: [
          "Estado:",
          " ",
          /* @__PURE__ */ jsx("span", { className: wake.armed ? "text-hud" : "text-muted-foreground", children: wakeMode === "off" ? "inativo" : wake.armed ? "escutando gatilho" : "iniciando..." })
        ] }),
        wake.error && /* @__PURE__ */ jsxs("p", { className: "mt-1 font-mono text-[10px] text-gold", children: [
          wake.error,
          " Libere o microfone no navegador e tente de novo."
        ] })
      ] }),
      skillsOpen && /* @__PURE__ */ jsxs("div", { className: "mt-4 rounded-lg border border-hud/30 bg-card/60 p-4 shadow-hud backdrop-blur-sm", children: [
        /* @__PURE__ */ jsxs("div", { className: "mb-3 flex items-center justify-between", children: [
          /* @__PURE__ */ jsx("h2", { className: "font-mono text-xs uppercase tracking-[0.3em] text-hud text-glow", children: "Skills — conhecimento extra" }),
          /* @__PURE__ */ jsx("button", { type: "button", onClick: () => setSkillsOpen(false), className: "text-hud/60 hover:text-hud", children: /* @__PURE__ */ jsx(X, { size: 14 }) })
        ] }),
        /* @__PURE__ */ jsx("p", { className: "mb-3 font-mono text-[10px] leading-relaxed text-muted-foreground", children: "Skills são instruções especializadas que eu carrego na memória para tarefas específicas. Ative as que precisar — elas ficam salvas." }),
        /* @__PURE__ */ jsx("div", { className: "space-y-2", children: skillsData.map((s) => {
          const on = activeSkills.includes(s.id);
          return /* @__PURE__ */ jsxs("button", { type: "button", onClick: () => setActiveSkills((prev) => on ? prev.filter((x) => x !== s.id) : [...prev, s.id]), className: cn("flex w-full items-start gap-3 rounded border px-3 py-2 text-left transition", on ? "border-hud bg-hud/15 shadow-hud" : "border-hud/20 hover:border-hud/40"), children: [
            /* @__PURE__ */ jsx("span", { className: cn("mt-1 h-2 w-2 shrink-0 rounded-full", on ? "bg-hud shadow-hud" : "bg-muted-foreground/30") }),
            /* @__PURE__ */ jsxs("span", { className: "min-w-0", children: [
              /* @__PURE__ */ jsx("span", { className: cn("block font-mono text-xs", on ? "text-hud" : "text-foreground"), children: s.name }),
              /* @__PURE__ */ jsx("span", { className: "block font-mono text-[10px] text-muted-foreground", children: s.description })
            ] })
          ] }, s.id);
        }) }),
        activeSkills.length > 0 && /* @__PURE__ */ jsx("button", { type: "button", onClick: () => setActiveSkills([]), className: "mt-3 font-mono text-[10px] text-muted-foreground hover:text-gold", children: "Desativar todas" }),
        /* @__PURE__ */ jsxs("div", { className: "mt-4 border-t border-hud/20 pt-3", children: [
          /* @__PURE__ */ jsx("h3", { className: "mb-2 font-mono text-[10px] uppercase tracking-[0.25em] text-hud", children: "Nova skill" }),
          /* @__PURE__ */ jsx("input", { type: "text", value: newSkillName, onChange: (e) => setNewSkillName(e.target.value), placeholder: "Nome (ex: E-commerce)", className: "mb-2 w-full rounded border border-hud/20 bg-input/60 px-3 py-2 font-mono text-xs text-foreground placeholder:text-muted-foreground/60 focus:border-hud focus:outline-none" }),
          /* @__PURE__ */ jsx("textarea", { value: newSkillInstr, onChange: (e) => setNewSkillInstr(e.target.value), placeholder: "Instruções: como ele deve trabalhar nessa tarefa...", rows: 4, className: "mb-2 w-full resize-none rounded border border-hud/20 bg-input/60 px-3 py-2 font-mono text-xs text-foreground placeholder:text-muted-foreground/60 focus:border-hud focus:outline-none" }),
          /* @__PURE__ */ jsx("button", { type: "button", onClick: () => void submitSkill(), className: "rounded border border-hud bg-hud/20 px-4 py-2 font-mono text-xs text-hud shadow-hud transition hover:bg-hud/30", children: "Adicionar skill" }),
          newSkillMsg && /* @__PURE__ */ jsx("p", { className: "mt-2 font-mono text-[10px] text-gold", children: newSkillMsg })
        ] })
      ] }),
      integracoesOpen && /* @__PURE__ */ jsxs("div", { className: "mt-4 rounded-lg border border-hud/30 bg-card/60 p-4 shadow-hud backdrop-blur-sm", children: [
        /* @__PURE__ */ jsxs("div", { className: "mb-3 flex items-center justify-between", children: [
          /* @__PURE__ */ jsx("h2", { className: "font-mono text-xs uppercase tracking-[0.3em] text-hud text-glow", children: "Integrações — MCP, n8n e webhooks" }),
          /* @__PURE__ */ jsx("button", { type: "button", onClick: () => setIntegracoesOpen(false), className: "text-hud/60 hover:text-hud", children: /* @__PURE__ */ jsx(X, { size: 14 }) })
        ] }),
        /* @__PURE__ */ jsx("p", { className: "mb-3 font-mono text-[10px] leading-relaxed text-muted-foreground", children: "Conecte servidores MCP, o n8n do notebook ou webhooks — eu passo a chamar as ferramentas deles nas conversas. Serviços locais só respondem com o notebook ligado." }),
        /* @__PURE__ */ jsxs("div", { className: "space-y-2", children: [
          integracoes.length === 0 && /* @__PURE__ */ jsx("p", { className: "font-mono text-[10px] text-muted-foreground", children: "Nenhuma integração ainda. Adicione o n8n logo abaixo — fica pronto em um clique." }),
          integracoes.map((it) => /* @__PURE__ */ jsxs("div", { className: "flex items-center gap-2 rounded border border-hud/25 px-3 py-2", children: [
            /* @__PURE__ */ jsx("span", { className: cn("h-2 w-2 shrink-0 rounded-full", it.enabled ? "bg-hud shadow-hud" : "bg-muted-foreground/30") }),
            /* @__PURE__ */ jsxs("span", { className: "min-w-0 flex-1", children: [
              /* @__PURE__ */ jsxs("span", { className: "block font-mono text-xs text-foreground", children: [
                it.name,
                " ",
                /* @__PURE__ */ jsxs("span", { className: "text-hud/60", children: [
                  "(",
                  it.kind,
                  ")"
                ] })
              ] }),
              /* @__PURE__ */ jsx("span", { className: "block truncate font-mono text-[10px] text-muted-foreground", children: it.url })
            ] }),
            /* @__PURE__ */ jsx("button", { type: "button", onClick: () => void testarIntegracao(it.id), className: "rounded border border-hud/30 px-2 py-1 font-mono text-[10px] text-hud/80 transition hover:border-hud hover:text-hud", children: "Testar" }),
            /* @__PURE__ */ jsx("button", { type: "button", onClick: () => {
              void intToggle({
                data: {
                  id: it.id,
                  enabled: !it.enabled
                }
              }).then(() => refreshIntegracoes());
            }, className: "rounded border border-hud/30 px-2 py-1 font-mono text-[10px] text-hud/80 transition hover:border-hud hover:text-hud", children: it.enabled ? "On" : "Off" }),
            /* @__PURE__ */ jsx("button", { type: "button", title: "Remover", onClick: () => {
              void intDelete({
                data: {
                  id: it.id
                }
              }).then(() => refreshIntegracoes());
            }, className: "rounded border border-hud/30 px-2 py-1 text-gold/80 transition hover:border-gold hover:text-gold", children: /* @__PURE__ */ jsx(Trash2, { size: 12 }) })
          ] }, it.id))
        ] }),
        /* @__PURE__ */ jsxs("div", { className: "mt-4 border-t border-hud/20 pt-3", children: [
          /* @__PURE__ */ jsx("h3", { className: "mb-2 font-mono text-[10px] uppercase tracking-[0.25em] text-hud", children: "Nova integração" }),
          /* @__PURE__ */ jsx("div", { className: "mb-2 grid grid-cols-3 gap-2", children: [["n8n", "n8n local"], ["mcp", "Servidor MCP"], ["webhook", "Webhook"]].map(([v, label]) => /* @__PURE__ */ jsx("button", { type: "button", onClick: () => setIntForm((f) => ({
            ...f,
            kind: v,
            url: v === "n8n" ? "http://127.0.0.1:5678" : f.kind === "n8n" && f.url === "http://127.0.0.1:5678" ? "" : f.url
          })), className: cn("rounded border px-2 py-2 font-mono text-[10px] transition", intForm.kind === v ? "border-hud bg-hud/15 text-hud shadow-hud" : "border-hud/25 text-muted-foreground hover:text-hud"), children: label }, v)) }),
          /* @__PURE__ */ jsx("input", { type: "text", value: intForm.name, onChange: (e) => setIntForm((f) => ({
            ...f,
            name: e.target.value
          })), placeholder: "Nome (ex: n8n, Meu MCP)", className: "mb-2 w-full rounded border border-hud/20 bg-input/60 px-3 py-2 font-mono text-xs text-foreground placeholder:text-muted-foreground/60 focus:border-hud focus:outline-none" }),
          /* @__PURE__ */ jsx("input", { type: "text", value: intForm.url, onChange: (e) => setIntForm((f) => ({
            ...f,
            url: e.target.value
          })), placeholder: intForm.kind === "mcp" ? "URL do servidor MCP (ex: http://127.0.0.1:3000/mcp)" : intForm.kind === "n8n" ? "URL do n8n (ex: http://127.0.0.1:5678)" : "URL do webhook (ex: https://…/webhook/xxx)", className: "mb-2 w-full rounded border border-hud/20 bg-input/60 px-3 py-2 font-mono text-xs text-foreground placeholder:text-muted-foreground/60 focus:border-hud focus:outline-none" }),
          /* @__PURE__ */ jsx("input", { type: "password", value: intForm.token, onChange: (e) => setIntForm((f) => ({
            ...f,
            token: e.target.value
          })), placeholder: "Token / API key (opcional)", className: "mb-2 w-full rounded border border-hud/20 bg-input/60 px-3 py-2 font-mono text-xs text-foreground placeholder:text-muted-foreground/60 focus:border-hud focus:outline-none" }),
          /* @__PURE__ */ jsx("button", { type: "button", onClick: () => void submitIntegracao(), className: "rounded border border-hud bg-hud/20 px-4 py-2 font-mono text-xs text-hud shadow-hud transition hover:bg-hud/30", children: "Adicionar integração" }),
          intMsg && /* @__PURE__ */ jsx("p", { className: "mt-2 font-mono text-[10px] text-gold", children: intMsg })
        ] })
      ] }),
      bridgeOpen && /* @__PURE__ */ jsxs("div", { className: "mt-4 rounded-lg border border-hud/30 bg-card/60 p-4 shadow-hud backdrop-blur-sm", children: [
        /* @__PURE__ */ jsxs("div", { className: "mb-3 flex items-center justify-between", children: [
          /* @__PURE__ */ jsxs("h2", { className: "font-mono text-xs uppercase tracking-[0.3em] text-hud text-glow", children: [
            "Bridge local — ",
            bridgeStatus
          ] }),
          /* @__PURE__ */ jsx("button", { type: "button", onClick: () => setBridgeOpen(false), className: "text-hud/60 hover:text-hud", children: /* @__PURE__ */ jsx(X, { size: 14 }) })
        ] }),
        /* @__PURE__ */ jsxs("p", { className: "mb-3 font-mono text-[10px] leading-relaxed text-muted-foreground", children: [
          "Modo recomendado (notebook ",
          /* @__PURE__ */ jsx("em", { children: "e" }),
          " celular, funciona em HTTPS):"
        ] }),
        /* @__PURE__ */ jsx("pre", { className: "mb-3 overflow-x-auto rounded border border-hud/20 bg-black/50 p-2 font-mono text-[10px] text-hud/90", children: "python3 agent/jarvis_agent.py --tunnel" }),
        /* @__PURE__ */ jsxs("p", { className: "mb-3 font-mono text-[10px] leading-relaxed text-muted-foreground", children: [
          "O terminal imprime uma ",
          /* @__PURE__ */ jsx("strong", { children: "HTTPS URL" }),
          " (",
          /* @__PURE__ */ jsx("code", { className: "text-hud", children: "https://…trycloudflare.com" }),
          ") e o token. Cole os dois abaixo — no notebook e, via QR, no celular."
        ] }),
        isMobile ? /* @__PURE__ */ jsxs(Fragment, { children: [
          /* @__PURE__ */ jsxs("p", { className: "mb-3 font-mono text-[10px] leading-relaxed text-muted-foreground", children: [
            "Alternativa na mesma Wi-Fi (sem túnel): rode",
            " ",
            /* @__PURE__ */ jsx("code", { className: "text-hud", children: "JARVIS_HOST=0.0.0.0 python3 agent/jarvis_agent.py" }),
            " e use o",
            " ",
            /* @__PURE__ */ jsx("strong", { children: "IP local" }),
            " do computador (ex: ",
            /* @__PURE__ */ jsx("code", { className: "text-hud", children: "http://192.168.1.50:7842" }),
            ")."
          ] }),
          isLoopback(bridgeUrl) && /* @__PURE__ */ jsx("p", { className: "mb-3 font-mono text-[10px] text-gold", children: "⚠ O campo URL está como localhost. Troque pela HTTPS URL do túnel ou pelo IP local do computador." })
        ] }) : /* @__PURE__ */ jsxs("p", { className: "mb-3 font-mono text-[10px] leading-relaxed text-muted-foreground", children: [
          "Sem túnel, no próprio computador: ",
          /* @__PURE__ */ jsx("code", { className: "text-hud", children: "python3 agent/jarvis_agent.py" }),
          " e",
          " ",
          /* @__PURE__ */ jsx("code", { className: "text-hud", children: "http://127.0.0.1:7842" }),
          "."
        ] }),
        hydrated && mixedContentBlocked(bridgeUrl.trim()) && /* @__PURE__ */ jsxs("p", { className: "mb-3 rounded border border-gold/40 bg-gold/10 p-2 font-mono text-[10px] leading-relaxed text-gold", children: [
          "⚠ O navegador bloqueia chamadas HTTP de rede local a partir desta página HTTPS. Rode o agente com",
          " ",
          /* @__PURE__ */ jsx("code", { children: "--tunnel" }),
          " e cole aqui a URL ",
          /* @__PURE__ */ jsx("code", { children: "https://…" }),
          "."
        ] }),
        /* @__PURE__ */ jsx("div", { className: "mb-2 flex gap-2", children: /* @__PURE__ */ jsx("input", { value: bridgeUrl, onChange: (e) => setBridgeUrl(e.target.value), placeholder: "http://127.0.0.1:7843", className: "flex-1 rounded border border-hud/30 bg-input/60 px-3 py-2 font-mono text-xs text-foreground focus:border-hud focus:outline-none" }) }),
        /* @__PURE__ */ jsx("div", { className: "mb-2 flex gap-2", children: /* @__PURE__ */ jsx("input", { value: bridgeToken, onChange: (e) => setBridgeToken(e.target.value), placeholder: "token (do terminal do agent)", className: "flex-1 rounded border border-hud/30 bg-input/60 px-3 py-2 font-mono text-xs text-foreground focus:border-hud focus:outline-none" }) }),
        bridgeError && /* @__PURE__ */ jsx("p", { className: "mb-2 whitespace-pre-line font-mono text-[10px] leading-relaxed text-gold", children: bridgeError }),
        bridgeTesting && /* @__PURE__ */ jsxs("p", { className: "mb-2 font-mono text-[10px] text-hud/80", children: [
          "Testando conexão com ",
          bridgeUrl.trim(),
          "…"
        ] }),
        bridgeStatus === "online" && !bridgeError && !bridgeTesting && /* @__PURE__ */ jsx("p", { className: "mb-2 font-mono text-[10px] text-hud", children: "✓ Conectado — Jarvis já pode usar shell e arquivos." }),
        /* @__PURE__ */ jsxs("div", { className: "flex flex-wrap gap-2", children: [
          /* @__PURE__ */ jsx("button", { type: "button", onClick: () => void testBridge(), disabled: bridgeTesting, className: "rounded border border-hud/40 bg-hud/10 px-3 py-1.5 font-mono text-xs text-hud hover:bg-hud/20 disabled:opacity-40", children: bridgeTesting ? "Testando…" : "Testar / conectar" }),
          /* @__PURE__ */ jsxs("button", { type: "button", onClick: () => setQrOpen((o) => !o), disabled: !bridgeUrl.trim() || !bridgeToken.trim(), className: "flex items-center gap-1.5 rounded border border-hud/40 px-3 py-1.5 font-mono text-xs text-hud hover:bg-hud/10 disabled:opacity-40", children: [
            /* @__PURE__ */ jsx(QrCode, { size: 13 }),
            " ",
            qrOpen ? "Ocultar QR" : "QR p/ celular"
          ] }),
          bridge && /* @__PURE__ */ jsx("button", { type: "button", onClick: disconnectBridge, className: "rounded border border-hud/30 px-3 py-1.5 font-mono text-xs text-muted-foreground hover:text-gold", children: "Desconectar" })
        ] }),
        /* @__PURE__ */ jsxs("div", { className: "mt-2 flex items-center gap-2", children: [
          /* @__PURE__ */ jsx("span", { className: "font-mono text-[10px] uppercase tracking-widest text-muted-foreground", children: "Voz" }),
          /* @__PURE__ */ jsx("span", { className: "flex-1 font-mono text-[10px] text-hud", children: "Voz neural (bridge)" }),
          /* @__PURE__ */ jsx("button", { type: "button", onClick: () => void speak("Jarvis online, senhor.", {
            bridge: bridgeRef.current
          }), className: "shrink-0 rounded border border-hud/40 bg-hud/10 px-2 py-1.5 font-mono text-[10px] text-hud hover:bg-hud/20", children: "Testar" })
        ] }),
        qrOpen && /* @__PURE__ */ jsx("div", { className: "mt-3 rounded border border-hud/20 bg-black/40 p-3", children: qrImage ? /* @__PURE__ */ jsxs("div", { className: "flex flex-col items-center gap-2", children: [
          /* @__PURE__ */ jsx("img", { src: qrImage, alt: "QR code de pareamento da bridge local do J.A.R.V.I.S.", className: "h-44 w-44 rounded bg-white p-1" }),
          /* @__PURE__ */ jsx("p", { className: "text-center font-mono text-[10px] leading-relaxed text-muted-foreground", children: "Escaneie com a câmera do celular — o Jarvis abre já com IP e token preenchidos e tenta conectar." }),
          isLoopback(bridgeUrl) && /* @__PURE__ */ jsx("p", { className: "text-center font-mono text-[10px] text-gold", children: "⚠ A URL é localhost: o celular não vai alcançar. Troque pelo IP local (ex: http://192.168.1.50:7842) antes de escanear." })
        ] }) : /* @__PURE__ */ jsx("p", { className: "font-mono text-[10px] text-muted-foreground", children: "Gerando QR…" }) }),
        toolLog.length > 0 && /* @__PURE__ */ jsx("div", { className: "mt-3 max-h-32 overflow-y-auto rounded border border-hud/20 bg-black/40 p-2 font-mono text-[10px] text-hud/80", children: toolLog.map((l, i) => /* @__PURE__ */ jsx("div", { children: l }, i)) })
      ] }),
      memoryOpen && /* @__PURE__ */ jsx(MemoryPanel, { memories, newMemory, setNewMemory, onAdd: () => {
        const v = newMemory.trim();
        if (!v) return;
        setMemories((prev) => mergeMemories(prev, [v]));
        setNewMemory("");
      }, onRemove: (idx) => setMemories((prev) => prev.filter((_, i) => i !== idx)), onClear: () => setMemories([]), onClose: () => setMemoryOpen(false) }),
      /* @__PURE__ */ jsx("div", { className: "my-6 flex justify-center", children: /* @__PURE__ */ jsx(ArcReactor, { active: reactorActive, listening: speech.listening, speaking }) }),
      /* @__PURE__ */ jsxs("div", { ref: scrollRef, className: "flex-1 space-y-4 overflow-y-auto rounded-lg border border-hud/20 bg-card/40 p-4 shadow-hud backdrop-blur-sm", children: [
        messages.map((m, i) => /* @__PURE__ */ jsx(MessageBubble, { message: m }, i)),
        speech.interim && /* @__PURE__ */ jsx(MessageBubble, { message: {
          role: "user",
          content: speech.interim + "…"
        }, ghost: true }),
        loading && /* @__PURE__ */ jsxs("div", { className: "flex flex-col gap-1", children: [
          /* @__PURE__ */ jsxs("div", { className: "flex items-center gap-2 font-mono text-xs text-hud/70", children: [
            /* @__PURE__ */ jsxs("span", { className: "inline-flex gap-1", children: [
              /* @__PURE__ */ jsx("span", { className: "h-1.5 w-1.5 animate-pulse rounded-full bg-hud" }),
              /* @__PURE__ */ jsx("span", { className: "h-1.5 w-1.5 animate-pulse rounded-full bg-hud [animation-delay:150ms]" }),
              /* @__PURE__ */ jsx("span", { className: "h-1.5 w-1.5 animate-pulse rounded-full bg-hud [animation-delay:300ms]" })
            ] }),
            "analisando..."
          ] }),
          toolLog.length > 0 && /* @__PURE__ */ jsx("div", { className: "font-mono text-[10px] text-hud/50", children: friendlyStep(toolLog[toolLog.length - 1]) })
        ] })
      ] }),
      /* @__PURE__ */ jsxs("form", { onSubmit: handleSubmit, className: "mt-4 flex flex-col gap-2", children: [
        /* @__PURE__ */ jsx("input", { ref: fileInputRef, type: "file", accept: ACCEPT_ATTR, multiple: true, className: "hidden", onChange: (e) => {
          void handleFiles(e.target.files ?? void 0);
          e.target.value = "";
        } }),
        /* @__PURE__ */ jsxs("div", { className: "order-2 flex items-center justify-end gap-1.5", children: [
          /* @__PURE__ */ jsx("button", { type: "button", onClick: () => fileInputRef.current?.click(), disabled: loading, "aria-label": "Anexar arquivo", className: "flex h-10 w-10 shrink-0 items-center justify-center rounded-md border border-hud/40 bg-hud/10 text-hud transition hover:bg-hud/20 disabled:opacity-40 sm:h-12 sm:w-12", children: /* @__PURE__ */ jsx(Paperclip, { size: 16 }) }),
          /* @__PURE__ */ jsx("button", { type: "button", onClick: () => setImgOpen(true), disabled: loading, "aria-label": "Gerar imagem", title: "Gerar imagem", className: "flex h-10 w-10 shrink-0 items-center justify-center rounded-md border border-hud/40 bg-hud/10 text-hud transition hover:bg-hud/20 disabled:opacity-40 sm:h-12 sm:w-12", children: /* @__PURE__ */ jsx(ImagePlus, { size: 16 }) }),
          /* @__PURE__ */ jsx("button", { type: "button", onClick: () => void openCamera(), disabled: loading, "aria-label": "Abrir câmera", className: "flex h-10 w-10 shrink-0 items-center justify-center rounded-md border border-hud/40 bg-hud/10 text-hud transition hover:bg-hud/20 disabled:opacity-40 sm:h-12 sm:w-12", children: /* @__PURE__ */ jsx(Camera, { size: 16 }) }),
          /* @__PURE__ */ jsx("button", { type: "button", onClick: () => void captureScreen(), disabled: loading, "aria-label": "Compartilhar tela", title: "Compartilhar tela", className: "hidden h-10 w-10 shrink-0 items-center justify-center rounded-md border border-hud/40 bg-hud/10 text-hud transition hover:bg-hud/20 disabled:opacity-40 sm:flex sm:h-12 sm:w-12", children: /* @__PURE__ */ jsx(Monitor, { size: 16 }) }),
          speech.supported && /* @__PURE__ */ jsx("button", { type: "button", onClick: () => {
            void primeAudio();
            speech.listening ? speech.stop() : speech.start();
          }, disabled: loading, "aria-label": speech.listening ? "Parar" : "Falar", className: cn("flex h-10 w-10 shrink-0 items-center justify-center rounded-md border transition sm:h-12 sm:w-12", speech.listening ? "border-gold bg-gold/20 text-gold shadow-[0_0_20px_oklch(0.82_0.14_85/0.5)]" : "border-hud/40 bg-hud/10 text-hud hover:bg-hud/20 hover:shadow-hud", loading && "opacity-40"), children: speech.listening ? /* @__PURE__ */ jsx(MicOff, { size: 16 }) : /* @__PURE__ */ jsx(Mic, { size: 16 }) }),
          loading ? /* @__PURE__ */ jsx("button", { type: "button", onClick: stopGeneration, "aria-label": "Parar", title: "Parar de gerar", className: "flex h-10 w-10 shrink-0 items-center justify-center rounded-md border border-gold bg-gold/20 p-0 leading-none text-gold transition hover:bg-gold/30 sm:h-12 sm:w-12", children: /* @__PURE__ */ jsx(Square, { size: 16 }) }) : /* @__PURE__ */ jsx("button", { type: "submit", disabled: !input.trim() && !attachments.length, "aria-label": "Enviar", className: "flex h-10 w-10 shrink-0 items-center justify-center rounded-md border border-hud bg-hud/20 p-0 leading-none text-hud transition hover:bg-hud/30 hover:shadow-hud disabled:opacity-40 sm:h-12 sm:w-12", children: /* @__PURE__ */ jsx(Send, { size: 16 }) })
        ] }),
        /* @__PURE__ */ jsxs("div", { className: "relative min-w-0 order-1", children: [
          attachments.length > 0 && /* @__PURE__ */ jsx("div", { className: "mb-2 space-y-1", children: attachments.map((a) => /* @__PURE__ */ jsxs("div", { className: "flex items-center gap-2 rounded-md border border-hud/30 bg-hud/10 px-3 py-2 font-mono text-xs text-hud", children: [
            a.kind === "image" && a.url ? /* @__PURE__ */ jsx("img", { src: a.url, alt: a.name, className: "h-10 w-10 rounded object-cover" }) : null,
            /* @__PURE__ */ jsx("span", { className: "min-w-0 flex-1 truncate", children: a.name }),
            a.note ? /* @__PURE__ */ jsx("span", { className: "shrink-0 text-[10px] text-muted-foreground", children: a.note }) : null,
            /* @__PURE__ */ jsx("button", { type: "button", onClick: () => removeAttachment(a.id), "aria-label": "Remover anexo", className: "text-hud hover:text-foreground", children: /* @__PURE__ */ jsx(X, { size: 16 }) })
          ] }, a.id)) }),
          attachError && /* @__PURE__ */ jsx("p", { className: "mb-2 font-mono text-[10px] text-gold", children: attachError }),
          /* @__PURE__ */ jsx("textarea", { ref: inputRef, value: input, onChange: (e) => setInput(e.target.value), onKeyDown: handleKeyDown, placeholder: "Fale comigo, senhor...", rows: 1, disabled: loading, className: "min-h-[44px] w-full resize-none rounded-md border border-hud/30 bg-input/60 px-3 py-2.5 font-mono text-sm text-foreground placeholder:text-muted-foreground/60 focus:border-hud focus:outline-none focus:ring-1 focus:ring-hud sm:min-h-[48px] sm:px-4 sm:py-3" })
        ] })
      ] }),
      cameraOpen && /* @__PURE__ */ jsx("div", { className: "fixed inset-0 z-50 flex items-center justify-center bg-black/80 p-4", children: /* @__PURE__ */ jsxs("div", { className: "w-full max-w-lg rounded-lg border border-hud/50 bg-background p-4 shadow-hud", children: [
        /* @__PURE__ */ jsx("video", { ref: cameraVideoRef, autoPlay: true, playsInline: true, className: "w-full rounded-md bg-black" }),
        /* @__PURE__ */ jsxs("div", { className: "mt-3 flex justify-end gap-2", children: [
          /* @__PURE__ */ jsx("button", { type: "button", onClick: closeCamera, className: "rounded-md border border-hud/40 px-4 py-2 font-mono text-xs text-hud", children: "Cancelar" }),
          /* @__PURE__ */ jsx("button", { type: "button", onClick: captureCamera, className: "rounded-md border border-hud bg-hud/20 px-4 py-2 font-mono text-xs text-hud", children: "Capturar" })
        ] })
      ] }) }),
      imgOpen && /* @__PURE__ */ jsx("div", { className: "fixed inset-0 z-50 flex items-center justify-center bg-black/80 p-4", children: /* @__PURE__ */ jsxs("div", { className: "w-full max-w-lg rounded-lg border border-hud/50 bg-background p-4 shadow-hud", children: [
        /* @__PURE__ */ jsxs("div", { className: "mb-3 flex items-center justify-between", children: [
          /* @__PURE__ */ jsx("h3", { className: "font-mono text-sm text-hud", children: "Gerar imagem" }),
          /* @__PURE__ */ jsx("button", { type: "button", onClick: () => setImgOpen(false), "aria-label": "Fechar", className: "text-hud hover:text-foreground", children: /* @__PURE__ */ jsx(X, { size: 16 }) })
        ] }),
        /* @__PURE__ */ jsx("textarea", { value: imgPrompt, onChange: (e) => setImgPrompt(e.target.value), placeholder: "Descreva a imagem (ex: um dragão de armadura em uma rua neon)...", rows: 3, className: "w-full resize-none rounded-md border border-hud/30 bg-input/60 px-3 py-2 font-mono text-sm text-foreground placeholder:text-muted-foreground/60 focus:border-hud focus:outline-none" }),
        /* @__PURE__ */ jsxs("div", { className: "mt-3", children: [
          /* @__PURE__ */ jsx("p", { className: "mb-1.5 font-mono text-[10px] uppercase tracking-widest text-muted-foreground", children: "Proporção" }),
          /* @__PURE__ */ jsx("div", { className: "flex flex-wrap gap-1.5", children: IMG_RATIOS.map((r) => /* @__PURE__ */ jsxs("button", { type: "button", onClick: () => setImgRatio(r.id), className: cn("rounded-md border px-2.5 py-1.5 font-mono text-xs transition", imgRatio === r.id ? "border-hud bg-hud/20 text-hud" : "border-hud/30 text-hud/70 hover:border-hud hover:text-hud"), children: [
            r.label,
            /* @__PURE__ */ jsx("span", { className: "ml-1 text-[9px] text-muted-foreground", children: r.hint })
          ] }, r.id)) })
        ] }),
        /* @__PURE__ */ jsxs("div", { className: "mt-4 flex justify-end gap-2", children: [
          /* @__PURE__ */ jsx("button", { type: "button", onClick: () => setImgOpen(false), className: "rounded-md border border-hud/40 px-4 py-2 font-mono text-xs text-hud", children: "Cancelar" }),
          /* @__PURE__ */ jsx("button", { type: "button", disabled: !imgPrompt.trim() || loading, onClick: submitImage, className: "rounded-md border border-hud bg-hud/20 px-4 py-2 font-mono text-xs text-hud disabled:opacity-40", children: "Gerar" })
        ] })
      ] }) }),
      coverOpen && /* @__PURE__ */ jsx(CoverScreen, { onExit: () => setCoverOpen(false), system })
    ] })
  ] });
}
function ReactorBadge({
  active
}) {
  return /* @__PURE__ */ jsxs("div", { className: "relative h-10 w-10", children: [
    /* @__PURE__ */ jsx("div", { className: cn("absolute inset-0 rounded-full border-2 border-hud/60", active && "jarvis-spin-slow"), style: {
      borderStyle: "dashed"
    } }),
    /* @__PURE__ */ jsx("div", { className: cn("absolute inset-1 rounded-full bg-hud/20 shadow-hud", active ? "jarvis-pulse" : "") }),
    /* @__PURE__ */ jsx("div", { className: "absolute inset-[10px] rounded-full bg-hud shadow-hud-strong" })
  ] });
}
function ArcReactor({
  active,
  listening,
  speaking
}) {
  return /* @__PURE__ */ jsxs("div", { className: "relative h-40 w-40 sm:h-48 sm:w-48", children: [
    /* @__PURE__ */ jsx("div", { className: cn("absolute inset-0 rounded-full border border-hud/40", active && "jarvis-spin-slow"), style: {
      borderStyle: "dashed"
    } }),
    /* @__PURE__ */ jsx("div", { className: cn("absolute inset-2 rounded-full border border-hud/30", active && "jarvis-spin-reverse"), children: Array.from({
      length: 24
    }).map((_, i) => /* @__PURE__ */ jsx("div", { className: "absolute left-1/2 top-0 h-2 w-px -translate-x-1/2 bg-hud/60", style: {
      transform: `translateX(-50%) rotate(${i * 360 / 24}deg) translateY(0)`
    } }, i)) }),
    /* @__PURE__ */ jsx("div", { className: cn("absolute inset-6 rounded-full bg-gradient-to-br from-hud/50 via-hud/20 to-transparent", active && "jarvis-pulse") }),
    /* @__PURE__ */ jsx("div", { className: "absolute inset-0 flex items-center justify-center", children: /* @__PURE__ */ jsx("div", { className: cn("flex h-16 w-16 items-center justify-center rounded-full bg-hud/90 shadow-hud-strong sm:h-20 sm:w-20", active && "jarvis-pulse"), children: listening ? /* @__PURE__ */ jsx("div", { className: "flex items-end gap-1", children: [0, 1, 2, 3, 4].map((i) => /* @__PURE__ */ jsx("span", { className: "w-1 rounded-full bg-primary-foreground jarvis-listening", style: {
      height: 22,
      animationDelay: `${i * 90}ms`
    } }, i)) }) : /* @__PURE__ */ jsx("div", { className: cn("h-4 w-4 rounded-full bg-primary-foreground/90", speaking && "jarvis-pulse") }) }) })
  ] });
}
function friendlyStep(log) {
  const name = /^▶ (\S+)/.exec(log)?.[1] ?? "";
  switch (name) {
    case "open_app":
      return "abrindo aplicativo...";
    case "open_and_view":
      return "abrindo e vendo aplicativo...";
    case "take_screenshot":
      return "capturando tela...";
    case "shell_exec":
      return "executando no PC...";
    case "fs_read":
    case "fs_write":
    case "fs_list":
      return "mexendo em arquivos...";
    case "type_text":
      return "digitando no PC...";
    case "criar_imagem":
      return "gerando imagem...";
    case "web_search":
      return "buscando na web...";
    case "fetch_url":
      return "lendo página...";
    case "get_datetime":
      return "vendo data e hora...";
    case "run_js":
      return "calculando...";
    case "integracoes_listar":
    case "integracao_chamar":
      return "usando integração...";
    default:
      return "trabalhando...";
  }
}
function MessageBubble({
  message,
  ghost = false
}) {
  const isUser = message.role === "user";
  return /* @__PURE__ */ jsx("div", { className: cn("flex", isUser ? "justify-end" : "justify-start"), children: /* @__PURE__ */ jsxs("div", { className: cn("jarvis-msg max-w-[85%] min-w-0 rounded-lg border px-4 py-2.5 font-mono text-sm leading-relaxed", isUser ? "jarvis-msg-user border-gold/40 bg-gold/10 text-foreground" : "jarvis-msg-assistant border-hud/40 bg-hud/5 text-foreground shadow-[0_0_20px_oklch(0.78_0.16_220/0.15)]", ghost && "opacity-60 italic"), children: [
    !isUser && /* @__PURE__ */ jsxs("div", { className: "mb-1 flex items-center gap-2 text-[10px] uppercase tracking-[0.25em] text-hud/80", children: [
      /* @__PURE__ */ jsx("span", { className: "h-1.5 w-1.5 rounded-full bg-hud shadow-hud" }),
      "J.A.R.V.I.S."
    ] }),
    /* @__PURE__ */ jsx("div", { className: "prose prose-sm prose-invert max-w-none break-words prose-p:my-1 prose-headings:my-2 [&_a]:break-all [&_img]:h-auto [&_img]:max-w-full [&_img]:rounded [&_pre]:max-w-full [&_pre]:overflow-x-auto", children: /* @__PURE__ */ jsx(ReactMarkdown, { children: message.content }) })
  ] }) });
}
function IconButton({
  children,
  onClick,
  title,
  active
}) {
  return /* @__PURE__ */ jsx("button", { type: "button", onClick, title, "aria-label": title, className: cn("flex h-9 w-9 items-center justify-center rounded-md border transition", active ? "border-hud bg-hud/20 text-hud shadow-hud" : "border-hud/30 bg-transparent text-hud/70 hover:border-hud hover:text-hud"), children });
}
function MemoryPanel({
  memories,
  newMemory,
  setNewMemory,
  onAdd,
  onRemove,
  onClear,
  onClose
}) {
  return /* @__PURE__ */ jsxs("div", { className: "mt-4 rounded-lg border border-hud/30 bg-card/60 p-4 shadow-hud backdrop-blur-sm", children: [
    /* @__PURE__ */ jsxs("div", { className: "mb-3 flex items-center justify-between", children: [
      /* @__PURE__ */ jsxs("div", { className: "flex items-center gap-2", children: [
        /* @__PURE__ */ jsx(Brain, { size: 14, className: "text-hud" }),
        /* @__PURE__ */ jsx("h2", { className: "font-mono text-xs uppercase tracking-[0.3em] text-hud text-glow", children: "Memória de longo prazo" }),
        /* @__PURE__ */ jsxs("span", { className: "font-mono text-[10px] text-muted-foreground", children: [
          memories.length,
          " fato",
          memories.length === 1 ? "" : "s"
        ] })
      ] }),
      /* @__PURE__ */ jsxs("div", { className: "flex items-center gap-2", children: [
        memories.length > 0 && /* @__PURE__ */ jsx("button", { type: "button", onClick: onClear, className: "font-mono text-[10px] uppercase tracking-widest text-muted-foreground hover:text-gold", children: "esquecer tudo" }),
        /* @__PURE__ */ jsx("button", { type: "button", onClick: onClose, "aria-label": "Fechar", className: "text-hud/60 hover:text-hud", children: /* @__PURE__ */ jsx(X, { size: 14 }) })
      ] })
    ] }),
    /* @__PURE__ */ jsx("p", { className: "mb-3 font-mono text-[10px] leading-relaxed text-muted-foreground", children: "Fatos duradouros sobre você que o J.A.R.V.I.S. lembra em toda conversa. Salvos apenas neste navegador. Ele extrai automaticamente do que você conta, e você pode editar à vontade." }),
    memories.length === 0 ? /* @__PURE__ */ jsx("p", { className: "mb-3 font-mono text-xs italic text-muted-foreground/70", children: "Nenhuma memória ainda — conte algo sobre você e ela aparecerá aqui." }) : /* @__PURE__ */ jsx("ul", { className: "mb-3 max-h-56 space-y-1.5 overflow-y-auto pr-1", children: memories.map((m, i) => /* @__PURE__ */ jsxs("li", { className: "group flex items-start justify-between gap-2 rounded border border-hud/20 bg-hud/5 px-3 py-2 font-mono text-xs text-foreground/90", children: [
      /* @__PURE__ */ jsx("span", { className: "flex-1 leading-relaxed", children: m }),
      /* @__PURE__ */ jsx("button", { type: "button", onClick: () => onRemove(i), "aria-label": "Esquecer", className: "mt-0.5 shrink-0 text-hud/40 opacity-60 transition hover:text-gold group-hover:opacity-100", children: /* @__PURE__ */ jsx(X, { size: 12 }) })
    ] }, i)) }),
    /* @__PURE__ */ jsxs("form", { onSubmit: (e) => {
      e.preventDefault();
      onAdd();
    }, className: "flex items-center gap-2", children: [
      /* @__PURE__ */ jsx("input", { value: newMemory, onChange: (e) => setNewMemory(e.target.value), placeholder: "Adicionar um fato manualmente...", className: "flex-1 rounded border border-hud/30 bg-input/60 px-3 py-2 font-mono text-xs text-foreground placeholder:text-muted-foreground/60 focus:border-hud focus:outline-none" }),
      /* @__PURE__ */ jsx("button", { type: "submit", disabled: !newMemory.trim(), "aria-label": "Adicionar memória", className: "flex h-9 w-9 items-center justify-center rounded border border-hud/40 bg-hud/10 text-hud transition hover:bg-hud/20 disabled:opacity-40", children: /* @__PURE__ */ jsx(Plus, { size: 14 }) })
    ] })
  ] });
}
export {
  Jarvis as component
};
