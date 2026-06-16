import React, { useMemo, useState } from 'react';
import { Project, FloorPlan, MarkerNote } from '../types';
import {
  X,
  TrendingUp,
  Clock,
  AlertTriangle,
  CheckCircle2,
  ChevronRight,
  Calendar,
  BarChart3,
  FileText,
  Camera,
  Filter
} from 'lucide-react';

// ─── Props ───────────────────────────────────────────────────────────────────
interface ProgressViewProps {
  projects: Project[];
  floorPlans: FloorPlan[];
  markerNotes: MarkerNote[];
  onOpenProject: (projectId: string) => void;
  onClose: () => void;
}

// ─── Helpers ─────────────────────────────────────────────────────────────────
function formatVietnameseDate(date: Date): string {
  return date.toLocaleDateString('vi-VN', {
    weekday: 'long',
    year: 'numeric',
    month: 'long',
    day: 'numeric',
  });
}

function getProgressColor(pct: number): string {
  if (pct > 70) return 'from-emerald-500 to-emerald-400';
  if (pct >= 30) return 'from-amber-500 to-amber-400';
  return 'from-rose-500 to-rose-400';
}

function getProgressTextColor(pct: number): string {
  if (pct > 70) return 'text-emerald-400';
  if (pct >= 30) return 'text-amber-400';
  return 'text-rose-400';
}

// ─── Mock diary entries ──────────────────────────────────────────────────────
interface DiaryEntry {
  id: string;
  date: string;
  projectName: string;
  description: string;
  status: 'completed' | 'in_progress';
  hasPhoto: boolean;
}

const MOCK_DIARY: DiaryEntry[] = [
  {
    id: 'd1',
    date: '11/06/2026',
    projectName: 'Biệt thự Thảo Điền',
    description: 'Hoàn thành đổ bê tông sàn tầng 3. Kiểm tra độ phẳng đạt yêu cầu.',
    status: 'completed',
    hasPhoto: true,
  },
  {
    id: 'd2',
    date: '10/06/2026',
    projectName: 'Nhà phố Quận 7',
    description: 'Đang thi công phần thô tầng 2. Tiến độ đúng kế hoạch.',
    status: 'in_progress',
    hasPhoto: false,
  },
  {
    id: 'd3',
    date: '10/06/2026',
    projectName: 'Villa Phú Mỹ Hưng',
    description: 'Lắp đặt hệ thống điện âm tường tầng 1. Phát hiện 2 lỗi cần sửa.',
    status: 'in_progress',
    hasPhoto: true,
  },
  {
    id: 'd4',
    date: '09/06/2026',
    projectName: 'Biệt thự Thảo Điền',
    description: 'Nghiệm thu hệ thống chống thấm mái. Đạt tiêu chuẩn.',
    status: 'completed',
    hasPhoto: false,
  },
];

// ─── Per-project computed stats ──────────────────────────────────────────────
interface ProjectProgressInfo {
  project: Project;
  unfixed: number;
  fixed: number;
  totalMarkers: number;
}

// ─── Main Component ──────────────────────────────────────────────────────────
export default function ProgressView({
  projects,
  floorPlans,
  markerNotes,
  onOpenProject,
  onClose,
}: ProgressViewProps) {
  const today = new Date();
  const [defectFilter, setDefectFilter] = useState<'all' | 'unfixed' | 'fixed'>('unfixed');

  // Compute per-project info
  const projectInfos: ProjectProgressInfo[] = useMemo(() => {
    return projects.map((project) => {
      const projectFpIds = new Set(
        floorPlans.filter((fp) => fp.projectId === project.id).map((fp) => fp.id)
      );
      const projectNotes = markerNotes.filter((n) => projectFpIds.has(n.floorPlanId));
      const fixed = projectNotes.filter((n) => n.tags?.[0] === 'Đã duyệt').length;
      const unfixed = projectNotes.length - fixed;
      return { project, unfixed, fixed, totalMarkers: projectNotes.length };
    });
  }, [projects, floorPlans, markerNotes]);

  // All defects for global list
  const allDefects = useMemo(() => {
    return markerNotes.map(m => {
      const fp = floorPlans.find(f => f.id === m.floorPlanId);
      const proj = projects.find(p => p.id === fp?.projectId);
      return { ...m, projectName: proj?.name || 'Không rõ dự án', projectId: proj?.id };
    }).sort((a, b) => b.createdAt - a.createdAt);
  }, [markerNotes, floorPlans, projects]);

  const filteredDefects = useMemo(() => {
    if (defectFilter === 'all') return allDefects;
    if (defectFilter === 'fixed') return allDefects.filter(m => m.tags?.[0] === 'Đã duyệt' || m.tags?.[0] === 'Đã sửa');
    return allDefects.filter(m => m.tags?.[0] !== 'Đã duyệt' && m.tags?.[0] !== 'Đã sửa');
  }, [allDefects, defectFilter]);

  // Summary KPIs
  const totalProjects = projects.length;
  const avgProgress =
    totalProjects > 0
      ? Math.round(projects.reduce((sum, p) => sum + p.progress, 0) / totalProjects)
      : 0;
  const totalUnfixed = projectInfos.reduce((sum, pi) => sum + pi.unfixed, 0);

  return (
    <div className="fixed inset-0 z-[200] bg-[#111] overflow-y-auto">
      {/* Subtle background pattern */}
      <div
        className="fixed inset-0 opacity-[0.02] pointer-events-none"
        style={{
          backgroundImage:
            'linear-gradient(rgba(255,255,255,1) 1px, transparent 1px), linear-gradient(90deg, rgba(255,255,255,1) 1px, transparent 1px)',
          backgroundSize: '32px 32px',
        }}
      />

      {/* ── HEADER ── */}
      <header className="sticky top-0 z-50 flex items-center justify-between px-5 py-4 border-b border-[#333] bg-[#1a1a1a]/95 backdrop-blur-md">
        <div className="flex items-center gap-3">
          <div className="flex items-center justify-center w-9 h-9 rounded-xl bg-indigo-500/15 border border-indigo-500/30">
            <Clock className="w-4.5 h-4.5 text-indigo-400" />
          </div>
          <div>
            <h1 className="text-base font-black tracking-tight text-white uppercase">
              Tiến độ tổng hợp
            </h1>
            <p className="text-[10px] text-[#888] tracking-wide">{formatVietnameseDate(today)}</p>
          </div>
        </div>
        <button
          onClick={onClose}
          className="flex items-center justify-center w-9 h-9 rounded-xl bg-[#222] border border-[#333] hover:bg-rose-500/20 hover:border-rose-500/50 text-[#888] hover:text-rose-400 transition-all duration-200"
        >
          <X className="w-5 h-5" />
        </button>
      </header>

      {/* ── CONTENT ── */}
      <main className="relative z-10 max-w-4xl mx-auto px-4 py-5 space-y-6 pb-20">

        {/* ── 3 SUMMARY CARDS ── */}
        <div className="grid grid-cols-3 gap-3">
          {/* Card 1 – Total projects */}
          <div className="relative rounded-2xl p-4 bg-gradient-to-br from-indigo-600/20 to-indigo-900/10 border border-indigo-500/20 overflow-hidden">
            <div className="absolute top-3 right-3 opacity-10">
              <BarChart3 className="w-10 h-10 text-indigo-300" />
            </div>
            <div className="flex items-center gap-2 mb-2">
              <div className="flex items-center justify-center w-8 h-8 rounded-lg bg-indigo-500/20">
                <BarChart3 className="w-4 h-4 text-indigo-400" />
              </div>
            </div>
            <p className="text-3xl font-black text-white tabular-nums">{totalProjects}</p>
            <p className="text-[10px] text-indigo-300/70 font-semibold tracking-wider uppercase mt-1">
              Tổng dự án
            </p>
          </div>

          {/* Card 2 – Average progress */}
          <div className="relative rounded-2xl p-4 bg-gradient-to-br from-emerald-600/20 to-emerald-900/10 border border-emerald-500/20 overflow-hidden">
            <div className="absolute top-3 right-3 opacity-10">
              <TrendingUp className="w-10 h-10 text-emerald-300" />
            </div>
            <div className="flex items-center gap-2 mb-2">
              <div className="flex items-center justify-center w-8 h-8 rounded-lg bg-emerald-500/20">
                <TrendingUp className="w-4 h-4 text-emerald-400" />
              </div>
            </div>
            <p className="text-3xl font-black text-white tabular-nums">{avgProgress}%</p>
            <p className="text-[10px] text-emerald-300/70 font-semibold tracking-wider uppercase mt-1">
              Tiến độ TB
            </p>
          </div>

          {/* Card 3 – Total unfixed defects */}
          <div className="relative rounded-2xl p-4 bg-gradient-to-br from-rose-600/20 to-rose-900/10 border border-rose-500/20 overflow-hidden">
            <div className="absolute top-3 right-3 opacity-10">
              <AlertTriangle className="w-10 h-10 text-rose-300" />
            </div>
            <div className="flex items-center gap-2 mb-2">
              <div className="flex items-center justify-center w-8 h-8 rounded-lg bg-rose-500/20">
                <AlertTriangle className="w-4 h-4 text-rose-400" />
              </div>
            </div>
            <p className="text-3xl font-black text-white tabular-nums">{totalUnfixed}</p>
            <p className="text-[10px] text-rose-300/70 font-semibold tracking-wider uppercase mt-1">
              Lỗi chưa sửa
            </p>
          </div>
        </div>

        {/* ── PROJECT PROGRESS LIST ── */}
        <section>
          <div className="flex items-center gap-2 mb-3">
            <BarChart3 className="w-4 h-4 text-[#888]" />
            <h2 className="text-xs font-bold text-[#aaa] tracking-widest uppercase">
              Tiến độ từng dự án
            </h2>
          </div>

          {projects.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-16 text-[#555]">
              <BarChart3 className="w-10 h-10 mb-3 opacity-30" />
              <p className="text-sm">Chưa có dự án nào</p>
            </div>
          ) : (
            <div className="space-y-3">
              {projectInfos.map(({ project, unfixed, fixed }) => (
                <div
                  key={project.id}
                  className="bg-[#222] border border-[#333] rounded-2xl p-4 transition-all duration-200 hover:border-[#444] hover:bg-[#252525]"
                >
                  {/* Name & leader */}
                  <div className="flex items-start justify-between mb-3">
                    <div className="flex-1 min-w-0">
                      <h3 className="font-bold text-white text-sm leading-tight truncate">
                        {project.name}
                      </h3>
                      <p className="text-[#888] text-xs mt-0.5 truncate">{project.leader}</p>
                    </div>
                    <span className={`text-lg font-black tabular-nums ${getProgressTextColor(project.progress)}`}>
                      {project.progress}%
                    </span>
                  </div>

                  {/* Progress bar */}
                  <div className="h-2 w-full bg-[#333] rounded-full overflow-hidden mb-3">
                    <div
                      className={`h-full rounded-full bg-gradient-to-r ${getProgressColor(project.progress)} transition-all duration-700`}
                      style={{ width: `${Math.min(project.progress, 100)}%` }}
                    />
                  </div>

                  {/* Stats row + action */}
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-3 text-xs">
                      <span className="flex items-center gap-1 text-rose-400 font-semibold">
                        <AlertTriangle className="w-3 h-3" />
                        {unfixed} lỗi chưa sửa
                      </span>
                      <span className="text-[#444]">|</span>
                      <span className="flex items-center gap-1 text-emerald-400 font-semibold">
                        <CheckCircle2 className="w-3 h-3" />
                        {fixed} đã sửa
                      </span>
                    </div>
                    <button
                      onClick={() => onOpenProject(project.id)}
                      className="flex items-center gap-1 text-xs font-semibold text-indigo-400 hover:text-indigo-300 hover:bg-indigo-500/10 px-2.5 py-1.5 rounded-lg transition-all duration-200 border border-indigo-500/20 hover:border-indigo-400/40"
                    >
                      Mở
                      <ChevronRight className="w-3.5 h-3.5" />
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </section>

        {/* ── DANH SÁCH LỖI (TOÀN CÔNG TY) ── */}
        <section>
          <div className="flex items-center justify-between mb-3">
            <div className="flex items-center gap-2">
              <Filter className="w-4 h-4 text-[#888]" />
              <h2 className="text-xs font-bold text-[#aaa] tracking-widest uppercase">
                Danh sách lỗi ({filteredDefects.length})
              </h2>
            </div>
            <div className="flex items-center gap-1 bg-[#222] p-1 rounded-lg border border-[#333]">
              <button
                onClick={() => setDefectFilter('unfixed')}
                className={`px-3 py-1.5 text-[10px] font-bold rounded-md transition-colors ${defectFilter === 'unfixed' ? 'bg-rose-500/20 text-rose-400' : 'text-[#888] hover:text-[#bbb]'}`}
              >
                Chưa sửa
              </button>
              <button
                onClick={() => setDefectFilter('fixed')}
                className={`px-3 py-1.5 text-[10px] font-bold rounded-md transition-colors ${defectFilter === 'fixed' ? 'bg-emerald-500/20 text-emerald-400' : 'text-[#888] hover:text-[#bbb]'}`}
              >
                Đã sửa
              </button>
              <button
                onClick={() => setDefectFilter('all')}
                className={`px-3 py-1.5 text-[10px] font-bold rounded-md transition-colors ${defectFilter === 'all' ? 'bg-[#333] text-white' : 'text-[#888] hover:text-[#bbb]'}`}
              >
                Tất cả
              </button>
            </div>
          </div>

          <div className="space-y-2.5">
            {filteredDefects.map(m => (
              <div
                key={m.id}
                className="bg-[#222] border border-[#333] rounded-2xl p-4 flex items-start gap-3"
              >
                {/* Photo */}
                <div className="shrink-0 w-16 h-16 rounded-xl overflow-hidden bg-[#2a2a2a] border border-[#333] flex items-center justify-center">
                  {m.photoData ? (
                    <img src={m.photoData} alt="Defect" className="w-full h-full object-cover" />
                  ) : (
                    <Camera className="w-5 h-5 text-[#555]" />
                  )}
                </div>

                {/* Content */}
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 mb-1">
                    <h4 className="text-xs font-bold text-white truncate">{m.title}</h4>
                    <span
                      className={`shrink-0 text-[9px] font-semibold px-2 py-0.5 rounded-full ${
                        m.tags?.[0] === 'Đã duyệt' || m.tags?.[0] === 'Đã sửa'
                          ? 'bg-emerald-500/15 text-emerald-400 border border-emerald-500/25'
                          : 'bg-rose-500/15 text-rose-400 border border-rose-500/25'
                      }`}
                    >
                      {m.tags?.[0] || 'Chưa sửa'}
                    </span>
                  </div>
                  <p className="text-[11px] text-[#888] font-semibold truncate mb-1">Dự án: {m.projectName}</p>
                  {m.transcription ? (
                    <p className="text-[11px] text-[#aaa] leading-relaxed italic line-clamp-2">"{m.transcription}"</p>
                  ) : m.textNotes ? (
                    <p className="text-[11px] text-[#aaa] leading-relaxed line-clamp-2">{m.textNotes}</p>
                  ) : null}
                </div>

                {/* Action */}
                <button
                  onClick={() => {
                    if (m.projectId) {
                      onOpenProject(m.projectId);
                      onClose();
                    }
                  }}
                  className="shrink-0 flex items-center justify-center w-8 h-8 rounded-full bg-[#333] text-[#aaa] hover:bg-[#444] hover:text-white transition-colors"
                >
                  <ChevronRight className="w-4 h-4" />
                </button>
              </div>
            ))}
            {filteredDefects.length === 0 && (
              <div className="text-center py-10 text-[#666] text-xs font-medium">Không có lỗi nào.</div>
            )}
          </div>
        </section>
      </main>
    </div>
  );
}
