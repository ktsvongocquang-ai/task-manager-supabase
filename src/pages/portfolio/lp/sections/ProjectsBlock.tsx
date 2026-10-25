import type { Seg } from '../hooks/useLeadParams';
import { LP_SECTION_SPACING } from '../ui/constants';

interface Props {
  seg: Seg | undefined;
  onBookVisit: () => void;
}

// NV5 sẽ thay phần thân section này.
export function ProjectsBlock({ seg }: Props) {
  return (
    <section id="projects" className={`px-6 ${LP_SECTION_SPACING} bg-lp-greige`}>
      <p className="text-xs text-lp-muted">Công trình — seg: {seg || '(chưa chọn)'}</p>
    </section>
  );
}
