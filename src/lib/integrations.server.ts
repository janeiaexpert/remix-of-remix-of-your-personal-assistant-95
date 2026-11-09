// Integrações conectadas: servidores MCP, n8n e webhooks.
// Persistência: arquivo no disco (local/nuvem best-effort, mesmo padrão das skills).

import { existsSync, mkdirSync, readFileSync, renameSync, writeFileSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";

export type IntegrationKind = "mcp" | "n8n" | "webhook";

export type Integration = {
  id: string;
  name: string;
  kind: IntegrationKind;
  url: string;
  token?: string;
  enabled: boolean;
};

export type IntegrationTool = { name: string; description?: string; inputSchema?: unknown };

const FILE = "jarvis-integrations.json";

function storePaths(): string[] {
  return [join(process.cwd(), FILE), join(tmpdir(), FILE)];
}

export function listIntegrations(): Integration[] {
  const merged = new Map<string, Integration>();
  for (const p of storePaths()) {
    try {
      if (!existsSync(p)) continue;
      const arr = JSON.parse(readFileSync(p, "utf-8")) as Integration[];
      if (Array.isArray(arr)) for (const i of arr) if (i?.id) merged.set(i.id, i);
    } catch {
      /* ignora arquivo corrompido */
    }
  }
  // Config via ambiente (nuvem): garante a integração n8n mesmo sem arquivo
  // (o /tmp do Vercel some a cada cold start).
  const envKey = process.env.N8N_API_KEY;
  const envUrl = process.env.N8N_URL;
  if (envKey || envUrl) {
    const id = "n8n-local";
    const cur = merged.get(id);
    merged.set(id, {
      id,
      name: cur?.name ?? "n8n do notebook",
      kind: "n8n",
      url: envUrl ?? cur?.url ?? "http://127.0.0.1:5678",
      token: envKey ?? cur?.token,
      enabled: cur?.enabled ?? true,
    });
  }
  return [...merged.values()];
}

function persist(list: Integration[]): void {
  for (const dir of [process.cwd(), tmpdir()]) {
    try {
      if (!existsSync(dir)) mkdirSync(dir, { recursive: true });
      const p = join(dir, FILE);
      const tmp = `${p}.tmp`;
      writeFileSync(tmp, JSON.stringify(list, null, 2), "utf-8");
      renameSync(tmp, p);
    } catch {
      /* melhor esforço */
    }
  }
}

export function saveIntegration(
  data: Omit<Integration, "id" | "enabled"> & { id?: string; enabled?: boolean },
): Integration {
  const list = listIntegrations();
  const slug = data.name
    .toLowerCase()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "")
    .slice(0, 40);
  const id = data.id ?? (slug || `int-${Date.now()}`);
  const existing = list.find((i) => i.id === id);
  const saved: Integration = {
    id,
    name: data.name.trim() || id,
    kind: data.kind,
    url: data.url.trim().replace(/\/$/, ""),
    token: data.token?.trim() || undefined,
    enabled: data.enabled ?? existing?.enabled ?? true,
  };
  const idx = list.findIndex((i) => i.id === id);
  if (idx >= 0) list[idx] = saved;
  else list.push(saved);
  persist(list);
  return saved;
}

export function deleteIntegration(id: string): void {
  persist(listIntegrations().filter((i) => i.id !== id));
}

export function toggleIntegration(id: string, enabled: boolean): void {
  const list = listIntegrations();
  const i = list.find((x) => x.id === id);
  if (i) {
    i.enabled = enabled;
    persist(list);
  }
}

// ---------------------------------------------------------------------------
// fetch com proxy: tenta direto; se não der (serviço local no notebook),
// passa pela bridge local via POST /proxy.
// ---------------------------------------------------------------------------
type ProxyResult = { status: number; contentType: string; headers: Record<string, string>; body: string };

async function proxyFetch(
  url: string,
  init: { method?: string; headers?: Record<string, string>; body?: string },
  timeoutMs = 25_000,
): Promise<Response> {
  try {
    return await fetch(url, {
      method: init.method ?? "GET",
      headers: init.headers,
      body: init.body,
      signal: AbortSignal.timeout(timeoutMs),
    });
  } catch (directErr) {
    const bridgeUrl = process.env.BRIDGE_URL;
    const token = process.env.BRIDGE_TOKEN || process.env.JARVIS_TOKEN;
    if (!bridgeUrl || !token) throw directErr;
    const res = await fetch(`${bridgeUrl.replace(/\/$/, "")}/proxy`, {
      method: "POST",
      headers: { "Content-Type": "application/json", Authorization: `Bearer ${token}` },
      body: JSON.stringify({ url, method: init.method ?? "GET", headers: init.headers ?? {}, body: init.body ?? null }),
      signal: AbortSignal.timeout(timeoutMs + 10_000),
    });
    const env = (await res.json()) as ProxyResult & { error?: string };
    if (!res.ok || env.error) {
      throw new Error(env.error ?? `bridge proxy HTTP ${res.status}`);
    }
    const headers = new Headers();
    for (const [k, v] of Object.entries(env.headers ?? {})) {
      if (["content-type", "mcp-session-id", "location"].includes(k.toLowerCase())) headers.set(k, v);
    }
    if (!headers.get("content-type")) headers.set("content-type", env.contentType || "text/plain");
    return new Response(env.body, { status: env.status, headers });
  }
}

// ---------------------------------------------------------------------------
// MCP (Streamable HTTP): initialize → initialized → tools/list → tools/call
// ---------------------------------------------------------------------------
const sessions = new Map<string, { id?: string }>();

function authHeaders(i: Integration): Record<string, string> {
  const h: Record<string, string> = { "Content-Type": "application/json", Accept: "application/json, text/event-stream" };
  if (i.token) h["Authorization"] = `Bearer ${i.token}`;
  return h;
}

async function mcpPost(i: Integration, payload: Record<string, unknown>): Promise<Record<string, unknown>> {
  const headers = authHeaders(i);
  const sess = sessions.get(i.id);
  if (sess?.id) {
    headers["mcp-session-id"] = sess.id;
    headers["MCP-Protocol-Version"] = "2025-03-26";
  }
  const res = await proxyFetch(i.url, { method: "POST", headers, body: JSON.stringify(payload) }, 25_000);
  const sid = res.headers.get("mcp-session-id");
  if (sid) sessions.set(i.id, { id: sid });
  const text = await res.text();
  const ct = res.headers.get("content-type") ?? "";
  let json: Record<string, unknown> | null = null;
  if (ct.includes("event-stream")) {
    for (const line of text.split(/\r?\n/)) {
      if (!line.startsWith("data:")) continue;
      try {
        const obj = JSON.parse(line.slice(5).trim()) as Record<string, unknown>;
        if (obj && (obj.id === payload.id || obj.method)) json = obj;
      } catch {
        /* linha parcial */
      }
    }
  } else {
    try {
      json = JSON.parse(text) as Record<string, unknown>;
    } catch {
      json = null;
    }
  }
  if (!json) throw new Error(`MCP: resposta inválida (HTTP ${res.status}): ${text.slice(0, 200)}`);
  const err = json.error as { message?: string } | undefined;
  if (err?.message && !json.result) throw new Error(`MCP: ${err.message}`);
  return json;
}

let rpcId = 1;

async function mcpListTools(i: Integration): Promise<IntegrationTool[]> {
  try {
    await mcpPost(i, {
      jsonrpc: "2.0",
      id: rpcId++,
      method: "initialize",
      params: {
        protocolVersion: "2025-03-26",
        capabilities: {},
        clientInfo: { name: "jarvis", version: "1.0" },
      },
    });
    await mcpPost(i, { jsonrpc: "2.0", method: "notifications/initialized" });
  } catch {
    /* servidor stateless pode não exigir initialize */
  }
  const json = await mcpPost(i, { jsonrpc: "2.0", id: rpcId++, method: "tools/list", params: {} });
  const tools = (json.result as { tools?: IntegrationTool[] } | undefined)?.tools ?? [];
  return tools.map((t) => ({ name: t.name, description: t.description, inputSchema: t.inputSchema }));
}

async function mcpCallTool(i: Integration, name: string, args: Record<string, unknown>): Promise<unknown> {
  const json = await mcpPost(i, {
    jsonrpc: "2.0",
    id: rpcId++,
    method: "tools/call",
    params: { name, arguments: args },
  });
  const result = json.result as
    | { content?: { type: string; text?: string; data?: string }[]; isError?: boolean }
    | undefined;
  if (!result) return json;
  const texts = (result.content ?? [])
    .map((c) => (c.type === "text" ? c.text : c.type === "image" ? `[imagem ${c.data?.length ?? 0} bytes]` : JSON.stringify(c)))
    .filter(Boolean)
    .join("\n");
  return { resultado: texts, erro: result.isError ? true : undefined };
}

// ---------------------------------------------------------------------------
// n8n e webhooks
// ---------------------------------------------------------------------------
async function n8nList(i: Integration): Promise<unknown> {
  const res = await proxyFetch(`${i.url}/api/v1/workflows`, {
    method: "GET",
    headers: i.token ? { "X-N8N-API-KEY": i.token } : {},
  });
  const text = await res.text();
  if (!res.ok) throw new Error(`n8n HTTP ${res.status}: ${text.slice(0, 200)}`);
  const j = JSON.parse(text) as { data?: { id: string; name: string; active?: boolean }[] };
  return (j.data ?? []).map((w) => ({ id: w.id, nome: w.name, ativo: w.active }));
}

async function postJson(url: string, body: unknown, headers: Record<string, string>): Promise<unknown> {
  const res = await proxyFetch(url, {
    method: "POST",
    headers: { "Content-Type": "application/json", ...headers },
    body: JSON.stringify(body ?? {}),
  });
  const text = await res.text();
  let parsed: unknown = null;
  try {
    parsed = JSON.parse(text);
  } catch {
    parsed = text.slice(0, 2000);
  }
  if (!res.ok) throw new Error(`HTTP ${res.status}: ${typeof parsed === "string" ? parsed : JSON.stringify(parsed).slice(0, 300)}`);
  return parsed;
}

// ---------------------------------------------------------------------------
// API unificada usada pelo agente
// ---------------------------------------------------------------------------
export async function listarFerramentas(i: Integration): Promise<IntegrationTool[]> {
  switch (i.kind) {
    case "mcp":
      return mcpListTools(i);
    case "n8n":
      return [
        {
          name: "listar_workflows",
          description: "Lista os workflows do n8n (requer API key configurada).",
          inputSchema: { type: "object", properties: {} },
        },
        {
          name: "disparar_webhook",
          description: "Dispara um webhook do n8n (POST JSON na URL do webhook).",
          inputSchema: {
            type: "object",
            properties: {
              webhook_url: { type: "string", description: "URL completa do webhook (ex: http://127.0.0.1:5678/webhook/xxx)" },
              dados: { type: "object", description: "Corpo JSON a enviar" },
            },
            required: ["webhook_url"],
          },
        },
      ];
    case "webhook":
      return [
        {
          name: "disparar",
          description: `POST JSON em ${i.url}`,
          inputSchema: { type: "object", properties: { dados: { type: "object" } } },
        },
      ];
  }
}

export async function executarFerramenta(
  i: Integration,
  ferramenta: string,
  argumentos: Record<string, unknown>,
): Promise<unknown> {
  if (i.kind === "mcp") return mcpCallTool(i, ferramenta, argumentos);
  if (i.kind === "n8n") {
    if (ferramenta === "listar_workflows") return { workflows: await n8nList(i) };
    if (ferramenta === "disparar_webhook") {
      const url = String(argumentos.webhook_url ?? "");
      if (!url) throw new Error("webhook_url obrigatório.");
      return await postJson(url, argumentos.dados ?? {}, {});
    }
    throw new Error(`Ferramenta desconhecida: ${ferramenta}`);
  }
  if (i.kind === "webhook") {
    if (ferramenta !== "disparar") throw new Error(`Ferramenta desconhecida: ${ferramenta}`);
    return await postJson(i.url, argumentos.dados ?? {}, i.token ? { Authorization: `Bearer ${i.token}` } : {});
  }
  throw new Error("Tipo de integração desconhecido.");
}
