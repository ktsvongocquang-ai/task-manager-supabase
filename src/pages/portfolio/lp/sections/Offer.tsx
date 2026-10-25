import type { RefObject } from 'react';
import type { LandingPageRow, Seg } from '../hooks/useLeadParams';
import { LP_SECTION_SPACING } from '../ui/constants';

interface Props {
  page: LandingPageRow | null | undefined;
  seg: Seg | undefined;
  sale?: string;
  nguon?: string;
  utm: Record<string, string>;
  formRef: RefObject<HTMLDivElement | null>;
}

// NV8 sẽ thay phần thân section này (2 thẻ quà + form đầy đủ).
export function Offer({ page, formRef }: Props) {
  return (
    <section id="offer" className={`px-6 ${LP_SECTION_SPACING} bg-lp-espresso text-white`}>
      <div ref={formRef}>
        <p className="text-xs text-white/70">Form — {page?.response_promise || ''}</p>
      </div>
    </section>
  );
}
