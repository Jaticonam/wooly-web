import type { ApplicationConfig } from "./ApplicationConfig";

export const woolyApplicationConfig = {
  app: {
    id: "wooly-web",
    brandId: "wooly",
    name: "Wooly Imports",
    shortName: "Wooly",
  },
  locale: {
    language: "es",
    country: "PE",
    locale: "es-PE",
    currency: "PEN",
    currencyLocale: "es-PE",
  },
  publicSite: {
    origin: "https://www.woolyimports.com",
    domain: "woolyimports.com",
  },
  contact: {
    whatsappNumber: "51936188636",
  },
  assets: {
    logoUrl:
      "https://dl.dropboxusercontent.com/scl/fi/pnsqsg5o0v9sce32wi0n5/Logo_Wooly.png?rlkey=jjfdddx66emkv2rdh9dp4kosd&st=xbp3j3ks&raw=1",
    pdfLogoUrl:
      "https://dl.dropboxusercontent.com/scl/fi/pnsqsg5o0v9sce32wi0n5/Logo_Wooly.png?rlkey=jjfdddx66emkv2rdh9dp4kosd&st=xbp3j3ks&raw=1",
    defaultSeoImageUrl: "/og/og-catalogo.jpg",
    brandStoryImageUrl:
      "https://dl.dropboxusercontent.com/scl/fi/ixrlm1m9hoia84zuuoef5/NAT_AMA_001.jpg?rlkey=07e39hpq6i8hogrdxi6stcqvu&st=o4fc1nh4&raw=1",
    shippingImageUrl:
      "https://scontent.faqp5-1.fna.fbcdn.net/v/t1.6435-9/118468095_3836541133040959_3203898273981614328_n.jpg",
  },
  routes: {
    catalog: "/catalogo",
    productDetail: "/catalogo/producto.html",
    catalogPdf: "/catalogo/pdf",
  },
  commerce: {
    pdfValidityDays: 7,
  },
  catalog: {
    source: "google-sheets",
  },
  catalogPublication: {
    apiBaseUrl: null,
  },
  integrations: {
    meta: {
      brandName: "Wooly Imports",
    },
  },
} as const satisfies ApplicationConfig;
