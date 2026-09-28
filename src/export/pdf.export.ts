import PDFDocument from "pdfkit";

export interface PdfEntry {
  title: string;
  details?: string[];
}

export interface PdfReport {
  title: string;
  summary?: string;
  emptyMessage?: string;
  entries: PdfEntry[];
}

export interface PdfExportOptions {
  page?: PDFKit.PDFDocumentOptions;
  colors?: Partial<{
    background: string;
    surface: string;
    border: string;
    title: string;
    summary: string;
    entryTitle: string;
    entryDetail: string;
    emptyMessage: string;
    accent: string;
    footer: string;
  }>;
  fontSizes?: Partial<{
    title: number;
    summary: number;
    entryTitle: number;
    entryDetail: number;
    emptyMessage: number;
    footer: number;
  }>;
  spacing?: Partial<{
    pageMargin: number;
    afterTitle: number;
    afterSummary: number;
    entryPaddingX: number;
    entryPaddingY: number;
    entryGap: number;
    detailGap: number;
  }>;
  footerText?: string;
}

const palette = {
  background: "#ffffff",
  surface: "#f5f5f7",
  border: "#d2d2d7",
  title: "#1d1d1f",
  summary: "#6e6e73",
  entryTitle: "#1d1d1f",
  entryDetail: "#6e6e73",
  emptyMessage: "#6e6e73",
  accent: "#2563eb",
  footer: "#86868b",
};

const defaultFontSizes = {
  title: 25,
  summary: 11,
  entryTitle: 12.5,
  entryDetail: 10.5,
  emptyMessage: 11,
  footer: 8.5,
};

const defaultSpacing = {
  pageMargin: 56,
  afterTitle: 14,
  afterSummary: 26,
  entryPaddingX: 18,
  entryPaddingY: 14,
  entryGap: 12,
  detailGap: 4,
};

type Colors = typeof palette;
type FontSizes = typeof defaultFontSizes;
type Spacing = typeof defaultSpacing;

function measureEntryHeight(
  document: PDFKit.PDFDocument,
  entry: PdfEntry,
  textWidth: number,
  sizes: FontSizes,
  space: Spacing,
) {
  document.font("Helvetica-Bold").fontSize(sizes.entryTitle);
  let height =
    space.entryPaddingY * 2 +
    document.heightOfString(entry.title, { width: textWidth });

  if (entry.details?.length) {
    document.font("Helvetica").fontSize(sizes.entryDetail);
    entry.details.forEach((detail) => {
      height +=
        space.detailGap + document.heightOfString(detail, { width: textWidth });
    });
  }

  return height;
}

function drawEntry(
  document: PDFKit.PDFDocument,
  entry: PdfEntry,
  x: number,
  y: number,
  width: number,
  height: number,
  colors: Colors,
  sizes: FontSizes,
  space: Spacing,
) {
  document
    .roundedRect(x, y, width, height, 10)
    .fillColor(colors.surface)
    .fill();

  document
    .roundedRect(x, y, width, height, 10)
    .lineWidth(0.75)
    .strokeColor(colors.border)
    .stroke();

  document.roundedRect(x, y, 3, height, 1.5).fillColor(colors.accent).fill();

  const textX = x + space.entryPaddingX;
  const textWidth = width - space.entryPaddingX * 2;
  let cursorY = y + space.entryPaddingY;

  document
    .fillColor(colors.entryTitle)
    .font("Helvetica-Bold")
    .fontSize(sizes.entryTitle)
    .text(entry.title, textX, cursorY, { width: textWidth });
  cursorY += document.heightOfString(entry.title, { width: textWidth });

  entry.details?.forEach((detail) => {
    cursorY += space.detailGap;
    document
      .fillColor(colors.entryDetail)
      .font("Helvetica")
      .fontSize(sizes.entryDetail)
      .text(detail, textX, cursorY, { width: textWidth });
    cursorY += document.heightOfString(detail, { width: textWidth });
  });
}

function paintBackground(document: PDFKit.PDFDocument, color: string) {
  document.rect(0, 0, document.page.width, document.page.height).fill(color);
}

function drawFooters(
  document: PDFKit.PDFDocument,
  colors: Colors,
  sizes: FontSizes,
  space: Spacing,
  footerText: string,
) {
  const range = document.bufferedPageRange();
  const contentWidth = document.page.width - space.pageMargin * 2;

  for (let i = 0; i < range.count; i += 1) {
    document.switchToPage(range.start + i);
    const footerY = document.page.height - space.pageMargin + 18;

    document
      .fillColor(colors.footer)
      .font("Helvetica")
      .fontSize(sizes.footer)
      .text(footerText, space.pageMargin, footerY, { width: contentWidth / 2 });

    document
      .fillColor(colors.footer)
      .font("Helvetica")
      .fontSize(sizes.footer)
      .text(`${i + 1} / ${range.count}`, space.pageMargin, footerY, {
        width: contentWidth,
        align: "right",
      });
  }
}

export function exportPdf(
  report: PdfReport,
  options: PdfExportOptions = {},
): Promise<Buffer> {
  return new Promise((resolve, reject) => {
    const colors: Colors = { ...palette, ...options.colors };
    const sizes: FontSizes = { ...defaultFontSizes, ...options.fontSizes };
    const space: Spacing = { ...defaultSpacing, ...options.spacing };

    const document = new PDFDocument({
      size: "A4",
      margin: space.pageMargin,
      bufferPages: true,
      ...options.page,
    });

    const chunks: Buffer[] = [];
    document.on("data", (chunk: Buffer) => chunks.push(chunk));
    document.on("end", () => resolve(Buffer.concat(chunks)));
    document.on("error", reject);

    const contentWidth = document.page.width - space.pageMargin * 2;

    paintBackground(document, colors.background);

    document
      .fillColor(colors.title)
      .font("Helvetica-Bold")
      .fontSize(sizes.title)
      .text(report.title, space.pageMargin, space.pageMargin, {
        characterSpacing: -0.3,
      });

    let cursorY = document.y + space.afterTitle;

    document
      .moveTo(space.pageMargin, cursorY)
      .lineTo(document.page.width - space.pageMargin, cursorY)
      .lineWidth(0.75)
      .strokeColor(colors.border)
      .stroke();

    cursorY += 16;

    if (report.summary) {
      document
        .fillColor(colors.summary)
        .font("Helvetica")
        .fontSize(sizes.summary)
        .text(report.summary, space.pageMargin, cursorY, {
          width: contentWidth,
        });
      cursorY = document.y + space.afterSummary;
    }

    const bottomLimit = document.page.height - space.pageMargin;

    if (report.entries.length === 0 && report.emptyMessage) {
      document
        .fillColor(colors.emptyMessage)
        .font("Helvetica")
        .fontSize(sizes.emptyMessage)
        .text(report.emptyMessage, space.pageMargin, cursorY, {
          width: contentWidth,
        });
    }

    report.entries.forEach((entry) => {
      const textWidth = contentWidth - space.entryPaddingX * 2;
      const height = measureEntryHeight(
        document,
        entry,
        textWidth,
        sizes,
        space,
      );

      if (cursorY + height > bottomLimit) {
        document.addPage();
        paintBackground(document, colors.background);
        cursorY = space.pageMargin;
      }

      drawEntry(
        document,
        entry,
        space.pageMargin,
        cursorY,
        contentWidth,
        height,
        colors,
        sizes,
        space,
      );
      cursorY += height + space.entryGap;
    });

    drawFooters(document, colors, sizes, space, options.footerText ?? "");

    document.end();
  });
}
