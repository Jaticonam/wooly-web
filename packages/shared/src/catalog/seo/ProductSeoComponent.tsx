import {
  Helmet,
} from "react-helmet-async";

import type {
  Product,
} from "@wooly/contracts/types/product";

import type {
  ProductSeoData,
} from "./productSeo";

import {
  buildProductSeoSchema,
} from "./ProductSeoSchema";

interface Props {
  seo:
    ProductSeoData;

  product?:
    Product |
    null;
}

export function ProductSeo({
  seo,
  product,
}: Props) {
  const schemaResult =
    product
      ? buildProductSeoSchema(
          product,
          seo,
        )
      : null;

  return (
    <Helmet>
      <title>
        {seo.title}
      </title>

      <meta
        name="description"
        content={
          seo.description
        }
      />

      <link
        rel="canonical"
        href={
          seo.canonical
        }
      />

      <meta
        property="og:type"
        content="product"
      />

      <meta
        property="og:title"
        content={
          seo.title
        }
      />

      <meta
        property="og:description"
        content={
          seo.description
        }
      />

      <meta
        property="og:url"
        content={
          seo.canonical
        }
      />

      <meta
        property="og:image"
        content={
          seo.image
        }
      />

      <meta
        name="twitter:title"
        content={
          seo.title
        }
      />

      <meta
        name="twitter:description"
        content={
          seo.description
        }
      />

      <meta
        name="twitter:image"
        content={
          seo.image
        }
      />

      {schemaResult?.ok && (
        <script type="application/ld+json">
          {schemaResult.json}
        </script>
      )}
    </Helmet>
  );
}
