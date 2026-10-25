import { useEffect, useState } from 'react';
import { useOutletContext } from 'react-router-dom';
import { supabase } from '../../../services/supabase';
import { ImageUploadField } from './ImageUploadField';

type Seg = 'can-ho' | 'nha-pho-du-an' | 'nha-pho' | 'villa';
const SEGS: { seg: Seg; label: string }[] = [
  { seg: 'can-ho', label: 'Căn hộ' },
  { seg: 'nha-pho-du-an', label: 'Nhà phố dự án' },
  { seg: 'nha-pho', label: 'Nhà phố' },
  { seg: 'villa', label: 'Villa / nhà vườn' },
];
const FACT_KEYS = ['Mô hình', 'Phân khúc', 'Chuẩn dịch vụ'];

interface SegForm {
  title: string;
  subtitle: string;
  hero_image: string | null;
  hero_video: string;
  facts: Record<string, string>;
  og_image: string | null;
}

const EMPTY: SegForm = { title: '', subtitle: '', hero_image: null, hero_video: '', facts: {}, og_image: null };

const input = 'w-full border border-gray-300 rounded px-3 py-2.5 text-sm';
const label = 'block text-[10px] uppercase tracking-wide text-gray-500 font-semibold mb-1';

function SegmentPanel({ pageId, seg, segLabel }: { pageId: string; seg: Seg; segLabel: string }) {
  const [form, setForm] = useState<SegForm>(EMPTY);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);
  const [open, setOpen] = useState(false);

  useEffect(() => {
    supabase
      .from('landing_segments')
      .select('*')
      .eq('page_id', pageId)
      .eq('seg', seg)
      .maybeSingle()
      .then(({ data }) => {
        if (data) {
          setForm({
            title: data.title || '',
            subtitle: data.subtitle || '',
            hero_image: data.hero_image,
            hero_video: data.hero_video || '',
            facts: data.facts || {},
            og_image: data.og_image,
          });
        }
        setLoading(false);
      });
  }, [pageId, seg]);

  const set = <K extends keyof SegForm>(key: K, val: SegForm[K]) => setForm(prev => ({ ...prev, [key]: val }));

  const save = async () => {
    setSaving(true);
    setSaved(false);
    await supabase.from('landing_segments').upsert(
      { page_id: pageId, seg, ...form, hero_video: form.hero_video || null },
      { onConflict: 'page_id,seg' }
    );
    setSaving(false);
    setSaved(true);
  };

  return (
    <div className="bg-white border border-gray-200 rounded-xl p-5">
      <button onClick={() => setOpen(v => !v)} className="w-full flex items-center justify-between cursor-pointer">
        <span className="font-serif text-lg">{segLabel}</span>
        <span>{open ? '−' : '+'}</span>
      </button>
      {open &&
        (loading ? (
          <p className="text-xs text-gray-400 mt-3">Đang tải...</p>
        ) : (
          <div className="mt-4 space-y-4">
            <div>
              <label className={label}>Tiêu đề (bọc *từ nhấn* để hiện nghiêng vàng)</label>
              <input className={input} value={form.title} onChange={e => set('title', e.target.value)} placeholder="VD: Villa *Quiet Luxury*, sang mà không phô" />
            </div>
            <div>
              <label className={label}>Dòng phụ</label>
              <input className={input} value={form.subtitle} onChange={e => set('subtitle', e.target.value)} />
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <ImageUploadField label="Ảnh nền (poster)" value={form.hero_image} onChange={v => set('hero_image', v)} />
              <div>
                <label className={label}>Link video nền (mp4, 8-12s, tuỳ chọn)</label>
                <input className={input} value={form.hero_video} onChange={e => set('hero_video', e.target.value)} />
              </div>
            </div>
            <div>
              <p className={label}>3 thông tin nhanh</p>
              <div className="grid grid-cols-3 gap-2">
                {FACT_KEYS.map(k => (
                  <div key={k}>
                    <span className="text-[10px] text-gray-400">{k}</span>
                    <input
                      className={input}
                      value={form.facts[k] || ''}
                      onChange={e => set('facts', { ...form.facts, [k]: e.target.value })}
                    />
                  </div>
                ))}
              </div>
            </div>
            <ImageUploadField label="Ảnh og:image (chia sẻ Facebook/Zalo)" value={form.og_image} onChange={v => set('og_image', v)} />
            <button
              onClick={save}
              disabled={saving}
              className="bg-gray-900 hover:bg-indigo-600 text-white text-xs uppercase tracking-wide font-bold px-5 py-2.5 rounded-lg cursor-pointer disabled:opacity-50"
            >
              {saving ? 'Đang lưu...' : 'Lưu'}
            </button>
            {saved && <span className="ml-3 text-xs text-emerald-600">Đã lưu.</span>}
          </div>
        ))}
    </div>
  );
}

export function AdminSegments() {
  const { pageId } = useOutletContext<{ pageId: string }>();
  return (
    <div className="max-w-2xl space-y-3">
      {SEGS.map(s => (
        <SegmentPanel key={s.seg} pageId={pageId} seg={s.seg} segLabel={s.label} />
      ))}
    </div>
  );
}
