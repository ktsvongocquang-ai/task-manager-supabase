import * as pdfjsLib from 'pdfjs-dist';

// Use unpkg to guarantee the exact version of the worker is loaded
// This avoids Vite dev server MIME type or bundling issues with .mjs files
pdfjsLib.GlobalWorkerOptions.workerSrc = `https://unpkg.com/pdfjs-dist@${pdfjsLib.version}/build/pdf.worker.min.mjs`;

/**
 * Compresses an image file to a WebP base64 string.
 */
/**
 * Compresses an image file (File/Blob) to a WebP base64 string.
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

/**
 * Gets the number of pages from a Base64 PDF Data URL.
 */
export const getPdfPageCount = async (pdfDataUrl: string): Promise<number> => {
  let dataParams: any = {};
  
  if (pdfDataUrl.startsWith('http://') || pdfDataUrl.startsWith('https://')) {
    dataParams = { url: pdfDataUrl };
  } else {
    const base64Data = pdfDataUrl.split(',')[1] || pdfDataUrl;
    const binaryString = window.atob(base64Data);
    const bytes = new Uint8Array(binaryString.length);
    for (let i = 0; i < binaryString.length; i++) {
      bytes[i] = binaryString.charCodeAt(i);
    }
    dataParams = { data: bytes };
  }
  
  const pdf = await pdfjsLib.getDocument(dataParams).promise;
  return pdf.numPages;
};

/**
 * Renders a specific page of a Base64 PDF to a WebP Data URL.
 * @param pageIndex 0-based index of the page
 */
export const renderPdfPageToImage = async (pdfDataUrl: string, pageIndex: number): Promise<string> => {
  let dataParams: any = {};
  
  if (pdfDataUrl.startsWith('http://') || pdfDataUrl.startsWith('https://')) {
    dataParams = { url: pdfDataUrl };
  } else {
    const base64Data = pdfDataUrl.split(',')[1] || pdfDataUrl;
    const binaryString = window.atob(base64Data);
    const bytes = new Uint8Array(binaryString.length);
    for (let i = 0; i < binaryString.length; i++) {
      bytes[i] = binaryString.charCodeAt(i);
    }
    dataParams = { data: bytes };
  }
  
  const pdf = await pdfjsLib.getDocument(dataParams).promise;
  const page = await pdf.getPage(pageIndex + 1); // pdf.js is 1-indexed
  
  // Scale 1.5 for thumbnail — enough resolution for preview, keeps base64 < 500KB
  const viewport = page.getViewport({ scale: 1.5 });
  const canvas = document.createElement('canvas');
  const ctx = canvas.getContext('2d');
  if (!ctx) throw new Error('No canvas context');

  canvas.width = viewport.width;
  canvas.height = viewport.height;

  await page.render({ canvasContext: ctx, viewport }).promise;
  return canvas.toDataURL('image/webp', 0.78); // Balanced quality for thumbnail preview

};

/**
 * Renders a specific page of a PDF from a local ArrayBuffer (no network/CORS issues).
 * Always use this when the file is available locally.
 */
export const renderPdfPageFromArrayBuffer = async (buffer: ArrayBuffer, pageIndex: number): Promise<string> => {
  // Use .slice() to avoid "detached ArrayBuffer" error — pdfjs web worker transfers ownership
  const pdf = await pdfjsLib.getDocument({ data: new Uint8Array(buffer.slice()) }).promise;
  const page = await pdf.getPage(pageIndex + 1); // pdf.js is 1-indexed
  const viewport = page.getViewport({ scale: 2.5 }); // High quality scale for crisp blueprints
  const canvas = document.createElement('canvas');
  const ctx = canvas.getContext('2d');
  if (!ctx) throw new Error('No canvas context');
  canvas.width = viewport.width;
  canvas.height = viewport.height;
  await page.render({ canvasContext: ctx, viewport }).promise;
  return canvas.toDataURL('image/webp', 0.95); // High quality
};

/**
 * Gets the PDFDocumentProxy from an ArrayBuffer for caching.
 */
export const getPdfDocumentFromArrayBuffer = async (buffer: ArrayBuffer): Promise<any> => {
  return await pdfjsLib.getDocument({ data: new Uint8Array(buffer.slice()) }).promise;
};

/**
 * Renders a specific page from a cached PDFDocumentProxy.
 */
export const renderPdfPageFromDocument = async (pdf: any, pageIndex: number): Promise<string> => {
  const page = await pdf.getPage(pageIndex + 1);
  const viewport = page.getViewport({ scale: 2.5 }); // High quality scale for crisp blueprints
  const canvas = document.createElement('canvas');
  const ctx = canvas.getContext('2d');
  if (!ctx) throw new Error('No canvas context');
  canvas.width = viewport.width;
  canvas.height = viewport.height;
  await page.render({ canvasContext: ctx, viewport }).promise;
  return canvas.toDataURL('image/webp', 0.95); // High quality
};

/**
 * Renders ALL pages of a PDF from a local ArrayBuffer in a single pass (efficient — loads PDF once).
 * Returns an array of WebP data URLs indexed by page (0-based).
 * @param onProgress Optional callback called after each page renders: (pageIndex, totalPages)
 */
export const renderAllPdfPagesFromArrayBuffer = async (
  buffer: ArrayBuffer,
  onProgress?: (pageIndex: number, total: number) => void
): Promise<string[]> => {
  // Use .slice() so the original buffer is NOT transferred to the worker
  const pdf = await pdfjsLib.getDocument({ data: new Uint8Array(buffer.slice()) }).promise;
  const numPages = pdf.numPages;
  const results: string[] = [];

  for (let i = 1; i <= numPages; i++) {
    const page = await pdf.getPage(i);
    const viewport = page.getViewport({ scale: 2.0 }); // Sharp quality for technical drawings
    const canvas = document.createElement('canvas');
    const ctx = canvas.getContext('2d');
    if (!ctx) { results.push(''); onProgress?.(i - 1, numPages); continue; }
    canvas.width = viewport.width;
    canvas.height = viewport.height;
    await page.render({ canvasContext: ctx, viewport }).promise;
    results.push(canvas.toDataURL('image/webp', 0.88));
    onProgress?.(i - 1, numPages);
  }

  return results;
};

/**
 * Gets page count from a local ArrayBuffer (no network/CORS issues).
 */
export const getPdfPageCountFromArrayBuffer = async (buffer: ArrayBuffer): Promise<number> => {
  // Use .slice() to avoid "detached ArrayBuffer" error
  const pdf = await pdfjsLib.getDocument({ data: new Uint8Array(buffer.slice()) }).promise;
  return pdf.numPages;
};

/**
 * Parses a PDF file and returns an array of compressed WebP base64 strings (one for each page).
 * DEPRECATED: Causes massive RAM/Storage issues for large PDFs. Use renderPdfPageToImage instead.
 */
export const parsePdfToImages = async (file: File | Blob): Promise<string[]> => {
  try {
    const arrayBuffer = await file.arrayBuffer();
    const pdf = await pdfjsLib.getDocument({ data: new Uint8Array(arrayBuffer) }).promise;
    const numPages = pdf.numPages;
    const images: string[] = [];

    for (let i = 1; i <= numPages; i++) {
      const page = await pdf.getPage(i);
      const viewport = page.getViewport({ scale: 2.0 }); // Scale 2.0 for high resolution
      
      const canvas = document.createElement('canvas');
      const ctx = canvas.getContext('2d');
      if (!ctx) continue;

      canvas.width = viewport.width;
      canvas.height = viewport.height;

      const renderContext = {
        canvasContext: ctx,
        viewport: viewport,
      };

      await page.render(renderContext).promise;

      // Compress to WebP
      const dataUrl = canvas.toDataURL('image/webp', 0.8);
      images.push(dataUrl);
    }

    return images;
  } catch (error) {
    console.error('Error parsing PDF:', error);
    throw error;
  }
};
