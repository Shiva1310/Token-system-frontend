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

const STATUS_TEXT_COLORS: Record<string, [number, number, number]> = {
  paid: [21, 128, 61],
  pending: [185, 28, 28],
  exempt: [29, 78, 216],
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
    // Plain colored, bold, centered text for status cells -- no pill/badge
    // background, just the wording in color, on the row's normal background.
    didParseCell: (data) => {
      if (data.section !== "body") return;
      const text = data.cell.text.join(" ").trim().toLowerCase();
      const color = STATUS_TEXT_COLORS[text];
      if (color) {
        data.cell.styles.textColor = color;
        data.cell.styles.fontStyle = "bold";
        data.cell.styles.halign = "center";
      }
    },
  });

  doc.save(`${filename}.pdf`);
}
