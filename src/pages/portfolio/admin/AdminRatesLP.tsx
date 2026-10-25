import { useEffect, useState } from 'react';
import { supabase } from '../../../services/supabase';

type Seg = 'can-ho' | 'nha-pho-du-an' | 'nha-pho' | 'villa';
type Tier = 'co_ban' | 'kha' | 'cao_cap';

const SEGS: { value: Seg; label: string }[] = [
  { value: 'can-ho', label: 'Căn hộ' },
  { value: 'nha-pho-du-an', label: 'Nhà phố dự án' },
  { value: 'nha-pho', label: 'Nhà phố' },
  { value: 'villa', label: 'Villa' },
];
const TIERS: { value: Tier; label: string }[] = [
  { value: 'co_ban', label: 'Cơ bản' },
  { value: 'kha', label: 'Khá' },
  { value: 'cao_cap', label: 'Cao cấp' },
];

interface RateRow {
  segment: Seg;
  tier: Tier;
  standard: string | null;
  rate_per_m2: number | null;
  extra_per_room: number | null;
  extra_per_floor: number | null;
  margin: number | null;
  base_days: number | null;
  days_per_m2: number | null;
  breakdown: Record<string, number> | null;
  min_budget: number | null;
  tier_description: string | null;
}

const cellInput = 'w-full border-0 bg-transparent text-xs px-2 py-1.5 focus:bg-indigo-50 focus:outline-none';

export function AdminRatesLP() {
  const [rows, setRows] = useState<Record<string, RateRow>>({});
  const [loaded, setLoaded] = useState(false);

  const key = (seg: Seg, tier: Tier) => `${seg}:${tier}`;

  useEffect(() => {
    supabase
      .from('pricing_rates')
      .select('*')
      .then(({ data }) => {
        const map: Record<string, RateRow> = {};
        (data as RateRow[] | null)?.forEach(r => {
          map[key(r.segment, r.tier)] = r;
        });
        setRows(map);
        setLoaded(true);
      });
  }, []);

  const getRow = (seg: Seg, tier: Tier): RateRow =>
    rows[key(seg, tier)] || {
      segment: seg,
      tier,
      standard: seg === 'can-ho' ? 'JUX' : 'DQH',
      rate_per_m2: null,
      extra_per_room: null,
      extra_per_floor: null,
      margin: 0.1,
      base_days: null,
      days_per_m2: null,
      breakdown: null,
      min_budget: null,
      tier_description: '',
    };

  const saveField = async (seg: Seg, tier: Tier, patch: Partial<RateRow>) => {
    const current = getRow(seg, tier);
    const next = { ...current, ...patch };
    setRows(prev => ({ ...prev, [key(seg, tier)]: next }));
    await supabase.from('pricing_rates').upsert(next, { onConflict: 'segment,tier' });
  };

  if (!loaded) return <p className="text-xs text-gray-400">Đang tải...</p>;

  return (
    <div className="overflow-x-auto">
      <table className="min-w-[1100px] text-xs border-collapse bg-white border border-gray-200 rounded-lg overflow-hidden">
        <thead>
          <tr className="bg-gray-50 border-b border-gray-200">
            {['Phân khúc', 'Mức', 'Chuẩn', 'Đơn giá/m²', 'Phụ thu/phòng', 'Phụ thu/tầng', 'Margin', 'Số ngày cơ bản', 'Ngày/m²', 'Ngân sách tối thiểu', 'Mô tả mức'].map(h => (
              <th key={h} className="text-left font-bold text-gray-500 uppercase tracking-wide px-2 py-2 whitespace-nowrap">
                {h}
              </th>
            ))}
          </tr>
        </thead>
        <tbody>
          {SEGS.map(seg =>
            TIERS.map((tier, ti) => {
              const r = getRow(seg.value, tier.value);
              return (
                <tr key={key(seg.value, tier.value)} className="border-b border-gray-100">
                  {ti === 0 && (
                    <td rowSpan={3} className="px-2 py-1.5 font-semibold align-top border-r border-gray-100">
                      {seg.label}
                    </td>
                  )}
                  <td className="px-2 py-1.5 font-semibold">{tier.label}</td>
                  <td>
                    <select
                      className={cellInput}
                      value={r.standard || ''}
                      onChange={e => saveField(seg.value, tier.value, { standard: e.target.value || null })}
                    >
                      <option value="">—</option>
                      <option value="JUX">JUX</option>
                      <option value="DQH">DQH</option>
                    </select>
                  </td>
                  <td>
                    <input
                      type="number"
                      className={cellInput}
                      value={r.rate_per_m2 ?? ''}
                      onBlur={e => saveField(seg.value, tier.value, { rate_per_m2: e.target.value ? Number(e.target.value) : null })}
                      onChange={e => setRows(prev => ({ ...prev, [key(seg.value, tier.value)]: { ...r, rate_per_m2: e.target.value ? Number(e.target.value) : null } }))}
                    />
                  </td>
                  <td>
                    <input
                      type="number"
                      className={cellInput}
                      value={r.extra_per_room ?? ''}
                      onBlur={e => saveField(seg.value, tier.value, { extra_per_room: e.target.value ? Number(e.target.value) : null })}
                      onChange={e => setRows(prev => ({ ...prev, [key(seg.value, tier.value)]: { ...r, extra_per_room: e.target.value ? Number(e.target.value) : null } }))}
                      disabled={seg.value !== 'can-ho'}
                    />
                  </td>
                  <td>
                    <input
                      type="number"
                      className={cellInput}
                      value={r.extra_per_floor ?? ''}
                      onBlur={e => saveField(seg.value, tier.value, { extra_per_floor: e.target.value ? Number(e.target.value) : null })}
                      onChange={e => setRows(prev => ({ ...prev, [key(seg.value, tier.value)]: { ...r, extra_per_floor: e.target.value ? Number(e.target.value) : null } }))}
                      disabled={seg.value === 'can-ho'}
                    />
                  </td>
                  <td>
                    <input
                      type="number"
                      step="0.01"
                      className={cellInput}
                      value={r.margin ?? ''}
                      onBlur={e => saveField(seg.value, tier.value, { margin: e.target.value ? Number(e.target.value) : null })}
                      onChange={e => setRows(prev => ({ ...prev, [key(seg.value, tier.value)]: { ...r, margin: e.target.value ? Number(e.target.value) : null } }))}
                    />
                  </td>
                  <td>
                    <input
                      type="number"
                      className={cellInput}
                      value={r.base_days ?? ''}
                      onBlur={e => saveField(seg.value, tier.value, { base_days: e.target.value ? Number(e.target.value) : null })}
                      onChange={e => setRows(prev => ({ ...prev, [key(seg.value, tier.value)]: { ...r, base_days: e.target.value ? Number(e.target.value) : null } }))}
                    />
                  </td>
                  <td>
                    <input
                      type="number"
                      step="0.01"
                      className={cellInput}
                      value={r.days_per_m2 ?? ''}
                      onBlur={e => saveField(seg.value, tier.value, { days_per_m2: e.target.value ? Number(e.target.value) : null })}
                      onChange={e => setRows(prev => ({ ...prev, [key(seg.value, tier.value)]: { ...r, days_per_m2: e.target.value ? Number(e.target.value) : null } }))}
                    />
                  </td>
                  <td>
                    <input
                      type="number"
                      className={cellInput}
                      value={r.min_budget ?? ''}
                      onBlur={e => saveField(seg.value, tier.value, { min_budget: e.target.value ? Number(e.target.value) : null })}
                      onChange={e => setRows(prev => ({ ...prev, [key(seg.value, tier.value)]: { ...r, min_budget: e.target.value ? Number(e.target.value) : null } }))}
                    />
                  </td>
                  <td>
                    <input
                      className={cellInput}
                      value={r.tier_description || ''}
                      onBlur={e => saveField(seg.value, tier.value, { tier_description: e.target.value || null })}
                      onChange={e => setRows(prev => ({ ...prev, [key(seg.value, tier.value)]: { ...r, tier_description: e.target.value } }))}
                    />
                  </td>
                </tr>
              );
            })
          )}
        </tbody>
      </table>
      <p className="text-[11px] text-gray-400 mt-3">
        Để trống "Đơn giá/m²" sẽ ẩn mức đó khỏi công cụ khái toán. Cột "Phụ thu/phòng" chỉ dùng cho Căn hộ, "Phụ thu/tầng" dùng cho các phân khúc còn lại.
      </p>
    </div>
  );
}
