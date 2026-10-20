/// <reference types="vitest/config" />
import path from "node:path";

import { defineConfig } from "vite";
import react from "@vitejs/plugin-react-swc";
import { componentTagger } from "lovable-tagger";

import {
  REPO_ROOT,
  WOOLY_DEDUPE,
  jungCoreDevProxy,
  woolyAliases,
  woolyPostcss,
} from "../scripts/vite/woolyViteShared";
import { woolyAdminDevMount } from "../scripts/vite/woolyAdminDevMount";

/*
 * W12-02 · Wooly Público (ui/)
 * Se publica en la raíz del dominio: dist/
 *
 * W12-03A · En desarrollo, este servidor (puerto 8000) es el único
 * punto de acceso: también sirve Wooly Admin en /admin mediante
 * woolyAdminDevMount (misma instancia HTTP, sin puertos adicionales).
 */
export default defineConfig(({ mode }) => ({
  root: __dirname,
  cacheDir: path.resolve(__dirname, "node_modules/.vite"),
  envDir: REPO_ROOT,

  server: {
    host: "::",
    port: 8000,
    strictPort: true,
    proxy: jungCoreDevProxy(mode),

    hmr: {
      overlay: false,
    },
  },

  plugins: [
    react(),
    mode === "development" &&
      componentTagger(),
    woolyAdminDevMount(),
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
