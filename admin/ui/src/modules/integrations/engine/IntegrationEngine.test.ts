import { beforeEach, describe, expect, it, vi } from "vitest";

import type { IntegrationConnector } from "../types/connector";

const {
  write,
  mkdir,
  writeFile,
} = vi.hoisted(() => ({
  write: vi.fn(),
  mkdir: vi.fn(),
  writeFile: vi.fn(),
}));

vi.mock("./ExportEngine", () => ({
  ExportEngine: { write },
}));

vi.mock("node:fs/promises", () => ({
  default: { mkdir, writeFile },
}));

import { IntegrationEngine } from "./IntegrationEngine";

type Input = {
  id: string;
  title: string;
  status: string;
};

const createConnector = (
  key = "test",
  validate: IntegrationConnector<Input, Input>["validate"] = () => [],
): IntegrationConnector<Input, Input> => ({
  key,
  name: `Connector ${key}`,
  outputFile: `${key}.json`,
  validate,
  map: (product) => product,
  export: (products) => JSON.stringify(products),
});

describe("IntegrationEngine", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    write.mockResolvedValue("C:/exports/test.json");
    mkdir.mockResolvedValue(undefined);
    writeFile.mockResolvedValue(undefined);
  });

  it("publica con un connector válido y devuelve resultado tipado", async () => {
    const result = await IntegrationEngine.publish(
      [{ id: "P-1", title: "Producto", status: "publicado" }],
      createConnector(),
      "tmp/r82-integrations",
    );
    expect(result.status).toMatchObject({
      connector: "test",
      status: "ok",
      items_loaded: 1,
      items_exported: 1,
      items_invalid: 0,
    });
    expect(result.invalid).toEqual([]);
    expect(write).toHaveBeenCalledOnce();
  });

  it("rechaza un connector ausente en runtime", async () => {
    await expect(
      IntegrationEngine.publish(
        [{ id: "P-1", title: "Producto", status: "publicado" }],
        undefined as unknown as IntegrationConnector<Input, Input>,
      ),
    ).rejects.toThrow();
  });

  it("reporta error de integración sin exportar datos inválidos", async () => {
    const result = await IntegrationEngine.publish(
      [{ id: "BAD", title: "Inválido", status: "publicado" }],
      createConnector("invalid", () => ["invalid product"]),
    );
    expect(result.status).toMatchObject({
      status: "warning",
      items_exported: 0,
      items_invalid: 1,
    });
    expect(write).toHaveBeenCalledWith(
      expect.objectContaining({ key: "invalid" }),
      [],
      expect.any(String),
    );
  });

  it("propaga errores del exportador", async () => {
    write.mockRejectedValueOnce(new Error("export failure"));
    await expect(
      IntegrationEngine.publish(
        [{ id: "P-1", title: "Producto", status: "publicado" }],
        createConnector(),
      ),
    ).rejects.toThrow("export failure");
  });

  it("mantiene aislados los resultados de conectores sucesivos", async () => {
    const input = [{ id: "P-1", title: "Producto", status: "publicado" }];
    const first = await IntegrationEngine.publish(input, createConnector("one"));
    const second = await IntegrationEngine.publish(
      input,
      createConnector("two", () => ["blocked"]),
    );
    expect(first.status.status).toBe("ok");
    expect(second.status.status).toBe("warning");
    expect(first.status.connector).toBe("one");
    expect(second.status.connector).toBe("two");
  });
});
