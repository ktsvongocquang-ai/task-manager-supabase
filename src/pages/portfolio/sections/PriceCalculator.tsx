import { useEffect, useMemo, useState } from 'react';
import { SectionHeader, NeedsInput } from './shared';
import { strapiFetch } from './strapiClient';

type Category = 'apartment' | 'house_villa';
type Standard = 'dqh' | 'jux';

const CATEGORY_LABEL: Record<Category, string> = {
  apartment: 'Chung cư',
  house_villa: 'Nhà phố / Villa',
};
const STANDARD_LABEL: Record<Standard, string> = { dqh: 'Chuẩn DQH', jux: 'Chuẩn JUX' };

function formatVnd(n: number) {
  return n.toLocaleString('vi-VN') + ' đ';
}

export function PriceCalculator() {
  const [category, setCategory] = useState<Category>('house_villa');
  const [standard, setStandard] = useState<Standard>('dqh');
  const [area, setArea] = useState('');
  // Đơn giá/m2 thật lấy từ Supabase (project DQH MIROR) — không bịa số khi
  // chưa có hàng cho tổ hợp category+standard này.
  const [rates, setRates] = useState<Record<string, { min: number; max: number }> | null>(null);

  useEffect(() => {
    strapiFetch('/api/price-rates')
      .then(({ data }) => {
        const map: Record<string, { min: number; max: number }> = {};
        (data || []).forEach((row: any) => {
          if (row.min_price_per_m2 != null && row.max_price_per_m2 != null) {
            map[`${row.category}:${row.standard}`] = { min: Number(row.min_price_per_m2), max: Number(row.max_price_per_m2) };
          }
        });
        setRates(map);
      })
      .catch(() => setRates({}));
  }, []);

  const range = rates ? rates[`${category}:${standard}`] : undefined;
  const areaNum = Number(area);

  const estimate = useMemo(() => {
    if (!range || !(areaNum > 0)) return null;
    return { min: range.min * areaNum, max: range.max * areaNum };
  }, [range, areaNum]);

  return (
    <section id="section-5" className="px-6 md:px-16 py-32 bg-[#F8F5F0]">
      <div className="max-w-3xl mx-auto">
        <SectionHeader eyebrow="(ƯỚC TÍNH NHANH)" title="Báo giá chi phí xây nhà" accent="cho công trình của bạn" center />

        <div className="bg-white border border-[#2C2920]/10 rounded-sm p-8 space-y-8">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
            <div>
              <label className="text-[10px] tracking-[0.15em] uppercase text-[#8A8070] font-semibold block mb-2">Loại công trình</label>
              <div className="flex gap-2">
                {(Object.keys(CATEGORY_LABEL) as Category[]).map(cat => (
                  <button
                    key={cat}
                    onClick={() => setCategory(cat)}
                    className={`flex-1 px-3 py-2.5 text-xs font-bold rounded-sm border transition-colors cursor-pointer ${
                      category === cat ? 'bg-[#1A1814] border-[#1A1814] text-white' : 'border-[#2C2920]/15 text-[#2C2920] hover:border-[#2C2920]/40'
                    }`}
                  >
                    {CATEGORY_LABEL[cat]}
                  </button>
                ))}
              </div>
            </div>
            <div>
              <label className="text-[10px] tracking-[0.15em] uppercase text-[#8A8070] font-semibold block mb-2">Chuẩn thi công</label>
              <div className="flex gap-2">
                {(Object.keys(STANDARD_LABEL) as Standard[]).map(std => (
                  <button
                    key={std}
                    onClick={() => setStandard(std)}
                    className={`flex-1 px-3 py-2.5 text-xs font-bold rounded-sm border transition-colors cursor-pointer ${
                      standard === std ? 'bg-[#B8913A] border-[#B8913A] text-white' : 'border-[#2C2920]/15 text-[#2C2920] hover:border-[#2C2920]/40'
                    }`}
                  >
                    {STANDARD_LABEL[std]}
                  </button>
                ))}
              </div>
            </div>
          </div>

          <div>
            <label className="text-[10px] tracking-[0.15em] uppercase text-[#8A8070] font-semibold block mb-2">Diện tích xây dựng (m²)</label>
            <input
              type="number"
              min="0"
              value={area}
              onChange={e => setArea(e.target.value)}
              placeholder="VD: 120"
              className="w-full border border-[#2C2920]/15 rounded-sm px-4 py-3 text-sm focus:outline-none focus:border-[#B8913A]"
            />
          </div>

          <div className="pt-6 border-t border-[#2C2920]/10 text-center">
            {!rates ? (
              <p className="text-xs text-[#8A8070]">Đang tải...</p>
            ) : !range ? (
              <div className="space-y-2">
                <NeedsInput label={`đơn giá/m² — ${CATEGORY_LABEL[category]} / ${STANDARD_LABEL[standard]}`} />
                <p className="text-xs text-[#8A8070]">Chưa có đơn giá chính thức cho tổ hợp này — vui lòng liên hệ DQH để được báo giá trực tiếp.</p>
              </div>
            ) : estimate ? (
              <div className="space-y-2">
                <p className="text-[10px] tracking-[0.2em] uppercase text-[#8A8070] font-semibold">Khoảng giá ước tính</p>
                <p className="font-serif text-3xl text-[#2C2920]">{formatVnd(estimate.min)} – {formatVnd(estimate.max)}</p>
                <p className="text-xs text-[#8A8070]">Giá ước tính sơ bộ, chưa bao gồm nội thất rời — liên hệ DQH để được báo giá chính xác theo bản vẽ thực tế.</p>
              </div>
            ) : (
              <p className="text-xs text-[#8A8070]">Nhập diện tích để xem khoảng giá ước tính.</p>
            )}
          </div>
        </div>
      </div>
    </section>
  );
}
