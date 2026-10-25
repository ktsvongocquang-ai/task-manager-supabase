import { useEffect, useRef, useState } from 'react';

// NV6 — đếm số chạy lên trong 800ms khi hiện kết quả
export function CountUp({ value, formatter, durationMs = 800 }: { value: number; formatter: (n: number) => string; durationMs?: number }) {
  const [display, setDisplay] = useState(0);
  const prevValue = useRef(0);

  useEffect(() => {
    const from = prevValue.current;
    const to = value;
    const start = performance.now();
    let raf = 0;
    const tick = (now: number) => {
      const t = Math.min(1, (now - start) / durationMs);
      const eased = 1 - Math.pow(1 - t, 3);
      setDisplay(from + (to - from) * eased);
      if (t < 1) raf = requestAnimationFrame(tick);
      else prevValue.current = to;
    };
    raf = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(raf);
  }, [value, durationMs]);

  return <>{formatter(display)}</>;
}
