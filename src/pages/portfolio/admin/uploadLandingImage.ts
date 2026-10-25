import { landingSupabase } from '../sections/landingSupabase';

// Upload ảnh cho nội dung landing page — PHẢI dùng landingSupabase (project
// "DQH MIROR"), không phải client app chính, vì toàn bộ bảng landing_* và
// phiên đăng nhập /landing-admin đều ở project này. Bucket "landing-media"
// tạo sẵn qua landing_media_storage.sql.
export async function uploadLandingImage(file: File): Promise<string> {
  const fileExt = file.name.split('.').pop();
  const fileName = `${Date.now()}-${Math.random().toString(36).slice(2, 9)}.${fileExt}`;

  const { error } = await landingSupabase.storage.from('landing-media').upload(fileName, file, {
    cacheControl: '3600',
    upsert: false,
  });
  if (error) throw error;

  const { data } = landingSupabase.storage.from('landing-media').getPublicUrl(fileName);
  return data.publicUrl;
}
