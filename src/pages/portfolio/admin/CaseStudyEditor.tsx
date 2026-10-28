import { useState } from 'react';
import { ImageUploadField } from './ImageUploadField';
import { uploadLandingImage } from './uploadLandingImage';
import type { RawCaseStudy } from '../sections/CaseStudyModal';

interface Props {
  value: RawCaseStudy | null;
  onChange: (next: RawCaseStudy | null) => void;
  defaultTitle: string;
  defaultStyle: string;
}

// Form này chỉnh sửa đúng "vùng" cố định của RawCaseStudy (floorPlan/design3D/
// tailoring/...) — khai báo lại với các field con bắt buộc (không optional)
// để code trong form khỏi phải ?. mọi nơi. emptyCaseStudy() luôn trả đủ field
// nên cast này an toàn ở mọi điểm vào/ra của form.
interface EditableCaseStudy {
  id: string; title: string; location: string; area: string; style: string;
  coverImage: string | null; introText: string;
  palette: { hex: string; name: string }[];
  floorPlan: { text: string; sitePhotos: string[]; blueprint: string | null; planBeforeImage: string | null; link: string; fear: string; story: string };
  design3D: { text: string; images: string[] };
  tailoring: { text: string; steps: { title: string; desc: string }[]; link: string; fear: string; story: string };
  structural: { text: string; images: string[]; link: string; fear: string; story: string };
  material: { text: string; samples: { name: string; desc: string; img: string | null }[] };
  fixedInterior: { text: string; extraText: string; images: string[]; link: string; fear: string; story: string };
  looseFurniture: { text: string; images: string[] };
  details: { items: { num: number; name: string }[] };
  finalize: { text: string; images: string[]; videoUrl: string; link: string; compareRenderImage: string | null; compareRealImage: string | null; fear: string; story: string };
  hiddenPhases: PhaseKey[];
  magazineMode: boolean;
  magazineImages: { src: string; alt?: string }[];
}

// Khoá giai đoạn khớp PHASE_ORDER/PHASE_META bên CaseStudyModal.tsx — đổi ở
// đây thì phải đổi đồng bộ bên đó.
type PhaseKey = 'concept' | 'material' | 'rough' | 'assembly' | 'handover';

function emptyCaseStudy(title: string, style: string): EditableCaseStudy {
  return {
    id: '',
    title,
    location: '',
    area: '',
    style: style || '',
    coverImage: null,
    introText: '',
    palette: [],
    floorPlan: { text: '', sitePhotos: [], blueprint: null, planBeforeImage: null, link: '', fear: '', story: '' },
    design3D: { text: '', images: [] },
    tailoring: { text: '', steps: [], link: '', fear: '', story: '' },
    structural: { text: '', images: [], link: '', fear: '', story: '' },
    material: { text: '', samples: [] },
    fixedInterior: { text: '', extraText: '', images: [], link: '', fear: '', story: '' },
    looseFurniture: { text: '', images: [] },
    details: { items: [] },
    finalize: { text: '', images: [], videoUrl: '', link: '', compareRenderImage: null, compareRealImage: null, fear: '', story: '' },
    hiddenPhases: [],
    magazineMode: false,
    magazineImages: [],
  };
}

const input = 'w-full border border-[#2C2920]/15 rounded px-3 py-2 text-sm';
const label = 'block text-[10px] uppercase tracking-wide text-[#8A8070] font-semibold mb-1';

// Upload nhiều ảnh cùng lúc (chọn nhiều file trong 1 lần), mỗi ảnh có nút tải
// về + xoá + di chuyển trái/phải để sắp lại thứ tự hiển thị trên landing page.
function ImageList({ images, onChange }: { images: string[]; onChange: (next: string[]) => void }) {
  const [progress, setProgress] = useState<{ done: number; total: number } | null>(null);
  const [error, setError] = useState('');

  const addFiles = async (files: FileList | null) => {
    if (!files || files.length === 0) return;
    setError('');
    const list = Array.from(files);
    setProgress({ done: 0, total: list.length });
    const uploaded: string[] = [];
    for (const file of list) {
      try {
        uploaded.push(await uploadLandingImage(file));
      } catch {
        setError(`Tải ảnh thất bại: ${file.name}`);
      }
      setProgress(p => (p ? { ...p, done: p.done + 1 } : p));
    }
    onChange([...images, ...uploaded]);
    setProgress(null);
  };

  const move = (i: number, dir: -1 | 1) => {
    const j = i + dir;
    if (j < 0 || j >= images.length) return;
    const next = [...images];
    [next[i], next[j]] = [next[j], next[i]];
    onChange(next);
  };

  return (
    <div>
      <div className="flex flex-wrap gap-2 mb-2">
        {images.map((img, i) => (
          <div key={img + i} className="relative group">
            <img src={img} alt="" className="w-16 h-16 object-cover rounded border border-[#2C2920]/10" />
            <button
              type="button"
              onClick={() => onChange(images.filter((_, idx) => idx !== i))}
              className="absolute -top-1.5 -right-1.5 w-4 h-4 rounded-full bg-rose-600 text-white text-[10px] leading-4 cursor-pointer"
              title="Xoá ảnh"
            >
              ✕
            </button>
            <a
              href={img}
              download
              target="_blank"
              rel="noreferrer"
              className="absolute bottom-0.5 right-0.5 w-4 h-4 rounded-full bg-[#1A1814]/80 text-white text-[9px] leading-4 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity"
              title="Tải ảnh về"
            >
              ⬇
            </a>
            <div className="absolute top-0.5 left-0.5 flex gap-0.5 opacity-0 group-hover:opacity-100 transition-opacity">
              <button type="button" disabled={i === 0} onClick={() => move(i, -1)} className="w-4 h-4 rounded-full bg-white/90 text-[#1A1814] text-[9px] leading-4 disabled:opacity-30 cursor-pointer" title="Chuyển trái">‹</button>
              <button type="button" disabled={i === images.length - 1} onClick={() => move(i, 1)} className="w-4 h-4 rounded-full bg-white/90 text-[#1A1814] text-[9px] leading-4 disabled:opacity-30 cursor-pointer" title="Chuyển phải">›</button>
            </div>
          </div>
        ))}
      </div>
      <input type="file" accept="image/*" multiple onChange={e => addFiles(e.target.files)} className="text-[11px]" />
      {progress && <p className="text-[11px] text-[#8A8070] mt-1">Đang tải {progress.done}/{progress.total}...</p>}
      {error && <p className="text-[11px] text-rose-600 mt-1">{error}</p>}
    </div>
  );
}

// "Nỗi lo gia chủ" + "câu chuyện đầy đủ" — 2 field chạm trực tiếp vào mục
// tiêu chuyển đổi khách hàng: fear phải đúng nỗi băn khoăn thật của khách
// ở giai đoạn này (không có thì dùng câu mặc định chung), story là bài kể
// dài hơn mở qua nút "[+] Đọc câu chuyện đầy đủ" — nơi thuyết phục sâu.
function FearStoryFields({ fear, story, onFearChange, onStoryChange }: { fear: string; story: string; onFearChange: (v: string) => void; onStoryChange: (v: string) => void }) {
  return (
    <div className="pt-3 border-t border-dashed border-[#2C2920]/15 space-y-3">
      <div>
        <label className={label}>Nỗi lo của gia chủ ở giai đoạn này (để trống = dùng câu mặc định chung)</label>
        <textarea className={input} rows={2} placeholder="VD: Gia chủ lo không gian bị lạnh lẽo, trống trải nếu quá tối giản..." value={fear} onChange={e => onFearChange(e.target.value)} />
      </div>
      <div>
        <label className={label}>Câu chuyện đầy đủ (mở qua nút "[+] Đọc câu chuyện đầy đủ" — nơi thuyết phục sâu, để trống thì ẩn nút)</label>
        <textarea className={input} rows={4} value={story} onChange={e => onStoryChange(e.target.value)} />
      </div>
    </div>
  );
}

// Checkbox tắt 1 giai đoạn khỏi "Nhật ký thi công" trên trang — dùng khi giai
// đoạn có nội dung nhưng admin thấy không đáng kể, tránh dàn trải quá nhiều
// giai đoạn mỏng. Khác với việc ẩn tự động khi giai đoạn hoàn toàn trống.
function HidePhaseToggle({ checked, onChange }: { checked: boolean; onChange: (v: boolean) => void }) {
  return (
    <label className="flex items-center gap-2 text-xs font-semibold text-[#8A5A3A] cursor-pointer bg-[#FDF3EA] border border-[#8A5A3A]/20 rounded px-3 py-2">
      <input type="checkbox" checked={checked} onChange={e => onChange(e.target.checked)} className="w-4 h-4" />
      Ẩn giai đoạn này trên trang (không hiện trong Nhật ký thi công)
    </label>
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

  // Dữ liệu thật trong DB có thể thiếu field mới hơn bản ghi (vd case_study cũ
  // chưa từng có "palette", hoặc thiếu fear/story) — ép kiểu thẳng không đủ,
  // phải điền đè lên nền emptyCaseStudy() để mọi field con luôn tồn tại trước
  // khi .map()/.length ở form bên dưới, tránh crash "Cannot read … of undefined".
  const base = emptyCaseStudy(defaultTitle, defaultStyle);
  const raw = value as Record<string, unknown>;
  // obj(): gộp đè lên nền mặc định, nhưng key nào trong raw là null/undefined
  // (field con bị thiếu hẳn HOẶC DB lưu null tường minh) thì vẫn giữ nguyên
  // giá trị mặc định (mảng rỗng/chuỗi rỗng) thay vì ghi đè thành null.
  const obj = <T extends object>(def: T, part: unknown): T => {
    const p = (part || {}) as Partial<T>;
    const out = { ...def };
    (Object.keys(def) as (keyof T)[]).forEach(k => { if (p[k] != null) out[k] = p[k] as T[typeof k]; });
    return out;
  };
  const v: EditableCaseStudy = {
    ...base,
    ...raw,
    palette: (raw.palette as EditableCaseStudy['palette']) || base.palette,
    floorPlan: obj(base.floorPlan, raw.floorPlan),
    design3D: obj(base.design3D, raw.design3D),
    tailoring: obj(base.tailoring, raw.tailoring),
    structural: obj(base.structural, raw.structural),
    material: obj(base.material, raw.material),
    fixedInterior: obj(base.fixedInterior, raw.fixedInterior),
    looseFurniture: obj(base.looseFurniture, raw.looseFurniture),
    details: obj(base.details, raw.details),
    finalize: obj(base.finalize, raw.finalize),
    hiddenPhases: Array.isArray(raw.hiddenPhases) ? (raw.hiddenPhases as PhaseKey[]) : base.hiddenPhases,
    magazineMode: typeof raw.magazineMode === 'boolean' ? raw.magazineMode : base.magazineMode,
    magazineImages: Array.isArray(raw.magazineImages) ? (raw.magazineImages as string[]) : base.magazineImages,
  };
  const set = <K extends keyof EditableCaseStudy>(key: K, val: EditableCaseStudy[K]) => onChange({ ...v, [key]: val });
  const setNested = <K extends keyof EditableCaseStudy>(key: K, patch: Partial<EditableCaseStudy[K]>) =>
    onChange({ ...v, [key]: { ...(v[key] as object), ...patch } } as EditableCaseStudy);
  const togglePhaseHidden = (phase: PhaseKey, hide: boolean) =>
    set('hiddenPhases', hide ? [...v.hiddenPhases, phase] : v.hiddenPhases.filter(k => k !== phase));

  return (
    <div className="sm:col-span-2 space-y-4">
      <label className="flex items-center gap-2 text-xs font-semibold text-[#2C2920] cursor-pointer">
        <input type="checkbox" checked={true} onChange={e => toggle(e.target.checked)} className="w-4 h-4" />
        Album Kể Chuyện (Case Study) — tắt sẽ xoá toàn bộ nội dung bên dưới
      </label>

      <div className="bg-[#FDF3EA] border border-[#8A5A3A]/20 rounded-lg p-4 space-y-3">
        <label className="flex items-center gap-2 text-xs font-semibold text-[#8A5A3A] cursor-pointer">
          <input type="checkbox" checked={v.magazineMode} onChange={e => set('magazineMode', e.target.checked)} className="w-4 h-4" />
          Chế độ Tạp chí — công trình chỉ có ảnh phối cảnh (chưa thi công/chưa có ảnh thực tế)
        </label>
        <p className="text-[11px] text-[#8A5A3A]/80">Bật thì bỏ hẳn khung "Nhật ký thi công" nhiều giai đoạn (Phase 01-05) bên dưới, chỉ hiện đúng thứ tự ảnh dưới đây — dùng khi ảnh đã có caption in sẵn (vd bộ ảnh đăng Facebook).</p>
        {v.magazineMode && (
          <div>
            <label className={label}>Ảnh tạp chí (nhiều ảnh, đúng thứ tự hiển thị — chọn nhiều file 1 lần hoặc kéo trái/phải để sắp lại)</label>
            <ImageList images={v.magazineImages} onChange={magazineImages => set('magazineImages', magazineImages)} />
          </div>
        )}
      </div>

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
        <HidePhaseToggle checked={v.hiddenPhases.includes('concept')} onChange={hide => togglePhaseHidden('concept', hide)} />
        <div>
          <label className={label}>Câu chuyện mặt bằng (vấn đề & cách giải quyết)</label>
          <textarea className={input} rows={3} value={v.floorPlan.text} onChange={e => setNested('floorPlan', { text: e.target.value })} />
        </div>
        <ImageUploadField label="Ảnh bản vẽ ý tưởng / Phương án bố trí (hiện bên cạnh ảnh hiện trạng bên dưới)" value={v.floorPlan.blueprint} onChange={url => setNested('floorPlan', { blueprint: url })} compact />
        <ImageUploadField label="Ảnh mặt bằng Hiện trạng (trước) — ghép cặp trước/sau với ảnh ở trên" value={v.floorPlan.planBeforeImage} onChange={url => setNested('floorPlan', { planBeforeImage: url })} compact />
        <div>
          <label className={label}>Ảnh hiện trạng thực tế (nhiều ảnh, khác với ảnh mặt bằng trước ở trên)</label>
          <ImageList images={v.floorPlan.sitePhotos} onChange={sitePhotos => setNested('floorPlan', { sitePhotos })} />
        </div>
        <div>
          <label className={label}>Câu chuyện phối cảnh 3D</label>
          <textarea className={input} rows={2} value={v.design3D.text} onChange={e => setNested('design3D', { text: e.target.value })} />
        </div>
        <div>
          <label className={label}>Ảnh phối cảnh 3D (nhiều ảnh)</label>
          <ImageList images={v.design3D.images} onChange={images => setNested('design3D', { images })} />
        </div>
        <div>
          <label className={label}>Link tham khảo (tuỳ chọn — bài viết, bản vẽ đầy đủ...)</label>
          <input className={input} placeholder="https://..." value={v.floorPlan.link || ''} onChange={e => setNested('floorPlan', { link: e.target.value })} />
        </div>
        <FearStoryFields
          fear={v.floorPlan.fear} story={v.floorPlan.story}
          onFearChange={fear => setNested('floorPlan', { fear })}
          onStoryChange={story => setNested('floorPlan', { story })}
        />
      </Accordion>

      <Accordion title="Phase 02 — Tinh chỉnh & Vật liệu">
        <HidePhaseToggle checked={v.hiddenPhases.includes('material')} onChange={hide => togglePhaseHidden('material', hide)} />
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
        <div>
          <label className={label}>Link tham khảo (tuỳ chọn)</label>
          <input className={input} placeholder="https://..." value={v.tailoring.link || ''} onChange={e => setNested('tailoring', { link: e.target.value })} />
        </div>
        <FearStoryFields
          fear={v.tailoring.fear} story={v.tailoring.story}
          onFearChange={fear => setNested('tailoring', { fear })}
          onStoryChange={story => setNested('tailoring', { story })}
        />
      </Accordion>

      <Accordion title="Phase 03 — Thi công phần thô">
        <HidePhaseToggle checked={v.hiddenPhases.includes('rough')} onChange={hide => togglePhaseHidden('rough', hide)} />
        <div>
          <label className={label}>Câu chuyện thi công phần thô</label>
          <textarea className={input} rows={3} value={v.structural.text} onChange={e => setNested('structural', { text: e.target.value })} />
        </div>
        <div>
          <label className={label}>Ảnh thi công phần thô (nhiều ảnh)</label>
          <ImageList images={v.structural.images} onChange={images => setNested('structural', { images })} />
        </div>
        <div>
          <label className={label}>Link tham khảo (tuỳ chọn)</label>
          <input className={input} placeholder="https://..." value={v.structural.link || ''} onChange={e => setNested('structural', { link: e.target.value })} />
        </div>
        <FearStoryFields
          fear={v.structural.fear} story={v.structural.story}
          onFearChange={fear => setNested('structural', { fear })}
          onStoryChange={story => setNested('structural', { story })}
        />
      </Accordion>

      <Accordion title="Phase 04 — Lắp ráp nội thất">
        <HidePhaseToggle checked={v.hiddenPhases.includes('assembly')} onChange={hide => togglePhaseHidden('assembly', hide)} />
        <div>
          <label className={label}>Câu chuyện nội thất cố định</label>
          <textarea className={input} rows={2} value={v.fixedInterior.text} onChange={e => setNested('fixedInterior', { text: e.target.value })} />
        </div>
        <div>
          <label className={label}>Đoạn mở rộng (tuỳ chọn)</label>
          <textarea className={input} rows={2} value={v.fixedInterior.extraText || ''} onChange={e => setNested('fixedInterior', { extraText: e.target.value })} />
        </div>
        <div>
          <label className={label}>Ảnh nội thất cố định (nhiều ảnh)</label>
          <ImageList images={v.fixedInterior.images} onChange={images => setNested('fixedInterior', { images })} />
        </div>
        <div>
          <label className={label}>Câu chuyện nội thất rời</label>
          <textarea className={input} rows={2} value={v.looseFurniture.text} onChange={e => setNested('looseFurniture', { text: e.target.value })} />
        </div>
        <div>
          <label className={label}>Ảnh nội thất rời (nhiều ảnh)</label>
          <ImageList images={v.looseFurniture.images} onChange={images => setNested('looseFurniture', { images })} />
        </div>
        <div>
          <label className={label}>Link tham khảo (tuỳ chọn)</label>
          <input className={input} placeholder="https://..." value={v.fixedInterior.link || ''} onChange={e => setNested('fixedInterior', { link: e.target.value })} />
        </div>
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
        <FearStoryFields
          fear={v.fixedInterior.fear} story={v.fixedInterior.story}
          onFearChange={fear => setNested('fixedInterior', { fear })}
          onStoryChange={story => setNested('fixedInterior', { story })}
        />
      </Accordion>

      <Accordion title="Phase 05 — Bàn giao thực tế">
        <HidePhaseToggle checked={v.hiddenPhases.includes('handover')} onChange={hide => togglePhaseHidden('handover', hide)} />
        <div>
          <label className={label}>Câu chuyện bàn giao</label>
          <textarea className={input} rows={3} value={v.finalize.text} onChange={e => setNested('finalize', { text: e.target.value })} />
        </div>
        <div>
          <label className={label}>Ảnh bàn giao (nhiều ảnh)</label>
          <ImageList images={v.finalize.images} onChange={images => setNested('finalize', { images })} />
        </div>
        <div>
          <label className={label}>Link video bàn giao (Youtube/Drive/Vimeo...)</label>
          <input className={input} placeholder="https://youtube.com/..." value={v.finalize.videoUrl || ''} onChange={e => setNested('finalize', { videoUrl: e.target.value })} />
        </div>
        <div>
          <label className={label}>Link tham khảo khác (tuỳ chọn)</label>
          <input className={input} placeholder="https://..." value={v.finalize.link || ''} onChange={e => setNested('finalize', { link: e.target.value })} />
        </div>
        <div className="pt-3 border-t border-dashed border-[#2C2920]/15 space-y-3">
          <p className="text-xs font-bold text-[#2C2920]">Thanh kéo so sánh Phối cảnh ↔ Thực tế (tuỳ chọn — chỉ hiện khi đủ cả 2 ảnh, nên dùng ảnh CÙNG góc chụp)</p>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <ImageUploadField label="Ảnh phối cảnh thiết kế (render)" value={v.finalize.compareRenderImage} onChange={url => setNested('finalize', { compareRenderImage: url })} compact />
            <ImageUploadField label="Ảnh thực tế bàn giao (cùng góc)" value={v.finalize.compareRealImage} onChange={url => setNested('finalize', { compareRealImage: url })} compact />
          </div>
        </div>
        <FearStoryFields
          fear={v.finalize.fear} story={v.finalize.story}
          onFearChange={fear => setNested('finalize', { fear })}
          onStoryChange={story => setNested('finalize', { story })}
        />
      </Accordion>

      <Accordion title="Bảng màu vật liệu (tuỳ chọn — hiện ở Phase 02)">
        <div className="space-y-2">
          {v.palette.map((c, i) => (
            <div key={i} className="flex gap-2 items-center">
              <input type="color" value={c.hex} onChange={e => set('palette', v.palette.map((p, idx) => (idx === i ? { ...p, hex: e.target.value } : p)))} className="w-10 h-9 border border-[#2C2920]/15 rounded cursor-pointer" />
              <input className={`${input} flex-1`} placeholder="Tên màu, vd: Gỗ óc chó" value={c.name} onChange={e => set('palette', v.palette.map((p, idx) => (idx === i ? { ...p, name: e.target.value } : p)))} />
              <button type="button" onClick={() => set('palette', v.palette.filter((_, idx) => idx !== i))} className="text-rose-600 text-xs cursor-pointer shrink-0">Xoá</button>
            </div>
          ))}
          <button type="button" onClick={() => set('palette', [...v.palette, { hex: '#B08A4A', name: '' }])} className="text-xs text-[#B8913A] font-bold cursor-pointer">
            + Thêm màu
          </button>
        </div>
      </Accordion>
    </div>
  );
}
