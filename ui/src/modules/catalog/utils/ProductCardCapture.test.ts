import {
  afterEach,
  describe,
  expect,
  it,
  vi,
} from "vitest";

import { toPng } from "html-to-image";

import {
  PRODUCT_CAPTURE_HEIGHT,
  PRODUCT_CAPTURE_RENDER_HEIGHT,
  PRODUCT_CAPTURE_RENDER_WIDTH,
  PRODUCT_CAPTURE_WIDTH,
  buildProductCaptureFileName,
  downloadProductCardCapture,
} from "./ProductCardCapture";

vi.mock("html-to-image", () => ({
  toPng: vi.fn(),
}));

afterEach(() => {
  vi.restoreAllMocks();
  vi.clearAllMocks();
});

describe("ProductCardCapture", () => {
  it("normaliza el nombre del archivo usando el codigo del producto", () => {
    expect(
      buildProductCaptureFileName(
        "  FLOR 001 / A  ",
      ),
    ).toBe(
      "FLOR-001-A-wooly.png",
    );
  });

  it("renderiza 360 por 640 y exporta PNG 1080 por 1920", async () => {
    vi.mocked(toPng).mockResolvedValue(
      "data:image/png;base64,wooly",
    );

    const clickSpy = vi
      .spyOn(
        HTMLAnchorElement.prototype,
        "click",
      )
      .mockImplementation(
        () => undefined,
      );

    const node =
      document.createElement("div");

    await downloadProductCardCapture(
      node,
      "FLOR-001",
    );

    expect(toPng).toHaveBeenCalledWith(
      node,
      expect.objectContaining({
        width: 360,
        height: 640,
        canvasWidth: 1080,
        canvasHeight: 1920,
        pixelRatio: 1,
        cacheBust: true,
        backgroundColor: "#ffffff",
      }),
    );

    expect(
      PRODUCT_CAPTURE_RENDER_WIDTH,
    ).toBe(360);

    expect(
      PRODUCT_CAPTURE_RENDER_HEIGHT,
    ).toBe(640);

    expect(
      PRODUCT_CAPTURE_WIDTH,
    ).toBe(1080);

    expect(
      PRODUCT_CAPTURE_HEIGHT,
    ).toBe(1920);

    expect(
      clickSpy,
    ).toHaveBeenCalledTimes(1);
  });
});