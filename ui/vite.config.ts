/// <reference types="vitest/config" />
import path from "node:path";

import { defineConfig } from "vite";
import react from "@vitejs/plugin-react-swc";
import { componentTagger } from "lovable-tagger";

import {
  REPO_ROOT,
  WOOLY_ADMIN_DEV_PORT,
  WOOLY_DEDUPE,
  jungCoreDevProxy,
  woolyAliases,
  woolyPostcss,
} from "../scripts/vite/woolyViteShared";

/*
 * W12-02 · Wooly Público (ui/)
 * Se publica en la raíz del dominio: dist/
 */
export default defineConfig(({ mode }) => ({
  root: __dirname,
  envDir: REPO_ROOT,

  server: {
    host: "::",
    port: 8000,
    strictPort: true,
    proxy: {
      ...jungCoreDevProxy(mode),

      /*
       * Desarrollo integrado: Wooly Admin (npm run dev:admin)
       * queda accesible en http://localhost:8000/admin
       * igual que antes de la separación.
       */
      "/admin": {
        target: `http://127.0.0.1:${WOOLY_ADMIN_DEV_PORT}`,
        ws: true,
      },
    },

    hmr: {
      overlay: false,
    },
  },

  plugins: [
    react(),
    mode === "development" &&
      componentTagger(),
  ].filter(Boolean),

  css: {
    postcss: woolyPostcss(__dirname),
  },

  resolve: {
    alias: woolyAliases(path.resolve(__dirname, "src")),
    dedupe: WOOLY_DEDUPE,
  },

  build: {
    outDir: path.resolve(REPO_ROOT, "dist"),
    emptyOutDir: true,
    cssMinify: false,
  },

  test: {
    name: "ui",
    root: __dirname,
    environment: "jsdom",
    globals: true,
    setupFiles: [path.resolve(REPO_ROOT, "packages/shared/src/testing/setup.ts")],
    include: ["src/**/*.{test,spec}.{ts,tsx}"],
  },
}));
