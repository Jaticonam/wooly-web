# WOOLY /catalogo V2 — Lote 0: Baseline técnico y preparación JUNG CORE

**Fecha:** 2026-10-03  
**Repositorio:** `Jaticonam/wooly-web`  
**Rama:** `main`  
**Baseline auditado:** `bf4899666e459e1e011a687195285702d5fc9d27`

## Objetivo

Congelar el estado técnico de `/catalogo` antes de iniciar la reestructuración premium y establecer las fronteras que permitirán sustituir proveedores legacy por JUNG CORE sin volver a rediseñar la interfaz.

Este lote no modifica comportamiento comercial ni UX de producción. Su salida es un contrato de trabajo para los siguientes lotes.

---

## 1. Superficie actual auditada

### Orquestación principal

- `src/app/pages/CatalogPage.tsx`
- `src/modules/catalog/components/CatalogTopNav.tsx`
- `src/modules/catalog/components/CatalogExploreCenter.tsx`

### Navegación, filtros y búsqueda

- `src/modules/catalog/hooks/useCatalogNavigation.ts`
- `src/modules/catalog/hooks/useCatalogFilters.ts`
- `src/modules/catalog/components/HeaderCategoryFilter.tsx`
- `src/modules/catalog/components/HeaderCampaignFilter.tsx`
- `src/modules/search/components/SearchInput.tsx`
- `src/modules/search/components/SearchBox.tsx`

### Producto y política comercial

- `src/modules/catalog/components/ProductCard.tsx`
- `src/modules/catalog/components/ProductCardBadges.tsx`
- `src/modules/catalog/components/ProductCardPrice.tsx`
- `src/modules/catalog/components/ProductCardStock.tsx`
- `src/modules/catalog/components/ProductVolumePriceBadges.tsx`
- `src/modules/catalog/domain/ProductCommercialPolicy.ts`
- `src/shared/domain/volumePricing/VolumePricing.ts`

### Datos, campañas y prioridades

- `src/modules/catalog/hooks/useCatalogData.ts`
- `src/modules/catalog/context/CatalogCampaignRegistryContext.tsx`
- `src/modules/catalog/hooks/useCatalogPrioritySections.ts`
- `src/modules/catalog/config/categories.ts`
- `src/shared/types/product.ts`

### Compra

- `src/modules/cart/components/AddToCartModal.tsx`
- `src/modules/cart/components/CartSidebar.tsx`
- `src/modules/cart/store/*`
- `src/app/pages/ProductDetailPage.tsx`

---

## 2. Diagnóstico

La base de dominio está mejor desacoplada que la presentación visual. El principal problema de `/catalogo` no es la lógica comercial, sino la jerarquía y densidad de la interfaz.

### Fortalezas que se preservan

1. Pricing escalonado centralizado fuera de la Product Card.
2. Política comercial separada de la UI.
3. Campañas gobernadas mediante registro y reglas de vigencia.
4. Filtros de categoría y campaña sincronizados con URL mediante `cat` y `cpg`.
5. Carga del catálogo encapsulada en hooks/servicios.
6. Product Card ya descompuesta en subcomponentes.
7. Cart/Quick Add separados de la vista principal.
8. Prioridades 100/80/50 y rotación AM/PM ya implementadas.

### Deuda detectada

1. `CatalogTopNav` presenta actualmente la jerarquía Categorías → Campañas → Buscador.
2. Existen componentes de categorías paralelos/legacy además de los usados por el header.
3. Existen estilos que ya no corresponden a elementos renderizados, por ejemplo reglas de logo en `CatalogTopNav.css`.
4. La Product Card mezcla demasiada información permanente: captura, metadata, precio, stock, escalas y CTA.
5. `FloatingButtons` duplica accesos que pasarán a formar parte del nuevo shell.
6. La UI todavía expone nombres legacy de contratos que JUNG CORE reemplazará gradualmente.

---

## 3. Fronteras congeladas durante Lotes 1–5

No deben alterarse salvo que aparezca un bloqueo técnico demostrado:

- `useCatalogData`
- `useCatalogFilters`
- `useCatalogNavigation`
- `CatalogCampaignRegistryContext`
- `ProductCommercialPolicy`
- dominio `VolumePricing`
- store de carrito
- reglas de prioridad 100/80/50
- contratos de publicación/estado comercial

El objetivo es renovar la presentación sin reescribir la maquinaria comercial.

---

## 4. Regla de preparación para JUNG CORE

Los nuevos componentes de UI no deben conocer el origen de los datos.

### Permitido

`provider/adaptador → normalización/dominio → view model/props → UI`

### No permitido

`Google Sheet / CSV / Prisma / R2 / endpoint específico → componente visual`

La migración futura hacia JUNG CORE debe ocurrir sustituyendo el proveedor o adaptador, no reescribiendo Product Card, header, filtros o checkout.

---

## 5. Contratos que debemos proteger

### Producto

La UI debe recibir un producto ya normalizado. No se agregarán nuevas dependencias directas a columnas legacy.

Transición conocida:

- actual: `campaigns`
- futuro CORE: `campaignIds`

Los componentes nuevos no deben depender del nombre legacy cuando pueda resolverse desde una frontera de normalización.

### Campañas

`themeToken` es el contrato semántico futuro. `colorClass` se considera compatibilidad temporal y no debe expandirse como dependencia nueva.

### Categorías

Las vistas no deben codificar categorías comerciales dentro del JSX. Deben consumir configuración/datos.

### Pricing

Los componentes visuales no calculan reglas comerciales. Solo presentan resultados del dominio de pricing.

### Stock y publicación

La UI no debe interpretar directamente estados de Sheet. Debe consumir la política comercial resuelta.

### Media

Las cards no deben depender de que `img` provenga de Sheet. Deben continuar usando/respetando la frontera de media para permitir Media Library + Cloudflare/JUNG CORE.

### Búsqueda y filtros

La anatomía visual debe permitir sustituir el filtrado client-side por búsqueda/filtrado remoto en CORE sin modificar el layout.

---

## 6. CORE Readiness Gate

Todo lote de `/catalogo V2` debe cerrar con:

- UX/UI PASS
- Responsive PASS
- Funcional PASS
- Estados vacíos/loading/error PASS cuando aplique
- Sin nueva dependencia directa de Sheets/CSV en componentes visuales
- Sin reglas de pricing duplicadas en UI
- Sin lógica de publicación duplicada en UI
- Contratos de campañas compatibles con `themeToken`
- Media desacoplada del proveedor
- Typecheck/build/tests/lint según alcance
- Cambio pequeño, reversible y auditable

---

## 7. Alcance de la reestructuración visual

### Lote 1
Shell premium + header + buscador + acceso a Mi Caja.

### Lote 2
Explorar + categorías + campañas.

### Lote 3
Toolbar de resultados, filtros y ordenamiento.

### Lote 4
Product Card V2.

### Lote 5
Mobile premium y densidad de catálogo.

Los lotes posteriores refinan Quick Add, Product Detail, Mi Caja y certificación final.

---

## 8. Condición de cierre del Lote 0

- Baseline técnico identificado.
- Fronteras congeladas.
- Deuda relevante documentada.
- Política de CORE readiness definida.
- Sin cambios de runtime.
- Preparado para iniciar Lote 1.
