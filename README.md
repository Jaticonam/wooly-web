# Wooly Web

Monorepo de Wooly (React + Vite + TypeScript) con dos aplicaciones independientes.

| Aplicación | Carpeta | Ruta pública | Dev |
|---|---|---|---|
| Wooly Público | `ui/` | `/` | `npm run dev` (puerto 8000) |
| Wooly Admin | `admin/ui/` | `/admin` | `npm run dev:admin` (puerto 8001) |

Código compartido (sin dependencias hacia las aplicaciones):

- `packages/contracts` (`@wooly/contracts`): contratos, tipos, modelos y reglas puras.
- `packages/shared` (`@wooly/shared`): núcleo de catálogo (proveedores, integraciones JUNG CORE, componentes de producto, estilos base).

Con ambos servidores de desarrollo activos, `http://localhost:8000/admin` sirve Wooly Admin a través del proxy de Wooly Público.

## Instalación
npm install

## Desarrollo
npm run dev          # Wooly Público
npm run dev:admin    # Wooly Admin

## Verificación
npm run typecheck    # contracts, shared, ui, admin y scripts
npm test             # proyectos ui, admin y packages
npm run lint

## Build
npm run build        # dist/ (Público) + dist/admin/ (Admin)
npm run build:ui
npm run build:admin

Arquitectura y decisiones de la migración: `docs/W12-02_MIGRACION_ESTRUCTURAL.md`.
