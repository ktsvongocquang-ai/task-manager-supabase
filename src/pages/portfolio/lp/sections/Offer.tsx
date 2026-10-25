import { useState, type RefObject } from 'react';
import { supabase } from '../../../../services/supabase';
import type { LandingPageRow, Seg } from '../hooks/useLeadParams';
import { SectionLabel } from '../ui/SectionLabel';
import { ButtonPrimary } from '../ui/Button';
import { isValidVnPhone } from '../lib/validators';
import { track } from '../lib/track';
import { LP_SECTION_SPACING } from '../ui/constants';

type CallTime = 'sang' | 'trua' | 'toi';
type GiftKey = 'concept_ai' | 'khao_sat';

interface Props {
  page: LandingPageRow | null | undefined;
  seg: Seg | undefined;
  sale?: string;
  nguon?: string;
  utm: Record<string, string>;
  intent: 'offer' | 'xem_cong_trinh' | 'bang_chi_tiet';
  estimate: Record<string, unknown> | null;
  formRef: RefObject<HTMLDivElement | null>;
}

const GIFT_OPTIONS: { key: GiftKey; label: string }[] = [
  { key: 'concept_ai', label: 'Concept AI phòng khách' },
  { key: 'khao_sat', label: 'Khảo sát, đo đạc hiện trạng' },
];

const CALL_TIME_OPTIONS: { key: CallTime; label: string }[] = [
  { key: 'sang', label: 'Sáng' },
  { key: 'trua', label: 'Trưa' },
  { key: 'toi', label: 'Tối' },
];

function computeLeadScore(estimate: Record<string, unknown> | null): 'hot' | 'warm' | 'cold' {
  if (!estimate) return 'warm';
  const tier = estimate.tier as string | undefined;
  const startTime = estimate.start_time as string | undefined;
  if (!tier || !startTime) return 'warm';
  const tierHighEnough = tier === 'kha' || tier === 'cao_cap';
  const soon = startTime === 'trong_1_thang' || startTime === 'tu_1_3_thang';
  return tierHighEnough && soon ? 'hot' : 'warm';
}

export function Offer({ page, seg, sale, nguon, utm, intent, estimate, formRef }: Props) {
  const [gift, setGift] = useState<GiftKey | null>(null);
  const [name, setName] = useState('');
  const [phone, setPhone] = useState('');
  const [callTime, setCallTime] = useState<CallTime | null>(null);
  const [showMessage, setShowMessage] = useState(false);
  const [message, setMessage] = useState('');
  const [honeypot, setHoneypot] = useState('');
  const [error, setError] = useState('');
  const [sending, setSending] = useState(false);
  const [sent, setSent] = useState(false);

  const hasBadge = !!page?.offer_slots_left && page.offer_slots_left > 0;
  const zalo = page?.default_zalo;
  const zaloHref = zalo ? `https://zalo.me/${zalo.replace(/[^0-9]/g, '')}` : null;

  const submit = async () => {
    setError('');
    if (honeypot) {
      // bot — giả vờ thành công, không gửi gì cả
      setSent(true);
      return;
    }
    if (!name.trim()) {
      setError('Nhập họ tên.');
      return;
    }
    if (!isValidVnPhone(phone)) {
      setError('Số điện thoại chưa đúng định dạng VN.');
      return;
    }
    setSending(true);
    const { error: rpcError } = await supabase.rpc('submit_lp_lead', {
      p_name: name.trim(),
      p_phone: phone.trim(),
      p_call_time: callTime,
      p_message: message.trim() || null,
      p_seg: seg || null,
      p_sale_code: sale || null,
      p_source: nguon || null,
      p_utm: utm,
      p_intent: intent,
      p_gift: gift,
      p_estimate: estimate,
      p_lead_score: computeLeadScore(estimate),
    });
    setSending(false);
    if (rpcError) {
      setError('Gửi không thành công, thử lại giúp mình.');
      return;
    }
    setSent(true);
    track('lead_submit', { intent, gift });
  };

  return (
    <section id="offer" className={`px-6 ${LP_SECTION_SPACING} bg-lp-espresso text-white`}>
      <div ref={formRef} className="max-w-xl mx-auto">
        <SectionLabel className="mb-3 text-center !text-white/50">(LỜI MỜI)</SectionLabel>
        <h2 className="font-lp-serif text-3xl md:text-4xl font-light text-center mb-10 leading-tight">
          Gặp KTS và nhận một món quà cho ngôi nhà của anh/chị
        </h2>

        {!sent ? (
          <div className="space-y-6">
            <div>
              {hasBadge && (
                <span className="inline-block bg-lp-red text-white text-[10px] uppercase tracking-wide px-2.5 py-1 rounded-lp mb-3">
                  Tháng {page?.offer_month} còn {page?.offer_slots_left} suất
                </span>
              )}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                {GIFT_OPTIONS.map(opt => (
                  <button
                    key={opt.key}
                    onClick={() => setGift(opt.key)}
                    className={`text-left rounded-lp border px-4 py-3.5 font-lp-sans text-sm font-semibold cursor-pointer transition-colors ${
                      gift === opt.key ? 'border-lp-gold bg-lp-gold/10' : 'border-white/20 hover:border-white/40'
                    }`}
                  >
                    {opt.label}
                  </button>
                ))}
              </div>
            </div>

            <div className="space-y-3">
              <input
                value={name}
                onChange={e => setName(e.target.value)}
                placeholder="Họ tên"
                className="w-full rounded-lp bg-white/5 border border-white/20 px-4 py-3 text-sm placeholder:text-white/40"
              />
              <input
                value={phone}
                onChange={e => setPhone(e.target.value)}
                placeholder="Số điện thoại"
                className="w-full rounded-lp bg-white/5 border border-white/20 px-4 py-3 text-sm placeholder:text-white/40"
              />
              {/* Honeypot — ẩn khỏi mắt người dùng thật, bot thường tự điền */}
              <input
                value={honeypot}
                onChange={e => setHoneypot(e.target.value)}
                tabIndex={-1}
                autoComplete="off"
                aria-hidden="true"
                className="absolute opacity-0 pointer-events-none -z-10 w-0 h-0"
              />

              <div>
                <p className="font-lp-sans text-[10px] uppercase tracking-[0.15em] text-white/50 mb-2">Giờ tiện gọi</p>
                <div className="flex gap-2">
                  {CALL_TIME_OPTIONS.map(opt => (
                    <button
                      key={opt.key}
                      onClick={() => setCallTime(opt.key)}
                      className={`flex-1 py-2.5 rounded-lp border text-xs font-semibold cursor-pointer ${
                        callTime === opt.key ? 'border-lp-gold bg-lp-gold/10' : 'border-white/20'
                      }`}
                    >
                      {opt.label}
                    </button>
                  ))}
                </div>
              </div>

              {!showMessage ? (
                <button onClick={() => setShowMessage(true)} className="font-lp-sans text-xs text-lp-gold cursor-pointer">
                  + Thêm lời nhắn
                </button>
              ) : (
                <textarea
                  value={message}
                  onChange={e => setMessage(e.target.value)}
                  placeholder="Lời nhắn (không bắt buộc)"
                  rows={3}
                  className="w-full rounded-lp bg-white/5 border border-white/20 px-4 py-3 text-sm placeholder:text-white/40"
                />
              )}
            </div>

            {error && <p className="text-xs text-rose-300">{error}</p>}

            <ButtonPrimary disabled={sending} onClick={submit} className="w-full">
              {sending ? 'Đang gửi...' : 'Gửi yêu cầu'}
            </ButtonPrimary>
            <p className="font-lp-sans text-[11px] text-white/50 text-center">
              Thông tin chỉ dùng để DQH liên hệ tư vấn.
            </p>
          </div>
        ) : (
          <div className="text-center space-y-5 py-8">
            <p className="font-lp-serif text-2xl">Cảm ơn {name}!</p>
            <p className="font-lp-sans text-sm text-white/70">
              {page?.response_promise || 'DQH sẽ liên hệ với anh/chị trong thời gian sớm nhất.'}
            </p>
            {zaloHref && (
              <a
                href={zaloHref}
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center justify-center px-6 py-3.5 rounded-lp bg-lp-gold text-lp-espresso font-lp-sans text-xs font-semibold uppercase tracking-[0.12em]"
              >
                Nhắn Zalo ngay
              </a>
            )}
          </div>
        )}
      </div>
    </section>
  );
}
