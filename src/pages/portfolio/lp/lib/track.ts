import { supabase } from '../../../../services/supabase';

const SESSION_KEY = 'lp_session_id';

function getSessionId(): string {
  if (typeof window === 'undefined') return 'ssr';
  let id = sessionStorage.getItem(SESSION_KEY);
  if (!id) {
    id = crypto.randomUUID ? crypto.randomUUID() : `${Date.now()}-${Math.random().toString(36).slice(2)}`;
    sessionStorage.setItem(SESSION_KEY, id);
  }
  return id;
}

// NV10.4 — ghi sự kiện vào lp_events, không chặn giao diện khi lỗi.
export function track(event: string, payload?: Record<string, unknown>) {
  // NV10.6 — chỗ gọi Meta Pixel / GA4 sau này (chưa gắn):
  // if (window.fbq) window.fbq('trackCustom', event, payload);
  // if (window.gtag) window.gtag('event', event, payload);
  try {
    const seg = sessionStorage.getItem('lp_seg') || undefined;
    const sale_code = sessionStorage.getItem('lp_sale') || undefined;
    const source = sessionStorage.getItem('lp_nguon') || undefined;
    supabase
      .from('lp_events')
      .insert({ event, seg, sale_code, source, session_id: getSessionId(), payload: payload || null })
      .then(
        () => {},
        () => {}
      );
  } catch {
    // im lặng — tracking không được phép làm vỡ trang
  }
}
