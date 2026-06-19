const fs = require('fs');
const path = require('path');

const ganttPath = path.join(__dirname, 'src/pages/gantt/Gantt.tsx');
let content = fs.readFileSync(ganttPath, 'utf8');

// 1. Remove old isOverlapping if exists
content = content.replace(/const isOverlapping = [\s\S]*?};\n\n/, '');

// 2. New 3-month state logic
const dateLogicOld = `    const daysInMonth = new Date(year, month + 1, 0).getDate()
    const days = Array.from({ length: daysInMonth }, (_, i) => i + 1)

    const isToday = (day: number) => {
        const now = new Date()
        return day === now.getDate() && month === now.getMonth() && year === now.getFullYear()
    }

    const isWeekend = (day: number) => {
        const d = new Date(year, month, day)
        return d.getDay() === 0 || d.getDay() === 6
    }

    const getDayName = (day: number) => {
        const d = new Date(year, month, day)
        return DAY_NAMES[d.getDay()]
    }`;

const dateLogicNew = `    const prevMonthDate = new Date(year, month - 1, 1);
    const currentMonthDate = new Date(year, month, 1);
    const nextMonthDate = new Date(year, month + 1, 1);

    const monthsData = useMemo(() => [prevMonthDate, currentMonthDate, nextMonthDate].map(d => ({
        year: d.getFullYear(),
        month: d.getMonth(),
        days: new Date(d.getFullYear(), d.getMonth() + 1, 0).getDate(),
        name: \`Tháng \${d.getMonth() + 1} \${d.getFullYear()}\`
    })), [year, month]);

    const totalDays = monthsData.reduce((sum, m) => sum + m.days, 0);

    const flatDays = useMemo(() => {
        const arr = [];
        monthsData.forEach(m => {
            for (let i = 1; i <= m.days; i++) {
                arr.push({ day: i, month: m.month, year: m.year });
            }
        });
        return arr;
    }, [monthsData]);

    const timelineStart = new Date(year, month - 1, 1);
    const timelineEnd = new Date(year, month + 2, 0, 23, 59, 59);

    const getDayIndex = (date) => {
        let index = 0;
        for (let i = 0; i < monthsData.length; i++) {
            const m = monthsData[i];
            if (date.getFullYear() === m.year && date.getMonth() === m.month) {
                return index + date.getDate() - 1;
            }
            if (date > new Date(m.year, m.month, m.days, 23, 59, 59)) {
                index += m.days;
            }
        }
        return index;
    };

    const getTimelineRange = (start, end) => {
        if (!start || !end) return null;
        if (end < timelineStart || start > timelineEnd) return null;

        let startIndex = 0;
        if (start >= timelineStart) {
            startIndex = getDayIndex(start);
        }

        let endIndex = totalDays - 1;
        if (end <= timelineEnd) {
            endIndex = getDayIndex(end);
        }

        return { startIndex, duration: Math.max(1, endIndex - startIndex + 1) };
    };

    const isToday = (day: number, m: number, y: number) => {
        const now = new Date()
        return day === now.getDate() && m === now.getMonth() && y === now.getFullYear()
    }

    const isWeekend = (day: number, m: number, y: number) => {
        const d = new Date(y, m, day)
        return d.getDay() === 0 || d.getDay() === 6
    }

    const getDayOfWeek = (y: number, m: number, d: number) => {
        return DAY_NAMES[new Date(y, m, d).getDay()]
    }`;

content = content.replace(dateLogicOld, dateLogicNew);

// 3. Replace ganttItems
// I will find the ganttItems useMemo block
const ganttItemsRegex = /const ganttItems = useMemo\(\(\) => \{[\s\S]*?\}\), \[updatedProjects, expandedProjects, expandedPhases, tasks, year, month\]\)/;
// Wait, the dependencies might be different, let's just find the start and end of it.
const ganttItemsStart = 'const ganttItems = useMemo(() => {';
const ganttItemsEndIndex = content.indexOf('const toggleProject = (projectId: string) => {');

if (ganttItemsEndIndex !== -1) {
    const ganttItemsOld = content.substring(content.indexOf(ganttItemsStart), ganttItemsEndIndex).trim();

    const ganttItemsNew = `const ganttItems = useMemo(() => {
        let items: any[] = []

        updatedProjects.forEach(p => {
            const startDate = p.start_date || p.computed_start
            const endDate = p.end_date || p.computed_end || p.start_date

            const start = startDate ? new Date(startDate) : null;
            const end = endDate ? new Date(endDate) : null;

            const range = getTimelineRange(start, end);

            const pTasksForPct = tasks.filter(t => t.project_id === p.id);
            let projectPct = 0;
            if (pTasksForPct.length > 0) {
                const totalPct = pTasksForPct.reduce((sum, t) => sum + (t.completion_pct || 0), 0);
                projectPct = Math.round(totalPct / pTasksForPct.length);
            }

            items.push({
                id: p.id,
                name: p.name,
                startIndex: range?.startIndex ?? null,
                duration: range?.duration ?? 0,
                color: 'bg-red-500',
                isProject: true,
                isExpanded: expandedProjects.has(p.id),
                taskCount: tasks.filter(t => t.project_id === p.id && !t.parent_id).length,
                startDate: startDate,
                endDate: endDate,
                type: 'project',
                projectCode: p.project_code,
                projectPct: projectPct
            })

            if (expandedProjects.has(p.id)) {
                let kpiState: any = null;
                try {
                    if (p.other_info) {
                        const info = JSON.parse(p.other_info);
                        if (info.kpiData) kpiState = info.kpiData;
                    }
                } catch(e) {}

                let currentPhaseStartDate = p.start_date ? new Date(p.start_date) : new Date();
                const phasesToRender = [...DEFAULT_PHASES];

                phasesToRender.forEach((phaseDef) => {
                    const phaseKey = phaseDef.key;
                    let phaseTasks = tasks.filter(t => t.project_id === p.id && (kpiState?.taskPhaseMap?.[t.id] || detectPhase(t)) === phaseKey);

                    if (phaseKey === '_unassigned' && phaseTasks.length === 0) return;

                    const phaseState = kpiState?.phases?.[phaseKey] || { days_used: 0, days_estimated: 0 };
                    const expectedDays = phaseKey === '_unassigned' ? 0 : (phaseState.days_estimated || 0);
                    const hasExpectedTimeline = expectedDays > 0;
                    
                    if (!hasExpectedTimeline && phaseTasks.length === 0) return;

                    const phaseEndDate = hasExpectedTimeline ? addWorkingDays(currentPhaseStartDate, expectedDays) : currentPhaseStartDate;
                    const pRange = hasExpectedTimeline ? getTimelineRange(currentPhaseStartDate, phaseEndDate) : null;

                    let phasePct = 0;
                    if (phaseTasks.length > 0) {
                        const totalPct = phaseTasks.reduce((sum, t) => sum + (t.completion_pct || 0), 0);
                        phasePct = Math.round(totalPct / phaseTasks.length);
                    }

                    const fakePhaseId = \`phase_\${p.id}_\${phaseKey}\`;
                    
                    items.push({
                        id: fakePhaseId,
                        phaseKey: phaseKey,
                        name: phaseDef.name,
                        startIndex: pRange?.startIndex ?? null,
                        duration: pRange?.duration ?? 0,
                        color: phasePct === 100 ? 'bg-orange-300' : 'bg-orange-500',
                        isProject: false,
                        isPhase: true,
                        isExpanded: expandedPhases.has(fakePhaseId),
                        task: { completion_pct: phasePct, id: fakePhaseId, project_id: p.id },
                        startDate: hasExpectedTimeline ? currentPhaseStartDate.toISOString() : null,
                        endDate: hasExpectedTimeline ? phaseEndDate.toISOString() : null,
                        type: 'phase',
                        projectCode: p.project_code
                    });

                    if (hasExpectedTimeline) {
                        currentPhaseStartDate = getNextWorkingDay(phaseEndDate);
                    }

                    if (expandedPhases.has(fakePhaseId)) {
                        phaseTasks.sort((a, b) => (a.task_code || '').localeCompare(b.task_code || '', undefined, { numeric: true, sensitivity: 'base' }));
                        
                        phaseTasks.forEach(t => {
                            const tStart = t.start_date ? new Date(t.start_date) : null;
                            const tEnd = t.due_date ? new Date(t.due_date) : null;
                            const tRange = getTimelineRange(tStart, tEnd);
                            const tIsCompleted = t.status?.includes('Hoàn thành');

                            items.push({
                                id: t.id,
                                name: t.name || t.task_code,
                                startIndex: tRange?.startIndex ?? null,
                                duration: tRange?.duration ?? 0,
                                color: tIsCompleted ? 'bg-slate-300' : 'bg-blue-500',
                                isProject: false,
                                isPhase: false,
                                task: t,
                                startDate: t.start_date || t.due_date,
                                endDate: t.due_date || t.start_date,
                                type: 'task',
                            });
                        });
                    }
                });
            }
        });

        return items
    }, [updatedProjects, expandedProjects, expandedPhases, tasks, flatDays]);

    `;

    content = content.replace(ganttItemsOld, ganttItemsNew);
} else {
    console.log("Could not find ganttItems block end.");
}

fs.writeFileSync(ganttPath, content);
console.log('Phase 1 replacement complete.');
