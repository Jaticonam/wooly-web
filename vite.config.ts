import { defineConfig, loadEnv } from "vite";
import react from "@vitejs/plugin-react-swc";
import path from "path";
import { componentTagger } from "lovable-tagger";

// https://vitejs.dev/config/
export default defineConfig(({ mode }) => {
  const jungCoreShadowReadKey =
    mode === "development"
      ? process.env.JUNG_CORE_READ_KEY?.trim()
      : undefined;

  const jungCoreShadowHeaders =
    jungCoreShadowReadKey
      ? {
          "x-jung-core-read-key":
            jungCoreShadowReadKey,
        }
      : {};

  const masterWriteKey = mode === "development" ? process.env.JUNG_CORE_WRITE_KEY?.trim() || loadEnv(mode, process.cwd(), "JUNG_CORE_WRITE_KEY").JUNG_CORE_WRITE_KEY?.trim() : undefined;

  const jungCoreDevTarget =
    process.env.JUNG_CORE_DEV_ORIGIN?.trim() ||
    "http://127.0.0.1:3000";
  return {
    server: {
      host: "::",
      port: 8080,

      /*
       * C2C.9A:
       * Wooly local consume CORE :3000 sin exponer
       * CORS ni credenciales al navegador.
       *
       * Ejemplo:
       * /jung-core/products -> http://127.0.0.1:3000/products
       */
      proxy: {
        "/jung-core": {
          target: jungCoreDevTarget,
          configure(proxy) {
            proxy.on("proxyReq", (proxyRequest, request) => {
              if (masterWriteKey && request.method === "POST" && /^\/catalog-bulk\/brands\/[^/]+\/google-sheets\/[^/]+\/temporary-master\/(preview|prepare|apply)$/.test(proxyRequest.path)) proxyRequest.setHeader("x-jung-core-write-key", masterWriteKey);
            });
          },
          changeOrigin: true,
          rewrite: (requestPath) =>
            requestPath.replace(/^\/jung-core/, ""),
        },

        ...(
          mode === "development"
            ? {
                /*
                 * 2C.1 Shadow:
                 *
                 * La credencial se lee exclusivamente
                 * en el proceso Node de Vite.
                 *
                 * Nunca entra al bundle React.
                 */
                "/jung-core-shadow": {
                  target:
                    "http://127.0.0.1:3000",

                  changeOrigin:
                    true,

                  headers:
                    jungCoreShadowHeaders,

                  rewrite:
                    () =>
                      "/internal/catalog/snapshots/wooly",
                },
              }
            : {}
        ),
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

    resolve: {
      alias: {
        "@": path.resolve(
          __dirname,
          "./src",
        ),
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
  };
});