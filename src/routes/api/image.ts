import { createFileRoute } from "@tanstack/react-router";
import { generateImage, RATIOS, type ImageRatio } from "@/lib/imagegen.server";

const CACHE = "public, max-age=31536000, immutable";

export const Route = createFileRoute("/api/image")({
  server: {
    handlers: {
      GET: async ({ request }) => {
        const url = new URL(request.url);
        const prompt = (url.searchParams.get("prompt") || "").trim();
        if (!prompt) return new Response("Missing prompt", { status: 400 });
        const ratioParam = (url.searchParams.get("ratio") || "retrato") as ImageRatio;
        const ratio: ImageRatio = ratioParam in RATIOS ? ratioParam : "retrato";

        const gen = await generateImage(prompt, ratio);
        if (!gen.ok) {
          const [w, h] = RATIOS[ratio];
          const quota = /429|quota|exceed/i.test(gen.error);
          const msg = quota
            ? "Cota diária esgotada, senhor. Tente mais tarde."
            : `Falha ao gerar, senhor: ${gen.error.slice(0, 120)}`;
          const esc = msg.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;");
          const svg =
            `<svg xmlns="http://www.w3.org/2000/svg" width="${w}" height="${h}">` +
            `<rect width="100%" height="100%" fill="#0a0f1e"/>` +
            `<text x="50%" y="47%" fill="#7dd3fc" font-family="monospace" font-size="34" text-anchor="middle">${esc}</text>` +
            `<text x="50%" y="54%" fill="#94a3b8" font-family="monospace" font-size="24" text-anchor="middle">J.A.R.V.I.S.</text></svg>`;
          return new Response(svg, {
            headers: { "Content-Type": "image/svg+xml", "Cache-Control": "no-store" },
          });
        }

        const bytes = Buffer.from(gen.data ?? "", "base64");
        return new Response(new Uint8Array(bytes), {
          headers: {
            "Content-Type": gen.mediaType,
            "Content-Length": String(bytes.length),
            "Cache-Control": CACHE,
          },
        });
      },
    },
  },
});
