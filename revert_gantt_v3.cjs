const fs = require('fs');
const path = 'src/pages/gantt/Gantt.tsx';
let c = fs.readFileSync(path, 'utf8');

// Update getTimelineRange
c = c.replace(/const getTimelineRange = \([\s\S]*?duration: Math.max\(1, endIndex - startIndex \+ 1\) \};\n    \};/g, `
    const getTimelineRange = (start: Date | null, end: Date | null) => {
        if (!start || !end) return null;
        
        const monthStart = new Date(year, month, 1, 0, 0, 0);
        const monthEnd = new Date(year, month, daysInMonth, 23, 59, 59);

        if (end < monthStart || start > monthEnd) return null;

        const startDay = (start.getFullYear() === year && start.getMonth() === month) ? start.getDate() : 1;
        const endDay = (end.getFullYear() === year && end.getMonth() === month) ? end.getDate() : daysInMonth;

        return { startIndex: startDay - 1, duration: Math.max(1, endDay - startDay + 1) };
    };
`);

c = c.replace('const totalDays = flatDays.length;', 'const totalDays = daysInMonth;');
c = c.replace('const todayIndex = getDayIndex(new Date());', 'const todayIndex = new Date().getDate() - 1;');

// Modify ganttItems to include actualStartIndex and actualDuration
c = c.replace(/startIndex: range\?\.startIndex \?\? null,\n                duration: range\?\.duration \?\? 0,/g, `startIndex: range?.startIndex ?? null,
                duration: range?.duration ?? 0,
                actualStartIndex: getTimelineRange(p.computed_start ? parseDateStr(p.computed_start) : null, p.computed_end ? parseDateStr(p.computed_end) : null)?.startIndex ?? null,
                actualDuration: getTimelineRange(p.computed_start ? parseDateStr(p.computed_start) : null, p.computed_end ? parseDateStr(p.computed_end) : null)?.duration ?? 0,`);

// Replace the dual-pane grid DOM with Unified Grid DOM
const oldGridStart = c.indexOf('{/* Desktop Gantt Grid Container (Dual-Pane) */}');
const oldGridEnd = c.indexOf('{/* Mobile List Timeline View */}');

if (oldGridStart !== -1 && oldGridEnd !== -1) {
    const newGrid = `{/* Desktop Gantt Grid Container (Unified Sticky) */}
            <div className="hidden md:flex flex-1 bg-white border border-slate-200 rounded-3xl shadow-sm overflow-hidden relative">
                <div 
                    className="flex-1 overflow-auto flex flex-col" 
                    style={{ height: '100%' }}
                    ref={scrollContainerRef}
                >
                    <div className="min-w-max flex flex-col relative">
                        {/* Unified Header */}
                        <div className="flex sticky top-0 z-40 bg-white h-[66px] w-max">
                            {/* Left Header - Sticky Left */}
                            <div className="sticky left-0 z-50 flex bg-slate-50 w-[420px] border-b border-r border-slate-200 shadow-[2px_0_5px_-2px_rgba(0,0,0,0.1)]">
                                <div className="w-[200px] px-3 py-4 text-[10px] font-bold text-slate-500 uppercase tracking-wider flex-shrink-0 border-r border-slate-200 flex items-center bg-slate-50">
                                    MÔ TẢ
                                </div>
                                <div className="w-[70px] px-1 py-4 text-[10px] font-bold text-slate-500 uppercase tracking-wider flex-shrink-0 border-r border-slate-200 flex items-center justify-center text-center bg-slate-50">
                                    BẮT ĐẦU
                                </div>
                                <div className="w-[70px] px-1 py-4 text-[10px] font-bold text-slate-500 uppercase tracking-wider flex-shrink-0 border-r border-slate-200 flex items-center justify-center text-center bg-slate-50">
                                    KẾT THÚC
                                </div>
                                <div className="w-[40px] px-1 py-4 text-[10px] font-bold text-slate-500 uppercase tracking-wider flex-shrink-0 border-r border-slate-200 flex items-center justify-center bg-slate-50">
                                    NGÀY
                                </div>
                                <div className="w-[40px] px-1 py-4 text-[10px] font-bold text-slate-500 uppercase tracking-wider flex-shrink-0 flex items-center justify-center bg-slate-50">
                                    TIẾN %
                                </div>
                            </div>
                            
                            {/* Right Header */}
                            <div className="flex flex-col border-b border-slate-200">
                                {/* Month Label */}
                                <div className="flex items-center justify-center font-bold text-slate-700 text-xs border-b border-slate-200 bg-slate-100" style={{ height: '25px', width: \`\${totalDays * cellWidth}px\` }}>
                                    Tháng {month + 1} 2026
                                </div>
                                {/* Days Label */}
                                <div className="relative flex-1" style={{ width: \`\${totalDays * cellWidth}px\` }}>
                                    {days.map((d, idx) => (
                                        <div key={idx} className={\`absolute top-0 bottom-0 text-center flex flex-col items-center justify-center border-r border-slate-100 transition-colors \${isToday(d) ? 'bg-orange-500' : isWeekend(d) ? 'bg-slate-100/50' : 'bg-blue-50/50'}\`} style={{ left: \`\${idx * cellWidth}px\`, width: \`\${cellWidth}px\` }}>
                                            <div className={\`text-[11px] font-bold \${isToday(d) ? 'text-white' : 'text-slate-700'}\`}>{d}</div>
                                            <div className={\`text-[8px] font-bold uppercase tracking-tighter \${isToday(d) ? 'text-white/80' : isWeekend(d) ? 'text-red-400' : 'text-blue-400'}\`}>{getDayName(d)}</div>
                                        </div>
                                    ))}
                                </div>
                            </div>
                        </div>

                        {/* Unified Rows */}
                        <div className="flex flex-col pb-24 w-max">
                            {ganttItems.length === 0 ? (
                                <div className="h-[200px]"></div>
                            ) : (
                                ganttItems.map((item) => {
                                    const sDate = parseDateStr(item.startDate); const formattedStart = sDate ? format(sDate, 'dd/MM/yyyy') : '';
                                    const eDate = parseDateStr(item.endDate); const formattedEnd = eDate ? format(eDate, 'dd/MM/yyyy') : '';
                                    const tDays = (sDate && eDate) ? Math.max(1, Math.round((eDate.getTime() - sDate.getTime()) / (1000 * 60 * 60 * 24)) + 1) : 0;
                                    const progressAmount = item.task?.completion_pct || 0;

                                    return (
                                        <div key={item.id} className="flex h-9 border-b border-slate-200 hover:bg-slate-50 transition-colors group/row w-max">
                                            {/* Left Cells - Sticky Left */}
                                            <div className={\`sticky left-0 z-30 flex w-[420px] border-r border-slate-200 shadow-[2px_0_5px_-2px_rgba(0,0,0,0.1)] \${item.type === 'project' ? 'bg-[#e0e4db]' : item.type === 'phase' ? 'bg-slate-100' : 'bg-white'}\`}>
                                                <div className="w-[200px] px-3 py-2 border-r border-slate-200 flex flex-col justify-center overflow-hidden">
                                                    <div className="flex items-center gap-2">
                                                        {item.type === 'project' && (
                                                            <button onClick={() => toggleProject(item.id)} className="w-4 h-4 flex items-center justify-center hover:bg-slate-200 rounded text-slate-500 flex-shrink-0">
                                                                {expandedProjects.has(item.id) ? <ChevronDown size={14} /> : <ChevronRight size={14} />}
                                                            </button>
                                                        )}
                                                        {item.type === 'phase' && <div className="w-4 h-4 flex-shrink-0" />}
                                                        <span 
                                                            className={\`truncate text-[11px] \${item.type === 'project' ? 'font-bold text-slate-800' : 'font-medium text-slate-700'} hover:text-blue-600 cursor-pointer\`}
                                                            onClick={() => { setTaskPanelMode(item.type === 'project' ? 'project' : 'phase'); setSelectedItem(item); }}
                                                        >
                                                            {item.name}
                                                        </span>
                                                    </div>
                                                </div>

                                                <div className={\`w-[70px] px-1 py-2 border-r border-slate-200 flex items-center justify-center text-center text-[10px] \${item.type === 'project' ? 'font-bold text-slate-800' : 'text-slate-600 hover:bg-slate-100/50 cursor-pointer'}\`}>
                                                    {formattedStart || '—'}
                                                </div>

                                                <div className={\`w-[70px] px-1 py-2 border-r border-slate-200 flex items-center justify-center text-center text-[10px] \${item.type === 'project' ? 'font-bold text-slate-800' : 'text-slate-600 hover:bg-slate-100/50 cursor-pointer'}\`}>
                                                    {formattedEnd || '—'}
                                                </div>

                                                <div className={\`w-[40px] px-1 py-2 border-r border-slate-200 flex items-center justify-center text-[10px] \${item.type === 'project' ? 'font-bold text-slate-800' : 'text-slate-600'}\`}>
                                                    {tDays > 0 ? tDays : '-'}
                                                </div>

                                                <div className={\`w-[40px] px-1 py-2 flex items-center justify-center text-[10px] \${item.type === 'project' ? 'font-bold text-slate-800' : 'text-slate-600'}\`}>
                                                    {item.type !== 'project' ? \`\${progressAmount}%\` : \`\${item.projectPct || 0}%\`}
                                                </div>
                                            </div>
                                            
                                            {/* Right Cells */}
                                            <div className="relative" style={{ width: \`\${totalDays * cellWidth}px\` }}>
                                                {/* Background Grid */}
                                                {days.map((d, idx) => (
                                                    <div 
                                                        key={\`bg-\${idx}\`} 
                                                        className={\`absolute top-0 bottom-0 border-r border-slate-100/50 pointer-events-none \${isWeekend(d) ? 'bg-slate-50/50' : ''}\`} 
                                                        style={{ left: \`\${idx * cellWidth}px\`, width: \`\${cellWidth}px\` }} 
                                                    />
                                                ))}

                                                {/* Parent Project Outline */}
                                                {item.isPhase && (
                                                    <div
                                                        className="absolute top-[2px] bottom-[2px] rounded-sm pointer-events-none opacity-20 border border-slate-400"
                                                        style={{
                                                            left: \`\${(ganttItems.find(p => p.id === item.task?.project_id)?.actualStartIndex ?? 0) * cellWidth}px\`,
                                                            width: \`\${(ganttItems.find(p => p.id === item.task?.project_id)?.actualDuration ?? 0) * cellWidth}px\`,
                                                            backgroundColor: 'transparent'
                                                        }}
                                                    />
                                                )}

                                                {/* Gray Expected Timeline Bar (Only for projects) */}
                                                {item.type === 'project' && item.startIndex !== null && item.duration > 0 && (
                                                    <div
                                                        className="absolute top-2.5 bottom-2.5 rounded-sm bg-slate-300 shadow-inner"
                                                        style={{ left: \`\${item.startIndex * cellWidth}px\`, width: \`\${item.duration * cellWidth}px\` }}
                                                        title="Timeline dự kiến"
                                                    />
                                                )}

                                                {/* Colored Timeline Bar */}
                                                {item.type === 'project' && item.actualStartIndex !== null && item.actualDuration > 0 && (
                                                    <div
                                                        className="absolute top-1.5 bottom-1.5 rounded-sm shadow-sm flex items-center transition-colors bg-[#4a80bc] border border-[#3a689b] opacity-80"
                                                        style={{ left: \`\${item.actualStartIndex * cellWidth}px\`, width: \`\${item.actualDuration * cellWidth}px\` }}
                                                        title="Timeline thực tế"
                                                    />
                                                )}

                                                {/* Default Colored Timeline Bar (for phases) */}
                                                {item.type !== 'project' && item.startIndex !== null && item.duration > 0 && (
                                                    <div
                                                        className={\`absolute top-1.5 bottom-1.5 rounded-sm shadow-sm flex items-center px-2 cursor-pointer transition-all hover:brightness-95 hover:shadow-md border \${item.task?.status?.includes('Hoàn thành') ? 'bg-emerald-500 border-emerald-600' : 'bg-[#5da0ea] border-[#4b82c3]'}\`}
                                                        style={{ left: \`\${item.startIndex * cellWidth}px\`, width: \`\${item.duration * cellWidth}px\` }}
                                                        onClick={(e) => { e.stopPropagation(); setTaskPanelMode('phase'); setSelectedItem(item); }}
                                                    />
                                                )}
                                                
                                                {/* Today Line inside Row */}
                                                {isTodayRow() && (
                                                    <div 
                                                        className="absolute top-0 bottom-0 border-l-2 border-orange-500/50 pointer-events-none z-10"
                                                        style={{ left: \`\${(new Date().getDate() - 1) * cellWidth + (cellWidth / 2)}px\` }}
                                                    />
                                                )}
                                            </div>
                                        </div>
                                    );
                                })
                            )}
                        </div>
                    </div>
                </div>
            </div>
`;
    c = c.substring(0, oldGridStart) + newGrid + c.substring(oldGridEnd);
    fs.writeFileSync(path, c);
    console.log('Successfully replaced grid layout and added expected timeline');
} else {
    console.log('Failed to find markers:', oldGridStart, oldGridEnd);
}
