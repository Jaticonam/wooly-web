import {
  describe,
  expect,
  it,
} from "vitest";

import {
  CATALOG_COMPOSITION_DRAFTS_KEY,
  LocalCatalogCompositionProvider,
  readCatalogCompositionDraftsPayload,
} from "@/modules/catalog/integrations/local/LocalCatalogCompositionProvider";

import {
  createEmptyCatalogComposition,
} from "@/modules/catalog/domain/CatalogComposition";

class MemoryStorage {
  private readonly values =
    new Map<string, string>();

  getItem(
    key: string,
  ) {
    return (
      this.values.get(
        key,
      ) ??
      null
    );
  }

  setItem(
    key: string,
    value: string,
  ) {
    this.values.set(
      key,
      value,
    );
  }
}

describe(
  "LocalCatalogCompositionProvider",
  () => {
    it(
      "crea y lista un borrador V3",
      async () => {
        const storage =
          new MemoryStorage();

        const provider =
          new LocalCatalogCompositionProvider({
            storage,

            now: () =>
              new Date(
                "2026-08-07T20:00:00.000Z",
              ),

            createId: () =>
              "CAT-2026-TEST0001",
          });

        const created =
          await provider.createDraft({
            name:
              "Cliente María",

            composition:
              createEmptyCatalogComposition(
                "manual",
              ),
          });

        expect(
          created,
        ).toMatchObject({
          id:
            "CAT-2026-TEST0001",

          name:
            "Cliente María",

          status:
            "draft",

          version:
            3,

          publication:
            null,

          publicationIdentity: {
            title:
              "Cliente María",

            cover: {
              strategy:
                "auto",
            },
          },
        });

        expect(
          await provider.listDrafts(),
        ).toHaveLength(
          1,
        );

        const raw =
          storage.getItem(
            CATALOG_COMPOSITION_DRAFTS_KEY,
          );

        expect(
          readCatalogCompositionDraftsPayload(
            raw,
          ),
        ).toMatchObject({
          success:
            true,

          migrated:
            false,

          sourceVersion:
            1,

          source:
            "local",
        });
      },
    );

    it(
      "recupera un borrador por ID",
      async () => {
        const storage =
          new MemoryStorage();

        const provider =
          new LocalCatalogCompositionProvider({
            storage,

            now: () =>
              new Date(
                "2026-08-07T20:00:00.000Z",
              ),

            createId: () =>
              "CAT-2026-TEST0002",
          });

        await provider.createDraft({
          name:
            "Catálogo prueba",

          composition:
            createEmptyCatalogComposition(
              "hybrid",
            ),
        });

        expect(
          await provider.getDraft(
            "CAT-2026-TEST0002",
          ),
        ).toMatchObject({
          name:
            "Catálogo prueba",

          composition: {
            mode:
              "hybrid",
          },
        });
      },
    );

    it(
      "actualiza sin perder identidad ni fecha de creación",
      async () => {
        const storage =
          new MemoryStorage();

        let now =
          new Date(
            "2026-08-07T20:00:00.000Z",
          );

        const provider =
          new LocalCatalogCompositionProvider({
            storage,

            now: () =>
              now,

            createId: () =>
              "CAT-2026-TEST0003",
          });

        const created =
          await provider.createDraft({
            name:
              "Original",

            composition:
              createEmptyCatalogComposition(
                "automatic",
              ),
          });

        now =
          new Date(
            "2026-08-07T21:00:00.000Z",
          );

        const updated =
          await provider.updateDraft(
            created.id,
            {
              name:
                "Actualizado",

              composition:
                createEmptyCatalogComposition(
                  "manual",
                ),
            },
          );

        expect(
          updated.id,
        ).toBe(
          created.id,
        );

        expect(
          updated.createdAt,
        ).toBe(
          created.createdAt,
        );

        expect(
          updated.updatedAt,
        ).not.toBe(
          created.updatedAt,
        );

        expect(
          updated,
        ).toMatchObject({
          name:
            "Actualizado",

          composition: {
            mode:
              "manual",
          },
        });
      },
    );

    it(
      "publica manual como snapshot fijo y bloquea edición",
      async () => {
        const storage =
          new MemoryStorage();

        let now =
          new Date(
            "2026-08-07T20:00:00.000Z",
          );

        const provider =
          new LocalCatalogCompositionProvider({
            storage,

            now: () =>
              now,

            createId: () =>
              "CAT-2026-TEST0004",
          });

        const created =
          await provider.createDraft({
            name:
              "Publicable",

            composition:
              createEmptyCatalogComposition(
                "manual",
              ),
          });

        now =
          new Date(
            "2026-08-07T21:00:00.000Z",
          );

        const published =
          await provider.publishDraft(
            created.id,
            {
              resolvedProductIds: [
                "P-1",
                "P-2",
              ],

              validityDays:
                7,
            },
          );

        expect(
          published,
        ).toMatchObject({
          status:
            "published",

          publication: {
            strategy:
              "fixed",

            productIds: [
              "P-1",
              "P-2",
            ],

            publishedAt:
              "2026-08-07T21:00:00.000Z",

            validUntil:
              "2026-08-14T21:00:00.000Z",
          },
        });

        await expect(
          provider.updateDraft(
            created.id,
            {
              name:
                "No editable",
            },
          ),
        ).rejects.toThrow(
          "Solo los borradores pueden editarse.",
        );
      },
    );

    it(
      "publica selección automática como dinámica",
      async () => {
        const storage =
          new MemoryStorage();

        const provider =
          new LocalCatalogCompositionProvider({
            storage,

            now: () =>
              new Date(
                "2026-08-07T20:00:00.000Z",
              ),

            createId: () =>
              "CAT-2026-TEST0005",
          });

        const created =
          await provider.createDraft({
            name:
              "Dinámico",

            composition:
              createEmptyCatalogComposition(
                "automatic",
              ),
          });

        const published =
          await provider.publishDraft(
            created.id,
            {
              resolvedProductIds: [
                "P-1",
                "P-2",
              ],
            },
          );

        expect(
          published,
        ).toMatchObject({
          status:
            "published",

          publication: {
            strategy:
              "dynamic",

            productIds:
              [],
          },
        });
      },
    );

    it(
      "rechaza publicar un catálogo vacío",
      async () => {
        const storage =
          new MemoryStorage();

        const provider =
          new LocalCatalogCompositionProvider({
            storage,

            createId: () =>
              "CAT-2026-TEST0006",
          });

        const created =
          await provider.createDraft({
            name:
              "Vacío",

            composition:
              createEmptyCatalogComposition(
                "manual",
              ),
          });

        await expect(
          provider.publishDraft(
            created.id,
            {
              resolvedProductIds:
                [],
            },
          ),
        ).rejects.toThrow(
          "sin productos",
        );
      },
    );

    it(
      "archiva sin borrar el registro",
      async () => {
        const storage =
          new MemoryStorage();

        const provider =
          new LocalCatalogCompositionProvider({
            storage,

            now: () =>
              new Date(
                "2026-08-07T20:00:00.000Z",
              ),

            createId: () =>
              "CAT-2026-TEST0007",
          });

        const created =
          await provider.createDraft({
            name:
              "Archivable",

            composition:
              createEmptyCatalogComposition(),
          });

        const archived =
          await provider.archiveDraft(
            created.id,
          );

        expect(
          archived.status,
        ).toBe(
          "archived",
        );

        expect(
          await provider.getDraft(
            created.id,
          ),
        ).toMatchObject({
          status:
            "archived",
        });
      },
    );

    it(
      "impide editar un borrador archivado",
      async () => {
        const storage =
          new MemoryStorage();

        const provider =
          new LocalCatalogCompositionProvider({
            storage,

            createId: () =>
              "CAT-2026-TEST0008",
          });

        const created =
          await provider.createDraft({
            name:
              "Cerrar ciclo",

            composition:
              createEmptyCatalogComposition(),
          });

        await provider.archiveDraft(
          created.id,
        );

        await expect(
          provider.updateDraft(
            created.id,
            {
              name:
                "No editable",
            },
          ),
        ).rejects.toThrow(
          "Solo los borradores pueden editarse.",
        );
      },
    );

    it(
      "rechaza almacenamiento corrupto antes de sobrescribirlo",
      async () => {
        const storage =
          new MemoryStorage();

        storage.setItem(
          CATALOG_COMPOSITION_DRAFTS_KEY,
          "{invalido",
        );

        const provider =
          new LocalCatalogCompositionProvider({
            storage,
          });

        await expect(
          provider.createDraft({
            name:
              "No sobrescribir",

            composition:
              createEmptyCatalogComposition(),
          }),
        ).rejects.toThrow(
          "Persistencia de borradores invalida",
        );
      },
    );
  },
);
describe(
  "LocalCatalogCompositionProvider Draft Compatibility V2",
  () => {
    const createLegacy =
      () => {
        const composition =
          createEmptyCatalogComposition(
            "automatic",
          );

        composition.filters
          .categoryIds = [
            "flores",
          ];

        composition.filters
          .sourceOperator =
            "intersection";

        return composition;
      };

    it(
      "renombrar y cambiar identidad no migran un draft legacy",
      async () => {
        const storage =
          new MemoryStorage();

        const provider =
          new LocalCatalogCompositionProvider({
            storage,

            now: () =>
              new Date(
                "2026-10-06T17:30:00.000Z",
              ),

            createId: () =>
              "CAT-LEGACY-0001",
          });

        const created =
          await provider.createDraft({
            name:
              "Legacy",

            composition:
              createLegacy(),
          });

        const updated =
          await provider.updateDraft(
            created.id,
            {
              name:
                "Legacy renombrado",

              publicationIdentity: {
                ...created
                  .publicationIdentity,

                title:
                  "Título comercial",

                description:
                  "Descripción comercial",

                cover: {
                  ...created
                    .publicationIdentity
                    .cover,
                },
              },
            },
          );

        expect(
          updated.composition
            .filters
            .sourceOperator,
        ).toBe(
          "intersection",
        );

        expect(
          (
            await provider.getDraft(
              created.id,
            )
          )?.composition
            .filters
            .sourceOperator,
        ).toBe(
          "intersection",
        );
      },
    );

    it(
      "duplicar un draft legacy conserva intersection",
      async () => {
        const storage =
          new MemoryStorage();

        let sequence =
          0;

        const provider =
          new LocalCatalogCompositionProvider({
            storage,

            createId: () => {
              sequence += 1;

              return `CAT-LEGACY-${sequence}`;
            },
          });

        const original =
          await provider.createDraft({
            name:
              "Original",

            composition:
              createLegacy(),
          });

        const duplicated =
          await provider.createDraft({
            name:
              "Original - copia",

            composition:
              original
                .composition,

            publicationIdentity:
              original
                .publicationIdentity,
          });

        expect(
          duplicated.composition
            .filters
            .sourceOperator,
        ).toBe(
          "intersection",
        );

        expect(
          (
            await provider.getDraft(
              duplicated.id,
            )
          )?.composition
            .filters
            .sourceOperator,
        ).toBe(
          "intersection",
        );
      },
    );

    it(
      "draft union guardado y recargado permanece union",
      async () => {
        const storage =
          new MemoryStorage();

        const provider =
          new LocalCatalogCompositionProvider({
            storage,

            createId: () =>
              "CAT-UNION-0001",
          });

        const composition =
          createEmptyCatalogComposition(
            "hybrid",
          );

        composition.filters
          .sourceOperator =
            "union";

        composition.filters
          .categoryIds = [
            "flores",
          ];

        const created =
          await provider.createDraft({
            name:
              "Content Sources",

            composition,
          });

        const updated =
          await provider.updateDraft(
            created.id,
            {
              name:
                "Content Sources guardado",
            },
          );

        expect(
          updated.composition
            .filters
            .sourceOperator,
        ).toBe(
          "union",
        );

        expect(
          (
            await provider.getDraft(
              created.id,
            )
          )?.composition
            .filters
            .sourceOperator,
        ).toBe(
          "union",
        );
      },
    );
  },
);
