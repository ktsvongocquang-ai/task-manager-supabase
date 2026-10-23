import { useEffect, useState } from 'react';
import { useOutletContext } from 'react-router-dom';
import { landingSupabase } from '../sections/landingSupabase';
import type { AdminProfile } from './useAdminSession';

const ROLE_LABEL: Record<string, string> = { pending: 'Chờ duyệt', editor: 'Biên tập viên', admin: 'Quản trị viên' };

export function AdminUsers() {
  const { isAdmin } = useOutletContext<{ isAdmin: boolean }>();
  const [users, setUsers] = useState<AdminProfile[] | null>(null);

  const load = () => {
    landingSupabase
      .from('landing_admin_profiles')
      .select('id,email,role,is_active')
      .order('email')
      .then(({ data }) => setUsers((data as AdminProfile[]) || []));
  };

  useEffect(() => { load(); }, []);

  const updateUser = async (id: string, patch: Partial<AdminProfile>) => {
    await landingSupabase.from('landing_admin_profiles').update(patch).eq('id', id);
    load();
  };

  if (!isAdmin) {
    return <p className="text-xs text-rose-600">Chỉ Quản trị viên mới xem được trang này.</p>;
  }

  return (
    <div>
      <h1 className="font-serif text-2xl mb-1">Người dùng</h1>
      <p className="text-xs text-[#8A8070] mb-6">
        Duyệt tài khoản mới đăng ký (gán quyền Biên tập viên/Quản trị viên), hoặc vô hiệu hoá tài khoản không còn dùng nữa —
        không xoá tài khoản thật (cần "service role key" nguy hiểm nếu đụng vào từ trình duyệt nên không làm).
      </p>

      {!users ? (
        <p className="text-xs text-[#8A8070]">Đang tải...</p>
      ) : (
        <table className="w-full text-xs border-collapse max-w-2xl">
          <thead>
            <tr className="border-b border-[#2C2920]/10">
              <th className="text-left p-2 font-bold text-[#8A8070] uppercase tracking-wide">Email</th>
              <th className="text-left p-2 font-bold text-[#8A8070] uppercase tracking-wide">Quyền</th>
              <th className="text-left p-2 font-bold text-[#8A8070] uppercase tracking-wide">Hoạt động</th>
            </tr>
          </thead>
          <tbody>
            {users.map(u => (
              <tr key={u.id} className="border-b border-[#2C2920]/5">
                <td className="p-2">{u.email}</td>
                <td className="p-2">
                  <select
                    value={u.role}
                    onChange={e => updateUser(u.id, { role: e.target.value as AdminProfile['role'] })}
                    className="border border-[#2C2920]/15 rounded px-2 py-1 text-xs"
                  >
                    {Object.entries(ROLE_LABEL).map(([val, label]) => <option key={val} value={val}>{label}</option>)}
                  </select>
                </td>
                <td className="p-2">
                  <button
                    onClick={() => updateUser(u.id, { is_active: !u.is_active })}
                    className={`px-3 py-1 rounded text-[10px] font-bold cursor-pointer ${u.is_active ? 'bg-emerald-50 text-emerald-700 border border-emerald-200' : 'bg-rose-50 text-rose-600 border border-rose-200'}`}
                  >
                    {u.is_active ? 'Đang hoạt động — bấm để vô hiệu hoá' : 'Đã vô hiệu hoá — bấm để kích hoạt'}
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      )}
    </div>
  );
}
