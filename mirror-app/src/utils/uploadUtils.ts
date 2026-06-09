import * as tus from 'tus-js-client';
import { getSupabaseCredentials } from '../lib/supabaseClient';

export const uploadFileWithTus = (bucketName: string, fileName: string, file: File | Blob, onProgress?: (progress: string) => void): Promise<void> => {
  return new Promise((resolve, reject) => {
    const creds = getSupabaseCredentials();
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
