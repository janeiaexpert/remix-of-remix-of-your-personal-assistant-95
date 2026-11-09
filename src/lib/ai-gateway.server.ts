import { createOpenAICompatible } from "@ai-sdk/openai-compatible";
import { createGoogleGenerativeAI } from "@ai-sdk/google";
import type { LanguageModel } from "ai";

export function createLovableAiGatewayProvider(apiKey: string) {
  return createOpenAICompatible({
    name: "lovable-ai-gateway",
    baseURL: "https://ai.gateway.lovable.dev/v1",
    headers: { "Lovable-API-Key": apiKey },
  });
}

// ---------------------------------------------------------------------------
// Fallback: quando o provedor primário estoura a cota (429/TPD/TPM), repetimos
// a chamada na cadeia gratuita: Gemini (nativo, ~1.500 req/dia) → OpenRouter
// (50 req/dia) → Pollinations (anônimo, sem teto).
// ---------------------------------------------------------------------------
export function isQuotaError(err: unknown): boolean {
  const msg = err instanceof Error ? err.message : String(err);
  return /rate[_ ]?limit|\b429\b|too many requests|\bTPD\b|\bTPM\b|tokens per (day|minute)|too large|quota|overloaded|high demand|\b50[234]\b|fetch failed|free-models-per-day|no space left/i.test(
    msg,
  );
}

function createFallbackModels(): Array<{ label: string; model: LanguageModel }> {
  const out: Array<{ label: string; model: LanguageModel }> = [];
  // 1º Gemini via provider NATIVO: o OpenAI-compat rejeita tool calls com
  // thought_signature ausente (400 em toda ação com ferramenta). O nativo
  // faz o round-trip do thought_signature corretamente.
  const gemKey = process.env.GEMINI_API_KEY;
  if (gemKey) {
    try {
      const provider = createGoogleGenerativeAI({ apiKey: gemKey });
      out.push({ label: "gemini", model: provider(process.env.GEMINI_FALLBACK_MODEL ?? "gemini-3.1-flash-lite") as unknown as LanguageModel });
    } catch {
      /* chave inválida */
    }
  }
  const orKey = process.env.OPENROUTER_API_KEY || process.env.VISION_API_KEY;
  if (orKey) {
    try {
      const provider = createOpenAICompatible({
        name: "openrouter-fallback",
        baseURL: "https://openrouter.ai/api/v1",
        apiKey: orKey,
      });
      out.push({
        label: "openrouter",
        model: provider(process.env.OPENROUTER_FALLBACK_MODEL ?? "nvidia/nemotron-3.5-lightning:free") as unknown as LanguageModel,
      });
    } catch {
      /* sem chave válida */
    }
  }
  try {
    const provider = createOpenAICompatible({
      name: "pollinations-text",
      baseURL: "https://text.pollinations.ai/openai",
      apiKey: "anonymous",
    });
    out.push({ label: "pollinations", model: provider("openai") as unknown as LanguageModel });
  } catch {
    /* nunca deve falhar */
  }
  return out;
}

export async function generateWithFallback<T>(
  primary: LanguageModel,
  run: (model: LanguageModel) => Promise<T>,
): Promise<T> {
  try {
    return await run(primary);
  } catch (err) {
    const provider = (primary as { provider?: string }).provider ?? "";
    const alreadyFallback = provider.includes("openrouter") || provider.includes("pollinations");
    if (alreadyFallback || !isQuotaError(err)) throw err;
    let lastErr: unknown = err;
    for (const fb of createFallbackModels()) {
      // Nunca repete o provedor que acabou de falhar.
      if ((fb.model as { provider?: string }).provider === provider) continue;
      console.warn(
        `[ai-fallback] provedor '${provider}' indisponível; tentando ${fb.label}. ${
          err instanceof Error ? err.message.slice(0, 180) : ""
        }`,
      );
      for (let tentativa = 1; tentativa <= 3; tentativa++) {
        if (tentativa > 1) await new Promise((r) => setTimeout(r, 1200 * (tentativa - 1)));
        try {
          const out = await run(fb.model);
          console.warn(`[ai-fallback] ${fb.label} respondeu OK${tentativa > 1 ? ` (tentativa ${tentativa})` : ""}.`);
          return out;
        } catch (err2) {
          lastErr = err2;
          const m = err2 instanceof Error ? err2.message : String(err2);
          console.warn(`[ai-fallback] ${fb.label} tentativa ${tentativa}: ${m.slice(0, 220)}`);
          // Erros transitórios (sobrecarga do Google etc.) valem retentativa;
          // cota esgotada ou erro definitivo (ex.: 400) → próximo provedor.
          const transit = /high demand|overloaded|unavailable|service|temporarily|\b50[234]\b|fetch failed|timeout|timed out|ECONNRESET|socket hang up/i.test(m);
          if (!transit) break;
        }
      }
    }
    console.warn(`[ai-fallback] cadeia inteira esgotada; devolvendo erro. ${lastErr instanceof Error ? lastErr.message.slice(0, 200) : ""}`);
    throw lastErr;
  }
}

export function createJarvisModel(opts?: { vision?: boolean }) {
  // Groq (gratuito): um único provedor cobre texto, ferramentas E visão.
  // O modelo qwen/qwen3.8-27b aceita imagens no formato OpenAI e faz tool calls.
  if (process.env.GROQ_ENABLED?.toLowerCase() === "true") {
    const key = process.env.GROQ_API_KEY;
    if (!key) throw new Error("Configuração incompleta: faltando GROQ_API_KEY no .env.local");
    const provider = createOpenAICompatible({
      name: "groq",
      baseURL: process.env.GROQ_BASE_URL ?? "https://api.groq.com/openai/v1",
      apiKey: key,
    });
    const modelId = opts?.vision
      ? (process.env.GROQ_VISION_MODEL ?? process.env.GROQ_MODEL ?? "qwen/qwen3.8-27b")
      : (process.env.GROQ_MODEL ?? "openai/gpt-oss-120b");
    return provider(modelId) as unknown as LanguageModel;
  }

  // Vision (imagens no chat): Gemini nativo — o provider do Google
  // aceita partes de imagem/file nativamente. Se não houver chave
  // Gemini, usa o modelo omni do OpenRouter (VISION_*).
  if (opts?.vision) {
    const gemKey = process.env.GEMINI_API_KEY;
    if (gemKey) {
      const provider = createGoogleGenerativeAI({ apiKey: gemKey });
      return provider(process.env.GEMINI_VISION_MODEL ?? "gemini-3.1-flash-lite") as unknown as LanguageModel;
    }
    // Fallback: OpenRouter com modelo de visão gratuito (NVIDIA free tier).
    // Alguns modelos free não suportam imagem; se der 400/415, cai para Pollinations.
    const baseURL = process.env.VISION_BASE_URL;
    const key = process.env.VISION_API_KEY;
    if (baseURL && key) {
      const provider = createOpenAICompatible({
        name: "vision",
        baseURL,
        apiKey: key,
      });
      return provider(process.env.VISION_MODEL ?? "nvidia/nemotron-3-nano-omni-30b-a3b-reasoning:free") as unknown as LanguageModel;
    }
    // Nenhuma chave de visão disponível → usa Pollinations (gratuito, sem chave).
    const pollKey = process.env.OPENROUTER_API_KEY || process.env.GEMINI_API_KEY;
    const pollProvider = createOpenAICompatible({
      name: "pollinations-vision",
      baseURL: "https://text.pollinations.ai/openai",
      apiKey: pollKey ?? "anonymous",
    });
    return pollProvider("openai") as unknown as LanguageModel;
  }

  if (process.env.GROK_ENABLED?.toLowerCase() === "true") {
    const key = process.env.GROK_API_KEY;
    if (!key) throw new Error("Configuração incompleta: faltando GROK_API_KEY no .env.local");
    const provider = createOpenAICompatible({
      name: "xai-grok",
      baseURL: process.env.GROK_BASE_URL ?? "https://api.x.ai/v1",
      apiKey: key,
    });
    return provider(process.env.GROK_MODEL ?? "grok-2-vision-1212") as unknown as LanguageModel;
  }

  const key = process.env.LOVABLE_API_KEY;
  if (key) {
    return createLovableAiGatewayProvider(key)("google/gemini-3-flash-preview") as unknown as LanguageModel;
  }

  // Sem nenhuma chave configurada: usa o Pollinations anônimo (gratuito,
  // sem cadastro) para o Jarvis nunca ficar mudo. Com ferramentas e visão
  // limitadas; o provedor Groq é o recomendado.
  const poll = createOpenAICompatible({
    name: "pollinations-text",
    baseURL: "https://text.pollinations.ai/openai",
    apiKey: "anonymous",
  });
  return poll("openai") as unknown as LanguageModel;
}
