import type { ButtonHTMLAttributes, ReactNode } from 'react';

type BaseProps = {
  children: ReactNode;
  className?: string;
};

type Props = BaseProps & ButtonHTMLAttributes<HTMLButtonElement>;

// Không dùng shadow đậm / gradient sặc sỡ — giữ đúng tinh thần Quiet Luxury của NV1.

export function ButtonPrimary({ children, className = '', ...rest }: Props) {
  return (
    <button
      {...rest}
      className={`inline-flex items-center justify-center gap-2 px-6 py-3.5 rounded-lp bg-lp-gold text-lp-espresso font-lp-sans text-xs font-semibold uppercase tracking-[0.12em] transition-opacity hover:opacity-90 active:opacity-80 cursor-pointer disabled:opacity-40 disabled:cursor-not-allowed ${className}`}
    >
      {children}
    </button>
  );
}

export function ButtonGhost({ children, className = '', ...rest }: Props) {
  return (
    <button
      {...rest}
      className={`inline-flex items-center justify-center gap-2 px-6 py-3.5 rounded-lp border border-lp-gold bg-transparent text-lp-ink font-lp-sans text-xs font-semibold uppercase tracking-[0.12em] transition-colors hover:bg-lp-gold/10 cursor-pointer disabled:opacity-40 disabled:cursor-not-allowed ${className}`}
    >
      {children}
    </button>
  );
}

export function ButtonLink({ children, className = '', ...rest }: Props) {
  return (
    <button
      {...rest}
      className={`inline-flex items-center gap-1.5 font-lp-sans text-xs font-semibold uppercase tracking-[0.12em] text-lp-gold hover:text-lp-ink transition-colors cursor-pointer ${className}`}
    >
      {children}
      <span aria-hidden="true">→</span>
    </button>
  );
}
