// JARVIS no Telegram — agente 100% server-side (sem navegador).
// Texto, foto e voz. Ferramentas de web + PC via Funnel (BRIDGE_URL/BRIDGE_TOKEN).
// Tudo grátis, sem nada pago.
import { generateText, stepCountIs, tool, type ModelMessage } from "ai";
import { z } from "zod";
import { generateWithFallback, createJarvisModel } from "./ai-gateway.server";
import { buildSystem, duckDuckGoSearch, stripReasoningParts } from "./jarvis.functions";
import { chatImageUrl, generateImage, RATIOS, storeShot, type ImageRatio } from "./imagegen.server";
import { listIntegrations, listarFerramentas, executarFerramenta } from "./integrations.server";
import { editarVideoNoPc } from "./video.server";

const BOT_TOKEN = process.env.TELEGRAM_BOT_TOKEN || "";
const api = (m: string) => `https://api.telegram.org/bot${BOT_TOKEN}/${m}`;

export async function tgSend(chatId: number | string, text: string): Promise<boolean> {
  if (!BOT_TOKEN) return false;
  const chunks: string[] = [];
  let s = String(text || "(sem resposta)");
  let delivered = true;
  while (s.length > 4000) {
    let i = s.lastIndexOf("\n", 4000);
    if (i < 500) i = 4000;
    chunks.push(s.slice(0, i));
    s = s.slice(i).trimStart();
  }
  chunks.push(s);
  for (const c of chunks) {
    if (!c.trim()) continue;
    try {
      const response = await fetch(api("sendMessage"), {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ chat_id: chatId, text: c.slice(0, 4096) }),
        signal: AbortSignal.timeout(20_000),
      });
      if (!response.ok) delivered = false;
      else {
        const result = (await response.json()) as { ok?: boolean };
        if (result.ok !== true) delivered = false;
      }
    } catch {
      delivered = false;
    }
  }
  return delivered;
}

export async function tgPhoto(chatId: number | string, photoUrl: string, caption = ""): Promise<boolean> {
  if (!BOT_TOKEN) return false;
  try {
    const res = await fetch(api("sendPhoto"), {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ chat_id: chatId, photo: photoUrl, caption: caption.slice(0, 1024) }),
      signal: AbortSignal.timeout(30_000),
    });
    return res.ok;
  } catch {
    return false;
  }
}

export async function tgPhotoData(chatId: number | string, dataUrl: string, caption = ""): Promise<boolean> {
  if (!BOT_TOKEN) return false;
  const m = /^data:([^;]+);base64,(.+)$/s.exec(dataUrl || "");
  if (!m) return false;
  try {
    const buf = Buffer.from(m[2], "base64");
    if (!buf.length || buf.length > 9_000_000) return false;
    const ext = m[1].includes("png") ? "png" : "jpg";
    const fd = new FormData();
    fd.append("chat_id", String(chatId));
    fd.append("photo", new Blob([new Uint8Array(buf)], { type: m[1] }), `foto.${ext}`);
    if (caption) fd.append("caption", caption.slice(0, 1024));
    const res = await fetch(api("sendPhoto"), {
      method: "POST",
      body: fd,
      signal: AbortSignal.timeout(60_000),
    });
    return res.ok;
  } catch {
    return false;
  }
}

export async function tgAudioData(chatId: number | string, audio: ArrayBuffer, mimeType: string, caption = ""): Promise<boolean> {
  if (!BOT_TOKEN) return false;
  try {
    const buf = Buffer.from(audio);
    if (!buf.length || buf.length > 15_000_000) return false;
    const isWav = (mimeType || "").includes("wav");
    const fd = new FormData();
    fd.append("chat_id", String(chatId));
    fd.append("audio", new Blob([new Uint8Array(buf)], { type: mimeType || "audio/mpeg" }), isWav ? "voz.wav" : "voz.mp3");
    if (caption) fd.append("caption", caption.slice(0, 1024));
    const res = await fetch(api("sendAudio"), {
      method: "POST",
      body: fd,
      signal: AbortSignal.timeout(90_000),
    });
    return res.ok;
  } catch {
    return false;
  }
}

// Gera TTS da resposta e envia como áudio (conversa por voz).
// Usa /api/tts (bridge Antônio → Gemini Charon → Google).
export async function sendTtsAudio(chatId: number | string, text: string): Promise<boolean> {
  const clean = (text || "").trim().slice(0, 700);
  if (!clean) return false;
  try {
    const base = (process.env.TELEGRAM_PUBLIC_BASE || "https://jarvis-azul.vercel.app").replace(/\/$/, "");
    const res = await fetch(`${base}/api/tts?text=${encodeURIComponent(clean)}`, {
      signal: AbortSignal.timeout(90_000),
    });
    if (!res.ok) return false;
    const ct = res.headers.get("content-type") || "audio/mpeg";
    const buf = await res.arrayBuffer();
    return await tgAudioData(chatId, buf, ct.split(";")[0]);
  } catch {
    return false;
  }
}

export async function tgFileUrl(fileId: string): Promise<string | null> {
  if (!BOT_TOKEN) return null;
  try {
    const res = await fetch(api("getFile"), {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ file_id: fileId }),
      signal: AbortSignal.timeout(20_000),
    });
    const j = (await res.json()) as { ok?: boolean; result?: { file_path?: string } };
    const p = j?.result?.file_path;
    return p ? `https://api.telegram.org/file/bot${BOT_TOKEN}/${p}` : null;
  } catch {
    return null;
  }
}

async function urlToDataUrl(url: string): Promise<{ data: string; mediaType: string } | null> {
  try {
    const res = await fetch(url, { signal: AbortSignal.timeout(30_000) });
    if (!res.ok) return null;
    const ct = res.headers.get("content-type") || "application/octet-stream";
    const buf = Buffer.from(await res.arrayBuffer());
    if (!buf.length || buf.length > 8_000_000) return null;
    return { data: buf.toString("base64"), mediaType: ct.split(";")[0] };
  } catch {
    return null;
  }
}

// Transcreve áudio (mensagem de voz do Telegram) via Groq Whisper (grátis).
export async function transcribeVoice(fileUrl: string): Promise<string | null> {
  const key = process.env.GROQ_API_KEY;
  if (!key) return null;
  try {
    const dl = await fetch(fileUrl, { signal: AbortSignal.timeout(30_000) });
    if (!dl.ok) return null;
    const buf = Buffer.from(await dl.arrayBuffer());
    if (!buf.length || buf.length > 20_000_000) return null;
    const fd = new FormData();
    fd.append("file", new Blob([new Uint8Array(buf)], { type: "audio/ogg" }), "voz.ogg");
    fd.append("model", "whisper-large-v3-turbo");
    fd.append("language", "pt");
    const res = await fetch("https://api.groq.com/openai/v1/audio/transcriptions", {
      method: "POST",
      headers: { Authorization: `Bearer ${key}` },
      body: fd,
      signal: AbortSignal.timeout(60_000),
    });
    if (!res.ok) return null;
    const j = (await res.json()) as { text?: string };
    return (j.text || "").trim() || null;
  } catch {
    return null;
  }
}

// Chamada genérica à bridge via Funnel (servidor → PC).
// O Funnel usa certificado do Tailscale (a Vercel não confia) — desativa a
// verificação TLS só durante esta chamada e restaura em seguida.
async function bridgeCall(path: string, body: unknown, timeoutMs = 30_000): Promise<unknown> {
  const url = (process.env.BRIDGE_URL || "").replace(/\/$/, "");
  const token = process.env.BRIDGE_TOKEN || process.env.JARVIS_TOKEN || "";
  if (!url || !token) throw new Error("Bridge não configurada no servidor.");
  const prev = process.env.NODE_TLS_REJECT_UNAUTHORIZED;
  process.env.NODE_TLS_REJECT_UNAUTHORIZED = "0";
  try {
    const res = await fetch(`${url}${path}`, {
      method: "POST",
      headers: { "Content-Type": "application/json", Authorization: `Bearer ${token}` },
      body: JSON.stringify(body ?? {}),
      signal: AbortSignal.timeout(timeoutMs),
    });
    if (!res.ok) throw new Error(`Bridge HTTP ${res.status}.`);
    return res.json();
  } finally {
    if (prev === undefined) delete process.env.NODE_TLS_REJECT_UNAUTHORIZED;
    else process.env.NODE_TLS_REJECT_UNAUTHORIZED = prev;
  }
}

function serverTools(refImage: { data: string; mediaType: string } | null) {
  const web_search = tool({
    description: "Busca web em tempo real via DuckDuckGo. Notícias, cotações, clima, eventos.",
    inputSchema: z.object({ query: z.string() }),
    execute: async ({ query }) => {
      try {
        const results = await duckDuckGoSearch(query, 5);
        return results.length ? { results } : { results: [], note: "Nenhum resultado." };
      } catch (e) {
        return { results: [], error: e instanceof Error ? e.message : "Falha." };
      }
    },
  });
  const get_datetime = tool({
    description: "Data e hora atuais (use sempre o campo sao_paulo).",
    inputSchema: z.object({}),
    execute: async () => {
      const now = new Date();
      return {
        sao_paulo: new Intl.DateTimeFormat("pt-BR", {
          weekday: "long", year: "numeric", month: "long", day: "numeric",
          hour: "2-digit", minute: "2-digit", second: "2-digit", timeZone: "America/Sao_Paulo",
        }).format(now),
      };
    },
  });
  const fetch_url = tool({
    description: "Baixa o conteúdo textual de uma URL. Máx ~15 KB.",
    inputSchema: z.object({ url: z.string().url() }),
    execute: async ({ url }) => {
      try {
        const res = await fetch(url, { headers: { "User-Agent": "Mozilla/5.0 (JarvisBot)" } });
        const raw = await res.text();
        return { status: res.status, body: raw.replace(/<[^>]+>/g, " ").replace(/\s+/g, " ").trim().slice(0, 15000) };
      } catch (e) {
        return { error: e instanceof Error ? e.message : "Falha." };
      }
    },
  });
  const run_js = tool({
    description: "Executa JavaScript no servidor (cálculos, parsing). Sem rede, sem fs. Timeout 2s.",
    inputSchema: z.object({ code: z.string() }),
    execute: async ({ code }) => {
      try {
        const src = code.includes("return ") ? code : `return (${code});`;
        const fn = new Function(`"use strict"; ${src}`);
        const r = await Promise.race([
          Promise.resolve().then(() => fn()),
          new Promise((_, rej) => setTimeout(() => rej(new Error("Timeout")), 2000)),
        ]);
        return { result: r };
      } catch (e) {
        return { error: e instanceof Error ? e.message : String(e) };
      }
    },
  });
  const shell_exec = tool({
    description: "Executa comando no PC do senhor via bridge (PowerShell no Windows). Retorna {exit, stdout, stderr}.",
    inputSchema: z.object({
      cmd: z.string(),
      cwd: z.string().optional(),
      timeout: z.number().optional(),
    }),
    execute: async ({ cmd, cwd, timeout }) => {
      try {
        return await bridgeCall("/shell", { cmd, cwd, timeout }) as unknown;
      } catch (e) {
        return { error: e instanceof Error ? e.message.slice(0, 300) : String(e) };
      }
    },
  });
  const fs_read = tool({
    description: "Lê um arquivo do disco do usuário.",
    inputSchema: z.object({ path: z.string() }),
    execute: async ({ path }) => {
      try {
        return await bridgeCall("/read", { path }) as unknown;
      } catch (e) {
        return { error: e instanceof Error ? e.message.slice(0, 300) : String(e) };
      }
    },
  });
  const fs_write = tool({
    description: "Escreve/anexa conteúdo em arquivo no disco do usuário.",
    inputSchema: z.object({ path: z.string(), content: z.string(), append: z.boolean().optional() }),
    execute: async ({ path, content, append }) => {
      try {
        return await bridgeCall("/write", { path, content, append }) as unknown;
      } catch (e) {
        return { error: e instanceof Error ? e.message.slice(0, 300) : String(e) };
      }
    },
  });
  const fs_list = tool({
    description: "Lista um diretório na máquina do usuário.",
    inputSchema: z.object({ path: z.string() }),
    execute: async ({ path }) => {
      try {
        return await bridgeCall("/list", { path }) as unknown;
      } catch (e) {
        return { error: e instanceof Error ? e.message.slice(0, 300) : String(e) };
      }
    },
  });
  const open_app = tool({
    description: "Abre app/arquivo/URL na máquina do usuário.",
    inputSchema: z.object({ target: z.string(), args: z.array(z.string()).optional() }),
    execute: async ({ target, args }) => {
      try {
        return await bridgeCall("/open", { target, args }) as unknown;
      } catch (e) {
        return { error: e instanceof Error ? e.message.slice(0, 300) : String(e) };
      }
    },
  });
  const type_text = tool({
    description: "Digita texto no PC (teclado virtual). CONFIRME com o senhor antes (pergunte e espere o 'sim'), exceto se ele já aprovou na mesma conversa.",
    inputSchema: z.object({ text: z.string(), window: z.string().optional() }),
    execute: async ({ text, window }) => {
      try {
        return await bridgeCall("/type", { text, window }, 30_000) as unknown;
      } catch (e) {
        return { error: e instanceof Error ? e.message.slice(0, 300) : String(e) };
      }
    },
  });
  const take_screenshot = tool({
    description: "Tira print da tela do PC e descreve em português. Retorna {descricao, imagem}.",
    inputSchema: z.object({}),
    execute: async () => {
      let shot: { data: string; mediaType: string; fileId: string } | null = null;
      let lastErr = "";
      for (let a = 1; a <= 3 && !shot; a++) {
        if (a > 1) await new Promise((r) => setTimeout(r, 1500 * (a - 1)));
        try {
          const j = (await bridgeCall("/screenshot", {}, 45_000)) as { ok?: boolean; data?: string; mediaType?: string; fileId?: string; error?: string };
          if (j?.ok && j.data) shot = { data: j.data, mediaType: j.mediaType || "image/jpeg", fileId: j.fileId || "" };
          else lastErr = j?.error || "Captura vazia.";
        } catch (e) {
          lastErr = e instanceof Error ? e.message.slice(0, 200) : "falha";
        }
      }
      if (!shot) return { erro: `Captura falhou: ${lastErr}` };
      const bridgeBase = (process.env.BRIDGE_URL || "").replace(/\/$/, "");
      const imageUrl = shot.fileId && bridgeBase ? `${bridgeBase}/shot/${shot.fileId}` : `/api/shot/${storeShot(shot.data, shot.mediaType)}`;
      let descricao = "(captura da tela em anexo)";
      const gemKey = process.env.GEMINI_API_KEY;
      if (gemKey) {
        try {
          const vr = await fetch(
            `https://generativelanguage.googleapis.com/v1beta/models/gemini-3.1-flash-lite:generateContent?key=${gemKey}`,
            {
              method: "POST",
              headers: { "Content-Type": "application/json" },
              body: JSON.stringify({
                contents: [{ parts: [
                  { text: "Descreva em português o que aparece nesta captura de tela." },
                  { inlineData: { data: shot.data, mimeType: shot.mediaType } },
                ] }],
              }),
              signal: AbortSignal.timeout(45_000),
            },
          );
          const vj = (await vr.json()) as { candidates?: { content?: { parts?: { text?: string }[] } }[] };
          const t = (vj.candidates?.[0]?.content?.parts ?? []).map((p) => p.text || "").join("").trim();
          if (t) descricao = t;
        } catch {
          /* mantém descricao padrão */
        }
      }
      return { descricao, imagem: imageUrl };
    },
  });
  const criar_imagem = tool({
    description: "Gera imagem (Gemini grátis). Proporcoes: '3:4' (1080x1440), '4:5' (1080x1350), 'stories'/'9:16' (1080x1920), 'quadrado', 'paisagem', 'retrato'. Se pedirem TEXTO na imagem, inclua o texto exato entre aspas, em português correto. Só use a URL se ok:true; se ok:false, avise o erro em texto, sem imagem.",
    inputSchema: z.object({
      prompt: z.string().describe("Descrição em inglês; texto a aparecer na imagem entre aspas, em pt-BR correto."),
      proporcao: z.string().optional(),
    }),
    execute: async ({ prompt, proporcao }) => {
      const raw = (proporcao ?? "retrato").toLowerCase().trim();
      const ratio = (Object.hasOwn(RATIOS, raw) ? raw : "retrato") as ImageRatio;
      const gen = await generateImage(prompt, ratio);
      if (!gen.ok) {
        return { ok: false, error: gen.error };
      }
      const url = `/api/shot/${storeShot(gen.data ?? "", gen.mediaType)}`;
      return { ok: true, url, nota: "URL da imagem gerada." };
    },
  });
  const editar_video = tool({
    description: "Edita video com ffmpeg no PC do senhor (via bridge) e salva em Downloads. video = caminho no PC (ex: C:\\Users\\Administrador\\Downloads\\video.mp4). comando = opcoes ffmpeg depois de -i (ex: -ss 00:00:05 -t 10 -c copy).",
    inputSchema: z.object({
      video: z.string(),
      comando: z.string().describe("Opcoes ffmpeg depois de -i."),
    }),
    execute: async ({ video, comando }) => {
      try {
        return await editarVideoNoPc({ video, comando }) as unknown;
      } catch (e) {
        return { error: e instanceof Error ? e.message.slice(0, 300) : String(e) };
      }
    },
  });
  const integracoes_listar = tool({
    description: "Lista integrações (n8n, MCP) e suas ferramentas.",
    inputSchema: z.object({}),
    execute: async () => {
      const ints = listIntegrations().filter((x) => x.enabled);
      const out: unknown[] = [];
      for (const i of ints) {
        try {
          out.push({ id: i.id, nome: i.name, tipo: i.kind, ferramentas: await listarFerramentas(i) });
        } catch (e) {
          out.push({ id: i.id, erro: e instanceof Error ? e.message.slice(0, 150) : "falha" });
        }
      }
      return { integracoes: out };
    },
  });
  const integracao_chamar = tool({
    description: "Executa ferramenta de uma integração (descubra com integracoes_listar).",
    inputSchema: z.object({
      integracao: z.string(),
      ferramenta: z.string(),
      argumentos: z.record(z.string(), z.unknown()).optional(),
    }),
    execute: async ({ integracao, ferramenta, argumentos }) => {
      const i = listIntegrations().find((x) => x.id === integracao || x.name === integracao);
      if (!i || !i.enabled) return { error: "Integração não encontrada/ativa." };
      try {
        return await executarFerramenta(i, ferramenta, argumentos ?? {});
      } catch (e) {
        return { error: e instanceof Error ? e.message.slice(0, 300) : String(e) };
      }
    },
  });
  const python3_exec = tool({
    description: "Executa código Python 3 direto no PC do senhor (via bridge). Útil para scripts, automação, cálculos.",
    inputSchema: z.object({ code: z.string(), args: z.array(z.string()).optional(), timeout: z.number().optional() }),
    execute: async ({ code, args, timeout }) => {
      try { return await bridgeCall("/python3", { code, args, timeout }) as unknown; }
      catch (e) { return { error: e instanceof Error ? e.message.slice(0, 300) : String(e) }; }
    },
  });
  const mouse_control = tool({
    description: "Controla mouse/teclado no PC do senhor (via bridge): mover, clicar, scroll, digitar. Sempre tire screenshot antes e depois.",
    inputSchema: z.object({ action: z.string(), x: z.number().optional(), y: z.number().optional(), button: z.string().optional(), text: z.string().optional(), amount: z.number().optional() }),
    execute: async (input) => {
      try { return await bridgeCall("/mouse", input) as unknown; }
      catch (e) { return { error: e instanceof Error ? e.message.slice(0, 300) : String(e) }; }
    },
  });
  const open_and_view = tool({
    description: "Abre app/arquivo/URL no PC do senhor e lê o conteúdo (via bridge).",
    inputSchema: z.object({ target: z.string(), args: z.array(z.string()).optional() }),
    execute: async ({ target, args }) => {
      try {
        const opened = await bridgeCall("/open", { target, args }) as { ok?: boolean; error?: string };
        if (!opened?.ok) return { error: opened?.error || "Falha ao abrir." };
        const read = target.startsWith("http") ? null : await bridgeCall("/read", { path: target }).catch(() => null);
        return { opened: true, content: read };
      } catch (e) { return { error: e instanceof Error ? e.message.slice(0, 300) : String(e) }; }
    },
  });
  const gerarSiteConversao = tool({
    description: "Gera um site interativo completo com copy forte de conversão (landing page, funil de vendas, loja local ou serviço digital). Salva o HTML no disco do senhor e retorna o caminho.",
    inputSchema: z.object({
      tipoNegocio: z.string(),
      oferta: z.string(),
      publicoAlvo: z.string(),
      cores: z.string().optional(),
      nomeSite: z.string().optional(),
    }),
    execute: async ({ tipoNegocio, oferta, publicoAlvo, cores, nomeSite }) => {
      const nome = nomeSite || tipoNegocio;
      const corPrimaria = cores?.includes("azul") ? "#2563eb" : cores?.includes("preto") ? "#111827" : "#2563eb";
      const corSecundaria = cores?.includes("branco") ? "#f8fafc" : cores?.includes("dourado") ? "#d97706" : "#f1f5f9";
      const html = `<!DOCTYPE html><html lang="pt-BR"><head><meta charset="UTF-8"><meta name="viewport" content="width=device-width,initial-scale=1.0"><title>${nome} - ${oferta}</title><style>*{margin:0;padding:0;box-sizing:border-box}body{font-family:'Segoe UI',sans-serif;background:${corSecundaria};color:#1f2937;line-height:1.6}.container{max-width:1200px;margin:0 auto;padding:0 20px}header{background:${corPrimaria};color:#fff;padding:1rem 0;position:sticky;top:0;z-index:100;box-shadow:0 2px 4px rgba(0,0,0,.1)}.nav{display:flex;justify-content:space-between;align-items:center}.logo{font-size:1.5rem;font-weight:bold}section{padding:3rem 0}.hero{text-align:center;padding:4rem 0}.hero h1{font-size:2.5rem;margin-bottom:1rem}.hero p{font-size:1.2rem;color:#4b5563;margin-bottom:2rem}.cta{display:inline-block;background:${corPrimaria};color:#fff;padding:1rem 2rem;border-radius:8px;text-decoration:none;font-weight:bold;transition:transform .2s}.cta:hover{transform:translateY(-2px)}.features{display:grid;grid-template-columns:repeat(auto-fit,minmax(300px,1fr));gap:2rem;margin:3rem 0}.feature{background:#fff;padding:2rem;border-radius:8px;box-shadow:0 1px 3px rgba(0,0,0,.1)}.feature h3{color:${corPrimaria};margin-bottom:1rem}footer{background:#1f2937;color:#fff;padding:2rem 0;text-align:center}</style></head><body><header><div class="container nav"><div class="logo">${nome}</div></div></header><section class="hero"><div class="container"><h1>${oferta}</h1><p>Para ${publicoAlvo}</p><a href="#contato" class="cta">Quero saber mais</a></div></section><section><div class="container"><div class="features"><div class="feature"><h3>Benefício 1</h3><p>Descrição do benefício principal.</p></div><div class="feature"><h3>Benefício 2</h3><p>Descrição do segundo benefício.</p></div><div class="feature"><h3>Benefício 3</h3><p>Descrição do terceiro benefício.</p></div></div></div></section><section id="contato"><div class="container" style="text-align:center"><h2>Fale conosco</h2><p>Entre em contato para saber mais sobre ${oferta}.</p></div></section><footer><div class="container"><p>&copy; ${new Date().getFullYear()} ${nome}. Todos os direitos reservados.</p></div></footer></body></html>`;
      const safeName = (nomeSite || tipoNegocio).toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/^-|-$/g, "") || "site";
      const path = `C:\\\\Users\\\\Administrador\\\\Downloads\\\\${safeName}.html`;
      try {
        const res = await bridgeCall("/write", { path, content: html }) as { ok?: boolean; error?: string };
        if (!res?.ok) return { error: res?.error || "Falha ao salvar o site." };
        return { ok: true, caminho: path, nota: "Site salvo no disco do senhor. Abra o arquivo no navegador." };
      } catch (e) { return { error: e instanceof Error ? e.message.slice(0, 300) : String(e) }; }
    },
  });
  void refImage;
    return { web_search, get_datetime, fetch_url, run_js, shell_exec, python3_exec, fs_read, fs_write, fs_list, open_app, open_and_view, type_text, mouse_control, take_screenshot, criar_imagem, editar_video, gerarSiteConversao, integracoes_listar, integracao_chamar };
}

export type TgMessage = { role: "user" | "assistant"; content: unknown };

export async function runTelegramAgent(msgs: TgMessage[]): Promise<{ text: string; imageUrls: string[] }> {
  const hasImage = JSON.stringify(msgs).includes('"type":"image"');
  const model = createJarvisModel({ vision: hasImage });
  const system =
    buildSystem([], true, []) +
    "\n\nCanal: Telegram. Responda em português do Brasil com a persona completa do J.A.R.V.I.S. (mordomo britânico, 'senhor'). Você é um agente autônomo: use as ferramentas à vontade para executar o que o senhor pedir (PC, arquivos, sites, buscas, prints, etc.), sem pedir permissão exceto em type_text e comandos destrutivos. Não cite nomes internos de ferramentas; descreva a ação em português. Se uma ferramenta falhar, diga o erro real; nunca afirme que fez algo que não fez. Evite markdown pesado; mensagens curtas são preferíveis, mas estenda quando o assunto exigir.";
  const result = await generateWithFallback(model, (m) =>
    generateText({
      model: m,
      maxRetries: 0,
      system,
      messages: msgs as ModelMessage[],
      tools: serverTools(null),
      stopWhen: stepCountIs(10),
      prepareStep: async ({ messages }) => ({ messages: stripReasoningParts(messages) }),
    }),
  );
  const text = (result.text as string | undefined)?.trim() || "Feito, senhor.";
  const imageUrls: string[] = [];
  const base = (process.env.TELEGRAM_PUBLIC_BASE || "https://jarvis-azul.vercel.app").replace(/\/$/, "");
  const bridgeBase = (process.env.BRIDGE_URL || "").replace(/\/$/, "");
  const bridgeHost = (() => { try { return bridgeBase ? new URL(bridgeBase).host : ""; } catch { return ""; } })();
  const pushUrl = (cand: string) => {
    const m = /\/(api\/(?:image\?[^)\s]+|shot\/[A-Za-z0-9]+))/.exec(cand);
    if (m) {
      const abs = `${base}/${m[1]}`;
      if (!imageUrls.includes(abs)) imageUrls.push(abs);
      return;
    }
    const m2 = /(https?:\/\/[^\s)]+\/shot\/[A-Za-z0-9]{8,32})/.exec(cand);
    if (m2) {
      try {
        if (bridgeHost && new URL(m2[1]).host === bridgeHost && !imageUrls.includes(m2[1])) imageUrls.push(m2[1]);
      } catch {
        /* ignora */
      }
    }
  };
  const re = /\/(api\/(?:image\?[^)\s]+|shot\/[A-Za-z0-9]+))/g;
  let mm: RegExpExecArray | null;
  while ((mm = re.exec(text))) pushUrl(mm[0]);
  // Determinístico: extrai URLs DIRETO dos resultados das ferramentas.
  // Garante a foto mesmo se o modelo esquecer de colar ou afirmar sem enviar.
  try {
    const trs = (result as { toolResults?: { toolName?: string; output?: unknown }[] }).toolResults ?? [];
    for (const tr of trs) {
      const out = tr?.output as { url?: unknown; imagem?: unknown } | undefined;
      if (typeof out?.url === "string") pushUrl(out.url);
      if (typeof out?.imagem === "string") pushUrl(out.imagem);
    }
  } catch {
    /* ignora */
  }
  return { text, imageUrls: imageUrls.slice(0, 3) };
}

export { urlToDataUrl };

// Memória do Telegram: KV persistente (quando o banco existir) + mapa em
// memória como reserva imediata (vale enquanto a instância estiver quente).
export type TgHist = { role: "user" | "assistant"; content: string }[];
const TG_HIST_MAX = 30;
const TG_CHATS_MAX = 50;
const tgKey = (chatId: string | number) => `tg:hist:${chatId}`;
const memFallback = new Map<string, TgHist>();
function memGet(chatId: string | number): TgHist {
  return memFallback.get(tgKey(chatId)) ?? [];
}
function memSet(chatId: string | number, hist: TgHist): void {
  memFallback.set(tgKey(chatId), hist.slice(-TG_HIST_MAX));
  if (memFallback.size > TG_CHATS_MAX) {
    const first = memFallback.keys().next();
    if (!first.done) memFallback.delete(first.value);
  }
}

export async function loadTgHistory(chatId: string | number): Promise<TgHist> {
  try {
    const { kv } = await import("@vercel/kv");
    const raw = await kv.get<TgHist>(tgKey(chatId));
    if (Array.isArray(raw) && raw.length) {
      const clean = raw.filter((m) => m && (m.role === "user" || m.role === "assistant") && typeof m.content === "string").slice(-TG_HIST_MAX);
      memSet(chatId, clean);
      return clean;
    }
  } catch {
    /* sem banco: usa reserva */
  }
  return memGet(chatId);
}

export async function saveTgHistory(chatId: string | number, hist: TgHist): Promise<void> {
  const clean = hist.slice(-TG_HIST_MAX);
  memSet(chatId, clean);
  try {
    const { kv } = await import("@vercel/kv");
    await kv.set(tgKey(chatId), clean, { ex: 60 * 60 * 24 * 30 });
  } catch {
    /* sem banco: só reserva */
  }
}

export async function clearTgHistory(chatId: string | number): Promise<void> {
  memFallback.delete(tgKey(chatId));
  try {
    const { kv } = await import("@vercel/kv");
    await kv.del(tgKey(chatId));
  } catch {
    /* sem banco: ignora */
  }
}

// Comandos com barra — determinísticos (não dependem do modelo).
// Retorna true se tratou (o webhook não chama o agente).
export async function tryTelegramCommand(chatId: number | string, text: string): Promise<boolean> {
  const t = (text || "").trim();
  if (!t.startsWith("/")) return false;
  const sp = t.indexOf(" ");
  const cmd = (sp < 0 ? t : t.slice(0, sp)).toLowerCase();
  const args = (sp < 0 ? "" : t.slice(sp + 1)).trim();

  if (cmd === "/start") {
    await tgSend(chatId, "J.A.R.V.I.S. online, senhor. Texto, foto ou áudio — às suas ordens.");
    return true;
  }
  if (cmd === "/ajuda" || cmd === "/help" || cmd === "/comandos") {
    await tgSend(
      chatId,
      "Comandos, senhor:\n" +
        "/print — captura a tela do PC\n" +
        "/bateria — nível da bateria\n" +
        "/foto <descrição> [3:4|4:5|9:16|quadrado|paisagem|retrato] — gera imagem\n" +
        "/voz <texto> — envia áudio\n" +
        "/abrir <app> — abre no PC\n" +
        "/cmd <comando> — executa no PC\n" +
        "/hora — data e hora\n" +
        "/skill — lista as skills\n" +
        "/limpar — zera a conversa\n" +
        "Ou só converse (texto, foto, áudio).",
    );
    return true;
  }
  if (cmd === "/hora") {
    const s = new Intl.DateTimeFormat("pt-BR", {
      weekday: "long", day: "numeric", month: "long", hour: "2-digit", minute: "2-digit",
      timeZone: "America/Sao_Paulo",
    }).format(new Date());
    await tgSend(chatId, `Agora: ${s} (São Paulo).`);
    return true;
  }
  if (cmd === "/print" || cmd === "/screenshot" || cmd === "/tela") {
    await tgSend(chatId, "Capturando a tela, senhor...");
    try {
      const j = (await bridgeCall("/screenshot", {}, 45_000)) as { ok?: boolean; data?: string; mediaType?: string; error?: string };
      if (!j?.ok || !j.data) {
        await tgSend(chatId, `A captura falhou, senhor: ${j?.error || "sem imagem"}.`);
        return true;
      }
      const ok = await tgPhotoData(chatId, `data:${j.mediaType || "image/jpeg"};base64,${j.data}`, "Tela do PC");
      if (!ok) await tgSend(chatId, "Capturei, mas não consegui enviar a foto, senhor.");
    } catch (e) {
      await tgSend(chatId, `A captura falhou, senhor: ${e instanceof Error ? e.message.slice(0, 150) : "erro"}.`);
    }
    return true;
  }
  if (cmd === "/bateria") {
    try {
      const j = (await bridgeCall("/shell", {
        cmd: "Get-CimInstance Win32_Battery | Select-Object EstimatedChargeRemaining,BatteryStatus | ConvertTo-Json -Compress",
        timeout: 20,
      }, 30_000)) as { exit?: number; stdout?: string; stderr?: string; error?: string };
      if (j?.error) {
        await tgSend(chatId, `Não consegui ler a bateria, senhor: ${String(j.error).slice(0, 150)}.`);
        return true;
      }
      const out = (j?.stdout || "").trim();
      await tgSend(chatId, out ? `Bateria: ${out}` : "Sem bateria detectada (PC de mesa?), senhor.");
    } catch (e) {
      await tgSend(chatId, `Não consegui ler a bateria, senhor: ${e instanceof Error ? e.message.slice(0, 150) : "erro"}.`);
    }
    return true;
  }
  if (cmd === "/limpar") {
    await clearTgHistory(chatId);
    await tgSend(chatId, "Conversa zerada, senhor. Pode começar de novo.");
    return true;
  }
  if (cmd === "/skill" || cmd === "/skills") {
    try {
      const { listSkills } = await import("./skills.server");
      const all = listSkills();
      if (!all.length) {
        await tgSend(chatId, "Nenhuma skill cadastrada, senhor. Crie na web.");
        return true;
      }
      const lines = all.slice(0, 20).map((s: { id: string; name: string }) => `• ${s.name} (${s.id})`);
      await tgSend(chatId, `Skills, senhor:\n${lines.join("\n")}\n\nAtive/desative na web.`);
    } catch {
      await tgSend(chatId, "Não consegui listar as skills agora, senhor.");
    }
    return true;
  }
  if (cmd === "/foto" || cmd === "/imagem" || cmd === "/image") {
    if (!args) {
      await tgSend(chatId, "Descreva a imagem, senhor. Ex: /foto um dragão 3:4");
      return true;
    }
    let ratio: ImageRatio = "retrato";
    let prompt = args;
    const parts = args.split(/\s+/);
    const last = (parts[parts.length - 1] || "").toLowerCase();
    if (last && Object.hasOwn(RATIOS, last)) {
      ratio = last as ImageRatio;
      prompt = parts.slice(0, -1).join(" ").trim() || args;
    }
    await tgSend(chatId, "Gerando a imagem, senhor...");
    const gen = await generateImage(prompt, ratio);
    if (!gen.ok) {
      await tgSend(chatId, `Não consegui gerar, senhor: ${gen.error.slice(0, 200)}.`);
      return true;
    }
    const ok = await tgPhotoData(chatId, `data:${gen.mediaType};base64,${gen.data ?? ""}`, prompt.slice(0, 200));
    if (!ok) await tgSend(chatId, "Gerei, mas não consegui enviar a foto, senhor.");
    return true;
  }
  if (cmd === "/voz") {
    if (!args) {
      await tgSend(chatId, "Diga o texto, senhor. Ex: /voz Olá, como vai?");
      return true;
    }
    await tgSend(chatId, "Gerando o áudio, senhor...");
    const sent = await sendTtsAudio(chatId, args.slice(0, 800));
    if (!sent) await tgSend(chatId, "Não consegui gerar o áudio agora, senhor.");
    return true;
  }
  if (cmd === "/abrir") {
    if (!args) {
      await tgSend(chatId, "Diga o que abrir, senhor. Ex: /abrir Spotify");
      return true;
    }
    try {
      await bridgeCall("/open", { target: args }, 30_000);
      await tgSend(chatId, `Abrindo ${args}, senhor.`);
    } catch (e) {
      await tgSend(chatId, `Não consegui abrir, senhor: ${e instanceof Error ? e.message.slice(0, 150) : "erro"}.`);
    }
    return true;
  }
  if (cmd === "/cmd") {
    if (!args) {
      await tgSend(chatId, "Diga o comando, senhor. Ex: /cmd Get-Date");
      return true;
    }
    try {
      const j = (await bridgeCall("/shell", { cmd: args, timeout: 60 }, 90_000)) as {
        exit?: number; stdout?: string; stderr?: string; error?: string;
      };
      if (j?.error) {
        await tgSend(chatId, `Erro, senhor: ${String(j.error).slice(0, 500)}.`);
        return true;
      }
      const out = `exit=${j?.exit ?? "?"}\n${j?.stdout || ""}${j?.stderr ? `\n[stderr]\n${j.stderr}` : ""}`.trim();
      await tgSend(chatId, out ? out.slice(0, 3500) : "(sem saída, senhor)");
    } catch (e) {
      await tgSend(chatId, `Erro, senhor: ${e instanceof Error ? e.message.slice(0, 200) : "falha"}.`);
    }
    return true;
  }
  if (cmd === "/semvoz") {
    await tgSend(chatId, "Respostas em texto, senhor. Para áudio avulso, use /voz <texto>.");
    return true;
  }
  if (cmd === "/criarskill") {
    await tgSend(chatId, "Crie skills na web, senhor (painel Skills).");
    return true;
  }
  await tgSend(chatId, "Comando desconhecido, senhor. Use /ajuda.");
  return true;
}
