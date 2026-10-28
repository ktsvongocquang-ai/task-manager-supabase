import { useEffect, useState } from 'react';
import { useOutletContext } from 'react-router-dom';
import { landingSupabase } from '../sections/landingSupabase';
import { ImageUploadField } from './ImageUploadField';
import { CaseStudyEditor } from './CaseStudyEditor';
import type { RawCaseStudy } from '../sections/CaseStudyModal';

interface ProjectRow {
  id: string;
  category: string;
  title: string;
  style: string | null;
  info: string | null;
  project_type: string | null;
  construction_time: string | null;
  image_url: string | null;
  case_study: RawCaseStudy | null;
  sort_order: number;
  is_published: boolean;
}

const EMPTY: Omit<ProjectRow, 'id'> = {
  category: 'house_villa', title: '', style: '', info: '', project_type: '', construction_time: '', image_url: '', case_study: null, sort_order: 0, is_published: true,
};

function ProjectForm({ value, onChange, canWrite }: { value: Omit<ProjectRow, 'id'>; onChange: (v: Omit<ProjectRow, 'id'>) => void; canWrite: boolean }) {
  const set = <K extends keyof typeof value>(key: K, val: (typeof value)[K]) => onChange({ ...value, [key]: val });

  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
      <div>
        <label className="block text-[10px] uppercase tracking-wide text-[#8A8070] font-semibold mb-1">Loại công trình</label>
        <select value={value.category} onChange={e => set('category', e.target.value)} disabled={!canWrite} className="w-full border border-[#2C2920]/15 rounded px-3 py-2 text-sm">
          <option value="apartment">Chung cư</option>
          <option value="house_villa">Nhà phố / Villa</option>
        </select>
      </div>
      <div>
        <label className="block text-[10px] uppercase tracking-wide text-[#8A8070] font-semibold mb-1">Hiển thị công khai</label>
        <select value={value.is_published ? '1' : '0'} onChange={e => set('is_published', e.target.value === '1')} disabled={!canWrite} className="w-full border border-[#2C2920]/15 rounded px-3 py-2 text-sm">
          <option value="1">Có</option>
          <option value="0">Không (ẩn)</option>
        </select>
      </div>
      <div className="sm:col-span-2">
        <label className="block text-[10px] uppercase tracking-wide text-[#8A8070] font-semibold mb-1">Tên dự án *</label>
        <input value={value.title} onChange={e => set('title', e.target.value)} disabled={!canWrite} className="w-full border border-[#2C2920]/15 rounded px-3 py-2 text-sm" />
      </div>
      <div>
        <label className="block text-[10px] uppercase tracking-wide text-[#8A8070] font-semibold mb-1">Style thiết kế</label>
        <input value={value.style || ''} onChange={e => set('style', e.target.value)} disabled={!canWrite} className="w-full border border-[#2C2920]/15 rounded px-3 py-2 text-sm" />
      </div>
      <div>
        <label className="block text-[10px] uppercase tracking-wide text-[#8A8070] font-semibold mb-1">Loại công trình chi tiết</label>
        <input value={value.project_type || ''} onChange={e => set('project_type', e.target.value)} disabled={!canWrite} className="w-full border border-[#2C2920]/15 rounded px-3 py-2 text-sm" />
      </div>
      <div className="sm:col-span-2">
        <label className="block text-[10px] uppercase tracking-wide text-[#8A8070] font-semibold mb-1">Thông tin (diện tích / vị trí)</label>
        <input value={value.info || ''} onChange={e => set('info', e.target.value)} disabled={!canWrite} className="w-full border border-[#2C2920]/15 rounded px-3 py-2 text-sm" />
      </div>
      <div>
        <label className="block text-[10px] uppercase tracking-wide text-[#8A8070] font-semibold mb-1">Thời gian thi công</label>
        <input value={value.construction_time || ''} onChange={e => set('construction_time', e.target.value)} disabled={!canWrite} className="w-full border border-[#2C2920]/15 rounded px-3 py-2 text-sm" />
      </div>
      <div>
        <label className="block text-[10px] uppercase tracking-wide text-[#8A8070] font-semibold mb-1">Thứ tự hiển thị</label>
        <input type="number" value={value.sort_order} onChange={e => set('sort_order', Number(e.target.value))} disabled={!canWrite} className="w-full border border-[#2C2920]/15 rounded px-3 py-2 text-sm" />
      </div>
      <div className="sm:col-span-2">
        <ImageUploadField label="Ảnh bìa (thẻ công trình)" value={value.image_url} onChange={url => set('image_url', url || '')} />
      </div>
      <CaseStudyEditor
        value={value.case_study}
        onChange={cs => set('case_study', cs)}
        defaultTitle={value.title}
        defaultStyle={value.style || ''}
      />
    </div>
  );
}

export function AdminProjects() {
  const { canWrite } = useOutletContext<{ canWrite: boolean }>();
  const [rows, setRows] = useState<ProjectRow[] | null>(null);
  const [editingId, setEditingId] = useState<string | 'new' | null>(null);
  const [draft, setDraft] = useState<Omit<ProjectRow, 'id'>>(EMPTY);
  const [error, setError] = useState('');

  const load = () => {
    landingSupabase.from('landing_featured_projects').select('*').order('sort_order').then(({ data }) => setRows((data as ProjectRow[]) || []));
  };
  useEffect(() => { load(); }, []);

  const startEdit = (row?: ProjectRow) => {
    setError('');
    if (row) { setEditingId(row.id); setDraft({ ...row, case_study: row.case_study || null }); }
    else { setEditingId('new'); setDraft(EMPTY); }
  };

  const save = async () => {
    setError('');
    if (!draft.title.trim()) { setError('Nhập tên dự án.'); return; }
    if (editingId === 'new') {
      const { error: err } = await landingSupabase.from('landing_featured_projects').insert([draft]);
      if (err) { setError(err.message); return; }
    } else if (editingId) {
      const { error: err } = await landingSupabase.from('landing_featured_projects').update(draft).eq('id', editingId);
      if (err) { setError(err.message); return; }
    }
    setEditingId(null);
    load();
  };

  const remove = async (id: string) => {
    if (!confirm('Xoá dự án này?')) return;
    await landingSupabase.from('landing_featured_projects').delete().eq('id', id);
    load();
  };

  return (
    <div>
      <h1 className="font-serif text-2xl mb-1">Công trình tiêu biểu</h1>
      <p className="text-xs text-[#8A8070] mb-6">Mỗi dự án hiện trên landing page theo loại công trình (Chung cư / Nhà phố-Villa).</p>

      {!rows ? (
        <p className="text-xs text-[#8A8070]">Đang tải...</p>
      ) : (
        <div className="space-y-2 mb-6">
          {rows.map(row => (
            <div key={row.id} className="flex items-center justify-between bg-white border border-[#2C2920]/10 rounded-lg px-4 py-3">
              <div>
                <span className="text-sm font-semibold">{row.title}</span>
                <span className="text-xs text-[#8A8070] ml-2">({row.category === 'apartment' ? 'Chung cư' : 'Nhà phố/Villa'}{!row.is_published ? ' · đang ẩn' : ''})</span>
              </div>
              {canWrite && (
                <div className="flex gap-2">
                  <button onClick={() => startEdit(row)} className="text-xs text-[#B8913A] font-bold cursor-pointer">Sửa</button>
                  <button onClick={() => remove(row.id)} className="text-xs text-rose-600 font-bold cursor-pointer">Xoá</button>
                </div>
              )}
            </div>
          ))}
          {rows.length === 0 && <p className="text-xs text-[#8A8070]">Chưa có công trình nào.</p>}
        </div>
      )}

      {canWrite && editingId === null && (
        <button onClick={() => startEdit()} className="bg-[#1A1814] hover:bg-[#B8913A] text-white text-xs uppercase tracking-wide font-bold px-5 py-2.5 rounded-lg transition-colors cursor-pointer">
          + Thêm công trình
        </button>
      )}

      {canWrite && editingId !== null && (
        <div className="bg-white border border-[#2C2920]/10 rounded-xl p-6 max-w-2xl">
          <h3 className="font-serif text-lg mb-4">{editingId === 'new' ? 'Thêm công trình mới' : 'Sửa công trình'}</h3>
          <ProjectForm value={draft} onChange={setDraft} canWrite={canWrite} />
          {error && <p className="text-xs text-rose-600 mt-3">{error}</p>}
          <div className="flex gap-2 mt-5">
            <button onClick={save} className="bg-[#1A1814] hover:bg-[#B8913A] text-white text-xs uppercase tracking-wide font-bold px-5 py-2.5 rounded-lg transition-colors cursor-pointer">Lưu</button>
            <button onClick={() => setEditingId(null)} className="text-xs text-[#8A8070] font-bold px-5 py-2.5 cursor-pointer">Huỷ</button>
          </div>
        </div>
      )}
    </div>
  );
}
