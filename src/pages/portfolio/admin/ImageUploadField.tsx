import { useState } from 'react';
import { uploadLpImage } from '../lp/lib/uploadImage';

interface Props {
  label: string;
  value: string | null;
  onChange: (url: string | null) => void;
}

export function ImageUploadField({ label, value, onChange }: Props) {
  const [uploading, setUploading] = useState(false);
  const [error, setError] = useState('');

  const handleFile = async (file: File | undefined) => {
    if (!file) return;
    setError('');
    setUploading(true);
    try {
      const url = await uploadLpImage(file);
      onChange(url);
    } catch {
      setError('Tải ảnh thất bại, thử lại.');
    } finally {
      setUploading(false);
    }
  };

  return (
    <div>
      <label className="block text-[10px] uppercase tracking-wide text-gray-500 font-semibold mb-1">{label}</label>
      {value && <img src={value} alt="" className="w-24 h-24 object-cover rounded mb-2 border border-gray-200" />}
      <input type="file" accept="image/*" onChange={e => handleFile(e.target.files?.[0])} className="text-xs" />
      {uploading && <p className="text-xs text-gray-400 mt-1">Đang tải lên & nén WebP...</p>}
      {error && <p className="text-xs text-rose-600 mt-1">{error}</p>}
      {value && (
        <button type="button" onClick={() => onChange(null)} className="block text-xs text-rose-600 mt-1 cursor-pointer">
          Xoá ảnh
        </button>
      )}
    </div>
  );
}
