import { useEffect, useState } from 'react';
import { supabase } from '../../../services/supabase';
import { ImageUploadField } from './ImageUploadField';
import { uploadLpImage } from '../lp/lib/uploadImage';

type Seg = 'can-ho' | 'nha-pho-du-an' | 'nha-pho' | 'villa';
const SEG_OPTIONS: { value: Seg; label: string }[] = [
  { value: 'can-ho', label: 'Căn hộ' },
  { value: 'nha-pho-du-an', label: 'Nhà phố dự án' },
  { value: 'nha-pho', label: 'Nhà phố' },
  { value: 'villa', label: 'Villa / nhà vườn' },
];

interface ProjectRow {
  id: string;
  segment: Seg;
  title: string;
  area_m2: number | null;
  location: string | null;
  style: string | null;
  duration_days: number | null;
  problem_solved: string | null;
  before_image: string | null;
  after_image: string | null;
  detail_images: string[] | null;
  is_featured: boolean;
  sort_order: number;
}

const EMPTY: Omit<ProjectRow, 'id'> = {
  segment: 'nha-pho',
  title: '',
  area_m2: null,
  location: '',
  style: '',
  duration_days: null,
  problem_solved: '',
  before_image: null,
  after_image: null,
  detail_images: [],
  is_featured: false,
  sort_order: 0,
};

const input = 'w-full border border-gray-300 rounded px-3 py-2.5 text-sm';
const label = 'block text-[10px] uppercase tracking-wide text-gray-500 font-semibold mb-1';

function DetailImages({ images, onChange }: { images: string[]; onChange: (next: string[]) => void }) {
  const [uploading, setUploading] = useState(false);

  const addFile = async (file: File | undefined) => {
    if (!file) return;
    setUploading(true);
    try {
      const url = await uploadLpImage(file);
      onChange([...images, url]);
    } catch {
      // bỏ qua, người dùng thử lại
    } finally {
      setUploading(false);
    }
  };

  return (
    <div>
      <label className={label}>Dải ảnh cận cảnh</label>
      <div className="flex flex-wrap gap-2 mb-2">
        {images.map((img, i) => (
          <div key={i} className="relative">
            <img src={img} alt="" className="w-16 h-16 object-cover rounded border border-gray-200" />
            <button
              type="button"
              onClick={() => onChange(images.filter((_, idx) => idx !== i))}
              className="absolute -top-1.5 -right-1.5 w-4 h-4 rounded-full bg-rose-600 text-white text-[10px] leading-4 cursor-pointer"
            >
              ✕
            </button>
          </div>
        ))}
      </div>
      <input type="file" accept="image/*" onChange={e => addFile(e.target.files?.[0])} className="text-xs" />
      {uploading && <p className="text-xs text-gray-400 mt-1">Đang tải...</p>}
    </div>
  );
}

function ProjectForm({ value, onChange }: { value: Omit<ProjectRow, 'id'>; onChange: (v: Omit<ProjectRow, 'id'>) => void }) {
  const set = <K extends keyof typeof value>(key: K, val: (typeof value)[K]) => onChange({ ...value, [key]: val });
  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
      <div>
        <label className={label}>Phân khúc</label>
        <select className={input} value={value.segment} onChange={e => set('segment', e.target.value as Seg)}>
          {SEG_OPTIONS.map(o => (
            <option key={o.value} value={o.value}>
              {o.label}
            </option>
          ))}
        </select>
      </div>
      <div className="flex items-end gap-2">
        <label className="flex items-center gap-2 text-xs font-semibold text-gray-600">
          <input type="checkbox" checked={value.is_featured} onChange={e => set('is_featured', e.target.checked)} className="w-4 h-4" />
          Nổi bật (hiện khi chưa chọn phân khúc)
        </label>
      </div>
      <div className="sm:col-span-2">
        <label className={label}>Tên công trình *</label>
        <input className={input} value={value.title} onChange={e => set('title', e.target.value)} />
      </div>
      <div>
        <label className={label}>Diện tích (m²)</label>
        <input type="number" className={input} value={value.area_m2 ?? ''} onChange={e => set('area_m2', e.target.value ? Number(e.target.value) : null)} />
      </div>
      <div>
        <label className={label}>Khu vực</label>
        <input className={input} value={value.location || ''} onChange={e => set('location', e.target.value)} />
      </div>
      <div>
        <label className={label}>Phong cách</label>
        <input className={input} value={value.style || ''} onChange={e => set('style', e.target.value)} />
      </div>
      <div>
        <label className={label}>Thời gian thi công (ngày)</label>
        <input type="number" className={input} value={value.duration_days ?? ''} onChange={e => set('duration_days', e.target.value ? Number(e.target.value) : null)} />
      </div>
      <div className="sm:col-span-2">
        <label className={label}>Vấn đề đã giải quyết (1 câu)</label>
        <textarea className={input} rows={2} value={value.problem_solved || ''} onChange={e => set('problem_solved', e.target.value)} />
      </div>
      <ImageUploadField label="Ảnh trước (before)" value={value.before_image} onChange={v => set('before_image', v)} />
      <ImageUploadField label="Ảnh sau (after)" value={value.after_image} onChange={v => set('after_image', v)} />
      <div className="sm:col-span-2">
        <DetailImages images={value.detail_images || []} onChange={v => set('detail_images', v)} />
      </div>
      <div>
        <label className={label}>Thứ tự hiển thị</label>
        <input type="number" className={input} value={value.sort_order} onChange={e => set('sort_order', Number(e.target.value))} />
      </div>
    </div>
  );
}

export function AdminProjectsLP() {
  const [rows, setRows] = useState<ProjectRow[] | null>(null);
  const [editingId, setEditingId] = useState<string | 'new' | null>(null);
  const [draft, setDraft] = useState<Omit<ProjectRow, 'id'>>(EMPTY);
  const [error, setError] = useState('');

  const load = () => {
    supabase.from('landing_projects').select('*').order('sort_order').then(({ data }) => setRows((data as ProjectRow[]) || []));
  };
  useEffect(() => {
    load();
  }, []);

  const startEdit = (row?: ProjectRow) => {
    setError('');
    if (row) {
      setEditingId(row.id);
      setDraft(row);
    } else {
      setEditingId('new');
      setDraft(EMPTY);
    }
  };

  const save = async () => {
    setError('');
    if (!draft.title.trim()) {
      setError('Nhập tên công trình.');
      return;
    }
    if (editingId === 'new') {
      const { error: err } = await supabase.from('landing_projects').insert([draft]);
      if (err) {
        setError(err.message);
        return;
      }
    } else if (editingId) {
      const { error: err } = await supabase.from('landing_projects').update(draft).eq('id', editingId);
      if (err) {
        setError(err.message);
        return;
      }
    }
    setEditingId(null);
    load();
  };

  const remove = async (id: string) => {
    if (!confirm('Xoá công trình này?')) return;
    await supabase.from('landing_projects').delete().eq('id', id);
    load();
  };

  return (
    <div>
      {!rows ? (
        <p className="text-xs text-gray-400">Đang tải...</p>
      ) : (
        <div className="space-y-2 mb-6">
          {rows.map(row => (
            <div key={row.id} className="flex items-center justify-between bg-white border border-gray-200 rounded-lg px-4 py-3">
              <div>
                <span className="text-sm font-semibold">{row.title}</span>
                <span className="text-xs text-gray-400 ml-2">
                  ({SEG_OPTIONS.find(s => s.value === row.segment)?.label}
                  {row.is_featured ? ' · nổi bật' : ''})
                </span>
              </div>
              <div className="flex gap-3">
                <button onClick={() => startEdit(row)} className="text-xs text-indigo-600 font-bold cursor-pointer">
                  Sửa
                </button>
                <button onClick={() => remove(row.id)} className="text-xs text-rose-600 font-bold cursor-pointer">
                  Xoá
                </button>
              </div>
            </div>
          ))}
          {rows.length === 0 && <p className="text-xs text-gray-400">Chưa có công trình nào.</p>}
        </div>
      )}

      {editingId === null && (
        <button
          onClick={() => startEdit()}
          className="bg-gray-900 hover:bg-indigo-600 text-white text-xs uppercase tracking-wide font-bold px-5 py-2.5 rounded-lg cursor-pointer"
        >
          + Thêm công trình
        </button>
      )}

      {editingId !== null && (
        <div className="bg-white border border-gray-200 rounded-xl p-6 max-w-2xl">
          <ProjectForm value={draft} onChange={setDraft} />
          {error && <p className="text-xs text-rose-600 mt-3">{error}</p>}
          <div className="flex gap-2 mt-5">
            <button onClick={save} className="bg-gray-900 hover:bg-indigo-600 text-white text-xs uppercase tracking-wide font-bold px-5 py-2.5 rounded-lg cursor-pointer">
              Lưu
            </button>
            <button onClick={() => setEditingId(null)} className="text-xs text-gray-500 font-bold px-5 py-2.5 cursor-pointer">
              Huỷ
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
