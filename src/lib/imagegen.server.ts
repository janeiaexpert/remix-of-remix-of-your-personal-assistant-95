// Geração de imagens — Gemini (Nano Banana = gemini-2.5-flash-image), plano
// GRATUITO diário do Google AI Studio, com fallback gratuito Pollinations
// (sem chave) quando a cota do Gemini estoura. Sem provedores pagos.

export const RATIOS = {
  retrato: [1024, 1280],
  "3:4": [1080, 1440],
  "4:5": [1080, 1350],
  stories: [1080, 1920],
  "9:16": [1080, 1920],
  quadrado: [1024, 1024],
  paisagem: [1280, 720],
} as const;

export type ImageRatio = keyof typeof RATIOS;

// Proporção equivalente para a API do Gemini (Nano Banana).
const GEMINI_ASPECT: Record<string, string> = {
  retrato: "4:5",
  "3:4": "3:4",
  "4:5": "4:5",
  stories: "9:16",
  "9:16": "9:16",
  quadrado: "1:1",
  paisagem: "16:9",
};

export type ImageGenResult =
  | { ok: true; provider: "gemini" | "pollinations"; data?: string; mediaType: string }
  | { ok: false; error: string };

/** URL relativa que o chat usa no markdown — a rota /api/image gera e cacheia. */
export function chatImageUrl(prompt: string, ratio: ImageRatio): string {
  return `/api/image?prompt=${encodeURIComponent(prompt)}&ratio=${encodeURIComponent(ratio)}`;
}

// Armazenamento temporário de screenshots (a IA não consegue colar base64
// gigante; ela cola a URL curta e o cliente busca os bytes).
const shotStore = new Map<string, { data: string; mediaType: string; expires: number }>();
export function storeShot(data: string, mediaType: string): string {
  const key = Math.random().toString(36).slice(2, 10);
  shotStore.set(key, { data, mediaType, expires: Date.now() + 5 * 60_000 });
  if (shotStore.size > 50) {
    const now = Date.now();
    for (const [k, v] of shotStore) if (v.expires < now) shotStore.delete(k);
  }
  return key;
}
export function getShot(key: string): { data: string; mediaType: string } | null {
  const s = shotStore.get(key);
  if (!s) return null;
  if (s.expires < Date.now()) {
    shotStore.delete(key);
    return null;
  }
  return { data: s.data, mediaType: s.mediaType };
}

// Armazenamento de vídeo (para edição via ffmpeg no PC)
export const videoStore = new Map<string, { data: string; mediaType: string; expires: number }>();
export function storeVideo(data: string, mediaType: string): string {
  const key = Math.random().toString(36).slice(2, 10);
  videoStore.set(key, { data, mediaType, expires: Date.now() + 10 * 60_000 });
  if (videoStore.size > 50) {
    const now = Date.now();
    for (const [k, v] of videoStore) if (v.expires < now) videoStore.delete(k);
  }
  return key;
}
export function getVideo(key: string): { data: string; mediaType: string } | null {
  const s = videoStore.get(key);
  if (!s) return null;
  if (s.expires < Date.now()) {
    videoStore.delete(key);
    return null;
  }
  return { data: s.data, mediaType: s.mediaType };
}

export async function generateImage(prompt: string, ratio: ImageRatio = "retrato"): Promise<ImageGenResult> {
  const clean = (prompt || "").trim().slice(0, 1500);
  if (!clean) return { ok: false, error: "Prompt vazio." };

  const key = process.env.GEMINI_API_KEY;
  if (!key) return { ok: false, error: "GEMINI_API_KEY não configurada no servidor." };

  try {
    const model = process.env.GEMINI_IMAGE_MODEL || "gemini-2.5-flash-image";
    const res = await fetch(`https://generativelanguage.googleapis.com/v1beta/models/${model}:generateContent`, {
      method: "POST",
      headers: { "Content-Type": "application/json", "x-goog-api-key": key },
      body: JSON.stringify({
        contents: [{ parts: [{ text: clean }] }],
        generationConfig: {
          responseModalities: ["IMAGE"],
          imageConfig: { aspectRatio: GEMINI_ASPECT[ratio] ?? "4:5" },
        },
      }),
      signal: AbortSignal.timeout(60_000),
    });
    if (res.ok) {
      const j = (await res.json()) as {
        candidates?: { content?: { parts?: { inlineData?: { data?: string; mimeType?: string } }[] } }[];
      };
      const img = j.candidates?.[0]?.content?.parts?.find((p) => p.inlineData?.data);
      if (img?.inlineData?.data) {
        return {
          ok: true,
          provider: "gemini",
          data: img.inlineData.data,
          mediaType: img.inlineData.mimeType || "image/png",
        };
      }
      return { ok: false, error: "O Gemini respondeu sem imagem." };
    }
    const body = (await res.text()).slice(0, 200);
    return await pollinationsFallback(clean, ratio, `Gemini HTTP ${res.status}`);
  } catch (e) {
    return await pollinationsFallback(
      clean,
      ratio,
      `Gemini indisponível: ${e instanceof Error ? e.message : String(e)}`,
    );
  }
}

// Fallback 100% gratuito (sem chave): Pollinations. A API deles pode responder
// HTTP 402 mesmo entregando a imagem; por isso validamos os PRIMEIROS BYTES
// (assinatura JPEG/PNG/WebP) em vez de confiar no status.
async function pollinationsFallback(
  prompt: string,
  ratio: ImageRatio,
  motivo: string,
): Promise<ImageGenResult> {
  const [w, h] = RATIOS[ratio];
  const url =
    "https://image.pollinations.ai/prompt/" +
    encodeURIComponent(prompt.slice(0, 900)) +
    `?width=${w}&height=${h}&nologo=true&model=flux&seed=${Math.floor(Math.random() * 1e9)}`;
  try {
    const res = await fetch(url, { signal: AbortSignal.timeout(90_000) });
    const buf = new Uint8Array(await res.arrayBuffer());
    if (buf.length < 2000) return { ok: false, error: `${motivo}; Pollinations devolveu ${buf.length} bytes.` };
    const mediaType = sniffImageType(buf);
    if (!mediaType) return { ok: false, error: `${motivo}; Pollinations não devolveu imagem válida.` };
    return {
      ok: true,
      provider: "pollinations",
      data: Buffer.from(buf).toString("base64"),
      mediaType,
    };
  } catch (e) {
    return {
      ok: false,
      error: `${motivo}; Pollinations falhou: ${e instanceof Error ? e.message : String(e)}`,
    };
  }
}

// Detecta o formato real pelos magic bytes (JPEG FFD8FF, PNG 89504E47, WebP RIFF).
function sniffImageType(b: Uint8Array): string | null {
  if (b[0] === 0xff && b[1] === 0xd8 && b[2] === 0xff) return "image/jpeg";
  if (b[0] === 0x89 && b[1] === 0x50 && b[2] === 0x4e && b[3] === 0x47) return "image/png";
  if (b[0] === 0x52 && b[1] === 0x49 && b[2] === 0x46 && b[3] === 0x46 && b[8] === 0x57 && b[9] === 0x45 && b[10] === 0x42 && b[11] === 0x50)
    return "image/webp";
  return null;
}
