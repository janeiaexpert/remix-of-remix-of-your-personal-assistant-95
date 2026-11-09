// @lovable.dev/vite-tanstack-config already includes the following — do NOT add them manually
// or the app will break with duplicate plugins:
//   - TanStack devtools (dev-only, first), tanstackStart, viteReact, tailwindcss, tsConfigPaths,
//     nitro (build-only using cloudflare as a default target), VITE_* env injection, @ path alias,
//     React/TanStack dedupe, error logger plugins, and sandbox detection (port/host/strictPort).
// You can pass additional config via defineConfig({ vite: { ... }, etc... }) if needed.
import { defineConfig } from "@lovable.dev/vite-tanstack-config";

export default defineConfig({
  // Nitro só na Vercel (auto-detecta e aplica o preset `vercel`).
  // Localmente ficamos com o build padrão do TanStack Start (dist/ + vite preview),
  // que é o que o poller do Telegram (porta 8080) consome.
  nitro: process.env.VERCEL ? {} : false,
  tanstackStart: {
    // Redirect TanStack Start's bundled server entry to src/server.ts (our SSR error wrapper).
    // nitro/vite builds from this
    server: { entry: "server" },
  },
  vite: {
    // Vite 6 blocks unknown Host headers with 403 — needed for the
    // https://*.trycloudflare.com tunnel to reach the dev server.
    server: {
      allowedHosts: true,
    },
    build: {
      rollupOptions: {
        external: ["node:fs", "node:path", "node:os"],
      },
    },
  },
});
