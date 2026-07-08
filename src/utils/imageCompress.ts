/**
 * Compresses an image file to a WebP base64 string.
 */
export const compressImage = async (file: File | Blob, maxWidth = 2048, quality = 0.8): Promise<string> => {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = (e) => {
      const img = new Image();
      img.onload = () => {
        const canvas = document.createElement('canvas');
        let { width, height } = img;

        if (width > maxWidth) {
          height = Math.floor((maxWidth / width) * height);
          width = maxWidth;
        }

        canvas.width = width;
        canvas.height = height;
        const ctx = canvas.getContext('2d');
        if (!ctx) return reject('No canvas context');

        ctx.drawImage(img, 0, 0, width, height);
        // Compress to webp for maximum space saving
        const dataUrl = canvas.toDataURL('image/webp', quality);
        resolve(dataUrl);
      };
      img.onerror = reject;
      img.src = e.target?.result as string;
    };
    reader.onerror = reject;
    reader.readAsDataURL(file);
  });
};

/**
 * Compresses a base64 dataURL image to a smaller WebP — safe for IndexedDB storage.
 * Max 900px wide, quality 0.72 — keeps thumbnails under 200KB.
 */
export const compressThumbnailDataUrl = (dataUrl: string, maxWidth = 900, quality = 0.72): Promise<string> =>
  new Promise((resolve, reject) => {
    const img = new Image();
    img.onload = () => {
      let w = img.width, h = img.height;
      if (w > maxWidth) { h = Math.round(h * maxWidth / w); w = maxWidth; }
      const canvas = document.createElement('canvas');
      canvas.width = w;
      canvas.height = h;
      const ctx = canvas.getContext('2d');
      if (!ctx) return reject('No canvas context');
      ctx.drawImage(img, 0, 0, w, h);
      resolve(canvas.toDataURL('image/webp', quality));
    };
    img.onerror = reject;
    img.src = dataUrl;
  });

/**
 * Converts a File or Blob to a Base64 Data URL string.
 */
export const fileToBase64 = (file: File | Blob): Promise<string> => {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve(reader.result as string);
    reader.onerror = reject;
    reader.readAsDataURL(file);
  });
};

/**
 * Compresses an image file and returns a Blob ready for Supabase Storage upload.
 * Reduces large phone photos (10-20MB) to under 2MB before uploading.
 */
export const compressImageToBlob = async (file: File | Blob, maxWidth = 2048, quality = 0.85): Promise<Blob> => {
  const dataUrl = await compressImage(file, maxWidth, quality);
  // Convert dataURL to Blob without fetch
  const [header, data] = dataUrl.split(',');
  const mime = header.match(/:(.*?);/)?.[1] || 'image/webp';
  const binary = atob(data);
  const arr = new Uint8Array(binary.length);
  for (let i = 0; i < binary.length; i++) arr[i] = binary.charCodeAt(i);
  return new Blob([arr], { type: mime });
};
