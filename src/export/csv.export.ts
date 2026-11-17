export type CsvValue = string | number | boolean | Date | null | undefined;

const BOM = "﻿";
const FORMULA_PREFIX = /^[=+\-@\t\r]/;

/** Escapes one CSV cell: quotes, commas and line breaks (RFC 4180) + formula injection. */
export function escapeCsvCell(value: CsvValue): string {
  if (value === null || value === undefined) return "";
  let text = value instanceof Date ? value.toISOString() : String(value);
  // Neutralize spreadsheet formulas (=, +, -, @) in user-provided text.
  if (typeof value === "string" && FORMULA_PREFIX.test(text)) {
    text = `'${text}`;
  }
  return /[",\r\n]/.test(text) ? `"${text.replace(/"/g, '""')}"` : text;
}

export function toCsv(headers: string[], rows: CsvValue[][]): string {
  const lines = [headers, ...rows].map((row) =>
    row.map(escapeCsvCell).join(","),
  );
  // BOM keeps accents readable when opened in Excel.
  return BOM + lines.join("\r\n") + "\r\n";
}
