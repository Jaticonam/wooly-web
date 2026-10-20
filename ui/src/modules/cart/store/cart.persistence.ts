import type { CartItem } from "@/modules/cart/types";

import {
  normalizeCartQuantity,
} from "@/modules/cart/domain/CartLinePricing";

import {
  isCartItemCommerciallyEligible,
} from "@/modules/cart/domain/CartCommercialEligibility";
import {
  readStorageEnvelope,
  serializeStorageEnvelope,
  type StorageReadResult,
} from "@wooly/contracts/infrastructure/storage/StorageEnvelope";

export const CART_KEY = "wooly_cart";
export const CART_SCHEMA_VERSION = 1;

interface PersistedCartCandidate
  extends Record<string, unknown> {
  id: string;
  title: string;
  description: string;
  category: string;
  price_1: number;
  img: string;
}

function isPersistedCartCandidate(
  value: unknown,
): value is PersistedCartCandidate {
  if (
    typeof value !== "object" ||
    value === null
  ) {
    return false;
  }

  const candidate =
    value as Record<string, unknown>;

  return (
    typeof candidate.id === "string" &&
    candidate.id.trim().length > 0 &&
    typeof candidate.title === "string" &&
    candidate.title.trim().length > 0 &&
    typeof candidate.description === "string" &&
    typeof candidate.category === "string" &&
    typeof candidate.price_1 === "number" &&
    typeof candidate.img === "string" &&
    candidate.img.trim().length > 0
  );
}

export function sanitizePersistedCart(
  value: unknown,
): CartItem[] {
  if (!Array.isArray(value)) {
    return [];
  }

  return value.flatMap(
    (candidate) => {
      if (
        !isPersistedCartCandidate(
          candidate,
        )
      ) {
        return [];
      }

      const item = {
        ...candidate,
        qty:
          normalizeCartQuantity(
            candidate.qty,
          ),
        note:
          typeof candidate.note ===
          "string"
            ? candidate.note
            : "",
      } as CartItem;

      return isCartItemCommerciallyEligible(
        item,
      )
        ? [item]
        : [];
    },
  );
}

export function parsePersistedCart(
  value: string | null,
): CartItem[] {
  const result =
    readPersistedCart(value);

  return result.success
    ? result.data
    : [];
}

export function readPersistedCart(
  value: string | null,
): StorageReadResult<CartItem[]> {
  return readStorageEnvelope({
    raw: value,
    schemaVersion:
      CART_SCHEMA_VERSION,
    validateData: (data) =>
      Array.isArray(data)
        ? sanitizePersistedCart(data)
        : null,
    migrateLegacy: (legacy) =>
      Array.isArray(legacy)
        ? {
            data:
              sanitizePersistedCart(
                legacy,
              ),
          }
        : null,
  });
}

export function readCartStorage():
  StorageReadResult<CartItem[]> {
  try {
    return readPersistedCart(
      localStorage.getItem(
        CART_KEY,
      ),
    );
  } catch {
    return {
      success: false,
      reason: "MISSING",
    };
  }
}

export function loadCart(): CartItem[] {
  const result = readCartStorage();

  return result.success
    ? result.data
    : [];
}

export function saveCart(cart: CartItem[]) {
  try {
    localStorage.setItem(
      CART_KEY,
      serializeStorageEnvelope({
        schemaVersion:
          CART_SCHEMA_VERSION,
        data:
          sanitizePersistedCart(
            cart,
          ),
      }),
    );
  } catch {
    // noop
  }
}
