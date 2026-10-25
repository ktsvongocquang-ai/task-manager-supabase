import { useEffect, useMemo, useState } from 'react';
import { supabase } from '../../../services/supabase';

interface LeadRow {
  id: string;
  name: string;
  phone: string;
  call_time: string | null;
  message: string | null;
  seg: string | null;
  sale_code: string | null;
  source: string | null;
  intent: string | null;
  gift: string | null;
  lead_score: 'hot' | 'warm' | 'cold' | null;
  status: 'moi' | 'da_goi' | 'hen_khao_sat' | 'ky_hd' | 'khong_phu_hop';
  created_at: string;
}

const STATUS_LABEL: Record<LeadRow['status'], string> = {
  moi: 'Mới',
  da_goi: 'Đã gọi',
  hen_khao_sat: 'Hẹn khảo sát',
  ky_hd: 'Ký HĐ',
  khong_phu_hop: 'Không phù hợp',
};

const SCORE_COLOR: Record<string, string> = {
  hot: 'bg-rose-100 text-rose-700',
  warm: 'bg-amber-100 text-amber-700',
  cold: 'bg-gray-100 text-gray-500',
};

export function AdminLeads() {
  const [leads, setLeads] = useState<LeadRow[] | null>(null);
  const [filterSale, setFilterSale] = useState('');
  const [filterScore, setFilterScore] = useState('');
  const [filterStatus, setFilterStatus] = useState('');

  const load = () => {
    supabase
      .from('leads')
      .select('*')
      .order('created_at', { ascending: false })
      .then(({ data }) => setLeads((data as LeadRow[]) || []));
  };
  useEffect(() => {
    load();
  }, []);

  const saleCodes = useMemo(() => Array.from(new Set((leads || []).map(l => l.sale_code).filter(Boolean))) as string[], [leads]);

  const filtered = (leads || []).filter(
    l => (!filterSale || l.sale_code === filterSale) && (!filterScore || l.lead_score === filterScore) && (!filterStatus || l.status === filterStatus)
  );

  const updateStatus = async (id: string, status: LeadRow['status']) => {
    setLeads(prev => (prev ? prev.map(l => (l.id === id ? { ...l, status } : l)) : prev));
    await supabase.from('leads').update({ status }).eq('id', id);
  };

  return (
    <div>
      <div className="flex flex-wrap gap-3 mb-4">
        <select value={filterSale} onChange={e => setFilterSale(e.target.value)} className="border border-gray-300 rounded px-3 py-2 text-xs">
          <option value="">Tất cả sale</option>
          {saleCodes.map(c => (
            <option key={c} value={c}>
              {c}
            </option>
          ))}
        </select>
        <select value={filterScore} onChange={e => setFilterScore(e.target.value)} className="border border-gray-300 rounded px-3 py-2 text-xs">
          <option value="">Tất cả mức độ</option>
          <option value="hot">Hot</option>
          <option value="warm">Warm</option>
          <option value="cold">Cold</option>
        </select>
        <select value={filterStatus} onChange={e => setFilterStatus(e.target.value)} className="border border-gray-300 rounded px-3 py-2 text-xs">
          <option value="">Tất cả trạng thái</option>
          {Object.entries(STATUS_LABEL).map(([k, v]) => (
            <option key={k} value={k}>
              {v}
            </option>
          ))}
        </select>
      </div>

      {!leads ? (
        <p className="text-xs text-gray-400">Đang tải...</p>
      ) : (
        <div className="overflow-x-auto bg-white border border-gray-200 rounded-lg">
          <table className="min-w-[1000px] text-xs w-full">
            <thead>
              <tr className="bg-gray-50 border-b border-gray-200">
                {['Thời gian', 'Tên', 'SĐT', 'Phân khúc', 'Sale', 'Nguồn', 'Ý định', 'Mức độ', 'Trạng thái'].map(h => (
                  <th key={h} className="text-left font-bold text-gray-500 uppercase tracking-wide px-3 py-2 whitespace-nowrap">
                    {h}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {filtered.map(l => (
                <tr key={l.id} className="border-b border-gray-100">
                  <td className="px-3 py-2 whitespace-nowrap text-gray-400">{new Date(l.created_at).toLocaleString('vi-VN')}</td>
                  <td className="px-3 py-2 font-semibold">{l.name}</td>
                  <td className="px-3 py-2">{l.phone}</td>
                  <td className="px-3 py-2">{l.seg || '—'}</td>
                  <td className="px-3 py-2">{l.sale_code || '—'}</td>
                  <td className="px-3 py-2">{l.source || '—'}</td>
                  <td className="px-3 py-2">{l.intent || '—'}</td>
                  <td className="px-3 py-2">
                    {l.lead_score && <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold ${SCORE_COLOR[l.lead_score]}`}>{l.lead_score}</span>}
                  </td>
                  <td className="px-3 py-2">
                    <select
                      value={l.status}
                      onChange={e => updateStatus(l.id, e.target.value as LeadRow['status'])}
                      className="border border-gray-300 rounded px-2 py-1 text-xs cursor-pointer"
                    >
                      {Object.entries(STATUS_LABEL).map(([k, v]) => (
                        <option key={k} value={k}>
                          {v}
                        </option>
                      ))}
                    </select>
                  </td>
                </tr>
              ))}
              {filtered.length === 0 && (
                <tr>
                  <td colSpan={9} className="px-3 py-6 text-center text-gray-400">
                    Chưa có lead nào khớp bộ lọc.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
