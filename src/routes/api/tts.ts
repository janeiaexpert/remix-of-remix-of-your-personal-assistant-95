import { createFileRoute } from "@tanstack/react-router";

// TTS do servidor — voz natural em qualquer aparelho, sem depender do PC.
// Ordem:
//   1) Bridge (Edge TTS "pt-BR-AntonioNeural", a voz do PC) — quando o PC
//      está ligado, exposto publicamente via Tailscale Funnel.
//   2) Gemini TTS neural (voz masculina "Charon", sem PC, HTTP puro) — PCM 24kHz
//      convertido para WAV aqui mesmo.
//   3) Google Translate TTS (último recurso, voz robótica).

const BRIDGE_URL = (process.env.BRIDGE_URL || "").replace(/\/$/, "");
const BRIDGE_TOKEN = process.env.BRIDGE_TOKEN || process.env.JARVIS_TOKEN || "";
const GEMINI_KEY = process.env.GEMINI_API_KEY || "";
const GEMINI_TTS_MODEL = process.env.GEMINI_TTS_MODEL || "gemini-2.5-flash-preview-tts";
const GEMINI_TTS_VOICE = process.env.GEMINI_TTS_VOICE || "Charon";

async function bridgeSpeak(text: string): Promise<ArrayBuffer | null> {
  if (!BRIDGE_URL || !BRIDGE_TOKEN) return null;
  const prev = process.env.NODE_TLS_REJECT_UNAUTHORIZED;
  process.env.NODE_TLS_REJECT_UNAUTHORIZED = "0";
  try {
    const res = await fetch(`${BRIDGE_URL}/speak`, {
      method: "POST",
      headers: { "Content-Type": "application/json", Authorization: `Bearer ${BRIDGE_TOKEN}` },
      body: JSON.stringify({ text: text.slice(0, 800) }),
      signal: AbortSignal.timeout(45_000),
    });
    if (!res.ok) return null;
    const buf = await res.arrayBuffer();
    return buf.byteLength > 0 ? buf : null;
  } catch {
    return null;
  } finally {
    if (prev === undefined) delete process.env.NODE_TLS_REJECT_UNAUTHORIZED;
    else process.env.NODE_TLS_REJECT_UNAUTHORIZED = prev;
  }
}

// Monta um WAV (RIFF) a partir de PCM signed 16-bit LE mono.
function pcmToWav(pcm: Buffer, sampleRate: number): Buffer {
  const dataSize = pcm.length;
  const header = Buffer.alloc(44);
  header.write("RIFF", 0);
  header.writeUInt32LE(36 + dataSize, 4);
  header.write("WAVE", 8);
  header.write("fmt ", 12);
  header.writeUInt32LE(16, 16);
  header.writeUInt16LE(1, 20); // PCM
  header.writeUInt16LE(1, 22); // mono
  header.writeUInt32LE(sampleRate, 24);
  header.writeUInt32LE(sampleRate * 2, 28);
  header.writeUInt16LE(2, 32);
  header.writeUInt16LE(16, 34);
  header.write("data", 36);
  header.writeUInt32LE(dataSize, 40);
  return Buffer.concat([header, pcm]);
}

async function geminiTts(text: string): Promise<ArrayBuffer | null> {
  if (!GEMINI_KEY) return null;
  try {
    const res = await fetch(
      `https://generativelanguage.googleapis.com/v1beta/models/${GEMINI_TTS_MODEL}:generateContent?key=${GEMINI_KEY}`,
      {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          contents: [{ parts: [{ text: text.slice(0, 800) }] }],
          generationConfig: {
            responseModalities: ["AUDIO"],
            speechConfig: { voiceConfig: { prebuiltVoiceConfig: { voiceName: GEMINI_TTS_VOICE } } },
          },
        }),
        signal: AbortSignal.timeout(45_000),
      },
    );
    if (!res.ok) return null;
    const j = (await res.json()) as {
      candidates?: { content?: { parts?: { inlineData?: { data?: string; mimeType?: string } }[] } }[];
    };
    const inline = j.candidates?.[0]?.content?.parts?.find((p) => p.inlineData?.data)?.inlineData;
    if (!inline?.data) return null;
    const raw = Buffer.from(inline.data, "base64");
    const mimeType = inline.mimeType || "";
    if (mimeType.includes("pcm") || mimeType.includes("L16")) {
      const m = /rate=(\d+)/.exec(mimeType);
      const rate = m ? parseInt(m[1], 10) : 24000;
      return pcmToWav(raw, rate).buffer as ArrayBuffer;
    }
    return raw.buffer as ArrayBuffer;
  } catch {
    return null;
  }
}

async function googleTts(text: string): Promise<ArrayBuffer | null> {
  try {
    const upstream = `https://translate.google.com/translate_tts?ie=UTF-8&client=tw-ob&tl=pt-BR&q=${encodeURIComponent(text)}`;
    const res = await fetch(upstream, {
      headers: { "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36" },
      signal: AbortSignal.timeout(30_000),
    });
    if (!res.ok) return null;
    const buf = await res.arrayBuffer();
    return buf.byteLength > 0 ? buf : null;
  } catch {
    return null;
  }
}

export const Route = createFileRoute("/api/tts")({
  server: {
    handlers: {
      GET: async ({ request }) => {
        const url = new URL(request.url);
        const text = (url.searchParams.get("text") || "").trim();
        return renderTts(text);
      },
      POST: async ({ request }) => {
        let text = "";
        try {
          const ct = request.headers.get("content-type") || "";
          if (ct.includes("application/json")) {
            const j = (await request.json()) as { text?: string };
            text = String(j.text || "");
          } else {
            text = await request.text();
          }
        } catch {
          text = "";
        }
        return renderTts(text.trim());
      },
    },
  },
});

async function renderTts(text: string): Promise<Response> {
  if (!text) return new Response("Missing text", { status: 400 });

  // 1) Voz do PC (Antonio) — quando o PC está ligado.
  const viaBridge = await bridgeSpeak(text);
  if (viaBridge) {
    return new Response(viaBridge, {
      headers: { "Content-Type": "audio/mpeg", "Cache-Control": "public, max-age=3600" },
    });
  }

  // 2) Gemini neural — voz natural sem o PC.
  const viaGemini = await geminiTts(text);
  if (viaGemini) {
    return new Response(viaGemini, {
      headers: { "Content-Type": "audio/wav", "Cache-Control": "public, max-age=3600" },
    });
  }

  // 3) Google Translate TTS (robótica, mas sempre disponível).
  const viaGoogle = await googleTts(text);
  if (viaGoogle) {
    return new Response(viaGoogle, {
      headers: { "Content-Type": "audio/mpeg", "Cache-Control": "public, max-age=86400" },
    });
  }
  return new Response("TTS unavailable", { status: 502 });
}
