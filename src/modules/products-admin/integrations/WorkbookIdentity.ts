export function workbookId(value: string) {
  const match = value.trim().match(/\/spreadsheets\/d\/([A-Za-z0-9_-]+)/);
  const id = match?.[1] ?? value.trim();
  if (!/^[A-Za-z0-9_-]{10,200}$/.test(id))
    throw Error("Ingresa el enlace o identificador del workbook operativo");
  return id;
}
