// Các cấu hình kiểm thử. expect = số đọc từ app.js GỐC chạy trên Chromium thật
// (tests/khai-toan/parity.browser.test.mjs tự kiểm lại mỗi lần chạy).
const S = '2026-11-09';
export const CASES = [
  {
    name: 'Mẫu 100m² 3PN 2WC Tiêu chuẩn Hiện đại (mặc định)',
    input: { area: 100, beds: 3, baths: 2, tier: 'standard', style: 'modern', startDate: S, scope: {} },
    expect: { total: 1050793750, workDays: 55 },
  },
  {
    name: '50m² 1PN 1WC Tiêu chuẩn Hiện đại',
    input: { area: 50, beds: 1, baths: 1, tier: 'standard', style: 'modern', startDate: S, scope: {} },
    expect: { total: 465200000, workDays: 49 },
  },
  {
    name: '70m² 2PN 2WC Tiêu chuẩn Hiện đại',
    input: { area: 70, beds: 2, baths: 2, tier: 'standard', style: 'modern', startDate: S, scope: {} },
    expect: { total: 725400000, workDays: 50 },
  },
  {
    name: '150m² 4PN 3WC Cao cấp Modern Luxury, phạm vi tối đa',
    input: {
      area: 150, beds: 4, baths: 3, tier: 'luxury', style: 'modern_luxury', startDate: S,
      scope: {
        demoLevel: 50, staircase: 'basic', flooring: 'luxury', floorMaterial: 'tile', lighting: 'standard',
        electrical: 'light_mod', smarthome: 'luxury', wood: 'laminate', loose: 'luxury', stone: 'luxury_stone',
        appliances: 'luxury', wcEquipment: 'luxury', curtain: 'electric', ac: 'ducted', speaker: 'luxury',
        freshAir: true, epoxyGrout: true,
      },
    },
    expect: { total: 2918612500, workDays: 56 },
  },
  {
    name: '120m² 3PN 2WC Cao cấp Hiện đại',
    input: { area: 120, beds: 3, baths: 2, tier: 'luxury', style: 'modern', startDate: S, scope: {} },
    expect: { total: 1394934375, workDays: 56 },
  },
  {
    name: '35m² 1PN 1WC Tiêu chuẩn Modern Luxury, phạm vi tối thiểu',
    input: {
      area: 35, beds: 1, baths: 1, tier: 'standard', style: 'modern_luxury', startDate: S,
      scope: {
        demolition: false, demoLevel: 20, wcRenovation: false, ceiling: true, painting: false, flooring: 'none',
        lighting: 'none', electrical: 'none', wood: 'melamine_economy', loose: 'none', stone: 'none',
        appliances: 'none', curtain: 'none', ac: 'wall',
      },
    },
    expect: { total: 133762500, workDays: 40 },
  },
  {
    name: '350m² 4PN 3WC Cao cấp Hiện đại, phá dỡ 20%',
    input: {
      area: 350, beds: 4, baths: 3, tier: 'luxury', style: 'modern', startDate: S,
      scope: { demoLevel: 20, smarthome: 'standard', ac: 'wall', speaker: 'basic', wcEquipment: 'basic', staircase: 'luxury' },
    },
    expect: { total: 4155750000, workDays: 63 },
  },
];
