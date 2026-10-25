import type { LandingPageRow } from '../hooks/useLeadParams';
import { SectionLabel } from '../ui/SectionLabel';
import { track } from '../lib/track';
import { LP_SECTION_SPACING } from '../ui/constants';

interface Props {
  page: LandingPageRow | null | undefined;
}

function renderDqh() {
  // D·Q·H (Đồng Hành · Quy Chuẩn · Hài Lòng): chữ cái đầu màu đỏ, còn lại màu ink
  const parts = [
    { lead: 'Đ', rest: 'ồng Hành' },
    { lead: 'Q', rest: 'uy Chuẩn' },
    { lead: 'H', rest: 'ài Lòng' },
  ];
  return (
    <p className="font-lp-serif text-base">
      {parts.map((p, i) => (
        <span key={p.lead}>
          <span className="text-lp-red font-semibold">{p.lead}</span>
          <span className="text-lp-ink">{p.rest}</span>
          {i < parts.length - 1 && <span className="text-lp-ink"> · </span>}
        </span>
      ))}
    </p>
  );
}

export function Architect({ page }: Props) {
  const zaloHref = page?.architect_zalo ? `https://zalo.me/${page.architect_zalo.replace(/[^0-9]/g, '')}` : null;

  return (
    <section id="architect" className={`px-6 ${LP_SECTION_SPACING} bg-lp-greige`}>
      <div className="max-w-5xl mx-auto grid grid-cols-1 md:grid-cols-12 gap-10 items-center">
        {page?.architect_photo && (
          <div className="md:col-span-5">
            <img src={page.architect_photo} alt={page.architect_name || ''} loading="lazy" className="w-full aspect-[4/5] object-cover rounded-lp" />
          </div>
        )}

        <div className={page?.architect_photo ? 'md:col-span-7 space-y-6' : 'md:col-span-12 space-y-6 max-w-xl'}>
          <SectionLabel>(NGƯỜI CHỊU TRÁCH NHIỆM)</SectionLabel>

          <div>
            <h2 className="font-lp-serif text-[40px] leading-tight text-lp-ink">{page?.architect_name || 'DQH Architects'}</h2>
            {page?.architect_role && <p className="font-lp-sans text-xs text-lp-muted mt-1">{page.architect_role}</p>}
          </div>

          {page?.architect_quote && (
            <p className="font-lp-serif italic text-[22px] leading-snug text-lp-ink">{page.architect_quote}</p>
          )}

          {page?.architect_signature && (
            <img src={page.architect_signature} alt="Chữ ký" loading="lazy" className="h-12 object-contain object-left" />
          )}

          {page?.architect_stats && page.architect_stats.length > 0 && (
            <div className="flex flex-wrap gap-x-10 gap-y-4 pt-2">
              {page.architect_stats.map((stat, i) => (
                <div key={i}>
                  <p className="font-lp-serif text-3xl text-lp-gold">{stat.value}</p>
                  <p className="font-lp-sans text-[10px] uppercase tracking-[0.12em] text-lp-muted mt-1">{stat.label}</p>
                </div>
              ))}
            </div>
          )}

          {renderDqh()}

          {zaloHref && (
            <a
              href={zaloHref}
              target="_blank"
              rel="noopener noreferrer"
              onClick={() => track('click_zalo_kts')}
              className="inline-flex items-center justify-center gap-2 px-6 py-3.5 rounded-lp border border-lp-gold bg-transparent text-lp-ink font-lp-sans text-xs font-semibold uppercase tracking-[0.12em] transition-colors hover:bg-lp-gold/10 cursor-pointer"
            >
              Trao đổi trực tiếp với KTS
            </a>
          )}
        </div>
      </div>
    </section>
  );
}
