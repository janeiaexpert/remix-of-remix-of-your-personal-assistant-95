import { createFileRoute } from "@tanstack/react-router";

// Diagnóstico Vercel → Bridge (Funnel). Retorna onde exatamente a conexão trava.
// Uso interno; remover após diagnosticar.
export const Route = createFileRoute("/api/diag-bridge")({
  server: {
    handlers: {
      GET: async () => {
        const out: Record<string, unknown> = {};
        const url = (process.env.BRIDGE_URL || "").replace(/\/$/, "");
        const token = process.env.BRIDGE_TOKEN || process.env.JARVIS_TOKEN || "";
        out.hasUrl = !!url;
        out.hasToken = !!token;
        out.host = (() => { try { return new URL(url || "http://x").host; } catch { return "?"; } })();
        if (!url || !token) return Response.json(out);
        // 1) DNS
        try {
          const dns = await import("node:dns/promises");
          const t0 = Date.now();
          const addrs = await dns.lookup(out.host as string, { all: true });
          out.dns = { ok: true, ms: Date.now() - t0, addrs: addrs.map((a) => `${a.address}/${a.family}`).slice(0, 4) };
        } catch (e) {
          out.dns = { ok: false, error: e instanceof Error ? `${e.name}: ${e.message}`.slice(0, 200) : String(e) };
          return Response.json(out);
        }
        // 2) TCP+TLS+HTTP (com verificação TLS normal)
        for (const insecure of [false, true]) {
          const key = insecure ? "httpsInsecure" : "https";
          const prev = process.env.NODE_TLS_REJECT_UNAUTHORIZED;
          if (insecure) process.env.NODE_TLS_REJECT_UNAUTHORIZED = "0";
          try {
            const t0 = Date.now();
            const res = await fetch(`${url}/health`, {
              method: "GET",
              headers: { Authorization: `Bearer ${token}` },
              signal: AbortSignal.timeout(20_000),
            });
            const body = (await res.text()).slice(0, 200);
            out[key] = { ok: res.ok, status: res.status, ms: Date.now() - t0, body };
          } catch (e) {
            out[key] = {
              ok: false,
              error: e instanceof Error ? `${e.name}: ${e.message}`.slice(0, 300) : String(e),
              cause: e instanceof Error && (e as { cause?: unknown }).cause
                ? String((e as { cause?: { code?: string; message?: string } }).cause?.code || (e as { cause?: object }).cause).slice(0, 200)
                : undefined,
            };
          } finally {
            if (prev === undefined) delete process.env.NODE_TLS_REJECT_UNAUTHORIZED;
            else process.env.NODE_TLS_REJECT_UNAUTHORIZED = prev;
          }
        }
        return Response.json(out);
      },
    },
  },
});
