import { useEffect, useState } from 'react';
import { NavLink, Outlet } from 'react-router-dom';
import { useAuthStore } from '../../../store/authStore';
import { supabase } from '../../../services/supabase';

const TABS = [
  { to: 'content', label: 'Nội dung trang' },
  { to: 'segments', label: 'Phân khúc' },
  { to: 'projects', label: 'Công trình' },
  { to: 'styles', label: 'Phong cách' },
  { to: 'rates', label: 'Đơn giá' },
  { to: 'sales', label: 'Sale' },
  { to: 'leads', label: 'Lead' },
  { to: 'reports', label: 'Báo cáo' },
];

const DEFAULT_SLUG = 'dqh';

export function AdminLanding() {
  const { profile } = useAuthStore();
  const [pageId, setPageId] = useState<string | null | undefined>(undefined);

  useEffect(() => {
    let cancelled = false;
    supabase
      .from('landing_pages')
      .select('id')
      .eq('slug', DEFAULT_SLUG)
      .maybeSingle()
      .then(async ({ data }) => {
        if (cancelled) return;
        if (data?.id) {
          setPageId(data.id);
          return;
        }
        const { data: created } = await supabase
          .from('landing_pages')
          .insert({ slug: DEFAULT_SLUG })
          .select('id')
          .single();
        if (!cancelled) setPageId(created?.id || null);
      })
      .catch(() => {
        if (!cancelled) setPageId(null);
      });
    return () => {
      cancelled = true;
    };
  }, []);

  if (profile && profile.role !== 'Admin') {
    return <p className="p-6 text-sm text-rose-600">Chỉ Admin mới truy cập được trang này.</p>;
  }

  return (
    <div className="p-6">
      <h1 className="font-serif text-2xl mb-1">Quản trị Landing Page</h1>
      <p className="text-xs text-gray-500 mb-6">slug: /p/{DEFAULT_SLUG} — quản lý nội dung, công trình, đơn giá, sale và lead.</p>

      <div className="flex gap-1 mb-6 border-b border-gray-200 overflow-x-auto">
        {TABS.map(t => (
          <NavLink
            key={t.to}
            to={t.to}
            className={({ isActive }) =>
              `px-4 py-2.5 text-xs font-bold uppercase tracking-wide whitespace-nowrap border-b-2 -mb-px ${
                isActive ? 'border-indigo-600 text-indigo-600' : 'border-transparent text-gray-500 hover:text-gray-900'
              }`
            }
          >
            {t.label}
          </NavLink>
        ))}
      </div>

      {pageId === undefined ? (
        <p className="text-xs text-gray-400">Đang tải...</p>
      ) : (
        <Outlet context={{ pageId }} />
      )}
    </div>
  );
}
