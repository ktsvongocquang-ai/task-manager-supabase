import { useState } from 'react';
import { uploadImageToStorage } from '../../../services/supabase';

interface Props {
  label: string;
  value: string | null | undefined;
  onChange: (url: string | null) => void;
  compact?: boolean;
}

export function ImageUploadField({ label, value, onChange, compact }: Props) {
  const [uploading, setUploading] = useState(false);
  const [error, setError] = useState('');

  const handleFile = async (file: File | undefined) => {
    if (!file) return;
    setError('');
    setUploading(true);
    try {
      const url = await uploadImageToStorage(file);
      onChange(url);
    } catch {
      setError('Tải ảnh thất bại, thử lại.');
    } finally {
      setUploading(false);
    }
  };

  return (
    <div>
      <label className="block text-[10px] uppercase tracking-wide text-[#8A8070] font-semibold mb-1">{label}</label>
      {value && (
        <img src={value} alt="" className={`${compact ? 'w-16 h-16' : 'w-24 h-24'} object-cover rounded mb-1.5 border border-[#2C2920]/10`} />
      )}
      <input type="file" accept="image/*" onChange={e => handleFile(e.target.files?.[0])} className="text-[11px] block" />
      {uploading && <p className="text-[11px] text-[#8A8070] mt-1">Đang tải lên...</p>}
      {error && <p className="text-[11px] text-rose-600 mt-1">{error}</p>}
      {value && (
        <button type="button" onClick={() => onChange(null)} className="block text-[11px] text-rose-600 mt-1 cursor-pointer">
          Xoá ảnh
        </button>
      )}
    </div>
  );
}
