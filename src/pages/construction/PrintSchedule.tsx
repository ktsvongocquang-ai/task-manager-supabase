// Bản in tiến độ thi công khổ A3 (hoặc A4) ngang, có khung 3 chữ ký — để kẹp hồ sơ, treo lán trại, gửi chủ nhà.
// Mở từ Thi công → menu ⋯ → "In tiến độ A3". Đường dẫn: /in-tien-do/:id
import { useEffect, useMemo, useState } from 'react';
import { useParams } from 'react-router-dom';
import { supabase } from '../../services/supabase';

type P = { id: string; name: string; project_code: string | null; owner_name: string | null; address: string | null; start_date: string | null; handover_date: string | null; end_date: string | null; engineer_name: string | null; manager_name: string | null; progress: number | null };
type T = { id: string; name: string; category: string | null; status: string; start_date: string | null; end_date: string | null; progress: number | null; assignee: string | null };

const d = (s: string) => Date.parse(s + 'T00:00:00Z') / 864e5;
const fmt = (s?: string | null) => (s ? `${s.slice(8, 10)}/${s.slice(5, 7)}/${s.slice(0, 4)}` : '—');
const short = (s: string) => `${s.slice(8, 10)}/${s.slice(5, 7)}`;
const isDone = (s: string) => /^done$|hoàn thành/i.test(s);

export function PrintSchedule() {
  const { id } = useParams();
  const [p, setP] = useState<P | null>(null);
  const [tasks, setTasks] = useState<T[]>([]);
  const [err, setErr] = useState('');
  const [paper, setPaper] = useState<'A3' | 'A4'>('A3');
  const today = new Date(Date.now() + 7 * 3600_000).toISOString().slice(0, 10);

  useEffect(() => {
    (async () => {
      const [a, b] = await Promise.all([
        supabase.from('construction_projects').select('*').eq('id', id).single(),
        supabase.from('construction_tasks').select('id, name, category, status, start_date, end_date, progress, assignee').eq('project_id', id),
      ]);
      if (a.error) return setErr(a.error.message);
      setP(a.data as P);
      setTasks(((b.data || []) as T[]).sort((x, y) => (x.start_date || '9').localeCompare(y.start_date || '9')));
    })();
  }, [id]);

  const groups = useMemo(() => {
    const m = new Map<string, T[]>();
    for (const t of tasks) { const k = t.category || 'Khác'; if (!m.has(k)) m.set(k, []); m.get(k)!.push(t); }
    // Nhóm theo thứ tự hạng mục (tên có số thứ tự "1. …" lên trước), "Khác" cuối cùng.
    return [...m].sort(([x], [y]) => (x === 'Khác' ? 1 : 0) - (y === 'Khác' ? 1 : 0) || x.localeCompare(y, 'vi', { numeric: true }));
  }, [tasks]);

  const dated = tasks.filter(t => t.start_date);
  const lo = dated.length ? Math.min(...dated.map(t => d(t.start_date!)), p?.start_date ? d(p.start_date) : Infinity) : d(today);
  const hi = Math.max(lo + 7, ...dated.map(t => d(t.end_date || t.start_date!)), p?.handover_date ? d(p.handover_date) : 0);
  const span = hi - lo + 1;
  const weeks = Array.from({ length: Math.ceil(span / 7) }, (_, i) => new Date((lo + i * 7) * 864e5).toISOString().slice(0, 10));
  const pct = (x: number) => `${((x - lo) / span) * 100}%`;
  const doneShare = tasks.length ? Math.round(tasks.reduce((s, t) => s + (isDone(t.status) ? 100 : t.progress || 0), 0) / tasks.length) : 0;
  const todayIn = d(today) >= lo && d(today) <= hi;

  if (err) return <p style={{ padding: 24 }}>Không mở được công trình: {err}</p>;
  if (!p) return <p style={{ padding: 24 }}>Đang tải…</p>;

  return (
    <div className="print-root">
      <style>{`
        @page { size: ${paper} landscape; margin: 10mm; }
        body { background: #fff; }
        .print-root { font-family: 'Be Vietnam Pro', Inter, system-ui, sans-serif; color: #1a1a1a; padding: 16px; font-size: ${paper === 'A3' ? 11 : 9}px; }
        .bar-cell { position: relative; height: 16px; }
        .grid-line { position: absolute; top: 0; bottom: 0; border-left: 1px solid #eee; }
        table { width: 100%; border-collapse: collapse; }
        th, td { border-bottom: 1px solid #e5e5e5; padding: 3px 6px; text-align: left; vertical-align: middle; }
        th { font-weight: 600; color: #555; border-bottom: 1.5px solid #1a1a1a; }
        tr { break-inside: avoid; }
        thead { display: table-header-group; }
        @media print { .no-print { display: none !important; } .print-root { padding: 0; } }
      `}</style>

      <div className="no-print" style={{ display: 'flex', gap: 8, alignItems: 'center', marginBottom: 12 }}>
        <button onClick={() => window.print()} style={{ background: '#7A1216', color: '#fff', border: 0, borderRadius: 8, padding: '8px 16px', fontWeight: 600, cursor: 'pointer' }}>In / Lưu PDF</button>
        {(['A3', 'A4'] as const).map(s => <button key={s} onClick={() => setPaper(s)} style={{ border: '1px solid #ccc', borderRadius: 8, padding: '8px 12px', background: paper === s ? '#1a1a1a' : '#fff', color: paper === s ? '#fff' : '#1a1a1a', cursor: 'pointer' }}>{s} ngang</button>)}
        <span style={{ color: '#777' }}>Mẹo: chọn máy in "Lưu dưới dạng PDF", bỏ chọn "Đầu trang và chân trang".</span>
      </div>

      <header style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-end', borderBottom: '2px solid #1a1a1a', paddingBottom: 8, marginBottom: 10 }}>
        <div>
          <div style={{ letterSpacing: 2, fontWeight: 700, color: '#7A1216' }}>DQH ARCHITECTS</div>
          <div style={{ fontSize: '1.9em', fontWeight: 700, lineHeight: 1.2 }}>BẢNG TIẾN ĐỘ THI CÔNG</div>
          <div style={{ fontSize: '1.2em' }}>{p.name}{p.project_code ? ` · ${p.project_code}` : ''}</div>
        </div>
        <table style={{ width: 'auto', fontSize: '1em' }}><tbody>
          <tr><td style={{ color: '#777', border: 0 }}>Chủ đầu tư</td><td style={{ border: 0, fontWeight: 600 }}>{p.owner_name || '—'}</td><td style={{ color: '#777', border: 0 }}>Khởi công</td><td style={{ border: 0, fontWeight: 600 }}>{fmt(p.start_date)}</td></tr>
          <tr><td style={{ color: '#777', border: 0 }}>Địa điểm</td><td style={{ border: 0 }}>{p.address || '—'}</td><td style={{ color: '#777', border: 0 }}>Bàn giao dự kiến</td><td style={{ border: 0, fontWeight: 600 }}>{fmt(p.handover_date || p.end_date)}</td></tr>
          <tr><td style={{ color: '#777', border: 0 }}>Giám sát</td><td style={{ border: 0 }}>{p.engineer_name || '—'}</td><td style={{ color: '#777', border: 0 }}>Hoàn thành</td><td style={{ border: 0, fontWeight: 700 }}>{doneShare}% · in ngày {fmt(today)}</td></tr>
        </tbody></table>
      </header>

      <table>
        <thead>
          <tr>
            <th style={{ width: '24%' }}>Hạng mục</th>
            <th style={{ width: '6%' }}>Bắt đầu</th>
            <th style={{ width: '6%' }}>Kết thúc</th>
            <th style={{ width: '4%' }}>%</th>
            <th style={{ width: '10%' }}>Phụ trách</th>
            <th style={{ padding: 0 }}>
              <div className="bar-cell" style={{ height: 18 }}>
                {weeks.map(w => <span key={w} style={{ position: 'absolute', left: pct(d(w)), top: 2, fontSize: '0.85em', color: '#777' }}>{short(w)}</span>)}
              </div>
            </th>
          </tr>
        </thead>
        <tbody>
          {groups.map(([g, ts]) => [
            <tr key={'g' + g}><td colSpan={6} style={{ fontWeight: 700, background: '#f5f3f0', paddingTop: 5 }}>{g}</td></tr>,
            ...ts.map(t => {
              const s = t.start_date, e = t.end_date || t.start_date;
              const late = !isDone(t.status) && e && e < today;
              const prog = isDone(t.status) ? 100 : t.progress || 0;
              return (
                <tr key={t.id}>
                  <td>{t.name}</td>
                  <td>{s ? short(s) : '—'}</td>
                  <td>{e ? short(e) : '—'}</td>
                  <td>{prog}</td>
                  <td>{t.assignee || ''}</td>
                  <td style={{ padding: 0 }}>
                    <div className="bar-cell">
                      {weeks.map(w => <span key={w} className="grid-line" style={{ left: pct(d(w)) }} />)}
                      {todayIn && <span className="grid-line" style={{ left: pct(d(today)), borderLeft: '1.5px dashed #7A1216' }} />}
                      {s && e && (
                        <span style={{ position: 'absolute', top: 3, height: 10, left: pct(d(s)), width: `${((d(e) - d(s) + 1) / span) * 100}%`, border: `1px solid ${late ? '#b42318' : '#1a1a1a'}`, background: '#fff', borderRadius: 2, overflow: 'hidden' }}>
                          <span style={{ display: 'block', height: '100%', width: `${prog}%`, background: late ? '#b42318' : '#1a1a1a' }} />
                        </span>
                      )}
                    </div>
                  </td>
                </tr>
              );
            }),
          ])}
          {!tasks.length && <tr><td colSpan={6} style={{ color: '#777' }}>Công trình chưa có hạng mục.</td></tr>}
        </tbody>
      </table>

      <div style={{ display: 'flex', gap: 16, marginTop: 10, color: '#555' }}>
        <span>▮ phần đã xong · ▯ phần còn lại</span><span style={{ color: '#b42318' }}>▮ trễ hạn</span>{todayIn && <span style={{ color: '#7A1216' }}>┆ hôm nay</span>}
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 24, marginTop: 28, textAlign: 'center', breakInside: 'avoid' }}>
        {[['ĐƠN VỊ THI CÔNG', 'DQH Architects'], ['GIÁM SÁT', p.engineer_name || ''], ['CHỦ ĐẦU TƯ', p.owner_name || '']].map(([role, name]) => (
          <div key={role}>
            <div style={{ fontWeight: 700 }}>{role}</div>
            <div style={{ color: '#777', fontStyle: 'italic' }}>(Ký, ghi rõ họ tên)</div>
            <div style={{ height: 70 }} />
            <div style={{ fontWeight: 600 }}>{name || 'Họ tên'}</div>
          </div>
        ))}
      </div>
    </div>
  );
}
