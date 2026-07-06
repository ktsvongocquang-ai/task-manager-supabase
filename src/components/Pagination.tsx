import { ChevronLeft, ChevronRight } from 'lucide-react';

export function Pagination({ page, pageSize, total, onPageChange, onPageSizeChange }: {
  page: number; pageSize: number; total: number;
  onPageChange: (page: number) => void; onPageSizeChange: (size: number) => void;
}) {
  const totalPages = Math.max(1, Math.ceil(total / pageSize));
  const from = total === 0 ? 0 : (page - 1) * pageSize + 1;
  const to = Math.min(total, page * pageSize);

  return (
    <div className="flex flex-wrap items-center justify-between gap-3 text-xs text-slate-500">
      <span>Hiển thị {from}–{to} của {total}</span>
      <div className="flex items-center gap-3">
        <select value={pageSize} onChange={e => onPageSizeChange(Number(e.target.value))} className="px-2 py-1.5 border border-slate-200 rounded-lg text-xs">
          {[10, 25, 50, 100].map(n => <option key={n} value={n}>{n} dòng/trang</option>)}
        </select>
        <div className="flex items-center gap-1">
          <button onClick={() => onPageChange(Math.max(1, page - 1))} disabled={page <= 1}
            className="w-7 h-7 flex items-center justify-center border border-slate-200 rounded-lg disabled:opacity-40 hover:bg-slate-50">
            <ChevronLeft className="w-3.5 h-3.5" />
          </button>
          <span className="px-2 font-bold text-slate-700">{page}/{totalPages}</span>
          <button onClick={() => onPageChange(Math.min(totalPages, page + 1))} disabled={page >= totalPages}
            className="w-7 h-7 flex items-center justify-center border border-slate-200 rounded-lg disabled:opacity-40 hover:bg-slate-50">
            <ChevronRight className="w-3.5 h-3.5" />
          </button>
        </div>
      </div>
    </div>
  );
}
