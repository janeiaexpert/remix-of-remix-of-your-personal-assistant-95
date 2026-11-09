import { createFileRoute } from "@tanstack/react-router";
import { runTelegramAgent, loadTgHistory, saveTgHistory, type TgMessage } from "@/lib/telegram.server";

type Body = {
  chatId?: string | number;
  text?: string;
  images?: unknown;
};

const json = (data: unknown, status = 200) =>
  new Response(JSON.stringify(data), {
    status,
    headers: { "content-type": "application/json; charset=utf-8" },
  });

/**
 * Endpoint consumido pelo robô Python (jarvis_scripts/jarvis_telegram.py).
 * Recebe { chatId, text, images } e devolve { text, images }.
 */
export const Route = createFileRoute("/api/telegram-agent")({
  server: {
    handlers: {
      GET: async () => json({ ok: true, service: "telegram-agent" }),
      POST: async ({ request }) => {
        const expected = (process.env.JARVIS_TOKEN || "jarvis-local-7843-2026").trim();
        const got = (request.headers.get("authorization") || "").replace(/^Bearer\s+/i, "").trim();
        if (expected && got !== expected) return json({ error: "forbidden" }, 403);

        let body: Body | null = null;
        try {
          body = (await request.json()) as Body;
        } catch {
          return json({ error: "bad-request" }, 400);
        }

        const chatId = String(body?.chatId ?? "").trim();
        const text = String(body?.text ?? "").trim();
        const images = Array.isArray(body?.images)
          ? (body!.images as unknown[]).filter((i): i is string => typeof i === "string" && i.startsWith("data:"))
          : [];

        if (!chatId) return json({ error: "missing-chat-id" }, 400);
        if (!text && !images.length) return json({ error: "empty" }, 400);

        const allowed = (process.env.TELEGRAM_ALLOWED || process.env.TELEGRAM_ALLOWED_CHAT_ID || "").trim();
        if (allowed && !allowed.split(",").map((s) => s.trim()).includes(chatId)) {
          return json({ text: "Acesso não autorizado, senhor.", images: [] });
        }

        try {
          const hist = await loadTgHistory(chatId);
          const content: unknown = images.length
            ? [{ type: "text", text: text || "Analise a imagem." }, ...images.map((url) => ({ type: "image", image: url }))]
            : text;
          const { text: reply, imageUrls } = await runTelegramAgent([
            ...(hist as TgMessage[]),
            { role: "user", content },
          ]);
          await saveTgHistory(chatId, [
            ...hist,
            { role: "user", content: text || "[imagem]" },
            { role: "assistant", content: reply },
          ]);
          return json({ text: reply, images: imageUrls });
        } catch (e) {
          const msg = e instanceof Error ? e.message : String(e);
          console.error("[telegram-agent]", msg.slice(0, 300));
          return json({ text: "Falha momentânea nos circuitos, senhor. Tente novamente.", images: [], error: msg.slice(0, 200) });
        }
      },
    },
  },
});
