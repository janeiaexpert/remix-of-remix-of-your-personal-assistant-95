import { createFileRoute } from '@tanstack/react-router'
import { getVideo } from "@/lib/imagegen.server";

export const Route = createFileRoute("/api/video/$key")({
  server: {
    handlers: {
      GET: async ({ request }) => {
        const url = new URL(request.url);
        const key = (url.pathname.split("/").pop() || "").trim();
        const video = key ? getVideo(key) : null;
        if (!video) {
          return new Response("Video expirado ou inexistente, senhor.", {
            status: 404,
            headers: { "Content-Type": "text/plain; charset=utf-8", "Cache-Control": "no-store" },
          });
        }
        const bytes = Buffer.from(video.data, "base64");
        return new Response(new Uint8Array(bytes), {
          headers: {
            "Content-Type": video.mediaType,
            "Content-Length": String(bytes.length),
            "Cache-Control": "public, max-age=600",
          },
        });
      },
    },
  },
});
