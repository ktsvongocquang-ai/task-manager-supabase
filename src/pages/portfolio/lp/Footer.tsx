import type { LandingPageRow, Seg } from './hooks/useLeadParams';

interface Props {
  page: LandingPageRow | null | undefined;
  seg: Seg | undefined;
}

// NV9 sẽ thay phần thân component này (quy trình 8 bước thu gọn + thông tin công ty).
export function Footer({ page }: Props) {
  return (
    <footer className="px-6 py-16 bg-lp-ink text-white/60 text-xs">
      {page?.legal_name || 'DQH Architects'}
    </footer>
  );
}
