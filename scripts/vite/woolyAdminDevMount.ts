import path from "node:path";

import { createServer } from "vite";
import type { Connect, Plugin, ViteDevServer } from "vite";

import { REPO_ROOT } from "./woolyViteShared";

/*
 * W12-03A · Punto de acceso único de desarrollo.
 *
 * Wooly Admin (admin/ui) se ejecuta como una segunda instancia Vite
 * en modo middleware DENTRO del mismo proceso y del mismo servidor
 * HTTP de Wooly Público (puerto 8000). No abre ningún puerto propio.
 *
 *   http://localhost:8000/          → Wooly Público (ui/)
 *   http://localhost:8000/admin/... → Wooly Admin   (admin/ui/, base /admin/)
 *
 * Cada aplicación conserva su configuración, su grafo de módulos,
 * su HTML y su HMR. El WebSocket de HMR de Admin se monta sobre el
 * mismo servidor HTTP en la ruta /admin/ (Vite distingue ambos
 * canales por ruta: "/" para Público y "/admin/" para Admin).
 *
 * Las peticiones a /jung-core y /jung-core-shadow las sigue
 * atendiendo el proxy único de JUNG CORE de la instancia pública.
 */

const ADMIN_CONFIG_FILE = path.resolve(REPO_ROOT, "admin/ui/vite.config.ts");
const ADMIN_BASE = "/admin/";

/* /admin, /admin/..., /admin?x — pero no /admin-auth ni /administrar. */
const ADMIN_PATH = /^\/admin(?:[/?#]|$)/;

export function woolyAdminDevMount(): Plugin {
  let admin: ViteDevServer | undefined;

  return {
    name: "wooly:admin-dev-mount",

    /* Solo `vite` (dev). Nunca en build, preview ni Vitest. */
    apply(_config, env) {
      return env.command === "serve" && !env.isPreview && env.mode !== "test" && !process.env.VITEST;
    },

    async configureServer(server) {
      const httpServer = server.httpServer;

      if (!httpServer) {
        throw new Error("[wooly] Wooly Admin requiere el servidor HTTP de Wooly Público (no compatible con middlewareMode).");
      }

      admin = await createServer({
        configFile: ADMIN_CONFIG_FILE,
        mode: server.config.mode,
        logLevel: server.config.logLevel,
        clearScreen: false,
        server: {
          middlewareMode: true,
          hmr: {
            server: httpServer,
            overlay: false,
          },
        },
      });

      const adminMiddleware: Connect.NextHandleFunction = (req, res, next) => {
        const url = req.url ?? "/";

        if (!admin || !ADMIN_PATH.test(url)) {
          return next();
        }

        /* "/admin" y "/admin?x" se resuelven como la raíz de la base "/admin/". */
        if (url === "/admin" || url.startsWith("/admin?") || url.startsWith("/admin#")) {
          req.url = ADMIN_BASE + url.slice("/admin".length);
        }

        return admin.middlewares(req, res, next);
      };

      /* Registrado antes de los middlewares internos de Público (incluido su fallback SPA). */
      server.middlewares.use(adminMiddleware);

      httpServer.once("close", () => {
        void admin?.close();
      });

      server.config.logger.info("  ➜  Wooly Admin: montado en /admin (mismo puerto, HMR propio)", {
        timestamp: true,
      });
    },
  };
}
