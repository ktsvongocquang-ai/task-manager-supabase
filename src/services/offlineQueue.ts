// Hàng chờ khi mất sóng: lưu bản ghi vào máy (localStorage), có sóng lại thì tự gửi lên Supabase.
// Dùng cho nhật ký, biểu mẫu, giao việc ở công trình — nơi sóng yếu là chuyện thường.
import { supabase } from './supabase';

const KEY = 'dqh_offline_queue_v1';
export type QueuedInsert = { id: string; table: string; row: Record<string, any>; basicKeys?: string[]; label: string; at: number };

function read(): QueuedInsert[] {
  try { return JSON.parse(localStorage.getItem(KEY) || '[]'); } catch { return []; }
}
function write(items: QueuedInsert[]) {
  try { localStorage.setItem(KEY, JSON.stringify(items)); } catch { /* bộ nhớ đầy: bỏ qua */ }
  try { window.dispatchEvent(new CustomEvent('dqh-queue-changed', { detail: items.length })); } catch { /* ignore */ }
}

export const queued = () => read();
export const isNetworkError = (msg?: string | null) => !navigator.onLine || /failed to fetch|network|load failed|fetch failed|timeout/i.test(String(msg || ''));

export function enqueue(item: Omit<QueuedInsert, 'id' | 'at'>) {
  write([...read(), { ...item, id: Math.random().toString(36).slice(2), at: Date.now() }]);
}

/** Ghi 1 dòng; database chưa có cột mới thì ghi lại với các cột cơ bản. Trả lỗi (chuỗi) hoặc null. */
export async function insertRow(table: string, full: Record<string, any>, basicKeys?: string[]): Promise<string | null> {
  const r1 = await supabase.from(table).insert(full);
  if (!r1.error) return null;
  if (!basicKeys || !/column|schema cache/i.test(r1.error.message)) return r1.error.message;
  const basic = Object.fromEntries(Object.entries(full).filter(([k]) => basicKeys.includes(k)));
  const r2 = await supabase.from(table).insert(basic);
  return r2.error ? r2.error.message : null;
}

/**
 * Ghi ngay nếu có sóng; mất sóng thì đưa vào hàng chờ.
 * Trả { ok: true, queued: boolean } hoặc { ok: false, error }.
 */
export async function saveOrQueue(table: string, row: Record<string, any>, label: string, basicKeys?: string[]) {
  if (!navigator.onLine) { enqueue({ table, row, basicKeys, label }); return { ok: true as const, queued: true }; }
  let err: string | null;
  try { err = await insertRow(table, row, basicKeys); } catch (e: any) { err = e?.message || String(e); }
  if (!err) return { ok: true as const, queued: false };
  if (isNetworkError(err)) { enqueue({ table, row, basicKeys, label }); return { ok: true as const, queued: true }; }
  return { ok: false as const, error: err };
}

let flushing = false;
/** Gửi lại mọi bản ghi đang chờ. Trả số bản đã gửi được. */
export async function flushQueue(): Promise<number> {
  if (flushing || !navigator.onLine) return 0;
  flushing = true;
  let sent = 0;
  try {
    for (const it of read()) {
      let err: string | null;
      try { err = await insertRow(it.table, it.row, it.basicKeys); } catch (e: any) { err = e?.message || String(e); }
      if (err && isNetworkError(err)) break; // vẫn chưa có sóng: để lần sau
      // Gửi được, hoặc lỗi dữ liệu không thể sửa bằng cách gửi lại: bỏ khỏi hàng chờ
      if (err) console.warn('[Hàng chờ] Bỏ bản ghi lỗi', it.label, err);
      else sent++;
      write(read().filter(x => x.id !== it.id));
    }
  } finally { flushing = false; }
  return sent;
}

let started = false;
/** Gọi 1 lần khi mở app: có sóng lại là tự gửi. */
export function startQueueSync(onSent?: (n: number) => void) {
  if (started) return;
  started = true;
  const run = async () => { const n = await flushQueue(); if (n && onSent) onSent(n); };
  window.addEventListener('online', run);
  document.addEventListener('visibilitychange', () => { if (document.visibilityState === 'visible') run(); });
  setInterval(run, 60_000);
  run();
}
