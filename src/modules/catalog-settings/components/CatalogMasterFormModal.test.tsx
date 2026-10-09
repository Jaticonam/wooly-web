import {
  fireEvent,
  render,
  screen,
  waitFor,
} from "@testing-library/react";

import {
  beforeEach,
  describe,
  expect,
  it,
  vi,
} from "vitest";

const api =
  vi.hoisted(
    () => ({
      createAdminCategory:
        vi.fn(),

      updateAdminCategory:
        vi.fn(),

      createAdminCampaign:
        vi.fn(),

      updateAdminCampaign:
        vi.fn(),

      createAdminBadge:
        vi.fn(),

      updateAdminBadge:
        vi.fn(),
    }),
  );

vi.mock(
  "@/modules/admin-auth/services/AdminAuthClient",
  () => ({
    ...api,
  }),
);

import CatalogMasterFormModal from "./CatalogMasterFormModal";

function success() {
  return Promise.resolve({
    success:
      true,

    message:
      "saved",

    data:
      {},
  });
}

describe(
  "CatalogMasterFormModal",
  () => {
    beforeEach(
      () => {
        vi.clearAllMocks();

        api.createAdminCategory
          .mockImplementation(
            success,
          );

        api.updateAdminCategory
          .mockImplementation(
            success,
          );

        api.createAdminCampaign
          .mockImplementation(
            success,
          );

        api.updateAdminCampaign
          .mockImplementation(
            success,
          );

        api.createAdminBadge
          .mockImplementation(
            success,
          );

        api.updateAdminBadge
          .mockImplementation(
            success,
          );
      },
    );

    it(
      "crea categoría con identidad automática y presentación comercial",
      async () => {
        const onSaved =
          vi.fn();

        render(
          <CatalogMasterFormModal
            open
            brandId="brand-1"
            canWrite
            editor={{
              kind:
                "category",

              entity:
                null,
            }}
            onClose={
              vi.fn()
            }
            onSaved={
              onSaved
            }
          />,
        );

        expect(
          screen.queryByText(
            "ID de categoría",
          ),
        ).not.toBeInTheDocument();

        expect(
          screen.queryByText(
            "Slug",
          ),
        ).not.toBeInTheDocument();

        fireEvent.change(
          screen.getByLabelText(
            "Nombre",
          ),
          {
            target: {
              value:
                "Regalos Únicos",
            },
          },
        );

        fireEvent.change(
          screen.getByLabelText(
            "Icono",
          ),
          {
            target: {
              value:
                "🎁",
            },
          },
        );

        fireEvent.change(
          screen.getByLabelText(
            "Color hexadecimal",
          ),
          {
            target: {
              value:
                "#E94F8A",
            },
          },
        );

        fireEvent.change(
          screen.getByLabelText(
            "Prioridad",
          ),
          {
            target: {
              value:
                "80",
            },
          },
        );

        fireEvent.click(
          screen.getByRole(
            "button",
            {
              name:
                "Crear categoría",
            },
          ),
        );

        await waitFor(
          () => {
            expect(
              api.createAdminCategory,
            ).toHaveBeenCalledWith(
              "brand-1",
              expect.objectContaining({
                code:
                  "regalos-unicos",

                name:
                  "Regalos Únicos",

                icon:
                  "🎁",

                slug:
                  "regalos-unicos",

                accentColor:
                  "#E94F8A",

                priority:
                  80,

                status:
                  "DRAFT",

                ogMediaRef:
                  null,
              }),
            );
          },
        );

        expect(
          onSaved,
        ).toHaveBeenCalledTimes(
          1,
        );
      },
    );
    it(
      "crea campaña con identidad técnica automática y campos comerciales",
      async () => {
        render(
          <CatalogMasterFormModal
            open
            brandId="brand-1"
            canWrite
            editor={{
              kind:
                "campaign",

              entity:
                null,
            }}
            onClose={
              vi.fn()
            }
            onSaved={
              vi.fn()
            }
          />,
        );

        expect(
          screen.queryByText(
            "Theme token",
          ),
        ).not.toBeInTheDocument();

        expect(
          screen.queryByText(
            "Slug",
          ),
        ).not.toBeInTheDocument();

        fireEvent.change(
          screen.getByLabelText(
            "Nombre de campaña",
          ),
          {
            target: {
              value:
                "Cyber Wooly 2026",
            },
          },
        );

        fireEvent.change(
          screen.getByLabelText(
            "Icono de campaña",
          ),
          {
            target: {
              value:
                "⚡",
            },
          },
        );

        fireEvent.change(
          screen.getByLabelText(
            "Descripción de campaña",
          ),
          {
            target: {
              value:
                "Campaña Cyber Wooly 2026",
            },
          },
        );

        fireEvent.change(
          screen.getByLabelText(
            "Color hexadecimal",
          ),
          {
            target: {
              value:
                "#FF4F9A",
            },
          },
        );

        fireEvent.change(
          screen.getByLabelText(
            "Prioridad de campaña",
          ),
          {
            target: {
              value:
                "100",
            },
          },
        );

        fireEvent.click(
          screen.getByRole(
            "button",
            {
              name:
                "Crear campaña",
            },
          ),
        );

        await waitFor(
          () => {
            expect(
              api.createAdminCampaign,
            ).toHaveBeenCalledWith(
              "brand-1",
              expect.objectContaining({
                code:
                  "cyber-wooly-2026",

                slug:
                  "cyber-wooly-2026",

                name:
                  "Cyber Wooly 2026",

                description:
                  "Campaña Cyber Wooly 2026",

                icon:
                  "⚡",

                accentColor:
                  "#FF4F9A",

                priority:
                  100,

                publicationStatus:
                  "DRAFT",

                ogMediaRef:
                  null,
              }),
            );
          },
        );

        const input =
          api.createAdminCampaign
            .mock.calls[0][1];

        expect(
          input,
        ).not.toHaveProperty(
          "color",
        );

        expect(
          input,
        ).not.toHaveProperty(
          "themeToken",
        );
      },
    );

    it(
      "edita campaña preservando code y slug canónicos",
      async () => {
        render(
          <CatalogMasterFormModal
            open
            brandId="brand-1"
            canWrite
            editor={{
              kind:
                "campaign",

              entity: {
                id:
                  "campaign-1",

                code:
                  "cyber",

                slug:
                  "cyber",

                name:
                  "Cyber Wooly",

                description:
                  "Campaña original",

                icon:
                  "⚡",

                color:
                  null,

                accentColor:
                  "#E94F8A",

                themeToken:
                  "campaign.default",

                startsAt:
                  null,

                endsAt:
                  null,

                priority:
                  90,

                publicationStatus:
                  "DRAFT",

                ogMediaAssetId:
                  null,

                ogMediaAsset:
                  null,
              },
            }}
            onClose={
              vi.fn()
            }
            onSaved={
              vi.fn()
            }
          />,
        );

        fireEvent.change(
          screen.getByLabelText(
            "Nombre de campaña",
          ),
          {
            target: {
              value:
                "Cyber Wooly Renovado",
            },
          },
        );

        fireEvent.change(
          screen.getByLabelText(
            "Descripción de campaña",
          ),
          {
            target: {
              value:
                "Campaña renovada",
            },
          },
        );

        fireEvent.change(
          screen.getByLabelText(
            "Estado de campaña",
          ),
          {
            target: {
              value:
                "PUBLISHED",
            },
          },
        );

        fireEvent.click(
          screen.getByRole(
            "button",
            {
              name:
                "Guardar cambios",
            },
          ),
        );

        await waitFor(
          () => {
            expect(
              api.updateAdminCampaign,
            ).toHaveBeenCalledWith(
              "brand-1",
              "campaign-1",
              expect.objectContaining({
                code:
                  "cyber",

                slug:
                  "cyber",

                name:
                  "Cyber Wooly Renovado",

                description:
                  "Campaña renovada",

                publicationStatus:
                  "PUBLISHED",
              }),
            );
          },
        );

        const input =
          api.updateAdminCampaign
            .mock.calls[0][2];

        expect(
          input,
        ).not.toHaveProperty(
          "color",
        );

        expect(
          input,
        ).not.toHaveProperty(
          "themeToken",
        );
      },
    );
    it(
      "crea badge merchandising con identidad técnica automática",
      async () => {
        render(
          <CatalogMasterFormModal
            open
            brandId="brand-1"
            canWrite
            editor={{
              kind:
                "badge",

              entity:
                null,
            }}
            onClose={
              vi.fn()
            }
            onSaved={
              vi.fn()
            }
          />,
        );

        expect(
          screen.queryByText(
            "Código",
          ),
        ).not.toBeInTheDocument();

        expect(
          screen.queryByText(
            "Tipo",
          ),
        ).not.toBeInTheDocument();

        expect(
          screen.queryByText(
            "Prioridad",
          ),
        ).not.toBeInTheDocument();

        expect(
          screen.queryByText(
            "Theme token",
          ),
        ).not.toBeInTheDocument();

        fireEvent.change(
          screen.getByLabelText(
            "Nombre de badge",
          ),
          {
            target: {
              value:
                "Recién llegado",
            },
          },
        );

        fireEvent.change(
          screen.getByLabelText(
            "Icono de badge",
          ),
          {
            target: {
              value:
                "✨",
            },
          },
        );

        fireEvent.change(
          screen.getByLabelText(
            "Color hexadecimal",
          ),
          {
            target: {
              value:
                "#06B6D4",
            },
          },
        );

        fireEvent.click(
          screen.getByRole(
            "button",
            {
              name:
                "Crear badge",
            },
          ),
        );

        await waitFor(
          () => {
            expect(
              api.createAdminBadge,
            ).toHaveBeenCalledWith(
              "brand-1",
              expect.objectContaining({
                code:
                  "merchandising.recien-llegado",

                label:
                  "Recién llegado",

                icon:
                  "✨",

                accentColor:
                  "#06B6D4",

                kind:
                  "merchandising",

                priority:
                  50,

                status:
                  "ACTIVE",
              }),
            );
          },
        );

        const input =
          api.createAdminBadge
            .mock.calls[0][1];

        expect(
          input,
        ).not.toHaveProperty(
          "themeToken",
        );
      },
    );

    it(
      "edita badge preservando code kind y priority existentes",
      async () => {
        render(
          <CatalogMasterFormModal
            open
            brandId="brand-1"
            canWrite
            editor={{
              kind:
                "badge",

              entity: {
                id:
                  "badge-promotion-1",

                code:
                  "promotion.flash",

                label:
                  "Promo Flash",

                icon:
                  "⚡",

                accentColor:
                  "#A855F7",

                kind:
                  "promotion",

                themeToken:
                  "promotion.flash",

                priority:
                  120,

                status:
                  "ACTIVE",
              },
            }}
            onClose={
              vi.fn()
            }
            onSaved={
              vi.fn()
            }
          />,
        );

        fireEvent.change(
          screen.getByLabelText(
            "Nombre de badge",
          ),
          {
            target: {
              value:
                "Oferta Flash",
            },
          },
        );

        fireEvent.change(
          screen.getByLabelText(
            "Estado de badge",
          ),
          {
            target: {
              value:
                "INACTIVE",
            },
          },
        );

        fireEvent.click(
          screen.getByRole(
            "button",
            {
              name:
                "Guardar cambios",
            },
          ),
        );

        await waitFor(
          () => {
            expect(
              api.updateAdminBadge,
            ).toHaveBeenCalledWith(
              "brand-1",
              "badge-promotion-1",
              expect.objectContaining({
                code:
                  "promotion.flash",

                label:
                  "Oferta Flash",

                kind:
                  "promotion",

                priority:
                  120,

                status:
                  "INACTIVE",
              }),
            );
          },
        );

        const input =
          api.updateAdminBadge
            .mock.calls[0][2];

        expect(
          input,
        ).not.toHaveProperty(
          "themeToken",
        );
      },
    );
    it(
      "bloquea el guardado si el rol no puede escribir",
      () => {
        render(
          <CatalogMasterFormModal
            open
            brandId="brand-1"
            canWrite={
              false
            }
            editor={{
              kind:
                "badge",

              entity:
                null,
            }}
            onClose={
              vi.fn()
            }
            onSaved={
              vi.fn()
            }
          />,
        );

        expect(
          screen.getByRole(
            "button",
            {
              name:
                "Crear badge",
            },
          ),
        ).toBeDisabled();
      },
    );
  },
);
