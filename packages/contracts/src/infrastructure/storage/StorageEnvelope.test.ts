import {
  describe,
  expect,
  it,
} from "vitest";

import {
  readStorageEnvelope,
  serializeStorageEnvelope,
} from "./StorageEnvelope";

const validateStrings = (
  value: unknown,
) =>
  Array.isArray(value) &&
  value.every(
    (item) =>
      typeof item === "string",
  )
    ? value
    : null;

describe("StorageEnvelope", () => {
  it("lee la versión vigente", () => {
    const result =
      readStorageEnvelope({
        raw:
          serializeStorageEnvelope({
            schemaVersion: 1,
            data: ["uno"],
            savedAt: 10,
            source:
              "contract-fixture",
          }),
        schemaVersion: 1,
        validateData:
          validateStrings,
        requireSavedAt: true,
      });

    expect(result).toEqual({
      success: true,
      data: ["uno"],
      migrated: false,
      sourceVersion: 1,
      savedAt: 10,
      source:
        "contract-fixture",
    });
  });

  it("migra un payload legacy explícito", () => {
    const result =
      readStorageEnvelope({
        raw: JSON.stringify({
          items: ["legacy"],
          savedAt: 20,
        }),
        schemaVersion: 1,
        validateData:
          validateStrings,
        requireSavedAt: true,
        migrateLegacy: (value) => {
          const legacy =
            value as {
              items: unknown;
              savedAt: number;
            };
          const data =
            validateStrings(
              legacy.items,
            );

          return data
            ? {
                data,
                savedAt:
                  legacy.savedAt,
              }
            : null;
        },
      });

    expect(result).toMatchObject({
      success: true,
      migrated: true,
      sourceVersion: 0,
      data: ["legacy"],
    });
  });

  it.each([
    [
      null,
      "MISSING",
    ],
    [
      "{",
      "INVALID_JSON",
    ],
    [
      JSON.stringify({
        schemaVersion: 1,
        data: {},
      }),
      "INVALID_PAYLOAD",
    ],
    [
      JSON.stringify({
        schemaVersion: 2,
        data: ["future"],
      }),
      "UNSUPPORTED_VERSION",
    ],
  ])(
    "rechaza %s como %s",
    (raw, reason) => {
      expect(
        readStorageEnvelope({
          raw,
          schemaVersion: 1,
          validateData:
            validateStrings,
        }),
      ).toEqual({
        success: false,
        reason,
      });
    },
  );
});
