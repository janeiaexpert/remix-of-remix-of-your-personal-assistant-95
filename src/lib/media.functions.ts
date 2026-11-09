import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";

const TranscribeInput = z.object({
  dataUrl: z.string().min(32),
  filename: z.string().default("recording.webm"),
});

function parseDataUrl(dataUrl: string): { mediaType: string; bytes: Uint8Array<ArrayBuffer> } {
  const m = dataUrl.match(/^data:([^;,]+);base64,(.*)$/s);
  if (!m) throw new Error("Formato de audio invalido (esperado data: URL base64).");
  const mediaType = m[1];
  const bin = Buffer.from(m[2], "base64");
  return { mediaType, bytes: new Uint8Array(bin) };
}

/** Transcreve audio via Whisper gratis (Groq). A chave nunca sai do servidor. */
export const transcribeAudio = createServerFn({ method: "POST" })
  .inputValidator((data: unknown) => TranscribeInput.parse(data))
  .handler(async ({ data }: { data: { dataUrl: string; filename: string } }): Promise<{ text: string; error?: string }> => {
    try {
      const { mediaType, bytes } = parseDataUrl(data.dataUrl);
      const key = process.env.GROQ_API_KEY;
      if (!key) return { text: "", error: "Transcricao indisponivel: faltando GROQ_API_KEY no .env.local." };
      const form = new FormData();
      form.append("file", new Blob([bytes], { type: mediaType }), data.filename || "audio.webm");
      form.append("model", "whisper-large-v3-turbo");
      form.append("language", "pt");
      form.append("response_format", "json");
      const res = await fetch("https://api.groq.com/openai/v1/audio/transcriptions", {
        method: "POST",
        headers: { Authorization: `Bearer ${key}` },
        body: form,
      });
      if (!res.ok) {
        return { text: "", error: `Transcricao falhou (${res.status}). Tente de novo.` };
      }
      const json = (await res.json()) as { text?: string };
      return { text: json.text ?? "" };
    } catch (e) {
      return { text: "", error: e instanceof Error ? e.message : "Falha ao transcrever." };
    }
  });
