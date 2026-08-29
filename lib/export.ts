import * as XLSX from "xlsx";
import { jsPDF } from "jspdf";
import { autoTable } from "jspdf-autotable";

export interface ExportColumn<T> {
  header: string;
  value: (row: T) => string | number;
}

export function exportToExcel<T>(
  filename: string,
  columns: ExportColumn<T>[],
  rows: T[]
) {
  const data = rows.map((row) => {
    const record: Record<string, string | number> = {};
    for (const col of columns) {
      record[col.header] = col.value(row);
    }
    return record;
  });

  const worksheet = XLSX.utils.json_to_sheet(data);
  const workbook = XLSX.utils.book_new();
  XLSX.utils.book_append_sheet(workbook, worksheet, "Sheet1");
  XLSX.writeFile(workbook, `${filename}.xlsx`);
}

const STATUS_CELL_STYLES: Record<string, { textColor: [number, number, number]; fillColor: [number, number, number] }> = {
  paid: { textColor: [21, 128, 61], fillColor: [220, 252, 231] },
  pending: { textColor: [185, 28, 28], fillColor: [254, 226, 226] },
  exempt: { textColor: [29, 78, 216], fillColor: [219, 234, 254] },
};

export function exportToPdf<T>(
  title: string,
  filename: string,
  columns: ExportColumn<T>[],
  rows: T[]
) {
  const doc = new jsPDF({ orientation: columns.length > 5 ? "landscape" : "portrait" });
  doc.setFontSize(16);
  doc.text(title, 14, 15);

  autoTable(doc, {
    startY: 22,
    head: [columns.map((col) => col.header)],
    body: rows.map((row) => columns.map((col) => String(col.value(row)))),
    styles: { fontSize: 10, cellPadding: 3 },
    headStyles: { fontSize: 10, fontStyle: "bold", fillColor: [37, 99, 235] },
    // Draw status cells as real rounded pill badges (inset within the cell,
    // with a gap on every side) instead of an edge-to-edge fill -- adjacent
    // same-status cells were otherwise blending into one solid colored bar.
    // Returning false skips autoTable's own background/border/text drawing
    // for this cell so our custom pill is the only thing rendered.
    willDrawCell: (data) => {
      if (data.section !== "body") return;
      const label = data.cell.text.join(" ").trim();
      const style = STATUS_CELL_STYLES[label.toLowerCase()];
      if (!style) return;

      const { x, y, width, height } = data.cell;
      const padX = 2.5;
      const padY = 2;
      const pillX = x + padX;
      const pillY = y + padY;
      const pillW = width - padX * 2;
      const pillH = height - padY * 2;
      const radius = pillH / 2;

      data.doc.setFillColor(...style.fillColor);
      data.doc.roundedRect(pillX, pillY, pillW, pillH, radius, radius, "F");

      data.doc.setFont("helvetica", "bold");
      data.doc.setFontSize(9);
      data.doc.setTextColor(...style.textColor);
      const textWidth = data.doc.getTextWidth(label);
      data.doc.text(label, pillX + pillW / 2 - textWidth / 2, pillY + pillH / 2 + 3);

      return false;
    },
  });

  doc.save(`${filename}.pdf`);
}
