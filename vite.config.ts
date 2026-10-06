import { defineConfig } from "vite";
import react from "@vitejs/plugin-react-swc";
import path from "path";
import { componentTagger } from "lovable-tagger";

// https://vitejs.dev/config/
export default defineConfig(({ mode }) => ({
  server: {
    host: "::",
    port: 8080,

    /*
     * C2C.9A:
     * Wooly local puede consumir CORE :8080 sin exponer
     * CORS ni credenciales al navegador.
     *
     * Ejemplo:
     * /jung-core/products -> http://127.0.0.1:8080/products
     */
    proxy: {
      "/jung-core": {
        target: "http://127.0.0.1:8080",
        changeOrigin: true,
        rewrite: (requestPath) =>
          requestPath.replace(/^\/jung-core/, ""),
      },
    },

    hmr: {
      overlay: false,
    },
  },

  plugins: [react(), mode === "development" && componentTagger()].filter(Boolean),

  resolve: {
    alias: {
      "@": path.resolve(__dirname, "./src"),
    },
    dedupe: [
      "react",
      "react-dom",
      "react/jsx-runtime",
      "react/jsx-dev-runtime",
      "@tanstack/react-query",
      "@tanstack/query-core",
    ],
  },

  build: {
    cssMinify: false,
  },
}));
