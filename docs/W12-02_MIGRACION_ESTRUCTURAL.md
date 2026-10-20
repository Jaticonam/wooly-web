# W12-02 · Migración estructural Wooly Público / Wooly Admin

**HEAD base:** `96a05c7` (main) · **Fecha:** 2026-10-20 · **Estado:** PASS (pendiente de commit autorizado)

## Estructura resultante

```text
wooly-web/
├── ui/                     Wooly Público → se publica en /        (dist/)
│   ├── public/             assets públicos (sin cambios de contenido)
│   ├── src/{app,pages,modules,components,services,hooks,contexts,
│   │        constants,data,styles,utils,tests}
│   ├── index.html · vite.config.ts · tsconfig.json · tailwind.config.ts · components.json
├── admin/ui/               Wooly Admin → se publica en /admin     (dist/admin/)
│   ├── src/{app,pages,modules,components,types,styles}
│   ├── index.html · vite.config.ts · tsconfig.json · tailwind.config.ts
├── packages/
│   ├── contracts/          @wooly/contracts — contratos, tipos, modelos y reglas puras
│   └── shared/             @wooly/shared    — núcleo de catálogo compartido
├── scripts/                CLI operativas (tsx) + scripts/vite/woolyViteShared.ts
├── docs/ · .github/ · package.json · tailwind.config.ts (preset) · vitest.config.ts
```

## Reglas de dependencia

| Desde → hacia | ui | admin/ui | @wooly/shared | @wooly/contracts |
|---|---|---|---|---|
| ui | ✓ | ✗ | ✓ | ✓ |
| admin/ui | ✗ | ✓ | ✓ | ✓ |
| packages/shared | ✗ | ✗ | ✓ | ✓ |
| packages/contracts | ✗ | ✗ | ✗ | ✓ |

- `@/` solo existe dentro de cada aplicación y apunta a su propio `src/`.
- `packages/contracts` no declara el alias `@wooly/shared`: una importación inversa no compila.

## Criterio de clasificación

La asignación se derivó del grafo real de importaciones (777 archivos, ~1.800 aristas):

- alcanzable solo desde rutas públicas → `ui/`
- alcanzable solo desde rutas administrativas → `admin/ui/`
- alcanzable desde ambas → paquete compartido (cerrado bajo sus dependencias)
  - sin dependencias de runtime/UI → `packages/contracts`
  - con runtime (proveedores JUNG CORE, hooks, componentes de precio/badges, toaster/tooltip) → `packages/shared`
- pruebas: junto al código que ejercitan; huérfanos: por quién los importa (incluidas las CLI de `scripts/`).

`packages/shared` existe porque el núcleo de catálogo (lectura de JUNG CORE, composición, publicación pública, badges y precios) es código de runtime usado por ambas aplicaciones; duplicarlo violaría la regla 6 y no es un "contrato".

## Despliegue y rutas

- Admin conserva sus rutas absolutas históricas (`/admin`, `/admin/login`, `/admin/catalogos`, `/admin/configuracion/catalogo`, `/admin/commercial`, `/admin/integrations/*`) con `base: "/admin/"`.
- `/ventas/catalogos` (Público) redirige con recarga completa a `/admin/catalogos`.
- `.htaccess` (workflow Hostinger): `^admin(/.*)?$ → admin/index.html` antes del fallback público.
- Desarrollo: **actualizado en W12-03A** — `npm run dev` levanta un único servidor en 8000 que sirve Público en `/` y Admin en `/admin` (sin proceso en 8001). El proxy `/jung-core` es único y compartido (`scripts/vite/woolyViteShared.ts`).

## Estilos globales

- Compartidos (`packages/shared/src/styles`): tokens/base, utilidades, animaciones, badges y tarjeta de producto.
- `ui/src/styles/index.css`: mismo orden de cascada que antes + estilos comerciales.
- `admin/ui/src/styles/index.css`: solo los estilos compartidos + Tailwind.

## Rutas de archivos de CLI

Las CLI se ejecutan desde la raíz; las rutas `public/...` pasaron a `ui/public/...` (exports, history, previews, reports, config y pdf-images).

## Reversión

`git reset --hard 96a05c7` antes del commit, o el bundle verificado en `.migration-backup/W12-02-*/` (SHA256SUMS incluido).
