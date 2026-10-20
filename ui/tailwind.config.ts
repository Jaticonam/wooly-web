import path from "node:path";

import type { Config } from "tailwindcss";

import woolyPreset from "../tailwind.config";

/*
 * W12-02: Tailwind de Wooly Público.
 * Escanea solo su propio código y los paquetes compartidos.
 */
export default {
  presets: [woolyPreset],
  content: [
    path.resolve(__dirname, "index.html"),
    path.resolve(__dirname, "src/**/*.{ts,tsx}"),
    path.resolve(__dirname, "../packages/shared/src/**/*.{ts,tsx}"),
  ],
} satisfies Config;
