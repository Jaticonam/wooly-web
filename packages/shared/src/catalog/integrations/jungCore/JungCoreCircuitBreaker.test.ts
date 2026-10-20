import {
  describe,
  expect,
  it,
} from "vitest";

import {
  JungCoreCircuitBreaker,
  JungCoreCircuitOpenError,
} from "./JungCoreCircuitBreaker";

class CodedError
  extends Error {
  constructor(
    readonly code:
      string,
  ) {
    super(code);
  }
}

describe(
  "JungCoreCircuitBreaker",
  () => {
    it(
      "permanece inactivo por defecto",
      () => {
        const breaker =
          new JungCoreCircuitBreaker();

        breaker.recordFailure(
          new CodedError(
            "HTTP_503",
          ),
        );

        expect(
          breaker.getState(),
        ).toEqual({
          status:
            "disabled",

          consecutiveFailures:
            0,

          openedAt:
            null,

          nextAttemptAt:
            null,
        });

        expect(() =>
          breaker.beforeRequest(),
        ).not.toThrow();
      },
    );

    it(
      "abre al alcanzar el umbral de errores recuperables",
      () => {
        let now =
          1_000;

        const breaker =
          new JungCoreCircuitBreaker({
            enabled:
              true,

            failureThreshold:
              2,

            cooldownMs:
              500,

            now:
              () => now,
          });

        breaker.recordFailure(
          new CodedError(
            "HTTP_503",
          ),
        );

        expect(
          breaker.getState(),
        ).toMatchObject({
          status:
            "closed",

          consecutiveFailures:
            1,
        });

        breaker.recordFailure(
          new CodedError(
            "HTTP_TIMEOUT",
          ),
        );

        expect(
          breaker.getState(),
        ).toEqual({
          status:
            "open",

          consecutiveFailures:
            2,

          openedAt:
            1_000,

          nextAttemptAt:
            1_500,
        });

        expect(() =>
          breaker.beforeRequest(),
        ).toThrow(
          JungCoreCircuitOpenError,
        );

        now =
          1_500;

        expect(() =>
          breaker.beforeRequest(),
        ).not.toThrow();

        expect(
          breaker.getState()
            .status,
        ).toBe(
          "half-open",
        );
      },
    );

    it(
      "cierra despues de una prueba exitosa",
      () => {
        let now =
          100;

        const breaker =
          new JungCoreCircuitBreaker({
            enabled:
              true,

            failureThreshold:
              1,

            cooldownMs:
              50,

            now:
              () => now,
          });

        breaker.recordFailure(
          new CodedError(
            "HTTP_NETWORK_ERROR",
          ),
        );

        now =
          150;

        breaker.beforeRequest();
        breaker.recordSuccess();

        expect(
          breaker.getState(),
        ).toEqual({
          status:
            "closed",

          consecutiveFailures:
            0,

          openedAt:
            null,

          nextAttemptAt:
            null,
        });
      },
    );

    it(
      "reabre si la prueba half-open vuelve a fallar",
      () => {
        let now =
          200;

        const breaker =
          new JungCoreCircuitBreaker({
            enabled:
              true,

            failureThreshold:
              1,

            cooldownMs:
              100,

            now:
              () => now,
          });

        breaker.recordFailure(
          new CodedError(
            "HTTP_503",
          ),
        );

        now =
          300;

        breaker.beforeRequest();

        now =
          310;

        breaker.recordFailure(
          new CodedError(
            "HTTP_504",
          ),
        );

        expect(
          breaker.getState(),
        ).toEqual({
          status:
            "open",

          consecutiveFailures:
            2,

          openedAt:
            310,

          nextAttemptAt:
            410,
        });
      },
    );

    it(
      "no abre ante errores bloqueantes",
      () => {
        const breaker =
          new JungCoreCircuitBreaker({
            enabled:
              true,

            failureThreshold:
              1,
          });

        breaker.recordFailure(
          new CodedError(
            "HTTP_401",
          ),
        );

        expect(
          breaker.getState(),
        ).toMatchObject({
          status:
            "closed",

          consecutiveFailures:
            0,
        });
      },
    );

    it.each([
      {
        failureThreshold:
          0,
      },
      {
        cooldownMs:
          0,
      },
    ])(
      "rechaza configuracion invalida",
      (
        options,
      ) => {
        expect(() =>
          new JungCoreCircuitBreaker(
            options,
          ),
        ).toThrow(
          RangeError,
        );
      },
    );
  },
);