const fs = require('fs');

const path = 'src/pages/construction/ProjectManagement.tsx';
let content = fs.readFileSync(path, 'utf8');

// 1. Update grouped logic to use workflowStages
content = content.replace(
  `  const grouped = useMemo(() =>
    tasks.reduce((acc, t) => {
      const cat = t.category || 'KHÁC';
      if (!acc[cat]) acc[cat] = [];
      acc[cat].push(t);
      return acc;
    }, {} as Record<string, CTask[]>)
  , [tasks]);`,
  `  const grouped = useMemo(() => {
    const acc: Record<string, CTask[]> = {};
    tasks.forEach(t => {
      const cat = t.category || 'KHÁC';
      if (!acc[cat]) acc[cat] = [];
      acc[cat].push(t);
    });
    const orderedGrouped: Record<string, CTask[]> = {};
    if (workflowStages && workflowStages.length > 0) {
      workflowStages.forEach(stage => {
        if (acc[stage.name]) {
          orderedGrouped[stage.name] = acc[stage.name];
          delete acc[stage.name];
        }
      });
    }
    Object.keys(acc).forEach(key => {
      orderedGrouped[key] = acc[key];
    });
    return orderedGrouped;
  }, [tasks, workflowStages]);`
);

// 2. Change STT logic
// find: const handleStartChange = (task: CTask, val: string) => {
// replace: const handleStartChange = (task: CTask, val: string, isFirst: boolean = false) => {
content = content.replace(
  `  const handleStartChange = (task: CTask, val: string) => {`,
  `  const handleStartChange = (task: CTask, val: string, isFirst: boolean = false) => {`
);

// find: onUpdateTask(task.id, {
// ...
//     });
// replace: add onUpdateProjectDates
content = content.replace(
  `    onUpdateTask(task.id, {
      plannedStart: format(ns, 'yyyy-MM-dd'), startDate: format(ns, 'yyyy-MM-dd'),
      plannedEnd: format(ne, 'yyyy-MM-dd'),   endDate: format(ne, 'yyyy-MM-dd'),
    });
  };`,
  `    onUpdateTask(task.id, {
      plannedStart: format(ns, 'yyyy-MM-dd'), startDate: format(ns, 'yyyy-MM-dd'),
      plannedEnd: format(ne, 'yyyy-MM-dd'),   endDate: format(ne, 'yyyy-MM-dd'),
    });
    if (isFirst && onUpdateProjectDates) {
      onUpdateProjectDates(format(ns, 'yyyy-MM-dd'), projectEndDate || undefined);
    }
  };`
);

// Add useEffect for auto sync
content = content.replace(
  `  const [dragOverId, setDragOverId] = useState<string | null>(null);`,
  `  const [dragOverId, setDragOverId] = useState<string | null>(null);

  useEffect(() => {
    if (!readOnly && !projectStartDate && Object.keys(grouped).length > 0) {
      const flatTasks = Object.values(grouped).flat();
      if (flatTasks.length > 0) {
        const firstTask = flatTasks[0];
        const ts = getTaskStart(firstTask);
        if (ts && onUpdateProjectDates) {
          onUpdateProjectDates(format(ts, 'yyyy-MM-dd'), projectEndDate || undefined);
        }
      }
    }
  }, [projectStartDate, grouped, readOnly, onUpdateProjectDates, projectEndDate]);`
);

// Column layouts
content = content.replace(
  `  const CW = { stt: 32, name: 244, start: 96, dur: 48, prog: 80, action: readOnly ? 0 : 40 };
  const CL = {
    stt: 0,
    name: CW.stt,
    start: CW.stt + CW.name,
    dur: CW.stt + CW.name + CW.start,
    prog: CW.stt + CW.name + CW.start + CW.dur,
    action: CW.stt + CW.name + CW.start + CW.dur + CW.prog,
  };`,
  `  const CW = { stt: 32, name: 244, start: 96, dur: 48, end: 96, prog: 80, action: readOnly ? 0 : 40 };
  const CL = {
    stt: 0,
    name: CW.stt,
    start: CW.stt + CW.name,
    dur: CW.stt + CW.name + CW.start,
    end: CW.stt + CW.name + CW.start + CW.dur,
    prog: CW.stt + CW.name + CW.start + CW.dur + CW.end,
    action: CW.stt + CW.name + CW.start + CW.dur + CW.end + CW.prog,
  };`
);

// Header row
content = content.replace(
  `<th rowSpan={2} className="sticky max-md:!static z-50 bg-slate-700 border-r border-slate-600 text-center font-bold" style={{ left: CL.dur, width: CW.dur, minWidth: CW.dur }}>NGÀY</th>
            <th rowSpan={2} className="sticky max-md:!static z-50 bg-slate-700 border-r border-slate-600 text-center font-bold print:hidden" style={{ left: CL.prog, width: CW.prog, minWidth: CW.prog, boxShadow: readOnly ? '3px 0 8px -2px rgba(0,0,0,0.15)' : 'none' }}>TIẾN ĐỘ</th>`,
  `<th rowSpan={2} className="sticky max-md:!static z-50 bg-slate-700 border-r border-slate-600 text-center font-bold" style={{ left: CL.dur, width: CW.dur, minWidth: CW.dur }}>NGÀY</th>
            <th rowSpan={2} className="sticky max-md:!static z-50 bg-slate-700 border-r border-slate-600 text-center font-bold" style={{ left: CL.end, width: CW.end, minWidth: CW.end }}>KẾT THÚC</th>
            <th rowSpan={2} className="sticky max-md:!static z-50 bg-slate-700 border-r border-slate-600 text-center font-bold print:hidden" style={{ left: CL.prog, width: CW.prog, minWidth: CW.prog, boxShadow: readOnly ? '3px 0 8px -2px rgba(0,0,0,0.15)' : 'none' }}>TIẾN ĐỘ</th>`
);

// Category header STT
content = content.replace(
  `<td className="sticky z-30 bg-slate-100 border-r border-slate-200 text-center text-slate-600 font-bold" style={{ left: CL.stt }}>{ci + 1}</td>
                <td className="sticky z-30 bg-slate-100 px-2 text-slate-700 font-bold text-xs uppercase tracking-wide max-md:!w-[140px] max-md:!min-w-[140px] overflow-hidden" colSpan={readOnly ? 4 : 5}`,
  `<td className="sticky z-30 bg-slate-100 border-r border-slate-200 text-center text-slate-600 font-bold" style={{ left: CL.stt }}>{String.fromCharCode(65 + ci)}</td>
                <td className="sticky z-30 bg-slate-100 px-2 text-slate-700 font-bold text-xs uppercase tracking-wide max-md:!w-[140px] max-md:!min-w-[140px] overflow-hidden" colSpan={readOnly ? 5 : 6}`
);

// Add master row BEFORE category loop
const tbodyStart = `<tbody>`;
const masterRow = `          <tr className="h-10 bg-[#e0f2fe] border-b-2 border-[#bae6fd]">
            <td className="sticky z-30 bg-[#e0f2fe] border-r border-slate-200 text-center text-sky-800 font-black text-xs" style={{ left: CL.stt }}>★</td>
            <td className="sticky z-30 bg-[#e0f2fe] border-r border-slate-200 px-2 text-sky-900 font-black text-xs tracking-wider" style={{ left: CL.name, width: CW.name, minWidth: CW.name, boxShadow: '3px 0 8px -2px rgba(0,0,0,0.05)' }}>
              TIẾN ĐỘ THI CÔNG
            </td>
            <td className="sticky max-md:!static z-30 bg-[#e0f2fe] border-r border-slate-200 p-0" style={{ left: CL.start }}>
              <input type="date" disabled={readOnly}
                className="w-full h-10 text-center bg-transparent outline-none cursor-pointer text-sky-900 font-bold disabled:opacity-80 hover:bg-sky-100 focus:bg-sky-100"
                value={projectStartDate ? format(parseISO(projectStartDate), 'yyyy-MM-dd') : ''}
                onChange={e => { 
                  const newStart = e.target.value;
                  if (onUpdateProjectDates) onUpdateProjectDates(newStart || undefined, projectEndDate || undefined);
                  if (newStart && !readOnly) {
                    const flatTasks = Object.values(grouped).flat();
                    if (flatTasks.length > 0) {
                      const firstTask = flatTasks[0];
                      const ns = parseISO(newStart);
                      const os = getTaskStart(firstTask);
                      const oe = getTaskEnd(firstTask);
                      const dur = os && oe ? differenceInDays(oe, os) : (firstTask.duration || firstTask.days || 7) - 1;
                      const ne = addDays(ns, dur);
                      onUpdateTask(firstTask.id, {
                        plannedStart: format(ns, 'yyyy-MM-dd'), startDate: format(ns, 'yyyy-MM-dd'),
                        plannedEnd: format(ne, 'yyyy-MM-dd'), endDate: format(ne, 'yyyy-MM-dd'),
                      });
                    }
                  }
                }} />
            </td>
            <td className="sticky max-md:!static z-30 bg-[#e0f2fe] border-r border-slate-200 p-0" style={{ left: CL.dur }}>
              <div className="w-full h-10 flex items-center justify-center text-sky-900 font-bold">
                --
              </div>
            </td>
            <td className="sticky max-md:!static z-30 bg-[#e0f2fe] border-r border-slate-200 p-0" style={{ left: CL.end }}>
              <input type="date" disabled={readOnly}
                className="w-full h-10 text-center bg-transparent outline-none cursor-pointer text-sky-900 font-bold disabled:opacity-80 hover:bg-sky-100 focus:bg-sky-100"
                value={projectEndDate ? format(parseISO(projectEndDate), 'yyyy-MM-dd') : ''}
                onChange={e => { if (onUpdateProjectDates) onUpdateProjectDates(projectStartDate || undefined, e.target.value || undefined) }} />
            </td>
            <td className="sticky max-md:!static z-30 bg-[#e0f2fe] text-center px-1 print:hidden" style={{ left: CL.prog, boxShadow: readOnly ? '3px 0 8px -2px rgba(0,0,0,0.05)' : 'none' }}>
              <div className="w-10 h-2 bg-sky-200 rounded-full overflow-hidden mx-auto">
                <div className="h-full rounded-full bg-sky-500" style={{ width: '100%' }} />
              </div>
            </td>
            {!readOnly && (
               <td className="sticky max-md:!static z-30 bg-[#e0f2fe] border-r border-slate-200" style={{ left: CL.action, boxShadow: '3px 0 8px -2px rgba(0,0,0,0.05)' }}></td>
            )}
            {days.map((day, i) => (
              <td key={i} className="border-r border-[#bae6fd] bg-[#f0f9ff]/50" />
            ))}
          </tr>`;

content = content.replace(tbodyStart, tbodyStart + '\n' + masterRow);

// Task start input
content = content.replace(
  `<input type="date" className="w-full h-9 text-center bg-transparent outline-none hover:bg-indigo-50 focus:bg-indigo-50 cursor-pointer" value={ts ? format(ts, 'yyyy-MM-dd') : ''} onChange={e => { e.stopPropagation(); handleStartChange(task, e.target.value); }} onClick={e => e.stopPropagation()} />`,
  `<input type="date" className="w-full h-9 text-center bg-transparent outline-none hover:bg-indigo-50 focus:bg-indigo-50 cursor-pointer" value={ts ? format(ts, 'yyyy-MM-dd') : ''} onChange={e => { e.stopPropagation(); handleStartChange(task, e.target.value, stt === 1); }} onClick={e => e.stopPropagation()} />`
);

// Add task end cell
content = content.replace(
  `                    <td className={\`sticky max-md:!static z-30 \${cellBg} group-hover:bg-slate-50 border-r border-slate-100 p-0\`} style={{ left: CL.dur }}>
                      {readOnly ? (
                        <div className="w-full h-9 flex items-center justify-center text-slate-600">{dur || '--'}</div>
                      ) : (
                        <input type="number" className="w-full h-9 text-center bg-transparent outline-none hover:bg-indigo-50 focus:bg-indigo-50 cursor-pointer" value={dur || ''} min={1} onChange={e => { e.stopPropagation(); handleDurChange(task, e.target.value); }} onClick={e => e.stopPropagation()} />
                      )}
                    </td>`,
  `                    <td className={\`sticky max-md:!static z-30 \${cellBg} group-hover:bg-slate-50 border-r border-slate-100 p-0\`} style={{ left: CL.dur }}>
                      {readOnly ? (
                        <div className="w-full h-9 flex items-center justify-center text-slate-600">{dur || '--'}</div>
                      ) : (
                        <input type="number" className="w-full h-9 text-center bg-transparent outline-none hover:bg-indigo-50 focus:bg-indigo-50 cursor-pointer" value={dur || ''} min={1} onChange={e => { e.stopPropagation(); handleDurChange(task, e.target.value); }} onClick={e => e.stopPropagation()} />
                      )}
                    </td>
                    <td className={\`sticky max-md:!static z-30 \${cellBg} group-hover:bg-slate-50 border-r border-slate-100 p-0\`} style={{ left: CL.end }}>
                      <div className="w-full h-9 flex items-center justify-center text-slate-600">{te ? format(te, 'dd/MM/yy') : '--'}</div>
                    </td>`
);


fs.writeFileSync(path, content, 'utf8');
console.log('Patched correctly!');
