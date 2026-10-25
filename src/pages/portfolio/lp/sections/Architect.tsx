import type { LandingPageRow } from '../hooks/useLeadParams';
import { LP_SECTION_SPACING } from '../ui/constants';

interface Props {
  page: LandingPageRow | null | undefined;
}

// NV7 sẽ thay phần thân section này.
export function Architect({ page }: Props) {
  return (
    <section id="architect" className={`px-6 ${LP_SECTION_SPACING} bg-lp-greige`}>
      <p className="text-xs text-lp-muted">KTS — {page?.architect_name || '(chưa có dữ liệu)'}</p>
    </section>
  );
}
