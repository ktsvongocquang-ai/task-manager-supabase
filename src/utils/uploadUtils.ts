import * as tus from 'tus-js-client';
import { supabase } from '../services/supabase';

export const uploadFileWithTus = (bucketName: string, fileName: string, file: File | Blob, onProgress?: (progress: string) => void): Promise<void> => {
  return new Promise((resolve, reject) => {
    const creds = {
      url: (supabase as any).supabaseUrl,
      anonKey: (supabase as any).supabaseKey,
    };
    if (!creds.url || !creds.anonKey) {
      return reject(new Error('Missing Supabase credentials'));
    }

    const upload = new tus.Upload(file, {
      endpoint: `${creds.url}/storage/v1/upload/resumable`,
      retryDelays: [0, 3000, 5000, 10000, 20000],
      headers: {
        authorization: `Bearer ${creds.anonKey}`,
        apikey: creds.anonKey,
        'x-upsert': 'true',
      },
      uploadDataDuringCreation: true,
      removeFingerprintOnSuccess: true,
      metadata: {
        bucketName: bucketName,
        objectName: fileName,
        contentType: file.type || 'application/octet-stream',
        cacheControl: '3600',
      },
      chunkSize: 6 * 1024 * 1024, // 6MB chunks
      onError: function (error) {
        reject(error);
      },
      onProgress: function (bytesUploaded, bytesTotal) {
        const percentage = ((bytesUploaded / bytesTotal) * 100).toFixed(1);
        if (onProgress) onProgress(`${percentage}%`);
      },
      onSuccess: function () {
        resolve();
      },
    });
    upload.start();
  });
};

export const uploadFile = async (file: File | Blob, bucketName: string, path: string): Promise<string | null> => {
    try {
        const { data, error } = await supabase.storage.from(bucketName).upload(path, file, {
            cacheControl: '3600',
            upsert: false
        });

        if (error) {
            console.error('Upload Error:', error);
            return null;
        }

        const { data: publicUrlData } = supabase.storage.from(bucketName).getPublicUrl(path);
        return publicUrlData.publicUrl;
    } catch (err) {
        console.error('Upload Exception:', err);
        return null;
    }
};
