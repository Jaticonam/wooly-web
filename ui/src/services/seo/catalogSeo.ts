import {
  buildCatalogPublicUrl,
  buildPublicUrl,
  getApplicationConfig,
} from "@wooly/shared/config/application";

const applicationConfig = getApplicationConfig();
const publicUrl = (path: string) =>
  buildPublicUrl(path, applicationConfig);

export interface SeoData {
  title: string;
  description: string;
  canonical: string;
  image: string;
}

export const DEFAULT_CATALOG_SEO: SeoData = {
  title: "Catálogo Mayorista para Emprendedores | Wooly Import Store",
  description:
    "Explora el catálogo mayorista de Wooly Import Store: flores, cajas, globos, peluches, papeles, accesorios y productos de alta rotación con envíos a todo el Perú.",
  canonical: buildCatalogPublicUrl(applicationConfig),
  image: publicUrl(applicationConfig.assets.defaultSeoImageUrl),
};

export const CATALOG_CATEGORY_SEO: Record<string, SeoData> = {
  flores: {
    title: "Flores Mayoristas en Perú | Wooly Import Store",
    description:
      "Compra flores mayoristas para florerías, emprendedores y negocios de regalos. Productos de alta rotación con envíos a todo el Perú.",
    canonical: publicUrl("/categorias/flores.html"),
    image: publicUrl("/og/og-flores.jpg"),
  },
  peluches: {
    title: "Peluches Mayoristas para Regalos | Wooly Import Store",
    description:
      "Peluches por mayor para emprendedores, tiendas de regalos y campañas especiales como San Valentín y Día de la Madre.",
    canonical: publicUrl("/categorias/peluches.html"),
    image: publicUrl("/og/og-peluches.jpg"),
  },
  papeles: {
    title: "Papeles Decorativos por Mayor | Wooly Import Store",
    description:
      "Papeles para envolver regalos, arreglos florales, detalles y empaques creativos para negocios.",
    canonical: publicUrl("/categorias/papeles.html"),
    image: publicUrl("/og/og-papeles.jpg"),
  },
  cajas: {
    title: "Cajas para Regalos por Mayor | Wooly Import Store",
    description:
      "Cajas decorativas y empaques para regalos, flores, detalles y emprendimientos con envíos a todo el Perú.",
    canonical: publicUrl("/categorias/cajas.html"),
    image: publicUrl("/og/og-cajas.jpg"),
  },
  cintas: {
    title: "Cintas Decorativas por Mayor | Wooly Import Store",
    description:
      "Cintas para regalos, arreglos, empaques y decoración comercial. Ideales para emprendedores creativos.",
    canonical: publicUrl("/categorias/cintas.html"),
    image: publicUrl("/og/og-cintas.jpg"),
  },
  globos: {
    title: "Globos por Mayor para Decoración | Wooly Import Store",
    description:
      "Globos para cumpleaños, celebraciones, detalles, campañas y negocios de decoración. Compra mayorista en Perú.",
    canonical: publicUrl("/categorias/globos.html"),
    image: publicUrl("/og/og-globos.jpg"),
  },
  accesorios: {
    title: "Accesorios para Regalos por Mayor | Wooly Import Store",
    description:
      "Accesorios decorativos para complementar regalos, arreglos, empaques y productos de alta rotación.",
    canonical: publicUrl("/categorias/accesorios.html"),
    image: publicUrl("/og/og-accesorios.jpg"),
  },
  llaveros: {
    title: "Llaveros por Mayor para Regalos | Wooly Import Store",
    description:
      "Llaveros y detalles pequeños para tiendas, campañas, regalos corporativos y emprendedores.",
    canonical: publicUrl("/categorias/llaveros.html"),
    image: publicUrl("/og/og-llaveros.jpg"),
  },
  hotwheels: {
    title: "Hot Wheels por Mayor en Perú | Wooly Import Store",
    description:
      "Autos Hot Wheels por mayor para tiendas, coleccionistas, emprendedores y negocios de juguetes.",
    canonical: publicUrl("/categorias/hotwheels.html"),
    image: publicUrl("/og/og-hotwheels.jpg"),
  },
};

export const getCatalogSeo = (category: string) =>
  category !== "todas" && CATALOG_CATEGORY_SEO[category]
    ? CATALOG_CATEGORY_SEO[category]
    : DEFAULT_CATALOG_SEO;
