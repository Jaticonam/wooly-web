import { describe, expect, it } from "vitest";
import { matchProductCodeImages, type IndexedMediaAsset } from "./WoolyProductCodeImages";

const asset = (mediaCode: string, overrides: Partial<IndexedMediaAsset> = {}): IndexedMediaAsset => ({
  id: mediaCode,
  mediaCode,
  kind: "IMAGE",
  status: "ACTIVE",
  publicUrl: "https://media.jungnegocios.com/" + mediaCode + ".jpg",
  thumbnailUrl: null,
  brand: { slug: "wooly" },
  ...overrides,
});

describe("PRODUCT-CREATE-02B: búsqueda de fotografías por código", () => {
  it("encuentra solamente el código exacto y ordena imagen principal y galería", () => {
    const items = [
      asset("WOOLY:OSO20CM:03"),
      asset("WOOLY:OSO20CM2:01"),
      asset("WOOLY:OSO20CM:01"),
      asset("WOOLY:OSO20CM:02"),
    ];
    const found = matchProductCodeImages(items, " oso20cm ");
    expect(found.map((x) => x.position)).toEqual([1, 2, 3]);
    expect(found.map((x) => x.isPrimary)).toEqual([true, false, false]);
  });
  it("descarta otras marcas, inactivos, activos no imagen y URLs inseguras", () => {
    const found = matchProductCodeImages([
      asset("WOOLY:OSO20CM:01", { brand: { slug: "gleemour" } }),
      asset("WOOLY:OSO20CM:02", { status: "INACTIVE" }),
      asset("WOOLY:OSO20CM:03", { kind: "VIDEO" }),
      asset("WOOLY:OSO20CM:04", { publicUrl: "http://example.com/a.jpg" }),
      asset("WOOLY:OSO20CM:05"),
    ], "OSO20CM");
    expect(found.map((x) => x.position)).toEqual([5]);
  });
  it("no genera coincidencias con identificadores inválidos", () => {
    expect(matchProductCodeImages([asset("WOOLY:OSO20CM:01")], "../OSO20CM")).toEqual([]);
  });
});
