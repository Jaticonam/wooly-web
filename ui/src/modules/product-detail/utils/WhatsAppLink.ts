import { getApplicationConfig } from "@wooly/shared/config/application";

export const WOOLY_WHATSAPP_NUMBER =
  getApplicationConfig().contact.whatsappNumber;

export type WhatsAppIssueCode =
  | "EMPTY_PHONE"
  | "EMPTY_MESSAGE"
  | "INVALID_PHONE"
  | "POPUP_BLOCKED"
  | "NO_ELIGIBLE_ITEMS";

export interface WhatsAppIssue {
  code: WhatsAppIssueCode;
  message: string;
}

export type WhatsAppLinkResult =
  | {
      ok: true;
      url: string;
      message: string;
      phone: string;
    }
  | {
      ok: false;
      issues: readonly WhatsAppIssue[];
    };

export type WhatsAppOpenResult =
  | { status: "opened" }
  | { status: "blocked"; issues: readonly WhatsAppIssue[] }
  | { status: "invalid"; issues: readonly WhatsAppIssue[] };

export function normalizeWhatsAppPhone(
  phone: unknown,
): string {
  return String(phone ?? "").replace(/\D/g, "");
}

export function formatWhatsAppPhone(phone: unknown): string {
  const value = normalizeWhatsAppPhone(phone);
  return value.length === 11
    ? `+${value.slice(0, 2)} ${value.slice(2, 5)} ${value.slice(5, 8)} ${value.slice(8)}`
    : value;
}

export function buildWhatsAppLink(
  message: unknown,
  phone: unknown = WOOLY_WHATSAPP_NUMBER,
): WhatsAppLinkResult {
  const normalizedPhone = normalizeWhatsAppPhone(phone);
  const normalizedMessage = String(message ?? "").trim();
  const issues: WhatsAppIssue[] = [];

  if (!normalizedPhone) {
    issues.push({ code: "EMPTY_PHONE", message: "El teléfono está vacío." });
  } else if (normalizedPhone.length < 8 || normalizedPhone.length > 15) {
    issues.push({ code: "INVALID_PHONE", message: "El teléfono no es válido." });
  }
  if (!normalizedMessage) {
    issues.push({ code: "EMPTY_MESSAGE", message: "El mensaje está vacío." });
  }
  if (issues.length) {
    return { ok: false, issues };
  }

  return {
    ok: true,
    phone: normalizedPhone,
    message: normalizedMessage,
    url: `https://wa.me/${normalizedPhone}?text=${encodeURIComponent(
      normalizedMessage,
    )}`,
  };
}

export function openWhatsAppUrl(
  url: unknown,
  openWindow: typeof window.open = window.open.bind(window),
): WhatsAppOpenResult {
  let parsed: URL;
  try {
    parsed = new URL(String(url ?? ""));
  } catch {
    return {
      status: "invalid",
      issues: [{ code: "EMPTY_MESSAGE", message: "La URL de WhatsApp no es válida." }],
    };
  }
  if (parsed.protocol !== "https:" || parsed.hostname !== "wa.me") {
    return {
      status: "invalid",
      issues: [{ code: "INVALID_PHONE", message: "La URL de WhatsApp no es válida." }],
    };
  }

  const opened = openWindow(parsed.toString(), "_blank");
  return opened
    ? { status: "opened" }
    : {
        status: "blocked",
        issues: [{ code: "POPUP_BLOCKED", message: "El navegador bloqueó la ventana." }],
      };
}
