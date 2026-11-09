import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";
import {
  listIntegrations,
  saveIntegration,
  deleteIntegration,
  toggleIntegration,
  listarFerramentas,
  type Integration,
} from "./integrations.server";

export const listIntegrationsFn = createServerFn({ method: "GET" }).handler((): Integration[] => listIntegrations());

const SaveSchema = z.object({
  id: z.string().optional(),
  name: z.string().min(1),
  kind: z.enum(["mcp", "n8n", "webhook"]),
  url: z.string().min(1),
  token: z.string().optional(),
  enabled: z.boolean().optional(),
});

export const saveIntegrationFn = createServerFn({ method: "POST" })
  .inputValidator((d: unknown) => SaveSchema.parse(d))
  .handler(({ data }): Integration => saveIntegration(data));

export const deleteIntegrationFn = createServerFn({ method: "POST" })
  .inputValidator((d: unknown) => z.object({ id: z.string().min(1) }).parse(d))
  .handler(({ data }) => {
    deleteIntegration(data.id);
    return { ok: true };
  });

export const toggleIntegrationFn = createServerFn({ method: "POST" })
  .inputValidator((d: unknown) => z.object({ id: z.string(), enabled: z.boolean() }).parse(d))
  .handler(({ data }) => {
    toggleIntegration(data.id, data.enabled);
    return { ok: true };
  });

export const testIntegrationFn = createServerFn({ method: "POST" })
  .inputValidator((d: unknown) => z.object({ id: z.string() }).parse(d))
  .handler(async ({ data }) => {
    const int = listIntegrations().find((i) => i.id === data.id);
    if (!int) return { ok: false as const, error: "Integração não encontrada." };
    try {
      const tools = await listarFerramentas(int);
      return { ok: true as const, tools: tools.map((t) => t.name), count: tools.length };
    } catch (e) {
      return { ok: false as const, error: e instanceof Error ? e.message.slice(0, 300) : String(e) };
    }
  });
