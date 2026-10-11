import { afterEach, describe, expect, it, vi } from "vitest";

import {
  loadAdminProductPublicationReadiness,
  publishAdminProduct,
} from "./AdminAuthClient";

describe("PUB-01.9B publication HTTP client", () => {
  afterEach(() => {
    vi.unstubAllGlobals();
  });

  function mockResponse(data: unknown) {
    const fetchMock = vi.fn().mockResolvedValue({
      ok: true,
      json: async () => data,
    });

    vi.stubGlobal("fetch", fetchMock);
    return fetchMock;
  }

  it("queries readiness with GET and authenticated credentials", async () => {
    const fetchMock = mockResponse({
      success: true,
      data: {
        productId: "p",
        ready: false,
        reasons: ["PUBLIC_MEDIA_MISSING"],
        warnings: ["PUBLIC_MEDIA_MISSING"],
        blockers: [],
        requiredConfirmations: ["useDefaultImage"],
      },
    });

    const result = await loadAdminProductPublicationReadiness("b", "p");

    expect(result.data.requiredConfirmations).toEqual(["useDefaultImage"]);
    expect(fetchMock).toHaveBeenCalledWith(
      expect.stringContaining("/brands/b/products/p/publication-readiness"),
      expect.objectContaining({
        method: "GET",
        credentials: "include",
      }),
    );
  });

  it("preserves the previous POST contract without confirmations", async () => {
    const fetchMock = mockResponse({ success: true, message: "OK", data: {} });

    await publishAdminProduct("b", "p");

    expect(fetchMock).toHaveBeenCalledWith(
      expect.stringContaining("/brands/b/products/p/publish"),
      expect.objectContaining({
        method: "POST",
        body: undefined,
        credentials: "include",
      }),
    );
  });

  it("sends explicit image and inventory confirmations", async () => {
    const fetchMock = mockResponse({ success: true, message: "OK", data: {} });

    await publishAdminProduct("b", "p", {
      useDefaultImage: true,
      publishWithoutStock: true,
    });

    expect(fetchMock).toHaveBeenCalledWith(
      expect.stringContaining("/brands/b/products/p/publish"),
      expect.objectContaining({
        method: "POST",
        credentials: "include",
        body: JSON.stringify({
          confirmations: {
            useDefaultImage: true,
            publishWithoutStock: true,
          },
        }),
      }),
    );
  });
});
