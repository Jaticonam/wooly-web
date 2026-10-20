import type {
  CatalogComposition,
} from "@wooly/contracts/catalog/domain/CatalogComposition";

import type {
  CatalogCompositionDraft,
} from "@/modules/catalog/domain/CatalogCompositionDraft";

import type {
  CatalogPublicationIdentity,
} from "@wooly/contracts/catalog/domain/CatalogPublicationIdentity";

export interface CreateCatalogCompositionDraftInput {
  name: string;

  composition:
    CatalogComposition;

  publicationIdentity?:
    CatalogPublicationIdentity;
}

export interface UpdateCatalogCompositionDraftInput {
  name?: string;

  composition?:
    CatalogComposition;

  publicationIdentity?:
    CatalogPublicationIdentity;
}

export interface PublishCatalogCompositionDraftInput {
  resolvedProductIds:
    readonly string[];

  validityDays?:
    number;
}

export interface CatalogCompositionProvider {
  readonly source:
    string;

  listDrafts():
    Promise<
      readonly CatalogCompositionDraft[]
    >;

  getDraft(
    id: string,
  ):
    Promise<
      CatalogCompositionDraft | null
    >;

  createDraft(
    input:
      CreateCatalogCompositionDraftInput,
  ):
    Promise<
      CatalogCompositionDraft
    >;

  updateDraft(
    id: string,

    input:
      UpdateCatalogCompositionDraftInput,
  ):
    Promise<
      CatalogCompositionDraft
    >;

  publishDraft(
    id: string,

    input:
      PublishCatalogCompositionDraftInput,
  ):
    Promise<
      CatalogCompositionDraft
    >;

  archiveDraft(
    id: string,
  ):
    Promise<
      CatalogCompositionDraft
    >;
}