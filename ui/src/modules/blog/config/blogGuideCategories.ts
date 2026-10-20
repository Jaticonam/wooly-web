export const BLOG_GUIDE_CATEGORIES = [
  { id: "all", label: "Todos", emoji: "🔥", href: "/blog/guias" },
  {
    id: "productos",
    label: "Productos",
    emoji: "📦",
    href: "/blog/guias?cat=productos",
  },
  {
    id: "ventas",
    label: "Ventas",
    emoji: "💰",
    href: "/blog/guias?cat=ventas",
  },
  {
    id: "tendencias",
    label: "Tendencias",
    emoji: "📈",
    href: "/blog/guias?cat=tendencias",
  },
  {
    id: "campañas",
    label: "Campañas",
    emoji: "📅",
    href: "/blog/guias?cat=campañas",
  },
  {
    id: "negocios",
    label: "Negocios",
    emoji: "💡",
    href: "/blog/guias?cat=negocios",
  },
  {
    id: "estrategias",
    label: "Estrategias",
    emoji: "🚀",
    href: "/blog/guias?cat=estrategias",
  },
] as const;
