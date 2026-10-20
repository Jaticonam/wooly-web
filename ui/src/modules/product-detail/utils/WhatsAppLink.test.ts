import {
  describe,
  expect,
  it,
  vi,
} from "vitest";

import {
  buildWhatsAppLink,
  normalizeWhatsAppPhone,
  openWhatsAppUrl,
} from "./WhatsAppLink";

describe("WhatsAppLink", () => {
  it("normaliza símbolos del teléfono", () => {
    expect(normalizeWhatsAppPhone("+51 (936) 188-636")).toBe("51936188636");
  });

  it.each([
    ["vacío", "", "EMPTY_PHONE"],
    ["inválido", "123", "INVALID_PHONE"],
  ])("rechaza teléfono %s", (_case, phone, code) => {
    expect(buildWhatsAppLink("Hola", phone)).toMatchObject({
      ok: false,
      issues: expect.arrayContaining([expect.objectContaining({ code })]),
    });
  });

  it("rechaza mensaje vacío", () => {
    expect(buildWhatsAppLink(" ")).toMatchObject({
      ok: false,
      issues: [{ code: "EMPTY_MESSAGE" }],
    });
  });

  it("codifica emojis, tildes y saltos exactamente una vez", () => {
    const message = "¡Hola! 🌷\nLínea dos";
    const result = buildWhatsAppLink(message);
    if (!result.ok) throw new Error("Resultado inesperado");
    expect(decodeURIComponent(result.url.split("?text=")[1])).toBe(message);
    expect(result.url).not.toContain("%25F0");
  });

  it("admite mensajes extensos sin inventar límite empresarial", () => {
    const message = "Producto 🌷\n".repeat(1000);
    expect(buildWhatsAppLink(message)).toMatchObject({ ok: true });
  });

  it("distingue popup abierto, bloqueado e URL inválida", () => {
    const opened = vi.fn(() => ({} as Window));
    const blocked = vi.fn(() => null);
    expect(openWhatsAppUrl("https://wa.me/51936188636?text=Hola", opened))
      .toEqual({ status: "opened" });
    expect(openWhatsAppUrl("https://wa.me/51936188636?text=Hola", blocked))
      .toMatchObject({ status: "blocked" });
    expect(openWhatsAppUrl("javascript:alert(1)", opened))
      .toMatchObject({ status: "invalid" });
  });
});
