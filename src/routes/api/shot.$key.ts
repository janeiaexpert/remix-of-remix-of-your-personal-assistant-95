import { createFileRoute } from "@tanstack/react-router";
import { getShot } from "@/lib/imagegen.server";

export const Route = createFileRoute("/api/shot/$key")({
  server: {
    handlers: {
      GET: async ({ request }) => {
        const url = new URL(request.url);
        const key = (url.pathname.split("/").pop() || "").trim();
        const shot = key ? getShot(key) : null;
        if (!shot) {
          const svg =
            `<svg xmlns="http://www.w3.org/2000/svg" width="960" height="540">` +
            `<rect width="100%" height="100%" fill="#0a0f1e"/>` +
            `<text x="50%" y="47%" fill="#7dd3fc" font-family="monospace" font-size="32" text-anchor="middle">Imagem expirada, senhor.</text>` +
            `<text x="50%" y="55%" fill="#94a3b8" font-family="monospace" font-size="22" text-anchor="middle">Peça de novo, por favor.</text></svg>`;
          return new Response(svg, {
            headers: { "Content-Type": "image/svg+xml", "Cache-Control": "no-store" },
          });
        }
        const bytes = Buffer.from(shot.data, "base64");
        return new Response(new Uint8Array(bytes), {
          headers: {
            "Content-Type": shot.mediaType,
            "Content-Length": String(bytes.length),
            "Cache-Control": "public, max-age=300",
          },
        });
      },
    },
  },
});
