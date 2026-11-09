import { createFileRoute } from "@tanstack/react-router";
import { runTelegramAgent, tgSend, tgPhoto, tgFileUrl, transcribeVoice, urlToDataUrl, tryTelegramCommand, sendTtsAudio, loadTgHistory, saveTgHistory, type TgMessage } from "@/lib/telegram.server";

export const Route = createFileRoute("/api/telegram-webhook")({
  server: {
    handlers: {
      POST: async ({ request }) => {
        const secret = process.env.TELEGRAM_WEBHOOK_SECRET || "";
        if (secret) {
          const got = request.headers.get("x-telegram-bot-api-secret-token") || "";
          if (got !== secret) return new Response("Forbidden", { status: 403 });
        }
        let update: {
          update_id?: number;
          message?: {
            chat?: { id?: number | string };
            text?: string;
            caption?: string;
            photo?: { file_id?: string }[];
            voice?: { file_id?: string };
          };
        } | null = null;
        try {
          update = (await request.json()) as { update_id?: number; message?: { chat?: { id?: number | string }; text?: string; caption?: string; photo?: { file_id: string }[]; voice?: { file_id: string } } };
        } catch {
          return new Response("Bad Request", { status: 400 });
        }
        const chatIdRaw = update?.message?.chat?.id;
        if (chatIdRaw === undefined || chatIdRaw === null) return new Response("OK");
        const chatId = String(chatIdRaw);
        const allowed = (process.env.TELEGRAM_ALLOWED_CHAT_ID || "").trim();
        if (allowed && chatId !== allowed) {
          console.warn(`[telegram] chat bloqueado: ${chatId}`);
          return new Response("OK");
        }
        try {
          await handleMessage(update!.message!, chatId);
        } catch (e) {
          console.error("[telegram]", e instanceof Error ? e.message.slice(0, 300) : e);
          try {
            await tgSend(chatId, "Falha momentânea, senhor. Tente de novo.");
          } catch {
            /* ignore */
          }
        }
        return new Response("OK");
      },
    },
  },
});

type TgMsg = {
  text?: string;
  caption?: string;
  photo?: { file_id?: string }[];
  voice?: { file_id?: string };
};

async function sendReply(chatId: string, reply: string, imageUrls: string[]): Promise<void> {
  const clean = reply.replace(/!\[([^\]]*)\]\(([^)]+)\)/g, "$1").trim();
  for (const u of imageUrls.slice(0, 3)) {
    const ok = await tgPhoto(chatId, u, "");
    if (!ok) break;
  }
  if (clean) await tgSend(chatId, clean);
}

async function handleMessage(msg: TgMsg, chatId: string): Promise<void> {
  const text = (msg.text || "").trim();
  if (text.startsWith("/")) {
    await tryTelegramCommand(chatId, text);
    return;
  }
  if (msg.voice?.file_id) {
    const fileUrl = await tgFileUrl(String(msg.voice.file_id));
    if (!fileUrl) {
      await tgSend(chatId, "Não consegui baixar o áudio, senhor.");
      return;
    }
    const transcript = await transcribeVoice(fileUrl);
    if (!transcript) {
      await tgSend(chatId, "Não consegui transcrever o áudio, senhor.");
      return;
    }
    const hist = await loadTgHistory(chatId);
    const { text: reply, imageUrls } = await runTelegramAgent([
      ...hist,
      { role: "user", content: `O senhor disse por voz: ${transcript}` },
    ]);
    await sendReply(chatId, reply, imageUrls);
    await sendTtsAudio(chatId, reply);
    await saveTgHistory(chatId, [
      ...hist,
      { role: "user", content: `(voz) ${transcript}` },
      { role: "assistant", content: reply },
    ]);
    return;
  }
  if (Array.isArray(msg.photo) && msg.photo.length) {
    const best = msg.photo[msg.photo.length - 1];
    if (!best?.file_id) {
      await tgSend(chatId, "Não consegui ler a foto, senhor.");
      return;
    }
    const fileUrl = await tgFileUrl(String(best.file_id));
    const caption = (msg.caption || "").trim() || "Descreva esta imagem em português.";
    if (!fileUrl) {
      await tgSend(chatId, "Não consegui baixar a foto, senhor.");
      return;
    }
    const dl = await urlToDataUrl(fileUrl);
    if (!dl) {
      await tgSend(chatId, "Não consegui ler a foto, senhor.");
      return;
    }
    const dataUrl = `data:${dl.mediaType};base64,${dl.data}`;
    const hist = await loadTgHistory(chatId);
    const msgs: TgMessage[] = [
      ...hist,
      {
        role: "user",
        content: [
          { type: "text", text: caption },
          { type: "image", image: dataUrl },
        ],
      },
    ];
    const { text: reply, imageUrls } = await runTelegramAgent(msgs);
    await sendReply(chatId, reply, imageUrls);
    await saveTgHistory(chatId, [...hist, { role: "user", content: `[foto] ${caption}` }, { role: "assistant", content: reply }]);
    return;
  }
  if (text) {
    const hist = await loadTgHistory(chatId);
    const { text: reply, imageUrls } = await runTelegramAgent([...hist, { role: "user", content: text }]);
    await sendReply(chatId, reply, imageUrls);
    await saveTgHistory(chatId, [...hist, { role: "user", content: text }, { role: "assistant", content: reply }]);
    return;
  }
  await tgSend(chatId, "Envie texto, foto ou áudio, senhor.");
}
