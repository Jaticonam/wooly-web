import { describe, it, expect } from "vitest";
import {
  definitionDraft,
  createDefinitionCommand,
  updateDefinitionCommand,
  optionDraft,
  createOptionCommand,
  ordered,
  typeLabels,
} from "./CategoryAttributeFormData";
import type { AdminCategoryAttributeDefinition } from "@/modules/admin-auth/services/AdminAuthClient";
const definition: AdminCategoryAttributeDefinition = {
  id: "d",
  code: "original",
  label: "Tamaño",
  type: "MEASUREMENT",
  role: "SIZE",
  required: false,
  multiple: false,
  allowCustomValue: true,
  status: "ACTIVE",
  position: 42,
  config: { allowedUnitCodes: ["cm", "m"], defaultUnitCode: "cm" },
  options: [],
};
describe("Human attribute form commands", () => {
  it.each(["TEXT", "NUMBER", "SELECT", "MEASUREMENT", "COLOR"] as const)(
    "creates %s with only human meaning",
    (type) => {
      const fields = createDefinitionCommand({
        ...definitionDraft(),
        label: "Nombre",
        type,
        required: true,
        multiple: true,
        allowCustomValue: true,
        units: " CM, m, mm, , cm ",
        defaultUnit: " CM ",
      });
      expect(fields).toMatchObject({
        label: "Nombre",
        type,
        role: "ATTRIBUTE",
        required: true,
        multiple: true,
        allowCustomValue: true,
      });
      expect(Object.keys(fields).sort()).toEqual(
        ["label", "type", "role", "required", "multiple", "allowCustomValue", "config"].sort(),
      );
      expect(fields.config).toEqual(
        type === "MEASUREMENT"
          ? { allowedUnitCodes: ["cm", "m", "mm"], defaultUnitCode: "cm" }
          : {},
      );
      expect(definitionDraft()).not.toHaveProperty("position");
      expect(definitionDraft()).not.toHaveProperty("status");
    },
  );
  it.each(["TEXT", "NUMBER", "COLOR"] as const)("rejects an invalid size type %s", (type) =>
    expect(() => createDefinitionCommand({ ...definitionDraft(definition), type })).toThrow(),
  );
  it.each([
    { units: "", defaultUnit: "cm" },
    { units: "cm, m", defaultUnit: "mm" },
  ])("validates measurement units %j", (change) =>
    expect(() => createDefinitionCommand({ ...definitionDraft(definition), ...change })).toThrow(),
  );
  it("requires a human name", () =>
    expect(() => createDefinitionCommand(definitionDraft())).toThrow());
  it("does not edit identity or dimension or degrade archived status", () => {
    const draft = definitionDraft({ ...definition, status: "ARCHIVED" });
    const command = updateDefinitionCommand({ ...draft, label: "Nueva medida" });
    expect(Object.keys(command).sort()).toEqual(
      ["label", "required", "multiple", "allowCustomValue", "config"].sort(),
    );
    expect(command).not.toHaveProperty("status");
    expect(
      updateDefinitionCommand({ ...draft, available: true, availabilityChanged: true }),
    ).toMatchObject({ status: "ACTIVE" });
    expect(
      updateDefinitionCommand({ ...draft, available: false, availabilityChanged: true }),
    ).toMatchObject({ status: "INACTIVE" });
  });
  it.each([
    ["TEXT", { label: "Blanco" }],
    ["SELECT", { label: "Blanco" }],
    ["NUMBER", { label: "Blanco", amount: "25" }],
    ["MEASUREMENT", { label: "Blanco", amount: "25", unitCode: "cm" }],
    ["COLOR", { label: "Blanco", hex: "#FFFFFF" }],
  ] as const)("projects exact %s CREATE command", (type, expected) => {
    expect(
      createOptionCommand(type, {
        ...optionDraft(definition),
        label: " Blanco ",
        amount: "25",
        unitCode: " CM ",
        hex: "#FFFFFF",
      }),
    ).toEqual(expected);
  });
  it("accepts empty color hex as null and rejects invalid hex / empty values", () => {
    expect(createOptionCommand("COLOR", { ...optionDraft(definition), label: "Blanco" })).toEqual({
      label: "Blanco",
      hex: null,
    });
    expect(() =>
      createOptionCommand("COLOR", { ...optionDraft(definition), label: "Blanco", hex: "bad" }),
    ).toThrow();
    for (const type of ["NUMBER", "MEASUREMENT"] as const)
      expect(() =>
        createOptionCommand(type, { ...optionDraft(definition), label: "Nombre" }),
      ).toThrow();
  });
  it("keeps deterministic presentation order and human labels", () => {
    const rows = [
      { position: 1, code: "a", id: "1" },
      { position: 0, code: "b", id: "1" },
      { position: 0, code: "a", id: "2" },
      { position: 0, code: "a", id: "1" },
    ];
    expect(ordered(rows).map((x) => x.code + x.id)).toEqual(["a1", "a2", "b1", "a1"]);
    expect(rows[0].position).toBe(1);
    expect(typeLabels.SELECT).toBe("Lista de opciones");
  });
});
