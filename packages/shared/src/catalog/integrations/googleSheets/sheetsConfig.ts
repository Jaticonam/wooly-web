export const PRODUCT_SHEETS_CONFIG = [
  {
    category: "flores",
    docId: "14HvNWxOltXtr3NUKXUpbK0ah5DG-atKz7UqTkq-p5lk",
    gid: "999826345",
  },
  {
    category: "peluches",
    docId: "1-LdkBcXRDBIAkVOjQ2QLusgqKmGjAOAZeyO7C8_TIow",
    gid: "849795903",
  },
  {
    category: "papeles",
    docId: "1Y19zwLoqf2x6FFyrQJSYZFfldFWNOpZe0EdrLl6tsuM",
    gid: "1583553647",
  },
  {
    category: "cajas",
    docId: "1g0ZKFSPYi30P9DFfwPSvTIFtt-5kM1ZuOUqvxbyKfcM",
    gid: "1169240357",
  },
  {
    category: "cintas",
    docId: "1RxaXXw8jRmwmMvky_nJP8IbgdmqezkXInS2WcnNKlVk",
    gid: "1583553647",
  },
  {
    category: "globos",
    docId: "17-KL3wegV3DQolFBukLiFen5Co0_Q7lgAHXwE0U5dNI",
    gid: "1169240357",
  },
  {
    category: "accesorios",
    docId: "1WDA6BzHWzeD57YJWKGD0SGzXDDcKvRXLU1lrXOJU-JE",
    gid: "1381335916",
  },
  {
    category: "llaveros",
    docId: "1CI5Waxa4AnyEPFK5okCVKJhqEZhsonqAUynl54mf_xg",
    gid: "849795903",
  },
  {
    category: "hotwheels",
    docId: "1maHH-C8kYc5GyKeg4O0kxKWtxFLb6Pz5GbxkV6w-E_8",
    gid: "465428229",
  },
] as const;

export const CAMPAIGNS_SHEET_CONFIG = {
  name: "Campaigns",
  docId: "1B_s6fXN6FLLeu0F6KBB2fFCNPMIvXBvNEDG1Mubk7qk",
  gid: "1364232111",
} as const;

export const SHEETS_CONFIG = PRODUCT_SHEETS_CONFIG;

export type SheetSource = (typeof PRODUCT_SHEETS_CONFIG)[number];
export type CatalogCategoryId = SheetSource["category"];
