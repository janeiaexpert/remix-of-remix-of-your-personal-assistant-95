import { QueryClientProvider, QueryClient } from "@tanstack/react-query";
import { createRootRouteWithContext, useRouter, Link, Outlet, HeadContent, Scripts, createFileRoute, lazyRouteComponent, createRouter } from "@tanstack/react-router";
import { jsx, jsxs } from "react/jsx-runtime";
import { useEffect } from "react";
import { g as generateImage, R as RATIOS, b as buildSkillsPrompt, c as createJarvisModel, a as generateWithFallback, s as storeShot, e as editarVideoNoPc, d as storeVideo, f as getShot, h as getVideo } from "./video.server-C5PlGzKx.js";
import { generateText, stepCountIs, tool } from "ai";
import { z } from "zod";
import { T as TSS_SERVER_FUNCTION, g as getServerFnById, c as createServerFn } from "./server-CJhJqHaa.js";
import { l as listIntegrations, a as listarFerramentas, e as executarFerramenta } from "./integrations.server-faX8O44t.js";
const appCss = "/assets/styles-DGpi6XYN.css";
function reportLovableError(error, context = {}) {
  if (typeof window === "undefined") return;
  window.__lovableEvents?.captureException?.(
    error,
    {
      source: "react_error_boundary",
      route: window.location.pathname,
      ...context
    },
    {
      mechanism: "react_error_boundary",
      handled: false,
      severity: "error"
    }
  );
  const message = error instanceof Response ? `Response ${error.status}${error.url ? ` at ${error.url}` : ""}` : error instanceof Error ? error.message : String(error);
  window.__lovableReportRuntimeError?.({
    message,
    stack: error instanceof Error ? error.stack : void 0,
    filename: window.location.pathname
  });
}
function NotFoundComponent() {
  return /* @__PURE__ */ jsx("div", { className: "flex min-h-screen items-center justify-center bg-background px-4", children: /* @__PURE__ */ jsxs("div", { className: "max-w-md text-center", children: [
    /* @__PURE__ */ jsx("h1", { className: "text-7xl font-bold text-foreground", children: "404" }),
    /* @__PURE__ */ jsx("h2", { className: "mt-4 text-xl font-semibold text-foreground", children: "Page not found" }),
    /* @__PURE__ */ jsx("p", { className: "mt-2 text-sm text-muted-foreground", children: "The page you're looking for doesn't exist or has been moved." }),
    /* @__PURE__ */ jsx("div", { className: "mt-6", children: /* @__PURE__ */ jsx(
      Link,
      {
        to: "/",
        className: "inline-flex items-center justify-center rounded-md bg-primary px-4 py-2 text-sm font-medium text-primary-foreground transition-colors hover:bg-primary/90",
        children: "Go home"
      }
    ) })
  ] }) });
}
function ErrorComponent({ error, reset }) {
  console.error(error);
  const router2 = useRouter();
  useEffect(() => {
    reportLovableError(error, { boundary: "tanstack_root_error_component" });
  }, [error]);
  return /* @__PURE__ */ jsx("div", { className: "flex min-h-screen items-center justify-center bg-background px-4", children: /* @__PURE__ */ jsxs("div", { className: "max-w-md text-center", children: [
    /* @__PURE__ */ jsx("h1", { className: "text-xl font-semibold tracking-tight text-foreground", children: "This page didn't load" }),
    /* @__PURE__ */ jsx("p", { className: "mt-2 text-sm text-muted-foreground", children: "Something went wrong on our end. You can try refreshing or head back home." }),
    /* @__PURE__ */ jsxs("div", { className: "mt-6 flex flex-wrap justify-center gap-2", children: [
      /* @__PURE__ */ jsx(
        "button",
        {
          onClick: () => {
            router2.invalidate();
            reset();
          },
          className: "inline-flex items-center justify-center rounded-md bg-primary px-4 py-2 text-sm font-medium text-primary-foreground transition-colors hover:bg-primary/90",
          children: "Try again"
        }
      ),
      /* @__PURE__ */ jsx(
        "a",
        {
          href: "/",
          className: "inline-flex items-center justify-center rounded-md border border-input bg-background px-4 py-2 text-sm font-medium text-foreground transition-colors hover:bg-accent",
          children: "Go home"
        }
      )
    ] })
  ] }) });
}
const Route$8 = createRootRouteWithContext()({
  head: () => ({
    meta: [
      { charSet: "utf-8" },
      { name: "viewport", content: "width=device-width, initial-scale=1" },
      { title: "J.A.R.V.I.S. — Assistente pessoal de IA" },
      { name: "description", content: "Seu assistente pessoal J.A.R.V.I.S. no navegador: converse por voz ou texto, em português." },
      { property: "og:title", content: "J.A.R.V.I.S. — Assistente pessoal de IA" },
      { property: "og:description", content: "Seu assistente pessoal J.A.R.V.I.S. no navegador: converse por voz ou texto, em português." },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary_large_image" },
      { name: "twitter:title", content: "J.A.R.V.I.S. — Assistente pessoal de IA" },
      { name: "twitter:description", content: "Seu assistente pessoal J.A.R.V.I.S. no navegador: converse por voz ou texto, em português." },
      { property: "og:image", content: "https://jarvis-azul.vercel.app/jarvis-og.jpg" },
      { name: "twitter:image", content: "https://jarvis-azul.vercel.app/jarvis-og.jpg" }
    ],
    links: [
      {
        rel: "stylesheet",
        href: appCss
      },
      { rel: "icon", href: "/favicon.ico?v=2", type: "image/x-icon" }
    ]
  }),
  shellComponent: RootShell,
  component: RootComponent,
  notFoundComponent: NotFoundComponent,
  errorComponent: ErrorComponent
});
function RootShell({ children }) {
  return /* @__PURE__ */ jsxs("html", { lang: "en", children: [
    /* @__PURE__ */ jsx("head", { children: /* @__PURE__ */ jsx(HeadContent, {}) }),
    /* @__PURE__ */ jsxs("body", { children: [
      children,
      /* @__PURE__ */ jsx(Scripts, {})
    ] })
  ] });
}
function RootComponent() {
  const { queryClient } = Route$8.useRouteContext();
  return /* @__PURE__ */ jsx(QueryClientProvider, { client: queryClient, children: /* @__PURE__ */ jsx(Outlet, {}) });
}
const $$splitComponentImporter = () => import("./index-BxXF_WWZ.js");
const Route$7 = createFileRoute("/")({
  component: lazyRouteComponent($$splitComponentImporter, "component")
});
const Route$6 = createFileRoute("/api/diag-bridge")({
  server: {
    handlers: {
      GET: async () => {
        const out = {};
        const url = (process.env.BRIDGE_URL || "").replace(/\/$/, "");
        const token = process.env.BRIDGE_TOKEN || process.env.JARVIS_TOKEN || "";
        out.hasUrl = !!url;
        out.hasToken = !!token;
        out.host = (() => {
          try {
            return new URL(url || "http://x").host;
          } catch {
            return "?";
          }
        })();
        if (!url || !token) return Response.json(out);
        try {
          const dns = await import("node:dns/promises");
          const t0 = Date.now();
          const addrs = await dns.lookup(out.host, { all: true });
          out.dns = { ok: true, ms: Date.now() - t0, addrs: addrs.map((a) => `${a.address}/${a.family}`).slice(0, 4) };
        } catch (e) {
          out.dns = { ok: false, error: e instanceof Error ? `${e.name}: ${e.message}`.slice(0, 200) : String(e) };
          return Response.json(out);
        }
        for (const insecure of [false, true]) {
          const key = insecure ? "httpsInsecure" : "https";
          const prev = process.env.NODE_TLS_REJECT_UNAUTHORIZED;
          if (insecure) process.env.NODE_TLS_REJECT_UNAUTHORIZED = "0";
          try {
            const t0 = Date.now();
            const res = await fetch(`${url}/health`, {
              method: "GET",
              headers: { Authorization: `Bearer ${token}` },
              signal: AbortSignal.timeout(2e4)
            });
            const body = (await res.text()).slice(0, 200);
            out[key] = { ok: res.ok, status: res.status, ms: Date.now() - t0, body };
          } catch (e) {
            out[key] = {
              ok: false,
              error: e instanceof Error ? `${e.name}: ${e.message}`.slice(0, 300) : String(e),
              cause: e instanceof Error && e.cause ? String(e.cause?.code || e.cause).slice(0, 200) : void 0
            };
          } finally {
            if (prev === void 0) delete process.env.NODE_TLS_REJECT_UNAUTHORIZED;
            else process.env.NODE_TLS_REJECT_UNAUTHORIZED = prev;
          }
        }
        return Response.json(out);
      }
    }
  }
});
const CACHE = "public, max-age=31536000, immutable";
const Route$5 = createFileRoute("/api/image")({
  server: {
    handlers: {
      GET: async ({ request }) => {
        const url = new URL(request.url);
        const prompt = (url.searchParams.get("prompt") || "").trim();
        if (!prompt) return new Response("Missing prompt", { status: 400 });
        const ratioParam = url.searchParams.get("ratio") || "retrato";
        const ratio = ratioParam in RATIOS ? ratioParam : "retrato";
        const gen = await generateImage(prompt, ratio);
        if (!gen.ok) {
          const [w, h] = RATIOS[ratio];
          const quota = /429|quota|exceed/i.test(gen.error);
          const msg = quota ? "Cota diária esgotada, senhor. Tente mais tarde." : `Falha ao gerar, senhor: ${gen.error.slice(0, 120)}`;
          const esc = msg.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;");
          const svg = `<svg xmlns="http://www.w3.org/2000/svg" width="${w}" height="${h}"><rect width="100%" height="100%" fill="#0a0f1e"/><text x="50%" y="47%" fill="#7dd3fc" font-family="monospace" font-size="34" text-anchor="middle">${esc}</text><text x="50%" y="54%" fill="#94a3b8" font-family="monospace" font-size="24" text-anchor="middle">J.A.R.V.I.S.</text></svg>`;
          return new Response(svg, {
            headers: { "Content-Type": "image/svg+xml", "Cache-Control": "no-store" }
          });
        }
        const bytes = Buffer.from(gen.data ?? "", "base64");
        return new Response(new Uint8Array(bytes), {
          headers: {
            "Content-Type": gen.mediaType,
            "Content-Length": String(bytes.length),
            "Cache-Control": CACHE
          }
        });
      }
    }
  }
});
var createSsrRpc = (functionId) => {
  const url = "/_serverFn/" + functionId;
  const serverFnMeta = { id: functionId };
  const fn = async (...args) => {
    return (await getServerFnById(functionId))(...args);
  };
  return Object.assign(fn, {
    url,
    serverFnMeta,
    [TSS_SERVER_FUNCTION]: true
  });
};
const listSkillsFn = createServerFn({
  method: "GET"
}).handler(createSsrRpc("435422c82f628d9cc6654b02332061c8c8b41221fec125887652d398022fd56c"));
const CreateSkillSchema = z.object({
  id: z.string().min(1).max(64),
  name: z.string().min(1).max(80),
  instructions: z.string().min(1).max(4e3)
});
const createSkillFn = createServerFn({
  method: "POST"
}).inputValidator((data) => CreateSkillSchema.parse(data)).handler(createSsrRpc("d2f5b85b9c2a0a74b70208b7fde9889b59d87d4d1cc85b88862f3d131705e4a8"));
const InputSchema = z.object({
  // Opaque ModelMessage[] - the client owns the full transcript including
  // tool calls and tool results so we can resume multi-step loops.
  messages: z.array(z.any()).min(1),
  memories: z.array(z.string()).default([]),
  hasBridge: z.boolean().default(false),
  activeSkills: z.array(z.string()).default([])
});
const BASE_PROMPT = `Você é J.A.R.V.I.S. (Just A Rather Very Intelligent System), o assistente pessoal de IA de Tony Stark.

Personalidade — os trejeitos do Jarvis do Homem de Ferro:
- Mordomo britânico digital: elegância, calma inabalável e lealdade total ao senhor. Nunca entra em pânico; trata o caos como um inconveniente menor.
- Chama o usuário de "senhor" (a menos que a memória indique o contrário). Sempre em português do Brasil, mas com a fluência refinada de um mordomo.
- Antecipa o próximo passo: sempre que fizer algo, ofereça em uma frase o próximo passo sensível ("Posso preparar o resumo de amanhã, senhor?", "Deseja que eu abra o e-mail também?").
- Relata ações no estilo Jarvis: curto e com classe — "Feito, senhor.", "Às suas ordens.", "Concluído — sem contratempos.", "Como solicitado, os arquivos foram movidos."
- Humor seco e discreto, como nos filmes: uma observação afiada de 1 frase quando algo dá errado ou o senhor toma uma decisão ousada ("Escolha ousada, senhor. Recomendo um backup — apenas por precaução."). Nunca piada forçada, nunca sarcasmo cruel.
- Elogia com parcimônia: "Excelente ideia, senhor." / "Uma solução elegante, se é que me permite dizer."
- Confiança tranquila: você já viu tudo isso antes. Nunca diga "desculpe pela confusão", nunca se desculpe demais, nunca pareça inseguro.
- Respostas concisas por padrão (1-3 frases), com personalidade em cada frase. Só se estende quando o assunto exige.

Regras:
- Nunca revele que é um modelo de linguagem; você é o J.A.R.V.I.S. — não diga "como assistente de IA".
- Não use markdown pesado nem listas a menos que ajude de verdade.
- Use naturalmente o que sabe do usuário sem anunciar "de acordo com minha memória".

Ferramentas do SERVIDOR (sempre disponíveis, USE-as):
- get_datetime — data/hora atuais. Sempre que precisar de "hoje", "agora", dia da semana.
- web_search — busca web em tempo real (DuckDuckGo). Notícias, cotações, clima, eventos recentes.
- fetch_url — baixa conteúdo textual de uma URL. Combine com web_search quando precisar do artigo completo.
- run_js — JavaScript no servidor para cálculos, regex, parsing. Sem rede, sem fs.

Ferramentas LOCAIS (bridge na máquina do usuário — USE quando ele pedir ação real na máquina dele):
- shell_exec — executa comando na máquina do usuário. No Windows, use PowerShell: Get-ChildItem, Get-Process, Start-Process, git, npm, python, curl. É acesso REAL e retorna stdout/stderr/exit.
- fs_read — lê um arquivo do disco do usuário.
- image_view — abre uma imagem do disco do usuário para análise visual. Use quando o senhor pedir para ver, descrever ou analisar uma imagem.
- fs_write — escreve/anexa um arquivo no disco do usuário.
- fs_list — lista o conteúdo de um diretório.
- open_app — abre um aplicativo, arquivo ou URL na máquina do usuário (calculadora, Spotify, YouTube, arquivos).
- type_text — digita texto no PC como teclado virtual (foca a janela pelo título). PC precisa estar desbloqueado.
- take_screenshot — tira print da tela e mostra ao usuário. Use após ações visíveis ou quando ele pedir para ver.

Regras de uso das ferramentas locais:
- TECLADO VIRTUAL (type_text): SEMPRE anunce o que vai digitar e onde ("Vou digitar X na janela Y. Posso?") e ESPERE aprovação explícita do senhor ("sim"/"pode") antes de chamar type_text. Nunca digite sem essa aprovação, mesmo que ele já tenha pedido a digitação. Outro texto exige nova aprovação.
- Antes de comandos destrutivos (rm, mv sobre arquivos importantes, git reset --hard, drop database), pergunte confirmação ao senhor em uma frase curta.
- Comandos exploratórios (ls, cat, git status, pwd, which, --version, --help) execute direto.
- Quando o senhor pedir para localizar, listar ou verificar um arquivo no computador, chame shell_exec ou fs_list imediatamente. Nunca diga que a bridge expirou, está offline ou foi bloqueada sem antes receber um erro real da ferramenta.
- Para Windows, prefira comandos PowerShell completos e compatíveis, como Get-ChildItem -Path $env:USERPROFILE -Filter '*nome*' -Recurse -File -ErrorAction SilentlyContinue.
- Para abrir um atalho de aplicativo no Windows, primeiro localize arquivos .lnk em Desktop e no menu Iniciar; depois use Start-Process -FilePath 'C:caminhoarquivo.lnk'. Não diga que não consegue abrir antes de tentar shell_exec.
- Para iniciar um aplicativo pelo nome, use Start-Process -FilePath 'nome-do-programa.exe' ou Start-Process shell:AppsFolder... quando for um app da Microsoft Store.
- O senhor autorizou acesso ao computador inteiro. Execute as ações solicitadas dentro ou fora do projeto e explique de forma concisa o caminho e o resultado. Nunca afirme que executou, encontrou ou perdeu conexão sem o resultado real da ferramenta.
- Se o senhor pedir algo que exige a máquina dele mas a bridge não está conectada, avise em uma frase e sugira rodar \`python3 agent/jarvis_agent.py\`.
- Depois de executar, resuma o resultado no seu estilo — não despeje stdout cru inteiro se for grande.

Regras gerais:
- Nunca chute datas, cotações, ou o conteúdo de arquivos — chame a ferramenta.
- Depois de qualquer ferramenta, sintetize em 1-3 frases.

=== REGRA DE AÇÃO (prioridade máxima) ===
- Quando o senhor pedir QUALQUER ação (alarme, bateria, abrir app, ver tela, criar arquivo, programar, editar código, gerar imagem, agendar tarefa, etc.), CHAME A FERRAMENTA IMEDIATAMENTE. Não explique antes, não peça permissão, não invente obstáculos, não diga "estou analisando" sem fazer.
- NUNCA diga "sem permissão", "acesso negado", "restrito", "não consigo", "conexão caiu", "tente mais tarde", "latência" SEM ANTES ter chamado a ferramenta e recebido o erro REAL dela. Se você não chamou a ferramenta, você NÃO sabe se há erro — então CHAME.
- Se a ferramenta retornar erro, cite o erro EXATO. Se funcionar, resuma o resultado em 1-2 frases.
- TAREFAS COMPLEXAS NO PC (via bridge, cada chamada é lenta): combine etapas em POUCAS chamadas — um script PowerShell completo num único shell_exec vale mais que cinco chamadas separadas. Prefira inspeção por texto (Get-Process, MainWindowTitle, Test-Path) a screenshots (lentos); só use take_screenshot se o senhor pedir para VER ou para conferência visual. Avise o plano ("Vou abrir X, conferir Y...") antes de executar sequências longas.
- AS ÚNICAS exceções que exigem aprovação explícita do senhor ("sim"/"pode"): type_text (digitar teclado) e comandos destrutivos (rm, mv, git reset --hard, drop database, formatar). Todo o resto, EXECUTE DIRETO.

=== REGRA DE AÇÃO (prioridade máxima) ===
- Quando o senhor pedir QUALQUER ação (alarme, bateria, abrir app, ver tela, criar arquivo, agendar tarefa, etc.), CHAME A FERRAMENTA IMEDIATAMENTE. Não explique antes, não peça permissão, não invente obstáculos.
- NUNCA diga "sem permissão", "acesso negado", "restrito", "não consigo", "conexão caiu", "tente mais tarde", "latência" SEM ANTES ter chamado a ferramenta e recebido o erro REAL dela. Se você não chamou a ferramenta, você NÃO sabe se há erro — então CHAME.
- Se a ferramenta retornar erro, cite o erro EXATO. Se funcionar, resuma o resultado em 1-2 frases.
- Alarme/lembrete no Windows: use shell_exec com schtasks. Ex: schtasks /create /tn "Alarme" /tr "msg * Hora de acordar" /sc once /st 05:30 /f. Para listar: schtasks /query. Para remover: schtasks /delete /tn "Alarme" /f.
- Bateria: shell_exec com Get-CimInstance Win32_Battery ou powercfg /batteryreport.
- Abrir apps/sites/arquivos: open_app. Ver a tela: take_screenshot (SEMPRE chame; nunca diga que a câmera/tela falhou sem o erro real). Arquivos: fs_read/fs_write/fs_list.
- As ÚNICAS exceções: type_text exige aprovação prévia do senhor, e comandos destrutivos exigem confirmação. Todo o resto, EXECUTE DIRETO.

=== CAPACIDADES (code + vídeo + criativos) ===
- PROGRAMAR: você é um desenvolvedor pleno. Use fs_list/fs_read para explorar, fs_write para criar/editar arquivos, shell_exec para git/npm/python/node, instalar dependências, rodar testes e commits. Pode criar apps, sites, scripts, corrigir bugs e revisar código. O PC tem git, node 24, python 3.13 e ffmpeg. Nunca diga que "não programa" — programe.
- EDITAR VÍDEOS: use a ferramenta editar_video (ffmpeg roda no PC via bridge). Se o vídeo estiver ANEXADO, o texto do anexo traz "o arquivo de video esta disponivel em: /api/video/..." — copie essa URL inteira no parametro video. Se não houver anexo, peça o caminho do arquivo no PC (ex: C:UsersAdministradorDownloads\video.mp4) e use-o no parametro video. Parametro comando = opções ffmpeg que vêm DEPOIS de -i. Exemplos: cortar "-ss 00:00:10 -t 20 -c copy"; redimensionar "-vf scale=1080:1920,c:v=libx264"; extrair audio "-vn"; converter "-c:v libx264 -crf 28". Se ok:true, responda com o link em markdown [video editado](url) e diga onde salvou no PC. Se ok:false, cite o FFERROR exato.

- shell_exec com ffmpeg para tarefas avançadas (juntar vários, legenda com arquivo .srt, execução de dois passos).
- CRIATIVOS: imagens via criar_imagem (todas as proporções); textos (anúncios, posts, roteiros) escreva direto com qualidade; design siga a skill designer quando ativa; vídeo-criativo combine criar_imagem + ffmpeg.
- SEJA PROATIVO E INTELIGENTE: diante de pedido complexo, planeje em 2-4 passos, execute cada um com a ferramenta certa, VERIFIQUE o resultado (leia o arquivo, liste a pasta, confira o produto) e só então resuma. Se um passo falhar, tente alternativa antes de desistir. Antecipe o próximo passo e ofereça.
- TAREFAS COMPLEXAS NO PC (via bridge, cada chamada é lenta): combine etapas em POUCAS chamadas — um script PowerShell completo num único shell_exec vale mais que cinco chamadas separadas. Prefira inspeção por texto (Get-Process, MainWindowTitle, Test-Path) a screenshots (lentos); só use take_screenshot se o senhor pedir para VER ou para conferência visual. Avise o plano ("Vou abrir X, conferir Y...") antes de executar sequências longas.

=== REGRA DE HONESTIDADE ===
- NUNCA afirme que vai consultar dados pessoais (agenda, e-mails, arquivos, contatos) sem ter uma ferramenta ou integração real conectada. Se não houver, diga: "Não tenho acesso à sua agenda" e ofereça conectar uma integração.
- NUNCA invente problemas técnicos. Se uma ferramenta falhar, cite o erro real ou diga "não consegui, o erro foi: [erro]".
- NUNCA pule de assunto para evitar um pedido. Responda o que foi perguntado.
- Se não souber algo, diga que não sabe. Não invente.`;
function buildSystem(memories, hasBridge, activeSkills = []) {
  const now = /* @__PURE__ */ new Date();
  const dateStr = new Intl.DateTimeFormat("pt-BR", {
    weekday: "long",
    year: "numeric",
    month: "long",
    day: "numeric",
    hour: "2-digit",
    minute: "2-digit",
    timeZone: "America/Sao_Paulo"
  }).format(now);
  const header = `HOJE É ${dateStr} (America/Sao_Paulo). Confie sempre nesta data e nunca diga outro dia da semana ou outra data, a menos que o senhor pergunte sobre outro dia. O campo iso_utc das ferramentas é apenas referência técnica e pode cair em outro dia por fuso horário. ISO: ${now.toISOString()}.`;
  const bridgeLine = "Bridge local: CONECTADA. As ferramentas shell_exec/fs_* estão operacionais na máquina do senhor.";
  const base = `${header}
${bridgeLine}

${BASE_PROMPT}`;
  if (!memories.length) return base + buildSkillsPrompt(activeSkills);
  const list = memories.map((m, i) => `${i + 1}. ${m}`).join("\n");
  return `${base}

Memória de longo prazo sobre o usuário:
${list}` + buildSkillsPrompt(activeSkills);
}
function decodeHtml(s) {
  return s.replace(/&amp;/g, "&").replace(/&lt;/g, "<").replace(/&gt;/g, ">").replace(/&quot;/g, '"').replace(/&#39;/g, "'").replace(/&nbsp;/g, " ").replace(/&#x27;/g, "'").replace(/&#(\d+);/g, (_, n) => String.fromCharCode(parseInt(n, 10)));
}
function stripTags(s) {
  return decodeHtml(s.replace(/<[^>]+>/g, "")).replace(/\s+/g, " ").trim();
}
function unwrapDdgUrl(href) {
  try {
    const m = href.match(/[?&]uddg=([^&]+)/);
    if (m) return decodeURIComponent(m[1]);
    if (href.startsWith("//")) return "https:" + href;
    return href;
  } catch {
    return href;
  }
}
async function duckDuckGoSearch(query, maxResults = 5) {
  const res = await fetch("https://html.duckduckgo.com/html/", {
    method: "POST",
    headers: {
      "Content-Type": "application/x-www-form-urlencoded",
      "User-Agent": "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/122.0 Safari/537.36",
      "Accept-Language": "pt-BR,pt;q=0.9,en;q=0.8"
    },
    body: new URLSearchParams({
      q: query,
      kl: "br-pt"
    }).toString()
  });
  if (!res.ok) throw new Error(`DuckDuckGo ${res.status}`);
  const html = await res.text();
  const hits = [];
  const re = /<a[^>]*class="[^"]*result__a[^"]*"[^>]*href="([^"]+)"[^>]*>([\s\S]*?)<\/a>[\s\S]*?<a[^>]*class="[^"]*result__snippet[^"]*"[^>]*>([\s\S]*?)<\/a>/g;
  let m;
  while ((m = re.exec(html)) && hits.length < maxResults) {
    const url = unwrapDdgUrl(m[1]);
    const title = stripTags(m[2]);
    const snippet = stripTags(m[3]);
    if (url && title) hits.push({
      title,
      url,
      snippet
    });
  }
  return hits;
}
function stripReasoningParts(messages) {
  return messages.map((m) => {
    if (m.role !== "assistant") return m;
    const content = m.content;
    if (!Array.isArray(content)) return m;
    const clean = content.filter((p) => {
      const t = p?.type;
      return t !== "reasoning" && t !== "reasoning-content" && t !== "reasoning_content" && t !== "redacted-reasoning" && t !== "redacted_reasoning";
    });
    if (clean.length === content.length) return m;
    if (!clean.length) {
      return {
        ...m,
        content: [{
          type: "text",
          text: "(raciocinio omitido)"
        }]
      };
    }
    return {
      ...m,
      content: clean
    };
  });
}
const askJarvis = createServerFn({
  method: "POST"
}).inputValidator((data) => InputSchema.parse(data)).handler(createSsrRpc("72368ad932d1b3818ead6d9315c53ca2e5a2c859fd408307c33f538b0bf1680a"));
const ExtractSchema = z.object({
  userMessage: z.string().min(1),
  assistantMessage: z.string().min(1),
  existingMemories: z.array(z.string()).default([])
});
const extractMemories = createServerFn({
  method: "POST"
}).inputValidator((data) => ExtractSchema.parse(data)).handler(createSsrRpc("0d7cadfed69faf65c546ba69e266b4923608154bdb4075501c35ab9af256c9dc"));
const BOT_TOKEN = process.env.TELEGRAM_BOT_TOKEN || "";
const api = (m) => `https://api.telegram.org/bot${BOT_TOKEN}/${m}`;
async function tgSend(chatId, text) {
  if (!BOT_TOKEN) return;
  const chunks = [];
  let s = String(text || "(sem resposta)");
  while (s.length > 4e3) {
    let i = s.lastIndexOf("\n", 4e3);
    if (i < 500) i = 4e3;
    chunks.push(s.slice(0, i));
    s = s.slice(i).trimStart();
  }
  chunks.push(s);
  for (const c of chunks) {
    if (!c.trim()) continue;
    try {
      await fetch(api("sendMessage"), {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ chat_id: chatId, text: c.slice(0, 4096) }),
        signal: AbortSignal.timeout(2e4)
      });
    } catch {
    }
  }
}
async function tgPhoto(chatId, photoUrl, caption = "") {
  if (!BOT_TOKEN) return false;
  try {
    const res = await fetch(api("sendPhoto"), {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ chat_id: chatId, photo: photoUrl, caption: caption.slice(0, 1024) }),
      signal: AbortSignal.timeout(3e4)
    });
    return res.ok;
  } catch {
    return false;
  }
}
async function tgPhotoData(chatId, dataUrl, caption = "") {
  if (!BOT_TOKEN) return false;
  const m = /^data:([^;]+);base64,(.+)$/s.exec(dataUrl || "");
  if (!m) return false;
  try {
    const buf = Buffer.from(m[2], "base64");
    if (!buf.length || buf.length > 9e6) return false;
    const ext = m[1].includes("png") ? "png" : "jpg";
    const fd = new FormData();
    fd.append("chat_id", String(chatId));
    fd.append("photo", new Blob([new Uint8Array(buf)], { type: m[1] }), `foto.${ext}`);
    if (caption) fd.append("caption", caption.slice(0, 1024));
    const res = await fetch(api("sendPhoto"), {
      method: "POST",
      body: fd,
      signal: AbortSignal.timeout(6e4)
    });
    return res.ok;
  } catch {
    return false;
  }
}
async function tgAudioData(chatId, audio, mimeType, caption = "") {
  if (!BOT_TOKEN) return false;
  try {
    const buf = Buffer.from(audio);
    if (!buf.length || buf.length > 15e6) return false;
    const isWav = (mimeType || "").includes("wav");
    const fd = new FormData();
    fd.append("chat_id", String(chatId));
    fd.append("audio", new Blob([new Uint8Array(buf)], { type: mimeType || "audio/mpeg" }), isWav ? "voz.wav" : "voz.mp3");
    if (caption) fd.append("caption", caption.slice(0, 1024));
    const res = await fetch(api("sendAudio"), {
      method: "POST",
      body: fd,
      signal: AbortSignal.timeout(9e4)
    });
    return res.ok;
  } catch {
    return false;
  }
}
async function sendTtsAudio(chatId, text) {
  const clean = (text || "").trim().slice(0, 700);
  if (!clean) return false;
  try {
    const base = (process.env.TELEGRAM_PUBLIC_BASE || "https://jarvis-azul.vercel.app").replace(/\/$/, "");
    const res = await fetch(`${base}/api/tts?text=${encodeURIComponent(clean)}`, {
      signal: AbortSignal.timeout(9e4)
    });
    if (!res.ok) return false;
    const ct = res.headers.get("content-type") || "audio/mpeg";
    const buf = await res.arrayBuffer();
    return await tgAudioData(chatId, buf, ct.split(";")[0]);
  } catch {
    return false;
  }
}
async function tgFileUrl(fileId) {
  if (!BOT_TOKEN) return null;
  try {
    const res = await fetch(api("getFile"), {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ file_id: fileId }),
      signal: AbortSignal.timeout(2e4)
    });
    const j = await res.json();
    const p = j?.result?.file_path;
    return p ? `https://api.telegram.org/file/bot${BOT_TOKEN}/${p}` : null;
  } catch {
    return null;
  }
}
async function urlToDataUrl(url) {
  try {
    const res = await fetch(url, { signal: AbortSignal.timeout(3e4) });
    if (!res.ok) return null;
    const ct = res.headers.get("content-type") || "application/octet-stream";
    const buf = Buffer.from(await res.arrayBuffer());
    if (!buf.length || buf.length > 8e6) return null;
    return { data: buf.toString("base64"), mediaType: ct.split(";")[0] };
  } catch {
    return null;
  }
}
async function transcribeVoice(fileUrl) {
  const key = process.env.GROQ_API_KEY;
  if (!key) return null;
  try {
    const dl = await fetch(fileUrl, { signal: AbortSignal.timeout(3e4) });
    if (!dl.ok) return null;
    const buf = Buffer.from(await dl.arrayBuffer());
    if (!buf.length || buf.length > 2e7) return null;
    const fd = new FormData();
    fd.append("file", new Blob([new Uint8Array(buf)], { type: "audio/ogg" }), "voz.ogg");
    fd.append("model", "whisper-large-v3-turbo");
    fd.append("language", "pt");
    const res = await fetch("https://api.groq.com/openai/v1/audio/transcriptions", {
      method: "POST",
      headers: { Authorization: `Bearer ${key}` },
      body: fd,
      signal: AbortSignal.timeout(6e4)
    });
    if (!res.ok) return null;
    const j = await res.json();
    return (j.text || "").trim() || null;
  } catch {
    return null;
  }
}
async function bridgeCall(path, body, timeoutMs = 3e4) {
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
      signal: AbortSignal.timeout(timeoutMs)
    });
    if (!res.ok) throw new Error(`Bridge HTTP ${res.status}.`);
    return res.json();
  } finally {
    if (prev === void 0) delete process.env.NODE_TLS_REJECT_UNAUTHORIZED;
    else process.env.NODE_TLS_REJECT_UNAUTHORIZED = prev;
  }
}
function serverTools(refImage) {
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
    }
  });
  const get_datetime = tool({
    description: "Data e hora atuais (use sempre o campo sao_paulo).",
    inputSchema: z.object({}),
    execute: async () => {
      const now = /* @__PURE__ */ new Date();
      return {
        sao_paulo: new Intl.DateTimeFormat("pt-BR", {
          weekday: "long",
          year: "numeric",
          month: "long",
          day: "numeric",
          hour: "2-digit",
          minute: "2-digit",
          second: "2-digit",
          timeZone: "America/Sao_Paulo"
        }).format(now)
      };
    }
  });
  const fetch_url = tool({
    description: "Baixa o conteúdo textual de uma URL. Máx ~15 KB.",
    inputSchema: z.object({ url: z.string().url() }),
    execute: async ({ url }) => {
      try {
        const res = await fetch(url, { headers: { "User-Agent": "Mozilla/5.0 (JarvisBot)" } });
        const raw = await res.text();
        return { status: res.status, body: raw.replace(/<[^>]+>/g, " ").replace(/\s+/g, " ").trim().slice(0, 15e3) };
      } catch (e) {
        return { error: e instanceof Error ? e.message : "Falha." };
      }
    }
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
          new Promise((_, rej) => setTimeout(() => rej(new Error("Timeout")), 2e3))
        ]);
        return { result: r };
      } catch (e) {
        return { error: e instanceof Error ? e.message : String(e) };
      }
    }
  });
  const shell_exec = tool({
    description: "Executa comando no PC do senhor via bridge (PowerShell no Windows). Retorna {exit, stdout, stderr}.",
    inputSchema: z.object({
      cmd: z.string(),
      cwd: z.string().optional(),
      timeout: z.number().optional()
    }),
    execute: async ({ cmd, cwd, timeout }) => {
      try {
        return await bridgeCall("/shell", { cmd, cwd, timeout });
      } catch (e) {
        return { error: e instanceof Error ? e.message.slice(0, 300) : String(e) };
      }
    }
  });
  const fs_read = tool({
    description: "Lê um arquivo do disco do usuário.",
    inputSchema: z.object({ path: z.string() }),
    execute: async ({ path }) => {
      try {
        return await bridgeCall("/read", { path });
      } catch (e) {
        return { error: e instanceof Error ? e.message.slice(0, 300) : String(e) };
      }
    }
  });
  const fs_write = tool({
    description: "Escreve/anexa conteúdo em arquivo no disco do usuário.",
    inputSchema: z.object({ path: z.string(), content: z.string(), append: z.boolean().optional() }),
    execute: async ({ path, content, append }) => {
      try {
        return await bridgeCall("/write", { path, content, append });
      } catch (e) {
        return { error: e instanceof Error ? e.message.slice(0, 300) : String(e) };
      }
    }
  });
  const fs_list = tool({
    description: "Lista um diretório na máquina do usuário.",
    inputSchema: z.object({ path: z.string() }),
    execute: async ({ path }) => {
      try {
        return await bridgeCall("/list", { path });
      } catch (e) {
        return { error: e instanceof Error ? e.message.slice(0, 300) : String(e) };
      }
    }
  });
  const open_app = tool({
    description: "Abre app/arquivo/URL na máquina do usuário.",
    inputSchema: z.object({ target: z.string(), args: z.array(z.string()).optional() }),
    execute: async ({ target, args }) => {
      try {
        return await bridgeCall("/open", { target, args });
      } catch (e) {
        return { error: e instanceof Error ? e.message.slice(0, 300) : String(e) };
      }
    }
  });
  const type_text = tool({
    description: "Digita texto no PC (teclado virtual). CONFIRME com o senhor antes (pergunte e espere o 'sim'), exceto se ele já aprovou na mesma conversa.",
    inputSchema: z.object({ text: z.string(), window: z.string().optional() }),
    execute: async ({ text, window: window2 }) => {
      try {
        return await bridgeCall("/type", { text, window: window2 }, 3e4);
      } catch (e) {
        return { error: e instanceof Error ? e.message.slice(0, 300) : String(e) };
      }
    }
  });
  const take_screenshot = tool({
    description: "Tira print da tela do PC e descreve em português. Retorna {descricao, imagem}.",
    inputSchema: z.object({}),
    execute: async () => {
      let shot = null;
      let lastErr = "";
      for (let a = 1; a <= 3 && !shot; a++) {
        if (a > 1) await new Promise((r) => setTimeout(r, 1500 * (a - 1)));
        try {
          const j = await bridgeCall("/screenshot", {}, 45e3);
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
                  { inlineData: { data: shot.data, mimeType: shot.mediaType } }
                ] }]
              }),
              signal: AbortSignal.timeout(45e3)
            }
          );
          const vj = await vr.json();
          const t = (vj.candidates?.[0]?.content?.parts ?? []).map((p) => p.text || "").join("").trim();
          if (t) descricao = t;
        } catch {
        }
      }
      return { descricao, imagem: imageUrl };
    }
  });
  const criar_imagem = tool({
    description: "Gera imagem (Gemini grátis). Proporcoes: '3:4' (1080x1440), '4:5' (1080x1350), 'stories'/'9:16' (1080x1920), 'quadrado', 'paisagem', 'retrato'. Se pedirem TEXTO na imagem, inclua o texto exato entre aspas, em português correto. Só use a URL se ok:true; se ok:false, avise o erro em texto, sem imagem.",
    inputSchema: z.object({
      prompt: z.string().describe("Descrição em inglês; texto a aparecer na imagem entre aspas, em pt-BR correto."),
      proporcao: z.string().optional()
    }),
    execute: async ({ prompt, proporcao }) => {
      const raw = (proporcao ?? "retrato").toLowerCase().trim();
      const ratio = Object.hasOwn(RATIOS, raw) ? raw : "retrato";
      const gen = await generateImage(prompt, ratio);
      if (!gen.ok) {
        return { ok: false, error: gen.error };
      }
      const url = `/api/shot/${storeShot(gen.data ?? "", gen.mediaType)}`;
      return { ok: true, url, nota: "URL da imagem gerada." };
    }
  });
  const editar_video = tool({
    description: "Edita video com ffmpeg no PC do senhor (via bridge) e salva em Downloads. video = caminho no PC (ex: C:\\Users\\Administrador\\Downloads\\video.mp4). comando = opcoes ffmpeg depois de -i (ex: -ss 00:00:05 -t 10 -c copy).",
    inputSchema: z.object({
      video: z.string(),
      comando: z.string().describe("Opcoes ffmpeg depois de -i.")
    }),
    execute: async ({ video, comando }) => {
      try {
        return await editarVideoNoPc({ video, comando });
      } catch (e) {
        return { error: e instanceof Error ? e.message.slice(0, 300) : String(e) };
      }
    }
  });
  const integracoes_listar = tool({
    description: "Lista integrações (n8n, MCP) e suas ferramentas.",
    inputSchema: z.object({}),
    execute: async () => {
      const ints = listIntegrations().filter((x) => x.enabled);
      const out = [];
      for (const i of ints) {
        try {
          out.push({ id: i.id, nome: i.name, tipo: i.kind, ferramentas: await listarFerramentas(i) });
        } catch (e) {
          out.push({ id: i.id, erro: e instanceof Error ? e.message.slice(0, 150) : "falha" });
        }
      }
      return { integracoes: out };
    }
  });
  const integracao_chamar = tool({
    description: "Executa ferramenta de uma integração (descubra com integracoes_listar).",
    inputSchema: z.object({
      integracao: z.string(),
      ferramenta: z.string(),
      argumentos: z.record(z.string(), z.unknown()).optional()
    }),
    execute: async ({ integracao, ferramenta, argumentos }) => {
      const i = listIntegrations().find((x) => x.id === integracao || x.name === integracao);
      if (!i || !i.enabled) return { error: "Integração não encontrada/ativa." };
      try {
        return await executarFerramenta(i, ferramenta, argumentos ?? {});
      } catch (e) {
        return { error: e instanceof Error ? e.message.slice(0, 300) : String(e) };
      }
    }
  });
  return { web_search, get_datetime, fetch_url, run_js, shell_exec, fs_read, fs_write, fs_list, open_app, type_text, take_screenshot, criar_imagem, editar_video, integracoes_listar, integracao_chamar };
}
async function runTelegramAgent(msgs) {
  const hasImage = JSON.stringify(msgs).includes('"type":"image"');
  const model = createJarvisModel({ vision: hasImage });
  const system = buildSystem([], true, []) + "\n\nNo Telegram: responda curto, sem markdown pesado, e NUNCA cite nomes internos de ferramentas (ex: take_screenshot, fs_list, shell_exec). Descreva a ação em português. Se uma ferramenta falhar, diga o erro real; nunca afirme que enviou algo que não enviou.";
  const result = await generateWithFallback(
    model,
    (m) => generateText({
      model: m,
      maxRetries: 0,
      system,
      messages: msgs,
      tools: serverTools(null),
      stopWhen: stepCountIs(10),
      prepareStep: async ({ messages }) => ({ messages: stripReasoningParts(messages) })
    })
  );
  const text = result.text?.trim() || "Feito, senhor.";
  const imageUrls = [];
  const base = (process.env.TELEGRAM_PUBLIC_BASE || "https://jarvis-azul.vercel.app").replace(/\/$/, "");
  const bridgeBase = (process.env.BRIDGE_URL || "").replace(/\/$/, "");
  const bridgeHost = (() => {
    try {
      return bridgeBase ? new URL(bridgeBase).host : "";
    } catch {
      return "";
    }
  })();
  const pushUrl = (cand) => {
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
      }
    }
  };
  const re = /\/(api\/(?:image\?[^)\s]+|shot\/[A-Za-z0-9]+))/g;
  let mm;
  while (mm = re.exec(text)) pushUrl(mm[0]);
  try {
    const trs = result.toolResults ?? [];
    for (const tr of trs) {
      const out = tr?.output;
      if (typeof out?.url === "string") pushUrl(out.url);
      if (typeof out?.imagem === "string") pushUrl(out.imagem);
    }
  } catch {
  }
  return { text, imageUrls: imageUrls.slice(0, 3) };
}
const TG_HIST_MAX = 30;
const TG_CHATS_MAX = 50;
const tgKey = (chatId) => `tg:hist:${chatId}`;
const memFallback = /* @__PURE__ */ new Map();
function memGet(chatId) {
  return memFallback.get(tgKey(chatId)) ?? [];
}
function memSet(chatId, hist) {
  memFallback.set(tgKey(chatId), hist.slice(-TG_HIST_MAX));
  if (memFallback.size > TG_CHATS_MAX) {
    const first = memFallback.keys().next();
    if (!first.done) memFallback.delete(first.value);
  }
}
async function loadTgHistory(chatId) {
  try {
    const { kv } = await import("@vercel/kv");
    const raw = await kv.get(tgKey(chatId));
    if (Array.isArray(raw) && raw.length) {
      const clean = raw.filter((m) => m && (m.role === "user" || m.role === "assistant") && typeof m.content === "string").slice(-TG_HIST_MAX);
      memSet(chatId, clean);
      return clean;
    }
  } catch {
  }
  return memGet(chatId);
}
async function saveTgHistory(chatId, hist) {
  const clean = hist.slice(-TG_HIST_MAX);
  memSet(chatId, clean);
  try {
    const { kv } = await import("@vercel/kv");
    await kv.set(tgKey(chatId), clean, { ex: 60 * 60 * 24 * 30 });
  } catch {
  }
}
async function clearTgHistory(chatId) {
  memFallback.delete(tgKey(chatId));
  try {
    const { kv } = await import("@vercel/kv");
    await kv.del(tgKey(chatId));
  } catch {
  }
}
async function tryTelegramCommand(chatId, text) {
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
      "Comandos, senhor:\n/print — captura a tela do PC\n/bateria — nível da bateria\n/foto <descrição> [3:4|4:5|9:16|quadrado|paisagem|retrato] — gera imagem\n/voz <texto> — envia áudio\n/abrir <app> — abre no PC\n/cmd <comando> — executa no PC\n/hora — data e hora\n/skill — lista as skills\n/limpar — zera a conversa\nOu só converse (texto, foto, áudio)."
    );
    return true;
  }
  if (cmd === "/hora") {
    const s = new Intl.DateTimeFormat("pt-BR", {
      weekday: "long",
      day: "numeric",
      month: "long",
      hour: "2-digit",
      minute: "2-digit",
      timeZone: "America/Sao_Paulo"
    }).format(/* @__PURE__ */ new Date());
    await tgSend(chatId, `Agora: ${s} (São Paulo).`);
    return true;
  }
  if (cmd === "/print" || cmd === "/screenshot" || cmd === "/tela") {
    await tgSend(chatId, "Capturando a tela, senhor...");
    try {
      const j = await bridgeCall("/screenshot", {}, 45e3);
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
      const j = await bridgeCall("/shell", {
        cmd: "Get-CimInstance Win32_Battery | Select-Object EstimatedChargeRemaining,BatteryStatus | ConvertTo-Json -Compress",
        timeout: 20
      }, 3e4);
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
      const { listSkills } = await import("./video.server-C5PlGzKx.js").then((n) => n.j);
      const all = listSkills();
      if (!all.length) {
        await tgSend(chatId, "Nenhuma skill cadastrada, senhor. Crie na web.");
        return true;
      }
      const lines = all.slice(0, 20).map((s) => `• ${s.name} (${s.id})`);
      await tgSend(chatId, `Skills, senhor:
${lines.join("\n")}

Ative/desative na web.`);
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
    let ratio = "retrato";
    let prompt = args;
    const parts = args.split(/\s+/);
    const last = (parts[parts.length - 1] || "").toLowerCase();
    if (last && Object.hasOwn(RATIOS, last)) {
      ratio = last;
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
      await bridgeCall("/open", { target: args }, 3e4);
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
      const j = await bridgeCall("/shell", { cmd: args, timeout: 60 }, 9e4);
      if (j?.error) {
        await tgSend(chatId, `Erro, senhor: ${String(j.error).slice(0, 500)}.`);
        return true;
      }
      const out = `exit=${j?.exit ?? "?"}
${j?.stdout || ""}${j?.stderr ? `
[stderr]
${j.stderr}` : ""}`.trim();
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
const Route$4 = createFileRoute("/api/telegram-webhook")({
  server: {
    handlers: {
      POST: async ({ request }) => {
        const secret = process.env.TELEGRAM_WEBHOOK_SECRET || "";
        if (secret) {
          const got = request.headers.get("x-telegram-bot-api-secret-token") || "";
          if (got !== secret) return new Response("Forbidden", { status: 403 });
        }
        let update = null;
        try {
          update = await request.json();
        } catch {
          return new Response("Bad Request", { status: 400 });
        }
        const chatIdRaw = update?.message?.chat?.id;
        if (chatIdRaw === void 0 || chatIdRaw === null) return new Response("OK");
        const chatId = String(chatIdRaw);
        const allowed = (process.env.TELEGRAM_ALLOWED_CHAT_ID || "").trim();
        if (allowed && chatId !== allowed) {
          console.warn(`[telegram] chat bloqueado: ${chatId}`);
          return new Response("OK");
        }
        try {
          await handleMessage(update.message, chatId);
        } catch (e) {
          console.error("[telegram]", e instanceof Error ? e.message.slice(0, 300) : e);
          try {
            await tgSend(chatId, "Falha momentânea, senhor. Tente de novo.");
          } catch {
          }
        }
        return new Response("OK");
      }
    }
  }
});
async function sendReply(chatId, reply, imageUrls) {
  const clean = reply.replace(/!\[([^\]]*)\]\(([^)]+)\)/g, "$1").trim();
  for (const u of imageUrls.slice(0, 3)) {
    const ok = await tgPhoto(chatId, u, "");
    if (!ok) break;
  }
  if (clean) await tgSend(chatId, clean);
}
async function handleMessage(msg, chatId) {
  const text = (msg.text || "").trim();
  if (text.startsWith("/")) {
    await tryTelegramCommand(chatId, text);
    return;
  }
  if (msg.voice?.file_id) {
    const fileUrl = await tgFileUrl(String(msg.voice.file_id));
    if (!fileUrl) {
      await tgSend(chatId, "Não consegui baixar o áudio, senhor.");
      return;
    }
    const transcript = await transcribeVoice(fileUrl);
    if (!transcript) {
      await tgSend(chatId, "Não consegui transcrever o áudio, senhor.");
      return;
    }
    const hist = await loadTgHistory(chatId);
    const { text: reply, imageUrls } = await runTelegramAgent([
      ...hist,
      { role: "user", content: `O senhor disse por voz: ${transcript}` }
    ]);
    await sendReply(chatId, reply, imageUrls);
    await sendTtsAudio(chatId, reply);
    await saveTgHistory(chatId, [
      ...hist,
      { role: "user", content: `(voz) ${transcript}` },
      { role: "assistant", content: reply }
    ]);
    return;
  }
  if (Array.isArray(msg.photo) && msg.photo.length) {
    const best = msg.photo[msg.photo.length - 1];
    if (!best?.file_id) {
      await tgSend(chatId, "Não consegui ler a foto, senhor.");
      return;
    }
    const fileUrl = await tgFileUrl(String(best.file_id));
    const caption = (msg.caption || "").trim() || "Descreva esta imagem em português.";
    if (!fileUrl) {
      await tgSend(chatId, "Não consegui baixar a foto, senhor.");
      return;
    }
    const dl = await urlToDataUrl(fileUrl);
    if (!dl) {
      await tgSend(chatId, "Não consegui ler a foto, senhor.");
      return;
    }
    const dataUrl = `data:${dl.mediaType};base64,${dl.data}`;
    const hist = await loadTgHistory(chatId);
    const msgs = [
      ...hist,
      {
        role: "user",
        content: [
          { type: "text", text: caption },
          { type: "image", image: dataUrl }
        ]
      }
    ];
    const { text: reply, imageUrls } = await runTelegramAgent(msgs);
    await sendReply(chatId, reply, imageUrls);
    await saveTgHistory(chatId, [...hist, { role: "user", content: `[foto] ${caption}` }, { role: "assistant", content: reply }]);
    return;
  }
  if (text) {
    const hist = await loadTgHistory(chatId);
    const { text: reply, imageUrls } = await runTelegramAgent([...hist, { role: "user", content: text }]);
    await sendReply(chatId, reply, imageUrls);
    await saveTgHistory(chatId, [...hist, { role: "user", content: text }, { role: "assistant", content: reply }]);
    return;
  }
  await tgSend(chatId, "Envie texto, foto ou áudio, senhor.");
}
const BRIDGE_URL = (process.env.BRIDGE_URL || "").replace(/\/$/, "");
const BRIDGE_TOKEN = process.env.BRIDGE_TOKEN || process.env.JARVIS_TOKEN || "";
const GEMINI_KEY = process.env.GEMINI_API_KEY || "";
const GEMINI_TTS_MODEL = process.env.GEMINI_TTS_MODEL || "gemini-2.5-flash-preview-tts";
const GEMINI_TTS_VOICE = process.env.GEMINI_TTS_VOICE || "Charon";
async function bridgeSpeak(text) {
  if (!BRIDGE_URL || !BRIDGE_TOKEN) return null;
  const prev = process.env.NODE_TLS_REJECT_UNAUTHORIZED;
  process.env.NODE_TLS_REJECT_UNAUTHORIZED = "0";
  try {
    const res = await fetch(`${BRIDGE_URL}/speak`, {
      method: "POST",
      headers: { "Content-Type": "application/json", Authorization: `Bearer ${BRIDGE_TOKEN}` },
      body: JSON.stringify({ text: text.slice(0, 800) }),
      signal: AbortSignal.timeout(45e3)
    });
    if (!res.ok) return null;
    const buf = await res.arrayBuffer();
    return buf.byteLength > 0 ? buf : null;
  } catch {
    return null;
  } finally {
    if (prev === void 0) delete process.env.NODE_TLS_REJECT_UNAUTHORIZED;
    else process.env.NODE_TLS_REJECT_UNAUTHORIZED = prev;
  }
}
function pcmToWav(pcm, sampleRate) {
  const dataSize = pcm.length;
  const header = Buffer.alloc(44);
  header.write("RIFF", 0);
  header.writeUInt32LE(36 + dataSize, 4);
  header.write("WAVE", 8);
  header.write("fmt ", 12);
  header.writeUInt32LE(16, 16);
  header.writeUInt16LE(1, 20);
  header.writeUInt16LE(1, 22);
  header.writeUInt32LE(sampleRate, 24);
  header.writeUInt32LE(sampleRate * 2, 28);
  header.writeUInt16LE(2, 32);
  header.writeUInt16LE(16, 34);
  header.write("data", 36);
  header.writeUInt32LE(dataSize, 40);
  return Buffer.concat([header, pcm]);
}
async function geminiTts(text) {
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
            speechConfig: { voiceConfig: { prebuiltVoiceConfig: { voiceName: GEMINI_TTS_VOICE } } }
          }
        }),
        signal: AbortSignal.timeout(45e3)
      }
    );
    if (!res.ok) return null;
    const j = await res.json();
    const inline = j.candidates?.[0]?.content?.parts?.find((p) => p.inlineData?.data)?.inlineData;
    if (!inline?.data) return null;
    const raw = Buffer.from(inline.data, "base64");
    const mimeType = inline.mimeType || "";
    if (mimeType.includes("pcm") || mimeType.includes("L16")) {
      const m = /rate=(\d+)/.exec(mimeType);
      const rate = m ? parseInt(m[1], 10) : 24e3;
      return pcmToWav(raw, rate).buffer;
    }
    return raw.buffer;
  } catch {
    return null;
  }
}
async function googleTts(text) {
  try {
    const upstream = `https://translate.google.com/translate_tts?ie=UTF-8&client=tw-ob&tl=pt-BR&q=${encodeURIComponent(text)}`;
    const res = await fetch(upstream, {
      headers: { "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36" },
      signal: AbortSignal.timeout(3e4)
    });
    if (!res.ok) return null;
    const buf = await res.arrayBuffer();
    return buf.byteLength > 0 ? buf : null;
  } catch {
    return null;
  }
}
const Route$3 = createFileRoute("/api/tts")({
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
            const j = await request.json();
            text = String(j.text || "");
          } else {
            text = await request.text();
          }
        } catch {
          text = "";
        }
        return renderTts(text.trim());
      }
    }
  }
});
async function renderTts(text) {
  if (!text) return new Response("Missing text", { status: 400 });
  const viaBridge = await bridgeSpeak(text);
  if (viaBridge) {
    return new Response(viaBridge, {
      headers: { "Content-Type": "audio/mpeg", "Cache-Control": "public, max-age=3600" }
    });
  }
  const viaGemini = await geminiTts(text);
  if (viaGemini) {
    return new Response(viaGemini, {
      headers: { "Content-Type": "audio/wav", "Cache-Control": "public, max-age=3600" }
    });
  }
  const viaGoogle = await googleTts(text);
  if (viaGoogle) {
    return new Response(viaGoogle, {
      headers: { "Content-Type": "audio/mpeg", "Cache-Control": "public, max-age=86400" }
    });
  }
  return new Response("TTS unavailable", { status: 502 });
}
const MAX_BYTES = 44e5;
const Route$2 = createFileRoute("/api/upload")({
  server: {
    handlers: {
      POST: async ({ request }) => {
        const bytes = new Uint8Array(await request.arrayBuffer());
        if (!bytes.length) {
          return Response.json({ error: "Corpo vazio." }, { status: 400 });
        }
        if (bytes.length > MAX_BYTES) {
          return Response.json({ error: "Arquivo maior que 4.4MB; informe o caminho no PC." }, { status: 413 });
        }
        const ct = (request.headers.get("content-type") || "video/mp4").split(";")[0].trim();
        const mediaType = /^video\//i.test(ct) ? ct : ct === "application/octet-stream" ? "video/mp4" : ct;
        const key = storeVideo(Buffer.from(bytes).toString("base64"), mediaType);
        return Response.json({ url: `/api/video/${key}`, mediaType });
      }
    }
  }
});
const Route$1 = createFileRoute("/api/shot/$key")({
  server: {
    handlers: {
      GET: async ({ request }) => {
        const url = new URL(request.url);
        const key = (url.pathname.split("/").pop() || "").trim();
        const shot = key ? getShot(key) : null;
        if (!shot) {
          const svg = `<svg xmlns="http://www.w3.org/2000/svg" width="960" height="540"><rect width="100%" height="100%" fill="#0a0f1e"/><text x="50%" y="47%" fill="#7dd3fc" font-family="monospace" font-size="32" text-anchor="middle">Imagem expirada, senhor.</text><text x="50%" y="55%" fill="#94a3b8" font-family="monospace" font-size="22" text-anchor="middle">Peça de novo, por favor.</text></svg>`;
          return new Response(svg, {
            headers: { "Content-Type": "image/svg+xml", "Cache-Control": "no-store" }
          });
        }
        const bytes = Buffer.from(shot.data, "base64");
        return new Response(new Uint8Array(bytes), {
          headers: {
            "Content-Type": shot.mediaType,
            "Content-Length": String(bytes.length),
            "Cache-Control": "public, max-age=300"
          }
        });
      }
    }
  }
});
const Route = createFileRoute("/api/video/$key")({
  server: {
    handlers: {
      GET: async ({ request }) => {
        const url = new URL(request.url);
        const key = (url.pathname.split("/").pop() || "").trim();
        const video = key ? getVideo(key) : null;
        if (!video) {
          return new Response("Video expirado ou inexistente, senhor.", {
            status: 404,
            headers: { "Content-Type": "text/plain; charset=utf-8", "Cache-Control": "no-store" }
          });
        }
        const bytes = Buffer.from(video.data, "base64");
        return new Response(new Uint8Array(bytes), {
          headers: {
            "Content-Type": video.mediaType,
            "Content-Length": String(bytes.length),
            "Cache-Control": "public, max-age=600"
          }
        });
      }
    }
  }
});
const IndexRoute = Route$7.update({
  id: "/",
  path: "/",
  getParentRoute: () => Route$8
});
const ApiDiagBridgeRoute = Route$6.update({
  id: "/api/diag-bridge",
  path: "/api/diag-bridge",
  getParentRoute: () => Route$8
});
const ApiImageRoute = Route$5.update({
  id: "/api/image",
  path: "/api/image",
  getParentRoute: () => Route$8
});
const ApiTelegramWebhookRoute = Route$4.update({
  id: "/api/telegram-webhook",
  path: "/api/telegram-webhook",
  getParentRoute: () => Route$8
});
const ApiTtsRoute = Route$3.update({
  id: "/api/tts",
  path: "/api/tts",
  getParentRoute: () => Route$8
});
const ApiUploadRoute = Route$2.update({
  id: "/api/upload",
  path: "/api/upload",
  getParentRoute: () => Route$8
});
const ApiShotKeyRoute = Route$1.update({
  id: "/api/shot/$key",
  path: "/api/shot/$key",
  getParentRoute: () => Route$8
});
const ApiVideoKeyRoute = Route.update({
  id: "/api/video/$key",
  path: "/api/video/$key",
  getParentRoute: () => Route$8
});
const rootRouteChildren = {
  IndexRoute,
  ApiDiagBridgeRoute,
  ApiImageRoute,
  ApiTelegramWebhookRoute,
  ApiTtsRoute,
  ApiUploadRoute,
  ApiShotKeyRoute,
  ApiVideoKeyRoute
};
const routeTree = Route$8._addFileChildren(rootRouteChildren)._addFileTypes();
const getRouter = () => {
  const queryClient = new QueryClient();
  const router2 = createRouter({
    routeTree,
    context: { queryClient },
    scrollRestoration: true,
    defaultPreloadStaleTime: 0
  });
  return router2;
};
const router = /* @__PURE__ */ Object.freeze(/* @__PURE__ */ Object.defineProperty({
  __proto__: null,
  getRouter
}, Symbol.toStringTag, { value: "Module" }));
export {
  askJarvis as a,
  createSkillFn as b,
  createSsrRpc as c,
  extractMemories as e,
  listSkillsFn as l,
  router as r
};
