import { c as createServerRpc } from "./createServerRpc-DZP3RpqE.js";
import { c as createServerFn } from "./server-CJhJqHaa.js";
import { tool, generateText, stepCountIs } from "ai";
import { z } from "zod";
import { appendFileSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { l as listSkills, i as createSkill, c as createJarvisModel, s as storeShot, g as generateImage, e as editarVideoNoPc, a as generateWithFallback, R as RATIOS, b as buildSkillsPrompt } from "./video.server-C5PlGzKx.js";
import { l as listIntegrations, a as listarFerramentas, e as executarFerramenta } from "./integrations.server-faX8O44t.js";
import "node:async_hooks";
import "h3-v2";
import "@tanstack/router-core";
import "@tanstack/router-core/ssr/client";
import "@tanstack/router-core/ssr/server";
import "seroval";
import "@tanstack/history";
import "react";
import "@tanstack/react-router";
import "react/jsx-runtime";
import "@tanstack/react-router/ssr/server";
import "@ai-sdk/openai-compatible";
import "@ai-sdk/google";
const listSkillsFn_createServerFn_handler = createServerRpc({
  id: "435422c82f628d9cc6654b02332061c8c8b41221fec125887652d398022fd56c",
  name: "listSkillsFn",
  filename: "src/lib/jarvis.functions.ts"
}, (opts) => listSkillsFn.__executeServer(opts));
const listSkillsFn = createServerFn({
  method: "GET"
}).handler(listSkillsFn_createServerFn_handler, () => listSkills());
const CreateSkillSchema = z.object({
  id: z.string().min(1).max(64),
  name: z.string().min(1).max(80),
  instructions: z.string().min(1).max(4e3)
});
const createSkillFn_createServerFn_handler = createServerRpc({
  id: "d2f5b85b9c2a0a74b70208b7fde9889b59d87d4d1cc85b88862f3d131705e4a8",
  name: "createSkillFn",
  filename: "src/lib/jarvis.functions.ts"
}, (opts) => createSkillFn.__executeServer(opts));
const createSkillFn = createServerFn({
  method: "POST"
}).inputValidator((data) => CreateSkillSchema.parse(data)).handler(createSkillFn_createServerFn_handler, ({
  data
}) => createSkill(data.id, data.name, data.instructions));
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
const CLIENT_TOOL_NAMES = /* @__PURE__ */ new Set(["shell_exec", "fs_read", "image_view", "fs_write", "fs_list", "open_app", "type_text"]);
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
  const bridgeLine = hasBridge ? "Bridge local: CONECTADA. As ferramentas shell_exec/fs_* estão operacionais na máquina do senhor." : "Bridge local: OFFLINE. As ferramentas shell_exec/fs_* NÃO funcionam agora — não tente usá-las; peça ao senhor para rodar 'python3 agent/jarvis_agent.py' se ele precisar.";
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
function trimHistory(messages) {
  const arr = Array.isArray(messages) ? messages : [];
  let t = arr.slice(-80);
  for (let guard = 0; guard < 5 && t.length > 1; guard++) {
    const first = t[0];
    if (!first || typeof first !== "object") break;
    if (first.role === "tool") {
      t = t.slice(1);
      continue;
    }
    if (first.role === "assistant" && Array.isArray(first.content)) {
      const parts = first.content;
      const allCalls = parts.length > 0 && parts.every((p) => !!p && (p.type === "tool-call" || p.type === "tool-result"));
      if (allCalls) {
        t = t.slice(1);
        continue;
      }
    }
    break;
  }
  return t;
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
function messagesHaveImage(messages) {
  try {
    const s = JSON.stringify(messages ?? []);
    return s.includes('"type":"image"') || s.includes('"image_url"') || s.includes('"type":"file"');
  } catch {
    return false;
  }
}
const askJarvis_createServerFn_handler = createServerRpc({
  id: "72368ad932d1b3818ead6d9315c53ca2e5a2c859fd408307c33f538b0bf1680a",
  name: "askJarvis",
  filename: "src/lib/jarvis.functions.ts"
}, (opts) => askJarvis.__executeServer(opts));
const askJarvis = createServerFn({
  method: "POST"
}).inputValidator((data) => InputSchema.parse(data)).handler(askJarvis_createServerFn_handler, async ({
  data
}) => {
  const model = createJarvisModel({
    vision: messagesHaveImage(data.messages)
  });
  const trimmedMessages = trimHistory(data.messages);
  const web_search = tool({
    description: "Busca web em tempo real via DuckDuckGo. Use para notícias, cotações, clima, esportes, eventos recentes. Retorna até 5 resultados.",
    inputSchema: z.object({
      query: z.string().describe("Consulta otimizada.")
    }),
    execute: async ({
      query
    }) => {
      try {
        const results = await duckDuckGoSearch(query, 5);
        return results.length ? {
          results
        } : {
          results: [],
          note: "Nenhum resultado."
        };
      } catch (e) {
        return {
          results: [],
          error: e instanceof Error ? e.message : "Falha na busca."
        };
      }
    }
  });
  const get_datetime = tool({
    description: "Data e hora atuais. Use SEMPRE o campo sao_paulo (dia e hora corretos para o usuário). O campo iso_utc é apenas referência técnica e pode indicar outro dia por causa do fuso horário.",
    inputSchema: z.object({}),
    execute: async () => {
      const now = /* @__PURE__ */ new Date();
      return {
        iso_utc: now.toISOString(),
        sao_paulo: new Intl.DateTimeFormat("pt-BR", {
          weekday: "long",
          year: "numeric",
          month: "long",
          day: "numeric",
          hour: "2-digit",
          minute: "2-digit",
          second: "2-digit",
          timeZone: "America/Sao_Paulo"
        }).format(now),
        unix: Math.floor(now.getTime() / 1e3)
      };
    }
  });
  const fetch_url = tool({
    description: "Baixa o conteúdo textual de uma URL http/https. HTML é convertido para texto. Máx ~15 KB.",
    inputSchema: z.object({
      url: z.string().url()
    }),
    execute: async ({
      url
    }) => {
      try {
        const res = await fetch(url, {
          headers: {
            "User-Agent": "Mozilla/5.0 (JarvisBot)",
            Accept: "text/html,application/json,text/plain,*/*",
            "Accept-Language": "pt-BR,pt;q=0.9,en;q=0.8"
          }
        });
        const ct = res.headers.get("content-type") ?? "";
        const raw = await res.text();
        let body = raw;
        if (ct.includes("html")) {
          body = raw.replace(/<script[\s\S]*?<\/script>/gi, "").replace(/<style[\s\S]*?<\/style>/gi, "").replace(/<[^>]+>/g, " ").replace(/&nbsp;/g, " ").replace(/&amp;/g, "&").replace(/&lt;/g, "<").replace(/&gt;/g, ">").replace(/&quot;/g, '"').replace(/&#39;/g, "'").replace(/\s+/g, " ").trim();
        }
        return {
          status: res.status,
          contentType: ct,
          body: body.slice(0, 15e3)
        };
      } catch (e) {
        return {
          error: e instanceof Error ? e.message : "Falha ao buscar URL."
        };
      }
    }
  });
  const run_js = tool({
    description: "Executa uma expressão ou bloco JavaScript no servidor. Sem rede, sem fs. Timeout 2s.",
    inputSchema: z.object({
      code: z.string()
    }),
    execute: async ({
      code
    }) => {
      try {
        const src = code.includes("return ") ? code : `return (${code});`;
        const fn = new Function(`"use strict"; ${src}`);
        const timeoutPromise = new Promise((_, reject) => setTimeout(() => reject(new Error("Timeout 2s")), 2e3));
        const result = await Promise.race([Promise.resolve().then(() => fn()), timeoutPromise]);
        let serialized = result;
        try {
          JSON.stringify(result);
        } catch {
          serialized = String(result);
        }
        return {
          result: serialized
        };
      } catch (e) {
        return {
          error: e instanceof Error ? e.message : String(e)
        };
      }
    }
  });
  const shell_exec = tool({
    description: "Executa um comando shell na máquina do usuário via bridge local. Retorna {exit, stdout, stderr, cwd}. Peça confirmação antes de comandos destrutivos.",
    inputSchema: z.object({
      cmd: z.string().describe("Comando completo, ex: 'ls -la ~/Downloads'."),
      cwd: z.string().optional().describe("Diretório de trabalho absoluto."),
      timeout: z.number().optional().describe("Timeout em segundos (default 30, máx 300).")
    })
  });
  const fs_read = tool({
    description: "Lê um arquivo do disco do usuário via bridge local.",
    inputSchema: z.object({
      path: z.string()
    })
  });
  const image_view = tool({
    description: "Abre uma imagem do disco do usuário para análise visual. O retorno é conteúdo de mídia, não texto; use quando o senhor pedir para ver ou analisar uma imagem.",
    inputSchema: z.object({
      path: z.string().describe("Caminho absoluto da imagem")
    })
  });
  const fs_write = tool({
    description: "Escreve conteúdo em um arquivo no disco do usuário. append=true para anexar.",
    inputSchema: z.object({
      path: z.string(),
      content: z.string(),
      append: z.boolean().optional()
    })
  });
  const fs_list = tool({
    description: "Lista o conteúdo de um diretório na máquina do usuário.",
    inputSchema: z.object({
      path: z.string()
    })
  });
  const open_app = tool({
    description: "Abre um aplicativo, arquivo ou URL na máquina do usuário. Use para 'abra a calculadora', 'abra o Spotify', 'abra o YouTube'.",
    inputSchema: z.object({
      target: z.string().describe("Nome do app (ex: 'calc', 'notepad', 'Spotify'), caminho de arquivo, ou URL http(s)."),
      args: z.array(z.string()).optional().describe("Argumentos extras, opcional.")
    })
  });
  const type_text = tool({
    description: "Digita texto no PC do usuario (teclado virtual): foca uma janela pelo titulo e digita. Use para 'digite X no Claude', preencher campos, etc. O PC precisa estar desbloqueado.",
    inputSchema: z.object({
      text: z.string().describe("Texto a digitar (ate 2000 caracteres)."),
      window: z.string().optional().describe("Parte do titulo da janela para focar antes (ex: 'Claude', 'Chrome'). Se omitido, digita onde o foco estiver.")
    })
  });
  const take_screenshot = tool({
    description: "Tira um print da tela do PC (via bridge — funciona de qualquer aparelho, ate celular) e DESCREVE o que ve em portugues. Use quando o senhor pedir para ver a tela, conferir a interface, ou apos acoes visiveis. Retorna {descricao, imagem}. Na resposta final, mostre a imagem com markdown: ![tela](imagem).",
    inputSchema: z.object({}),
    execute: async () => {
      const bridgeUrl = (process.env.BRIDGE_URL || "").replace(/\/$/, "");
      const bridgeToken = process.env.BRIDGE_TOKEN || process.env.JARVIS_TOKEN || "";
      if (!bridgeUrl || !bridgeToken) {
        return {
          erro: "Bridge nao configurada no servidor (BRIDGE_URL/BRIDGE_TOKEN)."
        };
      }
      let shot = null;
      let lastErr = "";
      for (let attempt = 1; attempt <= 3 && !shot; attempt++) {
        if (attempt > 1) await new Promise((r) => setTimeout(r, 1500 * (attempt - 1)));
        const prevTls = process.env.NODE_TLS_REJECT_UNAUTHORIZED;
        process.env.NODE_TLS_REJECT_UNAUTHORIZED = "0";
        try {
          const res = await fetch(`${bridgeUrl}/screenshot`, {
            method: "POST",
            headers: {
              "Content-Type": "application/json",
              Authorization: `Bearer ${bridgeToken}`
            },
            body: JSON.stringify({}),
            signal: AbortSignal.timeout(45e3)
          });
          if (!res.ok) {
            lastErr = `Bridge HTTP ${res.status}.`;
            continue;
          }
          const j = await res.json();
          if (j?.ok && j.data) shot = {
            data: j.data,
            mediaType: j.mediaType || "image/jpeg",
            fileId: j.fileId || ""
          };
          else lastErr = j?.error || "Captura vazia.";
        } catch (e) {
          lastErr = e instanceof Error ? e.message.slice(0, 300) : "falha na captura";
        } finally {
          if (prevTls === void 0) delete process.env.NODE_TLS_REJECT_UNAUTHORIZED;
          else process.env.NODE_TLS_REJECT_UNAUTHORIZED = prevTls;
        }
      }
      if (!shot) return {
        erro: `Captura falhou apos 3 tentativas: ${lastErr}`
      };
      const imageUrl = shot.fileId ? `${bridgeUrl}/shot/${shot.fileId}` : `/api/shot/${storeShot(shot.data, shot.mediaType)}`;
      let descricao = "";
      const gemKey = process.env.GEMINI_API_KEY;
      if (gemKey) {
        try {
          const vr = await fetch(`https://generativelanguage.googleapis.com/v1beta/models/${process.env.GEMINI_VISION_MODEL ?? "gemini-3.1-flash-lite"}:generateContent?key=${gemKey}`, {
            method: "POST",
            headers: {
              "Content-Type": "application/json"
            },
            body: JSON.stringify({
              contents: [{
                parts: [{
                  text: "Descreva em portugues o que aparece nesta captura de tela. Seja especifico: janelas, textos, botoes, cores, erros visiveis."
                }, {
                  inlineData: {
                    data: shot.data,
                    mimeType: shot.mediaType
                  }
                }]
              }]
            }),
            signal: AbortSignal.timeout(45e3)
          });
          const vj = await vr.json();
          descricao = (vj.candidates?.[0]?.content?.parts ?? []).map((p) => p.text || "").join("").trim();
        } catch {
        }
      }
      return {
        descricao: descricao || "(capturada, mas nao foi possivel descrever agora)",
        imagem: imageUrl
      };
    }
  });
  const open_and_view = tool({
    description: "Abre um aplicativo, arquivo ou URL no PC, espera abrir, tira print e DESCREVE a tela em português. USE SEMPRE quando pedirem para abrir E ver/ler/mostrar algo (faz tudo de uma vez — mais rápido que open_app + take_screenshot separados). Retorna {aberto, descricao, imagem}. Na resposta final, mostre a imagem com markdown: ![tela](imagem).",
    inputSchema: z.object({
      target: z.string().describe("Nome do app (ex: 'Spotify', 'notepad', 'calc'), caminho de arquivo, ou URL http(s).")
    }),
    execute: async ({
      target
    }) => {
      const bridgeUrl = (process.env.BRIDGE_URL || "").replace(/\/$/, "");
      const bridgeToken = process.env.BRIDGE_TOKEN || process.env.JARVIS_TOKEN || "";
      if (!bridgeUrl || !bridgeToken) {
        return {
          erro: "Bridge nao configurada no servidor (BRIDGE_URL/BRIDGE_TOKEN)."
        };
      }
      const prevTls = process.env.NODE_TLS_REJECT_UNAUTHORIZED;
      process.env.NODE_TLS_REJECT_UNAUTHORIZED = "0";
      try {
        const ores = await fetch(`${bridgeUrl}/open`, {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${bridgeToken}`
          },
          body: JSON.stringify({
            target
          }),
          signal: AbortSignal.timeout(3e4)
        });
        if (!ores.ok) return {
          erro: `Abrir falhou: Bridge HTTP ${ores.status}.`
        };
        await new Promise((r) => setTimeout(r, 3e3));
        let shot = null;
        let lastErr = "";
        for (let attempt = 1; attempt <= 2 && !shot; attempt++) {
          if (attempt > 1) await new Promise((r) => setTimeout(r, 1500));
          try {
            const sres = await fetch(`${bridgeUrl}/screenshot`, {
              method: "POST",
              headers: {
                "Content-Type": "application/json",
                Authorization: `Bearer ${bridgeToken}`
              },
              body: JSON.stringify({}),
              signal: AbortSignal.timeout(45e3)
            });
            if (!sres.ok) {
              lastErr = `Bridge HTTP ${sres.status}.`;
              continue;
            }
            const j = await sres.json();
            if (j?.ok && j.data) shot = {
              data: j.data,
              mediaType: j.mediaType || "image/jpeg",
              fileId: j.fileId || ""
            };
            else lastErr = j?.error || "Captura vazia.";
          } catch (e) {
            lastErr = e instanceof Error ? e.message.slice(0, 200) : "falha";
          }
        }
        if (!shot) return {
          aberto: true,
          erro: `Abriu, mas a captura falhou: ${lastErr}`
        };
        const imageUrl = shot.fileId ? `${bridgeUrl}/shot/${shot.fileId}` : `/api/shot/${storeShot(shot.data, shot.mediaType)}`;
        let descricao = "";
        const gemKey = process.env.GEMINI_API_KEY;
        if (gemKey) {
          try {
            const vr = await fetch(`https://generativelanguage.googleapis.com/v1beta/models/${process.env.GEMINI_VISION_MODEL ?? "gemini-3.1-flash-lite"}:generateContent?key=${gemKey}`, {
              method: "POST",
              headers: {
                "Content-Type": "application/json"
              },
              body: JSON.stringify({
                contents: [{
                  parts: [{
                    text: "Descreva em portugues o que aparece nesta captura de tela. Seja especifico: janelas, textos, botoes, cores."
                  }, {
                    inlineData: {
                      data: shot.data,
                      mimeType: shot.mediaType
                    }
                  }]
                }]
              }),
              signal: AbortSignal.timeout(45e3)
            });
            const vj = await vr.json();
            descricao = (vj.candidates?.[0]?.content?.parts ?? []).map((p) => p.text || "").join("").trim();
          } catch {
          }
        }
        return {
          aberto: true,
          descricao: descricao || "(aberto; veja a imagem)",
          imagem: imageUrl
        };
      } catch (e) {
        return {
          erro: e instanceof Error ? e.message.slice(0, 300) : "falha"
        };
      } finally {
        if (prevTls === void 0) delete process.env.NODE_TLS_REJECT_UNAUTHORIZED;
        else process.env.NODE_TLS_REJECT_UNAUTHORIZED = prevTls;
      }
    }
  });
  const criar_imagem = tool({
    description: "Gera uma imagem com o Gemini (Nano Banana, gratuito) e mostra no chat. Use quando pedirem para criar, gerar, desenhar ou ilustrar algo. Escolha a proporcao exatamente como o senhor pediu: '3:4' (1080x1440), '4:5' (1080x1350), 'stories' ou '9:16' (1080x1920), 'quadrado' (1024x1024), 'paisagem' (1280x720) ou 'retrato' (1024x1280). Se o senhor quiser TEXTO dentro da imagem, inclua o texto exato entre aspas no prompt, em português e com a ortografia correta. IMPORTANTE: só cole a URL como ![imagem gerada](url) se o resultado vier com ok:true. Se vier ok:false, NÃO cole imagem nenhuma — diga o erro em texto.",
    inputSchema: z.object({
      prompt: z.string().describe("Descrição detalhada em inglês: assunto, estilo, iluminação, composição, cores."),
      proporcao: z.string().optional().describe("Proporção: '3:4', '4:5', 'stories'/'9:16', 'quadrado', 'paisagem' ou 'retrato'. Padrão: retrato.")
    }),
    execute: async ({
      prompt,
      proporcao
    }) => {
      const raw = (proporcao ?? "retrato").toLowerCase().trim();
      const ratio = Object.hasOwn(RATIOS, raw) ? raw : "retrato";
      const gen = await generateImage(prompt, ratio);
      if (!gen.ok) {
        return {
          ok: false,
          error: gen.error
        };
      }
      const url = `/api/shot/${storeShot(gen.data ?? "", gen.mediaType)}`;
      return {
        ok: true,
        url,
        nota: "Cole esta URL como markdown ![imagem gerada](url) na resposta."
      };
    }
  });
  const editar_video = tool({
    description: "Edita um video com ffmpeg no PC do senhor (via bridge) e devolve o video no chat + salva em Downloads. Parametro video: a URL '/api/video/...' que aparece no texto do anexo, ou um caminho no PC (ex: C:\\Users\\Administrador\\Downloads\\video.mp4). Parametro comando: opcoes ffmpeg que vem DEPOIS de -i (ex: '-ss 00:00:05 -t 10 -c copy' corta 10s; '-vf scale=1080:1920,c:v=libx264' redimensiona; '-vn' extrai audio). Na resposta final mostre o video como markdown [video editado](url).",
    inputSchema: z.object({
      video: z.string().describe("URL /api/video/<key> do anexo OU caminho do arquivo no PC."),
      comando: z.string().describe("Opcoes ffmpeg depois de -i (ex: '-ss 00:00:05 -t 10 -c copy').")
    }),
    execute: async ({
      video,
      comando
    }) => editarVideoNoPc({
      video,
      comando
    })
  });
  const integracoes_listar = tool({
    description: "Lista as integrações conectadas (MCP, n8n, webhooks) e as ferramentas que cada uma oferece. Use antes de chamar integracao_chamar.",
    inputSchema: z.object({}),
    execute: async () => {
      const ints = listIntegrations().filter((x) => x.enabled);
      const out = [];
      for (const i of ints) {
        try {
          const ferramentas = await listarFerramentas(i);
          out.push({
            id: i.id,
            nome: i.name,
            tipo: i.kind,
            ferramentas
          });
        } catch (e) {
          out.push({
            id: i.id,
            nome: i.name,
            tipo: i.kind,
            erro: e instanceof Error ? e.message.slice(0, 200) : "falha"
          });
        }
      }
      return {
        integracoes: out.length ? out : [],
        nota: out.length ? void 0 : "Nenhuma integração configurada."
      };
    }
  });
  const integracao_chamar = tool({
    description: "Executa uma ferramenta de uma integração conectada. Descubra ids e ferramentas com integracoes_listar.",
    inputSchema: z.object({
      integracao: z.string().describe("id da integração (ex: 'n8n', 'meu-servidor-mcp')"),
      ferramenta: z.string().describe("nome da ferramenta (ex: 'disparar_webhook', 'listar_workflows')"),
      argumentos: z.record(z.string(), z.unknown()).optional().describe("argumentos da ferramenta")
    }),
    execute: async ({
      integracao,
      ferramenta,
      argumentos
    }) => {
      const i = listIntegrations().find((x) => x.id === integracao || x.name === integracao);
      if (!i) return {
        error: "Integração não encontrada. Use integracoes_listar."
      };
      if (!i.enabled) return {
        error: "Integração desativada."
      };
      try {
        return await executarFerramenta(i, ferramenta, argumentos ?? {});
      } catch (e) {
        return {
          error: e instanceof Error ? e.message.slice(0, 400) : String(e)
        };
      }
    }
  });
  try {
    const result = await generateWithFallback(model, (m) => generateText({
      model: m,
      maxRetries: 0,
      system: buildSystem(data.memories, data.hasBridge, data.activeSkills),
      messages: trimmedMessages,
      tools: {
        web_search,
        get_datetime,
        fetch_url,
        run_js,
        shell_exec,
        fs_read,
        image_view,
        fs_write,
        fs_list,
        open_app,
        type_text,
        take_screenshot,
        open_and_view,
        criar_imagem,
        editar_video,
        integracoes_listar,
        integracao_chamar
      },
      stopWhen: stepCountIs(12),
      prepareStep: async ({
        messages
      }) => ({
        messages: stripReasoningParts(messages)
      })
    }));
    const pending = result.toolCalls.filter((tc) => CLIENT_TOOL_NAMES.has(tc.toolName)).map((tc) => ({
      id: tc.toolCallId,
      name: tc.toolName,
      inputJson: JSON.stringify(tc.input ?? {})
    }));
    return {
      text: result.text,
      responseMessagesJson: JSON.stringify(result.response.messages),
      pending
    };
  } catch (err) {
    const msg = err instanceof Error ? err.message : String(err);
    try {
      const n = Array.isArray(data.messages) ? data.messages.length : -1;
      const bytes = JSON.stringify(data.messages ?? []).length;
      appendFileSync(join(tmpdir(), "jarvis_chat_errors.log"), `[${(/* @__PURE__ */ new Date()).toISOString()}] askJarvis ERROR: ${msg.slice(0, 500)} | msgs=${n} bytes=${bytes}
`);
    } catch {
    }
    if (msg.includes("413") || /payload|too large|tokens|rate_limit|context_length|maximum context/i.test(msg)) {
      return {
        text: "A conversa ficou longa demais para o modelo, senhor - toque na lixeira para comecar uma conversa nova e tente de novo.",
        responseMessagesJson: "[]",
        pending: []
      };
    }
    if (msg.includes("429")) {
      return {
        text: "Perdão, senhor — circuitos sobrecarregados. Tente novamente em instantes.",
        responseMessagesJson: "[]",
        pending: []
      };
    }
    if (msg.includes("402")) {
      return {
        text: "Créditos esgotados, senhor. Recarregue no painel do Lovable.",
        responseMessagesJson: "[]",
        pending: []
      };
    }
    if (/LOVABLE_API_KEY|GROQ_API_KEY|GROK_API_KEY|Configuração incompleta/i.test(msg)) {
      return {
        text: "O provedor de IA não está configurado, senhor. Adicione a chave do Gemini do Lovable (ou outro provedor) em .env.local e reinicie o app.",
        responseMessagesJson: "[]",
        pending: []
      };
    }
    throw err;
  }
});
const ExtractSchema = z.object({
  userMessage: z.string().min(1),
  assistantMessage: z.string().min(1),
  existingMemories: z.array(z.string()).default([])
});
const EXTRACT_PROMPT = `Você é um extrator de memória de longo prazo para um assistente pessoal.
A partir da última troca entre o usuário e o assistente, identifique NOVOS fatos duradouros sobre o USUÁRIO.

Extraia apenas:
- Nome/apelido/como prefere ser chamado.
- Preferências pessoais (idioma, tom, gostos, hobbies).
- Contexto de vida (profissão, cidade, família, projetos, ferramentas que usa).
- Objetivos, metas ou fatos recorrentes.
- Restrições ou coisas que ele NÃO quer.

NÃO extraia: perguntas triviais, small talk, pedidos pontuais, fatos duplicados, informação sobre o mundo em geral, suposições.

Responda APENAS em JSON puro, sem markdown:
{"memories": ["fato 1", "fato 2"]}

Cada fato em português, terceira pessoa, começando por "O usuário ...".
Se não houver nada relevante, retorne {"memories": []}.`;
const extractMemories_createServerFn_handler = createServerRpc({
  id: "0d7cadfed69faf65c546ba69e266b4923608154bdb4075501c35ab9af256c9dc",
  name: "extractMemories",
  filename: "src/lib/jarvis.functions.ts"
}, (opts) => extractMemories.__executeServer(opts));
const extractMemories = createServerFn({
  method: "POST"
}).inputValidator((data) => ExtractSchema.parse(data)).handler(extractMemories_createServerFn_handler, async ({
  data
}) => {
  const userContent = `Memórias existentes:
${data.existingMemories.length ? data.existingMemories.map((m, i) => `${i + 1}. ${m}`).join("\n") : "(nenhuma)"}

Última troca:
Usuário: ${data.userMessage}
Assistente: ${data.assistantMessage}

Extraia novos fatos duradouros sobre o usuário.`;
  try {
    const {
      text
    } = await generateWithFallback(createJarvisModel(), (m) => generateText({
      model: m,
      maxRetries: 1,
      system: EXTRACT_PROMPT,
      messages: [{
        role: "user",
        content: userContent
      }]
    }));
    const cleaned = text.trim().replace(/^```(?:json)?/i, "").replace(/```$/, "").trim();
    const parsed = JSON.parse(cleaned);
    const raw = Array.isArray(parsed.memories) ? parsed.memories : [];
    const memories = raw.filter((m) => typeof m === "string").map((m) => m.trim()).filter((m) => m.length > 0 && m.length <= 240);
    return {
      memories
    };
  } catch {
    return {
      memories: []
    };
  }
});
export {
  askJarvis_createServerFn_handler,
  createSkillFn_createServerFn_handler,
  extractMemories_createServerFn_handler,
  listSkillsFn_createServerFn_handler
};
