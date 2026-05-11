const fs = require('fs');

const filepath = "c:\\Users\\DELL\\.gemini\\antigravity\\scratch\\dqh\\task-manager-supabase\\src\\pages\\tasks\\WeeklyView.tsx";
const content = fs.readFileSync(filepath, 'utf8');

const new_component_start = `export const WeeklyView = ({ tasks, projects, profiles, onRefresh, onAddTask }: Props) => {
    const [weekOffset, setWeekOffset] = useState(0)
    const [sortMode, setSortMode]     = useState<'time' | 'project' | 'person' | 'alert'>('time')
    const [filterPerson, setFilterPerson]   = useState('')
    const [filterProject, setFilterProject] = useState('')
    const [saving, setSaving] = useState<Record<string, boolean>>({})
    const [collapsedGroups, setCollapsedGroups] = useState<Record<string, boolean>>({})

    const { mon, sun } = getWeekRange(weekOffset)
    const wn = getWeekNum(mon)

    const toggleGroup = (key: string) => {
        setCollapsedGroups(prev => ({ ...prev, [key]: !prev[key] }))
    }

    const getAssigneeId = (id: string | string[] | null): string => {
        if (!id) return ''
        return Array.isArray(id) ? id[0] : id
    }

    const getAssigneeName = (id: string | string[] | null) => {
        if (!id) return 'Chưa gán'
        const resolvedId = Array.isArray(id) ? id[0] : id
        return profiles.find(p => p.id === resolvedId)?.full_name || 'N/A'
    }

    const getProjectName = (id: string) => {
        return projects.find(p => p.id === id)?.name || ''
    }
    const getProjectCode = (id: string) => {
        return (projects.find(p => p.id === id) as any)?.project_code || ''
    }

    const weekTasks = useMemo(() => {
        const monStr = format(mon, 'yyyy-MM-dd')
        const sunStr = format(sun, 'yyyy-MM-dd')
        return tasks.filter(t => {
            if (!t.due_date) return false
            const startRaw = ((t as any).start_date || t.due_date) as string
            const startStr = startRaw.substring(0, 10)
            const dueStr = t.due_date.substring(0, 10)
            
            const spansWeek = startStr <= sunStr && dueStr >= monStr
            const isOverdue = dueStr < monStr && t.status !== 'Hoàn thành' && t.status !== 'Lưu trữ'
            if (!spansWeek && !isOverdue) return false
            
            const assigneeId = getAssigneeId(t.assignee_id)
            if (filterPerson  && assigneeId !== filterPerson)  return false
            if (filterProject && t.project_id  !== filterProject) return false
            return true
        })
    }, [tasks, weekOffset, filterPerson, filterProject, mon, sun])

    const stats = {
        total:   weekTasks.length,
        done:    weekTasks.filter(t => t.status === 'Hoàn thành').length,
        inprog:  weekTasks.filter(t => t.status === 'Đang thực hiện').length,
        pending: weekTasks.filter(t => t.status === 'Chưa bắt đầu' || t.status === 'Cần làm').length,
        overdue: weekTasks.filter(t => t.due_date && new Date(t.due_date) < TODAY && t.status !== 'Hoàn thành').length,
    }

    const alerts = useMemo(() => weekTasks.filter(t => {
        if (!t.due_date) return false
        const d = new Date(t.due_date)
        return (d < TODAY && t.status !== 'Hoàn thành') ||
               (diffDays(TODAY, d) <= 1 && t.status !== 'Hoàn thành')
    }), [weekTasks])

    const groupedTasks = useMemo(() => {
        const sourceList = sortMode === 'alert' ? alerts : weekTasks;
        let groups: { key: string, label: string, tasks: Task[], isLateGroup?: boolean, defaultValues?: any }[] = [];

        if (sortMode === 'time' || sortMode === 'alert') {
            const lateTasks = sourceList.filter(t => new Date(t.due_date!) < mon);
            if (lateTasks.length > 0) {
                groups.push({ key: 'Trễ hạn', label: 'Trễ hạn', tasks: lateTasks.sort((a,b) => (a.due_date||'').localeCompare(b.due_date||'')), isLateGroup: true });
            }
            for (let i = 0; i < 7; i++) {
                const d = new Date(mon); d.setDate(mon.getDate() + i);
                const dStr = format(d, 'yyyy-MM-dd');
                const key = \`\${DAY_FULL[d.getDay()]} \${fmtShort(d)}\`;
                const dayTasks = sourceList.filter(t => {
                    const tDate = new Date(t.due_date!);
                    if (tDate < mon) return false; 
                    return t.due_date!.substring(0, 10) === dStr;
                }).sort((a,b) => (a.due_date||'').localeCompare(b.due_date||''));
                
                groups.push({ key, label: key, tasks: dayTasks, defaultValues: { start_date: dStr, due_date: dStr } });
            }
        } else if (sortMode === 'project') {
            const projectIds = Array.from(new Set(sourceList.map(t => t.project_id)));
            groups = projectIds.map(pid => {
                const label = \`\${getProjectCode(pid)} - \${getProjectName(pid)}\`;
                const tks = sourceList.filter(t => t.project_id === pid).sort((a,b) => (a.due_date||'').localeCompare(b.due_date||''));
                return { key: pid, label, tasks: tks, defaultValues: { project_id: pid } };
            }).sort((a, b) => a.label.localeCompare(b.label));
        } else if (sortMode === 'person') {
            const personIds = Array.from(new Set(sourceList.map(t => getAssigneeId(t.assignee_id))));
            groups = personIds.map(pid => {
                const label = getAssigneeName(pid);
                const tks = sourceList.filter(t => getAssigneeId(t.assignee_id) === pid).sort((a,b) => (a.due_date||'').localeCompare(b.due_date||''));
                return { key: pid, label, tasks: tks, defaultValues: { assignee_id: pid } };
            }).sort((a, b) => a.label.localeCompare(b.label));
        }

        return groups;
    }, [weekTasks, alerts, sortMode, mon])

    const updateProgress = async (taskId: string, delta: number) => {`;

const new_component_render = `
            {/* ── Table Header ── */}
            <div className="hidden md:grid grid-cols-[1fr_64px_100px_120px_110px] gap-2 px-5 py-2 bg-slate-50 border-b border-slate-100">
                {['Nhiệm vụ', 'Hạn chót', 'Tiến độ', 'Phụ trách', 'Trạng thái'].map(h => (
                    <span key={h} className="text-[10px] font-semibold text-slate-400 uppercase tracking-wide">{h}</span>
                ))}
            </div>

            {/* ── Task Rows ── */}
            {weekTasks.length === 0 ? (
                <div className="flex flex-col items-center justify-center py-16 text-slate-400">
                    <CalendarDays size={32} className="mb-3 opacity-40" />
                    <div className="text-sm">Không có task trong tuần này</div>
                </div>
            ) : (
                <div className="pb-8">
                    {groupedTasks.map(group => {
                        const isCollapsed = collapsedGroups[group.key];
                        return (
                            <div key={group.key} className="mb-2">
                                {/* Group Header */}
                                <div className={\`flex items-center justify-between px-5 py-2 \${group.isLateGroup ? 'bg-red-50 border-red-200 text-red-700' : 'bg-slate-100 border-slate-200 text-slate-800'} border-y sticky top-0 z-10 shadow-sm\`}>
                                    <div 
                                        className="flex items-center gap-2 cursor-pointer flex-1"
                                        onClick={() => toggleGroup(group.key)}
                                    >
                                        {isCollapsed ? <ChevronRight size={16} className={group.isLateGroup ? 'text-red-400' : 'text-slate-400'} /> : <ChevronDown size={16} className={group.isLateGroup ? 'text-red-400' : 'text-slate-400'} />}
                                        <span className={\`text-sm font-bold uppercase tracking-wide \${group.isLateGroup ? 'text-red-700' : 'text-slate-700'}\`}>
                                            {group.label}
                                        </span>
                                        <span className="text-[11px] font-medium px-2 py-0.5 rounded-full bg-white border border-slate-200 text-slate-500">
                                            {group.tasks.length}
                                        </span>
                                    </div>
                                    
                                    {onAddTask && (
                                        <button 
                                            onClick={() => onAddTask(group.defaultValues)}
                                            className="text-[11px] font-bold text-emerald-600 hover:text-emerald-700 hover:bg-emerald-100 bg-emerald-50 px-2.5 py-1.5 rounded transition-colors flex items-center gap-1 border border-emerald-200 shrink-0"
                                        >
                                            + thêm task nhanh
                                        </button>
                                    )}
                                </div>

                                {/* Group Tasks */}
                                {!isCollapsed && (
                                    <div className="bg-white">
                                        {group.tasks.length === 0 ? (
                                            <div className="px-5 py-3 text-xs text-slate-400 italic">Không có nhiệm vụ</div>
                                        ) : (
                                            group.tasks.map(t => {
                                                const d = new Date(t.due_date!)
                                                const isLate = d < TODAY && t.status !== 'Hoàn thành'
                                                const isDone = t.status === 'Hoàn thành'
                                                const pct = t.completion_pct || 0
                                                const assigneeName = getAssigneeName(t.assignee_id)
                                                const badge = getStatusBadge(t.status)

                                                return (
                                                    <div key={t.id} className="border-b border-slate-50 last:border-0 hover:bg-slate-50/50 transition-colors">
                                                        {/* Mobile row */}
                                                        <div className="md:hidden flex items-start gap-3 px-4 py-2">
                                                            <div className="w-6 h-6 shrink-0 mt-0.5"><Avatar name={assigneeName} /></div>
                                                            <div className="flex-1 min-w-0">
                                                                <div className={\`text-xs font-semibold \${isDone ? 'line-through text-slate-400' : 'text-slate-800'} truncate\`}>{t.name || t.task_code || 'Chưa có tên'}</div>
                                                                <div className="flex items-center gap-1.5 mt-1 flex-wrap">
                                                                    <span className="text-[9px] font-semibold bg-slate-100 text-slate-500 px-1.5 py-0.5 rounded">{getProjectCode(t.project_id)}</span>
                                                                    <span className={\`text-[10px] font-medium \${isLate ? 'text-red-600' : 'text-slate-500'}\`}>{fmtShort(d)}</span>
                                                                    <span className={\`text-[9px] font-medium px-1.5 py-0.5 rounded \${badge.bg} \${badge.text}\`}>{badge.label}</span>
                                                                </div>
                                                                <div className="flex items-center gap-1 mt-1.5">
                                                                    <button onClick={() => updateProgress(t.id, -10)}
                                                                        className="w-5 h-5 text-xs rounded border border-slate-200 hover:bg-slate-50 flex items-center justify-center text-slate-600 leading-none">−</button>
                                                                    <div className="flex-1 h-1.5 bg-slate-100 rounded-full overflow-hidden">
                                                                        <div className={\`h-full rounded-full transition-all \${getPctColor(pct)}\`} style={{ width: \`\${pct}%\` }} />
                                                                    </div>
                                                                    <span className="text-[10px] font-medium text-slate-500 w-6 text-right">{pct}%</span>
                                                                    <button onClick={() => updateProgress(t.id, 10)}
                                                                        className="w-5 h-5 text-xs rounded border border-slate-200 hover:bg-slate-50 flex items-center justify-center text-slate-600 leading-none">+</button>
                                                                </div>
                                                            </div>
                                                        </div>

                                                        {/* Desktop row */}
                                                        <div className="hidden md:grid grid-cols-[1fr_64px_100px_120px_110px] gap-2 px-5 py-2 items-center">
                                                            <div className="min-w-0">
                                                                <div className={\`text-xs font-semibold truncate \${isDone ? 'line-through text-slate-400' : 'text-slate-800'}\`}>
                                                                    {t.name || t.task_code || 'Chưa có tên'}
                                                                </div>
                                                                <div className="text-[9px] text-slate-400 mt-0.5 uppercase tracking-wide">{getProjectCode(t.project_id)}</div>
                                                            </div>

                                                            <span className={\`text-[11px] font-semibold \${isLate ? 'text-red-600' : 'text-slate-600'}\`}>
                                                                {fmtShort(d)}
                                                            </span>

                                                            <div>
                                                                <div className="flex items-center gap-1 mb-1">
                                                                    <button onClick={() => updateProgress(t.id, -10)}
                                                                        className="w-4 h-4 text-[10px] rounded border border-slate-200 hover:bg-slate-100 flex items-center justify-center text-slate-600 leading-none">−</button>
                                                                    <span className="text-[10px] font-semibold text-slate-700 w-6 text-center">
                                                                        {saving[t.id] ? '...' : \`\${pct}%\`}
                                                                    </span>
                                                                    <button onClick={() => updateProgress(t.id, 10)}
                                                                        className="w-4 h-4 text-[10px] rounded border border-slate-200 hover:bg-slate-100 flex items-center justify-center text-slate-600 leading-none">+</button>
                                                                </div>
                                                                <div className="h-1 bg-slate-100 rounded-full overflow-hidden">
                                                                    <div className={\`h-full rounded-full transition-all \${getPctColor(pct)}\`} style={{ width: \`\${pct}%\` }} />
                                                                </div>
                                                            </div>

                                                            <div className="flex items-center gap-1.5 min-w-0">
                                                                <div className="w-5 h-5 shrink-0"><Avatar name={assigneeName} /></div>
                                                                <span className="text-[11px] font-medium text-slate-600 truncate">{assigneeName}</span>
                                                            </div>

                                                            <span className={\`text-[10px] font-bold px-2 py-0.5 rounded-md \${badge.bg} \${badge.text} whitespace-nowrap text-center\`}>
                                                                {badge.label}
                                                            </span>
                                                        </div>
                                                    </div>
                                                )
                                            })
                                        )}
                                    </div>
                                )}
                            </div>
                        )
                    })}
                </div>
            )}
        </div>
    )
}`;

const start_idx = content.indexOf("export const WeeklyView = ({ tasks, projects, profiles, onRefresh");
const end_update_progress = content.indexOf("const updateProgress = async (taskId: string, delta: number) => {");
const end_table_header = content.indexOf("{/* ── Table Header ── */}");

let new_content = content.substring(0, start_idx) + new_component_start + content.substring(end_update_progress, end_table_header) + new_component_render;

if (!new_content.includes("ChevronDown")) {
    new_content = new_content.replace("ChevronRight, AlertTriangle", "ChevronRight, AlertTriangle, ChevronDown, ChevronUp");
}

fs.writeFileSync(filepath, new_content, "utf8");
console.log("WeeklyView.tsx refactored successfully.");
