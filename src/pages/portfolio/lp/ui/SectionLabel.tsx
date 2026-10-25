import type { ReactNode } from 'react';

export function SectionLabel({ children, className = '' }: { children: ReactNode; className?: string }) {
  return (
    <p className={`font-lp-sans text-[11px] uppercase tracking-[0.2em] text-lp-muted ${className}`}>
      {children}
    </p>
  );
}
