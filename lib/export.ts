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
  });

  doc.save(`${filename}.pdf`);
}
