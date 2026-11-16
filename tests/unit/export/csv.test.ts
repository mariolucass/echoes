import { describe, expect, it } from "vitest";
import { escapeCsvCell, toCsv } from "../../../src/export/csv.export.js";

describe("csv export", () => {
  it("leaves simple values untouched and renders null as empty", () => {
    expect(escapeCsvCell("abc")).toBe("abc");
    expect(escapeCsvCell(null)).toBe("");
    expect(escapeCsvCell(undefined)).toBe("");
    expect(escapeCsvCell(42)).toBe("42");
  });

  it("escapes commas, quotes and line breaks", () => {
    expect(escapeCsvCell("a,b")).toBe('"a,b"');
    expect(escapeCsvCell('diz "oi"')).toBe('"diz ""oi"""');
    expect(escapeCsvCell("linha1\nlinha2")).toBe('"linha1\nlinha2"');
    expect(escapeCsvCell("linha1\r\nlinha2")).toBe('"linha1\r\nlinha2"');
  });

  it("neutralizes spreadsheet formula injection", () => {
    expect(escapeCsvCell("=SUM(A1)")).toBe("'=SUM(A1)");
    expect(escapeCsvCell("@cmd")).toBe("'@cmd");
  });

  it("serializes dates as ISO strings", () => {
    expect(escapeCsvCell(new Date("2026-01-02T03:04:05.000Z"))).toBe(
      "2026-01-02T03:04:05.000Z",
    );
  });

  it("builds header + rows with CRLF and a BOM", () => {
    const csv = toCsv(["a", "b"], [["1", "x,y"]]);
    expect(csv).toBe('﻿a,b\r\n1,"x,y"\r\n');
  });
});
