import type {
  CatalogProvider,
} from "@/modules/catalog/providers/CatalogProvider";

import type {
  Campaign,
  Product,
} from "@/shared/types/product";

export type CatalogShadowDifferenceKind =
  | "missing-left"
  | "missing-right"
  | "value-mismatch";

export interface CatalogShadowDifference {
  kind:
    CatalogShadowDifferenceKind;

  path:
    string;

  left?:
    unknown;

  right?:
    unknown;
}

export interface CatalogShadowSnapshot {
  source:
    string;

  categories:
    readonly string[];

  campaigns:
    readonly CatalogShadowCampaign[];

  products:
    readonly CatalogShadowProduct[];
}

export interface CatalogShadowCampaign {
  id:
    string;

  name:
    string;

  icon:
    string;

  color:
    string | null;

  themeToken:
    string;

  startDate:
    string;

  endDate:
    string;

  priority:
    number;

  publicationStatus:
    string;

  computedStatus:
    string;
}

export interface CatalogShadowProduct {
  id:
    string;

  title:
    string;

  description:
    string;

  category:
    string;

  price_1:
    number;

  price_3:
    number | null;

  price_12:
    number | null;

  price_50:
    number | null;

  price_100:
    number | null;

  price_offer:
    number | null;

  stock:
    number | null;

  img:
    string;

  gallery:
    string | null;

  status:
    string | null;

  badges:
    readonly string[];

  campaigns:
    readonly string[];

  priority:
    number;
}

export interface CatalogShadowComparison {
  equivalent:
    boolean;

  left:
    CatalogShadowSnapshot;

  right:
    CatalogShadowSnapshot;

  differences:
    readonly CatalogShadowDifference[];
}

function normalizeText(
  value:
    unknown,
): string {
  return String(
    value ?? "",
  ).trim();
}

function normalizeNullableNumber(
  value:
    number |
    null |
    undefined,
): number | null {
  return typeof value ===
      "number" &&
    Number.isFinite(
      value,
    )
    ? value
    : null;
}

function normalizeStringList(
  values:
    readonly string[] |
    undefined,
): string[] {
  return [
    ...new Set(
      (
        values ??
        []
      )
        .map(
          normalizeText,
        )
        .filter(
          Boolean,
        ),
    ),
  ].sort(
    (
      left,
      right,
    ) =>
      left.localeCompare(
        right,
      ),
  );
}

function normalizeCampaign(
  campaign:
    Campaign,
): CatalogShadowCampaign {
  return {
    id:
      normalizeText(
        campaign.id,
      ),

    name:
      normalizeText(
        campaign.name,
      ),

    icon:
      normalizeText(
        campaign.icon,
      ),

    color:
      normalizeText(
        campaign.color,
      ) ||
      null,

    themeToken:
      normalizeText(
        campaign.themeToken,
      ),

    startDate:
      normalizeText(
        campaign.startDate,
      ),

    endDate:
      normalizeText(
        campaign.endDate,
      ),

    priority:
      Number.isFinite(
        campaign.priority,
      )
        ? campaign.priority
        : 0,

    publicationStatus:
      normalizeText(
        campaign.publicationStatus,
      ),

    computedStatus:
      normalizeText(
        campaign.computedStatus,
      ),
  };
}

function normalizeProduct(
  product:
    Product,
): CatalogShadowProduct {
  return {
    id:
      normalizeText(
        product.id,
      ),

    title:
      normalizeText(
        product.title,
      ),

    description:
      normalizeText(
        product.description,
      ),

    category:
      normalizeText(
        product.category,
      ),

    price_1:
      Number.isFinite(
        product.price_1,
      )
        ? product.price_1
        : 0,

    price_3:
      normalizeNullableNumber(
        product.price_3,
      ),

    price_12:
      normalizeNullableNumber(
        product.price_12,
      ),

    price_50:
      normalizeNullableNumber(
        product.price_50,
      ),

    price_100:
      normalizeNullableNumber(
        product.price_100,
      ),

    price_offer:
      normalizeNullableNumber(
        product.price_offer,
      ),

    stock:
      normalizeNullableNumber(
        product.stock,
      ),

    img:
      normalizeText(
        product.img,
      ),

    gallery:
      normalizeText(
        product.gallery,
      ) ||
      null,

    status:
      normalizeText(
        product.status,
      ) ||
      null,

    badges:
      normalizeStringList(
        product.badges,
      ),

    campaigns:
      normalizeStringList(
        product.campaigns,
      ),

    priority:
      typeof product.priority ===
          "number" &&
        Number.isFinite(
          product.priority,
        )
        ? product.priority
        : 0,
  };
}

function compareJson(
  left:
    unknown,

  right:
    unknown,

  path:
    string,

  differences:
    CatalogShadowDifference[],
): void {
  if (
    Object.is(
      left,
      right,
    )
  ) {
    return;
  }

  if (
    Array.isArray(
      left,
    ) &&
    Array.isArray(
      right,
    )
  ) {
    const length =
      Math.max(
        left.length,
        right.length,
      );

    for (
      let index = 0;
      index < length;
      index += 1
    ) {
      const itemPath =
        `${path}[${index}]`;

      if (
        index >=
          left.length
      ) {
        differences.push({
          kind:
            "missing-left",

          path:
            itemPath,

          right:
            right[index],
        });

        continue;
      }

      if (
        index >=
          right.length
      ) {
        differences.push({
          kind:
            "missing-right",

          path:
            itemPath,

          left:
            left[index],
        });

        continue;
      }

      compareJson(
        left[index],
        right[index],
        itemPath,
        differences,
      );
    }

    return;
  }

  if (
    typeof left ===
      "object" &&
    left !==
      null &&
    typeof right ===
      "object" &&
    right !==
      null
  ) {
    const leftRecord =
      left as
        Record<
          string,
          unknown
        >;

    const rightRecord =
      right as
        Record<
          string,
          unknown
        >;

    const keys =
      [
        ...new Set([
          ...Object.keys(
            leftRecord,
          ),
          ...Object.keys(
            rightRecord,
          ),
        ]),
      ].sort();

    for (
      const key of
      keys
    ) {
      const itemPath =
        path
          ? `${path}.${key}`
          : key;

      if (
        !(
          key in
            leftRecord
        )
      ) {
        differences.push({
          kind:
            "missing-left",

          path:
            itemPath,

          right:
            rightRecord[
              key
            ],
        });

        continue;
      }

      if (
        !(
          key in
            rightRecord
        )
      ) {
        differences.push({
          kind:
            "missing-right",

          path:
            itemPath,

          left:
            leftRecord[
              key
            ],
        });

        continue;
      }

      compareJson(
        leftRecord[
          key
        ],
        rightRecord[
          key
        ],
        itemPath,
        differences,
      );
    }

    return;
  }

  differences.push({
    kind:
      "value-mismatch",

    path,

    left,

    right,
  });
}

export async function captureCatalogShadowSnapshot(
  provider:
    CatalogProvider,
): Promise<
  CatalogShadowSnapshot
> {
  const campaigns =
    await provider
      .loadCampaigns();

  const categories =
    [
      ...provider
        .getCategories(),
    ]
      .map(
        normalizeText,
      )
      .filter(
        Boolean,
      )
      .sort(
        (
          left,
          right,
        ) =>
          left.localeCompare(
            right,
          ),
      );

  const products:
    Product[] = [];

  for (
    const category of
    categories
  ) {
    products.push(
      ...await provider
        .loadCategoryProducts(
          category,
          campaigns,
        ),
    );
  }

  return {
    source:
      provider.source,

    categories,

    campaigns:
      campaigns
        .map(
          normalizeCampaign,
        )
        .sort(
          (
            left,
            right,
          ) =>
            left.id.localeCompare(
              right.id,
            ),
        ),

    products:
      products
        .map(
          normalizeProduct,
        )
        .sort(
          (
            left,
            right,
          ) =>
            left.category.localeCompare(
              right.category,
            ) ||
            left.id.localeCompare(
              right.id,
            ),
        ),
  };
}

export async function compareCatalogProvidersShadow(
  leftProvider:
    CatalogProvider,

  rightProvider:
    CatalogProvider,
): Promise<
  CatalogShadowComparison
> {
  const [
    left,
    right,
  ] =
    await Promise.all([
      captureCatalogShadowSnapshot(
        leftProvider,
      ),
      captureCatalogShadowSnapshot(
        rightProvider,
      ),
    ]);

  const differences:
    CatalogShadowDifference[] =
      [];

  compareJson(
    {
      categories:
        left.categories,

      campaigns:
        left.campaigns,

      products:
        left.products,
    },

    {
      categories:
        right.categories,

      campaigns:
        right.campaigns,

      products:
        right.products,
    },

    "",
    differences,
  );

  return {
    equivalent:
      differences.length ===
        0,

    left,

    right,

    differences,
  };
}
