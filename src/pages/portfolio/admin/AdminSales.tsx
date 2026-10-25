import { useEffect, useState } from 'react';
import { supabase } from '../../../services/supabase';

type Seg = 'can-ho' | 'nha-pho-du-an' | 'nha-pho' | 'villa';
const SEG_OPTIONS: { value: Seg; label: string }[] = [
  { value: 'can-ho', label: 'Căn hộ' },
  { value: 'nha-pho-du-an', label: 'Nhà phố dự án' },
  { value: 'nha-pho', label: 'Nhà phố' },
  { value: 'villa', label: 'Villa / nhà vườn' },
];

interface SaleRow {
  id: string;
  user_id: string | null;
  code: string;
  name: string;
  phone: string | null;
  zalo: string | null;
  telegram_chat_id: string | null;
  active: boolean;
}

interface ProfileOption {
  id: string;
  full_name: string;
}

const EMPTY: Omit<SaleRow, 'id'> = { user_id: null, code: '', name: '', phone: '', zalo: '', telegram_chat_id: '', active: true };
const input = 'w-full border border-gray-300 rounded px-3 py-2.5 text-sm';
const label = 'block text-[10px] uppercase tracking-wide text-gray-500 font-semibold mb-1';

function LinkGenerator({ sales }: { sales: SaleRow[] }) {
  const [seg, setSeg] = useState<Seg>('nha-pho');
  const [saleCode, setSaleCode] = useState('');
  const [nguon, setNguon] = useState('');
  const [copied, setCopied] = useState(false);

  const link = `${window.location.origin}/p/dqh?seg=${seg}${saleCode ? `&sale=${saleCode}` : ''}${nguon ? `&nguon=${encodeURIComponent(nguon)}` : ''}`;

  const copy = () => {
    navigator.clipboard.writeText(link).then(() => {
      setCopied(true);
      setTimeout(() => setCopied(false), 1500);
    });
  };

  return (
    <div className="bg-white border border-gray-200 rounded-xl p-5 mb-6 space-y-3">
      <h3 className="font-serif text-lg">Tạo link chia sẻ</h3>
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
        <div>
          <label className={label}>Phân khúc</label>
          <select className={input} value={seg} onChange={e => setSeg(e.target.value as Seg)}>
            {SEG_OPTIONS.map(o => (
              <option key={o.value} value={o.value}>
                {o.label}
              </option>
            ))}
          </select>
        </div>
        <div>
          <label className={label}>Sale</label>
          <select className={input} value={saleCode} onChange={e => setSaleCode(e.target.value)}>
            <option value="">— Không gắn sale —</option>
            {sales.map(s => (
              <option key={s.id} value={s.code}>
                {s.name} ({s.code})
              </option>
            ))}
          </select>
        </div>
        <div>
          <label className={label}>Nguồn (vd: fb-comment-01)</label>
          <input className={input} value={nguon} onChange={e => setNguon(e.target.value)} />
        </div>
      </div>
      <div className="flex items-center gap-2">
        <input readOnly value={link} className="flex-1 border border-gray-300 rounded px-3 py-2 text-xs bg-gray-50" />
        <button onClick={copy} className="bg-gray-900 hover:bg-indigo-600 text-white text-xs font-bold px-4 py-2 rounded-lg cursor-pointer whitespace-nowrap">
          {copied ? 'Đã copy!' : 'Copy link'}
        </button>
      </div>
    </div>
  );
}

export function AdminSales() {
  const [rows, setRows] = useState<SaleRow[] | null>(null);
  const [profiles, setProfiles] = useState<ProfileOption[]>([]);
  const [editingId, setEditingId] = useState<string | 'new' | null>(null);
  const [draft, setDraft] = useState<Omit<SaleRow, 'id'>>(EMPTY);

  const load = () => {
    supabase.from('sales_reps').select('*').then(({ data }) => setRows((data as SaleRow[]) || []));
  };
  useEffect(() => {
    load();
    supabase
      .from('profiles')
      .select('id,full_name')
      .then(({ data }) => setProfiles((data as ProfileOption[]) || []));
  }, []);

  const save = async () => {
    if (editingId === 'new') await supabase.from('sales_reps').insert([draft]);
    else if (editingId) await supabase.from('sales_reps').update(draft).eq('id', editingId);
    setEditingId(null);
    load();
  };

  const remove = async (id: string) => {
    if (!confirm('Xoá sale này?')) return;
    await supabase.from('sales_reps').delete().eq('id', id);
    load();
  };

  return (
    <div>
      <LinkGenerator sales={rows || []} />

      {!rows ? (
        <p className="text-xs text-gray-400">Đang tải...</p>
      ) : (
        <div className="space-y-2 mb-6">
          {rows.map(row => (
            <div key={row.id} className="flex items-center justify-between bg-white border border-gray-200 rounded-lg px-4 py-3">
              <div>
                <span className="text-sm font-semibold">{row.name}</span>
                <span className="text-xs text-gray-400 ml-2">
                  ({row.code}{!row.active ? ' · ngừng hoạt động' : ''})
                </span>
              </div>
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
          {rows.length === 0 && <p className="text-xs text-gray-400">Chưa có sale nào.</p>}
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
          + Thêm sale
        </button>
      )}

      {editingId !== null && (
        <div className="bg-white border border-gray-200 rounded-xl p-6 max-w-xl grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div>
            <label className={label}>Mã sale (code, duy nhất)</label>
            <input className={input} value={draft.code} onChange={e => setDraft({ ...draft, code: e.target.value })} />
          </div>
          <div>
            <label className={label}>Tên</label>
            <input className={input} value={draft.name} onChange={e => setDraft({ ...draft, name: e.target.value })} />
          </div>
          <div>
            <label className={label}>Số điện thoại</label>
            <input className={input} value={draft.phone || ''} onChange={e => setDraft({ ...draft, phone: e.target.value })} />
          </div>
          <div>
            <label className={label}>Zalo</label>
            <input className={input} value={draft.zalo || ''} onChange={e => setDraft({ ...draft, zalo: e.target.value })} />
          </div>
          <div>
            <label className={label}>Telegram chat id (nhận thông báo lead)</label>
            <input className={input} value={draft.telegram_chat_id || ''} onChange={e => setDraft({ ...draft, telegram_chat_id: e.target.value })} />
          </div>
          <div>
            <label className={label}>Tài khoản đăng nhập (để sale tự xem lead của mình)</label>
            <select className={input} value={draft.user_id || ''} onChange={e => setDraft({ ...draft, user_id: e.target.value || null })}>
              <option value="">— Chưa gắn —</option>
              {profiles.map(p => (
                <option key={p.id} value={p.id}>
                  {p.full_name}
                </option>
              ))}
            </select>
          </div>
          <label className="flex items-center gap-2 text-xs font-semibold text-gray-600">
            <input type="checkbox" checked={draft.active} onChange={e => setDraft({ ...draft, active: e.target.checked })} className="w-4 h-4" />
            Đang hoạt động
          </label>
          <div className="sm:col-span-2 flex gap-2 mt-2">
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
