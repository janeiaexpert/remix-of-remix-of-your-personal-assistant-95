import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { createFileRoute } from "@tanstack/react-router";
import { useServerFn } from "@tanstack/react-start";
import ReactMarkdown from "react-markdown";
import { Mic, MicOff, Send, Volume2, VolumeX, Trash2, Brain, X, Plus, Plug, PlugZap, QrCode, Paperclip, Camera, Monitor, MonitorOff, Sparkles, Palette, Radio, History, Pause, Play, Puzzle, ImagePlus, MessageCircle, Square, CalendarClock, RefreshCw } from "lucide-react";
import { askJarvis, extractMemories, listSkillsFn, createSkillFn } from "@/lib/jarvis.functions";
import { listIntegrationsFn, saveIntegrationFn, deleteIntegrationFn, toggleIntegrationFn, testIntegrationFn } from "@/lib/integrations.functions";
import type { Integration } from "@/lib/integrations.server";
import { transcribeAudio } from "@/lib/media.functions";
import {
  type Attachment,
  newId,
  kindFromMime,
  guessMimeFromUrl,
  fileToDataUrl,
  fileToText,
  extractVideoFrames,
  startVisionStream,
  captureFrame,
  ACCEPT_ATTR,
  validateFile,
} from "@/lib/vision";
import { useWake, speechRecognitionSupported, type WakeMode } from "@/lib/wake";
import { useSpeech, speak, cancelSpeech, primeAudio, pauseSpeech, resumeSpeech } from "@/lib/speech";
import { CoverScreen, THEMES, type SystemTheme } from "@/components/CoverScreen";
import { loadBridge, saveBridge, loadBridgeDraft, saveBridgeDraft, health, runTool, pairingUrl, readPairingFromHash, mixedContentBlocked, type BridgeConfig } from "@/lib/bridge";
import QRCode from "qrcode";
import { cn } from "@/lib/utils";

type Msg = { role: "user" | "assistant"; content: string; attachments?: Attachment[] };
const STORAGE_KEY = "jarvis:conversation:v1";
const MEMORY_KEY = "jarvis:memories:v1";
const WAKE_KEY = "jarvis:wake:v1";
const TASKS_TOKEN_KEY = "jarvis:scheduled-tasks:token:v1";
const MAX_MEMORIES = 500;
type ScheduledTaskState = {
  task: {
    id: string;
    enabled: true;
    days: string[];
    time: string;
    timezone: string;
  };
  telegramConfigured: boolean;
  result?: { report: string; telegram: "sent" | "not-configured" | "failed" };
};
const IMG_RATIOS = [
  { id: "3:4", label: "3:4", hint: "1080×1440" },
  { id: "4:5", label: "4:5", hint: "1080×1350" },
  { id: "9:16", label: "9:16", hint: "1080×1920" },
  { id: "quadrado", label: "Quadrado", hint: "1024×1024" },
  { id: "paisagem", label: "Paisagem", hint: "1280×720" },
  { id: "retrato", label: "Retrato", hint: "1024×1280" },
] as const;
const GREETING: Msg = {
  role: "assistant",
  content: "Sistemas online. Ao seu dispor, senhor. Em que posso ajudá-lo?",
};

function loadMemories(): string[] {
  if (typeof window === "undefined") return [];
  try {
    const raw = window.localStorage.getItem(MEMORY_KEY);
    if (!raw) return [];
    const parsed = JSON.parse(raw) as unknown;
    return Array.isArray(parsed) ? parsed.filter((m): m is string => typeof m === "string") : [];
  } catch {
    return [];
  }
}

function normalize(s: string) {
  return s.toLowerCase().replace(/\s+/g, " ").trim();
}
function isMobileDevice() {
  if (typeof navigator === "undefined") return false;
  return /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(navigator.userAgent);
}
function isLoopback(url: string) {
  return /^(https?:\/\/)?(127\.0\.0\.1|localhost)(:\d+)?\/?$/i.test(url.trim());
}
function mergeMemories(existing: string[], incoming: string[]): string[] {
  const seen = new Set(existing.map(normalize));
  const merged = [...existing];
  for (const m of incoming) {
    const n = normalize(m);
    if (n && !seen.has(n)) {
      seen.add(n);
      merged.push(m);
    }
  }
  return merged.slice(-MAX_MEMORIES);
}

export const Route = createFileRoute("/")({ component: Jarvis });

function loadMessages(): Msg[] {
  if (typeof window === "undefined") return [GREETING];
  try {
    const raw = window.localStorage.getItem(STORAGE_KEY);
    if (!raw) return [GREETING];
    const parsed = JSON.parse(raw) as Msg[];
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
      const res = await createSkillCall({ data: { id: name, name, instructions } });
      if (res?.ok) {
        setNewSkillMsg(`Skill "${name}" criada. Já está na lista e ativada.`);
        setNewSkillName("");
        setNewSkillInstr("");
        const list = await skillsList({});
        setSkillsData(list ?? []);
        if (res.id) {
          setActiveSkills((prev) => (prev.includes(res.id!) ? prev : [...prev, res.id!]));
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
      setIntegracoes((r as Integration[] | undefined) ?? []);
    } catch {
      /* noop */
    }
  };
  const submitIntegracao = async () => {
    if (!intForm.name.trim() || !intForm.url.trim()) {
      setIntMsg("Nome e URL são obrigatórios, senhor.");
      return;
    }
    try {
      await intSave({ data: { ...intForm, token: intForm.token || undefined } });
      setIntForm({ name: "", kind: "n8n", url: "http://127.0.0.1:5678", token: "" });
      setIntMsg("Integração salva, senhor.");
      await refreshIntegracoes();
    } catch (e) {
      setIntMsg(`Falha ao salvar: ${e instanceof Error ? e.message.slice(0, 160) : e}`);
    }
  };
  const testarIntegracao = async (id: string) => {
    setIntMsg(`Testando ${id}…`);
    try {
      const r = (await intTest({ data: { id } })) as { ok: boolean; tools?: string[]; count?: number; error?: string };
      setIntMsg(r.ok ? `${id}: ${r.count} ferramenta(s) online — ${r.tools?.join(", ")}` : `${id}: ${r.error}`);
    } catch (e) {
      setIntMsg(`Falha no teste: ${e instanceof Error ? e.message.slice(0, 160) : e}`);
    }
  };
  const [messages, setMessages] = useState<Msg[]>([GREETING]);
  const [memories, setMemories] = useState<string[]>([]);
  const [hydrated, setHydrated] = useState(false);
  const [input, setInput] = useState("");
  const [attachments, setAttachments] = useState<Attachment[]>([]);
  const [attachError, setAttachError] = useState<string | null>(null);
  const [cameraOpen, setCameraOpen] = useState(false);
  const [imgOpen, setImgOpen] = useState(false);
  const [imgPrompt, setImgPrompt] = useState("");
  const [imgRatio, setImgRatio] = useState<string>("3:4");
  const [loading, setLoading] = useState(false);
  const [speaking, setSpeaking] = useState(false);
  const [voicePaused, setVoicePaused] = useState(false);
  const [voiceOn, setVoiceOn] = useState(true);
  const [wakeMode, setWakeMode] = useState<WakeMode>("off");
  const [wakeOpen, setWakeOpen] = useState(false);
  const [srSupported, setSrSupported] = useState(true);
  const [clearFlash, setClearFlash] = useState(false);
  useEffect(() => { setSrSupported(speechRecognitionSupported()); }, []);
  const [screenOn, setScreenOn] = useState(false);
  const [skillsOpen, setSkillsOpen] = useState(false);
  const [activeSkills, setActiveSkills] = useState<string[]>([]);
  const [skillsData, setSkillsData] = useState<{ id: string; name: string; description: string }[]>([]);
  const [integracoesOpen, setIntegracoesOpen] = useState(false);
  const [integracoes, setIntegracoes] = useState<Integration[]>([]);
  const [tasksOpen, setTasksOpen] = useState(false);
  const [tasksToken, setTasksToken] = useState("");
  const [tasksTokenLoaded, setTasksTokenLoaded] = useState(false);
  const [tasksState, setTasksState] = useState<ScheduledTaskState | null>(null);
  const [tasksLoading, setTasksLoading] = useState(false);
  const [tasksError, setTasksError] = useState<string | null>(null);
  const [tgNotify, setTgNotify] = useState<{ id: number; text: string; reply: string } | null>(null);
  const lastTgNotifyId = useRef(0);
  const [intForm, setIntForm] = useState<{ name: string; kind: "mcp" | "n8n" | "webhook"; url: string; token: string }>({
    name: "",
    kind: "n8n",
    url: "http://127.0.0.1:5678",
    token: "",
  });
  const [intMsg, setIntMsg] = useState("");
  const [newSkillName, setNewSkillName] = useState("");
  const [newSkillInstr, setNewSkillInstr] = useState("");
  const [newSkillMsg, setNewSkillMsg] = useState<string | null>(null);
  const [coverOpen, setCoverOpen] = useState(false);
  const [system, setSystem] = useState<SystemTheme>("blue");
  const [themeOpen, setThemeOpen] = useState(false);
  const [memoryOpen, setMemoryOpen] = useState(false);
  const [newMemory, setNewMemory] = useState("");
  const [bridge, setBridge] = useState<BridgeConfig | null>(null);
  const [bridgeStatus, setBridgeStatus] = useState<"offline" | "online" | "error">("offline");
  const [bridgeOpen, setBridgeOpen] = useState(false);
  const [bridgeUrl, setBridgeUrl] = useState("http://127.0.0.1:7843");
  const [bridgeToken, setBridgeToken] = useState("");
  const [bridgeError, setBridgeError] = useState<string | null>(null);
  const [bridgeTesting, setBridgeTesting] = useState(false);

  const [isMobile, setIsMobile] = useState(false);
  const [toolLog, setToolLog] = useState<string[]>([]);
  const [qrImage, setQrImage] = useState<string | null>(null);
  const [qrOpen, setQrOpen] = useState(false);
  const bridgeRef = useRef<BridgeConfig | null>(null);
  const memoriesRef = useRef<string[]>([]);
  const inputRef = useRef<HTMLTextAreaElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const cameraVideoRef = useRef<HTMLVideoElement>(null);
  const cameraStreamRef = useRef<MediaStream | null>(null);
  const screenStreamRef = useRef<MediaStream | null>(null);
  const mirrorStreamRef = useRef<MediaStream | null>(null);
  const scrollRef = useRef<HTMLDivElement>(null);

  useEffect(() => { memoriesRef.current = memories; }, [memories]);

  const refreshScheduledTasks = useCallback(async (token = tasksToken) => {
    if (!token.trim()) {
      setTasksError("Informe a chave de acesso configurada no servidor.");
      return;
    }
    setTasksLoading(true);
    setTasksError(null);
    try {
      const response = await fetch("/api/scheduled-tasks", {
        cache: "no-store",
        headers: { Authorization: `Bearer ${token.trim()}` },
      });
      const data = (await response.json()) as ScheduledTaskState | { error?: string };
      if (!response.ok) {
        throw new Error("error" in data && data.error ? data.error : `Falha HTTP ${response.status}.`);
      }
      const state = data as ScheduledTaskState;
      setTasksState(state);
    } catch (error) {
      setTasksError(error instanceof Error ? error.message : "Não foi possível carregar as tarefas.");
    } finally {
      setTasksLoading(false);
    }
  }, [tasksToken]);

  const runScheduledTaskAction = useCallback(async () => {
    if (!tasksToken.trim()) {
      setTasksError("Informe a chave de acesso configurada no servidor.");
      return;
    }
    setTasksLoading(true);
    setTasksError(null);
    try {
      const response = await fetch("/api/scheduled-tasks", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${tasksToken.trim()}`,
        },
        body: JSON.stringify({ action: "run" }),
      });
      const data = (await response.json()) as ScheduledTaskState | { error?: string };
      if (!response.ok) {
        throw new Error("error" in data && data.error ? data.error : `Falha HTTP ${response.status}.`);
      }
      const state = data as ScheduledTaskState;
      setTasksState(state);
      if (state.result?.report) {
        setMessages((current) => [
          ...current,
          {
            role: "assistant" as const,
            content: `🗓️ **Resumo de notícias de IA**\n\n${state.result!.report}`,
          },
        ]);
      }
    } catch (error) {
      setTasksError(error instanceof Error ? error.message : "Não foi possível executar a tarefa.");
    } finally {
      setTasksLoading(false);
    }
  }, [tasksToken]);

  useEffect(() => {
    try {
      for (const t of THEMES) {
        const on = t.id === system;
        document.documentElement.classList.toggle(`theme-${t.id}`, on);
        document.body.classList.toggle(`theme-${t.id}`, on);
      }
      if (hydrated) window.localStorage.setItem("jarvis:system:v1", system);
    } catch {
      /* noop */
    }
  }, [system, hydrated]);

  // Hydrate from localStorage
  useEffect(() => {
    setIsMobile(isMobileDevice());
    try {
      const w = window.localStorage.getItem(WAKE_KEY);
      if (w === "word" || w === "clap" || w === "both") setWakeMode(w);
    } catch {
      /* noop */
    }
    try {
      const s = window.localStorage.getItem("jarvis:system:v1");
      if (THEMES.some((t) => t.id === s)) setSystem(s as SystemTheme);
    } catch {
      /* noop */
    }
    setMessages(loadMessages());
    setMemories(loadMemories());
    const paired = readPairingFromHash();
    const b = paired ?? loadBridge();
    const draft = loadBridgeDraft();
    const migrateBridge = (config: BridgeConfig | null) => {
      if (!config) return null;
      if (config.url.replace(/\/$/, "").endsWith(":7842")) {
        return { ...config, url: config.url.replace(/:7842\/?$/, ":7843"), token: "jarvis-local-7843-2026" };
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
      void health(migratedBridge)
        .then(() => {
          setBridge(migratedBridge);
          bridgeRef.current = migratedBridge;
          saveBridge(migratedBridge);
          setBridgeStatus("online");
        })
        .catch((e: unknown) => {
          setBridgeStatus("error");
          if (paired) setBridgeError(e instanceof Error ? e.message : "Falha ao conectar");
        });
    }
    setHydrated(true);
  }, []);


  useEffect(() => { bridgeRef.current = bridge; }, [bridge]);

  // Persist o que foi digitado no painel (URL + token), mesmo sem conexão OK
  useEffect(() => {
    if (!hydrated) return;
    saveBridgeDraft({ url: bridgeUrl, token: bridgeToken });
  }, [bridgeUrl, bridgeToken, hydrated]);

  useEffect(() => {
    if (!hydrated) return;
    // Nao persistimos data: URLs nem quadros (estouram a quota) - apenas o rotulo.
    const slim = messages.map((m) => ({
      ...m,
      attachments: m.attachments?.map((a) => ({
        ...a,
        url: a.url.startsWith("data:") ? "" : a.url,
        frames: undefined,
        transcript: a.transcript ? a.transcript.slice(0, 2000) : undefined,
      })),
    }));
    try { window.localStorage.setItem(STORAGE_KEY, JSON.stringify(slim)); } catch { /* quota */ }
  }, [messages, hydrated]);

  useEffect(() => {
    if (!hydrated) return;
    try { window.localStorage.setItem(WAKE_KEY, wakeMode); } catch { /* quota */ }
  }, [wakeMode, hydrated]);

  useEffect(() => {
    if (!hydrated) return;
    try {
      const s = window.localStorage.getItem("jarvis:skills:v1");
      if (s) setActiveSkills(JSON.parse(s));
    } catch { /* noop */ }
  }, [hydrated]);

  useEffect(() => {
    if (!hydrated) return;
    try {
      const token = window.localStorage.getItem(TASKS_TOKEN_KEY) ?? "";
      setTasksToken(token);
    } catch {
      setTasksToken("");
    } finally {
      setTasksTokenLoaded(true);
    }
  }, [hydrated]);

  useEffect(() => {
    if (!hydrated || !tasksTokenLoaded) return;
    try { window.localStorage.setItem(TASKS_TOKEN_KEY, tasksToken); } catch { /* quota */ }
  }, [hydrated, tasksTokenLoaded, tasksToken]);

  useEffect(() => {
    if (!hydrated || !tasksToken) return;
    void refreshScheduledTasks(tasksToken);
  }, [hydrated, tasksToken, refreshScheduledTasks]);

  // Polling de notificacoes do Telegram (bip + toast quando chega mensagem)
  useEffect(() => {
    if (!hydrated) return;
    const timer = window.setInterval(async () => {
      try {
        const res = await fetch("/api/telegram-notify", { cache: "no-store" });
        if (!res.ok) return;
        const data = (await res.json()) as { last?: { id: number; text: string; reply: string } | null };
        const ev = data.last;
        if (!ev || ev.id <= lastTgNotifyId.current) return;
        lastTgNotifyId.current = ev.id;
        setTgNotify({ id: ev.id, text: ev.text, reply: ev.reply });
        // bip via Web Audio
        try {
          const ctx = new (window.AudioContext || (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext)();
          const osc = ctx.createOscillator();
          const gain = ctx.createGain();
          osc.connect(gain);
          gain.connect(ctx.destination);
          osc.frequency.value = 880;
          gain.gain.value = 0.15;
          osc.start();
          osc.stop(ctx.currentTime + 0.15);
          setTimeout(() => ctx.close(), 300);
        } catch { /* noop */ }
      } catch { /* noop */ }
    }, 5000);
    return () => window.clearInterval(timer);
  }, [hydrated]);

  useEffect(() => {
    skillsList({}).then((r) => setSkillsData(r ?? [])).catch(() => {});
  }, [skillsList]);

  useEffect(() => {
    if (!hydrated) return;
    try { window.localStorage.setItem("jarvis:skills:v1", JSON.stringify(activeSkills)); } catch { /* noop */ }
  }, [activeSkills, hydrated]);

  useEffect(() => {
    if (!hydrated) return;
    try { window.localStorage.setItem(MEMORY_KEY, JSON.stringify(memories)); } catch { /* quota */ }
  }, [memories, hydrated]);

  useEffect(() => {
    scrollRef.current?.scrollTo({ top: scrollRef.current.scrollHeight, behavior: "smooth" });
  }, [messages, loading]);

  useEffect(() => { inputRef.current?.focus(); }, []);


  const testBridge = useCallback(async () => {
    const cfg = { url: bridgeUrl.trim().replace(/\/$/, ""), token: bridgeToken.trim() };
    if (!cfg.url || !cfg.token) { setBridgeError("URL e token obrigatórios"); return; }
    setBridgeError(null);
    setBridgeTesting(true);
    try {
      await health(cfg);
      setBridge(cfg); bridgeRef.current = cfg; saveBridge(cfg); setBridgeStatus("online");
    } catch (e) {
      setBridgeStatus("error");
      setBridgeError(e instanceof Error ? e.message : "Falha ao conectar");
    } finally {
      setBridgeTesting(false);
    }
  }, [bridgeUrl, bridgeToken]);


  const disconnectBridge = useCallback(() => {
    setBridge(null); bridgeRef.current = null; saveBridge(null); setBridgeStatus("offline");
  }, []);

  // QR code de pareamento (URL + token) para escanear no celular
  useEffect(() => {
    if (!qrOpen) { setQrImage(null); return; }
    const url = bridgeUrl.trim();
    const token = bridgeToken.trim();
    if (!url || !token) { setQrImage(null); return; }
    let alive = true;
    void QRCode.toDataURL(pairingUrl({ url, token }), {
      width: 320,
      margin: 1,
      errorCorrectionLevel: "M",
      color: { dark: "#0b1622", light: "#ffffff" },
    })
      .then((data) => { if (alive) setQrImage(data); })
      .catch(() => { if (alive) setQrImage(null); });
    return () => { alive = false; };
  }, [qrOpen, bridgeUrl, bridgeToken]);

  const cancelledRef = useRef(false);
  const stopGeneration = useCallback(() => {
    cancelledRef.current = true;
    cancelSpeech();
    setSpeaking(false);
    setVoicePaused(false);
    setLoading(false);
  }, []);

  const grabShot = useCallback(async (): Promise<Attachment | null> => {
    const stream = mirrorStreamRef.current;
    if (!stream) return null;
    try {
      const url = await captureFrame(stream, 768);
      return { id: newId(), kind: "image", name: "camera-ao-vivo.jpg", mediaType: "image/jpeg", url, size: url.length, note: "ao vivo" };
    } catch {
      return null;
    }
  }, []);

  const send = useCallback(
    async (text: string) => {
      const clean = text.trim();
      const shot = screenOn ? await grabShot() : null;
      const outgoing = shot ? [...attachments, shot] : attachments;
      if ((!clean && !outgoing.length) || loading) return;
      cancelledRef.current = false;
      void primeAudio();
      cancelSpeech();
      setSpeaking(false);
      setVoicePaused(false);
      const names = outgoing.map((a) => a.name).join(", ");
      const displayContent = outgoing.length ? `${clean || "Analise os anexos"}\n[Anexos: ${names}]` : clean;
      const userMsg: Msg = {
        role: "user",
        content: displayContent,
        ...(outgoing.length ? { attachments: outgoing } : {}),
      };
      const displayNext: Msg[] = [...messages, userMsg];
      setMessages(displayNext);
      setInput("");
      setAttachments([]);
      setAttachError(null);
      setLoading(true);
      setToolLog([]);
      try {
        const currentMemories = memoriesRef.current;
        // Build initial ModelMessage[] from the visible transcript (multimodal).
        // Only the latest turn carries attachment payloads; older ones are
        // stripped so requests stay small (free-tier token limits).
        let lastWithAtt = -1;
        for (let i = displayNext.length - 1; i >= 0; i--) {
          if (displayNext[i].role === "user" && displayNext[i].attachments?.length) { lastWithAtt = i; break; }
        }
        let modelMessages: unknown[] = displayNext.map((m, idx) => {
          const atts = idx === lastWithAtt ? (m.attachments ?? []) : [];
          if (m.role !== "user" || !atts.length) return { role: m.role, content: m.content };
          const parts: unknown[] = [{ type: "text", text: m.content }];
          for (const a of atts) {
            if (a.kind === "image" && a.url) {
              parts.push({ type: "image", image: a.url });
            } else if (a.kind === "video") {
              for (const f of a.frames ?? []) parts.push({ type: "image", image: f });
              parts.push({
                type: "text",
                text: a.frames?.length
                  ? `[Video "${a.name}": ${a.frames.length} quadros acima, em ordem.]`
                  : `[Video "${a.name}": sem quadros extraidos.]`,
              });
              if (a.videoUrl) {
                parts.push({
                  type: "text",
                  text: `[o arquivo de video esta disponivel em: ${a.videoUrl}]`,
                });
              }
            } else if (a.kind === "pdf" && a.url) {
              parts.push({ type: "file", data: a.url, mediaType: "application/pdf", filename: a.name });
            } else if (a.kind === "audio") {
              parts.push({
                type: "text",
                text: a.transcript ? `[Audio "${a.name}" - transcricao]\n${a.transcript}` : `[Audio "${a.name}" sem transcricao.]`,
              });
            } else if (a.transcript) {
              parts.push({ type: "text", text: `[Arquivo "${a.name}"]\n${a.transcript}` });
            } else if (a.url && !a.url.startsWith("data:")) {
              parts.push({ type: "text", text: `[Link para analise: ${a.url}] Use fetch_url para ler.` });
            }
          }
          return { role: "user", content: parts };
        });
        let finalText = "";
        const MAX_ROUNDS = 8;
        const completedToolCalls = new Map<string, number>();
        let desktopObserved = false;
        for (let round = 0; round < MAX_ROUNDS; round++) {
          const cfg = bridgeRef.current;
          const res = await ask({
            data: {
              messages: modelMessages,
              memories: currentMemories,
              hasBridge: !!cfg && bridgeStatus === "online",
              activeSkills,
            },
          });
          finalText = res.text || finalText;
          if (cancelledRef.current) { setLoading(false); return; }
          const responseMsgs = JSON.parse(res.responseMessagesJson) as unknown[];
          modelMessages = [...modelMessages, ...responseMsgs];
          if (!res.pending.length) break;
          if (!cfg) {
            finalText = "A bridge local está offline, senhor — não posso tocar na sua máquina agora. Rode `python3 agent/jarvis_agent.py` e cole a URL + token no painel do plug.";
            break;
          }
          const pendingSignature = res.pending
            .map((call) => `${call.name}:${call.inputJson}`)
            .sort()
            .join("|");
          const repeatCount = completedToolCalls.get(pendingSignature) ?? 0;
          if (repeatCount >= 4) {
            finalText = finalText || "A mesma ação foi solicitada repetidamente, senhor. Interrompi para evitar um ciclo.";
            break;
          }
          completedToolCalls.set(pendingSignature, repeatCount + 1);
          const toolResults: { toolCallId: string; toolName: string; output: unknown }[] = [];
          const screenWasObservedBeforeBatch = desktopObserved;
          let mouseActionDone = false;
          for (const call of res.pending) {
            let input: Record<string, unknown> = {};
            try { input = JSON.parse(call.inputJson) as Record<string, unknown>; } catch { /* */ }
            setToolLog((l) => [...l, `▶ ${call.name} ${JSON.stringify(input).slice(0, 120)}`]);
            if (call.name === "mouse_control" && (!screenWasObservedBeforeBatch || mouseActionDone)) {
              toolResults.push({
                toolCallId: call.id, toolName: call.name,
                output: { error: "Capture a tela e analise a imagem antes de cada ação do mouse." },
              });
              continue;
            }
            try {
              const output = await runTool(cfg, call.name, input);
              toolResults.push({ toolCallId: call.id, toolName: call.name, output });
              const hasScreenshot = typeof output === "object" && output !== null && "data" in output && typeof (output as { data?: unknown }).data === "string";
              if (call.name === "open_app" || call.name === "type_text" || call.name === "shell_exec") desktopObserved = false;
              if ((call.name === "take_screenshot" || call.name === "open_and_view") && hasScreenshot) desktopObserved = true;
              if (call.name === "mouse_control" && typeof output === "object" && output !== null && "ok" in output && (output as { ok?: unknown }).ok === true) {
                desktopObserved = false;
                mouseActionDone = true;
              }
            } catch (e) {
              toolResults.push({
                toolCallId: call.id, toolName: call.name,
                output: { error: e instanceof Error ? e.message : String(e) },
              });
            }
            if (cancelledRef.current) { setLoading(false); return; }
          }
          if (cancelledRef.current) { setLoading(false); return; }
          modelMessages.push({
            role: "tool",
            content: toolResults.map((r) => {
              const img = (r.toolName === "image_view" || r.toolName === "take_screenshot" || r.toolName === "open_and_view") && typeof r.output === "object" && r.output !== null && "data" in r.output
                ? (r.output as { data?: unknown; mediaType?: unknown })
                : null;
              const base64 = img && typeof img.data === "string" ? img.data.replace(/^data:[^;]+;base64,/, "") : "";
              if (base64) {
                // AI SDK v7: tool-result com mídia exige output { type: "content" } e
                // a parte de arquivo com data tagueada ({ type: "data", data }).
                return {
                  type: "tool-result",
                  toolCallId: r.toolCallId,
                  toolName: r.toolName,
                  output: {
                    type: "content",
                    value: [{
                      type: "file",
                      data: { type: "data", data: base64 },
                      mediaType: typeof img?.mediaType === "string" ? img.mediaType : "image/png",
                      filename: `${r.toolName}.png`,
                    }],
                  },
                };
              }
              let value: unknown = r.output ?? null;
              try { value = JSON.parse(JSON.stringify(value)); } catch { value = String(value); }
              return {
                type: "tool-result",
                toolCallId: r.toolCallId,
                toolName: r.toolName,
                output: { type: "json", value },
              };
            }),
          });
        }
        if (cancelledRef.current) { setLoading(false); return; }
        const reply = finalText || "…";
        setMessages((m) => [...m, { role: "assistant", content: reply }]);
        if (voiceOn) {
          void speak(reply, { onStart: () => setSpeaking(true), onEnd: () => { setSpeaking(false); setVoicePaused(false); }, bridge: bridgeRef.current });
        }
        void extract({
          data: { userMessage: clean, assistantMessage: reply, existingMemories: currentMemories },
        })
          .then(({ memories: found }) => {
            if (found.length) setMemories((prev) => mergeMemories(prev, found));
          })
          .catch(() => { /* silent */ });
      } catch (err) {
        if (cancelledRef.current) { setLoading(false); return; }
        console.error(err);
        setMessages((m) => [
          ...m,
          { role: "assistant", content: "Falha de comunicação, senhor. Tente novamente." },
        ]);
      } finally {
        setLoading(false);
        setTimeout(() => inputRef.current?.focus(), 0);
      }
    },
    [ask, extract, attachments, loading, messages, voiceOn, bridgeStatus, screenOn, grabShot, activeSkills],
  );

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

  // Ativacao por "JARVIS" ou duas palmas: liga o microfone principal.
  const wake = useWake({
    mode: wakeMode,
    paused: speech.listening || loading || speaking,
    hold: speech.listening,
    onWake: () => {
      void primeAudio();
      if (!speech.listening) speech.start();
    },
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    void send(input);
  };

  const downscaleImage = (dataUrl: string, maxDim = 768): Promise<string> =>
    new Promise((resolve) => {
      const img = new Image();
      img.onload = () => {
        const scale = Math.min(1, maxDim / Math.max(img.width, img.height));
        if (scale >= 1) { resolve(dataUrl); return; }
        const canvas = document.createElement("canvas");
        canvas.width = Math.round(img.width * scale);
        canvas.height = Math.round(img.height * scale);
        canvas.getContext("2d")?.drawImage(img, 0, 0, canvas.width, canvas.height);
        resolve(canvas.toDataURL("image/jpeg", 0.85));
      };
      img.onerror = () => resolve(dataUrl);
      img.src = dataUrl;
    });

  const pushImageAttachment = (dataUrl: string, name: string) => {
    const id = newId();
    setAttachments((a) => [...a, { id, kind: "image", name, mediaType: "image/jpeg", url: dataUrl, size: dataUrl.length }]);
  };

  const removeAttachment = (id: string) => setAttachments((a) => a.filter((x) => x.id !== id));

  const handleFiles = async (files: FileList | File[] | undefined) => {
    if (!files) return;
    const list = Array.from(files);
    const errors: string[] = [];
    for (const file of list) {
      const invalid = validateFile(file);
      if (invalid) { errors.push(invalid); continue; }
      const mediaType = (file.type || guessMimeFromUrl(file.name)).toLowerCase();
      const kind = kindFromMime(mediaType, file.name);
      const id = newId();
      const base: Attachment = { id, kind, name: file.name, mediaType, url: "", size: file.size };
      try {
        if (kind === "file") {
          const text = await fileToText(file);
          setAttachments((a) => [...a, { ...base, transcript: text.slice(0, 40000), note: "texto extraido" }]);
          continue;
        }
        const url = await fileToDataUrl(file);
        if (kind === "audio") {
          setAttachments((a) => [...a, { ...base, url, note: "transcrevendo..." }]);
          const res = await transcribe({ data: { dataUrl: url, filename: file.name } });
          if (res.error || !res.text) {
            setAttachments((a) => a.filter((x) => x.id !== id));
            errors.push(`${file.name}: ${res.error ?? "nao foi possivel transcrever."}`);
            continue;
          }
          setAttachments((a) => a.map((x) => (x.id === id ? { ...x, transcript: res.text, note: "transcrito" } : x)));
          continue;
        }
        if (kind === "video") {
          setAttachments((a) => [...a, { ...base, url, note: "extraindo quadros..." }]);
          try {
            const frames = await extractVideoFrames(file, 3, 640);
            setAttachments((a) => a.map((x) => (x.id === id ? { ...x, frames, note: `${frames.length} quadros` } : x)));
          } catch {
            setAttachments((a) => a.map((x) => (x.id === id ? { ...x, note: "quadros indisponiveis" } : x)));
            errors.push(`${file.name}: sem quadros - mande um print.`);
          }
          if (file.size <= 4_000_000) {
            try {
              const res = await fetch("/api/upload", {
                method: "POST",
                body: file,
                headers: { "Content-Type": file.type || "video/mp4" },
              });
              const j = (await res.json()) as { url?: string; error?: string };
              if (j.url) {
                setAttachments((a) =>
                  a.map((x) => (x.id === id ? { ...x, videoUrl: j.url, note: `${x.note ?? ""} · pronto para editar`.trim() } : x)),
                );
              }
            } catch {
              /* sem upload; edição via caminho no PC */
            }
          } else {
            setAttachments((a) =>
              a.map((x) => (x.id === id && !x.videoUrl ? { ...x, note: `${x.note ?? ""} · grande p/ editar; informe o caminho no PC`.trim() } : x)),
            );
          }
          continue;
        }
        if (kind === "image") {
          const small = await downscaleImage(url);
          setAttachments((a) => [...a, { ...base, url: small }]);
          continue;
        }
        setAttachments((a) => [...a, { ...base, url }]);
      } catch (e) {
        errors.push(`${file.name}: ${e instanceof Error ? e.message : "falha ao processar."}`);
      }
    }
    if (errors.length) setAttachError(errors.join(" "));
  };

  const openCamera = async () => {
    if (!navigator.mediaDevices?.getUserMedia) return;
    try {
      cameraStreamRef.current = await navigator.mediaDevices.getUserMedia({ video: true });
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
      const stream = await navigator.mediaDevices.getDisplayMedia({ video: true, audio: false });
      screenStreamRef.current = stream;
      const video = document.createElement("video");
      video.srcObject = stream;
      await video.play();
      await new Promise((resolve) => { video.onloadedmetadata = resolve; });
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
    if (screenOn) { stopMirror(); setAttachError(null); return; }
    setAttachError(null);
    try {
      const { stream, note } = await startVisionStream("environment");
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

  const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
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
    if (speech.listening) return { label: "OUVINDO", color: "text-gold text-glow-gold" };
    if (loading) return { label: "PROCESSANDO", color: "text-hud text-glow" };
    if (speaking) return { label: "RESPONDENDO", color: "text-hud text-glow" };
    if (wakeMode !== "off" && wake.armed) return { label: 'AGUARDANDO "JARVIS"', color: "text-hud/80 text-glow" };
    return { label: "ONLINE", color: "text-hud/80 text-glow" };
  }, [speech.listening, loading, speaking, wakeMode, wake.armed]);

  const reactorActive = speech.listening || loading || speaking;

  return (
    <div className="relative min-h-screen overflow-hidden">
      {tgNotify && (
        <div
          className="fixed bottom-4 right-4 z-50 max-w-sm rounded-lg border border-hud/40 bg-card/95 p-4 shadow-hud backdrop-blur-sm"
          onClick={() => setTgNotify(null)}
        >
          <div className="mb-1 flex items-center gap-2 font-mono text-sm uppercase tracking-widest text-hud">
            <span>●</span> Mensagem no Telegram
          </div>
          <p className="font-mono text-base text-foreground">{tgNotify.text}</p>
          {tgNotify.reply && (
            <p className="mt-2 font-mono text-sm text-muted-foreground">Jarvis: {tgNotify.reply}</p>
          )}
          <p className="mt-2 font-mono text-[10px] text-muted-foreground/60">clique para fechar</p>
        </div>
      )}
      {/* HUD background */}
      <div className="pointer-events-none absolute inset-0 hud-grid opacity-40" />
      <div className="pointer-events-none absolute inset-x-0 top-0 h-px bg-gradient-to-r from-transparent via-hud to-transparent opacity-70" />
      <div className="pointer-events-none absolute inset-x-0 bottom-0 h-px bg-gradient-to-r from-transparent via-hud to-transparent opacity-70" />
      <div className="pointer-events-none absolute inset-0 overflow-hidden">
        <div className="absolute inset-x-0 top-0 h-24 bg-gradient-to-b from-hud/10 to-transparent jarvis-scan" />
      </div>

      <div className="relative mx-auto flex min-h-screen max-w-5xl flex-col px-4 pb-8 pt-6 sm:px-6 sm:pb-10 sm:pt-8">
        {/* Header */}
        <header className="border-b border-hud/20 pb-4">
          <div className="flex items-center justify-between gap-3">
            <div className="flex min-w-0 items-center gap-3">
              <ReactorBadge active={reactorActive} />
              <div className="min-w-0">
                <h1 className="truncate text-lg font-bold tracking-[0.2em] text-hud text-glow sm:text-xl sm:tracking-[0.35em]">
                  J.A.R.V.I.S.
                </h1>
                <p className="truncate font-mono text-[9px] uppercase tracking-widest text-muted-foreground sm:text-[10px]">
                  Just A Rather Very Intelligent System
                </p>
              </div>
            </div>
            <div className={cn("hidden font-mono text-xs tracking-widest sm:block", status.color)}>
              ● {status.label}
            </div>
          </div>
          <div className="mt-3 flex flex-wrap items-center gap-1.5">
            <IconButton title="Abrir capa holografica" onClick={() => setCoverOpen(true)}>
              <Sparkles size={16} />
            </IconButton>
            <IconButton
              title={`Tema: ${THEMES.find((t) => t.id === system)?.label ?? system} (trocar)`}
              onClick={() => setThemeOpen((o) => !o)}
              active={themeOpen}
            >
              <Palette size={16} />
            </IconButton>
            <IconButton
              title={skillsOpen ? "Fechar skills" : `Skills (${activeSkills.length} ativas)`}
              onClick={() => setSkillsOpen((o) => !o)}
              active={skillsOpen}
            >
              <Brain size={16} />
            </IconButton>
            <IconButton
              title={tasksOpen ? "Fechar tarefas agendadas" : "Tarefas agendadas"}
              onClick={() => {
                const next = !tasksOpen;
                setTasksOpen(next);
                if (next && tasksToken) void refreshScheduledTasks(tasksToken);
              }}
              active={tasksOpen}
            >
              <CalendarClock size={16} />
            </IconButton>
            <IconButton
              title={integracoesOpen ? "Fechar integrações" : `Integrações (${integracoes.length})`}
              onClick={() => {
                const next = !integracoesOpen;
                setIntegracoesOpen(next);
                if (next) void refreshIntegracoes();
              }}
              active={integracoesOpen}
            >
              <Puzzle size={16} />
            </IconButton>
            <IconButton
              title="Abrir JARVIS no Telegram (@jarvisj06_bot)"
              onClick={() => window.open("https://t.me/jarvisj06_bot", "_blank", "noopener")}
            >
              <MessageCircle size={16} />
            </IconButton>
            <IconButton
              title={wakeMode === "off" ? "Ativacao por voz/palmas (desligada)" : `Ativacao: ${wakeMode}`}
              onClick={() => setWakeOpen((o) => !o)}
              active={wakeMode !== "off"}
            >
              <Radio size={16} />
            </IconButton>
            <IconButton
              title={voiceOn ? "Desligar voz" : "Ligar voz"}
              onClick={() => {
                const next = !voiceOn;
                setVoiceOn(next);
                setSpeaking(false);
                setVoicePaused(false);
                if (!next) cancelSpeech();
                if (next) void speak("Jarvis online, senhor.", { bridge: bridgeRef.current });
              }}
              active={voiceOn}
            >
              {voiceOn ? <Volume2 size={16} /> : <VolumeX size={16} />}
            </IconButton>
            {speaking && (
              <IconButton
                title={voicePaused ? "Continuar voz" : "Pausar voz"}
                onClick={() => {
                  if (voicePaused) {
                    resumeSpeech();
                    setVoicePaused(false);
                  } else if (pauseSpeech()) {
                    setVoicePaused(true);
                  }
                }}
                active={voicePaused}
              >
                {voicePaused ? <Play size={16} /> : <Pause size={16} />}
              </IconButton>
            )}
            <IconButton
              title={`Bridge local (${bridgeStatus})`}
              onClick={() => setBridgeOpen((o) => !o)}
              active={bridgeStatus === "online"}
            >
              {bridgeStatus === "online" ? <PlugZap size={16} /> : <Plug size={16} />}
            </IconButton>
            <IconButton
              title={screenOn ? "Parar câmera ao vivo" : "Câmera ao vivo (ele vê pela câmera)"}
              onClick={() => void toggleMirror()}
              active={screenOn}
            >
              {screenOn ? <MonitorOff size={16} /> : <Monitor size={16} />}
            </IconButton>
            <IconButton
              title={`Memoria (${memories.length})`}
              onClick={() => setMemoryOpen((o) => !o)}
              active={memoryOpen}
            >
              <History size={16} />
            </IconButton>
            <IconButton
              title="Limpar conversa"
              active={clearFlash}
              onClick={() => {
                clearConversation();
                setClearFlash(true);
                window.setTimeout(() => setClearFlash(false), 900);
              }}
            >
              <Trash2 size={16} />
            </IconButton>
            <div className={cn("ml-auto font-mono text-xs tracking-widest sm:hidden", status.color)}>
              ● {status.label}
            </div>
          </div>
        </header>

        {themeOpen && (
          <div className="mt-4 rounded-lg border border-hud/30 bg-card/60 p-4 shadow-hud backdrop-blur-sm">
            <div className="mb-3 flex items-center justify-between">
              <h2 className="font-mono text-xs uppercase tracking-[0.3em] text-hud text-glow">
                Tema da armadura
              </h2>
              <button type="button" onClick={() => setThemeOpen(false)} className="text-hud/60 hover:text-hud">
                <X size={14} />
              </button>
            </div>
            <div className="grid grid-cols-2 gap-2 sm:grid-cols-4">
              {THEMES.map((t) => (
                <button
                  key={t.id}
                  type="button"
                  onClick={() => { setSystem(t.id); setThemeOpen(false); }}
                  className={cn(
                    "flex items-center gap-2 rounded border px-2 py-2 font-mono text-[10px] transition",
                    system === t.id
                      ? "border-hud bg-hud/15 text-hud shadow-hud"
                      : "border-hud/25 text-muted-foreground hover:text-hud",
                  )}
                >
                  <span
                    aria-hidden
                    className="inline-block h-3 w-3 shrink-0 rounded-full border border-foreground/30"
                    style={{ backgroundColor: t.dot }}
                  />
                  {t.label}
                </button>
              ))}
            </div>
          </div>
        )}

        {wakeOpen && (
          <div className="mt-4 rounded-lg border border-hud/30 bg-card/60 p-4 shadow-hud backdrop-blur-sm">
            <div className="mb-3 flex items-center justify-between">
              <h2 className="font-mono text-xs uppercase tracking-[0.3em] text-hud text-glow">
                Ativacao sem as maos
              </h2>
              <button type="button" onClick={() => setWakeOpen(false)} className="text-hud/60 hover:text-hud">
                <X size={14} />
              </button>
            </div>
            <p className="mb-3 font-mono text-[10px] leading-relaxed text-muted-foreground">
              Escolha como me chamar: dizendo <span className="text-hud">"JARVIS"</span>, batendo{" "}
              <span className="text-hud">duas palmas</span>, ou os dois. O microfone fica escutando e abre a voz sozinho.
              {!srSupported && (
                <>
                  {" "}Neste aparelho a palavra não funciona (o iPhone/Safari bloqueia) — use{" "}
                  <span className="text-hud">Duas palmas</span>.
                </>
              )}
            </p>
            <div className="grid grid-cols-2 gap-2 sm:grid-cols-4">
              {([
                { v: "off", label: "Desligado" },
                { v: "word", label: 'Palavra "Jarvis"' },
                { v: "clap", label: "Duas palmas" },
                { v: "both", label: "Ambos" },
              ] as { v: WakeMode; label: string }[]).map((o) => (
                <button
                  key={o.v}
                  type="button"
                  disabled={o.v === "word" && !srSupported}
                  title={o.v === "word" && !srSupported ? "Palavra indisponível neste navegador" : o.label}
                  onClick={() => { void primeAudio(); setWakeMode(o.v); }}
                  className={cn(
                    "rounded border px-2 py-2 font-mono text-[10px] transition",
                    wakeMode === o.v
                      ? "border-hud bg-hud/15 text-hud shadow-hud"
                      : "border-hud/25 text-muted-foreground hover:text-hud",
                    o.v === "word" && !srSupported && "cursor-not-allowed opacity-40",
                  )}
                >
                  {o.label}
                </button>
              ))}
            </div>
            <p className="mt-3 font-mono text-[10px] text-muted-foreground">
              Estado:{" "}
              <span className={wake.armed ? "text-hud" : "text-muted-foreground"}>
                {wakeMode === "off" ? "inativo" : wake.armed ? "escutando gatilho" : "iniciando..."}
              </span>
            </p>
            {wake.error && (
              <p className="mt-1 font-mono text-[10px] text-gold">{wake.error} Libere o microfone no navegador e tente de novo.</p>
            )}
          </div>
        )}

        {skillsOpen && (
          <div className="mt-4 rounded-lg border border-hud/30 bg-card/60 p-4 shadow-hud backdrop-blur-sm">
            <div className="mb-3 flex items-center justify-between">
              <h2 className="font-mono text-xs uppercase tracking-[0.3em] text-hud text-glow">
                Skills — conhecimento extra
              </h2>
              <button type="button" onClick={() => setSkillsOpen(false)} className="text-hud/60 hover:text-hud">
                <X size={14} />
              </button>
            </div>
            <p className="mb-3 font-mono text-[10px] leading-relaxed text-muted-foreground">
              Skills são instruções especializadas que eu carrego na memória para tarefas específicas.
              Ative as que precisar — elas ficam salvas.
            </p>
            <div className="space-y-2">
              {skillsData.map((s) => {
                const on = activeSkills.includes(s.id);
                return (
                  <button
                    key={s.id}
                    type="button"
                    onClick={() =>
                      setActiveSkills((prev) =>
                        on ? prev.filter((x) => x !== s.id) : [...prev, s.id],
                      )
                    }
                    className={cn(
                      "flex w-full items-start gap-3 rounded border px-3 py-2 text-left transition",
                      on
                        ? "border-hud bg-hud/15 shadow-hud"
                        : "border-hud/20 hover:border-hud/40",
                    )}
                  >
                    <span
                      className={cn(
                        "mt-1 h-2 w-2 shrink-0 rounded-full",
                        on ? "bg-hud shadow-hud" : "bg-muted-foreground/30",
                      )}
                    />
                    <span className="min-w-0">
                      <span className={cn("block font-mono text-xs", on ? "text-hud" : "text-foreground")}>
                        {s.name}
                      </span>
                      <span className="block font-mono text-[10px] text-muted-foreground">
                        {s.description}
                      </span>
                    </span>
                  </button>
                );
              })}
            </div>
            {activeSkills.length > 0 && (
              <button
                type="button"
                onClick={() => setActiveSkills([])}
                className="mt-3 font-mono text-[10px] text-muted-foreground hover:text-gold"
              >
                Desativar todas
              </button>
            )}
            <div className="mt-4 border-t border-hud/20 pt-3">
              <h3 className="mb-2 font-mono text-[10px] uppercase tracking-[0.25em] text-hud">
                Nova skill
              </h3>
              <input
                type="text"
                value={newSkillName}
                onChange={(e) => setNewSkillName(e.target.value)}
                placeholder="Nome (ex: E-commerce)"
                className="mb-2 w-full rounded border border-hud/20 bg-input/60 px-3 py-2 font-mono text-xs text-foreground placeholder:text-muted-foreground/60 focus:border-hud focus:outline-none"
              />
              <textarea
                value={newSkillInstr}
                onChange={(e) => setNewSkillInstr(e.target.value)}
                placeholder="Instruções: como ele deve trabalhar nessa tarefa..."
                rows={4}
                className="mb-2 w-full resize-none rounded border border-hud/20 bg-input/60 px-3 py-2 font-mono text-xs text-foreground placeholder:text-muted-foreground/60 focus:border-hud focus:outline-none"
              />
              <button
                type="button"
                onClick={() => void submitSkill()}
                className="rounded border border-hud bg-hud/20 px-4 py-2 font-mono text-xs text-hud shadow-hud transition hover:bg-hud/30"
              >
                Adicionar skill
              </button>
              {newSkillMsg && (
                <p className="mt-2 font-mono text-[10px] text-gold">{newSkillMsg}</p>
              )}
            </div>
          </div>
        )}

        {tasksOpen && (
          <section className="mt-4 rounded-lg border border-hud/30 bg-card/60 p-4 shadow-hud backdrop-blur-sm">
            <div className="mb-3 flex items-center justify-between gap-3">
              <h2 className="font-mono text-xs uppercase tracking-[0.3em] text-hud text-glow">
                Tarefas agendadas
              </h2>
              <button
                type="button"
                title="Atualizar tarefas"
                disabled={tasksLoading || !tasksToken}
                onClick={() => void refreshScheduledTasks()}
                className="rounded border border-hud/20 p-2 text-hud transition hover:border-hud/50 disabled:opacity-40"
              >
                <RefreshCw size={14} className={tasksLoading ? "animate-spin" : ""} />
              </button>
            </div>
            <p className="mb-3 font-mono text-[10px] leading-relaxed text-muted-foreground">
              Notícias de OpenAI, Anthropic, Google Gemini e IA para negócios — terça e sexta, às 8h de Brasília.
              A rotina fixa envia os resumos ao Telegram, mesmo quando o Jarvis estiver fechado.
            </p>
            <p className="mb-3 font-mono text-[10px] leading-relaxed text-muted-foreground">
              Sem Redis: não há histórico nem pausa neste menu. Para pausar, desative o Cron Jobs do projeto no painel Vercel. No Hobby, a execução pode ocorrer em qualquer minuto dentro da hora programada.
            </p>
            <label className="mb-2 block font-mono text-[10px] text-muted-foreground" htmlFor="tasks-api-token">
              Chave de acesso às tarefas (JARVIS_TASKS_TOKEN do servidor)
            </label>
            <div className="mb-3 flex flex-wrap gap-2">
              <input
                id="tasks-api-token"
                type="password"
                value={tasksToken}
                onChange={(event) => setTasksToken(event.target.value)}
                autoComplete="off"
                placeholder="Cole a chave configurada no servidor"
                className="min-w-[220px] flex-1 rounded border border-hud/20 bg-input/60 px-3 py-2 font-mono text-xs text-foreground placeholder:text-muted-foreground/60 focus:border-hud focus:outline-none"
              />
              <button
                type="button"
                disabled={tasksLoading || !tasksToken.trim()}
                onClick={() => void refreshScheduledTasks()}
                className="rounded border border-hud bg-hud/20 px-3 py-2 font-mono text-[10px] text-hud transition hover:bg-hud/30 disabled:opacity-40"
              >
                Conectar
              </button>
            </div>
            {tasksError && (
              <p role="alert" className="mb-3 rounded border border-gold/30 bg-gold/10 p-2 font-mono text-[10px] leading-relaxed text-gold">
                {tasksError}
              </p>
            )}
            {tasksState && (
              <>
                <div className="mb-3 flex flex-wrap items-center justify-between gap-2 rounded border border-hud/20 p-3">
                  <div className="font-mono text-[10px] text-foreground">
                    <span className="text-hud">● Programada</span>
                    <span className="ml-2 text-muted-foreground">Terça e sexta · 08:00 · Brasília</span>
                    <p className="mt-1 text-muted-foreground">
                      Telegram: {tasksState.telegramConfigured ? "configurado" : "não configurado"}
                    </p>
                  </div>
                  <div className="flex gap-2">
                    <button
                      type="button"
                      disabled={tasksLoading}
                      onClick={() => void runScheduledTaskAction()}
                      className="rounded border border-hud/40 px-3 py-2 font-mono text-[10px] text-hud transition hover:bg-hud/10 disabled:opacity-40"
                    >
                      Executar agora
                    </button>
                  </div>
                </div>
                {tasksState.result && (
                  <pre className="max-h-80 overflow-auto whitespace-pre-wrap rounded border border-hud/15 bg-background/40 p-3 font-mono text-[10px] leading-relaxed text-foreground">
                    {tasksState.result.report}
                  </pre>
                )}
              </>
            )}
          </section>
        )}

        {integracoesOpen && (
          <div className="mt-4 rounded-lg border border-hud/30 bg-card/60 p-4 shadow-hud backdrop-blur-sm">
            <div className="mb-3 flex items-center justify-between">
              <h2 className="font-mono text-xs uppercase tracking-[0.3em] text-hud text-glow">
                Integrações — MCP, n8n e webhooks
              </h2>
              <button type="button" onClick={() => setIntegracoesOpen(false)} className="text-hud/60 hover:text-hud">
                <X size={14} />
              </button>
            </div>
            <p className="mb-3 font-mono text-[10px] leading-relaxed text-muted-foreground">
              Conecte servidores MCP, o n8n do notebook ou webhooks — eu passo a chamar as ferramentas deles nas
              conversas. Serviços locais só respondem com o notebook ligado.
            </p>

            <div className="space-y-2">
              {integracoes.length === 0 && (
                <p className="font-mono text-[10px] text-muted-foreground">
                  Nenhuma integração ainda. Adicione o n8n logo abaixo — fica pronto em um clique.
                </p>
              )}
              {integracoes.map((it) => (
                <div key={it.id} className="flex items-center gap-2 rounded border border-hud/25 px-3 py-2">
                  <span
                    className={cn(
                      "h-2 w-2 shrink-0 rounded-full",
                      it.enabled ? "bg-hud shadow-hud" : "bg-muted-foreground/30",
                    )}
                  />
                  <span className="min-w-0 flex-1">
                    <span className="block font-mono text-xs text-foreground">
                      {it.name} <span className="text-hud/60">({it.kind})</span>
                    </span>
                    <span className="block truncate font-mono text-[10px] text-muted-foreground">{it.url}</span>
                  </span>
                  <button
                    type="button"
                    onClick={() => void testarIntegracao(it.id)}
                    className="rounded border border-hud/30 px-2 py-1 font-mono text-[10px] text-hud/80 transition hover:border-hud hover:text-hud"
                  >
                    Testar
                  </button>
                  <button
                    type="button"
                    onClick={() => {
                      void intToggle({ data: { id: it.id, enabled: !it.enabled } }).then(() => refreshIntegracoes());
                    }}
                    className="rounded border border-hud/30 px-2 py-1 font-mono text-[10px] text-hud/80 transition hover:border-hud hover:text-hud"
                  >
                    {it.enabled ? "On" : "Off"}
                  </button>
                  <button
                    type="button"
                    title="Remover"
                    onClick={() => {
                      void intDelete({ data: { id: it.id } }).then(() => refreshIntegracoes());
                    }}
                    className="rounded border border-hud/30 px-2 py-1 text-gold/80 transition hover:border-gold hover:text-gold"
                  >
                    <Trash2 size={12} />
                  </button>
                </div>
              ))}
            </div>

            <div className="mt-4 border-t border-hud/20 pt-3">
              <h3 className="mb-2 font-mono text-[10px] uppercase tracking-[0.25em] text-hud">Nova integração</h3>
              <div className="mb-2 grid grid-cols-3 gap-2">
                {(
                  [
                    ["n8n", "n8n local"],
                    ["mcp", "Servidor MCP"],
                    ["webhook", "Webhook"],
                  ] as const
                ).map(([v, label]) => (
                  <button
                    key={v}
                    type="button"
                    onClick={() =>
                      setIntForm((f) => ({
                        ...f,
                        kind: v,
                        url: v === "n8n" ? "http://127.0.0.1:5678" : f.kind === "n8n" && f.url === "http://127.0.0.1:5678" ? "" : f.url,
                      }))
                    }
                    className={cn(
                      "rounded border px-2 py-2 font-mono text-[10px] transition",
                      intForm.kind === v
                        ? "border-hud bg-hud/15 text-hud shadow-hud"
                        : "border-hud/25 text-muted-foreground hover:text-hud",
                    )}
                  >
                    {label}
                  </button>
                ))}
              </div>
              <input
                type="text"
                value={intForm.name}
                onChange={(e) => setIntForm((f) => ({ ...f, name: e.target.value }))}
                placeholder="Nome (ex: n8n, Meu MCP)"
                className="mb-2 w-full rounded border border-hud/20 bg-input/60 px-3 py-2 font-mono text-xs text-foreground placeholder:text-muted-foreground/60 focus:border-hud focus:outline-none"
              />
              <input
                type="text"
                value={intForm.url}
                onChange={(e) => setIntForm((f) => ({ ...f, url: e.target.value }))}
                placeholder={
                  intForm.kind === "mcp"
                    ? "URL do servidor MCP (ex: http://127.0.0.1:3000/mcp)"
                    : intForm.kind === "n8n"
                      ? "URL do n8n (ex: http://127.0.0.1:5678)"
                      : "URL do webhook (ex: https://…/webhook/xxx)"
                }
                className="mb-2 w-full rounded border border-hud/20 bg-input/60 px-3 py-2 font-mono text-xs text-foreground placeholder:text-muted-foreground/60 focus:border-hud focus:outline-none"
              />
              <input
                type="password"
                value={intForm.token}
                onChange={(e) => setIntForm((f) => ({ ...f, token: e.target.value }))}
                placeholder="Token / API key (opcional)"
                className="mb-2 w-full rounded border border-hud/20 bg-input/60 px-3 py-2 font-mono text-xs text-foreground placeholder:text-muted-foreground/60 focus:border-hud focus:outline-none"
              />
              <button
                type="button"
                onClick={() => void submitIntegracao()}
                className="rounded border border-hud bg-hud/20 px-4 py-2 font-mono text-xs text-hud shadow-hud transition hover:bg-hud/30"
              >
                Adicionar integração
              </button>
              {intMsg && <p className="mt-2 font-mono text-[10px] text-gold">{intMsg}</p>}
            </div>
          </div>
        )}

        {bridgeOpen && (
          <div className="mt-4 rounded-lg border border-hud/30 bg-card/60 p-4 shadow-hud backdrop-blur-sm">
            <div className="mb-3 flex items-center justify-between">
              <h2 className="font-mono text-xs uppercase tracking-[0.3em] text-hud text-glow">
                Bridge local — {bridgeStatus}
              </h2>
              <button type="button" onClick={() => setBridgeOpen(false)} className="text-hud/60 hover:text-hud">
                <X size={14} />
              </button>
            </div>
            <p className="mb-3 font-mono text-[10px] leading-relaxed text-muted-foreground">
              Modo recomendado (notebook <em>e</em> celular, funciona em HTTPS):
            </p>
            <pre className="mb-3 overflow-x-auto rounded border border-hud/20 bg-black/50 p-2 font-mono text-[10px] text-hud/90">
              python3 agent/jarvis_agent.py --tunnel
            </pre>
            <p className="mb-3 font-mono text-[10px] leading-relaxed text-muted-foreground">
              O terminal imprime uma <strong>HTTPS URL</strong> (<code className="text-hud">https://…trycloudflare.com</code>) e o token.
              Cole os dois abaixo — no notebook e, via QR, no celular.
            </p>
            {isMobile ? (
              <>
                <p className="mb-3 font-mono text-[10px] leading-relaxed text-muted-foreground">
                  Alternativa na mesma Wi-Fi (sem túnel): rode{" "}
                  <code className="text-hud">JARVIS_HOST=0.0.0.0 python3 agent/jarvis_agent.py</code> e use o{" "}
                  <strong>IP local</strong> do computador (ex: <code className="text-hud">http://192.168.1.50:7842</code>).
                </p>
                {isLoopback(bridgeUrl) && (
                  <p className="mb-3 font-mono text-[10px] text-gold">
                    ⚠ O campo URL está como localhost. Troque pela HTTPS URL do túnel ou pelo IP local do computador.
                  </p>
                )}
              </>
            ) : (
              <p className="mb-3 font-mono text-[10px] leading-relaxed text-muted-foreground">
                Sem túnel, no próprio computador: <code className="text-hud">python3 agent/jarvis_agent.py</code> e{" "}
                <code className="text-hud">http://127.0.0.1:7842</code>.
              </p>
            )}
            {hydrated && mixedContentBlocked(bridgeUrl.trim()) && (
              <p className="mb-3 rounded border border-gold/40 bg-gold/10 p-2 font-mono text-[10px] leading-relaxed text-gold">
                ⚠ O navegador bloqueia chamadas HTTP de rede local a partir desta página HTTPS. Rode o agente com{" "}
                <code>--tunnel</code> e cole aqui a URL <code>https://…</code>.
              </p>
            )}


            <div className="mb-2 flex gap-2">
              <input
                value={bridgeUrl}
                onChange={(e) => setBridgeUrl(e.target.value)}
                placeholder="http://127.0.0.1:7843"
                className="flex-1 rounded border border-hud/30 bg-input/60 px-3 py-2 font-mono text-xs text-foreground focus:border-hud focus:outline-none"
              />
            </div>
            <div className="mb-2 flex gap-2">
              <input
                value={bridgeToken}
                onChange={(e) => setBridgeToken(e.target.value)}
                placeholder="token (do terminal do agent)"
                className="flex-1 rounded border border-hud/30 bg-input/60 px-3 py-2 font-mono text-xs text-foreground focus:border-hud focus:outline-none"
              />
            </div>
            {bridgeError && (
              <p className="mb-2 whitespace-pre-line font-mono text-[10px] leading-relaxed text-gold">{bridgeError}</p>
            )}
            {bridgeTesting && (
              <p className="mb-2 font-mono text-[10px] text-hud/80">Testando conexão com {bridgeUrl.trim()}…</p>
            )}
            {bridgeStatus === "online" && !bridgeError && !bridgeTesting && (
              <p className="mb-2 font-mono text-[10px] text-hud">✓ Conectado — Jarvis já pode usar shell, arquivos, tela e mouse.</p>
            )}
            <div className="flex flex-wrap gap-2">
              <button
                type="button"
                onClick={() => void testBridge()}
                disabled={bridgeTesting}
                className="rounded border border-hud/40 bg-hud/10 px-3 py-1.5 font-mono text-xs text-hud hover:bg-hud/20 disabled:opacity-40"
              >
                {bridgeTesting ? "Testando…" : "Testar / conectar"}
              </button>

              <button
                type="button"
                onClick={() => setQrOpen((o) => !o)}
                disabled={!bridgeUrl.trim() || !bridgeToken.trim()}
                className="flex items-center gap-1.5 rounded border border-hud/40 px-3 py-1.5 font-mono text-xs text-hud hover:bg-hud/10 disabled:opacity-40"
              >
                <QrCode size={13} /> {qrOpen ? "Ocultar QR" : "QR p/ celular"}
              </button>
              {bridge && (
                <button
                  type="button"
                  onClick={disconnectBridge}
                  className="rounded border border-hud/30 px-3 py-1.5 font-mono text-xs text-muted-foreground hover:text-gold"
                >
                  Desconectar
                </button>
              )}
            </div>
            <div className="mt-2 flex items-center gap-2">
              <span className="font-mono text-[10px] uppercase tracking-widest text-muted-foreground">
                Voz
              </span>
              <span className="flex-1 font-mono text-[10px] text-hud">
                Voz neural (bridge)
              </span>
              <button
                type="button"
                onClick={() => void speak("Jarvis online, senhor.", { bridge: bridgeRef.current })}
                className="shrink-0 rounded border border-hud/40 bg-hud/10 px-2 py-1.5 font-mono text-[10px] text-hud hover:bg-hud/20"
              >
                Testar
              </button>
            </div>
            {qrOpen && (
              <div className="mt-3 rounded border border-hud/20 bg-black/40 p-3">
                {qrImage ? (
                  <div className="flex flex-col items-center gap-2">
                    <img
                      src={qrImage}
                      alt="QR code de pareamento da bridge local do J.A.R.V.I.S."
                      className="h-44 w-44 rounded bg-white p-1"
                    />
                    <p className="text-center font-mono text-[10px] leading-relaxed text-muted-foreground">
                      Escaneie com a câmera do celular — o Jarvis abre já com IP e token preenchidos e tenta conectar.
                    </p>
                    {isLoopback(bridgeUrl) && (
                      <p className="text-center font-mono text-[10px] text-gold">
                        ⚠ A URL é localhost: o celular não vai alcançar. Troque pelo IP local (ex: http://192.168.1.50:7842) antes de escanear.
                      </p>
                    )}
                  </div>
                ) : (
                  <p className="font-mono text-[10px] text-muted-foreground">Gerando QR…</p>
                )}
              </div>
            )}

            {toolLog.length > 0 && (
              <div className="mt-3 max-h-32 overflow-y-auto rounded border border-hud/20 bg-black/40 p-2 font-mono text-[10px] text-hud/80">
                {toolLog.map((l, i) => (<div key={i}>{l}</div>))}
              </div>
            )}
          </div>
        )}

        {memoryOpen && (
          <MemoryPanel
            memories={memories}
            newMemory={newMemory}
            setNewMemory={setNewMemory}
            onAdd={() => {
              const v = newMemory.trim();
              if (!v) return;
              setMemories((prev) => mergeMemories(prev, [v]));
              setNewMemory("");
            }}
            onRemove={(idx) => setMemories((prev) => prev.filter((_, i) => i !== idx))}
            onClear={() => setMemories([])}
            onClose={() => setMemoryOpen(false)}
          />
        )}

        {/* Central reactor */}
        <div className="my-6 flex justify-center">
          <ArcReactor active={reactorActive} listening={speech.listening} speaking={speaking} />
        </div>

        {/* Messages */}
        <div
          ref={scrollRef}
          className="flex-1 space-y-4 overflow-y-auto rounded-lg border border-hud/20 bg-card/40 p-4 shadow-hud backdrop-blur-sm"
        >
          {messages.map((m, i) => (
            <MessageBubble key={i} message={m} />
          ))}
          {speech.interim && (
            <MessageBubble message={{ role: "user", content: speech.interim + "…" }} ghost />
          )}
          {loading && (
            <div className="flex flex-col gap-1">
              <div className="flex items-center gap-2 font-mono text-xs text-hud/70">
                <span className="inline-flex gap-1">
                  <span className="h-1.5 w-1.5 animate-pulse rounded-full bg-hud" />
                  <span className="h-1.5 w-1.5 animate-pulse rounded-full bg-hud [animation-delay:150ms]" />
                  <span className="h-1.5 w-1.5 animate-pulse rounded-full bg-hud [animation-delay:300ms]" />
                </span>
                analisando...
              </div>
              {toolLog.length > 0 && (
                <div className="font-mono text-[10px] text-hud/50">
                  {friendlyStep(toolLog[toolLog.length - 1])}
                </div>
              )}
            </div>
          )}
        </div>

        {/* Composer */}
        <form onSubmit={handleSubmit} className="mt-4 flex flex-col gap-2">
          <input
            ref={fileInputRef}
            type="file"
            accept={ACCEPT_ATTR}
            multiple
            className="hidden"
            onChange={(e) => { void handleFiles(e.target.files ?? undefined); e.target.value = ""; }}
          />
          <div className="order-2 flex items-center justify-end gap-1.5">
            <button
              type="button"
              onClick={() => fileInputRef.current?.click()}
              disabled={loading}
              aria-label="Anexar arquivo"
              className="flex h-10 w-10 shrink-0 items-center justify-center rounded-md border border-hud/40 bg-hud/10 text-hud transition hover:bg-hud/20 disabled:opacity-40 sm:h-12 sm:w-12"
            >
              <Paperclip size={16} />
            </button>
            <button
              type="button"
              onClick={() => setImgOpen(true)}
              disabled={loading}
              aria-label="Gerar imagem"
              title="Gerar imagem"
              className="flex h-10 w-10 shrink-0 items-center justify-center rounded-md border border-hud/40 bg-hud/10 text-hud transition hover:bg-hud/20 disabled:opacity-40 sm:h-12 sm:w-12"
            >
              <ImagePlus size={16} />
            </button>
            <button
              type="button"
              onClick={() => void openCamera()}
              disabled={loading}
              aria-label="Abrir câmera"
              className="flex h-10 w-10 shrink-0 items-center justify-center rounded-md border border-hud/40 bg-hud/10 text-hud transition hover:bg-hud/20 disabled:opacity-40 sm:h-12 sm:w-12"
            >
              <Camera size={16} />
            </button>
            <button
              type="button"
              onClick={() => void captureScreen()}
              disabled={loading}
              aria-label="Compartilhar tela"
              title="Compartilhar tela"
              className="hidden h-10 w-10 shrink-0 items-center justify-center rounded-md border border-hud/40 bg-hud/10 text-hud transition hover:bg-hud/20 disabled:opacity-40 sm:flex sm:h-12 sm:w-12"
            >
              <Monitor size={16} />
            </button>
            {speech.supported && (
              <button
                type="button"
                onClick={() => {
                  void primeAudio();
                  if (speech.listening) speech.stop();
                  else speech.start();
                }}
                disabled={loading}
                aria-label={speech.listening ? "Parar" : "Falar"}
                className={cn(
                  "flex h-10 w-10 shrink-0 items-center justify-center rounded-md border transition sm:h-12 sm:w-12",
                  speech.listening
                    ? "border-gold bg-gold/20 text-gold shadow-[0_0_20px_oklch(0.82_0.14_85/0.5)]"
                    : "border-hud/40 bg-hud/10 text-hud hover:bg-hud/20 hover:shadow-hud",
                  loading && "opacity-40",
                )}
              >
              {speech.listening ? <MicOff size={16} /> : <Mic size={16} />}
            </button>
          )}
            {loading ? (
              <button
                type="button"
                onClick={stopGeneration}
                aria-label="Parar"
                title="Parar de gerar"
                className="flex h-10 w-10 shrink-0 items-center justify-center rounded-md border border-gold bg-gold/20 p-0 leading-none text-gold transition hover:bg-gold/30 sm:h-12 sm:w-12"
              >
                <Square size={16} />
              </button>
            ) : (
              <button
                type="submit"
                disabled={!input.trim() && !attachments.length}
                aria-label="Enviar"
                className="flex h-10 w-10 shrink-0 items-center justify-center rounded-md border border-hud bg-hud/20 p-0 leading-none text-hud transition hover:bg-hud/30 hover:shadow-hud disabled:opacity-40 sm:h-12 sm:w-12"
              >
                <Send size={16} />
              </button>
            )}
          </div>
          <div className="relative min-w-0 order-1">
            {attachments.length > 0 && (
              <div className="mb-2 space-y-1">
                {attachments.map((a) => (
                  <div key={a.id} className="flex items-center gap-2 rounded-md border border-hud/30 bg-hud/10 px-3 py-2 font-mono text-xs text-hud">
                    {a.kind === "image" && a.url ? (
                      <img src={a.url} alt={a.name} className="h-10 w-10 rounded object-cover" />
                    ) : null}
                    <span className="min-w-0 flex-1 truncate">{a.name}</span>
                    {a.note ? <span className="shrink-0 text-[10px] text-muted-foreground">{a.note}</span> : null}
                    <button type="button" onClick={() => removeAttachment(a.id)} aria-label="Remover anexo" className="text-hud hover:text-foreground">
                      <X size={16} />
                    </button>
                  </div>
                ))}
              </div>
            )}
            {attachError && (
              <p className="mb-2 font-mono text-[10px] text-gold">{attachError}</p>
            )}
            <textarea
              ref={inputRef}
              value={input}
              onChange={(e) => setInput(e.target.value)}
              onKeyDown={handleKeyDown}
              placeholder="Fale comigo, senhor..."
              rows={1}
              disabled={loading}
              className="min-h-[44px] w-full resize-none rounded-md border border-hud/30 bg-input/60 px-3 py-2.5 font-mono text-sm text-foreground placeholder:text-muted-foreground/60 focus:border-hud focus:outline-none focus:ring-1 focus:ring-hud sm:min-h-[48px] sm:px-4 sm:py-3"
            />
          </div>
        </form>

        {cameraOpen && (
          <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 p-4">
            <div className="w-full max-w-lg rounded-lg border border-hud/50 bg-background p-4 shadow-hud">
              <video ref={cameraVideoRef} autoPlay playsInline className="w-full rounded-md bg-black" />
              <div className="mt-3 flex justify-end gap-2">
                <button type="button" onClick={closeCamera} className="rounded-md border border-hud/40 px-4 py-2 font-mono text-xs text-hud">Cancelar</button>
                <button type="button" onClick={captureCamera} className="rounded-md border border-hud bg-hud/20 px-4 py-2 font-mono text-xs text-hud">Capturar</button>
              </div>
            </div>
          </div>
        )}

        {imgOpen && (
          <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 p-4">
            <div className="w-full max-w-lg rounded-lg border border-hud/50 bg-background p-4 shadow-hud">
              <div className="mb-3 flex items-center justify-between">
                <h3 className="font-mono text-sm text-hud">Gerar imagem</h3>
                <button type="button" onClick={() => setImgOpen(false)} aria-label="Fechar" className="text-hud hover:text-foreground">
                  <X size={16} />
                </button>
              </div>
              <textarea
                value={imgPrompt}
                onChange={(e) => setImgPrompt(e.target.value)}
                placeholder="Descreva a imagem (ex: um dragão de armadura em uma rua neon)..."
                rows={3}
                className="w-full resize-none rounded-md border border-hud/30 bg-input/60 px-3 py-2 font-mono text-sm text-foreground placeholder:text-muted-foreground/60 focus:border-hud focus:outline-none"
              />
              <div className="mt-3">
                <p className="mb-1.5 font-mono text-[10px] uppercase tracking-widest text-muted-foreground">Proporção</p>
                <div className="flex flex-wrap gap-1.5">
                  {IMG_RATIOS.map((r) => (
                    <button
                      key={r.id}
                      type="button"
                      onClick={() => setImgRatio(r.id)}
                      className={cn(
                        "rounded-md border px-2.5 py-1.5 font-mono text-xs transition",
                        imgRatio === r.id
                          ? "border-hud bg-hud/20 text-hud"
                          : "border-hud/30 text-hud/70 hover:border-hud hover:text-hud",
                      )}
                    >
                      {r.label}
                      <span className="ml-1 text-[9px] text-muted-foreground">{r.hint}</span>
                    </button>
                  ))}
                </div>
              </div>
              <div className="mt-4 flex justify-end gap-2">
                <button type="button" onClick={() => setImgOpen(false)} className="rounded-md border border-hud/40 px-4 py-2 font-mono text-xs text-hud">Cancelar</button>
                <button
                  type="button"
                  disabled={!imgPrompt.trim() || loading}
                  onClick={submitImage}
                  className="rounded-md border border-hud bg-hud/20 px-4 py-2 font-mono text-xs text-hud disabled:opacity-40"
                >
                  Gerar
                </button>
              </div>
            </div>
          </div>
        )}

        {coverOpen && <CoverScreen onExit={() => setCoverOpen(false)} system={system} />}
      </div>
    </div>
  );
}

function ReactorBadge({ active }: { active: boolean }) {
  return (
    <div className="relative h-10 w-10">
      <div
        className={cn(
          "absolute inset-0 rounded-full border-2 border-hud/60",
          active && "jarvis-spin-slow",
        )}
        style={{ borderStyle: "dashed" }}
      />
      <div
        className={cn(
          "absolute inset-1 rounded-full bg-hud/20 shadow-hud",
          active ? "jarvis-pulse" : "",
        )}
      />
      <div className="absolute inset-[10px] rounded-full bg-hud shadow-hud-strong" />
    </div>
  );
}

function ArcReactor({
  active,
  listening,
  speaking,
}: {
  active: boolean;
  listening: boolean;
  speaking: boolean;
}) {
  return (
    <div className="relative h-40 w-40 sm:h-48 sm:w-48">
      {/* outer dashed ring */}
      <div
        className={cn("absolute inset-0 rounded-full border border-hud/40", active && "jarvis-spin-slow")}
        style={{ borderStyle: "dashed" }}
      />
      {/* tick ring */}
      <div className={cn("absolute inset-2 rounded-full border border-hud/30", active && "jarvis-spin-reverse")}>
        {Array.from({ length: 24 }).map((_, i) => (
          <div
            key={i}
            className="absolute left-1/2 top-0 h-2 w-px -translate-x-1/2 bg-hud/60"
            style={{ transform: `translateX(-50%) rotate(${(i * 360) / 24}deg) translateY(0)` }}
          />
        ))}
      </div>
      {/* middle glow */}
      <div
        className={cn(
          "absolute inset-6 rounded-full bg-gradient-to-br from-hud/50 via-hud/20 to-transparent",
          active && "jarvis-pulse",
        )}
      />
      {/* inner core */}
      <div className="absolute inset-0 flex items-center justify-center">
        <div
          className={cn(
            "flex h-16 w-16 items-center justify-center rounded-full bg-hud/90 shadow-hud-strong sm:h-20 sm:w-20",
            active && "jarvis-pulse",
          )}
        >
          {listening ? (
            <div className="flex items-end gap-1">
              {[0, 1, 2, 3, 4].map((i) => (
                <span
                  key={i}
                  className="w-1 rounded-full bg-primary-foreground jarvis-listening"
                  style={{ height: 22, animationDelay: `${i * 90}ms` }}
                />
              ))}
            </div>
          ) : (
            <div
              className={cn(
                "h-4 w-4 rounded-full bg-primary-foreground/90",
                speaking && "jarvis-pulse",
              )}
            />
          )}
        </div>
      </div>
    </div>
  );
}

function friendlyStep(log: string): string {
  const name = /^▶ (\S+)/.exec(log)?.[1] ?? "";
  switch (name) {
    case "open_app": return "abrindo aplicativo...";
    case "open_and_view": return "abrindo e vendo aplicativo...";
    case "take_screenshot": return "capturando tela...";
    case "shell_exec": return "executando no PC...";
    case "fs_read":
    case "fs_write":
    case "fs_list": return "mexendo em arquivos...";
    case "type_text": return "digitando no PC...";
    case "criar_imagem": return "gerando imagem...";
    case "web_search": return "buscando na web...";
    case "fetch_url": return "lendo página...";
    case "get_datetime": return "vendo data e hora...";
    case "run_js": return "calculando...";
    case "integracoes_listar":
    case "integracao_chamar": return "usando integração...";
    default: return "trabalhando...";
  }
}

function MessageBubble({ message, ghost = false }: { message: Msg; ghost?: boolean }) {
  const isUser = message.role === "user";
  return (
    <div className={cn("flex", isUser ? "justify-end" : "justify-start")}>
      <div
        className={cn(
          "jarvis-msg max-w-[85%] min-w-0 rounded-lg border px-4 py-2.5 font-mono text-sm leading-relaxed",
          isUser
            ? "jarvis-msg-user border-gold/40 bg-gold/10 text-foreground"
            : "jarvis-msg-assistant border-hud/40 bg-hud/5 text-foreground shadow-[0_0_20px_oklch(0.78_0.16_220/0.15)]",
          ghost && "opacity-60 italic",
        )}
      >
        {!isUser && (
          <div className="mb-1 flex items-center gap-2 text-[10px] uppercase tracking-[0.25em] text-hud/80">
            <span className="h-1.5 w-1.5 rounded-full bg-hud shadow-hud" />
            J.A.R.V.I.S.
          </div>
        )}
        <div className="prose prose-sm prose-invert max-w-none break-words prose-p:my-1 prose-headings:my-2 [&_a]:break-all [&_img]:h-auto [&_img]:max-w-full [&_img]:rounded [&_pre]:max-w-full [&_pre]:overflow-x-auto">
          <ReactMarkdown>{message.content}</ReactMarkdown>
        </div>
      </div>
    </div>
  );
}

function IconButton({
  children,
  onClick,
  title,
  active,
}: {
  children: React.ReactNode;
  onClick: () => void;
  title: string;
  active?: boolean;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      title={title}
      aria-label={title}
      className={cn(
        "flex h-9 w-9 items-center justify-center rounded-md border transition",
        active
          ? "border-hud bg-hud/20 text-hud shadow-hud"
          : "border-hud/30 bg-transparent text-hud/70 hover:border-hud hover:text-hud",
      )}
    >
      {children}
    </button>
  );
}

function MemoryPanel({
  memories,
  newMemory,
  setNewMemory,
  onAdd,
  onRemove,
  onClear,
  onClose,
}: {
  memories: string[];
  newMemory: string;
  setNewMemory: (v: string) => void;
  onAdd: () => void;
  onRemove: (idx: number) => void;
  onClear: () => void;
  onClose: () => void;
}) {
  return (
    <div className="mt-4 rounded-lg border border-hud/30 bg-card/60 p-4 shadow-hud backdrop-blur-sm">
      <div className="mb-3 flex items-center justify-between">
        <div className="flex items-center gap-2">
          <Brain size={14} className="text-hud" />
          <h2 className="font-mono text-xs uppercase tracking-[0.3em] text-hud text-glow">
            Memória de longo prazo
          </h2>
          <span className="font-mono text-[10px] text-muted-foreground">
            {memories.length} fato{memories.length === 1 ? "" : "s"}
          </span>
        </div>
        <div className="flex items-center gap-2">
          {memories.length > 0 && (
            <button
              type="button"
              onClick={onClear}
              className="font-mono text-[10px] uppercase tracking-widest text-muted-foreground hover:text-gold"
            >
              esquecer tudo
            </button>
          )}
          <button
            type="button"
            onClick={onClose}
            aria-label="Fechar"
            className="text-hud/60 hover:text-hud"
          >
            <X size={14} />
          </button>
        </div>
      </div>

      <p className="mb-3 font-mono text-[10px] leading-relaxed text-muted-foreground">
        Fatos duradouros sobre você que o J.A.R.V.I.S. lembra em toda conversa. Salvos apenas neste
        navegador. Ele extrai automaticamente do que você conta, e você pode editar à vontade.
      </p>

      {memories.length === 0 ? (
        <p className="mb-3 font-mono text-xs italic text-muted-foreground/70">
          Nenhuma memória ainda — conte algo sobre você e ela aparecerá aqui.
        </p>
      ) : (
        <ul className="mb-3 max-h-56 space-y-1.5 overflow-y-auto pr-1">
          {memories.map((m, i) => (
            <li
              key={i}
              className="group flex items-start justify-between gap-2 rounded border border-hud/20 bg-hud/5 px-3 py-2 font-mono text-xs text-foreground/90"
            >
              <span className="flex-1 leading-relaxed">{m}</span>
              <button
                type="button"
                onClick={() => onRemove(i)}
                aria-label="Esquecer"
                className="mt-0.5 shrink-0 text-hud/40 opacity-60 transition hover:text-gold group-hover:opacity-100"
              >
                <X size={12} />
              </button>
            </li>
          ))}
        </ul>
      )}

      <form
        onSubmit={(e) => {
          e.preventDefault();
          onAdd();
        }}
        className="flex items-center gap-2"
      >
        <input
          value={newMemory}
          onChange={(e) => setNewMemory(e.target.value)}
          placeholder="Adicionar um fato manualmente..."
          className="flex-1 rounded border border-hud/30 bg-input/60 px-3 py-2 font-mono text-xs text-foreground placeholder:text-muted-foreground/60 focus:border-hud focus:outline-none"
        />
        <button
          type="submit"
          disabled={!newMemory.trim()}
          aria-label="Adicionar memória"
          className="flex h-9 w-9 items-center justify-center rounded border border-hud/40 bg-hud/10 text-hud transition hover:bg-hud/20 disabled:opacity-40"
        >
          <Plus size={14} />
        </button>
      </form>
    </div>
  );
}
