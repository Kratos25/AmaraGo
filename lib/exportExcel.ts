/**
 * exportExcel.ts — Utility for exporting data to Excel (xlsx) with multiple sheets.
 * Uses SheetJS (xlsx) which is a client-side library.
 */

import * as XLSX from 'xlsx';

export interface SheetData {
  name: string;
  rows: Record<string, string | number | boolean | null | undefined>[];
}

export function exportToExcel(sheets: SheetData[], fileName: string) {
  const wb = XLSX.utils.book_new();
  for (const sheet of sheets) {
    const ws = XLSX.utils.json_to_sheet(sheet.rows.length > 0 ? sheet.rows : [{}]);
    XLSX.utils.book_append_sheet(wb, ws, sheet.name);
  }
  XLSX.writeFile(wb, `${fileName}.xlsx`);
}
