import { createFileRoute } from "@tanstack/react-router";
import {
  assertTaskApiToken,
  getScheduledTaskState,
  runScheduledNews,
} from "@/lib/scheduled-tasks.server";

function errorResponse(error: unknown): Response {
  const message = error instanceof Error ? error.message : "Falha na operação da tarefa.";
  const status = message.includes("inválida")
    ? 401
    : message.includes("configurado") || message.includes("indisponível")
      ? 503
      : 500;
  return Response.json({ error: message }, { status, headers: { "Cache-Control": "no-store" } });
}

export const Route = createFileRoute("/api/scheduled-tasks")({
  server: {
    handlers: {
      GET: async ({ request }) => {
        try {
          assertTaskApiToken(request);
          return Response.json(await getScheduledTaskState(), {
            headers: { "Cache-Control": "no-store" },
          });
        } catch (error) {
          return errorResponse(error);
        }
      },
      POST: async ({ request }) => {
        try {
          assertTaskApiToken(request);
          const body = (await request.json()) as { action?: unknown };
          if (body.action !== "run") {
            return Response.json(
              { error: "Ação inválida." },
              { status: 400, headers: { "Cache-Control": "no-store" } },
            );
          }
          const result = await runScheduledNews({ scheduled: false });
          return Response.json(
            { ...getScheduledTaskState(), result },
            { headers: { "Cache-Control": "no-store" } },
          );
        } catch (error) {
          return errorResponse(error);
        }
      },
    },
  },
});
