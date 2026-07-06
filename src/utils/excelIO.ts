// Đọc/ghi Excel dùng chung — theo đúng pattern đã có trong Construction.tsx (dynamic import,
// XLSX.read({type:'array'}) + FileReader.readAsArrayBuffer) để không thêm cách đọc file mới.

export async function readExcelFile(file: File): Promise<Record<string, any>[]> {
  const { read, utils } = await import('xlsx');
  const buffer = await file.arrayBuffer();
  const wb = read(buffer, { type: 'array' });
  const ws = wb.Sheets[wb.SheetNames[0]];
  return utils.sheet_to_json(ws, { defval: '' });
}

export async function exportRowsToExcel(rows: Record<string, any>[], filename: string, sheetName = 'Data') {
  const { utils, writeFile } = await import('xlsx');
  const ws = utils.json_to_sheet(rows);
  const wb = utils.book_new();
  utils.book_append_sheet(wb, ws, sheetName);
  writeFile(wb, filename);
}
