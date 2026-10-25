import type { Seg } from '../hooks/useLeadParams';

interface Props {
  seg: Seg | undefined;
  setSeg: (seg: Seg) => void;
  onEstimate: () => void;
  onViewProjects: () => void;
}

// NV4 sẽ thay phần thân section này.
export function Hero({ onEstimate, onViewProjects }: Props) {
  return (
    <section id="hero" className="min-h-[70vh] flex items-end px-6 pb-16 pt-32 bg-lp-espresso text-white">
      <div className="space-y-6">
        <h1 className="font-lp-serif text-4xl">DQH Architects</h1>
        <div className="flex gap-3">
          <button onClick={onEstimate} className="underline">
            Tính chi phí
          </button>
          <button onClick={onViewProjects} className="underline">
            Xem công trình
          </button>
        </div>
      </div>
    </section>
  );
}
