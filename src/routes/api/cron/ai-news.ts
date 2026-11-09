import { createFileRoute } from "@tanstack/react-router";
import { runScheduledNews } from "@/lib/scheduled-tasks.server";

export const Route = createFileRoute("/api/cron/ai-news")({
  server: {
    handlers: {
      GET: async ({ request }) => {
        const secret = process.env.CRON_SECRET;
        if (!secret)
          return Response.json({ error: "CRON_SECRET não configurado." }, { status: 503 });
        if (request.headers.get("authorization") !== `Bearer ${secret}`) {
          return Response.json({ error: "Não autorizado." }, { status: 401 });
        }
        try {
          const result = await runScheduledNews({ scheduled: true });
          return Response.json(
            { ok: true, telegram: result.telegram },
            { headers: { "Cache-Control": "no-store" } },
          );
        } catch (error) {
          const message =
            error instanceof Error ? error.message : "Falha ao executar a busca programada.";
          console.error("[scheduled-news]", message);
          return Response.json(
            { error: message },
            { status: 500, headers: { "Cache-Control": "no-store" } },
          );
        }
      },
    },
  },
});
