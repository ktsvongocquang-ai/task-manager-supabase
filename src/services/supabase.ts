import { createClient } from '@supabase/supabase-js'

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY

if (!supabaseUrl || !supabaseAnonKey) {
    console.warn('Supabase URL and Key are missing. Please check your .env file.')
}

// Fallback URLs to prevent fatal crashes during build or when env vars are missing
const safeUrl = supabaseUrl || 'https://placeholder-project.supabase.co'
const safeKey = supabaseAnonKey || 'placeholder-key'

// ── Gộp truy vấn trùng (PERF-03): nhiều component cùng lúc gọi y hệt một câu GET (vd. /construction gọi 7 lần,
// profiles 3-5 lần) -> chỉ gửi 1 request. Danh sách nhân sự giữ 60 giây. Ghi (POST/PATCH/DELETE) vào bảng nào
// thì xoá bộ nhớ của bảng đó ngay, nên không bị dữ liệu cũ.
const SHARE_MS = 1500
const LONG_MS: Record<string, number> = { profiles: 60_000 }
const cache = new Map<string, { at: number; ttl: number; res: Promise<Response> }>()
const tableOf = (url: string) => (url.match(/\/rest\/v1\/([^?/]+)/) || [])[1] || ''
const dedupFetch: typeof fetch = (input, init) => {
    const url = typeof input === 'string' ? input : input instanceof URL ? input.href : input.url
    const method = (init?.method || (typeof input === 'object' && 'method' in input ? (input as Request).method : 'GET')).toUpperCase()
    const table = tableOf(url)
    if (!table) return fetch(input, init)
    if (method !== 'GET') {
        for (const k of cache.keys()) if (tableOf(k) === table) cache.delete(k)
        return fetch(input, init)
    }
    const h = new Headers(init?.headers || (typeof input === 'object' && !(input instanceof URL) ? (input as Request).headers : undefined))
    const key = [url, h.get('authorization') || '', h.get('prefer') || '', h.get('range') || '', h.get('accept') || ''].join('|')
    const hit = cache.get(key)
    const now = Date.now()
    if (hit && now - hit.at < hit.ttl) return hit.res.then(r => r.clone())
    const res = fetch(input, init).then(r => { if (!r.ok) cache.delete(key); return r })
    res.catch(() => cache.delete(key))
    cache.set(key, { at: now, ttl: LONG_MS[table] ?? SHARE_MS, res })
    if (cache.size > 300) for (const [k, v] of cache) if (now - v.at > v.ttl) cache.delete(k)
    return res.then(r => r.clone())
}

export const supabase = createClient(safeUrl, safeKey, { global: { fetch: dedupFetch } })

// KHÔNG tạo client service-role ở frontend: key admin phải nằm phía server (api/, lib/).

export const uploadImageToStorage = async (file: File): Promise<string> => {
  // Create a unique file name
  const fileExt = file.name.split('.').pop();
  const fileName = `${Date.now()}-${Math.random().toString(36).substring(2, 9)}.${fileExt}`;
  const filePath = `${fileName}`;

  const { error: uploadError } = await supabase.storage
    .from('project-media')
    .upload(filePath, file, {
      cacheControl: '3600',
      upsert: false
    });

  if (uploadError) {
    console.error('Error uploading image:', uploadError);
    throw uploadError;
  }

  const { data } = supabase.storage
    .from('project-media')
    .getPublicUrl(filePath);

  return data.publicUrl;
};
