import { useEffect, useState } from 'react';
import { useOutletContext } from 'react-router-dom';
import { landingSupabase } from '../sections/landingSupabase';
import { ImageUploadField } from './ImageUploadField';

type GroupKey = 'design' | 'construction' | 'workshop';

interface TeamRow {
  id: string;
  group_key: GroupKey;
  name: string;
  role: string | null;
  experience: string | null;
  avatar_url: string | null;
  bio: string | null;
  highlights: string[] | null;
  sort_order: number;
}

const GROUP_OPTS: { value: GroupKey; label: string }[] = [
  { value: 'design', label: 'Team Thiết Kế' },
  { value: 'construction', label: 'Team Thi Công' },
  { value: 'workshop', label: 'Xưởng Sản Xuất' },
];

const EMPTY: Omit<TeamRow, 'id'> = {
  group_key: 'design', name: '', role: '', experience: '', avatar_url: null, bio: '', highlights: [], sort_order: 0,
};

const input = 'w-full border border-[#2C2920]/15 rounded px-3 py-2 text-sm';
const label = 'block text-[10px] uppercase tracking-wide text-[#8A8070] font-semibold mb-1';

function TeamForm({ value, onChange }: { value: Omit<TeamRow, 'id'>; onChange: (v: Omit<TeamRow, 'id'>) => void }) {
  const set = <K extends keyof typeof value>(key: K, val: (typeof value)[K]) => onChange({ ...value, [key]: val });
  const highlights = value.highlights || [];

  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
      <div>
        <label className={label}>Nhóm</label>
        <select className={input} value={value.group_key} onChange={e => set('group_key', e.target.value as GroupKey)}>
          {GROUP_OPTS.map(o => (
            <option key={o.value} value={o.value}>{o.label}</option>
          ))}
        </select>
      </div>
      <div>
        <label className={label}>Thứ tự</label>
        <input type="number" className={input} value={value.sort_order} onChange={e => set('sort_order', Number(e.target.value))} />
      </div>
      <div>
        <label className={label}>Tên</label>
        <input className={input} value={value.name} onChange={e => set('name', e.target.value)} />
      </div>
      <div>
        <label className={label}>Vai trò</label>
        <input className={input} value={value.role || ''} onChange={e => set('role', e.target.value)} />
      </div>
      <div className="sm:col-span-2">
        <ImageUploadField label="Ảnh đại diện" value={value.avatar_url} onChange={url => set('avatar_url', url)} compact />
      </div>
      <div className="sm:col-span-2">
        <label className={label}>Lịch sử kinh nghiệm (hiện ngắn gọn ở thẻ)</label>
        <textarea className={input} rows={2} value={value.experience || ''} onChange={e => set('experience', e.target.value)} />
      </div>
      <div className="sm:col-span-2">
        <label className={label}>Giới thiệu đầy đủ (hiện trong hồ sơ/CV khi bấm vào)</label>
        <textarea className={input} rows={4} value={value.bio || ''} onChange={e => set('bio', e.target.value)} />
      </div>
      <div className="sm:col-span-2">
        <label className={label}>Điểm nổi bật (chứng chỉ, dự án tiêu biểu... mỗi dòng 1 ý)</label>
        <div className="space-y-2">
          {highlights.map((h, i) => (
            <div key={i} className="flex gap-2">
              <input
                className={`${input} flex-1`}
                value={h}
                onChange={e => {
                  const next = [...highlights];
                  next[i] = e.target.value;
                  set('highlights', next);
                }}
              />
              <button type="button" onClick={() => set('highlights', highlights.filter((_, idx) => idx !== i))} className="text-rose-600 text-xs cursor-pointer shrink-0">
                Xoá
              </button>
            </div>
          ))}
          <button type="button" onClick={() => set('highlights', [...highlights, ''])} className="text-xs text-[#B8913A] font-bold cursor-pointer">
            + Thêm điểm nổi bật
          </button>
        </div>
      </div>
    </div>
  );
}

export function AdminTeam() {
  const { canWrite } = useOutletContext<{ canWrite: boolean }>();
  const [rows, setRows] = useState<TeamRow[] | null>(null);
  const [editingId, setEditingId] = useState<string | 'new' | null>(null);
  const [draft, setDraft] = useState<Omit<TeamRow, 'id'>>(EMPTY);
  const [error, setError] = useState('');

  const load = () => {
    landingSupabase.from('landing_team_members').select('*').order('group_key').order('sort_order').then(({ data }) => setRows((data as TeamRow[]) || []));
  };
  useEffect(() => { load(); }, []);

  const startEdit = (row?: TeamRow) => {
    setError('');
    if (row) { setEditingId(row.id); setDraft({ ...row, highlights: row.highlights || [] }); }
    else { setEditingId('new'); setDraft(EMPTY); }
  };

  const save = async () => {
    setError('');
    if (!draft.name.trim()) { setError('Nhập tên.'); return; }
    const payload = { ...draft, highlights: (draft.highlights || []).filter(h => h.trim()) };
    if (editingId === 'new') {
      const { error: err } = await landingSupabase.from('landing_team_members').insert([payload]);
      if (err) { setError(err.message); return; }
    } else if (editingId) {
      const { error: err } = await landingSupabase.from('landing_team_members').update(payload).eq('id', editingId);
      if (err) { setError(err.message); return; }
    }
    setEditingId(null);
    load();
  };

  const remove = async (id: string) => {
    if (!confirm('Xoá nhân sự này?')) return;
    await landingSupabase.from('landing_team_members').delete().eq('id', id);
    load();
  };

  return (
    <div>
      <h1 className="font-serif text-2xl mb-1">Đội ngũ nhân sự</h1>
      <p className="text-xs text-[#8A8070] mb-6">Mỗi người có ảnh đại diện + hồ sơ/CV riêng (bấm vào tên trên landing page để xem).</p>

      {!rows ? (
        <p className="text-xs text-[#8A8070]">Đang tải...</p>
      ) : (
        <div className="space-y-2 mb-6">
          {rows.map(row => (
            <div key={row.id} className="flex items-center justify-between bg-white border border-[#2C2920]/10 rounded-lg px-4 py-3">
              <div className="flex items-center gap-3">
                {row.avatar_url && <img src={row.avatar_url} alt="" className="w-8 h-8 rounded-full object-cover" />}
                <div>
                  <span className="text-sm font-semibold">{row.name}</span>
                  <span className="text-xs text-[#8A8070] ml-2">({GROUP_OPTS.find(g => g.value === row.group_key)?.label})</span>
                </div>
              </div>
              {canWrite && (
                <div className="flex gap-2">
                  <button onClick={() => startEdit(row)} className="text-xs text-[#B8913A] font-bold cursor-pointer">Sửa</button>
                  <button onClick={() => remove(row.id)} className="text-xs text-rose-600 font-bold cursor-pointer">Xoá</button>
                </div>
              )}
            </div>
          ))}
          {rows.length === 0 && <p className="text-xs text-[#8A8070]">Chưa có nhân sự nào.</p>}
        </div>
      )}

      {canWrite && editingId === null && (
        <button onClick={() => startEdit()} className="bg-[#1A1814] hover:bg-[#B8913A] text-white text-xs uppercase tracking-wide font-bold px-5 py-2.5 rounded-lg transition-colors cursor-pointer">
          + Thêm nhân sự
        </button>
      )}

      {canWrite && editingId !== null && (
        <div className="bg-white border border-[#2C2920]/10 rounded-xl p-6 max-w-2xl">
          <h3 className="font-serif text-lg mb-4">{editingId === 'new' ? 'Thêm nhân sự mới' : 'Sửa nhân sự'}</h3>
          <TeamForm value={draft} onChange={setDraft} />
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
