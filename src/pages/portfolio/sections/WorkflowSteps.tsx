import { useEffect, useState } from 'react';
import { useSearchParams } from 'react-router-dom';
import { SegmentedToggle } from './shared';
import { landingSupabase } from './landingSupabase';

type ProcessType = 'noi_that' | 'xay_dung';
type Phase = 'thiet_ke' | 'thi_cong' | 'ban_giao';

// Nhãn + mô tả ngắn của 2 loại quy trình — là tên cố định của 2 lựa chọn
// (giống hạng mục công trình), không phải nội dung kinh doanh cần admin sửa,
// nên giữ ở code như category label của section Chi phí.
const PROCESS_LABEL: Record<ProcessType, string> = {
  noi_that: 'Nội thất & hoàn thiện',
  xay_dung: 'Xây dựng trọn gói',
};
const PROCESS_HINT: Record<ProcessType, string> = {
  noi_that: 'Từ khảo sát đến bàn giao · Căn hộ · nhà phố dự án',
  xay_dung: 'Chưa gồm thời gian xin phép · Nhà phố · villa xây mới',
};
const PHASE_LABEL: Record<Phase, string> = { thiet_ke: 'Thiết kế', thi_cong: 'Thi công', ban_giao: 'Bàn giao' };
const PHASE_COLOR: Record<Phase, string> = { thiet_ke: '#D4BC95', thi_cong: '#B8913A', ban_giao: '#1A1814' };

interface ProcessStep {
  processType: ProcessType;
  phase: Phase;
  title: string;
  durationLabel: string;
  daysMin: number;
  daysMax: number;
  owner: string | null;
  description: string | null;
}

interface WarrantyItem {
  item: string;
  noiThatTerm: string | null;
  xayDungTerm: string | null;
}

function segToProcessType(seg: string | null): ProcessType {
  if (seg === 'can-ho' || seg === 'nha-pho-du-an') return 'noi_that';
  if (seg === 'nha-pho' || seg === 'villa') return 'xay_dung';
  return 'noi_that';
}

function monthsRange(steps: ProcessStep[]): string {
  const sumMin = steps.reduce((a, s) => a + s.daysMin, 0);
  const sumMax = steps.reduce((a, s) => a + s.daysMax, 0);
  const mMin = Math.max(1, Math.round(sumMin / 30));
  const mMax = Math.max(mMin, Math.round(sumMax / 30));
  return mMin === mMax ? `≈ ${mMin} tháng` : `≈ ${mMin} – ${mMax} tháng`;
}

export function WorkflowSteps() {
  const [searchParams] = useSearchParams();
  const [allSteps, setAllSteps] = useState<ProcessStep[] | null>(null);
  const [warranty, setWarranty] = useState<WarrantyItem[]>([]);
  const [processType, setProcessType] = useState<ProcessType>(() => segToProcessType(searchParams.get('seg')));
  const [openIndex, setOpenIndex] = useState(0);

  useEffect(() => {
    Promise.all([
      landingSupabase
        .from('landing_process_steps')
        .select('process_type,phase,title,duration_label,days_min,days_max,owner,description')
        .order('sort_order'),
      landingSupabase.from('landing_warranty_items').select('item,noi_that_term,xay_dung_term').order('sort_order'),
    ])
      .then(([stepsRes, warrantyRes]) => {
        setAllSteps(
          (stepsRes.data || []).map(row => ({
            processType: row.process_type, phase: row.phase, title: row.title,
            durationLabel: row.duration_label || '', daysMin: row.days_min || 0, daysMax: row.days_max || 0,
            owner: row.owner, description: row.description,
          }))
        );
        setWarranty((warrantyRes.data || []).map(row => ({ item: row.item, noiThatTerm: row.noi_that_term, xayDungTerm: row.xay_dung_term })));
      })
      .catch(() => setAllSteps([]));
  }, []);

  const steps = (allSteps ?? []).filter(s => s.processType === processType);
  const designSteps = steps.filter(s => s.phase === 'thiet_ke');
  const otherSteps = steps.filter(s => s.phase !== 'thiet_ke');
  const phases: Phase[] = ['thiet_ke', 'thi_cong', 'ban_giao'];
  const phaseStats = phases.map(ph => {
    const ss = steps.filter(s => s.phase === ph);
    const mn = ss.reduce((a, s) => a + s.daysMin, 0);
    const mx = ss.reduce((a, s) => a + s.daysMax, 0);
    return { phase: ph, min: mn, max: mx, flex: Math.max(mx, 1) };
  }).filter(p => p.max > 0 || p.min > 0);

  return (
    <section id="section-2" className="px-6 md:px-16 py-20 bg-[#F8F5F0] border-b border-[#2C2920]/5">
      <div className="max-w-6xl mx-auto flex flex-col gap-9">
        <div className="flex flex-wrap items-end justify-between gap-6">
          <div>
            <p className="text-xs tracking-[0.22em] uppercase text-[#8A8070] mb-2.5">(QUY TRÌNH)</p>
            <h2 className="font-sans font-bold text-4xl md:text-[44px] tracking-tight leading-[1.05] text-[#2C2920]">
              Quy trình làm việc<br />
              <span className="font-serif italic font-light text-[#B8913A]">từ khảo sát đến bàn giao</span>
            </h2>
          </div>
          <SegmentedToggle
            ariaLabel="Loại hình quy trình"
            value={processType}
            onChange={v => { setProcessType(v); setOpenIndex(0); }}
            options={(Object.keys(PROCESS_LABEL) as ProcessType[]).map(p => ({ value: p, label: PROCESS_LABEL[p] }))}
          />
        </div>

        {allSteps === null ? (
          <p className="text-xs text-[#8A8070]">Đang tải...</p>
        ) : steps.length === 0 ? null : (
          <>
            {/* ── thẻ tổng quan ── */}
            <div className="flex flex-col gap-4 p-7 md:p-8 bg-white border border-[#2C2920]/10 rounded-sm">
              <div className="flex flex-wrap items-baseline gap-x-4 gap-y-2">
                <span className="font-serif text-3xl md:text-[38px] leading-none text-[#2C2920]">{monthsRange(steps)}</span>
                <span className="text-sm text-[#8A8070]">{PROCESS_HINT[processType]}</span>
              </div>
              <div className="flex gap-3 flex-wrap">
                {phaseStats.map(p => (
                  <div key={p.phase} style={{ flex: `${p.flex} 1 0` }} className="flex flex-col gap-2 min-w-[72px]">
                    <div className="h-1.5 rounded-sm" style={{ background: PHASE_COLOR[p.phase] }} />
                    <span className="text-[13px] text-[#2C2920] leading-snug">
                      <span className="font-semibold">{PHASE_LABEL[p.phase]}</span>
                      <span className="block md:inline text-[#8A8070] md:text-[#2C2920]"><span className="hidden md:inline"> · </span>{p.min === p.max ? p.max : `${p.min}–${p.max}`} ngày</span>
                    </span>
                  </div>
                ))}
              </div>
            </div>

            {/* ── 2 cột bước, đánh số liên tục ── */}
            <div className="grid gap-y-6 gap-x-12" style={{ gridTemplateColumns: 'repeat(auto-fit, minmax(min(100%, 420px), 1fr))' }}>
              {[
                { name: 'GIAI ĐOẠN THIẾT KẾ', col: designSteps },
                { name: 'GIAI ĐOẠN THI CÔNG & BÀN GIAO', col: otherSteps },
              ].map(({ name, col }) => (
                <div key={name} className="flex flex-col">
                  <p className="text-[11px] tracking-[0.2em] uppercase text-[#8A8070] mb-2">{name}</p>
                  {col.map(step => {
                    const idx = steps.indexOf(step);
                    const isOpen = openIndex === idx;
                    return (
                      <div key={idx} className="flex flex-col border-t border-[#2C2920]/10">
                        <button
                          onClick={() => setOpenIndex(isOpen ? -1 : idx)}
                          aria-expanded={isOpen}
                          className="w-full min-h-[56px] flex items-center gap-4 py-3.5 bg-transparent border-0 text-left cursor-pointer"
                        >
                          <span className="shrink-0 w-7 font-serif italic text-lg text-[#B8913A]">{String(idx + 1).padStart(2, '0')}</span>
                          <span className="flex-1 min-w-0 text-[15px] font-medium text-[#2C2920] truncate">{step.title}</span>
                          <span className="text-xs text-[#8A8070] whitespace-nowrap">{step.durationLabel}</span>
                          <span aria-hidden className="shrink-0 w-4 text-center text-[#B8913A]">{isOpen ? '−' : '+'}</span>
                        </button>
                        {isOpen && (
                          <div className="pl-11 pr-2 pb-4 flex flex-col gap-1.5">
                            {step.owner && <p className="m-0 text-[11px] tracking-[0.12em] uppercase text-[#8A8070]">{step.owner}</p>}
                            {step.description && <p className="m-0 text-sm leading-relaxed text-[#2C2920]">{step.description}</p>}
                          </div>
                        )}
                      </div>
                    );
                  })}
                </div>
              ))}
            </div>

            {/* ── bảo hành ── */}
            {warranty.length > 0 && (
              <div className="flex flex-col gap-4 p-7 md:p-8 bg-[#EDE7DF] rounded-sm">
                <div className="flex flex-wrap items-baseline justify-between gap-x-6 gap-y-2">
                  <p className="m-0 font-serif text-2xl text-[#2C2920]">Bảo hành theo hạng mục</p>
                  <p className="m-0 text-[13px] text-[#2C2920]/70">Phiếu bảo hành kèm hợp đồng, ghi rõ điều kiện áp dụng.</p>
                </div>
                <div className="grid gap-px bg-[#2C2920]/10" style={{ gridTemplateColumns: 'repeat(auto-fit, minmax(160px, 1fr))' }}>
                  {warranty
                    .map(w => ({ item: w.item, term: processType === 'noi_that' ? w.noiThatTerm : w.xayDungTerm }))
                    .filter(w => !!w.term)
                    .map(w => (
                      <div key={w.item} className="bg-[#F8F5F0] p-4 flex flex-col gap-1.5">
                        <span className="text-[11px] tracking-[0.14em] uppercase text-[#8A8070]">{w.item}</span>
                        <span className="text-[15px] text-[#2C2920]">{w.term}</span>
                      </div>
                    ))}
                </div>
              </div>
            )}
          </>
        )}
      </div>
    </section>
  );
}
