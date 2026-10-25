import { NavLink, Outlet } from 'react-router-dom';
import { useAdminSession } from './useAdminSession';
import { AdminLogin } from './AdminLogin';

const NAV = [
  { to: '/landing-admin/projects', label: 'Công trình tiêu biểu' },
  { to: '/landing-admin/pricing', label: 'Chi phí DQH / JUX' },
  { to: '/landing-admin/workflow', label: 'Quy trình & bảo hành' },
  { to: '/landing-admin/team', label: 'Đội ngũ nhân sự' },
  { to: '/landing-admin/company', label: 'Thông tin công ty' },
  { to: '/landing-admin/rates', label: 'Đơn giá calculator' },
];

export function AdminLayout() {
  const { loading, profile, isAdmin, isActiveEditor, signOut, refreshProfile } = useAdminSession();

  if (loading) return <div className="min-h-screen flex items-center justify-center bg-[#F8F5F0] text-sm text-[#8A8070]">Đang tải...</div>;

  if (!profile) return <AdminLogin onLoggedIn={refreshProfile} />;

  if (!profile.is_active) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center bg-[#F8F5F0] px-4 text-center font-sans">
        <h1 className="font-serif text-2xl text-[#2C2920] mb-2">Đang chờ duyệt</h1>
        <p className="text-xs text-[#8A8070] max-w-sm">Tài khoản {profile.email} đã đăng ký thành công nhưng chưa được admin cấp quyền. Liên hệ admin để được duyệt.</p>
        <button onClick={() => signOut()} className="mt-6 text-xs text-[#B8913A] font-semibold cursor-pointer">Đăng xuất</button>
      </div>
    );
  }

  return (
    <div className="min-h-screen flex bg-[#F8F5F0] font-sans text-[#2C2920]">
      <aside className="w-64 shrink-0 bg-[#1A1814] text-white p-6 flex flex-col">
        <div className="mb-8">
          <p className="font-serif text-lg">DQH <span className="italic text-[#B8913A]">Admin</span></p>
          <p className="text-[10px] text-[#8A8070] mt-1">{profile.email} · {profile.role === 'admin' ? 'Quản trị viên' : 'Biên tập viên'}</p>
        </div>
        <nav className="flex-1 space-y-1">
          {NAV.map(item => (
            <NavLink
              key={item.to}
              to={item.to}
              className={({ isActive }) => `block px-3 py-2.5 rounded-lg text-xs font-semibold transition-colors ${isActive ? 'bg-[#B8913A] text-white' : 'text-[#C4C0B8] hover:bg-white/5'}`}
            >
              {item.label}
            </NavLink>
          ))}
          {isAdmin && (
            <NavLink
              to="/landing-admin/users"
              className={({ isActive }) => `block px-3 py-2.5 rounded-lg text-xs font-semibold transition-colors ${isActive ? 'bg-[#B8913A] text-white' : 'text-[#C4C0B8] hover:bg-white/5'}`}
            >
              Người dùng
            </NavLink>
          )}
        </nav>
        <div className="pt-4 border-t border-white/10 space-y-2">
          <a href="/p/zooea5a4" target="_blank" rel="noreferrer" className="block text-[10px] text-[#8A8070] hover:text-white">↗ Xem landing page</a>
          <button onClick={() => signOut()} className="text-[10px] text-[#8A8070] hover:text-white cursor-pointer">Đăng xuất</button>
        </div>
      </aside>
      <main className="flex-1 p-8 overflow-x-hidden">
        <Outlet context={{ canWrite: isActiveEditor, isAdmin }} />
      </main>
    </div>
  );
}
