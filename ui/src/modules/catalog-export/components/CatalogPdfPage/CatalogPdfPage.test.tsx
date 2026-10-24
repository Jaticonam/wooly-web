import {
  fireEvent,
  render,
  screen,
} from "@testing-library/react";

import {
  beforeEach,
  describe,
  expect,
  it,
  vi,
} from "vitest";

import CatalogPdfPage from "./CatalogPdfPage";

const model = vi.hoisted(() => ({
  current: {} as Record<string, unknown>,
}));

vi.mock(
  "../../hooks/useCatalogPdfPageModel",
  () => ({
    useCatalogPdfPageModel: () =>
      model.current,
  }),
);

const baseModel = (
  overrides: Record<string, unknown>,
) => ({
  generatedAt: "22/10/2026",
  validUntil: "29/10/2026",
  copy: {
    title: "Catálogo Mayorista",
    subtitle: "",
    segmentLabel: "",
    segmentType: "general",
  },
  products: [],
  categorySections: [],
  selectionIsReady: false,
  hasProducts: false,
  showCategorySections: false,
  showLoadingState: false,
  showEmptyState: false,
  isPublicId: true,
  publicPublicationStatus: "loading",
  publicPublicationRetryAfterSeconds: undefined,
  canRetryPublicPublication: false,
  retryPublicPublication: vi.fn(),
  ...overrides,
});

describe(
  "CatalogPdfPage — HTTP 429 (P4-SEC-03)",
  () => {
    beforeEach(() => {
      model.current =
        baseModel({});
    });

    it(
      "muestra indisponibilidad temporal con la espera y el reintento bloqueado",
      () => {
        model.current =
          baseModel({
            publicPublicationStatus: "rate-limited",
            publicPublicationRetryAfterSeconds: 90,
            canRetryPublicPublication: false,
          });

        render(<CatalogPdfPage />);

        expect(
          screen.getByText(
            "Catálogo temporalmente no disponible",
          ),
        ).toBeInTheDocument();

        expect(
          screen.getByText(
            "Espera 2 minutos antes de intentarlo nuevamente.",
          ),
        ).toBeInTheDocument();

        expect(
          screen.getByRole("button", {
            name: "Reintentar",
          }),
        ).toBeDisabled();
      },
    );

    it(
      "permite el reintento manual cuando vence la espera",
      () => {
        const retry =
          vi.fn();

        model.current =
          baseModel({
            publicPublicationStatus: "rate-limited",
            publicPublicationRetryAfterSeconds: 30,
            canRetryPublicPublication: true,
            retryPublicPublication: retry,
          });

        render(<CatalogPdfPage />);

        expect(
          screen.getByText(
            "Ya puedes intentarlo nuevamente.",
          ),
        ).toBeInTheDocument();

        fireEvent.click(
          screen.getByRole("button", {
            name: "Reintentar",
          }),
        );

        expect(retry).toHaveBeenCalledTimes(1);
      },
    );

    it.each([
      ["revoked", "Este catálogo ya no está disponible"],
      ["not-found", "Catálogo no encontrado"],
      ["error", "No pudimos abrir este catálogo"],
      ["expired", "Este catálogo ha vencido"],
    ])(
      "conserva el estado %s sin botón de reintento",
      (
        status,
        title,
      ) => {
        model.current =
          baseModel({
            publicPublicationStatus: status,
          });

        render(<CatalogPdfPage />);

        expect(
          screen.getByText(title),
        ).toBeInTheDocument();

        expect(
          screen.queryByRole("button", {
            name: "Reintentar",
          }),
        ).not.toBeInTheDocument();

        expect(
          screen.queryByText(
            "Catálogo temporalmente no disponible",
          ),
        ).not.toBeInTheDocument();
      },
    );
  },
);
