import React, { useState, useEffect } from 'react';
import { Project, FloorPlan, MarkerNote } from '../types/floorplan';
import {
  X,
  AlertTriangle,
  CheckCircle2,
  Clock,
  TrendingUp,
  TrendingDown,
  Folders,
  ShieldAlert,
  BarChart3,
  FileCheck,
  ArrowRight,
  Zap,
  Activity,
  Download,
} from 'lucide-react';

interface CEODashboardProps {
  projects: Project[];
  floorPlans: FloorPlan[];
  markerNotes: MarkerNote[];
  onOpenProject: (projectId: string) => void;
  onClose: () => void;
}

const PLAN_TYPES: FloorPlan['planType'][] = [
  'perspective',
  'material_spec',
  'equipment',
  'rough_construction',
  'interior_detail',
];

function getDefectStatus(note: MarkerNote): string {
  return note.tags?.[0] ?? 'Chưa sửa';
}

function useCurrentTime() {
  const [now, setNow] = useState(new Date());
  useEffect(() => {
    const id = setInterval(() => setNow(new Date()), 1000);
    return () => clearInterval(id);
  }, []);
  return now;
}

function getGreeting(date: Date): string {
  const h = date.getHours();
  if (h < 12) return 'Chào buổi sáng';
  if (h < 18) return 'Chào buổi chiều';
  return 'Chào buổi tối';
}

function formatTime(date: Date): string {
  return date.toLocaleTimeString('vi-VN', { hour: '2-digit', minute: '2-digit', second: '2-digit' });
}

function formatDate(date: Date): string {
  return date.toLocaleDateString('vi-VN', {
    weekday: 'long',
    year: 'numeric',
    month: 'long',
    day: 'numeric',
  });
}

interface ProjectStats {
  project: Project;
  totalDefects: number;
  unresolved: number;
  inProgress: number;
  resolved: number;
  docCompleteness: number; // out of 5
  healthStatus: 'good' | 'warning' | 'critical';
}

function computeProjectStats(
  project: Project,
  floorPlans: FloorPlan[],
  markerNotes: MarkerNote[]
): ProjectStats {
  const projectFloorPlans = floorPlans.filter((fp) => fp.projectId === project.id);
  const fpIds = new Set(projectFloorPlans.map((fp) => fp.id));
  const notes = markerNotes.filter((n) => fpIds.has(n.floorPlanId));

  const totalDefects = notes.length;
  const unresolved = notes.filter((n) => getDefectStatus(n) === 'Chưa sửa').length;
  const inProgress = notes.filter((n) => getDefectStatus(n) === 'Đang sửa').length;
  const resolved = notes.filter((n) => getDefectStatus(n) === 'Đã duyệt').length;

  const uploadedTypes = new Set(projectFloorPlans.map((fp) => fp.planType).filter(Boolean));
  const docCompleteness = PLAN_TYPES.filter((t) => uploadedTypes.has(t)).length;

  let healthStatus: ProjectStats['healthStatus'] = 'good';
  if (unresolved > 7) healthStatus = 'critical';
  else if (unresolved >= 3) healthStatus = 'warning';

  return { project, totalDefects, unresolved, inProgress, resolved, docCompleteness, healthStatus };
}

// ─── Mini bar chart ──────────────────────────────────────────────────────────
function MiniDefectBar({ unresolved, inProgress, resolved }: { unresolved: number; inProgress: number; resolved: number }) {
  const total = unresolved + inProgress + resolved || 1;
  const pU = (unresolved / total) * 100;
  const pI = (inProgress / total) * 100;
  const pR = (resolved / total) * 100;
  return (
    <div className="flex h-2 w-full rounded-full overflow-hidden gap-0.5 mt-1">
      {unresolved > 0 && (
        <div
          style={{ width: `${pU}%` }}
          className="bg-rose-500 rounded-full transition-all duration-700"
          title={`Chưa sửa: ${unresolved}`}
        />
      )}
      {inProgress > 0 && (
        <div
          style={{ width: `${pI}%` }}
          className="bg-amber-400 rounded-full transition-all duration-700"
          title={`Đang sửa: ${inProgress}`}
        />
      )}
      {resolved > 0 && (
        <div
          style={{ width: `${pR}%` }}
          className="bg-emerald-500 rounded-full transition-all duration-700"
          title={`Đã duyệt: ${resolved}`}
        />
      )}
      {unresolved === 0 && inProgress === 0 && resolved === 0 && (
        <div className="w-full bg-slate-700 rounded-full" />
      )}
    </div>
  );
}

// ─── KPI Card ─────────────────────────────────────────────────────────────────
interface KpiCardProps {
  icon: React.ReactNode;
  label: string;
  value: string | number;
  sub?: string;
  accent: string; // tailwind colour class fragment e.g. 'emerald'
  trend?: 'up' | 'down' | 'neutral';
}

function KpiCard({ icon, label, value, sub, accent, trend }: KpiCardProps) {
  const borderMap: Record<string, string> = {
    emerald: 'border-emerald-500/30 hover:border-emerald-400/60',
    amber: 'border-amber-500/30 hover:border-amber-400/60',
    rose: 'border-rose-500/30 hover:border-rose-400/60',
    sky: 'border-sky-500/30 hover:border-sky-400/60',
  };
  const glowMap: Record<string, string> = {
    emerald: 'shadow-emerald-900/40',
    amber: 'shadow-amber-900/40',
    rose: 'shadow-rose-900/40',
    sky: 'shadow-sky-900/40',
  };
  const textMap: Record<string, string> = {
    emerald: 'text-emerald-400',
    amber: 'text-amber-400',
    rose: 'text-rose-400',
    sky: 'text-sky-400',
  };
  const bgMap: Record<string, string> = {
    emerald: 'bg-emerald-500/10',
    amber: 'bg-amber-500/10',
    rose: 'bg-rose-500/10',
    sky: 'bg-sky-500/10',
  };

  return (
    <div
      className={`relative flex flex-col gap-3 rounded-2xl border p-5 backdrop-blur-sm bg-slate-800/50 shadow-xl transition-all duration-300 hover:scale-[1.02] hover:shadow-2xl ${borderMap[accent] ?? ''} ${glowMap[accent] ?? ''}`}
    >
      {/* glow dot */}
      <div className={`absolute top-3 right-3 w-2 h-2 rounded-full ${bgMap[accent]} ring-2 ring-current ${textMap[accent]} animate-pulse`} />
      <div className={`flex items-center justify-center w-10 h-10 rounded-xl ${bgMap[accent]} ${textMap[accent]}`}>
        {icon}
      </div>
      <div>
        <p className="text-xs font-semibold tracking-widest text-slate-400 uppercase mb-1">{label}</p>
        <p className={`text-4xl font-bold tabular-nums ${textMap[accent]}`}>{value}</p>
        {sub && (
          <p className="text-xs text-slate-500 mt-1 flex items-center gap-1">
            {trend === 'up' && <TrendingUp className="w-3 h-3 text-emerald-400" />}
            {trend === 'down' && <TrendingDown className="w-3 h-3 text-rose-400" />}
            {sub}
          </p>
        )}
      </div>
    </div>
  );
}

// ─── Project Card ─────────────────────────────────────────────────────────────
function ProjectCard({ stats, onOpen }: { stats: ProjectStats; onOpen: () => void }) {
  const { project, totalDefects, unresolved, inProgress, resolved, docCompleteness, healthStatus } = stats;

  const healthConfig = {
    good: {
      label: 'Tốt',
      dot: '🟢',
      badge: 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/30',
      glow: 'shadow-emerald-900/20',
      border: 'border-emerald-500/20',
    },
    warning: {
      label: 'Cần chú ý',
      dot: '🟡',
      badge: 'bg-amber-500/20 text-amber-300 border border-amber-500/30',
      glow: 'shadow-amber-900/20',
      border: 'border-amber-500/20',
    },
    critical: {
      label: 'Khẩn cấp',
      dot: '🔴',
      badge: 'bg-rose-500/20 text-rose-300 border border-rose-500/30',
      glow: 'shadow-rose-900/30',
      border: 'border-rose-500/30',
    },
  };

  const cfg = healthConfig[healthStatus];
  const isCritical = healthStatus === 'critical';

  return (
    <div
      className={`relative flex flex-col gap-4 rounded-2xl border p-5 backdrop-blur-sm bg-slate-800/60 shadow-xl transition-all duration-300 hover:scale-[1.01] hover:shadow-2xl hover:bg-slate-800/80 ${cfg.border} ${cfg.glow} ${isCritical ? 'ring-1 ring-rose-500/20' : ''}`}
    >
      {/* Critical pulse ring */}
      {isCritical && (
        <span className="absolute -top-px -left-px -right-px -bottom-px rounded-2xl ring-2 ring-rose-500/30 animate-pulse pointer-events-none" />
      )}

      {/* Header */}
      <div className="flex items-start justify-between gap-2">
        <div className="flex-1 min-w-0">
          <h3 className="font-bold text-white text-sm leading-tight truncate">{project.name}</h3>
          <p className="text-xs text-slate-400 mt-0.5 truncate">{project.client}</p>
        </div>
        <span className={`shrink-0 text-xs font-semibold px-2 py-0.5 rounded-full ${cfg.badge}`}>
          {cfg.dot} {cfg.label}
        </span>
      </div>

      {/* Progress */}
      <div>
        <div className="flex items-center justify-between mb-1">
          <span className="text-xs text-slate-400 tracking-wider uppercase">Tiến độ</span>
          <span className="text-xs font-bold text-white">{project.progress}%</span>
        </div>
        <div className="h-1.5 w-full bg-slate-700 rounded-full overflow-hidden">
          <div
            className={`h-full rounded-full transition-all duration-1000 ${
              project.progress >= 80
                ? 'bg-emerald-500'
                : project.progress >= 40
                ? 'bg-amber-400'
                : 'bg-rose-500'
            }`}
            style={{ width: `${project.progress}%` }}
          />
        </div>
      </div>

      {/* Defect stats */}
      <div>
        <div className="flex items-center justify-between mb-2">
          <span className="text-xs text-slate-400 tracking-wider uppercase">Lỗi / Khiếm khuyết</span>
          <span className="text-xs font-bold text-slate-300">{totalDefects} tổng</span>
        </div>
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-2 mb-2">
          <div className="flex flex-col items-center bg-rose-500/10 rounded-lg py-1.5 border border-rose-500/20">
            <span className="text-base font-bold text-rose-400">{unresolved}</span>
            <span className="text-[10px] text-rose-300/70 tracking-wide">Chưa sửa</span>
          </div>
          <div className="flex flex-col items-center bg-amber-500/10 rounded-lg py-1.5 border border-amber-500/20">
            <span className="text-base font-bold text-amber-400">{inProgress}</span>
            <span className="text-[10px] text-amber-300/70 tracking-wide">Đang sửa</span>
          </div>
          <div className="flex flex-col items-center bg-emerald-500/10 rounded-lg py-1.5 border border-emerald-500/20">
            <span className="text-base font-bold text-emerald-400">{resolved}</span>
            <span className="text-[10px] text-emerald-300/70 tracking-wide">Đã duyệt</span>
          </div>
        </div>
        <MiniDefectBar unresolved={unresolved} inProgress={inProgress} resolved={resolved} />
      </div>

      {/* Doc completeness */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-1.5">
          <FileCheck className="w-3.5 h-3.5 text-slate-500" />
          <span className="text-xs text-slate-400">Hồ sơ kỹ thuật</span>
        </div>
        <div className="flex items-center gap-1">
          {PLAN_TYPES.map((_, i) => (
            <div
              key={i}
              className={`w-2.5 h-2.5 rounded-sm ${i < docCompleteness ? 'bg-sky-400' : 'bg-slate-700'}`}
            />
          ))}
          <span className="text-xs text-slate-400 ml-1">{docCompleteness}/5</span>
        </div>
      </div>

      {/* Leader + CTA */}
      <div className="flex items-center justify-between pt-1 border-t border-slate-700/50">
        <div className="text-xs text-slate-500">
          <span className="text-slate-400 font-medium">{project.leader}</span>
          <span className="text-slate-600"> · PM</span>
        </div>
        <button
          onClick={onOpen}
          className="flex items-center gap-1.5 text-xs font-semibold text-sky-400 hover:text-sky-300 hover:bg-sky-500/10 px-3 py-1.5 rounded-lg transition-all duration-200 border border-sky-500/20 hover:border-sky-400/40"
        >
          Vào dự án
          <ArrowRight className="w-3 h-3" />
        </button>
      </div>
    </div>
  );
}

// ─── Main Component ────────────────────────────────────────────────────────────
export default function CEODashboard({
  projects,
  floorPlans,
  markerNotes,
  onOpenProject,
  onClose,
}: CEODashboardProps) {
  const now = useCurrentTime();

  const activeProjects = projects.filter((p) => !p.status || p.status === 'active');

  const allStats: ProjectStats[] = activeProjects.map((p) =>
    computeProjectStats(p, floorPlans, markerNotes)
  );

  const totalDefects = allStats.reduce((s, x) => s + x.totalDefects, 0);
  const totalResolved = allStats.reduce((s, x) => s + x.resolved, 0);
  const totalUnresolved = allStats.reduce((s, x) => s + x.unresolved, 0);
  const resolvedPct = totalDefects > 0 ? Math.round((totalResolved / totalDefects) * 100) : 0;
  const criticalProjects = allStats.filter((s) => s.healthStatus === 'critical').length;
  const avgProgress =
    activeProjects.length > 0
      ? Math.round(activeProjects.reduce((s, p) => s + p.progress, 0) / activeProjects.length)
      : 0;

  const urgentProjects = allStats.filter((s) => s.unresolved > 10);

  return (
    <div className="min-h-screen flex flex-col bg-slate-950 overflow-hidden">
      {/* Background grid */}
      <div
        className="absolute inset-0 opacity-[0.03] pointer-events-none"
        style={{
          backgroundImage:
            'linear-gradient(rgba(148,163,184,1) 1px, transparent 1px), linear-gradient(90deg, rgba(148,163,184,1) 1px, transparent 1px)',
          backgroundSize: '40px 40px',
        }}
      />
      {/* Top gradient glow */}
      <div className="absolute top-0 left-1/2 -translate-x-1/2 w-[600px] h-[200px] bg-sky-500/10 blur-3xl rounded-full pointer-events-none" />

      {/* ── HEADER ── */}
      <header className="relative z-10 flex items-center justify-between px-8 py-5 border-b border-slate-800/80 backdrop-blur-sm bg-slate-950/80">
        <div className="flex items-center gap-4">
          <div className="flex items-center justify-center w-10 h-10 rounded-xl bg-sky-500/15 border border-sky-500/30">
            <Activity className="w-5 h-5 text-sky-400" />
          </div>
          <div>
            <h1 className="text-xl font-bold tracking-tight text-white">
              CEO Command Center
            </h1>
            <p className="text-xs text-slate-400 tracking-wider">{formatDate(now)}</p>
          </div>
        </div>

        <div className="flex items-center gap-6">
          <div className="text-right">
            <p className="text-2xl font-bold tabular-nums text-white tracking-tight">
              {formatTime(now)}
            </p>
            <p className="text-xs text-sky-400 font-semibold tracking-widest uppercase">
              {getGreeting(now)}, CEO
            </p>
          </div>
          <button
            onClick={onClose}
            className="flex items-center justify-center w-10 h-10 rounded-xl bg-slate-800 border border-slate-700 hover:bg-rose-500/20 hover:border-rose-500/50 text-slate-400 hover:text-rose-400 transition-all duration-200"
          >
            <X className="w-5 h-5" />
          </button>
        </div>
      </header>

      {/* ── SCROLLABLE BODY ── */}
      <main className="relative z-10 flex-1 overflow-y-auto px-8 py-6 space-y-6">

        {/* Alert Banner */}
        {urgentProjects.length > 0 && (
          <div className="flex items-center gap-3 px-5 py-3.5 rounded-xl bg-rose-500/15 border border-rose-500/40 text-rose-300 animate-pulse">
            <Zap className="w-5 h-5 text-rose-400 shrink-0" />
            <span className="font-bold text-sm">
              🚨 {urgentProjects.length} dự án cần can thiệp ngay — hơn 10 lỗi chưa xử lý!
            </span>
            <div className="ml-auto flex gap-2">
              {urgentProjects.map((s) => (
                <span
                  key={s.project.id}
                  className="text-xs bg-rose-500/20 border border-rose-500/30 px-2 py-0.5 rounded-full font-semibold"
                >
                  {s.project.name}
                </span>
              ))}
            </div>
          </div>
        )}

        {/* KPI Cards */}
        <section>
          <p className="text-xs text-slate-500 font-semibold tracking-widest uppercase mb-3">
            Tổng quan hoạt động
          </p>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            <KpiCard
              icon={<Folders className="w-5 h-5" />}
              label="Dự án đang chạy"
              value={activeProjects.length}
              sub="Dự án đang hoạt động"
              accent="sky"
              trend="neutral"
            />
            <KpiCard
              icon={<AlertTriangle className="w-5 h-5" />}
              label="Tổng lỗi ghi nhận"
              value={totalDefects}
              sub={`${totalUnresolved} chưa xử lý`}
              accent="rose"
              trend={totalUnresolved > 20 ? 'down' : 'neutral'}
            />
            <KpiCard
              icon={<CheckCircle2 className="w-5 h-5" />}
              label="Tỉ lệ đã duyệt"
              value={`${resolvedPct}%`}
              sub={`${totalResolved} / ${totalDefects} lỗi`}
              accent="emerald"
              trend={resolvedPct > 60 ? 'up' : 'down'}
            />
            <KpiCard
              icon={<ShieldAlert className="w-5 h-5" />}
              label="Dự án khẩn cấp"
              value={criticalProjects}
              sub="Lỗi chưa xử lý > 7"
              accent="amber"
              trend={criticalProjects > 0 ? 'down' : 'up'}
            />
          </div>
        </section>

        {/* Project Grid */}
        <section>
          <div className="flex items-center justify-between mb-3">
            <p className="text-xs text-slate-500 font-semibold tracking-widest uppercase">
              Bản đồ dự án ({activeProjects.length})
            </p>
            <div className="flex items-center gap-4 text-xs text-slate-500">
              <span className="flex items-center gap-1.5"><span className="w-2 h-2 rounded-full bg-emerald-500 inline-block" /> Tốt</span>
              <span className="flex items-center gap-1.5"><span className="w-2 h-2 rounded-full bg-amber-400 inline-block" /> Cần chú ý</span>
              <span className="flex items-center gap-1.5"><span className="w-2 h-2 rounded-full bg-rose-500 inline-block" /> Khẩn cấp</span>
            </div>
          </div>
          {activeProjects.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-20 text-slate-500">
              <Folders className="w-12 h-12 mb-3 opacity-30" />
              <p className="text-sm">Không có dự án nào đang hoạt động</p>
            </div>
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
              {allStats.map((stats) => (
                <ProjectCard
                  key={stats.project.id}
                  stats={stats}
                  onOpen={() => onOpenProject(stats.project.id)}
                />
              ))}
            </div>
          )}
        </section>

        {/* Bottom Summary Bar */}
        <section className="rounded-2xl border border-slate-700/50 bg-slate-800/40 backdrop-blur-sm p-5">
          <div className="flex flex-col lg:flex-row items-start lg:items-center gap-6">
            {/* Avg progress */}
            <div className="flex items-center gap-4">
              <div className="flex items-center justify-center w-12 h-12 rounded-xl bg-sky-500/10 border border-sky-500/20 shrink-0">
                <TrendingUp className="w-6 h-6 text-sky-400" />
              </div>
              <div>
                <p className="text-xs text-slate-400 tracking-widest uppercase">Tiến độ trung bình</p>
                <p className="text-3xl font-bold text-white tabular-nums">{avgProgress}%</p>
              </div>
            </div>

            {/* Divider */}
            <div className="hidden lg:block w-px h-14 bg-slate-700/60" />

            {/* Defect summary chart */}
            <div className="flex-1 min-w-0">
              <p className="text-xs text-slate-400 tracking-widest uppercase mb-3">
                Phân tích lỗi toàn hệ thống
              </p>
              <div className="flex items-center gap-3">
                <div className="flex-1 h-3 bg-slate-700 rounded-full overflow-hidden flex">
                  {totalDefects > 0 && (
                    <>
                      <div
                        className="h-full bg-rose-500 transition-all duration-1000"
                        style={{ width: `${(totalUnresolved / totalDefects) * 100}%` }}
                        title={`Chưa sửa: ${totalUnresolved}`}
                      />
                      <div
                        className="h-full bg-amber-400 transition-all duration-1000"
                        style={{
                          width: `${
                            ((totalDefects - totalResolved - totalUnresolved) / totalDefects) * 100
                          }%`,
                        }}
                        title="Đang sửa"
                      />
                      <div
                        className="h-full bg-emerald-500 transition-all duration-1000"
                        style={{ width: `${(totalResolved / totalDefects) * 100}%` }}
                        title={`Đã duyệt: ${totalResolved}`}
                      />
                    </>
                  )}
                  {totalDefects === 0 && <div className="h-full w-full bg-slate-600" />}
                </div>
                <div className="flex items-center gap-4 shrink-0 text-xs">
                  <span className="flex items-center gap-1.5 text-rose-400 font-semibold">
                    <span className="w-2.5 h-2.5 rounded-sm bg-rose-500 inline-block" />
                    {totalUnresolved} chưa sửa
                  </span>
                  <span className="flex items-center gap-1.5 text-emerald-400 font-semibold">
                    <span className="w-2.5 h-2.5 rounded-sm bg-emerald-500 inline-block" />
                    {totalResolved} đã duyệt
                  </span>
                </div>
              </div>
            </div>

            {/* Divider */}
            <div className="hidden lg:block w-px h-14 bg-slate-700/60" />

            {/* Export button */}
            <button
              onClick={() =>
                alert(
                  `📊 Báo cáo tổng hợp\n\nDự án: ${activeProjects.length}\nTiến độ TB: ${avgProgress}%\nTổng lỗi: ${totalDefects}\nĐã duyệt: ${totalResolved} (${resolvedPct}%)\nChưa xử lý: ${totalUnresolved}\nKhẩn cấp: ${criticalProjects} dự án`
                )
              }
              className="flex items-center gap-2 px-5 py-3 rounded-xl bg-sky-500 hover:bg-sky-400 text-white font-bold text-sm transition-all duration-200 shadow-lg shadow-sky-900/40 hover:shadow-sky-800/60 hover:scale-105 shrink-0"
            >
              <Download className="w-4 h-4" />
              Xuất báo cáo tổng
            </button>
          </div>
        </section>
      </main>

      {/* Footer */}
      <footer className="relative z-10 flex items-center justify-between px-8 py-3 border-t border-slate-800/60 bg-slate-950/80 backdrop-blur-sm">
        <div className="flex items-center gap-2 text-xs text-slate-600">
          <BarChart3 className="w-3.5 h-3.5" />
          <span>CEO Command Center — Dữ liệu cập nhật theo thời gian thực</span>
        </div>
        <div className="flex items-center gap-1.5 text-xs text-slate-600">
          <Clock className="w-3.5 h-3.5" />
          <span>Cập nhật lúc {formatTime(now)}</span>
        </div>
      </footer>
    </div>
  );
}
