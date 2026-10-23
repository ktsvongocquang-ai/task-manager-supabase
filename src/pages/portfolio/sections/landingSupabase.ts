import { createClient } from '@supabase/supabase-js';

// Project Supabase RIÊNG cho nội dung landing page ("DQH MIROR
// Quangmui@2512", ref yiuokvszyaqqjksshybn) — KHÁC với project chính
// "quan ly cong ty" (mlozcqdfyvuelktogdma) mà src/services/supabase.ts
// đang trỏ vào. Tách riêng theo đúng yêu cầu: tái dùng project Mirror thay
// vì xoá, giữ dữ liệu landing page tách biệt khỏi dữ liệu vận hành công ty.
// Chỉ có quyền đọc (anon SELECT) — sửa nội dung qua Supabase Table Editor.
const LANDING_SUPABASE_URL = 'https://yiuokvszyaqqjksshybn.supabase.co';
const LANDING_SUPABASE_KEY = 'sb_publishable_-MePkqVIFqX6lyS9Yw3uxQ_6FWzXem1';

export const landingSupabase = createClient(LANDING_SUPABASE_URL, LANDING_SUPABASE_KEY);
