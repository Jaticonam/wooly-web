import path from "node:path";

import { defineConfig } from "vitest/config";
import react from "@vitejs/plugin-react-swc";

/*
 * W12-02: ejecución unificada de pruebas.
 * - ui        → Wooly Público   (ui/vite.config.ts)
 * - admin     → Wooly Admin     (admin/ui/vite.config.ts)
 * - packages  → contratos y núcleo compartido (packages/*)
 */
const setupFile = path.resolve(__dirname, "packages/shared/src/testing/setup.ts");

export default defineConfig({
  test: {
    projects: [
      "ui/vite.config.ts",
      "admin/ui/vite.config.ts",
      {
        plugins: [react()],
        resolve: {
          alias: {
            "@wooly/contracts": path.resolve(__dirname, "packages/contracts/src"),
            "@wooly/shared": path.resolve(__dirname, "packages/shared/src"),
          },
        },
        test: {
          name: "packages",
          root: __dirname,
          environment: "jsdom",
          globals: true,
          setupFiles: [setupFile],
          include: ["packages/*/src/**/*.{test,spec}.{ts,tsx}"],
        },
      },
    ],
  },
});
