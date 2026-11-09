import { createFileRoute } from '@tanstack/react-router'
import { storeVideo } from "@/lib/imagegen.server";

const MAX_BYTES = 4_400_000;

export const Route = createFileRoute("/api/upload")({
  server: {
    handlers: {
      POST: async ({ request }) => {
        const bytes = new Uint8Array(await request.arrayBuffer());
        if (!bytes.length) {
          return Response.json({ error: "Corpo vazio." }, { status: 400 });
        }
        if (bytes.length > MAX_BYTES) {
          return Response.json({ error: "Arquivo maior que 4.4MB; informe o caminho no PC." }, { status: 413 });
        }
        const ct = (request.headers.get("content-type") || "video/mp4").split(";")[0].trim();
        const mediaType = /^video\//i.test(ct)
          ? ct
          : ct === "application/octet-stream"
            ? "video/mp4"
            : ct;
        const key = storeVideo(Buffer.from(bytes).toString("base64"), mediaType);
        return Response.json({ url: `/api/video/${key}`, mediaType });
      },
    },
  },
});
