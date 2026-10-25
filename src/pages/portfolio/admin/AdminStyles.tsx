import { useEffect, useState } from 'react';
import { supabase } from '../../../services/supabase';
import { ImageUploadField } from './ImageUploadField';

interface StyleRow {
  id: string;
  name: string;
  card_image: string | null;
  moodboard_image: string | null;
  sort_order: number;
}

const EMPTY: Omit<StyleRow, 'id'> = { name: '', card_image: null, moodboard_image: null, sort_order: 0 };
const input = 'w-full border border-gray-300 rounded px-3 py-2.5 text-sm';
const label = 'block text-[10px] uppercase tracking-wide text-gray-500 font-semibold mb-1';

export function AdminStyles() {
  const [rows, setRows] = useState<StyleRow[] | null>(null);
  const [editingId, setEditingId] = useState<string | 'new' | null>(null);
  const [draft, setDraft] = useState<Omit<StyleRow, 'id'>>(EMPTY);

  const load = () => {
    supabase.from('estimator_styles').select('*').order('sort_order').then(({ data }) => setRows((data as StyleRow[]) || []));
  };
  useEffect(() => {
    load();
  }, []);

  const save = async () => {
    if (editingId === 'new') await supabase.from('estimator_styles').insert([draft]);
    else if (editingId) await supabase.from('estimator_styles').update(draft).eq('id', editingId);
    setEditingId(null);
    load();
  };

  const remove = async (id: string) => {
    if (!confirm('Xoá phong cách này?')) return;
    await supabase.from('estimator_styles').delete().eq('id', id);
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
              <span className="text-sm font-semibold">{row.name}</span>
              <div className="flex gap-3">
                <button
                  onClick={() => {
                    setEditingId(row.id);
                    setDraft(row);
                  }}
                  className="text-xs text-indigo-600 font-bold cursor-pointer"
                >
                  Sửa
                </button>
                <button onClick={() => remove(row.id)} className="text-xs text-rose-600 font-bold cursor-pointer">
                  Xoá
                </button>
              </div>
            </div>
          ))}
          {rows.length === 0 && <p className="text-xs text-gray-400">Chưa có phong cách nào.</p>}
        </div>
      )}

      {editingId === null && (
        <button
          onClick={() => {
            setEditingId('new');
            setDraft(EMPTY);
          }}
          className="bg-gray-900 hover:bg-indigo-600 text-white text-xs uppercase tracking-wide font-bold px-5 py-2.5 rounded-lg cursor-pointer"
        >
          + Thêm phong cách
        </button>
      )}

      {editingId !== null && (
        <div className="bg-white border border-gray-200 rounded-xl p-6 max-w-lg space-y-4">
          <div>
            <label className={label}>Tên phong cách</label>
            <input className={input} value={draft.name} onChange={e => setDraft({ ...draft, name: e.target.value })} />
          </div>
          <div className="grid grid-cols-2 gap-4">
            <ImageUploadField label="Ảnh thẻ chọn" value={draft.card_image} onChange={v => setDraft({ ...draft, card_image: v })} />
            <ImageUploadField label="Ảnh moodboard (kết quả)" value={draft.moodboard_image} onChange={v => setDraft({ ...draft, moodboard_image: v })} />
          </div>
          <div>
            <label className={label}>Thứ tự</label>
            <input type="number" className={input} value={draft.sort_order} onChange={e => setDraft({ ...draft, sort_order: Number(e.target.value) })} />
          </div>
          <div className="flex gap-2">
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
