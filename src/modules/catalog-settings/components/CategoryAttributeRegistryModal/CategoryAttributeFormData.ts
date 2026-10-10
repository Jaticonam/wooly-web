import type {
  AdminAttributeType,
  AdminCategoryAttributeDefinition,
  AdminAttributeValue,
  CreateAdminCategoryAttributeInput,
  UpdateAdminCategoryAttributeInput,
  CreateAdminCategoryAttributeOptionInput,
} from "@/modules/admin-auth/services/AdminAuthClient";
export const typeLabels: Record<AdminAttributeType, string> = {
  TEXT: "Texto",
  NUMBER: "Número",
  SELECT: "Lista de opciones",
  MEASUREMENT: "Medida",
  COLOR: "Color",
};
export const statusLabels = { ACTIVE: "Activo", INACTIVE: "Inactivo", ARCHIVED: "Archivado" };
export const usageLabel = (role: string) =>
  role === "SIZE" ? "Tamaño del producto" : "Característica del producto";
export const ordered = <T extends { position: number; code: string; id: string }>(
  rows: readonly T[],
) =>
  [...rows].sort(
    (a, b) =>
      a.position - b.position ||
      (a.code < b.code ? -1 : a.code > b.code ? 1 : 0) ||
      (a.id < b.id ? -1 : a.id > b.id ? 1 : 0),
  );
export interface DefinitionDraft {
  label: string;
  type: AdminAttributeType;
  role: "ATTRIBUTE" | "SIZE";
  required: boolean;
  multiple: boolean;
  allowCustomValue: boolean;
  units: string;
  defaultUnit: string;
  available: boolean;
  availabilityChanged: boolean;
}
export function definitionDraft(value?: AdminCategoryAttributeDefinition): DefinitionDraft {
  return {
    label: value?.label ?? "",
    type: value?.type ?? "TEXT",
    role: value?.role ?? "ATTRIBUTE",
    required: value?.required ?? false,
    multiple: value?.multiple ?? false,
    allowCustomValue: value?.allowCustomValue ?? false,
    units: value?.config.allowedUnitCodes?.join(", ") ?? "",
    defaultUnit: value?.config.defaultUnitCode ?? "",
    available: value?.status === "ACTIVE",
    availabilityChanged: false,
  };
}
const requiredLabel = (label: string) => {
  if (!label.trim()) throw new Error("El nombre es obligatorio.");
  return label.trim();
};
function humanFields(d: DefinitionDraft) {
  const units = [
      ...new Set(
        d.units
          .split(",")
          .map((s) => s.trim().toLowerCase())
          .filter(Boolean),
      ),
    ],
    unit = d.defaultUnit.trim().toLowerCase();
  if (d.type === "MEASUREMENT" && (!units.length || !units.includes(unit)))
    throw new Error("Indica unidades disponibles y una unidad principal incluida en ellas.");
  return {
    label: requiredLabel(d.label),
    required: d.required,
    multiple: d.multiple,
    allowCustomValue: d.allowCustomValue,
    config: d.type === "MEASUREMENT" ? { allowedUnitCodes: units, defaultUnitCode: unit } : {},
  };
}
export function createDefinitionCommand(d: DefinitionDraft): CreateAdminCategoryAttributeInput {
  if (d.role === "SIZE" && d.type !== "SELECT" && d.type !== "MEASUREMENT")
    throw new Error("Tamaño del producto requiere Lista de opciones o Medida.");
  return { ...humanFields(d), type: d.type, role: d.role };
}
export function updateDefinitionCommand(d: DefinitionDraft): UpdateAdminCategoryAttributeInput {
  return {
    ...humanFields(d),
    ...(d.availabilityChanged
      ? { status: d.available ? ("ACTIVE" as const) : ("INACTIVE" as const) }
      : {}),
  };
}
export interface OptionDraft {
  label: string;
  amount: string;
  unitCode: string;
  hex: string;
}
export function optionDraft(definition: AdminCategoryAttributeDefinition): OptionDraft {
  return {
    label: "",
    amount: "",
    unitCode: definition.config.defaultUnitCode ?? definition.config.allowedUnitCodes?.[0] ?? "",
    hex: "",
  };
}
export function createOptionCommand(
  type: AdminAttributeType,
  d: OptionDraft,
): CreateAdminCategoryAttributeOptionInput {
  const label = requiredLabel(d.label);
  if (type === "TEXT" || type === "SELECT") return { label };
  if (type === "NUMBER" || type === "MEASUREMENT") {
    if (!d.amount.trim()) throw new Error("El valor es obligatorio.");
    if (type === "NUMBER") return { label, amount: d.amount.trim() };
    if (!d.unitCode.trim()) throw new Error("La unidad es obligatoria.");
    return { label, amount: d.amount.trim(), unitCode: d.unitCode.trim().toLowerCase() };
  }
  const hex = d.hex.trim();
  if (hex && !/^#[0-9a-f]{6}$/i.test(hex)) throw new Error("El color debe usar #RRGGBB.");
  return { label, hex: hex || null };
}
export function valueLabel(value: AdminAttributeValue): string {
  switch (value.kind) {
    case "TEXT":
    case "SELECT":
      return value.text;
    case "NUMBER":
      return value.amount;
    case "MEASUREMENT":
      return value.amount + " " + value.unitCode;
    case "COLOR":
      return value.label + (value.hex ? " · " + value.hex : "");
  }
}
