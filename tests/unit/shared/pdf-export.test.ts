import { describe, expect, it } from "vitest";
import { exportPdf } from "../../../src/export/pdf.export.js";

describe("PDF pagination", () => {
  it("keeps a short report on one page without adding footer-only pages", async () => {
    const pdf = await exportPdf({
      title: "Relatório",
      entries: [{ title: "Decisão", details: ["Uma escolha."] }],
    });
    expect(pdf.subarray(0, 5).toString()).toBe("%PDF-");
    expect(pdf.toString("latin1").match(/\/Type \/Page\b/g)).toHaveLength(1);
  });

  it("splits a single long field over pages and preserves its ending", async () => {
    const pdf = await exportPdf(
      {
        title: "Relatório longo",
        entries: [
          {
            title: "Contexto",
            details: ["Evidência e aprendizado. ".repeat(1800) + "ENDMARKER"],
          },
        ],
      },
      { page: { compress: false } },
    );
    const source = pdf.toString("latin1");
    expect(source.match(/\/Type \/Page\b/g)!.length).toBeGreaterThan(3);
    // Embedded fonts encode glyph IDs in page streams and preserve text through
    // the ToUnicode map, rather than writing the original UTF-8 bytes there.
    expect(source).toMatch(/<004e> <0044> <004d> <0041> <0052> <004b>/);
  });
});
