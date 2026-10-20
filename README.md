# Wooly Web

Monorepo de Wooly (React + Vite + TypeScript) con dos aplicaciones independientes.

| Aplicación | Carpeta | Ruta pública | Dev |
|---|---|---|---|
| Wooly Público | `ui/` | `/` | `npm run dev` → http://localhost:8000/ |
| Wooly Admin | `admin/ui/` | `/admin` | `npm run dev` → http://localhost:8000/admin |

Código compartido (sin dependencias hacia las aplicaciones):

- `packages/contracts` (`@wooly/contracts`): contratos, tipos, modelos y reglas puras.
- `packages/shared` (`@wooly/shared`): núcleo de catálogo (proveedores, integraciones JUNG CORE, componentes de producto, estilos base).

`npm run dev` levanta un único servidor en el puerto 8000 que despacha ambas aplicaciones (Admin se monta en `/admin` dentro del mismo proceso, con HMR propio). El puerto 8001 pertenece a Gleemour y Wooly no lo usa; 8500 queda reservado para la futura operación independiente de Admin (inactivo).

## Instalación
npm install

## Desarrollo
npm run dev          # Wooly Público (/) + Wooly Admin (/admin) en http://localhost:8000

## Verificación
npm run typecheck    # contracts, shared, ui, admin y scripts
npm test             # proyectos ui, admin y packages
npm run lint

## Build
npm run build        # dist/ (Público) + dist/admin/ (Admin)
npm run build:ui
npm run build:admin

Arquitectura y decisiones de la migración: `docs/W12-02_MIGRACION_ESTRUCTURAL.md`.
