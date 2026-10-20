import {
  useEffect,
  useState,
} from "react";

import type {
  CatalogPublicationProvider,
} from "@wooly/shared/catalog/providers/CatalogPublicationProvider";

import {
  createCatalogPublicPublicationReaderInitialState,
  readCatalogPublicPublication,
  type CatalogPublicPublicationReaderResult,
} from "../services/CatalogPublicPublicationReader";

export function useCatalogPublicPublication(
  publicId:
    string,

  provider:
    CatalogPublicationProvider | null,
): CatalogPublicPublicationReaderResult {
  const [
    state,
    setState,
  ] =
    useState<CatalogPublicPublicationReaderResult>(
      () =>
        createCatalogPublicPublicationReaderInitialState(
          publicId,
          provider,
        ),
    );

  useEffect(
    () => {
      let cancelled =
        false;

      const initialState =
        createCatalogPublicPublicationReaderInitialState(
          publicId,
          provider,
        );

      setState(
        initialState,
      );

      if (
        initialState.status !==
        "loading"
      ) {
        return () => {
          cancelled =
            true;
        };
      }

      void readCatalogPublicPublication({
        publicId,
        provider,
      }).then(
        (result) => {
          if (
            !cancelled
          ) {
            setState(
              result,
            );
          }
        },
      );

      return () => {
        cancelled =
          true;
      };
    },
    [
      publicId,
      provider,
    ],
  );

  return state;
}
