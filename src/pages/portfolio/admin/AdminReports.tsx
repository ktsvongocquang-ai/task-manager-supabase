import { useEffect, useState } from 'react';
import { supabase } from '../../../services/supabase';

interface EventRow {
  event: string;
  sale_code: string | null;
  source: string | null;
  created_at: string;
}
interface LeadRow {
  sale_code: string | null;
  source: string | null;
  lead_score: string | null;
  created_at: string;
}

interface GroupStat {
  key: string;
  views: number;
  estimates: number;
  leads: number;
  hotLeads: number;
}

function aggregate(events: EventRow[], leads: LeadRow[], by: 'sale_code' | 'source', sinceDays: number): GroupStat[] {
  const since = Date.now() - sinceDays * 24 * 60 * 60 * 1000;
  const map: Record<string, GroupStat> = {};
  const ensure = (key: string) => {
    const k = key || '(không rõ)';
    if (!map[k]) map[k] = { key: k, views: 0, estimates: 0, leads: 0, hotLeads: 0 };
    return map[k];
  };

  events
    .filter(e => new Date(e.created_at).getTime() >= since)
    .forEach(e => {
      const g = ensure(e[by] || '');
      if (e.event === 'view') g.views += 1;
      if (e.event === 'estimate_done') g.estimates += 1;
    });

  leads
    .filter(l => new Date(l.created_at).getTime() >= since)
    .forEach(l => {
      const g = ensure(l[by] || '');
      g.leads += 1;
      if (l.lead_score === 'hot') g.hotLeads += 1;
    });

  return Object.values(map).sort((a, b) => b.views - a.views);
}

function StatTable({ title, rows }: { title: string; rows: GroupStat[] }) {
  return (
    <div>
      <h3 className="font-serif text-lg mb-3">{title}</h3>
      <div className="overflow-x-auto bg-white border border-gray-200 rounded-lg">
        <table className="min-w-[500px] text-xs w-full">
          <thead>
            <tr className="bg-gray-50 border-b border-gray-200">
              {['', 'Lượt xem', 'Lượt tính khái toán', 'Lead', 'Lead nóng'].map(h => (
                <th key={h} className="text-left font-bold text-gray-500 uppercase tracking-wide px-3 py-2">
                  {h}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {rows.map(r => (
              <tr key={r.key} className="border-b border-gray-100">
                <td className="px-3 py-2 font-semibold">{r.key}</td>
                <td className="px-3 py-2">{r.views}</td>
                <td className="px-3 py-2">{r.estimates}</td>
                <td className="px-3 py-2">{r.leads}</td>
                <td className="px-3 py-2">{r.hotLeads}</td>
              </tr>
            ))}
            {rows.length === 0 && (
              <tr>
                <td colSpan={5} className="px-3 py-6 text-center text-gray-400">
                  Chưa có dữ liệu.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}

export function AdminReports() {
  const [events, setEvents] = useState<EventRow[] | null>(null);
  const [leads, setLeads] = useState<LeadRow[] | null>(null);
  const [window_, setWindow] = useState<7 | 30>(7);

  useEffect(() => {
    const since = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString();
    supabase
      .from('lp_events')
      .select('event,sale_code,source,created_at')
      .gte('created_at', since)
      .then(({ data }) => setEvents((data as EventRow[]) || []));
    supabase
      .from('leads')
      .select('sale_code,source,lead_score,created_at')
      .gte('created_at', since)
      .then(({ data }) => setLeads((data as LeadRow[]) || []));
  }, []);

  if (!events || !leads) return <p className="text-xs text-gray-400">Đang tải...</p>;

  return (
    <div className="space-y-8 max-w-3xl">
      <div className="flex gap-2">
        {[7, 30].map(d => (
          <button
            key={d}
            onClick={() => setWindow(d as 7 | 30)}
            className={`px-4 py-2 rounded-lg text-xs font-bold cursor-pointer ${
              window_ === d ? 'bg-gray-900 text-white' : 'bg-gray-100 text-gray-600'
            }`}
          >
            {d} ngày gần nhất
          </button>
        ))}
      </div>
      <StatTable title="Theo Sale" rows={aggregate(events, leads, 'sale_code', window_)} />
      <StatTable title="Theo Nguồn" rows={aggregate(events, leads, 'source', window_)} />
    </div>
  );
}
