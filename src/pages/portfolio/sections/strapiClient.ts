// Backend nội dung landing page (/p/:token) — Strapi, đọc công khai (role
// Public chỉ có quyền find/findOne, không ghi được), sửa nội dung qua
// Strapi admin panel (<STRAPI_URL>/admin), không qua app này nữa.
const STRAPI_URL = import.meta.env.VITE_STRAPI_URL || 'http://localhost:1337';

export async function strapiFetch<T = any>(path: string): Promise<T> {
  const res = await fetch(`${STRAPI_URL}${path}`);
  if (!res.ok) throw new Error(`Strapi ${path} -> ${res.status}`);
  return res.json();
}
