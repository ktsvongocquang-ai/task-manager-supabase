import { useState, useEffect } from 'react';
import {
  Hammer, CheckCircle2, Clock, AlertTriangle,
  X, ChevronRight, Package, FileCheck,
  MapPin, Building2, Wrench, CheckCheck, RefreshCw
} from 'lucide-react';
import { Project, FloorPlan, MarkerNote } from '../types';

interface WorkItem {
  marker: MarkerNote;
  projectName: string;
  projectId: string;
  floorPlanName: string;
}

interface ApprovedDrawing {
  drawingType: string;
  version: string;
  projectName: string;
  projectId: string;
  approvedAt?: number;
  note?: string;
}

interface XUDashboardProps {
  projects: Project[];
  floorPlans: FloorPlan[];
  markerNotes: MarkerNote[];
  onUpdateMarker: (updated: MarkerNote) => void;
  onOpenProject: (projectId: string) => void;
  onClose: () => void;
}

export default function XUDashboard({
  projects, floorPlans, markerNotes,
  onUpdateMarker, onOpenProject, onClose
}: XUDashboardProps) {
  const [tab, setTab] = useState<'fix' | 'draw'>('fix');
  const [updatingId, setUpdatingId] = useState<string | null>(null);
  const [approvedDrawings, setApprovedDrawings] = useState<ApprovedDrawing[]>([]);
  const [now, setNow] = useState(new Date());

  useEffect(() => {
    const t = setInterval(() => setNow(new Date()), 60000);
    return () => clearInterval(t);
  }, []);

  // Load approved revisions from localStorage
  useEffect(() => {
    const all: ApprovedDrawing[] = [];
    projects.forEach(p => {
      try {
        const raw = localStorage.getItem(`sdqh_versions_${p.id}`);
        if (!raw) return;
        // Format: Record<drawingType, DrawingVersion[]>
        const versionsMap = JSON.parse(raw) as Record<string, any[]>;
        Object.entries(versionsMap).forEach(([drawingType, vList]) => {
          if (!Array.isArray(vList)) return;
          vList
            .filter((v: any) => v.status === 'approved')
            .forEach((v: any) => {
              all.push({
                drawingType,
                version: v.version || 'v1.0',
                projectName: p.name,
                projectId: p.id,
                approvedAt: v.approvedAt,
                note: v.note || v.changelog || '',
              });
            });
        });
      } catch { /* ignore */ }
    });
    setApprovedDrawings(all);
  }, [projects]);

  // Map markers → work items with project info
  const workItems: WorkItem[] = markerNotes.map(m => {
    const fp = floorPlans.find(f => f.id === m.floorPlanId);
    const proj = fp ? projects.find(p => p.id === fp.projectId) : null;
    return {
      marker: m,
      projectName: proj?.name || 'Dự án',
      projectId: proj?.id || '',
      floorPlanName: fp?.name || 'Bản vẽ',
    };
  });

  const needFix  = workItems.filter(w => !w.marker.tags?.[0] || w.marker.tags[0] === 'Chưa sửa');
  const inProg   = workItems.filter(w => w.marker.tags?.[0] === 'Đang sửa');
  const done     = workItems.filter(w => w.marker.tags?.[0] === 'Đã duyệt');

  async function setStatus(item: WorkItem, status: string) {
    setUpdatingId(item.marker.id);
    const updated = { ...item.marker, tags: [status, ...(item.marker.tags?.slice(1) || [])] };
    await onUpdateMarker(updated);
    setTimeout(() => setUpdatingId(null), 600);
  }

  const greet = now.getHours() < 12 ? 'Chào buổi sáng' : now.getHours() < 18 ? 'Chào buổi chiều' : 'Chào buổi tối';
  const dateStr = now.toLocaleDateString('vi-VN', { weekday: 'long', day: '2-digit', month: '2-digit', year: 'numeric' });

  return (
    <div className="min-h-screen bg-slate-950 flex flex-col font-sans">
      {/* Header */}
      <div className="bg-gradient-to-r from-orange-600 via-amber-600 to-yellow-500 px-4 py-5 shadow-2xl">
        <div className="flex items-start justify-between mb-1">
          <div>
            <p className="text-orange-100 text-xs font-bold opacity-80">{greet} 👷</p>
            <h1 className="text-white text-xl font-black tracking-tight">VIỆC CỦA TÔI</h1>
            <p className="text-orange-100 text-[11px] mt-0.5 opacity-75">{dateStr}</p>
          </div>
          <button
            onClick={onClose}
            className="p-2 bg-black/20 hover:bg-black/40 rounded-xl text-white transition-colors cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Quick stats */}
        <div className="grid grid-cols-3 gap-2 mt-4">
          <div className="bg-black/20 rounded-xl p-3 text-center">
            <p className="text-2xl font-black text-white">{needFix.length}</p>
            <p className="text-[10px] text-orange-200 font-bold uppercase tracking-wide">Cần sửa</p>
          </div>
          <div className="bg-black/20 rounded-xl p-3 text-center">
            <p className="text-2xl font-black text-white">{inProg.length}</p>
            <p className="text-[10px] text-orange-200 font-bold uppercase tracking-wide">Đang sửa</p>
          </div>
          <div className="bg-black/20 rounded-xl p-3 text-center">
            <p className="text-2xl font-black text-white">{approvedDrawings.length}</p>
            <p className="text-[10px] text-orange-200 font-bold uppercase tracking-wide">Bản vẽ OK</p>
          </div>
        </div>
      </div>

      {/* Tab switcher */}
      <div className="flex bg-slate-900 border-b border-slate-800">
        <button
          onClick={() => setTab('fix')}
          className={`flex-1 py-3 text-xs font-black tracking-wide flex items-center justify-center gap-2 transition-colors cursor-pointer ${
            tab === 'fix'
              ? 'text-amber-400 border-b-2 border-amber-400 bg-amber-400/5'
              : 'text-slate-500 hover:text-slate-300'
          }`}
        >
          <Wrench className="w-4 h-4" />
          SỬA LỖI ({needFix.length + inProg.length})
        </button>
        <button
          onClick={() => setTab('draw')}
          className={`flex-1 py-3 text-xs font-black tracking-wide flex items-center justify-center gap-2 transition-colors cursor-pointer ${
            tab === 'draw'
              ? 'text-sky-400 border-b-2 border-sky-400 bg-sky-400/5'
              : 'text-slate-500 hover:text-slate-300'
          }`}
        >
          <FileCheck className="w-4 h-4" />
          BẢN VẼ ĐÃ DUYỆT ({approvedDrawings.length})
        </button>
      </div>

      {/* Content */}
      <div className="flex-1 overflow-y-auto p-3 space-y-3">

        {tab === 'fix' && (
          <>
            {/* Urgent: Chưa sửa */}
            {needFix.length > 0 && (
              <div>
                <div className="flex items-center gap-2 mb-2 px-1">
                  <AlertTriangle className="w-4 h-4 text-rose-400" />
                  <span className="text-xs font-black text-rose-400 uppercase tracking-wider">
                    Cần sửa ngay — {needFix.length} việc
                  </span>
                </div>
                <div className="space-y-2">
                  {needFix.map(item => (
                    <WorkCard
                      key={item.marker.id}
                      item={item}
                      statusColor="rose"
                      updating={updatingId === item.marker.id}
                      onStart={() => setStatus(item, 'Đang sửa')}
                      onOpenProject={() => onOpenProject(item.projectId)}
                    />
                  ))}
                </div>
              </div>
            )}

            {/* In progress: Đang sửa */}
            {inProg.length > 0 && (
              <div>
                <div className="flex items-center gap-2 mb-2 px-1 mt-4">
                  <Clock className="w-4 h-4 text-amber-400" />
                  <span className="text-xs font-black text-amber-400 uppercase tracking-wider">
                    Đang sửa — {inProg.length} việc
                  </span>
                </div>
                <div className="space-y-2">
                  {inProg.map(item => (
                    <WorkCard
                      key={item.marker.id}
                      item={item}
                      statusColor="amber"
                      updating={updatingId === item.marker.id}
                      onDone={() => setStatus(item, 'Đã duyệt')}
                      onOpenProject={() => onOpenProject(item.projectId)}
                    />
                  ))}
                </div>
              </div>
            )}

            {/* Done today */}
            {done.length > 0 && (
              <div>
                <div className="flex items-center gap-2 mb-2 px-1 mt-4">
                  <CheckCheck className="w-4 h-4 text-emerald-400" />
                  <span className="text-xs font-black text-emerald-400 uppercase tracking-wider">
                    Đã hoàn thành — {done.length} việc
                  </span>
                </div>
                <div className="space-y-2 opacity-60">
                  {done.slice(0, 5).map(item => (
                    <div
                      key={item.marker.id}
                      className="bg-slate-900 border border-emerald-900/30 rounded-2xl p-3 flex items-center gap-3"
                    >
                      <CheckCircle2 className="w-5 h-5 text-emerald-500 shrink-0" />
                      <div className="flex-1 min-w-0">
                        <p className="text-slate-300 text-sm font-bold line-clamp-1">{item.marker.title || 'Lỗi đã sửa'}</p>
                        <p className="text-slate-500 text-[11px]">{item.projectName}</p>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {needFix.length === 0 && inProg.length === 0 && done.length === 0 && (
              <EmptyState icon={<Wrench className="w-10 h-10 opacity-20" />} text="Không có lỗi nào cần sửa" sub="Tốt lắm! Công trình đang sạch sẽ 🎉" />
            )}
          </>
        )}

        {tab === 'draw' && (
          <>
            {approvedDrawings.length === 0 ? (
              <EmptyState icon={<Package className="w-10 h-10 opacity-20" />} text="Chưa có bản vẽ nào được duyệt" sub="Khi GS duyệt bản vẽ, chúng sẽ xuất hiện ở đây" />
            ) : (
              <div className="space-y-2">
                {approvedDrawings.map((d, i) => (
                  <div
                    key={i}
                    className="bg-slate-900 border border-sky-900/40 rounded-2xl p-4 hover:border-sky-600/40 transition-colors"
                  >
                    <div className="flex items-start justify-between gap-2">
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2 mb-1">
                          <span className="text-[10px] font-black text-sky-400 bg-sky-400/10 px-2 py-0.5 rounded-full uppercase tracking-wider">
                            ✅ Đã duyệt
                          </span>
                          <span className="text-[10px] font-mono text-slate-500">{d.version}</span>
                        </div>
                        <p className="text-white font-black text-sm">{d.drawingType}</p>
                        <div className="flex items-center gap-1 mt-1">
                          <Building2 className="w-3 h-3 text-slate-500" />
                          <p className="text-slate-400 text-[11px]">
                            {d.projectName.length > 35 ? d.projectName.slice(0, 35) + '…' : d.projectName}
                          </p>
                        </div>
                        {d.note && (
                          <p className="text-slate-500 text-[11px] mt-1.5 italic line-clamp-2">"{d.note}"</p>
                        )}
                        {d.approvedAt && (
                          <p className="text-slate-600 text-[10px] mt-1">
                            Duyệt: {new Date(d.approvedAt).toLocaleDateString('vi-VN')}
                          </p>
                        )}
                      </div>
                      <button
                        onClick={() => onOpenProject(d.projectId)}
                        className="shrink-0 px-3 py-2 bg-sky-500/10 hover:bg-sky-500/20 border border-sky-500/20 rounded-xl text-sky-400 text-[11px] font-black cursor-pointer transition-colors flex items-center gap-1"
                      >
                        Xem <ChevronRight className="w-3 h-3" />
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </>
        )}
      </div>

      {/* Footer hint */}
      <div className="px-4 py-3 bg-slate-900/80 border-t border-slate-800 text-center">
        <p className="text-[10px] text-slate-600">
          Nhấn vào từng việc để xem chi tiết · Cập nhật trạng thái trực tiếp
        </p>
      </div>
    </div>
  );
}

// ── Sub-components ────────────────────────────────────────────────────────────

function WorkCard({
  item, statusColor, updating,
  onStart, onDone, onOpenProject
}: {
  item: WorkItem;
  statusColor: 'rose' | 'amber';
  updating: boolean;
  onStart?: () => void;
  onDone?: () => void;
  onOpenProject: () => void;
}) {
  const colors = {
    rose:  { bg: 'bg-rose-500/5',  border: 'border-rose-900/40', badge: 'bg-rose-500/15 text-rose-400', hover: 'hover:border-rose-500/40' },
    amber: { bg: 'bg-amber-500/5', border: 'border-amber-900/40', badge: 'bg-amber-500/15 text-amber-400', hover: 'hover:border-amber-500/40' },
  };
  const c = colors[statusColor];

  return (
    <div className={`${c.bg} border ${c.border} ${c.hover} rounded-2xl p-4 transition-all`}>
      {/* Project tag */}
      <div className="flex items-center gap-1.5 mb-2">
        <Building2 className="w-3 h-3 text-slate-500" />
        <span className="text-[10px] text-slate-500 font-bold truncate">
          {item.projectName.length > 30 ? item.projectName.slice(0, 30) + '…' : item.projectName}
        </span>
        <span className="text-slate-700">·</span>
        <span className="text-[10px] text-slate-600">{item.floorPlanName}</span>
      </div>

      {/* Title */}
      <p className="text-white font-black text-base leading-tight mb-1">
        {item.marker.title || 'Lỗi cần xử lý'}
      </p>

      {/* Notes preview */}
      {item.marker.textNotes && (
        <p className="text-slate-400 text-[11px] line-clamp-2 mb-3">{item.marker.textNotes}</p>
      )}

      {/* Photo indicator */}
      {item.marker.photoData && (
        <div className="flex items-center gap-1 mb-3">
          <MapPin className="w-3 h-3 text-slate-500" />
          <span className="text-[10px] text-slate-500">Có ảnh hiện trường</span>
        </div>
      )}

      {/* Action buttons */}
      <div className="flex items-center gap-2">
        {onStart && (
          <button
            onClick={onStart}
            disabled={updating}
            className="flex-1 py-2.5 bg-amber-500 hover:bg-amber-400 disabled:opacity-50 text-black font-black text-sm rounded-xl cursor-pointer transition-colors flex items-center justify-center gap-2 active:scale-95"
          >
            {updating ? <RefreshCw className="w-4 h-4 animate-spin" /> : <Hammer className="w-4 h-4" />}
            Bắt đầu sửa
          </button>
        )}
        {onDone && (
          <button
            onClick={onDone}
            disabled={updating}
            className="flex-1 py-2.5 bg-emerald-500 hover:bg-emerald-400 disabled:opacity-50 text-white font-black text-sm rounded-xl cursor-pointer transition-colors flex items-center justify-center gap-2 active:scale-95"
          >
            {updating ? <RefreshCw className="w-4 h-4 animate-spin" /> : <CheckCircle2 className="w-4 h-4" />}
            Đã sửa xong
          </button>
        )}
        <button
          onClick={onOpenProject}
          className="p-2.5 bg-slate-800 hover:bg-slate-700 text-slate-400 hover:text-white rounded-xl cursor-pointer transition-colors"
          title="Vào dự án"
        >
          <ChevronRight className="w-4 h-4" />
        </button>
      </div>
    </div>
  );
}

function EmptyState({ icon, text, sub }: { icon: React.ReactNode; text: string; sub: string }) {
  return (
    <div className="flex flex-col items-center justify-center py-20 text-slate-600">
      {icon}
      <p className="mt-4 text-sm font-bold text-slate-500">{text}</p>
      <p className="mt-1 text-[11px] text-slate-600 text-center px-8">{sub}</p>
    </div>
  );
}
