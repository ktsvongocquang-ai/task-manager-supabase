import { useEffect, useState } from 'react';
import { useSearchParams } from 'react-router-dom';
import { SectionHeader, SegmentedToggle, LABEL_CLS, VALUE_CLS } from './shared';
import { landingSupabase } from './landingSupabase';

type Category = 'apartment' | 'house_villa';
type Standard = 'dqh' | 'jux';

interface StandardSpec {
  standardSub: string | null;
  constructionTime: string | null;
  designStyle: string | null;
  materialPartners: string | null;
  designMinPrice: number | null;
  designMaxPrice: number | null;
  constructionMinPrice: number | null;
  constructionMaxPrice: number | null;
}

const CATEGORY_LABEL: Record<Category, string> = {
  apartment: 'Căn hộ',
  house_villa: 'Nhà phố · Villa',
};
// Mỗi category chỉ có đúng 1 chuẩn dịch vụ áp dụng — tránh hiện 2 thẻ gây
// hiểu lầm "được chọn 1 trong 2" khi thực tế DQH/JUX tách theo loại công trình.
const CATEGORY_STANDARD: Record<Category, Standard> = { apartment: 'jux', house_villa: 'dqh' };

function segToCategory(seg: string | null): Category {
  if (seg === 'can-ho' || seg === 'nha-pho-du-an') return 'apartment';
  if (seg === 'nha-pho' || seg === 'villa') return 'house_villa';
  return 'house_villa';
}

// Chỉ trả về số (không kèm "triệu") — ghép 2 số bằng dấu gạch ngang sát nhau
// ("0,35–0,85") rồi mới ghi đơn vị 1 lần bên dưới, tránh chữ "triệu" lặp lại
// 2 lần khiến dòng giá bị tràn/xuống dòng giữa chừng trên mobile hẹp.
function formatVnd(n: number) {
  return (n / 1_000_000).toLocaleString('vi-VN');
}

function StandardCard({ spec, categoryLabel, onOpenKhaiToan }: { spec?: StandardSpec; categoryLabel: string; onOpenKhaiToan: () => void }) {
  const hasPrice = spec?.designMinPrice != null && spec?.designMaxPrice != null;

  const detailRows = [
    spec?.constructionTime ? { label: 'Thời gian', value: spec.constructionTime } : null,
    spec?.designStyle ? { label: 'Phong cách', value: spec.designStyle } : null,
    spec?.materialPartners ? { label: 'Vật liệu', value: spec.materialPartners } : null,
  ].filter((r): r is { label: string; value: string } => r !== null);

  return (
    <div className="bg-white border border-[#2C2920]/10 rounded-sm">
      <div className="grid gap-8 lg:gap-12 p-7 md:p-9" style={{ gridTemplateColumns: 'repeat(auto-fit, minmax(min(100%, 380px), 1fr))' }}>
        <div className="flex flex-col gap-6">
          <div>
            <h3 className="font-serif text-2xl md:text-3xl font-light text-[#2C2920]">{categoryLabel}</h3>
            {spec?.standardSub && <p className="text-sm text-[#8A8070] mt-1.5">{spec.standardSub}</p>}
          </div>

          {hasPrice ? (
            <div className="grid grid-cols-2 gap-6 border-t border-[#2C2920]/10 pt-5">
              <div className="flex flex-col gap-1">
                <span className={LABEL_CLS}>Thiết kế</span>
                <span className="font-serif text-xl md:text-2xl leading-tight text-[#B8913A] whitespace-nowrap">{formatVnd(spec!.designMinPrice!)}–{formatVnd(spec!.designMaxPrice!)}</span>
                <span className="text-xs text-[#8A8070]">triệu / m²</span>
              </div>
              <div className="flex flex-col gap-1">
                <span className={LABEL_CLS}>Thi công</span>
                <span className="font-serif text-xl md:text-2xl leading-tight text-[#B8913A] whitespace-nowrap">
                  {spec?.constructionMinPrice != null && spec?.constructionMaxPrice != null ? `${formatVnd(spec.constructionMinPrice)}–${formatVnd(spec.constructionMaxPrice)}` : '—'}
                </span>
                <span className="text-xs text-[#8A8070]">triệu / m²</span>
              </div>
            </div>
          ) : (
            <p className="text-sm text-[#8A8070] italic border-t border-[#2C2920]/10 pt-5">
              Đơn giá theo diện tích thực tế — tính nhanh bên dưới.
            </p>
          )}
        </div>

        {detailRows.length > 0 && (
          <dl className="self-end flex flex-col gap-3 text-sm pt-5 border-t border-[#2C2920]/10">
            {detailRows.map(row => (
              <div key={row.label} className="flex items-baseline gap-4">
                <dt className={`shrink-0 w-[84px] ${LABEL_CLS}`}>{row.label}</dt>
                <dd className={`m-0 ${VALUE_CLS}`}>{row.value}</dd>
              </div>
            ))}
          </dl>
        )}
      </div>

      <div className="flex flex-wrap items-center justify-between gap-4 px-7 md:px-9 py-5 border-t border-[#2C2920]/10">
        <p className="m-0 text-[13px] italic text-[#2C2920]/70">Đơn giá tham khảo. Báo giá chính xác theo bản vẽ thực tế.</p>
        <button
          onClick={onOpenKhaiToan}
          className="inline-flex items-center justify-center gap-2 min-h-[48px] px-7 bg-[#B8913A] hover:bg-[#B8913A]/85 text-[#1A1814] text-xs font-semibold tracking-[0.14em] uppercase rounded-sm transition-colors cursor-pointer"
        >
          Tính cho công trình của tôi →
        </button>
      </div>
    </div>
  );
}

export function PricingComparison({ onOpenKhaiToan }: { onOpenKhaiToan: () => void }) {
  const [searchParams] = useSearchParams();
  const [category, setCategory] = useState<Category>(() => segToCategory(searchParams.get('seg')));
  const [rows, setRows] = useState<Record<string, StandardSpec> | null>(null);

  useEffect(() => {
    Promise.all([
      landingSupabase.from('landing_pricing_standards').select('category,standard,standard_sub,construction_time,design_style,material_partners'),
      landingSupabase
        .from('landing_price_rates')
        .select('category,standard,design_min_price_per_m2,design_max_price_per_m2,min_price_per_m2,max_price_per_m2'),
    ])
      .then(([standardsRes, ratesRes]) => {
        const empty = (): StandardSpec => ({
          standardSub: null,
          constructionTime: null, designStyle: null, materialPartners: null,
          designMinPrice: null, designMaxPrice: null, constructionMinPrice: null, constructionMaxPrice: null,
        });
        const map: Record<string, StandardSpec> = {};
        (standardsRes.data || []).forEach(row => {
          map[`${row.category}:${row.standard}`] = {
            ...empty(),
            standardSub: row.standard_sub,
            constructionTime: row.construction_time,
            designStyle: row.design_style,
            materialPartners: row.material_partners,
          };
        });
        (ratesRes.data || []).forEach(row => {
          const key = `${row.category}:${row.standard}`;
          if (!map[key]) map[key] = empty();
          map[key].designMinPrice = row.design_min_price_per_m2;
          map[key].designMaxPrice = row.design_max_price_per_m2;
          map[key].constructionMinPrice = row.min_price_per_m2;
          map[key].constructionMaxPrice = row.max_price_per_m2;
        });
        setRows(map);
      })
      .catch(() => setRows({}));
  }, []);

  const standard = CATEGORY_STANDARD[category];

  return (
    <section id="section-1" className="px-6 md:px-16 py-14 md:py-20 bg-[#F5F2EC] border-b border-[#2C2920]/5">
      <div className="max-w-6xl mx-auto flex flex-col gap-8">
        <SectionHeader
          eyebrow="(CHI PHÍ THAM KHẢO)"
          title="Chi phí thiết kế & thi công"
          accent="theo chuẩn dịch vụ"
          action={
            <SegmentedToggle
              ariaLabel="Loại công trình"
              value={category}
              onChange={setCategory}
              options={(Object.keys(CATEGORY_LABEL) as Category[]).map(c => ({ value: c, label: CATEGORY_LABEL[c] }))}
            />
          }
        />

        {!rows ? (
          <p className="text-xs text-[#8A8070]">Đang tải...</p>
        ) : (
          <StandardCard spec={rows[`${category}:${standard}`]} categoryLabel={CATEGORY_LABEL[category]} onOpenKhaiToan={onOpenKhaiToan} />
        )}
      </div>
    </section>
  );
}
