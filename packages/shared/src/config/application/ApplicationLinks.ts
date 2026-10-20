import { getApplicationConfig } from "./resolveApplicationConfig";

export function buildApplicationWhatsAppUrl(message?: string): string {
  const url = new URL(
    `https://wa.me/${getApplicationConfig().contact.whatsappNumber}`,
  );
  if (message) url.searchParams.set("text", message);
  return url.toString();
}
