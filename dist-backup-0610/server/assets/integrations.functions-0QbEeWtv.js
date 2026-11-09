import { c as createServerRpc } from "./createServerRpc-DZP3RpqE.js";
import { c as createServerFn } from "./server-CJhJqHaa.js";
import { z } from "zod";
import { l as listIntegrations, s as saveIntegration, d as deleteIntegration, t as toggleIntegration, a as listarFerramentas } from "./integrations.server-faX8O44t.js";
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
import "node:fs";
import "node:os";
import "node:path";
const listIntegrationsFn_createServerFn_handler = createServerRpc({
  id: "c6cada82908ce8a23ff590500d7d8f26833424c38dd24f91a26896f208953f98",
  name: "listIntegrationsFn",
  filename: "src/lib/integrations.functions.ts"
}, (opts) => listIntegrationsFn.__executeServer(opts));
const listIntegrationsFn = createServerFn({
  method: "GET"
}).handler(listIntegrationsFn_createServerFn_handler, () => listIntegrations());
const SaveSchema = z.object({
  id: z.string().optional(),
  name: z.string().min(1),
  kind: z.enum(["mcp", "n8n", "webhook"]),
  url: z.string().min(1),
  token: z.string().optional(),
  enabled: z.boolean().optional()
});
const saveIntegrationFn_createServerFn_handler = createServerRpc({
  id: "78071c329b114cb049c72d2e72db756c61b3f0f40763f3006707080bb892bbd7",
  name: "saveIntegrationFn",
  filename: "src/lib/integrations.functions.ts"
}, (opts) => saveIntegrationFn.__executeServer(opts));
const saveIntegrationFn = createServerFn({
  method: "POST"
}).inputValidator((d) => SaveSchema.parse(d)).handler(saveIntegrationFn_createServerFn_handler, ({
  data
}) => saveIntegration(data));
const deleteIntegrationFn_createServerFn_handler = createServerRpc({
  id: "5b11627af9337e4f569c5c4f07cfcb7f53292616776d17e9523dc6249e89cbe5",
  name: "deleteIntegrationFn",
  filename: "src/lib/integrations.functions.ts"
}, (opts) => deleteIntegrationFn.__executeServer(opts));
const deleteIntegrationFn = createServerFn({
  method: "POST"
}).inputValidator((d) => z.object({
  id: z.string().min(1)
}).parse(d)).handler(deleteIntegrationFn_createServerFn_handler, ({
  data
}) => {
  deleteIntegration(data.id);
  return {
    ok: true
  };
});
const toggleIntegrationFn_createServerFn_handler = createServerRpc({
  id: "26d3e00349fb0d4a90d8c9f5b5252d241237d07350c365b36fd5a7ad3a2168a6",
  name: "toggleIntegrationFn",
  filename: "src/lib/integrations.functions.ts"
}, (opts) => toggleIntegrationFn.__executeServer(opts));
const toggleIntegrationFn = createServerFn({
  method: "POST"
}).inputValidator((d) => z.object({
  id: z.string(),
  enabled: z.boolean()
}).parse(d)).handler(toggleIntegrationFn_createServerFn_handler, ({
  data
}) => {
  toggleIntegration(data.id, data.enabled);
  return {
    ok: true
  };
});
const testIntegrationFn_createServerFn_handler = createServerRpc({
  id: "56c9bdbbe2f46b42e9d7ca7a6862de63407751d84fda22195172f98e3fc329ce",
  name: "testIntegrationFn",
  filename: "src/lib/integrations.functions.ts"
}, (opts) => testIntegrationFn.__executeServer(opts));
const testIntegrationFn = createServerFn({
  method: "POST"
}).inputValidator((d) => z.object({
  id: z.string()
}).parse(d)).handler(testIntegrationFn_createServerFn_handler, async ({
  data
}) => {
  const int = listIntegrations().find((i) => i.id === data.id);
  if (!int) return {
    ok: false,
    error: "Integração não encontrada."
  };
  try {
    const tools = await listarFerramentas(int);
    return {
      ok: true,
      tools: tools.map((t) => t.name),
      count: tools.length
    };
  } catch (e) {
    return {
      ok: false,
      error: e instanceof Error ? e.message.slice(0, 300) : String(e)
    };
  }
});
export {
  deleteIntegrationFn_createServerFn_handler,
  listIntegrationsFn_createServerFn_handler,
  saveIntegrationFn_createServerFn_handler,
  testIntegrationFn_createServerFn_handler,
  toggleIntegrationFn_createServerFn_handler
};
