// Kết nối Supabase phía server (service role). CHỈ import từ api/ hoặc lib/, không bao giờ từ src/.
import { createClient } from '@supabase/supabase-js';

export class CoreError extends Error {
  constructor(status, message, details) {
    super(message);
    this.status = status;
    this.details = details;
  }
}

let client;
export function db() {
  if (client) return client;
  const url = process.env.SUPABASE_URL || process.env.VITE_SUPABASE_URL;
  // Tên cũ VITE_SUPABASE_SERVICE_ROLE_KEY vẫn đọc được ở server (process.env), không lọt vào bản web vì frontend không còn tham chiếu import.meta.env tới nó.
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.VITE_SUPABASE_SERVICE_ROLE_KEY;
  if (!url || !key) throw new CoreError(500, 'Server thiếu SUPABASE_URL hoặc SUPABASE_SERVICE_ROLE_KEY');
  client = createClient(url, key, { auth: { persistSession: false, autoRefreshToken: false } });
  return client;
}

// Cho phép test thay client giả.
export function _setDbForTest(fake) { client = fake; }

export function check({ data, error }, what) {
  if (error) throw new CoreError(500, `Lỗi khi ${what}: ${error.message}`, error.details || error.hint);
  return data;
}
