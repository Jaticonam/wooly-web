export interface StorageEnvelope<T> {
  schemaVersion: number;
  data: T;
  savedAt?: number;
  source?: string;
}

export type StorageReadFailureReason =
  | "MISSING"
  | "INVALID_JSON"
  | "INVALID_PAYLOAD"
  | "UNSUPPORTED_VERSION";

export type StorageReadResult<T> =
  | {
      success: true;
      data: T;
      migrated: boolean;
      sourceVersion: number;
      savedAt?: number;
      source?: string;
    }
  | {
      success: false;
      reason: StorageReadFailureReason;
    };

type LegacyMigration<T> = (
  value: unknown,
) => {
  data: T;
  savedAt?: number;
} | null;

interface ReadStorageOptions<T> {
  raw: string | null;
  schemaVersion: number;
  validateData: (value: unknown) => T | null;
  migrateLegacy?: LegacyMigration<T>;
  requireSavedAt?: boolean;
}

function isRecord(
  value: unknown,
): value is Record<string, unknown> {
  return (
    typeof value === "object" &&
    value !== null &&
    !Array.isArray(value)
  );
}

function isValidSavedAt(
  value: unknown,
): value is number {
  return (
    typeof value === "number" &&
    Number.isFinite(value)
  );
}

export function readStorageEnvelope<T>({
  raw,
  schemaVersion,
  validateData,
  migrateLegacy,
  requireSavedAt = false,
}: ReadStorageOptions<T>): StorageReadResult<T> {
  if (raw === null) {
    return {
      success: false,
      reason: "MISSING",
    };
  }

  let parsed: unknown;

  try {
    parsed = JSON.parse(raw);
  } catch {
    return {
      success: false,
      reason: "INVALID_JSON",
    };
  }

  if (
    isRecord(parsed) &&
    "schemaVersion" in parsed
  ) {
    if (
      typeof parsed.schemaVersion !==
        "number" ||
      !Number.isInteger(
        parsed.schemaVersion,
      )
    ) {
      return {
        success: false,
        reason: "INVALID_PAYLOAD",
      };
    }

    if (
      parsed.schemaVersion !==
      schemaVersion
    ) {
      return {
        success: false,
        reason: "UNSUPPORTED_VERSION",
      };
    }

    if (
      requireSavedAt &&
      !isValidSavedAt(parsed.savedAt)
    ) {
      return {
        success: false,
        reason: "INVALID_PAYLOAD",
      };
    }

    const data = validateData(
      parsed.data,
    );

    if (data === null) {
      return {
        success: false,
        reason: "INVALID_PAYLOAD",
      };
    }

    return {
      success: true,
      data,
      migrated: false,
      sourceVersion:
        parsed.schemaVersion,
      ...(isValidSavedAt(
        parsed.savedAt,
      )
        ? { savedAt: parsed.savedAt }
        : {}),
      ...(typeof parsed.source ===
      "string"
        ? {
            source:
              parsed.source,
          }
        : {}),
    };
  }

  const migrated =
    migrateLegacy?.(parsed) ?? null;

  if (!migrated) {
    return {
      success: false,
      reason: "INVALID_PAYLOAD",
    };
  }

  if (
    requireSavedAt &&
    !isValidSavedAt(migrated.savedAt)
  ) {
    return {
      success: false,
      reason: "INVALID_PAYLOAD",
    };
  }

  return {
    success: true,
    data: migrated.data,
    migrated: true,
    sourceVersion: 0,
    ...(isValidSavedAt(
      migrated.savedAt,
    )
      ? { savedAt: migrated.savedAt }
      : {}),
  };
}

export function serializeStorageEnvelope<T>(
  envelope: StorageEnvelope<T>,
): string {
  return JSON.stringify(envelope);
}
