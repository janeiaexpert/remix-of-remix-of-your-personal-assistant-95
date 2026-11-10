import { duckDuckGoSearch, tavilySearch } from "./jarvis.functions";
import { tgSend } from "./telegram.server";

export type ScheduledTaskConfig = {
  id: "ai-news";
  enabled: true;
  days: ["Tuesday", "Friday"];
  time: "08:00";
  timezone: "America/Sao_Paulo";
};

export type ScheduledTaskRun = {
  id: string;
  createdAt: string;
  status: "success" | "error";
  report: string;
  telegram: "sent" | "not-configured" | "failed";
  error?: string;
};

const FIXED_TASK: ScheduledTaskConfig = {
  id: "ai-news",
  enabled: true,
  days: ["Tuesday", "Friday"],
  time: "08:00",
  timezone: "America/Sao_Paulo",
};

export function isTelegramDeliveryConfigured(): boolean {
  return Boolean(process.env.TELEGRAM_BOT_TOKEN && process.env.TELEGRAM_ALLOWED_CHAT_ID);
}

function assertTaskApiToken(request: Request): void {
  const expected = process.env.JARVIS_TASKS_TOKEN;
  if (!expected) throw new Error("O servidor ainda não tem JARVIS_TASKS_TOKEN configurado.");
  if (request.headers.get("authorization") !== `Bearer ${expected}`) {
    throw new Error("Chave de acesso às tarefas inválida.");
  }
}

export { assertTaskApiToken };

export function getScheduledTaskState(): {
  task: ScheduledTaskConfig;
  telegramConfigured: boolean;
} {
  return {
    task: FIXED_TASK,
    telegramConfigured: isTelegramDeliveryConfigured(),
  };
}

const NEWS_QUERIES = [
  ["OpenAI", "OpenAI últimas notícias anúncios 2026"],
  ["Anthropic", "Anthropic Claude últimas notícias anúncios 2026"],
  ["Google Gemini", "Google Gemini últimas notícias anúncios 2026"],
  ["IA para negócios", "inteligência artificial negócios empresas novidades 2026"],
] as const;

const BLOCKED_HOSTS = ["bit.ly", "tinyurl.com", "t.co", "goo.gl", "ow.ly", "is.gd", "buff.ly"];

async function createNewsReport(): Promise<string> {
  const sections = await Promise.all(
    NEWS_QUERIES.map(async ([topic, query]) => {
      const raw = process.env.TAVILY_API_KEY
        ? await tavilySearch(query, 5)
        : await duckDuckGoSearch(query, 5);
      const hits = raw.filter((h) => {
        try {
          const u = new URL(h.url);
          if (u.protocol !== "https:") return false;
          if (BLOCKED_HOSTS.some((b) => u.hostname.includes(b))) return false;
          return true;
        } catch {
          return false;
        }
      }).slice(0, 3);
      return { topic, hits };
    }),
  );
  const total = sections.reduce((sum, section) => sum + section.hits.length, 0);
  if (!total) throw new Error("A busca não encontrou resultados nas fontes consultadas.");

  const timestamp = new Intl.DateTimeFormat("pt-BR", {
    dateStyle: "full",
    timeStyle: "short",
    timeZone: "America/Sao_Paulo",
  }).format(new Date());
  const body = sections
    .map(({ topic, hits }) => {
      const items = hits.length
        ? hits
            .map((hit, i) => {
              const snippet = (hit.snippet || "Sem descrição disponível.").trim();
              const short = snippet.length > 220 ? snippet.slice(0, 217) + "…" : snippet;
              return `  ${i + 1}) *${hit.title}*\n     ${short}\n     🔗 Fonte: ${hit.url}`;
            })
            .join("\n\n")
        : "• Nenhum resultado encontrado nesta busca.";
      return `━━━ ${topic.toUpperCase()} ━━━\n${items}`;
    })
    .join("\n\n");

  return `📰 *DESTAQUES DE IA DA SEMANA*\n📅 ${timestamp} (horário de Brasília)\n\n${body}\n\n⚠️ Resumo automático de buscas públicas. Confirme datas e detalhes nas fontes.`;
}

export async function runScheduledNews(options: {
  scheduled: boolean;
}): Promise<{ report: string; telegram: "sent" | "not-configured" | "failed" }> {
  const report = await createNewsReport();
  const chatId = process.env.TELEGRAM_ALLOWED_CHAT_ID;
  const telegram =
    process.env.TELEGRAM_BOT_TOKEN && chatId
      ? (await tgSend(chatId, report))
        ? "sent"
        : "failed"
      : "not-configured";
  if (options.scheduled && telegram !== "sent") {
    throw new Error(
      telegram === "failed"
        ? "A pesquisa foi feita, mas o Telegram recusou o envio."
        : "Configure TELEGRAM_BOT_TOKEN e TELEGRAM_ALLOWED_CHAT_ID para receber a tarefa agendada.",
    );
  }
  return { report, telegram };
}
