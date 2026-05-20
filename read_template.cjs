const XLSX = require('xlsx');
const wb = XLSX.readFile('C:/Users/DELL/.claude/skills/bao-gia-noi-that/templates/Khung bao gia.xlsx');
console.log('Sheets:', JSON.stringify(wb.SheetNames));
wb.SheetNames.forEach(s => {
  const rows = XLSX.utils.sheet_to_json(wb.Sheets[s], { header: 1, blankrows: false });
  console.log('--- ' + s + ' --- (' + rows.length + ' rows)');
  rows.slice(0, 15).forEach((r, i) => console.log(i, JSON.stringify(r)));
});
