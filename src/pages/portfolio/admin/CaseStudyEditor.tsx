import { useState } from 'react';
import { ImageUploadField } from './ImageUploadField';
import { uploadImageToStorage } from '../../../services/supabase';
import type { CaseStudyData } from '../sections/CaseStudyModal';

interface Props {
  value: CaseStudyData | null;
  onChange: (next: CaseStudyData | null) => void;
  defaultTitle: string;
  defaultStyle: string;
}

function emptyCaseStudy(title: string, style: string): CaseStudyData {
  return {
    id: '',
    title,
    location: '',
    area: '',
    style: style || '',
    coverImage: null,
    introText: '',
    floorPlan: { text: '', sitePhoto: null, blueprint: null },
    design3D: { text: '', images: [] },
    tailoring: { text: '', steps: [] },
    structural: { text: '', imgMain: null },
    material: { text: '', samples: [] },
    fixedInterior: { text: '', extraText: '', imgMain: null },
    looseFurniture: { text: '', imgMain: null },
    details: { items: [] },
    finalize: { text: '', images: [] },
  };
}

const input = 'w-full border border-[#2C2920]/15 rounded px-3 py-2 text-sm';
const label = 'block text-[10px] uppercase tracking-wide text-[#8A8070] font-semibold mb-1';

function ImageList({ images, onChange }: { images: string[]; onChange: (next: string[]) => void }) {
  const [uploading, setUploading] = useState(false);

  const addFile = async (file: File | undefined) => {
    if (!file) return;
    setUploading(true);
    try {
      const url = await uploadImageToStorage(file);
      onChange([...images, url]);
    } catch {
      // bỏ qua, thử lại
    } finally {
      setUploading(false);
    }
  };

  return (
    <div>
      <div className="flex flex-wrap gap-2 mb-2">
        {images.map((img, i) => (
          <div key={i} className="relative">
            <img src={img} alt="" className="w-16 h-16 object-cover rounded border border-[#2C2920]/10" />
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
      <input type="file" accept="image/*" onChange={e => addFile(e.target.files?.[0])} className="text-[11px]" />
      {uploading && <p className="text-[11px] text-[#8A8070] mt-1">Đang tải...</p>}
    </div>
  );
}

function Accordion({ title, defaultOpen, children }: { title: string; defaultOpen?: boolean; children: React.ReactNode }) {
  const [open, setOpen] = useState(!!defaultOpen);
  return (
    <div className="border border-[#2C2920]/10 rounded-lg overflow-hidden">
      <button
        type="button"
        onClick={() => setOpen(v => !v)}
        className="w-full flex items-center justify-between px-4 py-3 bg-[#FAF8F4] text-left cursor-pointer"
      >
        <span className="font-serif text-sm">{title}</span>
        <span className="text-xs">{open ? '−' : '+'}</span>
      </button>
      {open && <div className="p-4 space-y-4 bg-white">{children}</div>}
    </div>
  );
}

export function CaseStudyEditor({ value, onChange, defaultTitle, defaultStyle }: Props) {
  const enabled = !!value;

  const toggle = (checked: boolean) => {
    onChange(checked ? emptyCaseStudy(defaultTitle, defaultStyle) : null);
  };

  if (!enabled) {
    return (
      <div className="sm:col-span-2">
        <label className="flex items-center gap-2 text-xs font-semibold text-[#2C2920] cursor-pointer">
          <input type="checkbox" checked={false} onChange={e => toggle(e.target.checked)} className="w-4 h-4" />
          Bật "Xem Album Kể Chuyện (Case Study)" cho công trình này
        </label>
      </div>
    );
  }

  const v = value!;
  const set = <K extends keyof CaseStudyData>(key: K, val: CaseStudyData[K]) => onChange({ ...v, [key]: val });
  const setNested = <K extends keyof CaseStudyData>(key: K, patch: Partial<CaseStudyData[K]>) =>
    onChange({ ...v, [key]: { ...(v[key] as object), ...patch } } as CaseStudyData);

  return (
    <div className="sm:col-span-2 space-y-4">
      <label className="flex items-center gap-2 text-xs font-semibold text-[#2C2920] cursor-pointer">
        <input type="checkbox" checked={true} onChange={e => toggle(e.target.checked)} className="w-4 h-4" />
        Album Kể Chuyện (Case Study) — tắt sẽ xoá toàn bộ nội dung bên dưới
      </label>

      <Accordion title="Thông tin chung" defaultOpen>
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
          <div>
            <label className={label}>Khu vực (location)</label>
            <input className={input} value={v.location} onChange={e => set('location', e.target.value)} placeholder="VD: Quận 2, TP.HCM" />
          </div>
          <div>
            <label className={label}>Diện tích (area)</label>
            <input className={input} value={v.area} onChange={e => set('area', e.target.value)} placeholder="VD: 90m²" />
          </div>
          <div>
            <label className={label}>Phong cách</label>
            <input className={input} value={v.style} onChange={e => set('style', e.target.value)} />
          </div>
        </div>
        <ImageUploadField label="Ảnh bìa đầu album" value={v.coverImage} onChange={url => set('coverImage', url)} />
        <div>
          <label className={label}>Câu giới thiệu ngắn (hiện ngay dưới ảnh bìa)</label>
          <textarea className={input} rows={2} value={v.introText} onChange={e => set('introText', e.target.value)} />
        </div>
      </Accordion>

      <Accordion title="Phase 01 — Ý tưởng & Mặt bằng">
        <div>
          <label className={label}>Câu chuyện mặt bằng (vấn đề & cách giải quyết)</label>
          <textarea className={input} rows={3} value={v.floorPlan.text} onChange={e => setNested('floorPlan', { text: e.target.value })} />
        </div>
        <div className="grid grid-cols-2 gap-4">
          <ImageUploadField label="Ảnh bản vẽ ý tưởng" value={v.floorPlan.blueprint} onChange={url => setNested('floorPlan', { blueprint: url })} compact />
          <ImageUploadField label="Ảnh hiện trạng" value={v.floorPlan.sitePhoto} onChange={url => setNested('floorPlan', { sitePhoto: url })} compact />
        </div>
        <div>
          <label className={label}>Câu chuyện phối cảnh 3D</label>
          <textarea className={input} rows={2} value={v.design3D.text} onChange={e => setNested('design3D', { text: e.target.value })} />
        </div>
        <div>
          <label className={label}>Ảnh phối cảnh 3D (nhiều ảnh)</label>
          <ImageList images={v.design3D.images} onChange={images => setNested('design3D', { images })} />
        </div>
      </Accordion>

      <Accordion title="Phase 02 — Tinh chỉnh & Vật liệu">
        <div>
          <label className={label}>Câu chuyện tinh chỉnh</label>
          <textarea className={input} rows={2} value={v.tailoring.text} onChange={e => setNested('tailoring', { text: e.target.value })} />
        </div>
        <div>
          <label className={label}>Các bước tinh chỉnh (tiêu đề + mô tả)</label>
          <div className="space-y-2">
            {v.tailoring.steps.map((st, i) => (
              <div key={i} className="flex gap-2 items-start">
                <input
                  className={`${input} flex-1`}
                  placeholder="Tiêu đề"
                  value={st.title}
                  onChange={e => {
                    const steps = [...v.tailoring.steps];
                    steps[i] = { ...steps[i], title: e.target.value };
                    setNested('tailoring', { steps });
                  }}
                />
                <input
                  className={`${input} flex-1`}
                  placeholder="Mô tả"
                  value={st.desc}
                  onChange={e => {
                    const steps = [...v.tailoring.steps];
                    steps[i] = { ...steps[i], desc: e.target.value };
                    setNested('tailoring', { steps });
                  }}
                />
                <button
                  type="button"
                  onClick={() => setNested('tailoring', { steps: v.tailoring.steps.filter((_, idx) => idx !== i) })}
                  className="text-rose-600 text-xs cursor-pointer shrink-0 mt-2"
                >
                  Xoá
                </button>
              </div>
            ))}
            <button
              type="button"
              onClick={() => setNested('tailoring', { steps: [...v.tailoring.steps, { title: '', desc: '' }] })}
              className="text-xs text-[#B8913A] font-bold cursor-pointer"
            >
              + Thêm bước
            </button>
          </div>
        </div>
        <div>
          <label className={label}>Câu chuyện lựa chọn vật liệu</label>
          <textarea className={input} rows={2} value={v.material.text} onChange={e => setNested('material', { text: e.target.value })} />
        </div>
        <div>
          <label className={label}>Mẫu vật liệu (tên + mô tả + ảnh)</label>
          <div className="space-y-3">
            {v.material.samples.map((s, i) => (
              <div key={i} className="flex gap-2 items-start bg-[#FAF8F4] p-2 rounded">
                <div className="flex-1 space-y-1.5">
                  <input
                    className={input}
                    placeholder="Tên vật liệu"
                    value={s.name}
                    onChange={e => {
                      const samples = [...v.material.samples];
                      samples[i] = { ...samples[i], name: e.target.value };
                      setNested('material', { samples });
                    }}
                  />
                  <input
                    className={input}
                    placeholder="Mô tả"
                    value={s.desc}
                    onChange={e => {
                      const samples = [...v.material.samples];
                      samples[i] = { ...samples[i], desc: e.target.value };
                      setNested('material', { samples });
                    }}
                  />
                </div>
                <ImageUploadField
                  label="Ảnh mẫu"
                  value={s.img}
                  onChange={url => {
                    const samples = [...v.material.samples];
                    samples[i] = { ...samples[i], img: url };
                    setNested('material', { samples });
                  }}
                  compact
                />
                <button
                  type="button"
                  onClick={() => setNested('material', { samples: v.material.samples.filter((_, idx) => idx !== i) })}
                  className="text-rose-600 text-xs cursor-pointer shrink-0"
                >
                  Xoá
                </button>
              </div>
            ))}
            <button
              type="button"
              onClick={() => setNested('material', { samples: [...v.material.samples, { name: '', desc: '', img: null }] })}
              className="text-xs text-[#B8913A] font-bold cursor-pointer"
            >
              + Thêm mẫu vật liệu
            </button>
          </div>
        </div>
      </Accordion>

      <Accordion title="Phase 03 — Thi công phần thô">
        <div>
          <label className={label}>Câu chuyện thi công phần thô</label>
          <textarea className={input} rows={3} value={v.structural.text} onChange={e => setNested('structural', { text: e.target.value })} />
        </div>
        <ImageUploadField label="Ảnh thi công phần thô" value={v.structural.imgMain} onChange={url => setNested('structural', { imgMain: url })} />
      </Accordion>

      <Accordion title="Phase 04 — Lắp ráp nội thất">
        <div>
          <label className={label}>Câu chuyện nội thất cố định</label>
          <textarea className={input} rows={2} value={v.fixedInterior.text} onChange={e => setNested('fixedInterior', { text: e.target.value })} />
        </div>
        <div>
          <label className={label}>Đoạn mở rộng (tuỳ chọn)</label>
          <textarea className={input} rows={2} value={v.fixedInterior.extraText || ''} onChange={e => setNested('fixedInterior', { extraText: e.target.value })} />
        </div>
        <ImageUploadField label="Ảnh nội thất cố định" value={v.fixedInterior.imgMain} onChange={url => setNested('fixedInterior', { imgMain: url })} compact />
        <div>
          <label className={label}>Câu chuyện nội thất rời</label>
          <textarea className={input} rows={2} value={v.looseFurniture.text} onChange={e => setNested('looseFurniture', { text: e.target.value })} />
        </div>
        <ImageUploadField label="Ảnh nội thất rời" value={v.looseFurniture.imgMain} onChange={url => setNested('looseFurniture', { imgMain: url })} compact />
        <div>
          <label className={label}>Danh sách mộc nội thất rời đã phối hợp</label>
          <div className="space-y-2">
            {v.details.items.map((it, i) => (
              <div key={i} className="flex gap-2 items-center">
                <input
                  type="number"
                  className="w-16 border border-[#2C2920]/15 rounded px-2 py-2 text-sm"
                  value={it.num}
                  onChange={e => {
                    const items = [...v.details.items];
                    items[i] = { ...items[i], num: Number(e.target.value) };
                    setNested('details', { items });
                  }}
                />
                <input
                  className={`${input} flex-1`}
                  placeholder="Tên hạng mục"
                  value={it.name}
                  onChange={e => {
                    const items = [...v.details.items];
                    items[i] = { ...items[i], name: e.target.value };
                    setNested('details', { items });
                  }}
                />
                <button
                  type="button"
                  onClick={() => setNested('details', { items: v.details.items.filter((_, idx) => idx !== i) })}
                  className="text-rose-600 text-xs cursor-pointer shrink-0"
                >
                  Xoá
                </button>
              </div>
            ))}
            <button
              type="button"
              onClick={() => setNested('details', { items: [...v.details.items, { num: v.details.items.length + 1, name: '' }] })}
              className="text-xs text-[#B8913A] font-bold cursor-pointer"
            >
              + Thêm hạng mục
            </button>
          </div>
        </div>
      </Accordion>

      <Accordion title="Phase 05 — Bàn giao thực tế">
        <div>
          <label className={label}>Câu chuyện bàn giao</label>
          <textarea className={input} rows={3} value={v.finalize.text} onChange={e => setNested('finalize', { text: e.target.value })} />
        </div>
        <div>
          <label className={label}>Ảnh bàn giao (nhiều ảnh)</label>
          <ImageList images={v.finalize.images} onChange={images => setNested('finalize', { images })} />
        </div>
      </Accordion>
    </div>
  );
}
