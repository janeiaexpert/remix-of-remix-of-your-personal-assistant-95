import { c as createServerRpc } from "./createServerRpc-DZP3RpqE.js";
import { c as createServerFn } from "./server-CJhJqHaa.js";
import { z } from "zod";
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
const TranscribeInput = z.object({
  dataUrl: z.string().min(32),
  filename: z.string().default("recording.webm")
});
function parseDataUrl(dataUrl) {
  const m = dataUrl.match(/^data:([^;,]+);base64,(.*)$/s);
  if (!m) throw new Error("Formato de audio invalido (esperado data: URL base64).");
  const mediaType = m[1];
  const bin = Buffer.from(m[2], "base64");
  return {
    mediaType,
    bytes: new Uint8Array(bin)
  };
}
const transcribeAudio_createServerFn_handler = createServerRpc({
  id: "b7af3bb58bcfc3bd7fbc06940306a92b7d030d22c0f1eda5c0a3220fb15667c6",
  name: "transcribeAudio",
  filename: "src/lib/media.functions.ts"
}, (opts) => transcribeAudio.__executeServer(opts));
const transcribeAudio = createServerFn({
  method: "POST"
}).inputValidator((data) => TranscribeInput.parse(data)).handler(transcribeAudio_createServerFn_handler, async ({
  data
}) => {
  try {
    const {
      mediaType,
      bytes
    } = parseDataUrl(data.dataUrl);
    const key = process.env.GROQ_API_KEY;
    if (!key) return {
      text: "",
      error: "Transcricao indisponivel: faltando GROQ_API_KEY no .env.local."
    };
    const form = new FormData();
    form.append("file", new Blob([bytes], {
      type: mediaType
    }), data.filename || "audio.webm");
    form.append("model", "whisper-large-v3-turbo");
    form.append("language", "pt");
    form.append("response_format", "json");
    const res = await fetch("https://api.groq.com/openai/v1/audio/transcriptions", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${key}`
      },
      body: form
    });
    if (!res.ok) {
      return {
        text: "",
        error: `Transcricao falhou (${res.status}). Tente de novo.`
      };
    }
    const json = await res.json();
    return {
      text: json.text ?? ""
    };
  } catch (e) {
    return {
      text: "",
      error: e instanceof Error ? e.message : "Falha ao transcrever."
    };
  }
});
export {
  transcribeAudio_createServerFn_handler
};
