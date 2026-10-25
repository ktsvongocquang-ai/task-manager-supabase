import type { Seg } from '../hooks/useLeadParams';
import { LP_SECTION_SPACING } from '../ui/constants';

interface Props {
  seg: Seg | undefined;
  setSeg: (seg: Seg) => void;
  onNeedDetail: (payload: Record<string, unknown>) => void;
}

// NV6 sẽ thay phần thân section này (wizard 4 bước + công thức tính giá).
export function Estimator({ seg }: Props) {
  return (
    <section id="estimator" className={`px-6 ${LP_SECTION_SPACING} bg-white`}>
      <p className="text-xs text-lp-muted">Khái toán — seg: {seg || '(chưa chọn)'}</p>
    </section>
  );
}
