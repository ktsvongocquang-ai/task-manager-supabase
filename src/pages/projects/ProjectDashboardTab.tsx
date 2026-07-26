import React, { useMemo } from 'react';
import { AlertTriangle, CheckCircle2, Clock, FileText, FolderOpen, Link as LinkIcon, Target, UserRound, ListCheck } from 'lucide-react';
import { format, isBefore, parseISO, startOfDay } from 'date-fns';
import { type Project, type Task } from '../../types';
import { DEFAULT_PHASES, detectPhase } from '../../utils/phaseUtils';
import { ProjectTimelineTab } from './ProjectTimelineTab';
import { ProjectTasksTab } from './ProjectTasksTab';

interface ProjectDashboardTabProps {
  project: Project | null;
  tasks: Task[];
  profiles: any[];
  currentUserProfile?: any;
  onToggleComplete?: (task: Task) => void;
  onEditTask: (task: Task) => void;
  onDeleteTask?: (taskId: string) => void;
  onCopyTask?: (task: Task) => void;
  onAddTask: (projectId: string, parentId?: string, target?: string) => void;
  onUpdateAssignee?: (taskId: string, assigneeId: string) => void;
  onBulkAddTasks?: (projectId: string, taskNames: string[], target?: string) => void;
  onUpdateTaskField?: (taskId: string, field: string, value: any) => Promise<void>;
  onSwitchTab?: (tab: 'dashboard' | 'tasks' | 'info' | 'timeline') => void;
  onClose?: () => void;
  managerName?: string;
  onUpdateProjectStats?: () => void;
  canEdit: boolean;
}

export const ProjectDashboardTab: React.FC<ProjectDashboardTabProps> = ({
  project,
  tasks,
  profiles,
  currentUserProfile,
  onToggleComplete,
  onEditTask,
  onDeleteTask,
  onCopyTask,
  onAddTask,
  onUpdateAssignee,
  onBulkAddTasks,
  onUpdateTaskField,
  onSwitchTab,
  onClose,
  managerName,
  onUpdateProjectStats,
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

    const projectTasks = tasks.filter(t => t.project_id === project.id && !(t.status || '').includes('Chờ kích hoạt') && !(t.status || '').includes('Dự thảo'));
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
    <div className="h-full overflow-y-auto custom-scrollbar bg-slate-50/60 p-2.5 sm:p-3 space-y-2.5 text-xs">
      {/* ── Top Section: Project Overview & KPIs ── */}
      <div className="grid grid-cols-1 xl:grid-cols-[1.3fr_0.7fr] gap-2.5">
        <section className="bg-white rounded-xl border border-slate-200/80 shadow-2xs p-3">
          <div className="flex items-center justify-between gap-3 mb-2">
            <div className="min-w-0 flex items-center gap-2">
              <span className="px-2 py-0.5 rounded-md bg-slate-100 text-slate-700 text-[10px] font-bold font-mono">{project.project_code}</span>
              <span className={`px-2 py-0.5 rounded-md border text-[10px] font-bold ${health.color}`}>{health.label}</span>
              <h3 className="text-base font-bold text-slate-900 truncate">{project.name}</h3>
            </div>
            <div className="flex items-center gap-2 shrink-0">
              <span className="text-[11px] font-bold text-slate-500">Tiến độ:</span>
              <div className="w-24 h-2 rounded-full bg-slate-100 overflow-hidden">
                <div className="h-full rounded-full bg-indigo-600" style={{ width: `${data.overallPct}%` }} />
              </div>
              <span className="text-xs font-bold text-slate-800">{data.overallPct}%</span>
            </div>
          </div>

          <div className="grid grid-cols-2 md:grid-cols-4 gap-2 pt-1 border-t border-slate-100">
            <InfoTile icon={<UserRound className="w-3.5 h-3.5" />} label="Người phụ trách" value={manager?.full_name || 'Chưa gán'} />
            <InfoTile icon={<FolderOpen className="w-3.5 h-3.5" />} label="Loại dự án" value={project.project_type || otherInfo.project_type || 'Chưa rõ'} />
            <InfoTile icon={<Clock className="w-3.5 h-3.5" />} label="Thời gian" value={`${fmtDate(project.start_date)} → ${fmtDate(project.end_date)}`} />
            <InfoTile icon={<Target className="w-3.5 h-3.5" />} label="Quy mô" value={project.scale || otherInfo.scale || (project.area_sqm ? `${project.area_sqm} m²` : 'Chưa có')} />
          </div>
        </section>

        <section className="grid grid-cols-2 gap-2">
          <KpiCard label="Tổng việc" value={data.parentTasks.length} tone="slate" />
          <KpiCard label="Hoàn thành" value={data.completed.length} tone="emerald" />
          <KpiCard label="Sắp tới 7 ngày" value={data.dueSoon.length} tone="indigo" />
          <KpiCard label="Quá hạn" value={data.overdue.length} tone="rose" />
        </section>
      </div>

      {/* ── Middle Section: Links ── */}
      <section className="bg-white rounded-xl border border-slate-200/80 shadow-2xs p-3">
        <h3 className="text-xs font-bold text-slate-800 flex items-center gap-1.5 mb-2">
          <FileText className="w-3.5 h-3.5 text-indigo-600" /> Hồ sơ & Liên kết
        </h3>
        <div className="space-y-1.5">
          {links.map(link => (
            <a key={link.label} href={link.value} target="_blank" rel="noreferrer" className="flex items-center justify-between gap-2 rounded-lg border border-slate-100 px-2.5 py-1.5 hover:bg-slate-50 text-xs">
              <span className="font-bold text-slate-700">{link.label}</span>
              <LinkIcon className="w-3 h-3 text-slate-400" />
            </a>
          ))}
          {links.length === 0 && <p className="text-[11px] text-slate-400 py-3 text-center">Chưa có link hồ sơ.</p>}
        </div>
      </section>

      {/* ── Section: Interactive Tasks List ── */}
      <section className="bg-white rounded-xl border border-slate-200/80 shadow-2xs overflow-hidden">
        <div className="p-0">
          <ProjectTasksTab 
            isOpen={true}
            onClose={onClose || (() => {})}
            project={project}
            tasks={tasks}
            profiles={profiles}
            currentUserProfile={currentUserProfile}
            onToggleComplete={onToggleComplete || (() => {})}
            onAddTask={onAddTask}
            onEditTask={onEditTask}
            onDeleteTask={onDeleteTask || (() => {})}
            onCopyTask={onCopyTask || (() => {})}
            onUpdateAssignee={onUpdateAssignee || (() => {})}
            onBulkAddTasks={onBulkAddTasks}
            onUpdateTaskField={onUpdateTaskField}
            canEdit={canEdit}
            hideStats={true}
          />
        </div>
      </section>

      {/* ── Section: Timeline & Progress ── */}
      <section className="bg-white rounded-xl border border-slate-200/80 shadow-2xs overflow-hidden">
        <div className="px-3 py-2 bg-slate-100/80 border-b border-slate-200/80 flex items-center justify-between">
          <h3 className="text-xs font-bold text-slate-800 flex items-center gap-1.5">
            <Clock className="w-3.5 h-3.5 text-emerald-600" /> Bảng Tiến Độ & Timeline Dự Án
          </h3>
          <button type="button" onClick={() => onSwitchTab?.('timeline')} className="text-[11px] font-bold text-emerald-600 hover:text-emerald-800 transition-colors">
            Chi tiết timeline →
          </button>
        </div>
        <div className="p-2">
          <ProjectTimelineTab 
            isOpen={true}
            onClose={onClose || (() => {})}
            project={project}
            tasks={tasks}
            managerName={managerName}
            onUpdateProject={onUpdateProjectStats}
            onEditTask={onEditTask}
          />
        </div>
      </section>

      {/* ── Bottom Section: Task Alerts & Completed ── */}
      <div className="grid grid-cols-1 xl:grid-cols-2 gap-2.5">
        <TaskList title="Việc cần chú ý" icon={<AlertTriangle className="w-3.5 h-3.5 text-rose-500" />} tasks={[...data.overdue, ...data.dueSoon].slice(0, 8)} profiles={profiles} onEditTask={onEditTask} empty="Không có việc gấp." />
        <TaskList title="Vừa hoàn thành" icon={<CheckCircle2 className="w-3.5 h-3.5 text-emerald-500" />} tasks={data.completed.slice(0, 8)} profiles={profiles} onEditTask={onEditTask} empty="Chưa có việc hoàn thành." />
      </div>
    </div>
  );
};

function KpiCard({ label, value, tone }: { label: string; value: number; tone: 'slate' | 'emerald' | 'indigo' | 'rose' }) {
  const tones = {
    slate: 'text-slate-800 bg-slate-100',
    emerald: 'text-emerald-700 bg-emerald-50',
    indigo: 'text-indigo-700 bg-indigo-50',
    rose: 'text-rose-700 bg-rose-50',
  };
  return (
    <div className="bg-white rounded-xl border border-slate-200/80 shadow-2xs p-2.5 flex flex-col justify-between">
      <p className="text-[9px] text-slate-400 font-bold uppercase tracking-wider">{label}</p>
      <p className={`text-xl font-extrabold mt-1 rounded-lg px-2.5 py-1 text-right ${tones[tone]}`}>{value}</p>
    </div>
  );
}

function InfoTile({ icon, label, value }: { icon: React.ReactNode; label: string; value: string }) {
  return (
    <div className="rounded-lg border border-slate-100 bg-slate-50/60 p-2 flex items-center gap-2">
      <span className="w-6 h-6 rounded bg-white text-indigo-600 flex items-center justify-center shadow-2xs shrink-0">{icon}</span>
      <div className="min-w-0">
        <p className="text-[9px] text-slate-400 font-bold uppercase leading-none">{label}</p>
        <p className="text-[11px] font-bold text-slate-800 truncate leading-tight mt-0.5">{value}</p>
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
    <section className="bg-white rounded-xl border border-slate-200/80 shadow-2xs p-3">
      <h3 className="text-xs font-bold text-slate-800 flex items-center gap-1.5 mb-2">{icon} {title}</h3>
      <div className="space-y-1">
        {tasks.map(task => {
          const assigneeId = Array.isArray(task.assignee_id) ? task.assignee_id[0] : task.assignee_id;
          const assignee = profiles.find(p => p.id === assigneeId);
          return (
            <button key={task.id} onClick={() => onEditTask(task)} className="w-full text-left rounded-lg border border-slate-100 px-2.5 py-1.5 hover:bg-slate-50 transition-colors flex items-center justify-between gap-2 text-xs">
              <div className="min-w-0 flex items-center gap-2">
                <span className="font-bold text-slate-800 truncate">{task.name}</span>
                <span className="text-[10px] text-slate-400 shrink-0 font-mono">({task.task_code || '--'})</span>
              </div>
              <div className="flex items-center gap-2 shrink-0 text-[10px] text-slate-500 font-semibold">
                <span>{assignee?.full_name || 'Chưa gán'}</span>
                <span className="text-slate-300">•</span>
                <span>{task.due_date ? format(parseISO(task.due_date), 'dd/MM') : '--'}</span>
              </div>
            </button>
          );
        })}
        {tasks.length === 0 && <p className="text-[11px] text-slate-400 py-3 text-center">{empty}</p>}
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
