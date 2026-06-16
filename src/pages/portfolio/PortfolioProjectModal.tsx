import React, { useState, useEffect } from 'react';
import { supabase } from '../../services/supabase';
import { uploadFile } from '../../utils/uploadUtils';
import { X, Upload, Plus, Trash2, GripVertical, Image as ImageIcon } from 'lucide-react';

interface PortfolioProjectModalProps {
  isOpen: boolean;
  onClose: () => void;
  project: any | null;
  onSaved: () => void;
}

export function PortfolioProjectModal({ isOpen, onClose, project, onSaved }: PortfolioProjectModalProps) {
  const [loading, setLoading] = useState(false);
  const [form, setForm] = useState<any>({
    title: '',
    subtitle: '',
    location: '',
    area: '',
    style: '',
    studio: 'by DQH Architects',
    completion_date: '',
    intro_text: '',
    cover_image: '',
    is_published: true,
    content: {
      palette: [],
      floorPlan: { text: '', sitePhoto: '', blueprint: '' },
      design3D: { text: '', images: [] },
      tailoring: { text: '', images: [], steps: [] },
      structural: { text: '', imgMain: '', imgDetail1: '', imgDetail2: '' },
      material: { text: '', samples: [] },
      fixedInterior: { text: '', extraText: '', imgMain: '', img1: '', img2: '', img3: '' },
      looseFurniture: { text: '', imgMain: '', img1: '', img2: '', img3: '' },
      details: { text: '', items: [] },
      finalize: { text: '', images: [] }
    }
  });

  useEffect(() => {
    if (project) {
      setForm({
        ...project,
        content: typeof project.content === 'string' ? JSON.parse(project.content) : (project.content || {})
      });
    } else {
      setForm({
        title: '', subtitle: '', location: '', area: '', style: '', studio: 'by DQH Architects',
        completion_date: '', intro_text: '', cover_image: '', is_published: true,
        content: {
          palette: [],
          floorPlan: { text: '', sitePhoto: '', blueprint: '' },
          design3D: { text: '', images: [] },
          tailoring: { text: '', images: [], steps: [] },
          structural: { text: '', imgMain: '', imgDetail1: '', imgDetail2: '' },
          material: { text: '', samples: [] },
          fixedInterior: { text: '', extraText: '', imgMain: '', img1: '', img2: '', img3: '' },
          looseFurniture: { text: '', imgMain: '', img1: '', img2: '', img3: '' },
          details: { text: '', items: [] },
          finalize: { text: '', images: [] }
        }
      });
    }
  }, [project, isOpen]);

  if (!isOpen) return null;

  const handleUpload = async (e: React.ChangeEvent<HTMLInputElement>, fieldName: string, pathObj?: string, pathKey?: string, isArray?: boolean) => {
    const file = e.target.files?.[0];
    if (!file) return;
    
    try {
      const publicUrl = await uploadFile(file, 'tasks', `portfolio/${Date.now()}_${file.name}`);
      if (publicUrl) {
        if (fieldName === 'cover_image') {
          setForm({ ...form, cover_image: publicUrl });
        } else if (pathObj && pathKey) {
          const newContent = { ...form.content };
          if (isArray) {
            newContent[pathObj][pathKey] = [...(newContent[pathObj][pathKey] || []), publicUrl];
          } else {
            newContent[pathObj][pathKey] = publicUrl;
          }
          setForm({ ...form, content: newContent });
        }
      }
    } catch (err) {
      console.error(err);
      alert('Lỗi upload ảnh');
    }
  };

  const saveProject = async () => {
    setLoading(true);
    try {
      const payload = {
        title: form.title,
        subtitle: form.subtitle,
        location: form.location,
        area: form.area,
        style: form.style,
        studio: form.studio,
        completion_date: form.completion_date,
        intro_text: form.intro_text,
        cover_image: form.cover_image,
        is_published: form.is_published,
        content: form.content
      };

      let error;
      if (project?.id) {
        const res = await supabase.from('portfolio_projects').update(payload).eq('id', project.id);
        error = res.error;
      } else {
        const res = await supabase.from('portfolio_projects').insert([payload]);
        error = res.error;
      }

      if (error) throw error;
      onSaved();
    } catch (err) {
      console.error(err);
      alert('Lỗi lưu dự án');
    } finally {
      setLoading(false);
    }
  };

  const handleTextChange = (e: any, section: string, key: string) => {
      setForm({
          ...form,
          content: {
              ...form.content,
              [section]: {
                  ...form.content[section],
                  [key]: e.target.value
              }
          }
      });
  };

  return (
    <div className="fixed inset-0 z-50 bg-black/50 flex items-center justify-center p-4">
      <div className="bg-white w-full max-w-4xl max-h-[90vh] rounded-2xl shadow-xl flex flex-col">
        <div className="flex justify-between items-center p-4 border-b border-gray-100">
          <h2 className="text-xl font-bold text-gray-800">{project ? 'Chỉnh sửa dự án' : 'Thêm dự án mới'}</h2>
          <button onClick={onClose} className="p-2 hover:bg-gray-100 rounded-lg"><X size={20}/></button>
        </div>

        <div className="flex-1 overflow-y-auto p-6 space-y-6">
          {/* Thông tin cơ bản */}
          <section className="space-y-4 bg-gray-50 p-4 rounded-xl">
            <h3 className="font-bold text-gray-700">1. Thông tin chung</h3>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-semibold mb-1">Tên dự án (Title)</label>
                <input type="text" value={form.title} onChange={e => setForm({...form, title: e.target.value})} className="w-full border rounded px-3 py-2 text-sm" />
              </div>
              <div>
                <label className="block text-xs font-semibold mb-1">Tiêu đề phụ (Subtitle)</label>
                <input type="text" value={form.subtitle} onChange={e => setForm({...form, subtitle: e.target.value})} className="w-full border rounded px-3 py-2 text-sm" />
              </div>
              <div>
                <label className="block text-xs font-semibold mb-1">Địa điểm (Location)</label>
                <input type="text" value={form.location} onChange={e => setForm({...form, location: e.target.value})} className="w-full border rounded px-3 py-2 text-sm" />
              </div>
              <div>
                <label className="block text-xs font-semibold mb-1">Diện tích (Area)</label>
                <input type="text" value={form.area} onChange={e => setForm({...form, area: e.target.value})} className="w-full border rounded px-3 py-2 text-sm" />
              </div>
              <div>
                <label className="block text-xs font-semibold mb-1">Phong cách (Style)</label>
                <input type="text" value={form.style} onChange={e => setForm({...form, style: e.target.value})} className="w-full border rounded px-3 py-2 text-sm" />
              </div>
              <div>
                <label className="block text-xs font-semibold mb-1">Thời gian (Date)</label>
                <input type="text" value={form.completion_date} onChange={e => setForm({...form, completion_date: e.target.value})} className="w-full border rounded px-3 py-2 text-sm" />
              </div>
              <div className="col-span-2">
                <label className="block text-xs font-semibold mb-1">Đoạn mở đầu (Intro text)</label>
                <textarea value={form.intro_text} onChange={e => setForm({...form, intro_text: e.target.value})} className="w-full border rounded px-3 py-2 text-sm h-20" />
              </div>
              <div className="col-span-2">
                <label className="block text-xs font-semibold mb-1">Ảnh bìa (Cover Image)</label>
                <div className="flex items-center gap-4">
                  {form.cover_image && <img src={form.cover_image} alt="cover" className="h-16 w-32 object-cover rounded" />}
                  <input type="file" accept="image/*" onChange={e => handleUpload(e, 'cover_image')} className="text-sm" />
                </div>
              </div>
            </div>
            <label className="flex items-center gap-2 mt-2">
              <input type="checkbox" checked={form.is_published} onChange={e => setForm({...form, is_published: e.target.checked})} />
              <span className="text-sm font-semibold">Công khai (Hiển thị trên Landing Page)</span>
            </label>
          </section>

          {/* Chi tiết nội dung - JSON content */}
          <section className="space-y-4 bg-gray-50 p-4 rounded-xl">
            <h3 className="font-bold text-gray-700">2. Chi tiết mặt bằng (Floor Plan)</h3>
            <textarea value={form.content?.floorPlan?.text || ''} onChange={e => handleTextChange(e, 'floorPlan', 'text')} className="w-full border rounded px-3 py-2 text-sm h-16" placeholder="Mô tả mặt bằng..."/>
            <div className="grid grid-cols-2 gap-4">
                <div>
                    <label className="block text-xs font-semibold mb-1">Ảnh hiện trạng (Site Photo)</label>
                    <div className="flex flex-col gap-2">
                        {form.content?.floorPlan?.sitePhoto && <img src={form.content.floorPlan.sitePhoto} className="h-20 object-cover rounded" />}
                        <input type="file" accept="image/*" onChange={e => handleUpload(e, 'content', 'floorPlan', 'sitePhoto')} className="text-xs" />
                    </div>
                </div>
                <div>
                    <label className="block text-xs font-semibold mb-1">Bản vẽ (Blueprint)</label>
                    <div className="flex flex-col gap-2">
                        {form.content?.floorPlan?.blueprint && <img src={form.content.floorPlan.blueprint} className="h-20 object-cover rounded" />}
                        <input type="file" accept="image/*" onChange={e => handleUpload(e, 'content', 'floorPlan', 'blueprint')} className="text-xs" />
                    </div>
                </div>
            </div>
          </section>

          <section className="space-y-4 bg-gray-50 p-4 rounded-xl">
            <h3 className="font-bold text-gray-700">3. Thiết kế 3D (Design 3D)</h3>
            <textarea value={form.content?.design3D?.text || ''} onChange={e => handleTextChange(e, 'design3D', 'text')} className="w-full border rounded px-3 py-2 text-sm h-16" placeholder="Mô tả 3D..."/>
            <div>
                <label className="block text-xs font-semibold mb-1">Thêm ảnh 3D</label>
                <input type="file" accept="image/*" onChange={e => handleUpload(e, 'content', 'design3D', 'images', true)} className="text-xs" />
                <div className="flex gap-2 mt-2 flex-wrap">
                    {form.content?.design3D?.images?.map((img: string, i: number) => (
                        <div key={i} className="relative group">
                            <img src={img} className="h-20 w-20 object-cover rounded border" />
                            <button onClick={() => {
                                const newArr = [...form.content.design3D.images];
                                newArr.splice(i, 1);
                                setForm({...form, content: {...form.content, design3D: {...form.content.design3D, images: newArr}}});
                            }} className="absolute top-0 right-0 bg-red-500 text-white rounded-full p-1 opacity-0 group-hover:opacity-100 transition"><X size={12}/></button>
                        </div>
                    ))}
                </div>
            </div>
          </section>

          <section className="bg-orange-50 p-4 rounded-xl border border-orange-100">
              <p className="text-sm text-orange-800 font-medium">Lưu ý: Để giữ demo ngắn gọn, trong giao diện này chỉ hiển thị tạm vài mục. Dữ liệu các mục khác được lưu trong JSON.</p>
          </section>

        </div>

        <div className="p-4 border-t border-gray-100 flex justify-end gap-3 bg-white rounded-b-2xl">
          <button onClick={onClose} className="px-5 py-2 hover:bg-gray-100 rounded-xl font-medium">Hủy</button>
          <button onClick={saveProject} disabled={loading} className="px-6 py-2 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl font-bold shadow-sm transition disabled:opacity-50">
            {loading ? 'Đang lưu...' : 'Lưu Dự Án'}
          </button>
        </div>
      </div>
    </div>
  );
}
