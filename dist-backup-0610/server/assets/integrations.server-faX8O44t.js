import { existsSync, readFileSync, mkdirSync, writeFileSync, renameSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";
const FILE = "jarvis-integrations.json";
function storePaths() {
  return [join(process.cwd(), FILE), join(tmpdir(), FILE)];
}
function listIntegrations() {
  const merged = /* @__PURE__ */ new Map();
  for (const p of storePaths()) {
    try {
      if (!existsSync(p)) continue;
      const arr = JSON.parse(readFileSync(p, "utf-8"));
      if (Array.isArray(arr)) {
        for (const i of arr) if (i?.id) merged.set(i.id, i);
      }
    } catch {
    }
  }
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
      enabled: cur?.enabled ?? true
    });
  }
  return [...merged.values()];
}
function persist(list) {
  for (const dir of [process.cwd(), tmpdir()]) {
    try {
      if (!existsSync(dir)) mkdirSync(dir, { recursive: true });
      const p = join(dir, FILE);
      const tmp = `${p}.tmp`;
      writeFileSync(tmp, JSON.stringify(list, null, 2), "utf-8");
      renameSync(tmp, p);
    } catch {
    }
  }
}
function saveIntegration(data) {
  const list = listIntegrations();
  const slug = data.name.toLowerCase().normalize("NFD").replace(/[\u0300-\u036f]/g, "").replace(/[^a-z0-9]+/g, "-").replace(/^-+|-+$/g, "").slice(0, 40);
  const id = data.id ?? (slug || `int-${Date.now()}`);
  const existing = list.find((i) => i.id === id);
  const saved = {
    id,
    name: data.name.trim() || id,
    kind: data.kind,
    url: data.url.trim().replace(/\/$/, ""),
    token: data.token?.trim() || void 0,
    enabled: data.enabled ?? existing?.enabled ?? true
  };
  const idx = list.findIndex((i) => i.id === id);
  if (idx >= 0) list[idx] = saved;
  else list.push(saved);
  persist(list);
  return saved;
}
function deleteIntegration(id) {
  persist(listIntegrations().filter((i) => i.id !== id));
}
function toggleIntegration(id, enabled) {
  const list = listIntegrations();
  const i = list.find((x) => x.id === id);
  if (i) {
    i.enabled = enabled;
    persist(list);
  }
}
async function proxyFetch(url, init, timeoutMs = 25e3) {
  try {
    return await fetch(url, {
      method: init.method ?? "GET",
      headers: init.headers,
      body: init.body,
      signal: AbortSignal.timeout(timeoutMs)
    });
  } catch (directErr) {
    const bridgeUrl = process.env.BRIDGE_URL;
    const token = process.env.BRIDGE_TOKEN || process.env.JARVIS_TOKEN;
    if (!bridgeUrl || !token) throw directErr;
    const res = await fetch(`${bridgeUrl.replace(/\/$/, "")}/proxy`, {
      method: "POST",
      headers: { "Content-Type": "application/json", Authorization: `Bearer ${token}` },
      body: JSON.stringify({ url, method: init.method ?? "GET", headers: init.headers ?? {}, body: init.body ?? null }),
      signal: AbortSignal.timeout(timeoutMs + 1e4)
    });
    const env = await res.json();
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
const sessions = /* @__PURE__ */ new Map();
function authHeaders(i) {
  const h = { "Content-Type": "application/json", Accept: "application/json, text/event-stream" };
  if (i.token) h["Authorization"] = `Bearer ${i.token}`;
  return h;
}
async function mcpPost(i, payload) {
  const headers = authHeaders(i);
  const sess = sessions.get(i.id);
  if (sess?.id) {
    headers["mcp-session-id"] = sess.id;
    headers["MCP-Protocol-Version"] = "2025-03-26";
  }
  const res = await proxyFetch(i.url, { method: "POST", headers, body: JSON.stringify(payload) }, 25e3);
  const sid = res.headers.get("mcp-session-id");
  if (sid) sessions.set(i.id, { id: sid });
  const text = await res.text();
  const ct = res.headers.get("content-type") ?? "";
  let json = null;
  if (ct.includes("event-stream")) {
    for (const line of text.split(/\r?\n/)) {
      if (!line.startsWith("data:")) continue;
      try {
        const obj = JSON.parse(line.slice(5).trim());
        if (obj && (obj.id === payload.id || obj.method)) json = obj;
      } catch {
      }
    }
  } else {
    try {
      json = JSON.parse(text);
    } catch {
      json = null;
    }
  }
  if (!json) throw new Error(`MCP: resposta inválida (HTTP ${res.status}): ${text.slice(0, 200)}`);
  const err = json.error;
  if (err?.message && !json.result) throw new Error(`MCP: ${err.message}`);
  return json;
}
let rpcId = 1;
async function mcpListTools(i) {
  try {
    await mcpPost(i, {
      jsonrpc: "2.0",
      id: rpcId++,
      method: "initialize",
      params: {
        protocolVersion: "2025-03-26",
        capabilities: {},
        clientInfo: { name: "jarvis", version: "1.0" }
      }
    });
    await mcpPost(i, { jsonrpc: "2.0", method: "notifications/initialized" });
  } catch {
  }
  const json = await mcpPost(i, { jsonrpc: "2.0", id: rpcId++, method: "tools/list", params: {} });
  const tools = json.result?.tools ?? [];
  return tools.map((t) => ({ name: t.name, description: t.description, inputSchema: t.inputSchema }));
}
async function mcpCallTool(i, name, args) {
  const json = await mcpPost(i, {
    jsonrpc: "2.0",
    id: rpcId++,
    method: "tools/call",
    params: { name, arguments: args }
  });
  const result = json.result;
  if (!result) return json;
  const texts = (result.content ?? []).map((c) => c.type === "text" ? c.text : c.type === "image" ? `[imagem ${c.data?.length ?? 0} bytes]` : JSON.stringify(c)).filter(Boolean).join("\n");
  return { resultado: texts, erro: result.isError ? true : void 0 };
}
async function n8nList(i) {
  const res = await proxyFetch(`${i.url}/api/v1/workflows`, {
    method: "GET",
    headers: i.token ? { "X-N8N-API-KEY": i.token } : {}
  });
  const text = await res.text();
  if (!res.ok) throw new Error(`n8n HTTP ${res.status}: ${text.slice(0, 200)}`);
  const j = JSON.parse(text);
  return (j.data ?? []).map((w) => ({ id: w.id, nome: w.name, ativo: w.active }));
}
async function postJson(url, body, headers) {
  const res = await proxyFetch(url, {
    method: "POST",
    headers: { "Content-Type": "application/json", ...headers },
    body: JSON.stringify(body ?? {})
  });
  const text = await res.text();
  let parsed = null;
  try {
    parsed = JSON.parse(text);
  } catch {
    parsed = text.slice(0, 2e3);
  }
  if (!res.ok) throw new Error(`HTTP ${res.status}: ${typeof parsed === "string" ? parsed : JSON.stringify(parsed).slice(0, 300)}`);
  return parsed;
}
async function listarFerramentas(i) {
  switch (i.kind) {
    case "mcp":
      return mcpListTools(i);
    case "n8n":
      return [
        {
          name: "listar_workflows",
          description: "Lista os workflows do n8n (requer API key configurada).",
          inputSchema: { type: "object", properties: {} }
        },
        {
          name: "disparar_webhook",
          description: "Dispara um webhook do n8n (POST JSON na URL do webhook).",
          inputSchema: {
            type: "object",
            properties: {
              webhook_url: { type: "string", description: "URL completa do webhook (ex: http://127.0.0.1:5678/webhook/xxx)" },
              dados: { type: "object", description: "Corpo JSON a enviar" }
            },
            required: ["webhook_url"]
          }
        }
      ];
    case "webhook":
      return [
        {
          name: "disparar",
          description: `POST JSON em ${i.url}`,
          inputSchema: { type: "object", properties: { dados: { type: "object" } } }
        }
      ];
  }
}
async function executarFerramenta(i, ferramenta, argumentos) {
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
export {
  listarFerramentas as a,
  deleteIntegration as d,
  executarFerramenta as e,
  listIntegrations as l,
  saveIntegration as s,
  toggleIntegration as t
};
