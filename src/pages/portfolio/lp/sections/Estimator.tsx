import { useEffect, useMemo, useState } from 'react';
import { supabase } from '../../../../services/supabase';
import { SectionLabel } from '../ui/SectionLabel';
import { ButtonPrimary } from '../ui/Button';
import { CountUp } from '../ui/CountUp';
import { formatVnd, isValidVnPhone, roundTo10Million } from '../lib/validators';
import { track } from '../lib/track';
import { LP_SECTION_SPACING } from '../ui/constants';
import type { Seg } from '../hooks/useLeadParams';
import { VALID_SEGS } from '../hooks/useLeadParams';

type Tier = 'co_ban' | 'kha' | 'cao_cap';
type StartTime = 'trong_1_thang' | 'tu_1_3_thang' | 'tu_3_6_thang' | 'tham_khao';

interface StyleRow {
  id: string;
  name: string;
  card_image: string | null;
  moodboard_image: string | null;
}

interface RateRow {
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

interface Props {
  seg: Seg | undefined;
  setSeg: (seg: Seg) => void;
  sale?: string;
  nguon?: string;
  utm: Record<string, string>;
  onNeedDetail: (payload: Record<string, unknown>) => void;
}

const SEG_LABEL: Record<Seg, string> = {
  'can-ho': 'Căn hộ',
  'nha-pho-du-an': 'Nhà phố dự án',
  'nha-pho': 'Nhà phố',
  villa: 'Villa / nhà vườn',
};

const TIER_LABEL: Record<Tier, string> = { co_ban: 'Cơ bản', kha: 'Khá', cao_cap: 'Cao cấp' };
const TIER_ORDER: Tier[] = ['co_ban', 'kha', 'cao_cap'];

const START_OPTIONS: { value: StartTime; label: string }[] = [
  { value: 'trong_1_thang', label: 'Trong 1 tháng' },
  { value: 'tu_1_3_thang', label: '1 – 3 tháng' },
  { value: 'tu_3_6_thang', label: '3 – 6 tháng' },
  { value: 'tham_khao', label: 'Đang tham khảo' },
];

const AREA_BOUNDS: Record<Seg, { min: number; max: number }> = {
  'can-ho': { min: 30, max: 200 },
  'nha-pho-du-an': { min: 60, max: 300 },
  'nha-pho': { min: 60, max: 500 },
  villa: { min: 150, max: 1000 },
};

const SS_KEY = 'lp_estimator_state';

interface WizardState {
  styleId?: string;
  styleName?: string;
  moodboard?: string | null;
  area?: number;
  rooms?: number;
  floors?: number;
  tier?: Tier;
  startTime?: StartTime;
}

function loadSaved(): WizardState {
  try {
    const raw = sessionStorage.getItem(SS_KEY);
    return raw ? JSON.parse(raw) : {};
  } catch {
    return {};
  }
}

function ProgressBar({ step }: { step: number }) {
  return (
    <div className="flex items-center gap-2 mb-8">
      {[1, 2, 3, 4].map(n => (
        <div key={n} className={`h-0.5 flex-1 ${n <= step ? 'bg-lp-gold' : 'bg-lp-ink/10'}`} />
      ))}
      <span className="font-lp-sans text-[11px] text-lp-muted shrink-0 ml-2">{step}/4</span>
    </div>
  );
}

export function Estimator({ seg, setSeg, sale, nguon, utm, onNeedDetail }: Props) {
  const [step, setStep] = useState(1);
  const [wizard, setWizard] = useState<WizardState>(() => loadSaved());
  const [showResult, setShowResult] = useState(false);
  const [styles, setStyles] = useState<StyleRow[] | null>(null);
  const [rates, setRates] = useState<RateRow[] | null>(null);
  const [leadSent, setLeadSent] = useState(false);
  const [leadError, setLeadError] = useState('');
  const [leadSending, setLeadSending] = useState(false);
  const [name, setName] = useState('');
  const [phone, setPhone] = useState('');
  const [startedTracked, setStartedTracked] = useState(false);

  useEffect(() => {
    sessionStorage.setItem(SS_KEY, JSON.stringify(wizard));
  }, [wizard]);

  useEffect(() => {
    supabase
      .from('estimator_styles')
      .select('id,name,card_image,moodboard_image')
      .order('sort_order')
      .then(({ data }) => setStyles((data as StyleRow[]) || []))
      .catch(() => setStyles([]));
  }, []);

  useEffect(() => {
    if (!seg) return;
    let cancelled = false;
    supabase
      .from('pricing_rates')
      .select('tier,standard,rate_per_m2,extra_per_room,extra_per_floor,margin,base_days,days_per_m2,breakdown,min_budget,tier_description')
      .eq('segment', seg)
      .then(({ data }) => {
        if (!cancelled) setRates((data as RateRow[]) || []);
      })
      .catch(() => {
        if (!cancelled) setRates([]);
      });
    return () => {
      cancelled = true;
    };
  }, [seg]);

  const bounds = seg ? AREA_BOUNDS[seg] : AREA_BOUNDS['nha-pho'];
  const availableTiers = useMemo(
    () => TIER_ORDER.filter(t => rates?.some(r => r.tier === t && r.rate_per_m2 != null)),
    [rates]
  );
  const selectedRate = rates?.find(r => r.tier === wizard.tier) || null;

  const markStarted = () => {
    if (!startedTracked) {
      setStartedTracked(true);
      track('estimate_start');
    }
  };

  const update = (patch: Partial<WizardState>) => {
    markStarted();
    setWizard(prev => ({ ...prev, ...patch }));
  };

  const result = useMemo(() => {
    if (!selectedRate || !wizard.area) return null;
    const extra =
      seg === 'can-ho'
        ? (selectedRate.extra_per_room || 0) * (wizard.rooms || 0)
        : (selectedRate.extra_per_floor || 0) * (wizard.floors || 0);
    const giaGiua = wizard.area * (selectedRate.rate_per_m2 || 0) + extra;
    const margin = selectedRate.margin ?? 0.1;
    const giaTu = roundTo10Million(giaGiua * (1 - margin));
    const giaDen = roundTo10Million(giaGiua * (1 + margin));
    const thoiGian = Math.round((selectedRate.base_days || 0) + wizard.area * (selectedRate.days_per_m2 || 0));
    const underBudget = selectedRate.min_budget != null && giaGiua < selectedRate.min_budget;
    return { giaGiua, giaTu, giaDen, thoiGian, underBudget };
  }, [selectedRate, wizard.area, wizard.rooms, wizard.floors, seg]);

  const leadScore: 'hot' | 'warm' | 'cold' = useMemo(() => {
    if (!result) return 'warm';
    if (result.underBudget) return 'cold';
    const tierHighEnough = wizard.tier === 'kha' || wizard.tier === 'cao_cap';
    const soon = wizard.startTime === 'trong_1_thang' || wizard.startTime === 'tu_1_3_thang';
    return tierHighEnough && soon ? 'hot' : 'warm';
  }, [result, wizard.tier, wizard.startTime]);

  const finishWizard = (startTime: StartTime) => {
    update({ startTime });
    setShowResult(true);
    track('estimate_done');
  };

  const estimatePayload = useMemo(
    () => ({
      seg,
      style: wizard.styleName,
      area_m2: wizard.area,
      rooms: wizard.rooms,
      floors: wizard.floors,
      tier: wizard.tier,
      start_time: wizard.startTime,
      gia_tu: result?.giaTu,
      gia_den: result?.giaDen,
      thoi_gian_ngay: result?.thoiGian,
    }),
    [seg, wizard, result]
  );

  const submitLead = async (gift?: string) => {
    setLeadError('');
    if (!name.trim()) {
      setLeadError('Nhập tên.');
      return;
    }
    if (!isValidVnPhone(phone)) {
      setLeadError('Số điện thoại chưa đúng định dạng VN.');
      return;
    }
    setLeadSending(true);
    const { error } = await supabase.from('leads').insert({
      name: name.trim(),
      phone: phone.trim(),
      seg,
      sale_code: sale || null,
      source: nguon || null,
      utm,
      intent: 'bang_chi_tiet',
      gift: gift || null,
      estimate: estimatePayload,
      lead_score: leadScore,
    });
    setLeadSending(false);
    if (error) {
      setLeadError('Gửi không thành công, thử lại giúp mình.');
      return;
    }
    setLeadSent(true);
    track('lead_submit', { intent: 'bang_chi_tiet', lead_score: leadScore });
    onNeedDetail(estimatePayload);
  };

  if (!seg) {
    return (
      <section id="estimator" className={`px-6 ${LP_SECTION_SPACING} bg-white`}>
        <div className="max-w-xl mx-auto text-center">
          <SectionLabel className="mb-3">(KHÁI TOÁN NHANH)</SectionLabel>
          <h2 className="font-lp-serif text-3xl font-light text-lp-ink mb-8">Anh/chị đang xây loại công trình nào?</h2>
          <div className="grid grid-cols-2 gap-3">
            {VALID_SEGS.map(s => (
              <button
                key={s}
                onClick={() => setSeg(s)}
                className="rounded-lp border border-lp-ink/15 px-4 py-4 font-lp-sans text-sm font-semibold text-lp-ink hover:border-lp-gold transition-colors cursor-pointer"
              >
                {SEG_LABEL[s]}
              </button>
            ))}
          </div>
        </div>
      </section>
    );
  }

  return (
    <section id="estimator" className={`px-6 ${LP_SECTION_SPACING} bg-white`}>
      <div className="max-w-xl mx-auto">
        <SectionLabel className="mb-3 text-center">(KHÁI TOÁN NHANH)</SectionLabel>
        <h2 className="font-lp-serif text-3xl font-light text-lp-ink mb-8 text-center">
          Ước tính chi phí cho {SEG_LABEL[seg].toLowerCase()} của bạn
        </h2>

        {!showResult && <ProgressBar step={step} />}

        {!showResult && step === 1 && (
          <div>
            <p className="font-lp-sans text-xs text-lp-muted uppercase tracking-wide mb-4">Chọn phong cách bạn thích</p>
            {!styles ? (
              <p className="text-xs text-lp-muted">Đang tải...</p>
            ) : (
              <div className="grid grid-cols-2 gap-3">
                {styles.map(s => (
                  <button
                    key={s.id}
                    onClick={() => {
                      update({ styleId: s.id, styleName: s.name, moodboard: s.moodboard_image });
                      setStep(2);
                    }}
                    className={`rounded-lp overflow-hidden border text-left cursor-pointer transition-colors ${
                      wizard.styleId === s.id ? 'border-lp-gold' : 'border-lp-ink/10 hover:border-lp-ink/30'
                    }`}
                  >
                    {s.card_image && <img src={s.card_image} alt={s.name} loading="lazy" className="w-full aspect-[4/3] object-cover" />}
                    <p className="font-lp-sans text-xs font-semibold p-2.5">{s.name}</p>
                  </button>
                ))}
              </div>
            )}
          </div>
        )}

        {!showResult && step === 2 && (
          <div className="space-y-6">
            <div>
              <p className="font-lp-sans text-xs text-lp-muted uppercase tracking-wide mb-3">
                Diện tích xây dựng: <span className="text-lp-ink font-semibold">{wizard.area || bounds.min}m²</span>
              </p>
              <input
                type="range"
                min={bounds.min}
                max={bounds.max}
                value={wizard.area || bounds.min}
                onChange={e => update({ area: Number(e.target.value) })}
                className="w-full accent-lp-gold"
              />
              <input
                type="number"
                min={bounds.min}
                max={bounds.max}
                value={wizard.area || ''}
                onChange={e => update({ area: Number(e.target.value) })}
                placeholder={`${bounds.min} – ${bounds.max}`}
                className="mt-2 w-full border border-lp-ink/15 rounded-lp px-3 py-2.5 text-sm"
              />
            </div>

            {seg === 'can-ho' ? (
              <div>
                <p className="font-lp-sans text-xs text-lp-muted uppercase tracking-wide mb-2">Số phòng ngủ</p>
                <div className="flex gap-2">
                  {[1, 2, 3, 4].map(n => (
                    <button
                      key={n}
                      onClick={() => update({ rooms: n })}
                      className={`flex-1 py-2.5 rounded-lp border font-lp-sans text-sm font-semibold cursor-pointer ${
                        wizard.rooms === n ? 'border-lp-gold bg-lp-gold/10' : 'border-lp-ink/15'
                      }`}
                    >
                      {n}
                    </button>
                  ))}
                </div>
              </div>
            ) : (
              <div>
                <p className="font-lp-sans text-xs text-lp-muted uppercase tracking-wide mb-2">Số tầng</p>
                <div className="flex gap-2">
                  {[1, 2, 3, 4, 5].map(n => (
                    <button
                      key={n}
                      onClick={() => update({ floors: n })}
                      className={`flex-1 py-2.5 rounded-lp border font-lp-sans text-sm font-semibold cursor-pointer ${
                        wizard.floors === n ? 'border-lp-gold bg-lp-gold/10' : 'border-lp-ink/15'
                      }`}
                    >
                      {n}
                    </button>
                  ))}
                </div>
              </div>
            )}

            <div className="flex justify-between pt-2">
              <button onClick={() => setStep(1)} className="font-lp-sans text-xs text-lp-muted cursor-pointer">
                ← Quay lại
              </button>
              <ButtonPrimary
                disabled={!wizard.area || (seg === 'can-ho' ? !wizard.rooms : !wizard.floors)}
                onClick={() => setStep(3)}
              >
                Tiếp tục
              </ButtonPrimary>
            </div>
          </div>
        )}

        {!showResult && step === 3 && (
          <div className="space-y-4">
            <p className="font-lp-sans text-xs text-lp-muted uppercase tracking-wide mb-1">Mức hoàn thiện</p>
            {!rates ? (
              <p className="text-xs text-lp-muted">Đang tải...</p>
            ) : availableTiers.length === 0 ? (
              <p className="text-xs text-lp-muted">Chưa có đơn giá cho phân khúc này — liên hệ DQH để được tư vấn trực tiếp.</p>
            ) : (
              <div className="space-y-3">
                {availableTiers.map(t => {
                  const r = rates?.find(row => row.tier === t);
                  return (
                    <button
                      key={t}
                      onClick={() => {
                        update({ tier: t });
                        setStep(4);
                      }}
                      className={`w-full text-left rounded-lp border px-4 py-3.5 cursor-pointer transition-colors ${
                        wizard.tier === t ? 'border-lp-gold bg-lp-gold/10' : 'border-lp-ink/15 hover:border-lp-ink/30'
                      }`}
                    >
                      <p className="font-lp-serif text-lg text-lp-ink">{TIER_LABEL[t]}</p>
                      {r?.tier_description && <p className="font-lp-sans text-xs text-lp-muted mt-0.5">{r.tier_description}</p>}
                    </button>
                  );
                })}
              </div>
            )}
            <button onClick={() => setStep(2)} className="font-lp-sans text-xs text-lp-muted cursor-pointer pt-2">
              ← Quay lại
            </button>
          </div>
        )}

        {!showResult && step === 4 && (
          <div className="space-y-4">
            <p className="font-lp-sans text-xs text-lp-muted uppercase tracking-wide mb-1">Thời điểm dự kiến bắt đầu</p>
            <div className="grid grid-cols-2 gap-3">
              {START_OPTIONS.map(opt => (
                <button
                  key={opt.value}
                  onClick={() => finishWizard(opt.value)}
                  className="rounded-lp border border-lp-ink/15 px-4 py-3.5 font-lp-sans text-sm font-semibold text-lp-ink hover:border-lp-gold transition-colors cursor-pointer"
                >
                  {opt.label}
                </button>
              ))}
            </div>
            <button onClick={() => setStep(3)} className="font-lp-sans text-xs text-lp-muted cursor-pointer pt-2">
              ← Quay lại
            </button>
          </div>
        )}

        {showResult && result && (
          <div className="space-y-8">
            {!result.underBudget ? (
              <>
                <div className="text-center space-y-2">
                  <p className="font-lp-sans text-[10px] uppercase tracking-[0.2em] text-lp-muted">Khoảng giá ước tính</p>
                  <p className="font-lp-serif text-3xl md:text-4xl text-lp-gold">
                    <CountUp value={result.giaTu} formatter={formatVnd} /> – <CountUp value={result.giaDen} formatter={formatVnd} />
                  </p>
                  <p className="font-lp-sans text-xs text-lp-muted">Thời gian thi công dự kiến: ~{result.thoiGian} ngày</p>
                </div>

                {wizard.moodboard && (
                  <img src={wizard.moodboard} alt={wizard.styleName} loading="lazy" className="w-full rounded-lp aspect-[16/9] object-cover" />
                )}

                {selectedRate?.breakdown && (
                  <div>
                    <p className="font-lp-sans text-[10px] uppercase tracking-[0.2em] text-lp-muted mb-2">Phân bổ chi phí</p>
                    <div className="flex h-3 rounded-lp overflow-hidden">
                      {Object.entries(selectedRate.breakdown).map(([label, pct], i) => (
                        <div
                          key={label}
                          title={`${label}: ${pct}%`}
                          style={{ width: `${pct}%`, backgroundColor: i % 2 === 0 ? '#B08A4A' : '#2A2420' }}
                        />
                      ))}
                    </div>
                    <div className="flex flex-wrap gap-x-4 gap-y-1 mt-2">
                      {Object.entries(selectedRate.breakdown).map(([label, pct]) => (
                        <span key={label} className="font-lp-sans text-[10px] text-lp-muted">
                          {label} {pct}%
                        </span>
                      ))}
                    </div>
                  </div>
                )}

                <p className="font-lp-sans text-[11px] text-lp-muted text-center">
                  Số liệu tham khảo. Báo giá chính thức sau khảo sát.
                </p>

                {!leadSent ? (
                  <div className="bg-lp-greige rounded-lp p-5 space-y-3">
                    <p className="font-lp-sans text-sm font-semibold text-lp-ink">
                      Nhận bảng chi tiết từng hạng mục + tiến độ qua Zalo
                    </p>
                    <input
                      value={name}
                      onChange={e => setName(e.target.value)}
                      placeholder="Họ tên"
                      className="w-full border border-lp-ink/15 rounded-lp px-3 py-2.5 text-sm bg-white"
                    />
                    <input
                      value={phone}
                      onChange={e => setPhone(e.target.value)}
                      placeholder="Số điện thoại"
                      className="w-full border border-lp-ink/15 rounded-lp px-3 py-2.5 text-sm bg-white"
                    />
                    {leadError && <p className="text-xs text-rose-600">{leadError}</p>}
                    <ButtonPrimary disabled={leadSending} onClick={() => submitLead()} className="w-full">
                      {leadSending ? 'Đang gửi...' : 'Nhận bảng chi tiết'}
                    </ButtonPrimary>
                  </div>
                ) : (
                  <p className="text-center font-lp-sans text-sm text-lp-ink">
                    Cảm ơn {name}! DQH sẽ gửi bảng chi tiết qua Zalo trong thời gian sớm nhất.
                  </p>
                )}
              </>
            ) : (
              <div className="bg-lp-greige rounded-lp p-6 space-y-4 text-center">
                <p className="font-lp-serif text-lg text-lp-ink">
                  Các công trình DQH thực hiện thường từ {formatVnd(selectedRate?.min_budget || 0)}.
                </p>
                <p className="font-lp-sans text-sm text-lp-muted">
                  Anh/chị có thể nhận cẩm nang hoàn thiện nhà miễn phí để tham khảo thêm.
                </p>
                {!leadSent ? (
                  <div className="space-y-3 text-left">
                    <input
                      value={name}
                      onChange={e => setName(e.target.value)}
                      placeholder="Họ tên"
                      className="w-full border border-lp-ink/15 rounded-lp px-3 py-2.5 text-sm bg-white"
                    />
                    <input
                      value={phone}
                      onChange={e => setPhone(e.target.value)}
                      placeholder="Số điện thoại"
                      className="w-full border border-lp-ink/15 rounded-lp px-3 py-2.5 text-sm bg-white"
                    />
                    {leadError && <p className="text-xs text-rose-600">{leadError}</p>}
                    <ButtonPrimary disabled={leadSending} onClick={() => submitLead('cam_nang_hoan_thien_nha')} className="w-full">
                      {leadSending ? 'Đang gửi...' : 'Nhận cẩm nang miễn phí'}
                    </ButtonPrimary>
                  </div>
                ) : (
                  <p className="font-lp-sans text-sm text-lp-ink">Cảm ơn {name}! Cẩm nang sẽ được gửi qua Zalo sớm nhất.</p>
                )}
              </div>
            )}

            <button
              onClick={() => {
                setShowResult(false);
                setStep(4);
              }}
              className="block mx-auto font-lp-sans text-xs text-lp-muted cursor-pointer"
            >
              ← Chỉnh lại lựa chọn
            </button>
          </div>
        )}
      </div>
    </section>
  );
}
