import * as XLSX from 'xlsx';
import type { BOQLineItem, InteriorQuoteProject } from './interiorQuoteTypes';
import { MARGIN_STRATEGIES, NGOAI_TINH_PERCENT } from '../constants/priceBook';

export interface QuoteSummary {
  subtotal: number;
  marginPercent: number;
  marginAmount: number;
  ngoaiTinhAmount: number;
  totalBeforeVAT: number;
  vat: number;
  totalAfterVAT: number;
}

export function calculateSummary(
  items: BOQLineItem[],
  marginStrategy: keyof typeof MARGIN_STRATEGIES,
  isOutOfTown: boolean,
  vatRate = 8
): QuoteSummary {
  const subtotal = items.reduce((sum, it) => sum + it.quantity * it.wasteFactor * it.selectedPrice, 0);
  const strategy = MARGIN_STRATEGIES[marginStrategy];
  const marginPercent = (strategy.min + strategy.max) / 2;
  const marginAmount = subtotal * marginPercent;
  const afterMargin = subtotal + marginAmount;
  const ngoaiTinhAmount = isOutOfTown ? afterMargin * (NGOAI_TINH_PERCENT / 100) : 0;
  const totalBeforeVAT = afterMargin + ngoaiTinhAmount;
  const vat = totalBeforeVAT * (vatRate / 100);
  const totalAfterVAT = totalBeforeVAT + vat;

  return { subtotal, marginPercent, marginAmount, ngoaiTinhAmount, totalBeforeVAT, vat, totalAfterVAT };
}

export function exportToExcel(project: InteriorQuoteProject, items: BOQLineItem[], summary: QuoteSummary) {
  const wsData: any[][] = [
    ['BÁO GIÁ THI CÔNG NỘI THẤT'],
    [],
    ['Tên dự án:', project.name],
    ['Khách hàng:', project.clientName],
    ['Loại hình:', project.type === 'chung_cu' ? 'Chung cư' : project.type === 'nha_o' ? 'Nhà ở' : 'Shop'],
    ['Diện tích sàn:', `${project.area} m²`],
    ['Mức giá:', project.tier.toUpperCase()],
    ['Margin:', MARGIN_STRATEGIES[project.marginStrategy].label],
    ['Ngoại tỉnh:', project.isOutOfTown ? 'Có (+4%)' : 'Không'],
    [],
    ['STT', 'Hạng mục', 'Đơn vị', 'Khối lượng', 'Hệ số hao hụt', 'KL thực tế', 'Đơn giá', 'Thành tiền', 'Ghi chú'],
  ];

  items.forEach((item, i) => {
    const actualQty = item.quantity * item.wasteFactor;
    const total = actualQty * item.selectedPrice;
    wsData.push([
      i + 1,
      item.itemName,
      item.unit,
      item.quantity,
      item.wasteFactor,
      Math.round(actualQty * 100) / 100,
      item.selectedPrice,
      Math.round(total),
      item.note || '',
    ]);
  });

  wsData.push([]);
  wsData.push(['', '', '', '', '', '', 'Tổng cộng:', Math.round(summary.subtotal)]);
  wsData.push(['', '', '', '', '', '', `Margin (${(summary.marginPercent * 100).toFixed(0)}%):`, Math.round(summary.marginAmount)]);
  if (summary.ngoaiTinhAmount > 0) {
    wsData.push(['', '', '', '', '', '', 'Phụ thu ngoại tỉnh (4%):', Math.round(summary.ngoaiTinhAmount)]);
  }
  wsData.push(['', '', '', '', '', '', 'Tổng trước VAT:', Math.round(summary.totalBeforeVAT)]);
  wsData.push(['', '', '', '', '', '', 'VAT (8%):', Math.round(summary.vat)]);
  wsData.push(['', '', '', '', '', '', 'TỔNG SAU VAT:', Math.round(summary.totalAfterVAT)]);
  wsData.push([]);
  wsData.push(['Ghi chú: Khối lượng cuối cùng được xác định theo nghiệm thu thực tế tại công trình.']);

  const ws = XLSX.utils.aoa_to_sheet(wsData);
  ws['!cols'] = [
    { wch: 5 }, { wch: 40 }, { wch: 8 }, { wch: 12 }, { wch: 12 }, { wch: 12 }, { wch: 15 }, { wch: 18 }, { wch: 30 },
  ];

  const wb = XLSX.utils.book_new();
  XLSX.utils.book_append_sheet(wb, ws, 'Báo giá');
  const fileName = `BaoGia_${project.name.replace(/[^a-zA-Z0-9À-ỹ]/g, '_')}_${project.tier}.xlsx`;
  XLSX.writeFile(wb, fileName);
}
