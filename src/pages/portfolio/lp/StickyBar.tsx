import { track } from './lib/track';

interface Props {
  phone: string;
  zalo: string;
  visible: boolean;
  onEstimate: () => void;
}

function telHref(phone: string) {
  return `tel:${phone.replace(/[^0-9+]/g, '')}`;
}
function zaloHref(zalo: string) {
  return `https://zalo.me/${zalo.replace(/[^0-9]/g, '')}`;
}

export function StickyBar({ phone, zalo, visible, onEstimate }: Props) {
  if (!visible || !phone) return null;

  return (
    <>
      {/* Mobile: thanh ghim đáy màn hình, cao 64px */}
      <div
        className="fixed bottom-0 inset-x-0 z-40 md:hidden bg-lp-espresso"
        style={{ paddingBottom: 'env(safe-area-inset-bottom)' }}
      >
        <div className="h-16 grid grid-cols-3 divide-x divide-white/10">
          <a
            href={telHref(phone)}
            onClick={() => track('click_call')}
            className="flex flex-col items-center justify-center gap-0.5 text-white/90 font-lp-sans text-[11px] font-semibold uppercase tracking-wide"
          >
            <span aria-hidden="true">📞</span>
            Gọi
          </a>
          {zalo && (
            <a
              href={zaloHref(zalo)}
              target="_blank"
              rel="noopener noreferrer"
              onClick={() => track('click_zalo')}
              className="flex flex-col items-center justify-center gap-0.5 text-white/90 font-lp-sans text-[11px] font-semibold uppercase tracking-wide"
            >
              <span aria-hidden="true">💬</span>
              Zalo
            </a>
          )}
          <button
            onClick={onEstimate}
            className="flex items-center justify-center bg-lp-gold text-lp-espresso font-lp-sans text-[11px] font-bold uppercase tracking-wide cursor-pointer"
          >
            Tính chi phí
          </button>
        </div>
      </div>

      {/* Desktop: nút nổi góc phải dưới */}
      <div className="hidden md:flex fixed bottom-8 right-8 z-40 flex-col items-end gap-3">
        <a
          href={telHref(phone)}
          onClick={() => track('click_call')}
          aria-label="Gọi"
          className="w-11 h-11 rounded-full bg-lp-espresso text-white flex items-center justify-center hover:opacity-90 transition-opacity"
        >
          <span aria-hidden="true">📞</span>
        </a>
        {zalo && (
          <a
            href={zaloHref(zalo)}
            target="_blank"
            rel="noopener noreferrer"
            onClick={() => track('click_zalo')}
            aria-label="Zalo"
            className="w-11 h-11 rounded-full bg-lp-espresso text-white flex items-center justify-center hover:opacity-90 transition-opacity"
          >
            <span aria-hidden="true">💬</span>
          </a>
        )}
        <button
          onClick={onEstimate}
          className="px-5 py-3 rounded-lp bg-lp-gold text-lp-espresso font-lp-sans text-xs font-bold uppercase tracking-[0.12em] cursor-pointer hover:opacity-90 transition-opacity"
        >
          Tính chi phí
        </button>
      </div>
    </>
  );
}
