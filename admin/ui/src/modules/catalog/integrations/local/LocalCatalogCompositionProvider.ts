import {
  CATALOG_COMPOSITION_DRAFT_VERSION,
  cloneCatalogComposition,
  cloneCatalogCompositionDraft,
  sanitizeCatalogCompositionDraftList,
  type CatalogCompositionDraft,
} from "@/modules/catalog/domain/CatalogCompositionDraft";

import {
  cloneCatalogPublicationIdentity,
  createDefaultCatalogPublicationIdentity,
} from "@wooly/contracts/catalog/domain/CatalogPublicationIdentity";

import {
  createCatalogPublicationSnapshot,
} from "@wooly/contracts/catalog/domain/CatalogPublication";

import type {
  CatalogCompositionProvider,
  CreateCatalogCompositionDraftInput,
  PublishCatalogCompositionDraftInput,
  UpdateCatalogCompositionDraftInput,
} from "@/modules/catalog/providers/CatalogCompositionProvider";

import {
  readStorageEnvelope,
  serializeStorageEnvelope,
  type StorageReadResult,
} from "@wooly/contracts/infrastructure/storage/StorageEnvelope";

export const CATALOG_COMPOSITION_DRAFTS_KEY =
  "wooly_catalog_composition_drafts";

export const CATALOG_COMPOSITION_DRAFTS_SCHEMA_VERSION =
  1;

interface CatalogCompositionStorage {
  getItem(
    key: string,
  ): string | null;

  setItem(
    key: string,
    value: string,
  ): void;
}

interface LocalCatalogCompositionProviderOptions {
  storage?:
    CatalogCompositionStorage | null;

  now?:
    () => Date;

  createId?:
    (now: Date) => string;
}

function getDefaultStorage():
  CatalogCompositionStorage | null {
  try {
    return (
      globalThis.localStorage ??
      null
    );
  } catch {
    return null;
  }
}

export function createLocalCatalogCompositionDraftId(
  now:
    Date = new Date(),
): string {
  const token =
    globalThis.crypto
      .randomUUID()
      .replace(
        /-/g,
        "",
      )
      .slice(
        0,
        8,
      )
      .toUpperCase();

  return [
    "CAT",
    now.getFullYear(),
    token,
  ].join("-");
}

export function readCatalogCompositionDraftsPayload(
  raw:
    string | null,
): StorageReadResult<
  CatalogCompositionDraft[]
> {
  return readStorageEnvelope({
    raw,

    schemaVersion:
      CATALOG_COMPOSITION_DRAFTS_SCHEMA_VERSION,

    validateData:
      sanitizeCatalogCompositionDraftList,
  });
}

export class LocalCatalogCompositionProvider
  implements CatalogCompositionProvider {
  readonly source =
    "local";

  private readonly storage:
    CatalogCompositionStorage | null;

  private readonly now:
    () => Date;

  private readonly createId:
    (now: Date) => string;

  constructor(
    options:
      LocalCatalogCompositionProviderOptions =
        {},
  ) {
    this.storage =
      options.storage ===
      undefined
        ? getDefaultStorage()
        : options.storage;

    this.now =
      options.now ??
      (() => new Date());

    this.createId =
      options.createId ??
      createLocalCatalogCompositionDraftId;
  }

  private readAll():
    CatalogCompositionDraft[] {
    if (!this.storage) {
      return [];
    }

    let raw:
      string | null;

    try {
      raw =
        this.storage.getItem(
          CATALOG_COMPOSITION_DRAFTS_KEY,
        );
    } catch {
      return [];
    }

    const result =
      readCatalogCompositionDraftsPayload(
        raw,
      );

    if (!result.success) {
      if (
        result.reason ===
        "MISSING"
      ) {
        return [];
      }

      throw new Error(
        `Persistencia de borradores invalida: ${result.reason}`,
      );
    }

    return result.data.map(
      cloneCatalogCompositionDraft,
    );
  }

  private writeAll(
    drafts:
      readonly CatalogCompositionDraft[],
  ): void {
    if (!this.storage) {
      throw new Error(
        "El almacenamiento local no esta disponible.",
      );
    }

    const savedAt =
      this.now().getTime();

    try {
      this.storage.setItem(
        CATALOG_COMPOSITION_DRAFTS_KEY,

        serializeStorageEnvelope({
          schemaVersion:
            CATALOG_COMPOSITION_DRAFTS_SCHEMA_VERSION,

          data:
            drafts.map(
              cloneCatalogCompositionDraft,
            ),

          savedAt,

          source:
            this.source,
        }),
      );
    } catch {
      throw new Error(
        "No se pudo guardar el borrador localmente.",
      );
    }
  }

  async listDrafts():
    Promise<
      readonly CatalogCompositionDraft[]
    > {
    return this.readAll()
      .sort(
        (
          left,
          right,
        ) =>
          Date.parse(
            right.updatedAt,
          ) -
          Date.parse(
            left.updatedAt,
          ),
      )
      .map(
        cloneCatalogCompositionDraft,
      );
  }

  async getDraft(
    id:
      string,
  ):
    Promise<
      CatalogCompositionDraft | null
    > {
    const normalizedId =
      id.trim();

    if (!normalizedId) {
      return null;
    }

    const draft =
      this.readAll().find(
        (candidate) =>
          candidate.id ===
          normalizedId,
      );

    return draft
      ? cloneCatalogCompositionDraft(
          draft,
        )
      : null;
  }

  async createDraft(
    input:
      CreateCatalogCompositionDraftInput,
  ):
    Promise<
      CatalogCompositionDraft
    > {
    const name =
      input.name.trim();

    if (!name) {
      throw new Error(
        "El borrador necesita un nombre.",
      );
    }

    const drafts =
      this.readAll();

    const now =
      this.now();

    const nowIso =
      now.toISOString();

    let id =
      this.createId(
        now,
      );

    let collisionGuard =
      0;

    while (
      drafts.some(
        (draft) =>
          draft.id ===
          id,
      )
    ) {
      collisionGuard +=
        1;

      if (
        collisionGuard >
          10
      ) {
        throw new Error(
          "No se pudo generar un ID unico para el borrador.",
        );
      }

      id =
        this.createId(
          now,
        );
    }

    const draft:
      CatalogCompositionDraft =
    {
      id,

      name,

      status:
        "draft",

      composition:
        cloneCatalogComposition(
          input.composition,
        ),

      publicationIdentity:
        cloneCatalogPublicationIdentity(
          input.publicationIdentity ??
            createDefaultCatalogPublicationIdentity(
              name,
            ),
        ),

      publication:
        null,

      createdAt:
        nowIso,

      updatedAt:
        nowIso,

      version:
        CATALOG_COMPOSITION_DRAFT_VERSION,
    };

    this.writeAll([
      ...drafts,
      draft,
    ]);

    return cloneCatalogCompositionDraft(
      draft,
    );
  }

  async updateDraft(
    id:
      string,

    input:
      UpdateCatalogCompositionDraftInput,
  ):
    Promise<
      CatalogCompositionDraft
    > {
    const normalizedId =
      id.trim();

    const drafts =
      this.readAll();

    const index =
      drafts.findIndex(
        (draft) =>
          draft.id ===
          normalizedId,
      );

    if (index < 0) {
      throw new Error(
        `No existe el borrador ${normalizedId}.`,
      );
    }

    const current =
      drafts[index];

    if (
      current.status !==
        "draft"
    ) {
      throw new Error(
        "Solo los borradores pueden editarse.",
      );
    }

    const name =
      input.name ===
      undefined
        ? current.name
        : input.name.trim();

    if (!name) {
      throw new Error(
        "El borrador necesita un nombre.",
      );
    }

    const updated:
      CatalogCompositionDraft =
    {
      ...current,

      name,

      composition:
        input.composition
          ? cloneCatalogComposition(
              input.composition,
            )
          : cloneCatalogComposition(
              current.composition,
            ),

      publicationIdentity:
        input.publicationIdentity
          ? cloneCatalogPublicationIdentity(
              input.publicationIdentity,
            )
          : cloneCatalogPublicationIdentity(
              current.publicationIdentity,
            ),

      updatedAt:
        this.now()
          .toISOString(),
    };

    drafts[index] =
      updated;

    this.writeAll(
      drafts,
    );

    return cloneCatalogCompositionDraft(
      updated,
    );
  }

  async publishDraft(
    id:
      string,

    input:
      PublishCatalogCompositionDraftInput,
  ):
    Promise<
      CatalogCompositionDraft
    > {
    const normalizedId =
      id.trim();

    const drafts =
      this.readAll();

    const index =
      drafts.findIndex(
        (draft) =>
          draft.id ===
          normalizedId,
      );

    if (index < 0) {
      throw new Error(
        `No existe el borrador ${normalizedId}.`,
      );
    }

    const current =
      drafts[index];

    if (
      current.status !==
        "draft"
    ) {
      throw new Error(
        "Solo un borrador puede publicarse.",
      );
    }

    const now =
      this.now();

    const publication =
      createCatalogPublicationSnapshot({
        mode:
          current.composition
            .mode,

        resolvedProductIds:
          input.resolvedProductIds,

        publishedAt:
          now,

        validityDays:
          input.validityDays,
      });

    const published:
      CatalogCompositionDraft =
    {
      ...current,

      status:
        "published",

      publication,

      updatedAt:
        now.toISOString(),
    };

    drafts[index] =
      published;

    this.writeAll(
      drafts,
    );

    return cloneCatalogCompositionDraft(
      published,
    );
  }

  async archiveDraft(
    id:
      string,
  ):
    Promise<
      CatalogCompositionDraft
    > {
    const normalizedId =
      id.trim();

    const drafts =
      this.readAll();

    const index =
      drafts.findIndex(
        (draft) =>
          draft.id ===
          normalizedId,
      );

    if (index < 0) {
      throw new Error(
        `No existe el borrador ${normalizedId}.`,
      );
    }

    const archived:
      CatalogCompositionDraft =
    {
      ...drafts[index],

      status:
        "archived",

      updatedAt:
        this.now()
          .toISOString(),
    };

    drafts[index] =
      archived;

    this.writeAll(
      drafts,
    );

    return cloneCatalogCompositionDraft(
      archived,
    );
  }
}