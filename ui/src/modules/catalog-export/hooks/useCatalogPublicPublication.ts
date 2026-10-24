import {
  useCallback,
  useEffect,
  useRef,
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

export interface CatalogPublicPublicationState
  extends CatalogPublicPublicationReaderResult {
  /**
   * true cuando el estado es "rate-limited" y ya venció la espera sugerida
   * por `Retry-After` (o JUNG CORE no indicó ninguna).
   */
  canRetry:
    boolean;

  /**
   * Reintento exclusivamente manual de la lectura. No hace nada fuera de
   * "rate-limited" ni mientras dura la espera; nunca se invoca solo.
   */
  retry:
    () => void;
}

export function useCatalogPublicPublication(
  publicId:
    string,

  provider:
    CatalogPublicationProvider | null,
): CatalogPublicPublicationState {
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

  const [
    attempt,
    setAttempt,
  ] =
    useState(
      0,
    );

  const [
    isRetryWaiting,
    setIsRetryWaiting,
  ] =
    useState(
      false,
    );

  const stateRef =
    useRef(
      state,
    );

  stateRef.current =
    state;

  const retryWaitingRef =
    useRef(
      false,
    );

  useEffect(
    () => {
      let cancelled =
        false;

      let waitTimer:
        ReturnType<typeof setTimeout> |
        undefined;

      const initialState =
        createCatalogPublicPublicationReaderInitialState(
          publicId,
          provider,
        );

      retryWaitingRef.current =
        false;

      setIsRetryWaiting(
        false,
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
            cancelled
          ) {
            return;
          }

          if (
            result.status ===
              "rate-limited" &&
            result.retryAfterSeconds !==
              undefined
          ) {
            retryWaitingRef.current =
              true;

            setIsRetryWaiting(
              true,
            );

            // Solo rehabilita el reintento manual; no vuelve a leer.
            waitTimer =
              setTimeout(
                () => {
                  retryWaitingRef.current =
                    false;

                  setIsRetryWaiting(
                    false,
                  );
                },
                result.retryAfterSeconds *
                  1000,
              );
          }

          setState(
            result,
          );
        },
      );

      return () => {
        cancelled =
          true;

        if (
          waitTimer !==
          undefined
        ) {
          clearTimeout(
            waitTimer,
          );
        }
      };
    },
    [
      publicId,
      provider,
      attempt,
    ],
  );

  const retry =
    useCallback(
      () => {
        if (
          stateRef.current.status !==
            "rate-limited" ||
          retryWaitingRef.current
        ) {
          return;
        }

        // Evita dobles clics antes del siguiente render.
        stateRef.current = {
          status:
            "loading",

          publication:
            null,
        };

        setAttempt(
          (value) =>
            value + 1,
        );
      },
      [],
    );

  return {
    ...state,

    canRetry:
      state.status ===
        "rate-limited" &&
      !isRetryWaiting,

    retry,
  };
}
