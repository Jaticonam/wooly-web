import {
  act,
  render,
  screen,
} from "@testing-library/react";

import {
  MemoryRouter,
  Route,
  Routes,
} from "react-router-dom";

import {
  beforeEach,
  describe,
  expect,
  it,
  vi,
} from "vitest";

import type {
  Product,
} from "@wooly/contracts/types/product";

import ProductDetailPage from "./ProductDetailPage";

const testState = vi.hoisted(
  () => ({
    products:
      [] as Product[],
  }),
);

vi.mock(
  "@/modules/catalog/hooks/useProducts",
  () => ({
    useProducts: () => ({
      data:
        testState.products,
      isLoading: false,
    }),
  }),
);

vi.mock(
  "@/modules/cart/store",
  () => ({
    useCartStore: () => ({
      cart: [],
      addToCart: vi.fn(),
      removeFromCart: vi.fn(),
      changeQty: vi.fn(),
      setExactQty: vi.fn(),
      setItemNote: vi.fn(),
      replaceCart: vi.fn(),
    clearCart: vi.fn(),
      totalItems: 0,
      totalPrice: 0,
      savings: 0,
    }),
  }),
);

vi.mock(
  "@/modules/product-detail/hooks/useProductViewers",
  () => ({
    useProductViewers:
      () => 1,
  }),
);

vi.mock(
  "@/modules/product-detail/hooks/useRelatedProducts",
  () => ({
    useRelatedProducts:
      () => [],
  }),
);

vi.mock(
  "@/components/layout/FloatingButtons",
  () => ({
    FloatingButtons:
      () => null,
  }),
);

vi.mock(
  "@/components/media/ImageZoomModal",
  () => ({
    ImageZoomModal:
      () => null,
  }),
);

vi.mock(
  "@/components/skeletons/ProductSkeleton",
  () => ({
    ProductSkeleton:
      () => (
        <div>
          Cargando producto
        </div>
      ),
  }),
);

vi.mock(
  "@/modules/cart/components/CartSidebar",
  () => ({
    CartSidebar:
      () => null,
  }),
);

vi.mock(
  "@/modules/cart/components/AddToCartModal",
  () => ({
    AddToCartModal:
      () => null,
  }),
);

vi.mock(
  "@/modules/feedback/components/RecentActivity",
  () => ({
    RecentActivity:
      () => null,
  }),
);

vi.mock(
  "@/modules/product-detail/components/ProductDetailHeader",
  () => ({
    ProductDetailHeader: ({
      product,
    }: {
      product: Product;
    }) => (
      <header>
        {product.title}
      </header>
    ),
  }),
);

vi.mock(
  "@/modules/product-detail/components/ProductGallery",
  () => ({
    ProductGallery: ({
      product,
    }: {
      product: Product;
    }) => (
      <img
        src={product.img}
        alt={`Galería ${product.title}`}
      />
    ),
  }),
);

vi.mock(
  "@/modules/product-detail/components/ProductStockInfo",
  () => ({
    ProductStockInfo:
      () => (
        <div>
          Estado de stock
        </div>
      ),
  }),
);

vi.mock(
  "@/modules/product-detail/components/ProductVolumePriceSelector",
  () => ({
    ProductVolumePriceSelector:
      () => (
        <div>
          Escalas de precio
        </div>
      ),
  }),
);

vi.mock(
  "@/modules/product-detail/components/ProductPriceBlock",
  () => ({
    ProductPriceBlock:
      () => (
        <div>
          Precio comercial
        </div>
      ),
  }),
);

vi.mock(
  "@/modules/product-detail/components/ProductQuantitySelector",
  () => ({
    ProductQuantitySelector:
      () => (
        <div>
          Selector de cantidad
        </div>
      ),
  }),
);

vi.mock(
  "@/modules/product-detail/components/ProductPurchaseActions",
  () => ({
    ProductPurchaseActions: ({
      showWhatsAppButton,
      isPreventa,
      available,
    }: {
      showWhatsAppButton: boolean;
      isPreventa: boolean;
      available: boolean;
    }) => (
      <div>
        {available && (
          <button>
            Agregar al carrito
          </button>
        )}

        {showWhatsAppButton && (
          <button>
            {isPreventa
              ? "Consultar preventa"
              : "Consultar reposición"}
          </button>
        )}
      </div>
    ),
  }),
);

vi.mock(
  "@/modules/product-detail/components/RelatedProducts",
  () => ({
    RelatedProducts:
      () => null,
  }),
);

vi.mock(
  "@/modules/product-detail/components/ProductVolumePriceProgress",
  () => ({
    ProductVolumePriceProgress:
      () => null,
  }),
);

vi.mock(
  "@wooly/shared/catalog",
  async (importOriginal) => ({
    ...await importOriginal<
      typeof import("@wooly/shared/catalog")
    >(),
    ProductSeo: () => (
      <script
        type="application/ld+json"
        data-testid="product-json-ld"
      />
    ),
  }),
);

function createProduct(
  overrides:
    Partial<Product> = {},
): Product {
  return {
    id: "TEST-001",
    title:
      "Producto comercial sensible",
    description:
      "Descripción que no debe filtrarse.",
    category: "flores",
    price_1: 10,
    stock: 20,
    img:
      "https://example.com/product.jpg",
    status: "publicado",
    campaigns: [],
    priority: 0,
    ...overrides,
  };
}

async function renderDetail(
  product?:
    Product,
) {
  testState.products =
    product
      ? [product]
      : [];

  render(
    <MemoryRouter
      initialEntries={[
        "/catalogo/producto.html?id=TEST-001&cat=flores",
      ]}
      future={{
        v7_startTransition: true,
        v7_relativeSplatPath: true,
      }}
    >
      <Routes>
        <Route
          path="/catalogo/producto.html"
          element={
            <ProductDetailPage />
          }
        />
      </Routes>
    </MemoryRouter>,
  );

  await act(
    async () => {
      await vi.advanceTimersByTimeAsync(
        220,
      );
    },
  );
}

describe(
  "ProductDetailPage visibility",
  () => {
    beforeEach(
      () => {
        vi.useFakeTimers();
        testState.products = [];

        vi.stubGlobal(
          "scrollTo",
          vi.fn(),
        );
      },
    );

    it(
      "mantiene la experiencia de producto inexistente",
      async () => {
        await renderDetail();

        expect(
          screen.getByText(
            "Producto no encontrado",
          ),
        ).toBeInTheDocument();
      },
    );

    it.each([
      [
        "publicado disponible",
        {},
        "Agregar al carrito",
      ],
      [
        "preventa",
        {
          status: "preventa",
          price_1: 0,
          stock: null,
        },
        "Consultar preventa",
      ],
      [
        "agotado",
        {
          status: "agotado",
          stock: 0,
        },
        "Consultar reposición",
      ],
    ])(
      "muestra %s con su CTA vigente",
      async (
        _label,
        overrides,
        expectedCta,
      ) => {
        const product =
          createProduct(
            overrides,
          );

        await renderDetail(
          product,
        );

        expect(
          screen.getAllByText(
            product.title,
          ).length,
        ).toBeGreaterThan(0);

        expect(
          screen.getByRole(
            "button",
            {
              name:
                expectedCta,
            },
          ),
        ).toBeInTheDocument();

        expect(
          screen.getByTestId(
            "product-json-ld",
          ),
        ).toBeInTheDocument();
      },
    );

    it.each([
      ["oculto", { status: "oculto" }],
      [
        "borrador",
        { status: "borrador" },
      ],
      [
        "estado desconocido",
        { status: "pendiente" },
      ],
      [
        "stock cero",
        { stock: 0 },
      ],
      [
        "stock negativo",
        { stock: -1 },
      ],
      [
        "stock null",
        { stock: null },
      ],
      [
        "stock NaN",
        { stock: Number.NaN },
      ],
      [
        "stock Infinity",
        {
          stock:
            Number.POSITIVE_INFINITY,
        },
      ],
      [
        "sin precio",
        { price_1: 0 },
      ],
      [
        "estado ausente",
        { status: undefined },
      ],
    ])(
      "oculta %s por URL directa",
      async (
        _label,
        overrides,
      ) => {
        const product =
          createProduct(
            overrides,
          );

        await renderDetail(
          product,
        );

        expect(
          screen.getByText(
            "Producto no encontrado",
          ),
        ).toBeInTheDocument();

        expect(
          screen.queryByText(
            product.title,
          ),
        ).not.toBeInTheDocument();

        expect(
          screen.queryByText(
            "Precio comercial",
          ),
        ).not.toBeInTheDocument();

        expect(
          screen.queryByRole(
            "button",
            {
              name:
                /agregar|consultar/i,
            },
          ),
        ).not.toBeInTheDocument();

        expect(
          screen.queryByTestId(
            "product-json-ld",
          ),
        ).not.toBeInTheDocument();
      },
    );
  },
);
