import type { ServiceItem } from "../types";

const PAGE_WIDTH = 595;
const PAGE_HEIGHT = 842;
const LEFT_MARGIN = 40;
const RIGHT_MARGIN = 40;
const TABLE_WIDTH = PAGE_WIDTH - LEFT_MARGIN - RIGHT_MARGIN;
const ROW_HEIGHT = 24;
const MAX_ROWS_PER_PAGE = 20;

function formatPrice(cents: number) {
  return `R$ ${(cents / 100).toFixed(2).replace(".", ",")}`;
}

export function sanitizePdfText(value: string) {
  return value
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/[^\x20-\x7E]/g, " ")
    .replace(/\s+/g, " ")
    .trim();
}

function escapePdfText(value: string) {
  return sanitizePdfText(value)
    .replace(/\\/g, "\\\\")
    .replace(/\(/g, "\\(")
    .replace(/\)/g, "\\)");
}

function truncateText(value: string, maxLength: number) {
  const sanitized = sanitizePdfText(value);

  if (sanitized.length <= maxLength) {
    return sanitized;
  }

  return `${sanitized.slice(0, Math.max(0, maxLength - 3))}...`;
}

function buildText(
  x: number,
  y: number,
  text: string,
  options?: {
    size?: number;
    font?: "F1" | "F2";
    color?: [number, number, number];
  },
) {
  const size = options?.size ?? 11;
  const font = options?.font ?? "F1";
  const color = options?.color ?? [0.1, 0.1, 0.12];

  return `BT /${font} ${size} Tf ${color[0]} ${color[1]} ${color[2]} rg 1 0 0 1 ${x} ${y} Tm (${escapePdfText(text)}) Tj ET`;
}

function buildLine(x1: number, y1: number, x2: number, y2: number) {
  return `${x1} ${y1} m ${x2} ${y2} l S`;
}

function buildFilledRect(
  x: number,
  y: number,
  width: number,
  height: number,
  color: [number, number, number],
) {
  return `q ${color[0]} ${color[1]} ${color[2]} rg ${x} ${y} ${width} ${height} re f Q`;
}

function buildStrokeRect(
  x: number,
  y: number,
  width: number,
  height: number,
  color: [number, number, number],
) {
  return `q ${color[0]} ${color[1]} ${color[2]} RG ${x} ${y} ${width} ${height} re S Q`;
}

function buildPageContent(
  rows: ServiceItem[],
  includeDepositColumn: boolean,
  professionalName: string,
  pageNumber: number,
  totalPages: number,
) {
  const title = truncateText(professionalName || "Profissional", 36);
  const subtitle = "Lista de servicos";
  const notice =
    "O valor da coluna Sinal e pago para garantir o agendamento.";
  const headerBottomY = includeDepositColumn ? 714 : 730;
  const commands: string[] = [
    buildText(LEFT_MARGIN, 790, title, {
      size: 22,
      font: "F2",
      color: [0.11, 0.11, 0.14],
    }),
    buildText(LEFT_MARGIN, 770, subtitle, {
      size: 12,
      color: [0.44, 0.46, 0.5],
    }),
  ];

  if (includeDepositColumn) {
    commands.push(
      buildFilledRect(LEFT_MARGIN, 742, TABLE_WIDTH, 18, [0.99, 0.96, 0.96]),
      buildText(LEFT_MARGIN + 10, 748, notice, {
        size: 9,
        color: [0.52, 0.36, 0.38],
      }),
    );
  }

  commands.push(
    buildFilledRect(LEFT_MARGIN, headerBottomY, TABLE_WIDTH, 24, [0.98, 0.93, 0.95]),
    buildStrokeRect(
      LEFT_MARGIN,
      headerBottomY - ROW_HEIGHT * rows.length,
      TABLE_WIDTH,
      24 + ROW_HEIGHT * rows.length,
      [0.92, 0.86, 0.88],
    ),
  );

  const priceColumnX = includeDepositColumn ? 350 : 430;
  const depositColumnX = 455;
  const tableTopY = headerBottomY + 8;
  const tableBottomY = headerBottomY - ROW_HEIGHT * rows.length;

  commands.push(
    buildText(LEFT_MARGIN + 8, tableTopY, "Nome", {
      size: 10,
      font: "F2",
      color: [0.38, 0.24, 0.3],
    }),
    buildText(priceColumnX, tableTopY, "Preco", {
      size: 10,
      font: "F2",
      color: [0.38, 0.24, 0.3],
    }),
  );

  if (includeDepositColumn) {
    commands.push(
      buildText(depositColumnX, tableTopY, "Sinal", {
        size: 10,
        font: "F2",
        color: [0.38, 0.24, 0.3],
      }),
      buildLine(440, headerBottomY, 440, tableBottomY),
    );
  }

  commands.push(
    buildLine(priceColumnX - 18, headerBottomY, priceColumnX - 18, tableBottomY),
  );

  rows.forEach((service, index) => {
    const rowTop = headerBottomY - index * ROW_HEIGHT;
    const textY = rowTop - 16;
    const depositAmount =
      service.depositPercentage != null
        ? Math.round((service.price * service.depositPercentage) / 100)
        : null;

    commands.push(buildLine(LEFT_MARGIN, rowTop, LEFT_MARGIN + TABLE_WIDTH, rowTop));
    commands.push(
      buildText(
        LEFT_MARGIN + 8,
        textY,
        truncateText(service.name, includeDepositColumn ? 34 : 48),
        {
          size: 10,
        },
      ),
      buildText(priceColumnX, textY, formatPrice(service.price), {
        size: 10,
      }),
    );

    if (includeDepositColumn) {
      commands.push(
        buildText(
          depositColumnX,
          textY,
          depositAmount !== null ? formatPrice(depositAmount) : "-",
          {
            size: 10,
          },
        ),
      );
    }
  });

  commands.push(
    buildLine(LEFT_MARGIN, tableBottomY, LEFT_MARGIN + TABLE_WIDTH, tableBottomY),
    buildText(LEFT_MARGIN, 36, `Pagina ${pageNumber} de ${totalPages}`, {
      size: 9,
      color: [0.55, 0.57, 0.61],
    }),
  );

  return commands.join("\n");
}

export function buildServicesPdfDocument(
  services: ServiceItem[],
  professionalName: string,
) {
  const includeDepositColumn = services.some(
    (service) => service.depositPercentage != null,
  );
  const pages = [];

  for (let index = 0; index < services.length; index += MAX_ROWS_PER_PAGE) {
    pages.push(services.slice(index, index + MAX_ROWS_PER_PAGE));
  }

  const pageContents = pages.map((pageRows, pageIndex) =>
    buildPageContent(
      pageRows,
      includeDepositColumn,
      professionalName,
      pageIndex + 1,
      pages.length,
    ),
  );

  const objects: string[] = [];
  objects[1] = "<< /Type /Catalog /Pages 2 0 R >>";
  objects[2] = `<< /Type /Pages /Count ${pageContents.length} /Kids [${pageContents
    .map((_, index) => `${5 + index * 2} 0 R`)
    .join(" ")}] >>`;
  objects[3] = "<< /Type /Font /Subtype /Type1 /BaseFont /Helvetica >>";
  objects[4] = "<< /Type /Font /Subtype /Type1 /BaseFont /Helvetica-Bold >>";

  pageContents.forEach((content, index) => {
    const pageId = 5 + index * 2;
    const contentId = pageId + 1;

    objects[pageId] =
      `<< /Type /Page /Parent 2 0 R /MediaBox [0 0 ${PAGE_WIDTH} ${PAGE_HEIGHT}] /Resources << /Font << /F1 3 0 R /F2 4 0 R >> >> /Contents ${contentId} 0 R >>`;
    objects[contentId] = `<< /Length ${content.length} >>\nstream\n${content}\nendstream`;
  });

  let pdf = "%PDF-1.4\n";
  const offsets: number[] = [0];

  for (let index = 1; index < objects.length; index += 1) {
    offsets[index] = pdf.length;
    pdf += `${index} 0 obj\n${objects[index]}\nendobj\n`;
  }

  const xrefStart = pdf.length;
  pdf += `xref\n0 ${objects.length}\n0000000000 65535 f \n`;

  for (let index = 1; index < objects.length; index += 1) {
    pdf += `${String(offsets[index]).padStart(10, "0")} 00000 n \n`;
  }

  pdf += `trailer\n<< /Size ${objects.length} /Root 1 0 R >>\nstartxref\n${xrefStart}\n%%EOF`;

  return pdf;
}
