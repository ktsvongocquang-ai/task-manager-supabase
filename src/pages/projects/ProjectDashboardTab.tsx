import React, { useMemo } from 'react';
import { AlertTriangle, CheckCircle2, Clock, FileText, FolderOpen, Link as LinkIcon, Target, UserRound } from 'lucide-react';
import { format, isBefore, parseISO, startOfDay } from 'date-fns';
import { type Project, type Task } from '../../types';
import { DEFAULT_PHASES, detectPhase } from '../../utils/phaseUtils';

interface ProjectDashboardTabProps {
  project: Project | null;
  tasks: Task[];
  profiles: any[];
  onEditTask: (task: Task) => void;
  onAddTask: (projectId: string, parentId?: string, target?: string) => void;
  canEdit: boolean;
}

export const ProjectDashboardTab: React.FC<ProjectDashboardTabProps> = ({
  project,
  tasks,
  profiles,
  onEditTask,
  onAddTask,
  canEdit,
}) => {
  const today = startOfDay(new Date());

  const data = useMemo(() => {
    if (!project) {
      return {
        projectTasks: [] as Task[],
        parentTasks: [] as Task[],
        completed: [] as Task[],
        overdue: [] as Task[],
        dueSoon: [] as Task[],
        phases: [] as Array<{ key: string; name: string; total: number; done: number; pct: number; late: number }>,
        overallPct: 0,
      };
    }

    const projectTasks = tasks.filter(t => t.project_id === project.id);
    const parentTasks = projectTasks.filter(t => !t.parent_id);
    const completed = parentTasks.filter(t => t.status?.includes('Hoàn thành') || t.status?.includes('HoÃ n thÃ nh'));
    const overdue = parentTasks.filter(t => {
      if (t.status?.includes('Hoàn thành') || t.status?.includes('HoÃ n thÃ nh')) return false;
      if (!t.due_date) return false;
      return isBefore(parseISO(t.due_date), today);
    });
    const dueSoon = parentTasks
      .filter(t => {
        if (t.status?.includes('Hoàn thành') || t.status?.includes('HoÃ n thÃ nh')) return false;
        if (!t.due_date) return false;
        const days = Math.ceil((parseISO(t.due_date).getTime() - today.getTime()) / 86400000);
        return days >= 0 && days <= 7;
      })
      .sort((a, b) => (a.due_date || '').localeCompare(b.due_date || ''))
      .slice(0, 6);

    const phases = DEFAULT_PHASES.map(phase => {
      const phaseTasks = parentTasks.filter(t => detectPhase(t) === phase.key);
      const done = phaseTasks.filter(t => t.status?.includes('Hoàn thành') || t.status?.includes('HoÃ n thÃ nh')).length;
      const late = phaseTasks.filter(t => {
        if (t.status?.includes('Hoàn thành') || t.status?.includes('HoÃ n thÃ nh')) return false;
        return !!t.due_date && isBefore(parseISO(t.due_date), today);
      }).length;
      return {
        key: phase.key,
        name: phase.name,
        total: phaseTasks.length,
        done,
        late,
        pct: phaseTasks.length ? Math.round((done / phaseTasks.length) * 100) : 0,
      };
    });

    const progressSum = parentTasks.reduce((sum, task) => sum + (task.completion_pct || 0), 0);
    const overallPct = parentTasks.length ? Math.round(progressSum / parentTasks.length) : 0;

    return { projectTasks, parentTasks, completed, overdue, dueSoon, phases, overallPct };
  }, [project, tasks]);

  if (!project) return null;

  const manager = profiles.find(p => p.id === project.manager_id);
  const otherInfo = safeJson(project.other_info);
  const links = [
    { label: 'Hiện trạng', value: (project as any).link_hien_trang || project.image_folder_link },
    { label: 'Hồ sơ dự án', value: (project as any).link_du_an || project.content_link },
    { label: 'Presentation', value: (project as any).link_presentation },
    { label: 'Video/Render', value: project.video_folder_link },
  ].filter(l => !!l.value);

  const health = data.overdue.length > 0
    ? { label: 'Cần xử lý', color: 'text-rose-700 bg-rose-50 border-rose-100' }
    : data.overallPct >= 80
      ? { label: 'Ổn định', color: 'text-emerald-700 bg-emerald-50 border-emerald-100' }
      : { label: 'Đang chạy', color: 'text-indigo-700 bg-indigo-50 border-indigo-100' };

  return (
    <div className="h-full overflow-y-auto custom-scrollbar bg-slate-50/60 p-4 md:p-6 space-y-4">
      <div className="grid grid-cols-1 xl:grid-cols-[1.2fr_0.8fr] gap-4">
        <section className="bg-white rounded-2xl border border-slate-200 shadow-sm p-5">
          <div className="flex flex-col md:flex-row md:items-start justify-between gap-4">
            <div className="min-w-0">
              <div className="flex items-center gap-2 flex-wrap">
                <span className="px-2.5 py-1 rounded-full bg-slate-100 text-slate-600 text-[10px] font-bold">{project.project_code}</span>
                <span className={`px-2.5 py-1 rounded-full border text-[10px] font-bold ${health.color}`}>{health.label}</span>
              </div>
              <h3 className="text-2xl font-bold text-slate-900 mt-3 truncate">{project.name}</h3>
              <p className="text-xs text-slate-500 mt-1 line-clamp-2">{project.description || 'Chưa có mô tả dự án.'}</p>
            </div>
            <div className="w-full md:w-44 shrink-0">
              <div className="flex justify-between text-xs font-bold text-slate-500 mb-1">
                <span>Tiến độ tổng</span>
                <span>{data.overallPct}%</span>
              </div>
              <div className="h-2 rounded-full bg-slate-100 overflow-hidden">
                <div className="h-full rounded-full bg-indigo-600" style={{ width: `${data.overallPct}%` }} />
              </div>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-3 mt-5">
            <InfoTile icon={<UserRound className="w-4 h-4" />} label="Người phụ trách" value={manager?.full_name || 'Chưa gán'} />
            <InfoTile icon={<FolderOpen className="w-4 h-4" />} label="Loại dự án" value={project.project_type || otherInfo.project_type || 'Chưa rõ'} />
            <InfoTile icon={<Clock className="w-4 h-4" />} label="Thời gian" value={`${fmtDate(project.start_date)} → ${fmtDate(project.end_date)}`} />
            <InfoTile icon={<Target className="w-4 h-4" />} label="Quy mô" value={project.scale || otherInfo.scale || project.area_sqm ? `${project.scale || otherInfo.scale || ''} ${project.area_sqm ? `• ${project.area_sqm} m2` : ''}` : 'Chưa có'} />
          </div>
        </section>

        <section className="grid grid-cols-2 gap-3">
          <KpiCard label="Tổng việc" value={data.parentTasks.length} tone="slate" />
          <KpiCard label="Hoàn thành" value={data.completed.length} tone="emerald" />
          <KpiCard label="Sắp tới 7 ngày" value={data.dueSoon.length} tone="indigo" />
          <KpiCard label="Quá hạn" value={data.overdue.length} tone="rose" />
        </section>
      </div>

      <div className="grid grid-cols-1 xl:grid-cols-[1fr_360px] gap-4">
        <section className="bg-white rounded-2xl border border-slate-200 shadow-sm p-5">
          <div className="flex items-center justify-between gap-3 mb-4">
            <h3 className="text-sm font-bold text-slate-800 flex items-center gap-2">
              <CheckCircle2 className="w-4 h-4 text-indigo-600" /> Tiến độ theo giai đoạn
            </h3>
            {canEdit && (
              <button onClick={() => onAddTask(project.id, undefined, 'concept')} className="px-3 py-1.5 rounded-lg bg-indigo-600 text-white text-xs font-bold hover:bg-indigo-700">+ Công việc</button>
            )}
          </div>
          <div className="space-y-3">
            {data.phases.map(phase => (
              <div key={phase.key} className="rounded-xl border border-slate-100 p-3">
                <div className="flex items-center justify-between gap-3">
                  <div className="min-w-0">
                    <p className="text-sm font-bold text-slate-800 truncate">{phase.name}</p>
                    <p className="text-[10px] text-slate-400 mt-0.5">{phase.done}/{phase.total} xong {phase.late > 0 ? `• ${phase.late} quá hạn` : ''}</p>
                  </div>
                  <span className="text-xs font-bold text-slate-500">{phase.pct}%</span>
                </div>
                <div className="h-2 rounded-full bg-slate-100 overflow-hidden mt-2">
                  <div className={`h-full rounded-full ${phase.late > 0 ? 'bg-rose-500' : 'bg-emerald-500'}`} style={{ width: `${phase.pct}%` }} />
                </div>
              </div>
            ))}
          </div>
        </section>

        <section className="bg-white rounded-2xl border border-slate-200 shadow-sm p-5">
          <h3 className="text-sm font-bold text-slate-800 flex items-center gap-2 mb-4">
            <FileText className="w-4 h-4 text-indigo-600" /> Hồ sơ & Liên kết
          </h3>
          <div className="space-y-2">
            {links.map(link => (
              <a key={link.label} href={link.value} target="_blank" rel="noreferrer" className="flex items-center justify-between gap-3 rounded-xl border border-slate-100 px-3 py-2 hover:bg-slate-50">
                <span className="text-xs font-bold text-slate-700">{link.label}</span>
                <LinkIcon className="w-3.5 h-3.5 text-slate-400" />
              </a>
            ))}
            {links.length === 0 && <p className="text-xs text-slate-400 py-6 text-center">Chưa có link hồ sơ.</p>}
          </div>
        </section>
      </div>

      <div className="grid grid-cols-1 xl:grid-cols-2 gap-4">
        <TaskList title="Việc cần chú ý" icon={<AlertTriangle className="w-4 h-4 text-rose-500" />} tasks={[...data.overdue, ...data.dueSoon].slice(0, 8)} profiles={profiles} onEditTask={onEditTask} empty="Không có việc gấp." />
        <TaskList title="Vừa hoàn thành" icon={<CheckCircle2 className="w-4 h-4 text-emerald-500" />} tasks={data.completed.slice(0, 8)} profiles={profiles} onEditTask={onEditTask} empty="Chưa có việc hoàn thành." />
      </div>
    </div>
  );
};

function KpiCard({ label, value, tone }: { label: string; value: number; tone: 'slate' | 'emerald' | 'indigo' | 'rose' }) {
  const tones = {
    slate: 'text-slate-800 bg-slate-50',
    emerald: 'text-emerald-700 bg-emerald-50',
    indigo: 'text-indigo-700 bg-indigo-50',
    rose: 'text-rose-700 bg-rose-50',
  };
  return (
    <div className="bg-white rounded-2xl border border-slate-200 shadow-sm p-4">
      <p className="text-[10px] text-slate-400 font-bold uppercase">{label}</p>
      <p className={`text-2xl font-bold mt-2 rounded-xl px-3 py-2 ${tones[tone]}`}>{value}</p>
    </div>
  );
}

function InfoTile({ icon, label, value }: { icon: React.ReactNode; label: string; value: string }) {
  return (
    <div className="rounded-xl border border-slate-100 bg-slate-50/60 p-3 flex items-center gap-3">
      <span className="w-8 h-8 rounded-lg bg-white text-indigo-600 flex items-center justify-center shadow-sm">{icon}</span>
      <div className="min-w-0">
        <p className="text-[10px] text-slate-400 font-bold uppercase">{label}</p>
        <p className="text-xs font-bold text-slate-800 truncate">{value}</p>
      </div>
    </div>
  );
}

function TaskList({ title, icon, tasks, profiles, onEditTask, empty }: {
  title: string;
  icon: React.ReactNode;
  tasks: Task[];
  profiles: any[];
  onEditTask: (task: Task) => void;
  empty: string;
}) {
  return (
    <section className="bg-white rounded-2xl border border-slate-200 shadow-sm p-5">
      <h3 className="text-sm font-bold text-slate-800 flex items-center gap-2 mb-4">{icon} {title}</h3>
      <div className="space-y-2">
        {tasks.map(task => {
          const assigneeId = Array.isArray(task.assignee_id) ? task.assignee_id[0] : task.assignee_id;
          const assignee = profiles.find(p => p.id === assigneeId);
          return (
            <button key={task.id} onClick={() => onEditTask(task)} className="w-full text-left rounded-xl border border-slate-100 px-3 py-2 hover:bg-slate-50">
              <div className="flex items-center justify-between gap-3">
                <p className="text-xs font-bold text-slate-800 truncate">{task.name}</p>
                <span className="text-[10px] text-slate-400 shrink-0">{task.due_date ? format(parseISO(task.due_date), 'dd/MM') : '--'}</span>
              </div>
              <p className="text-[10px] text-slate-400 mt-1 truncate">{task.task_code || '--'} • {assignee?.full_name || 'Chưa gán'}</p>
            </button>
          );
        })}
        {tasks.length === 0 && <p className="text-xs text-slate-400 py-6 text-center">{empty}</p>}
      </div>
    </section>
  );
}

function fmtDate(value?: string | null) {
  if (!value) return '--';
  try { return format(parseISO(value), 'dd/MM/yyyy'); } catch { return value; }
}

function safeJson(value?: string | null) {
  if (!value) return {} as any;
  try { return JSON.parse(value); } catch { return {} as any; }
}
