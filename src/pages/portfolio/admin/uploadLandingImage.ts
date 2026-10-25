import { landingSupabase } from '../sections/landingSupabase';

function loadImage(file: File): Promise<HTMLImageElement> {
  return new Promise((resolve, reject) => {
    const url = URL.createObjectURL(file);
    const img = new Image();
    img.onload = () => {
      resolve(img);
      URL.revokeObjectURL(url);
    };
    img.onerror = reject;
    img.src = url;
  });
}

// Giới hạn cạnh dài 1920px + nén WebP ~85% trước khi upload — ảnh chụp
// điện thoại gốc thường 4000px+/5-10MB, hiển thị trên landing page không
// cần độ phân giải đó, chỉ làm trang tải chậm.
async function compressImage(file: File, maxDim = 1920, quality = 0.85): Promise<Blob> {
  const img = await loadImage(file);
  const scale = Math.min(1, maxDim / Math.max(img.width, img.height));
  const w = Math.round(img.width * scale);
  const h = Math.round(img.height * scale);
  const canvas = document.createElement('canvas');
  canvas.width = w;
  canvas.height = h;
  const ctx = canvas.getContext('2d');
  if (!ctx) throw new Error('Không tạo được canvas context');
  ctx.drawImage(img, 0, 0, w, h);
  return new Promise((resolve, reject) => {
    canvas.toBlob(blob => (blob ? resolve(blob) : reject(new Error('Nén ảnh thất bại'))), 'image/webp', quality);
  });
}

// Upload ảnh cho nội dung landing page — PHẢI dùng landingSupabase (project
// "DQH MIROR"), không phải client app chính, vì toàn bộ bảng landing_* và
// phiên đăng nhập /landing-admin đều ở project này. Bucket "landing-media"
// tạo sẵn qua landing_media_storage.sql.
export async function uploadLandingImage(file: File): Promise<string> {
  let body: Blob = file;
  let ext = file.name.split('.').pop() || 'jpg';
  let contentType = file.type || 'image/jpeg';
  try {
    body = await compressImage(file);
    ext = 'webp';
    contentType = 'image/webp';
  } catch {
    // giữ nguyên file gốc nếu nén thất bại (vd trình duyệt không hỗ trợ canvas)
  }

  const fileName = `${Date.now()}-${Math.random().toString(36).slice(2, 9)}.${ext}`;
  const { error } = await landingSupabase.storage.from('landing-media').upload(fileName, body, {
    cacheControl: '3600',
    upsert: false,
    contentType,
  });
  if (error) throw error;

  const { data } = landingSupabase.storage.from('landing-media').getPublicUrl(fileName);
  return data.publicUrl;
}
