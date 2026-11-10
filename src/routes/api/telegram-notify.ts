import { createFileRoute } from "@tanstack/react-router";

type Event = {
  id: number;
  from: string;
  text: string;
  reply: string;
  at: string;
};

type Store = { last: Event | null; counter: number };
const STORE_KEY = "__tgNotifyStore";
function store(): Store {
  const g = globalThis as unknown as Record<string, Store>;
  if (!g[STORE_KEY]) g[STORE_KEY] = { last: null, counter: 0 };
  return g[STORE_KEY];
}

export const Route = createFileRoute("/api/telegram-notify")({
  server: {
    handlers: {
      GET: async () => {
        const s = store();
        return new Response(JSON.stringify({ ok: true, last: s.last }), {
          headers: { "content-type": "application/json; charset=utf-8", "cache-control": "no-store" },
        });
      },
      POST: async ({ request }) => {
        let body: { from?: string; text?: string; reply?: string } = {};
        try { body = (await request.json()) as typeof body; } catch { /* ignore */ }
        const s = store();
        s.counter += 1;
        s.last = {
          id: s.counter,
          from: String(body.from ?? "Telegram").slice(0, 80),
          text: String(body.text ?? "").slice(0, 200),
          reply: String(body.reply ?? "").slice(0, 200),
          at: new Date().toISOString(),
        };
        return new Response(JSON.stringify({ ok: true, id: s.last.id }), {
          headers: { "content-type": "application/json; charset=utf-8" },
        });
      },
    },
  },
});