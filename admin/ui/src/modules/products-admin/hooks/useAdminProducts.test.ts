import { createElement, type ReactNode } from "react";
import { renderHook, act, waitFor } from "@testing-library/react";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { it, expect, vi } from "vitest";
import { jungCoreAdminProducts } from "../integrations/JungCoreAdminProducts";
import { useAdminProducts, PRODUCT_ADMIN_AUTO_REFRESH_MS } from "./useAdminProducts";
vi.mock("../integrations/JungCoreAdminProducts", () => ({
  jungCoreAdminProducts: { list: vi.fn(), options: vi.fn() },
}));
it("uses CORE sources, reloads both queries in parallel and configures controlled refresh", async () => {
  const optionData: Awaited<ReturnType<typeof jungCoreAdminProducts.options>> = {
    id: "b",
    name: "Wooly",
    categories: [{ id: "c", slug: "flores", name: "Flores" }],
  };
  vi.mocked(jungCoreAdminProducts.list).mockResolvedValue([]);
  vi.mocked(jungCoreAdminProducts.options).mockResolvedValue(optionData);
  const queryClient = new QueryClient({ defaultOptions: { queries: { retry: false } } });
  const wrapper = ({ children }: { children: ReactNode }) =>
    createElement(QueryClientProvider, { client: queryClient }, children);
  const { result, unmount } = renderHook(() => useAdminProducts(), { wrapper });
  await waitFor(() =>
    expect(result.current.categories).toEqual([{ id: "flores", name: "Flores" }]),
  );
  expect(jungCoreAdminProducts.list).toHaveBeenCalledOnce();
  expect(jungCoreAdminProducts.options).toHaveBeenCalledOnce();
  expect(PRODUCT_ADMIN_AUTO_REFRESH_MS).toBe(300000);
  for (const query of queryClient.getQueryCache().getAll())
    expect(query.options).toMatchObject({
      refetchInterval: 300000,
      refetchIntervalInBackground: false,
      refetchOnWindowFocus: true,
    });
  let finishProducts!: (value: Awaited<ReturnType<typeof jungCoreAdminProducts.list>>) => void;
  let finishOptions!: (value: typeof optionData) => void;
  vi.mocked(jungCoreAdminProducts.list).mockImplementationOnce(
    () =>
      new Promise((resolve) => {
        finishProducts = resolve;
      }),
  );
  vi.mocked(jungCoreAdminProducts.options).mockImplementationOnce(
    () =>
      new Promise((resolve) => {
        finishOptions = resolve;
      }),
  );
  let done = false;
  let pending!: Promise<void>;
  act(() => {
    pending = result.current.reload().then(() => {
      done = true;
    });
  });
  expect(jungCoreAdminProducts.list).toHaveBeenCalledTimes(2);
  expect(jungCoreAdminProducts.options).toHaveBeenCalledTimes(2);
  await act(async () => {
    finishProducts([]);
    await Promise.resolve();
  });
  expect(done).toBe(false);
  await act(async () => {
    finishOptions(optionData);
    await pending;
  });
  expect(done).toBe(true);
  unmount();
  queryClient.clear();
});
