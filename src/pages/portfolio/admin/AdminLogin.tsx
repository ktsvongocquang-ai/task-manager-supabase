import { useState } from 'react';
import { landingSupabase } from '../sections/landingSupabase';

export function AdminLogin({ onLoggedIn }: { onLoggedIn: () => void }) {
  const [mode, setMode] = useState<'login' | 'signup'>('login');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [info, setInfo] = useState('');
  const [busy, setBusy] = useState(false);

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setInfo('');
    setBusy(true);
    try {
      if (mode === 'login') {
        const { error: err } = await landingSupabase.auth.signInWithPassword({ email, password });
        if (err) throw err;
        onLoggedIn();
      } else {
        if (password.length < 6) throw new Error('Mật khẩu cần tối thiểu 6 ký tự.');
        const { error: err } = await landingSupabase.auth.signUp({ email, password });
        if (err) throw err;
        setInfo('Đã đăng ký thành công. Tài khoản của bạn đang chờ admin duyệt quyền trước khi dùng được trang quản trị.');
        setMode('login');
      }
    } catch (err: any) {
      setError(err?.message || 'Có lỗi xảy ra.');
    } finally {
      setBusy(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-[#F8F5F0] px-4 font-sans">
      <div className="max-w-sm w-full bg-white p-8 rounded-2xl shadow-sm border border-[#2C2920]/10">
        <h1 className="font-serif text-2xl text-[#2C2920] mb-1">Quản trị Landing Page</h1>
        <p className="text-xs text-[#8A8070] mb-6">DQH Architects — {mode === 'login' ? 'Đăng nhập' : 'Đăng ký tài khoản mới'}</p>

        <form onSubmit={submit} className="space-y-4">
          <div>
            <label className="block text-[10px] uppercase tracking-wide text-[#8A8070] font-semibold mb-1">Email</label>
            <input type="email" required value={email} onChange={e => setEmail(e.target.value)} className="w-full border border-[#2C2920]/15 rounded-lg px-3 py-2.5 text-sm focus:outline-none focus:border-[#B8913A]" />
          </div>
          <div>
            <label className="block text-[10px] uppercase tracking-wide text-[#8A8070] font-semibold mb-1">Mật khẩu</label>
            <input type="password" required value={password} onChange={e => setPassword(e.target.value)} className="w-full border border-[#2C2920]/15 rounded-lg px-3 py-2.5 text-sm focus:outline-none focus:border-[#B8913A]" />
          </div>
          {error && <p className="text-xs text-rose-600">{error}</p>}
          {info && <p className="text-xs text-emerald-600">{info}</p>}
          <button type="submit" disabled={busy} className="w-full bg-[#1A1814] hover:bg-[#B8913A] text-white text-xs uppercase tracking-wide font-bold py-3 rounded-lg transition-colors disabled:opacity-50 cursor-pointer">
            {busy ? 'Đang xử lý...' : mode === 'login' ? 'Đăng nhập' : 'Đăng ký'}
          </button>
        </form>

        <button
          onClick={() => { setMode(mode === 'login' ? 'signup' : 'login'); setError(''); setInfo(''); }}
          className="mt-4 text-xs text-[#B8913A] hover:text-[#2C2920] font-semibold cursor-pointer"
        >
          {mode === 'login' ? 'Chưa có tài khoản? Đăng ký' : 'Đã có tài khoản? Đăng nhập'}
        </button>
      </div>
    </div>
  );
}
