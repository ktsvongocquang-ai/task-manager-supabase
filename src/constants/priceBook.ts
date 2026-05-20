import priceBookData from './price_book.json';
import priceBookLuxuryData from './price_book_luxury.json';

export const PRICE_BOOK = priceBookData as any;
export const PRICE_BOOK_LUXURY = priceBookLuxuryData as any;

export interface PriceItem {
  don_vi: string;
  scope: string;
  basic?: number;
  premium?: number;
  premium_plus_nhua?: number;
  luxury?: number;
  luxury_small?: number;
  luxury_large?: number;
  luxury_son_2k?: number;
  luxury_pano_cnc?: number;
  luxury_estimate?: number;
  source: string;
  ghi_chu?: string;
  value?: number;
}

export const WASTE_FACTORS: Record<string, number> = {
  san: 1.05,
  tran: 1.05,
  son_ba: 0.85,
  thiet_bi: 1.00,
};

export const MARGIN_STRATEGIES = {
  aggressive: { min: 0.08, max: 0.12, label: 'Cạnh tranh (8-12%)' },
  target: { min: 0.18, max: 0.22, label: 'Chuẩn công ty (18-22%)' },
  premium_margin: { min: 0.28, max: 0.35, label: 'Cao cấp (28-35%)' },
} as const;

export const NGOAI_TINH_PERCENT = 4;

export const TIERS = {
  basic: 'Ba Thanh / Thanh Thùy chống ẩm + Ivan',
  premium: 'An Cường chống ẩm + Hafele + keo PUR',
  luxury: 'An Cường + Hafele giảm chấn + sơn 2K + đá nung kết',
} as const;

export const CATEGORY_LABELS: Record<string, string> = {
  thao_do: '1. Phá dỡ',
  phan_tho_hoan_thien: '2. Xây thô / Hoàn thiện',
  gach_op_lat: '3. Gạch ốp lát',
  me_dien_nuoc_dieu_hoa: '4. M&E (Điện – Nước – Điều hòa)',
  cua_va_vach_op: '5. Cửa & Vách ốp',
  noi_that_go_cong_nghiep: '6. Nội thất gỗ',
  rem_man: '7. Rèm màn',
  ve_sinh_trac_thai: '8. Vệ sinh trạc thải',
};

export const SUBCATEGORY_LABELS: Record<string, string> = {
  san: 'Sàn', tuong: 'Tường', tran: 'Trần', son_ba: 'Sơn bả',
  kinh_vach: 'Kính vách', tu_bep: 'Tủ bếp',
  tu_ao_trang_tri: 'Tủ áo / Trang trí',
  ban_ke_tv_trang_diem_lam_viec: 'Bàn kệ TV / Trang điểm',
  guong_tab_giuong: 'Gương / Tab / Giường',
  vach_op_va_ke: 'Vách ốp & Kệ',
  tu_lavabo_guong_wc: 'Tủ lavabo WC',
  tu_may_giat_rua_chen: 'Tủ máy giặt',
  phu_kien_hafele: 'Phụ kiện Hafele',
  den_led_trang_tri: 'Đèn LED', khac: 'Khác',
};

export interface FlatPriceItem {
  category: string;
  subcategory: string;
  itemKey: string;
  displayName: string;
  item: PriceItem;
}

function humanizeName(key: string): string {
  return key.replace(/_/g, ' ').replace(/\b\w/g, c => c.toUpperCase())
    .replace(/Wc/g, 'WC').replace(/Tv/g, 'TV').replace(/Led/g, 'LED');
}

export function flattenPriceBook(projectType: 'chung_cu' | 'nha_o' | 'shop'): FlatPriceItem[] {
  const result: FlatPriceItem[] = [];
  const root = PRICE_BOOK[projectType];
  if (!root) return result;

  for (const [catKey, catVal] of Object.entries(root)) {
    if (catKey.startsWith('_') || typeof catVal !== 'object' || catVal === null) continue;
    const cat = catVal as Record<string, any>;

    for (const [subKey, subVal] of Object.entries(cat)) {
      if (subKey.startsWith('_') || typeof subVal !== 'object' || subVal === null) continue;
      if ('don_vi' in subVal) {
        result.push({ category: catKey, subcategory: catKey, itemKey: subKey, displayName: humanizeName(subKey), item: subVal as PriceItem });
      } else {
        for (const [itemKey, itemVal] of Object.entries(subVal)) {
          if (itemKey.startsWith('_') || typeof itemVal !== 'object' || itemVal === null) continue;
          if ('don_vi' in (itemVal as any)) {
            result.push({ category: catKey, subcategory: subKey, itemKey, displayName: humanizeName(itemKey), item: itemVal as PriceItem });
          }
        }
      }
    }
  }
  return result;
}

export function getItemPrice(item: PriceItem, tier: 'basic' | 'premium' | 'luxury'): number | null {
  if (tier === 'luxury') return (item as any).luxury ?? (item as any).luxury_son_2k ?? (item as any).luxury_small ?? (item as any).luxury_estimate ?? null;
  return (item as any)[tier] ?? null;
}

export function formatVND(amount: number): string {
  return new Intl.NumberFormat('vi-VN').format(Math.round(amount)) + ' ₫';
}

export function getWasteFactor(category: string, subcategory: string): number {
  if (subcategory === 'san' || category.includes('san')) return WASTE_FACTORS.san;
  if (subcategory === 'tran' || category.includes('tran')) return WASTE_FACTORS.tran;
  if (subcategory === 'son_ba' || category.includes('son')) return WASTE_FACTORS.son_ba;
  return WASTE_FACTORS.thiet_bi;
}
