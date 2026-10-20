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
} from "../../scripts/vite/woolyViteShared";

/*
 * W12-02 · Wooly Admin (admin/ui/)
 * Se publica bajo /admin del mismo dominio: dist/admin/
 */
export default defineConfig(({ mode }) => ({
  root: __dirname,
  base: "/admin/",
  envDir: REPO_ROOT,

  server: {
    host: "::",
    port: WOOLY_ADMIN_DEV_PORT,
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
  ].filter(Boolean),

  css: {
    postcss: woolyPostcss(__dirname),
  },

  resolve: {
    alias: woolyAliases(path.resolve(__dirname, "src")),
    dedupe: WOOLY_DEDUPE,
  },

  build: {
    outDir: path.resolve(REPO_ROOT, "dist/admin"),
    emptyOutDir: true,
    cssMinify: false,
  },

  test: {
    name: "admin",
    root: __dirname,
    environment: "jsdom",
    globals: true,
    setupFiles: [path.resolve(REPO_ROOT, "packages/shared/src/testing/setup.ts")],
    include: ["src/**/*.{test,spec}.{ts,tsx}"],
  },
}));
